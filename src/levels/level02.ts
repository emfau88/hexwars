import { Terrain } from '../core/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'two-routes', name:'II · ZWEI WEGE', short:'ZWEI WEGE', seed:202,
  blurb:'Ein grüner und blauer Mittelstreifen trennt zwei schmale Angriffswege.',
  objective:'Entscheide, ob du links, rechts oder auf beiden Seiten Druck machst.',
  rule:'100-%-Sendungen werden freigeschaltet. Die Mitte bleibt Landschaft.',
  aiThinkMs:2250, aiDelaySeconds:8, aiSkill:.49, aiActions:1, neutralUnits:[2,6],
  features:{all:true,group:false,relay:false}, theme:'river',
  activeRows:[[],[3],[2,3,4],[2,4],[2,4],[2,4],[2,4],[2,4],[2,4],[2,4],[2,3,4],[3],[]],
  cells:Array.from({length:7},(_,index)=>({col:3,row:index+3,terrain:Terrain.Decor,decor:(index+3)%3===0?'forest' as const:'water' as const})),
});

