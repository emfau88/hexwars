import { Combat } from '../src/simulation.js';
import { SCENARIOS } from '../src/scenarios.js';
import { UNITS } from '../src/rules.js';

export function compositions(batches = 4) {
  const result = [];
  for (let drone = 0; drone <= batches; drone++) for (let mech = 0; mech <= batches - drone; mech++) result.push({ drone, mech, rail: batches - drone - mech });
  return result;
}
export function mirrorCheck(a, b, options = {}) {
  const normal = new Combat({ orange: a, blue: b, ...options }).run();
  const reverse = new Combat({ orange: b, blue: a, ...options }).run();
  const flipped = normal.result === 'orange' ? 'blue' : normal.result === 'blue' ? 'orange' : normal.result;
  return { ok: reverse.result === flipped && reverse.time === normal.time && JSON.stringify(normal.survivors.orange) === JSON.stringify(reverse.survivors.blue) && JSON.stringify(normal.survivors.blue) === JSON.stringify(reverse.survivors.orange), normal, reverse };
}
const cases = SCENARIOS.map(s => ({ id: s.id, ...mirrorCheck(s.orange, s.blue) }));
const armies = compositions();
const matrix = armies.map(a => armies.map(b => new Combat({ orange: a, blue: b }).run().result));
const ranking = armies.map((army, i) => ({ army, wins: matrix[i].filter(r => r === 'orange').length, losses: matrix[i].filter(r => r === 'blue').length, draws: matrix[i].filter(r => r === 'draw').length, unresolved: matrix[i].filter(r => r === 'unresolved').length }));
const mixedCounters = armies.map(army => ({ army, variations: [6, 12, 18].map(gap => ({ gap, ...new Combat({ orange: army, blue: { mech: 2, rail: 2 }, gap }).run() })) })).filter(x => x.variations.some(v => v.result === 'orange'));
const sweeps = [], mirrorErrors = [], unresolved = [];
for (const gap of [6, 12, 18]) for (const spacing of [0.6, 0.72, 0.85]) {
  const results = armies.map(a => armies.map(b => new Combat({ orange: a, blue: b, gap, spacing }).run()));
  for (let a = 0; a < armies.length; a++) for (let b = 0; b < armies.length; b++) {
    const normal = results[a][b], reverse = results[b][a];
    const flipped = normal.result === 'orange' ? 'blue' : normal.result === 'blue' ? 'orange' : normal.result;
    if (reverse.result !== flipped || reverse.time !== normal.time || JSON.stringify(normal.survivors.orange) !== JSON.stringify(reverse.survivors.blue) || JSON.stringify(normal.survivors.blue) !== JSON.stringify(reverse.survivors.orange)) mirrorErrors.push({ gap, spacing, a, b });
    if (normal.result === 'unresolved') unresolved.push({ gap, spacing, a, b });
  }
  sweeps.push({ gap, spacing, matrix: results.map(row => row.map(r => r.result)), durationRange: [Math.min(...results.flat().map(r => r.time)), Math.max(...results.flat().map(r => r.time))], ranking: armies.map((army, i) => ({ army, wins: results[i].filter(r => r.result === 'orange').length, losses: results[i].filter(r => r.result === 'blue').length, draws: results[i].filter(r => r.result === 'draw').length })) });
}
console.log(JSON.stringify({ rules: UNITS, measurementLimitSeconds: 90, comparisons: sweeps.length * armies.length ** 2, mirrorErrors, unresolved, cases, ranking, mixedCounters, armies, sweeps }, null, 2));
if (mirrorErrors.length || unresolved.length) process.exitCode = 1;
