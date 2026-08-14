import assert from 'node:assert/strict';
import test from 'node:test';
import { hexDistance } from '../src/core/hex';
import { createSeededRandom } from '../src/core/random';
import { Owner, Terrain } from '../src/core/types';
import { GameState } from '../src/core/GameState';
import { buildLevel } from '../src/levels/buildLevel';
import level01 from '../src/levels/level01';

const mainRoute = [[3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9]] as const;
const optionalCells = [[2, 4], [4, 5], [2, 6], [4, 7], [4, 8]] as const;

const assertConnected = (route: readonly (readonly [number, number])[]) => {
  for (let index = 1; index < route.length; index += 1) {
    assert.equal(hexDistance({ col: route[index - 1][0], row: route[index - 1][1] }, { col: route[index][0], row: route[index][1] }), 1);
  }
};

test('Level 1 keeps the full board but limits the shortest base route to six moves', () => {
  assertConnected(mainRoute);
  assert.equal(level01.cols, 7);
  assert.equal(level01.rows, 13);
  assert.deepEqual(level01.bases, { player: { col: 3, row: 9 }, enemy: { col: 3, row: 3 } });
  assert.equal(mainRoute.length - 1, 6);
});

test('Level 1 preserves the complete visible raster while adding optional lateral cells', () => {
  const board = buildLevel(0, createSeededRandom(level01.seed));
  const playable = board.filter((hex) => hex.terrain !== Terrain.Decor);
  const resistance = playable.filter((hex) => hex.owner === Owner.Neutral).map((hex) => hex.units);
  assert.ok(Math.max(...resistance) <= 2, 'the tutorial contains no waiting-wall neutral field');
  assert.equal(playable.length, 12);
  for (const [col, row] of optionalCells) {
    assert.ok(mainRoute.some(([routeCol, routeRow]) => hexDistance({ col, row }, { col: routeCol, row: routeRow }) === 1));
  }
  assert.equal(board.length, 7 * 13, 'the visible field raster remains unchanged');
});

test('Level 1 retains tutorial restrictions and only softens enemy production', () => {
  assert.deepEqual(level01.features, { all: false, group: false, relay: false, supply: true, focus: false });
  assert.equal(level01.aiDelaySeconds, 6.5);
  assert.equal(level01.aiThinkMs, 2500);
  assert.equal(level01.aiSkill, .4);
  assert.equal(level01.growthMultiplier, 2.2);
  assert.equal(level01.enemyGrowthMultiplier, 1.85);
});

test('Level 1 deterministic pacing smoke stays inside the target corridor', () => {
  const game = new GameState();
  game.start(0, (col, row) => ({ x: col * 50 + (row % 2 ? 25 : 0), y: row * 45 }));
  let nextPlayerDecision = 2.2; let firstCapture = 0; let firstEnemyAction = 0;
  while (game.running && game.elapsed < 180) {
    game.update(.05);
    for (const event of game.drainEvents()) {
      if (!firstCapture && event.type === 'capture' && event.detail.newOwner === Owner.Player) firstCapture = game.elapsed;
      if (!firstEnemyAction && event.type === 'send' && event.detail.owner === Owner.Enemy) firstEnemyAction = game.elapsed;
    }
    if (game.elapsed >= nextPlayerDecision) {
      game.think(Owner.Player, .86, 1);
      nextPlayerDecision += 1.55;
    }
  }
  assert.equal(game.result, 'victory');
  assert.ok(firstCapture > 0 && firstCapture < 10);
  assert.ok(firstEnemyAction >= 8.5 && firstEnemyAction <= 10);
  assert.ok(game.elapsed >= 20 && game.elapsed <= 45);
});
