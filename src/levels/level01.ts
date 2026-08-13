import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id: 'path', name: localized('I · THE PATH', 'I · DER PFAD'), short: localized('THE PATH', 'DER PFAD'), seed: 101,
  blurb: localized('A compact field presents a choice between tempo and additional territory.', 'Ein kompaktes Spielfeld stellt Tempo gegen zusätzliche Felder und Produktion.'),
  objective: localized('Capture the blue base. Take the shorter, strongly defended route or expand through more lightly defended cells to build production.', 'Erobere die blaue Basis. Nimm den kürzeren, stärker verteidigten Weg oder baue über mehr schwächere Felder Produktion auf.'),
  rule: localized('Every move sends 50%. Numbered cells are playable; landscape without a number is not.', 'Du sendest jeweils 50 %. Zahlen sind spielbare Felder; Landschaft ohne Zahl ist nicht spielbar.'),
  aiThinkMs: 2500, aiDelaySeconds: 6.5, aiSkill: 0.4, aiActions: 1,
  neutralUnits: [2, 5], features: { all: false, group: false, relay: false }, theme: 'meadow', landscapeStyle: 'meadow-v1',
  activeRows: [[], [3], [3], [3], [3, 4, 5], [3, 5], [3, 4, 5], [3, 5], [3, 4, 5], [3], [3], [3], []],
  cells: [
    { col: 3, row: 2, units: 2 }, { col: 3, row: 3, units: 3 },
    { col: 3, row: 4, units: 8 }, { col: 3, row: 5, units: 3 },
    { col: 4, row: 4, units: 2 }, { col: 5, row: 4, units: 2 }, { col: 5, row: 5, units: 2 },
    { col: 3, row: 6, units: 5 }, { col: 4, row: 6, units: 3 }, { col: 5, row: 6, units: 3 },
    { col: 3, row: 7, units: 3 }, { col: 3, row: 8, units: 8 },
    { col: 5, row: 7, units: 2 }, { col: 5, row: 8, units: 2 }, { col: 4, row: 8, units: 2 },
    { col: 3, row: 9, units: 3 }, { col: 3, row: 10, units: 2 },
    ...([[0,4],[1,4],[0,5],[1,5],[0,6],[1,6],[0,7],[1,7]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'water' as const})),
    ...([[5,1],[6,1],[6,2],[6,3],[0,9],[1,9],[0,10],[1,10],[5,10],[6,10]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'forest' as const})),
  ],
});
