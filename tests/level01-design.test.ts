import assert from 'node:assert/strict';
import test from 'node:test';
import { hexDistance } from '../src/core/hex';
import { createSeededRandom } from '../src/core/random';
import { Owner, Terrain } from '../src/core/types';
import { GameState } from '../src/core/GameState';
import { buildLevel } from '../src/levels/buildLevel';
import level01 from '../src/levels/level01';

const playerDirect = [[3, 11], [3, 10], [3, 9], [3, 8], [3, 7], [3, 6]] as const;
const playerEconomy = [[3, 11], [3, 10], [3, 9], [4, 8], [5, 8], [5, 7], [5, 6], [4, 6], [3, 6]] as const;
const enemyDirect = [[3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6]] as const;
const enemyEconomy = [[3, 1], [3, 2], [3, 3], [4, 4], [5, 4], [5, 5], [5, 6], [4, 6], [3, 6]] as const;

const assertConnected = (route: readonly (readonly [number, number])[]) => {
  for (let index = 1; index < route.length; index += 1) {
    assert.equal(hexDistance({ col: route[index - 1][0], row: route[index - 1][1] }, { col: route[index][0], row: route[index][1] }), 1);
  }
};

test('Level 1 offers symmetric connected direct and economy routes', () => {
  for (const route of [playerDirect, playerEconomy, enemyDirect, enemyEconomy]) assertConnected(route);
  assert.ok(playerEconomy.length > playerDirect.length);
  assert.equal(playerEconomy.length, enemyEconomy.length);
  assert.equal(playerDirect.length, enemyDirect.length);
});

test('Level 1 route costs express tempo versus field economy', () => {
  const board = buildLevel(0, createSeededRandom(level01.seed));
  const units = (route: readonly (readonly [number, number])[]) => route.slice(3, -1).map(([col, row]) => board.find((hex) => hex.col === col && hex.row === row)?.units ?? 0);
  const direct = units(playerDirect); const economy = units(playerEconomy);
  assert.ok(Math.max(...direct) >= 8, 'direct route contains a meaningful defender');
  assert.ok(economy.every((value) => value <= 3), 'economy route contains only weak fields');
  assert.ok(economy.length > direct.length, 'economy route yields more owned production fields');
  assert.equal(board.filter((hex) => hex.terrain !== Terrain.Decor).length, 19);
});

test('Level 1 retains tutorial restrictions and brings the AI on-screen earlier', () => {
  assert.deepEqual(level01.features, { all: false, group: false, relay: false, supply: true, focus: false });
  assert.ok(level01.aiDelaySeconds >= 6 && level01.aiDelaySeconds <= 7);
  assert.equal(level01.aiThinkMs, 2500);
  assert.ok(level01.aiSkill <= .42);
});

test('Level 1 deterministic pacing smoke stays inside the target corridor', () => {
  const game = new GameState();
  game.start(0, (col, row) => ({ x: col * 50 + (row % 2 ? 25 : 0), y: row * 45 }));
  let nextPlayerDecision = 2.5; let firstCapture = 0; let firstEnemyAction = 0;
  while (game.running && game.elapsed < 180) {
    game.update(.05);
    for (const event of game.drainEvents()) {
      if (!firstCapture && event.type === 'capture' && event.detail.newOwner === Owner.Player) firstCapture = game.elapsed;
      if (!firstEnemyAction && event.type === 'send' && event.detail.owner === Owner.Enemy) firstEnemyAction = game.elapsed;
    }
    if (game.elapsed >= nextPlayerDecision) {
      game.think(Owner.Player, .86, 1);
      nextPlayerDecision += 1.8;
    }
  }
  assert.equal(game.result, 'victory');
  assert.ok(firstCapture > 0 && firstCapture < 10);
  assert.ok(firstEnemyAction >= 6 && firstEnemyAction <= 10);
  assert.ok(game.elapsed >= 60 && game.elapsed <= 100);
});
