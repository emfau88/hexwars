import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
import { hexDistance } from '../src/core/hex';
import { Owner, Terrain } from '../src/core/types';

const positionFor = (col: number, row: number) => ({ x: col * 50 + (row % 2 ? 25 : 0), y: row * 45 });

test('Level 8 authors two equal relay lanes around a reinforced center', () => {
  const game = new GameState(); game.start(7, positionFor);
  const left = game.hexAt(1, 6)!; const right = game.hexAt(5, 6)!; const center = game.hexAt(3, 6)!;
  assert.equal(left.terrain, Terrain.Relay);
  assert.equal(right.terrain, Terrain.Relay);
  assert.equal(center.terrain, Terrain.Hill);
  assert.deepEqual([left.units, right.units, center.units], [8, 8, 30]);
  assert.equal(hexDistance(left, game.hexAt(1, 4)!), 2);
  assert.equal(hexDistance(right, game.hexAt(5, 4)!), 2);
  assert.deepEqual([game.hexAt(1, 4)!.units, game.hexAt(5, 4)!.units], [4, 4]);
  assert.equal(game.hexAt(3, 4)!.units, 20);
});

test('each Level 8 relay unlocks only after it is controlled', () => {
  const game = new GameState(); game.start(7, positionFor);
  for (const [relayCol, landingCol] of [[1, 1], [5, 5]] as const) {
    const relay = game.hexAt(relayCol, 6)!; const landing = game.hexAt(landingCol, 4)!;
    assert.equal(game.canSend(relay, landing), false);
    relay.owner = Owner.Player;
    assert.equal(game.canSend(relay, landing), true);
  }
});
