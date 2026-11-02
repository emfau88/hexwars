import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
import { Owner, Terrain, type ArmyMovement, type HexState } from '../src/core/types';
import { updateCombat } from '../src/systems/CombatSystem';
import { createMovement } from '../src/systems/MovementSystem';
import { chooseSupplyRoute, SupplySystem } from '../src/systems/SupplySystem';

const cell = (col: number, owner: Owner, units: number, terrain = Terrain.Normal): HexState => ({
  col, row: 0, x: col * 100, y: 0, owner, units, terrain,
  decor: null, siege: null, flash: 0, fixedUnits: null,
});

for (const owner of [Owner.Player, Owner.Enemy]) {
  const rival = owner === Owner.Player ? Owner.Enemy : Owner.Player;
  test(`besieged ${Owner[owner]} field keeps its winning defence`, () => {
    const flank = cell(0, rival, 5); const source = cell(1, owner, 40);
    const forward = cell(2, owner, 5); const base = cell(3, rival, 20, Terrain.Base);
    source.siege = { [rival]: 30 };
    const hexes = [flank, source, forward, base];
    const dispatches = new SupplySystem().update({ hexes, armies: [], owners: [owner] }, .8);
    assert.equal(dispatches.some((dispatch) => dispatch.from === source), false);
    assert.equal(source.units, 40);
    for (let step = 0; step < 100; step++) updateCombat(hexes, .05, () => .5, () => {});
    assert.equal(source.owner, owner);
    assert.ok(source.units >= 9.99);
  });

  test(`incoming attack protects ${Owner[owner]} HQ before the first clash`, () => {
    const flank = cell(0, rival, 5); const source = cell(1, owner, 40, Terrain.Base);
    const forward = cell(2, owner, 5); const base = cell(3, rival, 20, Terrain.Base);
    const hexes = [flank, source, forward, base];
    const armies: ArmyMovement[] = [createMovement(flank, source, rival, 30)];
    const system = new SupplySystem();
    assert.equal(system.update({ hexes, armies, owners: [owner] }, .8).some((d) => d.from === source), false);
    assert.equal(source.units, 40);
    armies.length = 0;
    assert.ok(system.update({ hexes, armies, owners: [owner] }, .8).some((d) => d.from === source));
  });
}

test('stable front continues dispatching surplus and manual orders remain possible under attack', () => {
  const flank = cell(0, Owner.Enemy, 5); const source = cell(1, Owner.Player, 40);
  const forward = cell(2, Owner.Player, 5); const base = cell(3, Owner.Enemy, 20, Terrain.Base);
  const hexes = [flank, source, forward, base];
  const dispatch = new SupplySystem().update({ hexes, armies: [], owners: [Owner.Player] }, .8).find((d) => d.from === source);
  assert.equal(dispatch?.units, 25);
  assert.equal(source.units, 15);
  const state = new GameState(); state.start(0); state.hexes = hexes;
  source.siege = { [Owner.Enemy]: 30 };
  assert.equal(state.send(source, forward, Owner.Player, 10, true), true);
  assert.equal(source.units, 5);
});

test('an endangered forward field receives support before a slightly closer unthreatened field', () => {
  const source = cell(0, Owner.Player, 40), middle = cell(1, Owner.Player, 39);
  const defended = cell(2, Owner.Player, 5), forward = cell(3, Owner.Player, 5);
  const neutral = cell(4, Owner.Neutral, 8), base = cell(5, Owner.Enemy, 20, Terrain.Base);
  defended.siege = { [Owner.Enemy]: 20 };
  const context = { hexes: [source, middle, defended, forward, neutral, base], armies: [] as ArmyMovement[] };
  assert.equal(chooseSupplyRoute(context, source, Owner.Player)?.target, defended);
  context.armies.push(createMovement(source, defended, Owner.Player, 34));
  assert.equal(chooseSupplyRoute(context, source, Owner.Player)?.target, forward);
});

test('holding a field stops its automatic exports, allows manual orders, and clears on capture', () => {
  const state = new GameState(); state.start(0);
  const source = cell(0, Owner.Player, 40), forward = cell(1, Owner.Player, 5), base = cell(2, Owner.Enemy, 20, Terrain.Base);
  state.hexes = [source, forward, base];
  assert.equal(state.toggleHold(source), true);
  assert.equal(new SupplySystem().update({ hexes: state.hexes, armies: [], owners: [Owner.Player] }, .8).length, 0);
  assert.equal(state.send(source, forward, Owner.Player, 10, true), true);
  assert.equal(source.units, 30);
  source.units = 0; source.siege = { [Owner.Enemy]: 10 };
  state.opponentEnabled = false; state.update(.05);
  assert.equal(source.owner, Owner.Enemy);
  assert.equal(source.supplyHeld, false);
  assert.equal(state.toggleHold(source), false);
});
