import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'two-routes', name:localized('II · TWO ROUTES','II · ZWEI WEGE'), short:localized('TWO ROUTES','ZWEI WEGE'), seed:202,
  blurb:localized('Two opening targets introduce the choice between keeping a reserve and committing immediately.','Zwei erste Ziele führen die Wahl zwischen Reserve und sofortigem Einsatz ein.'),
  objective:localized('NEW: use 50% to secure the weaker cell while keeping a reserve, or use the familiar 100% send against the stronger cell.','NEU: Sichere mit 50 % das schwächere Feld und behalte eine Reserve – oder nutze die vertrauten 100 % gegen das stärkere Feld.'),
  rule:localized('The 50% send is now available. It sends half the units and keeps the other half on the source cell.','50 % wird freigeschaltet. Du sendest die Hälfte der Einheiten und behältst die andere Hälfte auf dem Ausgangsfeld.'),
  aiThinkMs:2250, aiDelaySeconds:.6, aiSkill:.49, aiActions:1, neutralUnits:[2,6], enemyGrowthMultiplier:1.005,
  features:{half:true,all:true,group:false,relay:false}, theme:'river',
  activeRows:[[],[3],[2,3,4],[2,4],[2,5],[2,5],[2,5],[2,5],[2,5],[2,4],[2,3,4],[3],[]],
  cells:[
    ...Array.from({length:7},(_,index)=>({col:3,row:index+3,terrain:Terrain.Decor,decor:(index+3)%3===0?'forest' as const:'water' as const})),
    {col:3,row:10,units:5},{col:4,row:10,units:12},{col:3,row:2,units:5},{col:4,row:2,units:12},
  ],
});
