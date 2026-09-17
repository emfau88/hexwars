import assert from 'node:assert/strict';
import test from 'node:test';
import { PLAYER_PROFILES, PROFILE_VARIANTS, runProfileBalance } from '../scripts/profile-balance';

test('profile balance runner covers three styles and five reproducible variants', () => {
  const rows = [0, 4, 9].flatMap((level) => PLAYER_PROFILES.flatMap((profile) => PROFILE_VARIANTS.map((variant) => runProfileBalance(level, profile, variant))));
  assert.equal(rows.length, 3 * PLAYER_PROFILES.length * PROFILE_VARIANTS.length);
  for (const profile of PLAYER_PROFILES) {
    const profileRows = rows.filter((row) => row.profile === profile.id);
    assert.equal(profileRows.length, 3 * PROFILE_VARIANTS.length);
    assert.deepEqual(new Set(profileRows.map((row) => row.variant)), new Set(PROFILE_VARIANTS.map((variant) => variant.id)));
    assert.ok(profileRows.every((row) => row.firstAiAction !== null && row.firstAiAction <= 3));
    assert.ok(profileRows.every((row) => row.actions > 0 && row.seconds > 0 && row.seconds <= 300));
  }
});
