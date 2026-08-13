import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'two-passes', name:localized('V · TWO PASSES','V · DIE ZWEI PÄSSE'), short:localized('TWO PASSES','ZWEI PÄSSE'), seed:505,
  blurb:localized('A mountain chain blocks the center. Only a left and a right pass remain open.','Eine Bergkette blockiert die Mitte. Nur ein linker und ein rechter Pass bleiben offen.'),
  objective:localized('Choose where to commit first, then decide whether shifting to the other pass is worth the cost.','Lege deinen ersten Schwerpunkt fest und entscheide dann, ob sich der Wechsel zum anderen Pass lohnt.'),
  rule:localized('Mountain hexes are landscape. Two real choke points shape the map.','Berg-Hexes sind Landschaft. Zwei echte Engpässe bestimmen die Karte.'),
  aiThinkMs:1650, aiDelaySeconds:5, aiSkill:.67, aiActions:1, neutralUnits:[3,8],
  features:{all:true,group:false,relay:false}, theme:'passes',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,4,5],[1,2,4,5],[1,5],[1,2,4,5],[1,2,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:Array.from({length:7},(_,col)=>({col,row:6,terrain:Terrain.Decor,decor:'mountain' as const})).filter(({col})=>![1,5].includes(col)),
});
