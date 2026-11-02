import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
import { cellKey, findOwnedPath, isPlayable } from '../src/core/hex';
import { Owner } from '../src/core/types';
import { positionFor, REFERENCE_WORLD_GEOMETRY } from '../src/rendering/WorldGeometry';
import { resolveArrival } from '../src/systems/CombatSystem';
import { createMovement, updateMovements } from '../src/systems/MovementSystem';
import { chooseSupplyRoute } from '../src/systems/SupplySystem';

function finale() {
  const state = new GameState();
  state.start(9, (col, row) => positionFor(REFERENCE_WORLD_GEOMETRY, col, row));
  return state;
}

test('ice finale: a relay bridgehead receives automatic supply only after its land connection is captured', () => {
  const state = finale(), relay = state.hexAt(1, 6)!, bridgehead = state.hexAt(1, 4)!;
  relay.owner = bridgehead.owner = Owner.Player; relay.units = 40; bridgehead.units = 5;
  const context = { hexes: state.hexes, armies: state.armies, structures: state.structures };
  assert.equal(chooseSupplyRoute(context, relay, Owner.Player), null);
  const connection = state.hexAt(1, 5)!; connection.owner = Owner.Player; connection.units = 68;
  const route = chooseSupplyRoute(context, relay, Owner.Player);
  assert.equal(route?.target, bridgehead);
  assert.deepEqual(route?.path.map(cellKey), ['1,6', '1,5', '1,4']);
});

test('ice finale: a convoy reroutes around a captured shore cell without crossing the frozen lake', () => {
  const state = finale();
  for (const hex of state.hexes) if (isPlayable(hex) && hex !== state.hexAt(3, 1)) { hex.owner = Owner.Player; hex.units = 0; }
  const source = state.hexAt(3, 11)!, target = state.hexAt(2, 2)!;
  const path = findOwnedPath(state.hexes, source, target)!;
  assert.ok(path.length > 4);
  const cut = path[2]; cut.owner = Owner.Enemy;
  const army = createMovement(source, target, Owner.Player, 20, 'reinforcement', path);
  state.armies = [army];
  let arrived = 0;
  for (let step = 0; step < 300 && state.armies.length; step++) {
    updateMovements(state.armies, state.hexes, .05, (movement, destination) => {
      assert.equal(destination, target); arrived++;
      return resolveArrival(movement, destination);
    });
    if (army.pathIndex === 1 && army.path[0] === cellKey(path[1])) {
      assert.ok(!army.path.includes(cellKey(cut)));
      assert.ok(army.path.every(key => state.hexes.some(hex => cellKey(hex) === key && isPlayable(hex) && hex.owner === Owner.Player)));
    }
  }
  assert.equal(arrived, 1);
  assert.equal(target.units, 20);
});

test('ice finale: overflow travels back along the shore and preserves every unit', () => {
  const state = finale();
  for (const hex of state.hexes) if (isPlayable(hex) && hex !== state.hexAt(3, 1)) { hex.owner = Owner.Player; hex.units = 68; }
  const source = state.hexAt(3, 11)!, target = state.hexAt(2, 2)!;
  source.units = 8; target.units = 65;
  state.armies = [createMovement(source, target, Owner.Player, 20, 'reinforcement', findOwnedPath(state.hexes, source, target)!)];
  const before = state.forceCount(Owner.Player);
  let returned = false;
  for (let step = 0; step < 600 && state.armies.length; step++) {
    updateMovements(state.armies, state.hexes, .05, resolveArrival);
    returned ||= state.armies.some(army => army.returning);
    assert.equal(state.forceCount(Owner.Player), before);
    assert.ok(state.hexes.every(hex => hex.units <= 68));
  }
  assert.ok(returned);
  assert.equal(state.armies.length, 0);
  assert.equal(source.units, 25);
  assert.equal(target.units, 68);
});
