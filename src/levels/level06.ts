import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'double-front', name:localized('VI · SPLIT FIELD','VI · GETEILTES FELD'), short:localized('SPLIT FIELD','GETEILTES FELD'), seed:606,
  blurb:localized('Wetlands divide the map into two parallel routes that reconnect only near the end.','Ein Feuchtgebiet teilt die Karte in zwei parallele Wege, die erst spät wieder zusammenlaufen.'),
  objective:localized('Keep both sides stable and use group sends to create a sudden concentration on one route.','Halte beide Seiten stabil und bündele mehrere Sendungen gezielt auf einem Weg.'),
  rule:localized('Group send is unlocked: up to three reachable cells send 50% together.','Gruppensendung wird freigeschaltet: Bis zu drei erreichbare Felder senden gemeinsam 50 %.'),
  aiThinkMs:1450, aiDelaySeconds:4.5, aiSkill:.72, aiActions:1, neutralUnits:[4,9],
  features:{all:true,group:true,relay:false,focus:true}, theme:'marsh',
  activeRows:[[],[3],[2,3,4],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:Array.from({length:6},(_,index)=>({col:3,row:index+3,terrain:Terrain.Decor,decor:(index+3)%2?'marsh' as const:'water' as const})),
});
