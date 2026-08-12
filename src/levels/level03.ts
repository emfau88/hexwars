import { Terrain } from '../core/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'center', name:'III · DAS ZENTRUM', short:'DAS ZENTRUM', seed:303,
  blurb:'Eine breite Kampfzone öffnet sich um ein starkes neutrales Zentrum.',
  objective:'Umgehe das starke Zentrum oder sammle genug Truppen für den direkten Durchbruch.',
  rule:'Erstmals besitzt ein neutrales Feld deutlich mehr Verteidiger als seine Umgebung.',
  aiThinkMs:2050, aiDelaySeconds:7, aiSkill:.55, aiActions:1, neutralUnits:[3,7],
  features:{all:true,group:false,relay:false}, theme:'ruins',
  activeRows:[[],[3],[2,3,4],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[2,3,4],[2,3,4],[2,3,4],[3],[]],
  cells:[
    {col:3,row:6,units:15},
    ...([[0,5],[6,5],[0,6],[6,6],[0,7],[6,7]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'ruin' as const})),
  ],
});

