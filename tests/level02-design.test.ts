import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
import { hexDistance } from '../src/core/hex';
import { Owner } from '../src/core/types';

const positionFor = (col: number, row: number) => ({ x: col * 50 + (row % 2 ? 25 : 0), y: row * 45 });

const resolve = (game: GameState, seconds = 4) => {
  game.opponentEnabled = false;
  for (let elapsed = 0; elapsed < seconds && game.running; elapsed += .05) game.update(.05);
};

test('Level 2 makes 50 percent the reserve-preserving opening', () => {
  const game = new GameState(); game.start(1, positionFor);
  const base = game.hexAt(3, 11)!; const weak = game.hexAt(3, 10)!;
  assert.equal(game.sendFraction(base, weak, .5), true);
  assert.equal(base.units, 12);
  resolve(game);
  assert.equal(weak.owner, Owner.Player);
});

test('Level 2 makes 100 percent an immediate breakthrough with an empty source', () => {
  const game = new GameState(); game.start(1, positionFor);
  const base = game.hexAt(3, 11)!; const strong = game.hexAt(4, 10)!;
  assert.equal(game.sendFraction(base, strong, 1), true);
  assert.equal(base.units, 0);
  resolve(game);
  assert.equal(strong.owner, Owner.Player);
  assert.ok(strong.units >= 1);
});

test('Level 2 prevents an immediate 50 percent breakthrough on the strong field', () => {
  const game = new GameState(); game.start(1, positionFor);
  const base = game.hexAt(3, 11)!; const strong = game.hexAt(4, 10)!;
  game.sendFraction(base, strong, .5);
  resolve(game);
  assert.equal(strong.owner, Owner.Neutral);
  assert.equal(base.owner, Owner.Player);
});

test('Level 2 right route detours around both pond pairs without a gap or extra move', () => {
  const game = new GameState(); game.start(1, positionFor);
  const route = [
    [3, 11], [4, 10], [4, 9], [5, 8], [5, 7], [5, 6],
    [5, 5], [5, 4], [4, 3], [4, 2], [3, 1],
  ].map(([col, row]) => game.hexAt(col, row)!);
  assert.equal(route.length - 1, 10);
  assert.ok(route.every(Boolean));
  assert.ok(route.slice(1).every((hex, index) => hexDistance(route[index], hex) === 1));
  assert.ok(route.every(({ col, row }) => col !== 3 || ![4, 5, 7, 8].includes(row)));
});
