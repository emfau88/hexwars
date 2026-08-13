import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'center', name:localized('III · THE CENTER','III · DAS ZENTRUM'), short:localized('THE CENTER','DAS ZENTRUM'), seed:303,
  blurb:localized('A wide field opens around a heavily defended neutral center.','Ein breites Spielfeld öffnet sich um ein starkes neutrales Zentrum.'),
  objective:localized('Bypass the strong center or gather enough units to take it directly.','Umgehe das starke Zentrum oder sammle genug Einheiten, um es direkt zu übernehmen.'),
  rule:localized('For the first time, one neutral cell holds substantially more defenders than its surroundings.','Erstmals besitzt ein neutrales Feld deutlich mehr Verteidiger als seine Umgebung.'),
  aiThinkMs:2050, aiDelaySeconds:7, aiSkill:.55, aiActions:1, neutralUnits:[3,7],
  features:{all:true,group:false,relay:false}, theme:'ruins',
  activeRows:[[],[3],[2,3,4],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[2,3,4],[2,3,4],[2,3,4],[3],[]],
  cells:[
    {col:3,row:6,units:15},
    ...([[0,5],[6,5],[0,6],[6,6],[0,7],[6,7]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'ruin' as const})),
  ],
});
