import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
import { Owner, Terrain, type HexState } from '../src/core/types';
import { cheapestConquestRoute, strategicTurn, STRATEGIC_STYLES } from '../scripts/strategic-balance';

const cell = (col: number, row: number, owner: Owner, units: number, terrain = Terrain.Normal): HexState => ({
  col, row, owner, units, terrain, x: col * 70, y: row * 60, flash: 0, decor: null, siege: null, fixedUnits: null,
});

test('cost-aware routing takes the five-unit route and leaves the twelve-unit neutral alone', () => {
  const game = new GameState(); game.start(2);
  const from = cell(0, 1, Owner.Player, 23, Terrain.Base);
  const expensive = cell(1, 1, Owner.Neutral, 12);
  const cheap = cell(1, 0, Owner.Neutral, 5);
  const goal = cell(2, 0, Owner.Enemy, 23, Terrain.Base);
  game.hexes = [from, expensive, cheap, goal]; game.structures = [];
  const route = cheapestConquestRoute(game, from, goal);
  assert.deepEqual(route, [from, cheap, goal]);
  assert.equal(route.includes(expensive), false);
});

test('concentrated strategy waits for a useful force and protects its gathering point', () => {
  const game = new GameState(); game.start(2);
  const from = cell(0, 0, Owner.Player, 2, Terrain.Base);
  const target = cell(1, 0, Owner.Neutral, 12);
  const goal = cell(2, 0, Owner.Enemy, 23, Terrain.Base);
  game.hexes = [from, target, goal]; game.structures = [];
  assert.equal(strategicTurn(game, STRATEGIC_STYLES[1]).sent, 0);
  assert.equal(from.supplyHeld, true);
  from.units = 25;
  assert.equal(strategicTurn(game, STRATEGIC_STYLES[1]).sent, 25);
  assert.equal(game.armies.length, 1);
  assert.equal(game.armies[0].toKey, '1,0');
});
