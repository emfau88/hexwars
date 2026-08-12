import { Terrain } from '../core/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'three-passes', name:'IX · DREI PÄSSE', short:'DREI PÄSSE', seed:909,
  blurb:'Eine helle Gebirgskette lässt drei Übergänge offen. Der mittlere Pass besitzt ein Relais.',
  objective:'Binde Verteidiger an einem Pass und konzentriere den eigentlichen Angriff an einem anderen.',
  rule:'Die KI reagiert schneller. Die äußeren Pässe sind Hügel, der mittlere ist ein Relais.',
  aiThinkMs:960, aiDelaySeconds:3, aiSkill:.88, aiActions:1, neutralUnits:[5,11], mirrorNeutral:true,
  features:{all:true,group:true,relay:true,focus:true}, theme:'snow',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,3,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:[
    ...Array.from({length:7},(_,col)=>({col,row:6,terrain:Terrain.Decor,decor:'mountain' as const})).filter(({col})=>![1,3,5].includes(col)),
    {col:1,row:6,terrain:Terrain.Hill},{col:3,row:6,terrain:Terrain.Relay},{col:5,row:6,terrain:Terrain.Hill},
  ],
});
