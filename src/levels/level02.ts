import { Terrain } from '../core/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'two-routes', name:'II · ZWEI WEGE', short:'ZWEI WEGE', seed:202,
  blurb:'Zwei erste Ziele zeigen den Unterschied zwischen Reserve und sofortigem Durchbruch.',
  objective:'Wähle: Mit 50 % das schwache Feld sichern oder mit 100 % das starke Feld sofort brechen und deine Basis leeren.',
  rule:'100 % wird freigeschaltet. Es schafft sofort Masse am Ziel, lässt das Quellfeld aber ohne Reserve zurück.',
  aiThinkMs:2250, aiDelaySeconds:8, aiSkill:.49, aiActions:1, neutralUnits:[2,6],
  features:{all:true,group:false,relay:false}, theme:'river',
  activeRows:[[],[3],[2,3,4],[2,4],[2,4],[2,4],[2,4],[2,4],[2,4],[2,4],[2,3,4],[3],[]],
  cells:[
    ...Array.from({length:7},(_,index)=>({col:3,row:index+3,terrain:Terrain.Decor,decor:(index+3)%3===0?'forest' as const:'water' as const})),
    {col:3,row:10,units:4},{col:4,row:10,units:12},{col:3,row:2,units:4},{col:4,row:2,units:12},
  ],
});
