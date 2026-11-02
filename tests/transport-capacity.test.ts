import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_CONFIG } from '../src/core/config';
import { Owner, Terrain, type ArmyMovement, type HexState } from '../src/core/types';
import { resolveArrival } from '../src/systems/CombatSystem';
import { createMovement, updateMovements } from '../src/systems/MovementSystem';
import { SupplySystem } from '../src/systems/SupplySystem';

const cell = (col: number, units: number, owner = Owner.Player): HexState => ({
  col, row: 0, x: col * 100, y: 0, owner, units, terrain: Terrain.Normal,
  decor: null, siege: null, flash: 0, fixedUnits: null,
});
const total = (hexes: HexState[], armies: ArmyMovement[]) => hexes.reduce((n, h) => n + h.units
  + Object.values(h.siege ?? {}).reduce((s, units) => s + (units ?? 0), 0), 0) + armies.reduce((n, a) => n + a.units, 0);

for (const kind of ['command', 'reinforcement', 'supply'] as const) {
  test(`automatic dispatch reserves capacity for incoming ${kind}`, () => {
    const source = cell(0, 42), target = cell(1, 5), base = cell(2, 20, Owner.Enemy); base.terrain = Terrain.Base;
    const armies = [createMovement(source, target, Owner.Player, 60, kind)];
    const sent = new SupplySystem().update({ hexes: [source, target, base], armies, owners: [Owner.Player] }, .8);
    assert.equal(sent.length, 0);
    assert.equal(source.units, 42);
  });
}

test('simultaneous sources reserve the remaining capacity only once', () => {
  const a = cell(0, 40), b = cell(1, 40), target = cell(2, 5), base = cell(3, 20, Owner.Enemy); base.terrain = Terrain.Base;
  const armies: ArmyMovement[] = [];
  new SupplySystem().update({ hexes: [a, b, target, base], armies, owners: [Owner.Player] }, .8);
  assert.ok(armies.filter((army) => army.toKey === '2,0').reduce((sum, army) => sum + army.units, target.units) <= 39);
});

test('overflow returns over owned territory without losing units', () => {
  const source = cell(0, 8), target = cell(1, 65);
  const hexes = [source, target], armies = [createMovement(source, target, Owner.Player, 20)];
  const before = total(hexes, armies);
  updateMovements(armies, hexes, 1, resolveArrival);
  assert.equal(target.units, GAME_CONFIG.maxStack);
  assert.equal(total(hexes, armies), before);
  assert.equal(armies.length, 1, 'the excess travels back instead of teleporting');
  updateMovements(armies, hexes, 1, resolveArrival);
  assert.equal(source.units, 25);
  assert.equal(armies.length, 0);
  assert.equal(total(hexes, armies), before);
});

test('a full connected territory keeps excess in transit until space becomes available', () => {
  const source = cell(0, 68), target = cell(1, 68);
  const hexes = [source, target], armies = [createMovement(source, target, Owner.Player, 20, 'supply')];
  const before = total(hexes, armies);
  for (let i = 0; i < 3; i++) updateMovements(armies, hexes, 1, resolveArrival);
  assert.equal(total(hexes, armies), before);
  assert.equal(armies.length, 1);
  target.units -= 20;
  updateMovements(armies, hexes, 1, resolveArrival);
  assert.equal(target.units, 68);
  assert.equal(armies.length, 0);
});

test('a cut route with a full fallback retains its cargo', () => {
  const source = cell(0, 68), cut = cell(1, 10, Owner.Enemy), goal = cell(2, 5);
  const armies = [createMovement(source, goal, Owner.Player, 20, 'reinforcement', [source, cut, goal])];
  const hexes = [source, cut, goal], before = total(hexes, armies);
  updateMovements(armies, hexes, 1, resolveArrival);
  assert.equal(total(hexes, armies), before);
  assert.equal(cut.siege, null);
});

test('a completely cut off convoy fights at the lost waypoint instead of disappearing', () => {
  const source = cell(0, 8, Owner.Enemy), goal = cell(1, 10, Owner.Enemy);
  const armies = [createMovement(source, goal, Owner.Player, 20, 'supply')];
  const hexes = [source, goal], before = total(hexes, armies);
  updateMovements(armies, hexes, 1, resolveArrival);
  assert.equal(total(hexes, armies), before);
  assert.equal(goal.siege?.[Owner.Player], 20);
});
