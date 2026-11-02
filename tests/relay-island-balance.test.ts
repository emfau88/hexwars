import assert from 'node:assert/strict';
import test from 'node:test';
import { runRelayIslandStrategy } from '../scripts/relay-island-lab';

test('Level 7 relay fan-out is viable and spreads pressure beyond the center stack', () => {
  const center = runRelayIslandStrategy('center-stack');
  const fanout = runRelayIslandStrategy('relay-fanout');
  assert.equal(center.result, 'victory');
  assert.equal(fanout.result, 'victory');
  assert.equal(fanout.usedRangeTwo, true);
  assert.equal(fanout.landingCellsCaptured, 2);
  assert.ok(fanout.maxCoverage > center.maxCoverage);
});
