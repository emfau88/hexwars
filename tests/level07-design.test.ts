import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
import { hexDistance } from '../src/core/hex';
import { Owner, Terrain } from '../src/core/types';

const positionFor = (col: number, row: number) => ({ x: col * 50 + (row % 2 ? 25 : 0), y: row * 45 });

test('Level 7 relay has two soft forward range-2 landings around a firmer center', () => {
  const game = new GameState(); game.start(6, positionFor);
  const relay = game.hexAt(3, 6)!;
  const left = game.hexAt(2, 4)!;
  const center = game.hexAt(3, 4)!;
  const right = game.hexAt(4, 4)!;

  assert.equal(relay.terrain, Terrain.Relay);
  assert.equal(relay.units, 12);
  assert.equal(hexDistance(relay, left), 2);
  assert.equal(hexDistance(relay, center), 2);
  assert.equal(hexDistance(relay, right), 2);
  assert.deepEqual([left.units, center.units, right.units], [4, 11, 4]);
  assert.ok(left.units < center.units && right.units < center.units);
});

test('Level 7 keeps the relay jump unavailable until the relay is controlled', () => {
  const game = new GameState(); game.start(6, positionFor);
  const relay = game.hexAt(3, 6)!;
  const landing = game.hexAt(2, 4)!;
  assert.equal(game.canSend(relay, landing), false);
  relay.owner = Owner.Player;
  assert.equal(game.canSend(relay, landing), true);
});
