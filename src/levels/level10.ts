import { Terrain } from '../core/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'ring', name:'X · DER RING', short:'DER RING', seed:1010,
  blurb:'Im Finale laufen mehrere Fronten um einen langen See. Zwei Relais verbinden die Seiten.',
  objective:'Lies die ganze Karte, bilde einen Schwerpunkt und durchbrich die gegnerische Basis.',
  rule:'Die KI darf zwei Aktionen pro Denkzyklus ausführen. Alle bisherigen Regeln gelten.',
  aiThinkMs:820, aiDelaySeconds:2.5, aiSkill:.94, aiActions:2, neutralUnits:[5,12],
  features:{all:true,group:true,relay:true,focus:true}, theme:'finale',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:[
    ...[4,5,6,7,8].map(row=>({col:3,row,terrain:Terrain.Decor,decor:'water' as const})),
    {col:1,row:6,terrain:Terrain.Relay},{col:5,row:6,terrain:Terrain.Relay},{col:2,row:9,terrain:Terrain.Hill},{col:4,row:3,terrain:Terrain.Hill},
  ],
});
