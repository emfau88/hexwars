import { Terrain } from '../core/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'highland', name:'IV · HOCHLAND', short:'HOCHLAND', seed:404,
  blurb:'Ein starker Hügel kontrolliert die Mitte, doch beide Seiten bleiben offen.',
  objective:'Nutze den Hügel als Brückenkopf oder zwinge die KI auf die Flanken.',
  rule:'Hügelfelder erleiden 35 % weniger Schaden, produzieren aber etwas langsamer.',
  aiThinkMs:1850, aiDelaySeconds:6, aiSkill:.61, aiActions:1, neutralUnits:[3,8],
  features:{all:true,group:false,relay:false}, theme:'highland',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[2,3,4],[3],[]],
  cells:[
    {col:3,row:6,terrain:Terrain.Hill,units:12},
    ...([[0,4],[6,4],[0,8],[6,8],[0,9],[6,9]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'mountain' as const})),
  ],
});

