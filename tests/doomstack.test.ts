import assert from 'node:assert/strict';
import test from 'node:test';
import { runDoomstack } from '../scripts/doomstack';

test('doomstack strategy respects the Level 1 100 percent lock', () => {
  const result = runDoomstack(0);
  assert.equal(result.skipped, true);
  assert.equal(result.actions, 0);
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
