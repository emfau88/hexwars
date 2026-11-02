import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
import { cellKey, hexDistance, isPlayable } from '../src/core/hex';
import { Owner, type ArmyMovement } from '../src/core/types';
import { chooseSupplyRoute, isForwardSupplyPath, SupplySystem } from '../src/systems/SupplySystem';

for (const level of [3, 4, 5, 6, 7, 8, 9]) {
  test(`Level ${level + 1} finds a forward supply route even when the first shortest path bends backwards`, () => {
    const state = new GameState(); state.start(level);
    const base = state.hexAt(3, 1)!;
    for (const hex of state.hexes) if (isPlayable(hex) && hex !== base) { hex.owner = Owner.Player; hex.units = 68; }
    const source = state.hexAt(level === 5 ? 4 : 5, level === 5 ? 9 : 3)!;
    const target = state.hexAt(2, 2)!; source.units = 40; target.units = 0;
    const route = chooseSupplyRoute({ hexes: state.hexes, armies: [], structures: state.structures }, source, Owner.Player);
    assert.equal(route?.target, target);
    assert.ok(route && isForwardSupplyPath(route.path, base));
    assert.equal(new Set(route.path.map(cellKey)).size, route.path.length);
    for (let i = 1; i < route.path.length; i++) assert.equal(hexDistance(route.path[i - 1], route.path[i]), 1);
  });
}

test('a blocked corridor is reconsidered after recapture', () => {
  const state = new GameState(); state.start(7);
  for (const hex of state.hexes) if (isPlayable(hex) && hex !== state.hexAt(3, 1)) { hex.owner = Owner.Player; hex.units = 68; }
  const source = state.hexAt(5, 3)!, target = state.hexAt(2, 2)!;source.units = 40;target.units = 0;
  const wall = state.hexes.filter((hex) => hex.col === 3 && isPlayable(hex) && hex.row > 1);
  for (const hex of wall) hex.owner = Owner.Enemy;
  const context = { hexes: state.hexes, armies: [] as ArmyMovement[], owners: [Owner.Player], structures: state.structures };
  assert.equal(chooseSupplyRoute(context, source, Owner.Player), null);
  state.hexAt(3, 3)!.owner = Owner.Player;
  assert.equal(chooseSupplyRoute(context, source, Owner.Player)?.target, target);
  const moves = new SupplySystem().update(context, .8);
  assert.ok(moves.some((move) => move.to === target));
});
