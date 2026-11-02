import { pathToFileURL } from 'node:url';
import { GameState } from '../src/core/GameState';
import { Owner, Terrain, type HexState } from '../src/core/types';
import { actDoomstack, doomstackPositionFor, shortestPlayableRoute } from './doomstack';

export type RelayIslandStrategy = 'center-stack' | 'relay-fanout';

export interface RelayIslandResult {
  strategy: RelayIslandStrategy;
  result: string | null;
  seconds: number;
  captures: number;
  maxCoverage: number;
  usedRangeTwo: boolean;
  landingCellsCaptured: number;
}

const at = (game: GameState, col: number, row: number): HexState => {
  const hex = game.hexAt(col, row);
  if (!hex) throw new Error(`Relay Island is missing cell ${col},${row}.`);
  return hex;
};

export function runRelayIslandStrategy(strategy: RelayIslandStrategy, maxSeconds = 300): RelayIslandResult {
  const game = new GameState(); game.start(6, doomstackPositionFor);
  game.opponentEnabled = false;
  const playerBase = game.hexes.find((hex) => hex.owner === Owner.Player && hex.terrain === Terrain.Base)!;
  const enemyBase = game.hexes.find((hex) => hex.owner === Owner.Enemy && hex.terrain === Terrain.Base)!;
  const relay = at(game, 3, 6);
  const leftLanding = at(game, 2, 4);
  const rightLanding = at(game, 4, 4);
  const centerRoute = Array.from({ length: 11 }, (_, index) => at(game, 3, 11 - index));
  const relayApproach = shortestPlayableRoute(game, playerBase, relay);
  const leftRoute = shortestPlayableRoute(game, leftLanding, enemyBase);
  const rightRoute = shortestPlayableRoute(game, rightLanding, enemyBase);
  let nextDecision = 1.2;
  let maxCoverage = game.fieldCount(Owner.Player);
  let usedRangeTwo = false;
  let alternateLanding = false;

  while (game.running && game.elapsed < maxSeconds) {
    game.update(.05); game.drainEvents();
    maxCoverage = Math.max(maxCoverage, game.fieldCount(Owner.Player));
    if (game.elapsed < nextDecision) continue;

    if (strategy === 'center-stack') {
      actDoomstack(game, centerRoute);
    } else if (relay.owner !== Owner.Player) {
      actDoomstack(game, relayApproach);
    } else {
      const pending = [leftLanding, rightLanding].filter((landing) => landing.owner !== Owner.Player);
      if (pending.length && relay.units >= 2) {
        const landing = pending.length === 1 ? pending[0] : pending[alternateLanding ? 1 : 0];
        const amount = Math.max(1, Math.floor(relay.units * .5));
        if (game.send(relay, landing, Owner.Player, amount, true)) usedRangeTwo = true;
        alternateLanding = !alternateLanding;
      }
      actDoomstack(game, leftRoute, .65, true);
      actDoomstack(game, rightRoute, .65, true);
    }
    nextDecision += strategy === 'relay-fanout' && relay.owner === Owner.Player ? .35 : 1.2;
  }

  return {
    strategy,
    result: game.result,
    seconds: Number(game.elapsed.toFixed(1)),
    captures: game.captures,
    maxCoverage,
    usedRangeTwo,
    landingCellsCaptured: [leftLanding, rightLanding].filter(({ owner }) => owner === Owner.Player).length,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.table((['center-stack', 'relay-fanout'] as const).map((strategy) => runRelayIslandStrategy(strategy)));
}
