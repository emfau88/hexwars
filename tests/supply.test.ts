import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
import { SUPPLY_CONFIG } from '../src/core/config';
import { Owner, Terrain, type ArmyMovement, type HexState } from '../src/core/types';
import { createMovement, updateMovements } from '../src/systems/MovementSystem';
import { resolveArrival } from '../src/systems/CombatSystem';
import { frontHexes, garrisonFor, hinterlandHexes, isForwardSupplyPath, supplyReserveFor, supplyTargetCapacity, SupplySystem } from '../src/systems/SupplySystem';

const hex = (col: number, owner: Owner, units = 8, row = 0): HexState => ({
  col, row, x: col * 100, y: row * 100, owner, units, terrain: Terrain.Normal,
  decor: null, siege: null, flash: 0, fixedUnits: null,
});

test('Supply A: hinterland keeps its garrison and dispatches only surplus', () => {
  const source = hex(0, Owner.Player, 20); const middle = hex(1, Owner.Player); const front = hex(2, Owner.Player); const enemy = hex(3, Owner.Enemy);
  enemy.terrain = Terrain.Base;
  const armies: ArmyMovement[] = []; const system = new SupplySystem();
  const dispatches = system.update({ hexes: [source, middle, front, enemy], armies }, 1.4);
  assert.equal(garrisonFor(source), 8);
  assert.equal(source.units, 8);
  assert.equal(dispatches[0].units, 12);
  assert.equal(armies[0].kind, 'supply');
  assert.equal(armies[0].toKey, '2,0');
});

test('Supply B: automatic routes never enter neutral or enemy territory', () => {
  const enemyBase = hex(4, Owner.Enemy); enemyBase.terrain = Terrain.Base;
  const cells = [hex(0, Owner.Player, 20), hex(1, Owner.Player), hex(2, Owner.Player), hex(3, Owner.Neutral), enemyBase];
  const armies: ArmyMovement[] = []; new SupplySystem().update({ hexes: cells, armies }, 1.4);
  assert.deepEqual(armies[0].path, ['0,0', '1,0', '2,0']);
  assert.ok(armies[0].path.every((key) => cells.find((cell) => `${cell.col},${cell.row}` === key)?.owner === Owner.Player));
});

test('Supply C: a cut corridor refunds cargo at the last valid owned field', () => {
  const a = hex(0, Owner.Player, 8); const b = hex(1, Owner.Player, 8); const c = hex(2, Owner.Player, 8); const d = hex(3, Owner.Player, 8);
  const movement = createMovement(a, d, Owner.Player, 10, 'supply', [a, b, c, d]);
  const armies = [movement]; c.owner = Owner.Enemy;
  updateMovements(armies, [a, b, c, d], 1, (army, target) => resolveArrival(army, target));
  assert.equal(armies.length, 0);
  assert.equal(b.units, 18);
  assert.equal(c.units, 8);
  assert.equal(c.siege, null);
});

function twoFrontMap(): HexState[] {
  return [hex(0, Owner.Enemy), hex(1, Owner.Player), hex(2, Owner.Player), hex(3, Owner.Player, 20), hex(4, Owner.Player), hex(5, Owner.Player), hex(6, Owner.Enemy)];
}

test('Supply D: repeated dispatches balance between two fronts', () => {
  const cells = twoFrontMap(); const source = cells[3]; const armies: ArmyMovement[] = []; const system = new SupplySystem();
  system.update({ hexes: cells, armies }, 1.4);
  source.units = 20;
  system.update({ hexes: cells, armies }, 1.4);
  assert.deepEqual(new Set(armies.map((army) => army.toKey)), new Set(['2,0', '4,0']));
});

test('Supply E: supply advances before armies meet instead of waiting for a marked front', () => {
  const source = hex(0, Owner.Player, 20); const middle = hex(1, Owner.Player); const forward = hex(2, Owner.Player, 4);
  const neutral = hex(3, Owner.Neutral); const enemyBase = hex(4, Owner.Enemy, 20); enemyBase.terrain = Terrain.Base;
  const armies: ArmyMovement[] = [];
  new SupplySystem().update({ hexes: [source, middle, forward, neutral, enemyBase], armies }, SUPPLY_CONFIG.dispatchIntervalSeconds);
  assert.equal(armies[0].toKey, '2,0');
});

test('Supply F: one manual command traverses a multi-hex owned path over time', () => {
  const state = new GameState(); state.start(0);
  const a = hex(0, Owner.Player, 20); const b = hex(1, Owner.Player, 8); const c = hex(2, Owner.Player, 8); const enemy = hex(3, Owner.Enemy, 8);
  state.hexes = [a, b, c, enemy]; state.armies = [];
  assert.equal(state.send(a, c, Owner.Player, 10, true), true);
  assert.equal(state.armies[0].kind, 'reinforcement');
  assert.deepEqual(state.armies[0].path, ['0,0', '1,0', '2,0']);
  state.opponentEnabled = false;
  state.update(.2);
  assert.equal(state.armies.length, 1);
  assert.ok(c.units < 9);
  state.update(.5);
  state.update(.5);
  assert.equal(state.armies.some((army) => army.kind === 'reinforcement'), false);
  assert.ok(c.units >= 18);
});

test('Supply G: front and hinterland are recalculated after territory changes', () => {
  const rear = hex(0, Owner.Player); const oldFront = hex(1, Owner.Player); const next = hex(2, Owner.Enemy); const farEnemy = hex(3, Owner.Enemy);
  assert.deepEqual(frontHexes([rear, oldFront, next, farEnemy], Owner.Player), [oldFront]);
  next.owner = Owner.Player;
  assert.deepEqual(frontHexes([rear, oldFront, next, farEnemy], Owner.Player), [next]);
  assert.deepEqual(hinterlandHexes([rear, oldFront, next, farEnemy], Owner.Player), [rear, oldFront]);
});

test('Supply H: a stocked cell advances supply but keeps a meaningful reserve', () => {
  const enemyBase = hex(5, Owner.Enemy); enemyBase.terrain = Terrain.Base;
  const cells = [hex(0, Owner.Player, 28), hex(1, Owner.Player), hex(2, Owner.Player), hex(3, Owner.Player, 4), hex(4, Owner.Neutral), enemyBase];
  const armies: ArmyMovement[] = [];
  const dispatches = new SupplySystem().update({ hexes: cells, armies }, SUPPLY_CONFIG.dispatchIntervalSeconds);
  const dispatch = dispatches.find((candidate) => candidate.from === cells[0]);
  assert.ok(dispatch);
  assert.equal(dispatch.to, cells[3]);
  assert.ok(cells[0].units >= supplyReserveFor(cells[0], false));
});

test('Supply I: supply chooses the owned cell closest to the rival base', () => {
  const source = hex(0, Owner.Player, 24); const middle = hex(1, Owner.Player); const forward = hex(2, Owner.Player, 4);
  const neutral = hex(3, Owner.Neutral); const enemyBase = hex(4, Owner.Enemy, 20); enemyBase.terrain = Terrain.Base;
  const cells = [source, middle, forward, neutral, enemyBase];
  const armies: ArmyMovement[] = [];
  new SupplySystem().update({ hexes: cells, armies }, SUPPLY_CONFIG.dispatchIntervalSeconds);
  assert.equal(armies.find((army) => army.path[0] === '0,0')?.toKey, '2,0');
});

test('Supply J: automatic supply cannot be redirected backwards by a player click', () => {
  const rearEnemy = hex(-1, Owner.Enemy); const rearFront = hex(0, Owner.Player, 4); const middle = hex(1, Owner.Player); const source = hex(2, Owner.Player, 24);
  const forward = hex(3, Owner.Player, 4); const enemyBase = hex(4, Owner.Enemy, 20); enemyBase.terrain = Terrain.Base;
  const cells = [rearEnemy, rearFront, middle, source, forward, enemyBase]; const armies: ArmyMovement[] = [];
  new SupplySystem().update({ hexes: cells, armies }, SUPPLY_CONFIG.dispatchIntervalSeconds);
  assert.equal(armies.find((army) => army.path[0] === '2,0')?.toKey, '3,0');
});

test('Supply K: normal automatic supply stops at the terrain-sized target capacity', () => {
  const source = hex(0, Owner.Player, 20); const middle = hex(1, Owner.Player, 39); const front = hex(2, Owner.Player, 39); const enemy = hex(3, Owner.Enemy); enemy.terrain = Terrain.Base;
  const armies: ArmyMovement[] = [];
  new SupplySystem().update({ hexes: [source, middle, front, enemy], armies }, SUPPLY_CONFIG.dispatchIntervalSeconds);
  assert.equal(supplyTargetCapacity(front), 39);
  assert.equal(armies.length, 0);
});

test('Supply L: turning player supply off leaves enemy supply operational', () => {
  const state = new GameState(); state.start(0); state.playerSupplyEnabled = false;
  const playerSource = hex(0, Owner.Player, 20); playerSource.terrain = Terrain.Base; const playerMiddle = hex(1, Owner.Player); const playerFront = hex(2, Owner.Player); const enemy = hex(3, Owner.Enemy);
  const enemyFront = hex(4, Owner.Enemy); const enemyMiddle = hex(5, Owner.Enemy); const enemySource = hex(6, Owner.Enemy, 20);
  state.hexes = [playerSource, playerMiddle, playerFront, enemy, enemyFront, enemyMiddle, enemySource]; state.armies = [];
  state.opponentEnabled = false; state.update(SUPPLY_CONFIG.dispatchIntervalSeconds);
  assert.equal(state.armies.some((army) => army.owner === Owner.Player && army.kind === 'supply'), false);
  assert.ok(enemySource.units < 20);
});

test('Supply M: a detour that first moves away from the enemy base is not an automatic forward route', () => {
  const source = hex(0, Owner.Player, 20, 1); const retreat = hex(0, Owner.Player, 8, 0);
  const forward = hex(0, Owner.Player, 8, 2); const target = hex(0, Owner.Player, 8, 3); const enemyBase = hex(0, Owner.Enemy, 20, 5);
  enemyBase.terrain = Terrain.Base;
  assert.equal(isForwardSupplyPath([source, retreat, forward, target], enemyBase), false);
  assert.equal(isForwardSupplyPath([source, forward, target], enemyBase), true);
});

test('Supply N: direct enemy contact accelerates the automatic cadence', () => {
  const source = hex(0, Owner.Player, 20); const middle = hex(1, Owner.Player); const front = hex(2, Owner.Player, 4); const enemy = hex(3, Owner.Enemy);
  const armies: ArmyMovement[] = []; const system = new SupplySystem();
  system.update({ hexes: [source, middle, front, enemy], armies }, SUPPLY_CONFIG.contestedDispatchIntervalSeconds - .01);
  assert.equal(armies.length, 0);
  system.update({ hexes: [source, middle, front, enemy], armies }, .02);
  assert.ok(armies.some((army) => army.kind === 'supply'));
});
