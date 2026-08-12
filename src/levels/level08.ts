import { Terrain } from '../core/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'signal-gardens', name:'VIII · SIGNALGÄRTEN', short:'SIGNALGÄRTEN', seed:808,
  blurb:'Zwei Relais stehen auf unterschiedlichen Flanken in einer offenen Gartenlandschaft.',
  objective:'Nutze mindestens ein Relais konsequent statt beide halbherzig zu halten.',
  rule:'Relais ersetzen keine Front; nur vom Relais selbst sind Sprünge möglich.',
  aiThinkMs:1125, aiDelaySeconds:3.5, aiSkill:.82, aiActions:1, neutralUnits:[4,10],
  features:{all:true,group:true,relay:true,focus:true}, theme:'garden',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:[
    {col:1,row:6,terrain:Terrain.Relay},{col:5,row:6,terrain:Terrain.Relay},{col:3,row:6,terrain:Terrain.Hill},
    ...([[0,3],[6,3],[0,9],[6,9]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'ruin' as const})),
  ],
});
