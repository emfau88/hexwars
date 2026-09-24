import assert from 'node:assert/strict';
import test from 'node:test';
import { runDoomstack } from '../scripts/doomstack';
import { guardianCells, runGuardianLab } from '../scripts/guardian-lab';
import { GameState } from '../src/core/GameState';

test('doomstack strategy can execute the Level 1 100 percent command', () => {
  const result = runDoomstack(0);
  assert.equal(result.skipped, false);
  assert.ok(result.actions > 0);
  assert.equal(result.groupActions, 0);
});

test('doomstack strategy records its deliberately narrow no-group approach', () => {
  const result = runDoomstack(1);
  assert.equal(result.skipped, false);
  assert.equal(result.result, 'victory');
  assert.ok(result.actions > 0);
  assert.equal(result.groupActions, 0);
  assert.ok(result.maxMapCoverage < result.playableCells);
  assert.ok(result.maxFrontStackShare > 0);
});

test('guardian lab selects two lateral proxy objectives without replacing the HQ', () => {
  const game = new GameState();
  game.start(1);
  const guardians = guardianCells(game);
  assert.equal(guardians.length, 2);
  assert.ok(guardians[0].col < 3);
  assert.ok(guardians[1].col > 3);
});

test('active shield guardians absorb a direct HQ attack in the isolated lab', () => {
  const result = runGuardianLab({ levelIndex: 1, model: 'shield-pool', strength: 20, strategy: 'direct' });
  assert.equal(result.guardiansCaptured, 0);
  assert.ok(result.protectionAbsorbed > 0);
  assert.ok(result.maxFrontStackShare > 0);
});

test('two-guardian strategy deactivates both proxy objectives before victory or timeout', () => {
  const result = runGuardianLab({ levelIndex: 1, model: 'shield-pool', strength: 20, strategy: 'two-guardians' });
  assert.equal(result.guardiansCaptured, 2);
  assert.ok(result.routeColumns >= 3);
});

test('a finite 96-point shield per guardian makes the objective route economically superior without forbidding a direct rush', () => {
  for (const levelIndex of [1, 2, 4, 7]) {
    const direct = runGuardianLab({ levelIndex, model: 'shield-pool', strength: 96, strategy: 'direct' });
    const objectives = runGuardianLab({ levelIndex, model: 'shield-pool', strength: 96, strategy: 'two-guardians' });
    assert.equal(direct.result, 'victory');
    assert.equal(objectives.result, 'victory');
    assert.equal(direct.guardiansCaptured, 0);
    assert.equal(objectives.guardiansCaptured, 2);
    assert.ok(objectives.seconds <= direct.seconds * .9, `Level ${levelIndex + 1}: ${objectives.seconds} should beat ${direct.seconds}`);
  }
});

test('guardian detours expose a real dependency on the existing supply system', () => {
  const directWithoutSupply = runGuardianLab({ levelIndex: 1, model: 'shield-pool', strength: 96, strategy: 'direct', supply: false });
  const objectivesWithoutSupply = runGuardianLab({ levelIndex: 1, model: 'shield-pool', strength: 96, strategy: 'two-guardians', supply: false });
  assert.equal(directWithoutSupply.result, 'victory');
  assert.equal(objectivesWithoutSupply.result, 'timeout');
});
