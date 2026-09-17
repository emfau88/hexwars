import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'highland', name:localized('IV · HIGHLANDS','IV · HOCHLAND'), short:localized('HIGHLANDS','HOCHLAND'), seed:404,
  blurb:localized('A strong hill controls the center while both sides remain open.','Ein starker Hügel kontrolliert die Mitte, doch beide Seiten bleiben offen.'),
  objective:localized('Use GROUP to build a foothold on the hill, or draw the rival toward the outer routes.','Nutze GRUPPE, um am Hügel einen Brückenkopf zu bilden, oder lenke den Rivalen auf die äußeren Wege.'),
  rule:localized('Group send unlocks: up to three reachable cells send 50% together. Hills take 35% less damage.','Gruppensendung wird freigeschaltet: Bis zu drei erreichbare Felder senden gemeinsam 50 %. Hügel erleiden 35 % weniger Schaden.'),
  aiThinkMs:1850, aiDelaySeconds:1.05, aiSkill:.61, aiActions:1, neutralUnits:[3,8],
  features:{all:true,group:true,relay:false}, theme:'highland',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[2,3,4],[3],[]],
  cells:[
    {col:3,row:6,terrain:Terrain.Hill,units:12},
    ...([[0,4],[6,4],[0,8],[6,8],[0,9],[6,9]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'mountain' as const})),
  ],
});
