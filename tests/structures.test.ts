import assert from 'node:assert/strict';
import test from 'node:test';
import { GameState } from '../src/core/GameState';
import { Owner, Terrain, type HexState } from '../src/core/types';
import { LEVELS } from '../src/levels';
import { chooseAIAction } from '../src/systems/AISystem';
import { updateCombat } from '../src/systems/CombatSystem';
import { updateGrowth } from '../src/systems/GrowthSystem';
import { SupplySystem } from '../src/systems/SupplySystem';
import { absorbHqShield, buildStructures, hqShield, syncStructureCapture } from '../src/systems/StructureSystem';
import { evaluateVictory } from '../src/systems/VictorySystem';
import { runGuardianProductionRoute } from '../scripts/balance-guardian-production';
import { runSplitFieldRoute } from '../scripts/balance-guardian-rollout';

const positionFor = (col: number, row: number) => ({ x: col * 70 + (row % 2 ? 35 : 0), y: row * 60 });

test('Level 5 authors two finite enemy guardians linked to the HQ', () => {
  const game = new GameState(); game.start(4, positionFor);
  const guardians = game.structures.filter(({ type }) => type === 'guardian');
  assert.deepEqual(guardians.map(({ id }) => id), ['enemy-guardian-west', 'enemy-guardian-east']);
  assert.ok(guardians.every(({ owner, status, shield, maxShield, linkedTo }) => owner === Owner.Enemy
    && status === 'active' && shield === 48 && maxShield === 48 && linkedTo === 'enemy-hq'));
  assert.ok(guardians.every(({ footprint }) => footprint === .78));
  assert.deepEqual(hqShield(game.structures, 'enemy-hq'), { current: 96, maximum: 96, active: 2 });
  assert.equal(game.hexAt(1, 4)?.owner, Owner.Enemy);
  assert.equal(game.hexAt(5, 4)?.units, 8);
});

test('direct HQ combat consumes finite guardian shield before base defenders', () => {
  const game = new GameState(); game.start(4, positionFor);
  const hqStructure = game.structures.find(({ id }) => id === 'enemy-hq')!;
  const hq = game.hexAt(hqStructure.col, hqStructure.row)!; const defenders = hq.units;
  hq.siege = { [Owner.Player]: 10 };
  updateCombat(game.hexes, 1, () => .5, () => undefined,
    (target, owner, requested) => absorbHqShield(game.structures, target, owner, requested));
  assert.equal(hq.units, defenders);
  assert.equal(hq.siege, null);
  assert.deepEqual(hqShield(game.structures, 'enemy-hq'), { current: 86, maximum: 96, active: 2 });
});

test('capturing a guardian permanently removes its remaining HQ shield without winning', () => {
  const game = new GameState(); game.start(4, positionFor);
  const target = game.hexAt(1, 4)!; target.units = 0; target.siege = { [Owner.Player]: 9 };
  updateCombat(game.hexes, .1, () => .5, (hex, _oldOwner, newOwner) => {
    syncStructureCapture(game.structures, hex, newOwner);
  });
  const guardian = game.structureAt(1, 4)!;
  assert.equal(guardian.owner, Owner.Player);
  assert.equal(guardian.status, 'captured');
  assert.equal(guardian.shield, 0);
  assert.deepEqual(hqShield(game.structures, 'enemy-hq'), { current: 48, maximum: 96, active: 1 });
  assert.equal(evaluateVictory(game.hexes, game.armies, game.level.bases), null);
});

test('guardian cells neither grow nor dispatch or receive automatic supply', () => {
  const game = new GameState(); game.start(4, positionFor);
  const guardian = game.hexAt(1, 4)!; guardian.units = 20;
  const ally = game.hexAt(1, 5)!; ally.owner = Owner.Enemy; ally.units = 2;
  updateGrowth(game.hexes, 0, 10, 1, 1, game.structures);
  assert.equal(guardian.units, 20);
  const armies: typeof game.armies = [];
  new SupplySystem().update({ hexes: game.hexes, armies, owners: [Owner.Enemy], structures: game.structures }, 10);
  assert.ok(armies.every((army) => army.toKey !== '1,4'));
  assert.equal(guardian.units, 20);
});

test('AI values an active guardian above a still-shielded direct HQ attack', () => {
  const game = new GameState(); game.start(4, positionFor);
  const source = game.hexAt(1, 5)!; source.owner = Owner.Player; source.units = 30;
  const guardian = game.hexAt(1, 4)!;
  const hqStructure = game.structures.find(({ id }) => id === 'enemy-hq')!;
  const hq = game.hexAt(hqStructure.col, hqStructure.row)!;
  const action = chooseAIAction({
    owner: Owner.Player, elapsed: 70, endgameStage: 0, hexes: [source, guardian, hq], structures: game.structures,
    level: LEVELS[4], random: () => .5, canSend: (from, to) => from === source && (to === guardian || to === hq),
    incomingTo: () => 0, send: () => true, groupPotential: () => 0, sendGroup: () => 0,
  }, 1);
  assert.equal(action?.tgt, guardian);
});

test('AI keeps guardian garrisons stationed instead of sending them into ordinary attacks', () => {
  const game = new GameState(); game.start(4, positionFor);
  const guardian = game.hexAt(1, 4)!;
  const target = game.hexAt(1, 5)!;
  const action = chooseAIAction({
    owner: Owner.Enemy, elapsed: 30, endgameStage: 0, hexes: [guardian, target], structures: game.structures,
    level: LEVELS[4], random: () => .5, canSend: (from, to) => from === guardian && to === target,
    incomingTo: () => 0, send: () => true, groupPotential: () => 0, sendGroup: () => 0,
  }, 1);
  assert.equal(action, null);
  assert.equal(guardian.units, 8);
});

test('all legacy missions still expose HQ structures while keeping terrain compatibility', () => {
  for (let index = 0; index < LEVELS.length; index += 1) {
    const game = new GameState(); game.start(index, positionFor);
    assert.equal(game.structures.filter(({ type }) => type === 'hq').length, 2);
    assert.equal(game.hexes.filter(({ terrain }) => terrain === Terrain.Base).length, 2);
  }
});

test('guardian rollout is deliberately limited by campaign role', () => {
  const counts = LEVELS.map((_level, index) => {
    const game = new GameState(); game.start(index, positionFor);
    return game.structures.filter(({ type }) => type === 'guardian').length;
  });
  assert.deepEqual(counts, [0, 0, 0, 0, 2, 1, 0, 0, 0, 0]);
});

test('structure authoring rejects overlapping or unlinked guardians', () => {
  const game = new GameState(); game.start(4, positionFor);
  const first = LEVELS[4].structures![0];
  assert.throws(() => buildStructures({ ...LEVELS[4], structures: [{ ...first, col: 3, row: 1 }] }, game.hexes), /overlaps/);
  assert.throws(() => buildStructures({ ...LEVELS[4], structures: [{ ...first, linkedTo: 'missing-hq' }] }, game.hexes), /allied HQ link/);
  assert.throws(() => buildStructures({ ...LEVELS[4], structures: [{ ...first, footprint: 1.2 }] }, game.hexes), /invalid hex footprint/);
});

test('Level 5 production guardian route beats the still-possible direct HQ rush', () => {
  const direct = runGuardianProductionRoute('direct');
  const west = runGuardianProductionRoute('west-guardian');
  const east = runGuardianProductionRoute('east-guardian');
  for (const run of [direct, west, east]) {
    assert.equal(run.result, 'victory');
    assert.equal(run.shieldRemaining, 0);
  }
  assert.ok(west.seconds < direct.seconds * .9);
  assert.ok(east.seconds < direct.seconds * .9);
  assert.equal(west.guardianStatus, 'captured');
  assert.equal(east.guardianStatus, 'captured');
});

test('Level 6 uses one western guardian without turning both routes into a checklist', () => {
  const game = new GameState(); game.start(5, positionFor);
  const guardians = game.structures.filter(({ type }) => type === 'guardian');
  assert.equal(guardians.length, 1);
  assert.deepEqual(guardians.map(({ id, col, row, shield, linkedTo }) => ({ id, col, row, shield, linkedTo })), [
    { id: 'enemy-guardian-west', col: 2, row: 4, shield: 36, linkedTo: 'enemy-hq' },
  ]);
  assert.equal(game.hexAt(2, 4)?.units, 7);
  assert.deepEqual(hqShield(game.structures, 'enemy-hq'), { current: 36, maximum: 36, active: 1 });
  assert.equal(game.hexAt(4, 4)?.owner, Owner.Neutral);
});

test('Level 6 guardian route saves time while the direct eastern route remains viable', () => {
  const direct = runSplitFieldRoute('east-direct');
  const west = runSplitFieldRoute('west-guardian');
  assert.equal(direct.result, 'victory');
  assert.equal(west.result, 'victory');
  assert.equal(direct.guardian, 'disabled');
  assert.equal(west.guardian, 'captured');
  assert.ok(west.seconds < direct.seconds * .9);
  assert.ok(direct.playerForce > west.playerForce);
});
