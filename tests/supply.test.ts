import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
import { Owner, Terrain, type ArmyMovement, type HexState } from '../src/core/types';
import { createMovement, updateMovements } from '../src/systems/MovementSystem';
import { resolveArrival } from '../src/systems/CombatSystem';
import { frontHexes, garrisonFor, hinterlandHexes, SupplySystem } from '../src/systems/SupplySystem';

const hex = (col: number, owner: Owner, units = 8, row = 0): HexState => ({
  col, row, x: col * 100, y: row * 100, owner, units, terrain: Terrain.Normal,
  decor: null, siege: null, flash: 0, fixedUnits: null,
});

test('Supply A: hinterland keeps its garrison and dispatches only surplus', () => {
  const source = hex(0, Owner.Player, 20); const middle = hex(1, Owner.Player); const front = hex(2, Owner.Player); const enemy = hex(3, Owner.Enemy);
  const armies: ArmyMovement[] = []; const system = new SupplySystem();
  const dispatches = system.update({ hexes: [source, middle, front, enemy], armies, focus: {} }, 1.4);
  assert.equal(garrisonFor(source), 8);
  assert.equal(source.units, 8);
  assert.equal(dispatches[0].units, 12);
  assert.equal(armies[0].kind, 'supply');
  assert.equal(armies[0].toKey, '2,0');
});

test('Supply B: automatic routes never enter neutral or enemy territory', () => {
  const cells = [hex(0, Owner.Player, 20), hex(1, Owner.Player), hex(2, Owner.Player), hex(3, Owner.Neutral)];
  const armies: ArmyMovement[] = []; new SupplySystem().update({ hexes: cells, armies, focus: {} }, 1.4);
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
  system.update({ hexes: cells, armies, focus: {} }, 1.4);
  source.units = 20;
  system.update({ hexes: cells, armies, focus: {} }, 1.4);
  assert.deepEqual(new Set(armies.map((army) => army.toKey)), new Set(['1,0', '5,0']));
});

test('Supply E: focus weighting visibly prioritizes the selected front', () => {
  const cells = twoFrontMap(); const armies: ArmyMovement[] = [];
  new SupplySystem().update({ hexes: cells, armies, focus: { [Owner.Player]: '5,0' } }, 1.4);
  assert.equal(armies[0].toKey, '5,0');
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
  assert.equal(state.armies.length, 0);
  assert.ok(c.units >= 18);
});

test('Supply G: front and hinterland are recalculated after territory changes', () => {
  const rear = hex(0, Owner.Player); const oldFront = hex(1, Owner.Player); const next = hex(2, Owner.Enemy); const farEnemy = hex(3, Owner.Enemy);
  assert.deepEqual(frontHexes([rear, oldFront, next, farEnemy], Owner.Player), [oldFront]);
  next.owner = Owner.Player;
  assert.deepEqual(frontHexes([rear, oldFront, next, farEnemy], Owner.Player), [next]);
  assert.deepEqual(hinterlandHexes([rear, oldFront, next, farEnemy], Owner.Player), [rear, oldFront]);
});
