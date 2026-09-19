import { runGuardianSweep } from './guardian-lab';

const rows = runGuardianSweep();

const keys = [...new Set(rows.map((row) => `${row.level}|${row.model}|${row.strength}`))];
console.table(keys.map((key) => {
  const group = rows.filter((row) => `${row.level}|${row.model}|${row.strength}` === key);
  const direct = group.find((row) => row.strategy === 'direct')!;
  const objective = group
    .filter((row) => row.strategy === 'one-guardian' || row.strategy === 'two-guardians')
    .filter((row) => row.result === 'victory')
    .sort((a, b) => a.seconds - b.seconds)[0];
  const split = group.find((row) => row.strategy === 'split-front')!;
  return {
    level: direct.level,
    model: direct.model,
    strength: direct.strength,
    direct: `${direct.result}@${direct.seconds}`,
    directAbsorbed: direct.protectionAbsorbed,
    bestObjective: objective ? `${objective.strategy}@${objective.seconds}` : 'none',
    objectiveGuardians: objective?.guardiansCaptured ?? 0,
    directVsObjective: objective ? Number((direct.seconds / objective.seconds).toFixed(2)) : null,
    split: `${split.result}@${split.seconds}`,
  };
}));
