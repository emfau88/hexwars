import { GameState } from '../src/core/GameState';
import { Owner } from '../src/core/types';
import { pathToFileURL } from 'node:url';
import { actDoomstack, doomstackPositionFor, shortestPlayableRoute } from './doomstack';

export type GuardianProductionStrategy = 'direct' | 'west-guardian' | 'east-guardian';
export interface GuardianProductionResult {
  strategy: GuardianProductionStrategy;
  result: string | null;
  seconds: number;
  captures: number;
  guardianStatus: string;
  shieldRemaining: number;
  playerForce: number;
  enemyForce: number;
}

export function runGuardianProductionRoute(strategy: GuardianProductionStrategy): GuardianProductionResult {
  const game = new GameState(); game.start(4, doomstackPositionFor);
  game.opponentEnabled = false;
  const playerHq = game.structures.find(({ id }) => id === 'player-hq')!;
  const enemyHq = game.structures.find(({ id }) => id === 'enemy-hq')!;
  const start = game.hexAt(playerHq.col, playerHq.row)!; const goal = game.hexAt(enemyHq.col, enemyHq.row)!;
  const guardianId = strategy === 'west-guardian' ? 'enemy-guardian-west' : strategy === 'east-guardian' ? 'enemy-guardian-east' : null;
  const guardian = guardianId ? game.structures.find(({ id }) => id === guardianId)! : null;
  const guardianHex = guardian ? game.hexAt(guardian.col, guardian.row)! : null;
  const route = guardianHex
    ? [...shortestPlayableRoute(game, start, guardianHex), ...shortestPlayableRoute(game, guardianHex, goal).slice(1)]
    : shortestPlayableRoute(game, start, goal);
  let nextDecision = 1.2;
  while (game.running && game.elapsed < 300) {
    game.update(.05); game.drainEvents();
    if (game.elapsed >= nextDecision) { actDoomstack(game, route); nextDecision += 1.2; }
  }
  const shield = game.shieldFor('enemy-hq');
  return {
    strategy, result: game.result, seconds: Number(game.elapsed.toFixed(1)), captures: game.captures,
    guardianStatus: guardian?.status ?? 'n/a', shieldRemaining: Number(shield.current.toFixed(1)),
    playerForce: game.forceCount(Owner.Player), enemyForce: game.forceCount(Owner.Enemy),
  };
}

export function runGuardianAutoplay(maxSeconds = 300): {
  result: string | null;
  seconds: number;
  captures: number;
  guardiansCaptured: number;
  shieldRemaining: number;
  playerForce: number;
  enemyForce: number;
} {
  const game = new GameState(); game.start(4, doomstackPositionFor); game.autoplay = true;
  while (game.running && game.elapsed < maxSeconds) game.update(.05);
  return {
    result: game.result,
    seconds: Number(game.elapsed.toFixed(1)),
    captures: game.captures,
    guardiansCaptured: game.structures.filter(({ type, owner }) => type === 'guardian' && owner === Owner.Player).length,
    shieldRemaining: Number(game.shieldFor('enemy-hq').current.toFixed(1)),
    playerForce: game.forceCount(Owner.Player),
    enemyForce: game.forceCount(Owner.Enemy),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.table((['direct', 'west-guardian', 'east-guardian'] as const).map(runGuardianProductionRoute));
  console.table([runGuardianAutoplay()]);
}
