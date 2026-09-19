import assert from 'node:assert/strict';
import test from 'node:test';
import { PLAYER_PROFILES, PROFILE_VARIANTS, runProfileBalance } from '../scripts/profile-balance';
import { runGuardianPlayerProfiles, summarizeGuardianPlayerProfiles } from '../scripts/balance-guardian-player-profiles';
import { LEVELS } from '../src/levels';

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

test('Level 6 player profiles record their actual flank and guardian capture', () => {
  const rows = runGuardianPlayerProfiles();
  assert.equal(rows.length, PLAYER_PROFILES.length * PROFILE_VARIANTS.length);
  assert.ok(rows.every((row) => row.firstNorthernFlank === 'west' || row.firstNorthernFlank === 'east'));
  assert.ok(rows.some((row) => row.guardianCaptureSeconds !== null));
  const summary = summarizeGuardianPlayerProfiles(rows);
  assert.equal(summary.reduce((total, group) => total + group.runs, 0), rows.length);
  assert.ok(summary.every((group) => group.wins <= group.runs && group.guardianCaptures <= group.runs));
  const originalStructures = LEVELS[5].structures;
  const noGuardian = runGuardianPlayerProfiles('none');
  const eastGuardian = runGuardianPlayerProfiles('east');
  assert.equal(noGuardian.length, rows.length);
  assert.ok(noGuardian.every((row) => row.guardianCaptureSeconds === null));
  const wins = (runs: typeof rows) => runs.filter((row) => row.result === 'victory').length;
  assert.ok(wins(rows) > wins(eastGuardian));
  assert.ok(wins(rows) >= wins(noGuardian));
  assert.strictEqual(LEVELS[5].structures, originalStructures);
});
