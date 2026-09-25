import assert from 'node:assert/strict';
import test from 'node:test';
import { runSignalGardensStrategy } from '../scripts/signal-gardens-lab';

test('Level 8 dual-relay play opens both lanes and outpaces the reinforced center', () => {
  const center = runSignalGardensStrategy('center-stack');
  const dual = runSignalGardensStrategy('dual-relay');
  assert.equal(center.result, 'victory');
  assert.equal(dual.result, 'victory');
  assert.equal(dual.rangeTwoRelaysUsed, 2);
  assert.equal(dual.landingCellsCaptured, 2);
  assert.ok(dual.maxCoverage > center.maxCoverage);
  assert.ok(dual.seconds < center.seconds);
});
