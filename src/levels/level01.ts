import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id: 'path', name: localized('I · THE PATH', 'I · DER PFAD'), short: localized('THE PATH', 'DER PFAD'), seed: 101,
  blurb: localized('A short first map for learning the rhythm of moving, capturing and advancing.', 'Eine kurze erste Karte, um den Rhythmus aus Bewegen, Erobern und Vorrücken zu lernen.'),
  objective: localized('Capture the blue base. Choose a numbered neighbor, send 50% and keep the front moving.', 'Erobere die blaue Basis. Wähle ein benachbartes Zahlenfeld, sende 50 % und halte die Front in Bewegung.'),
  rule: localized('Every move sends 50%. Numbered cells are playable; landscape without a number is not.', 'Du sendest jeweils 50 %. Zahlen sind spielbare Felder; Landschaft ohne Zahl ist nicht spielbar.'),
  aiThinkMs: 2500, aiDelaySeconds: 6.5, aiSkill: 0.4, aiActions: 1,
  neutralUnits: [1, 2], growthMultiplier: 2.2, enemyGrowthMultiplier: 1.85,
  bases: { player: { col: 3, row: 9 }, enemy: { col: 3, row: 3 } },
  baseUnits: { player: 23, enemy: 12 },
  features: { all: false, group: false, relay: false }, theme: 'meadow', landscapeStyle: 'meadow-v1',
  activeRows: [[], [], [], [3], [2, 3], [3, 4], [2, 3], [3, 4], [3, 4], [3], [], [], []],
  cells: [
    { col: 2, row: 4, units: 1 }, { col: 3, row: 4, units: 1 },
    { col: 3, row: 5, units: 2 }, { col: 4, row: 5, units: 1 },
    { col: 2, row: 6, units: 1 }, { col: 3, row: 6, units: 2 },
    { col: 3, row: 7, units: 2 }, { col: 4, row: 7, units: 1 },
    { col: 3, row: 8, units: 1 }, { col: 4, row: 8, units: 1 },
    { col: 2, row: 5, terrain: Terrain.Decor, decor: 'meadow' },
    { col: 4, row: 6, terrain: Terrain.Decor, decor: 'meadow' },
    ...([[0,4],[1,4],[0,5],[1,5],[0,6],[1,6],[0,7],[1,7]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'water' as const})),
    ...([[5,1],[6,1],[6,2],[6,3],[0,9],[1,9],[0,10],[1,10],[5,10],[6,10]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'forest' as const})),
  ],
});
