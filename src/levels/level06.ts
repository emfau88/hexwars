import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'double-front', name:localized('VI · SPLIT FIELD','VI · GETEILTES FELD'), short:localized('SPLIT FIELD','GETEILTES FELD'), seed:606,
  blurb:localized('Wetlands divide the map into two parallel routes that reconnect only near the end.','Ein Feuchtgebiet teilt die Karte in zwei parallele Wege, die erst spät wieder zusammenlaufen.'),
  objective:localized('Keep both sides stable. Automatic supply follows the route toward the rival; use group sends to create a breakthrough.','Halte beide Seiten stabil. Der Auto-Nachschub folgt dem Weg zum Gegner; nutze Gruppensendungen für den Durchbruch.'),
  rule:localized('When the fronts meet, automatic supply accelerates. Keep the pressure on both routes.','Sobald die Fronten aufeinandertreffen, wird der Auto-Nachschub schneller. Halte auf beiden Wegen Druck.'),
  aiThinkMs:1450, aiDelaySeconds:1.45, aiSkill:.72, aiActions:1, neutralUnits:[4,9], enemyGrowthMultiplier:1.025,
  features:{all:true,group:true,relay:false}, theme:'marsh',
  activeRows:[[],[3],[2,3,4],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:Array.from({length:6},(_,index)=>({col:3,row:index+3,terrain:Terrain.Decor,decor:(index+3)%2?'marsh' as const:'water' as const})),
});
