import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'two-routes', name:localized('II · TWO ROUTES','II · ZWEI WEGE'), short:localized('TWO ROUTES','ZWEI WEGE'), seed:202,
  blurb:localized('Two opening targets reveal the difference between keeping a reserve and committing immediately.','Zwei erste Ziele zeigen den Unterschied zwischen Reserve und sofortigem Einsatz.'),
  objective:localized('Choose: secure the weaker cell with 50%, or overcome the stronger cell with 100% and leave your base empty.','Wähle: Mit 50 % das schwächere Feld sichern oder mit 100 % das stärkere Feld sofort überwinden und deine Basis leeren.'),
  rule:localized('The 100% send is now available. It creates immediate strength at the target but leaves the source without a reserve.','100 % wird freigeschaltet. Es schafft sofort Stärke am Ziel, lässt das Quellfeld aber ohne Reserve zurück.'),
  aiThinkMs:2250, aiDelaySeconds:8, aiSkill:.49, aiActions:1, neutralUnits:[2,6],
  features:{all:true,group:false,relay:false}, theme:'river',
  activeRows:[[],[3],[2,3,4],[2,4],[2,4],[2,4],[2,4],[2,4],[2,4],[2,4],[2,3,4],[3],[]],
  cells:[
    ...Array.from({length:7},(_,index)=>({col:3,row:index+3,terrain:Terrain.Decor,decor:(index+3)%3===0?'forest' as const:'water' as const})),
    {col:3,row:10,units:4},{col:4,row:10,units:12},{col:3,row:2,units:4},{col:4,row:2,units:12},
  ],
});
