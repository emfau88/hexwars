import { Terrain } from '../core/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id: 'path', name: 'I · DER PFAD', short: 'DER PFAD', seed: 101,
  blurb: 'Eine kleine aktive Route schlängelt sich durch eine große, freundliche Landschaft.',
  objective: 'Folge dem Weg zur blauen Basis. Hexes ohne Zahl sind Landschaft und nicht spielbar.',
  rule: 'In dieser Einführung sendest du jeweils 50 %. Die KI ist langsam und die aktive Route bleibt bewusst klein.',
  aiThinkMs: 2500, aiDelaySeconds: 10, aiSkill: 0.42, aiActions: 1,
  neutralUnits: [2, 5], features: { all: false, group: false, relay: false }, theme: 'meadow',
  activeRows: [[], [3], [2, 3], [2, 3], [3, 4], [3], [2, 3], [2, 3], [3, 4], [3], [3, 4], [3], []],
  cells: [
    { col: 3, row: 6, units: 4 },
    ...([[0,4],[1,4],[0,5],[1,5],[0,6]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'water' as const})),
    ...([[5,2],[6,2],[5,3],[6,3],[5,4],[6,4],[0,9],[1,9],[0,10],[1,10]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'forest' as const})),
  ],
});

