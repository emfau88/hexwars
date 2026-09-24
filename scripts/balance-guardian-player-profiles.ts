import { pathToFileURL } from 'node:url';
import { LEVELS } from '../src/levels';
import { PLAYER_PROFILES, PROFILE_VARIANTS, runProfileBalance, type ProfileBalanceRow } from './profile-balance';

export type GuardianScenario = 'current' | 'none' | 'east' | 'west';

export function runGuardianPlayerProfiles(scenario: GuardianScenario = 'current'): ProfileBalanceRow[] {
  const level = LEVELS[5];
  const original = level.structures;
  if (scenario !== 'current') {
    const guardian = original?.find(({ type }) => type === 'guardian');
    if (!guardian) throw new Error('Level 6 needs a Guardian definition for the scenario comparison.');
    level.structures = scenario === 'none' ? [] : [{
      ...guardian,
      id: `enemy-guardian-${scenario}`,
      col: scenario === 'west' ? 2 : 4,
      row: 4,
    }];
  }
  try {
    return PLAYER_PROFILES.flatMap((profile) => PROFILE_VARIANTS.map((variant) => runProfileBalance(5, profile, variant)));
  } finally {
    level.structures = original;
  }
}

export function summarizeGuardianPlayerProfiles(rows: readonly ProfileBalanceRow[]) {
  return (['west', 'east'] as const).map((flank) => {
    const group = rows.filter((row) => row.firstNorthernFlank === flank);
    const victories = group.filter((row) => row.result === 'victory');
    return {
      firstFlank: flank,
      runs: group.length,
      wins: victories.length,
      guardianCaptures: group.filter((row) => row.guardianCaptureSeconds !== null).length,
      averageVictorySeconds: victories.length
        ? Number((victories.reduce((sum, row) => sum + row.seconds, 0) / victories.length).toFixed(1)) : null,
    };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const scenarios = (['none', 'east', 'west'] as const).map((scenario) => ({ scenario, rows: runGuardianPlayerProfiles(scenario) }));
  console.table(scenarios.map(({ scenario, rows }) => ({
    scenario,
    runs: rows.length,
    wins: rows.filter(({ result }) => result === 'victory').length,
    defeats: rows.filter(({ result }) => result === 'defeat').length,
    timeouts: rows.filter(({ result }) => result === 'timeout').length,
    guardianCaptures: rows.filter(({ guardianCaptureSeconds }) => guardianCaptureSeconds !== null).length,
  })));
  console.table(scenarios.flatMap(({ scenario, rows }) => summarizeGuardianPlayerProfiles(rows).map((summary) => ({
    scenario, ...summary,
  }))));
  const current = scenarios.find(({ scenario }) => scenario === 'west')!.rows;
  console.table(current.map(({ profile, variant, result, seconds, firstNorthernFlank, guardianCaptureSeconds }) => ({
    profile, variant, result, seconds, firstNorthernFlank, guardianCaptureSeconds,
  })));
}
