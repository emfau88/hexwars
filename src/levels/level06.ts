import { Terrain } from '../core/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'double-front', name:'VI · DOPPELFRONT', short:'DOPPELFRONT', seed:606,
  blurb:'Ein Feuchtgebiet teilt die Karte in zwei parallele Fronten, die erst spät wieder zusammenlaufen.',
  objective:'Halte beide Seiten stabil und nutze Bündelangriffe, um eine Front plötzlich zu überladen.',
  rule:'Bündelangriff wird freigeschaltet: Bis zu drei erreichbare Felder senden gemeinsam 50 %.',
  aiThinkMs:1450, aiDelaySeconds:4.5, aiSkill:.72, aiActions:1, neutralUnits:[4,9],
  features:{all:true,group:true,relay:false}, theme:'marsh',
  activeRows:[[],[3],[2,3,4],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:Array.from({length:6},(_,index)=>({col:3,row:index+3,terrain:Terrain.Decor,decor:(index+3)%2?'marsh' as const:'water' as const})),
});

