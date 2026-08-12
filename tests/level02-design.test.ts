import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
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

