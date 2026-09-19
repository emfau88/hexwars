import { pathToFileURL } from 'node:url';
import { GameState } from '../src/core/GameState';
import { Owner } from '../src/core/types';
import { actDoomstack, doomstackPositionFor, shortestPlayableRoute } from './doomstack';

export type SplitFieldRoute = 'west-guardian' | 'east-direct';

export function runSplitFieldRoute(routeName: SplitFieldRoute) {
  const game = new GameState(); game.start(5, doomstackPositionFor);
  game.opponentEnabled = false;
  const playerHq = game.structures.find(({ id }) => id === 'player-hq')!;
  const enemyHq = game.structures.find(({ id }) => id === 'enemy-hq')!;
  const start = game.hexAt(playerHq.col, playerHq.row)!;
  const goal = game.hexAt(enemyHq.col, enemyHq.row)!;
  const waypoint = routeName === 'west-guardian' ? game.hexAt(2, 4) : game.hexAt(4, 5);
  const route = waypoint
    ? [...shortestPlayableRoute(game, start, waypoint), ...shortestPlayableRoute(game, waypoint, goal).slice(1)]
    : shortestPlayableRoute(game, start, goal);
  let nextDecision = 1.2;
  while (game.running && game.elapsed < 300) {
    game.update(.05); game.drainEvents();
    if (game.elapsed >= nextDecision) { actDoomstack(game, route); nextDecision += 1.2; }
  }
  return {
    route: routeName,
    path: route.map(({ col, row }) => `${col},${row}`).join(' → '),
    result: game.result,
    seconds: Number(game.elapsed.toFixed(1)),
    guardian: game.structures.find(({ type }) => type === 'guardian')?.status,
    shieldRemaining: Number(game.shieldFor('enemy-hq').current.toFixed(1)),
    playerForce: game.forceCount(Owner.Player),
    enemyForce: game.forceCount(Owner.Enemy),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.table((['west-guardian', 'east-direct'] as const).map(runSplitFieldRoute));
}
