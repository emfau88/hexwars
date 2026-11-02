import { pathToFileURL } from 'node:url';
import { GameState } from '../src/core/GameState';
import { Owner, Terrain, type HexState } from '../src/core/types';
import { actDoomstack, doomstackPositionFor, shortestPlayableRoute } from './doomstack';

export type SignalGardensStrategy = 'center-stack' | 'dual-relay';

export interface SignalGardensResult {
  strategy: SignalGardensStrategy;
  result: string | null;
  seconds: number;
  captures: number;
  maxCoverage: number;
  rangeTwoRelaysUsed: number;
  landingCellsCaptured: number;
}

const at = (game: GameState, col: number, row: number): HexState => {
  const hex = game.hexAt(col, row);
  if (!hex) throw new Error(`Signal Gardens is missing cell ${col},${row}.`);
  return hex;
};

export function runSignalGardensStrategy(strategy: SignalGardensStrategy, maxSeconds = 300): SignalGardensResult {
  const game = new GameState(); game.start(7, doomstackPositionFor); game.opponentEnabled = false;
  const playerBase = game.hexes.find((hex) => hex.owner === Owner.Player && hex.terrain === Terrain.Base)!;
  const enemyBase = game.hexes.find((hex) => hex.owner === Owner.Enemy && hex.terrain === Terrain.Base)!;
  const leftRelay = at(game, 1, 6); const rightRelay = at(game, 5, 6);
  const leftLanding = at(game, 1, 4); const rightLanding = at(game, 5, 4);
  const centerRoute = Array.from({ length: 11 }, (_, index) => at(game, 3, 11 - index));
  const leftApproach = shortestPlayableRoute(game, playerBase, leftRelay);
  const rightApproach = shortestPlayableRoute(game, playerBase, rightRelay);
  const leftAdvance = shortestPlayableRoute(game, leftLanding, enemyBase);
  const rightAdvance = shortestPlayableRoute(game, rightLanding, enemyBase);
  const usedRelays = new Set<string>();
  let nextDecision = 1.2;
  let maxCoverage = game.fieldCount(Owner.Player);

  while (game.running && game.elapsed < maxSeconds) {
    game.update(.05); game.drainEvents();
    maxCoverage = Math.max(maxCoverage, game.fieldCount(Owner.Player));
    if (game.elapsed < nextDecision) continue;

    if (strategy === 'center-stack') {
      actDoomstack(game, centerRoute);
      nextDecision += 1.2;
      continue;
    }

    actDoomstack(game, leftApproach, .82, true);
    actDoomstack(game, rightApproach, .82, true);
    for (const [relay, landing] of [[leftRelay, leftLanding], [rightRelay, rightLanding]] as const) {
      const key = `${relay.col},${relay.row}`;
      if (relay.owner === Owner.Player && landing.owner !== Owner.Player && relay.units >= 3) {
        const amount = Math.max(2, Math.floor(relay.units * .82));
        if (game.send(relay, landing, Owner.Player, amount, true)) usedRelays.add(key);
      }
    }
    actDoomstack(game, leftAdvance, .82, true);
    actDoomstack(game, rightAdvance, .82, true);
    nextDecision += .4;
  }

  return {
    strategy,
    result: game.result,
    seconds: Number(game.elapsed.toFixed(1)),
    captures: game.captures,
    maxCoverage,
    rangeTwoRelaysUsed: usedRelays.size,
    landingCellsCaptured: [leftLanding, rightLanding].filter(({ owner }) => owner === Owner.Player).length,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.table((['center-stack', 'dual-relay'] as const).map((strategy) => runSignalGardensStrategy(strategy)));
}
