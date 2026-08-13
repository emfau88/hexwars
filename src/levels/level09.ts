import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'three-passes', name:localized('IX · THREE PASSES','IX · DREI PÄSSE'), short:localized('THREE PASSES','DREI PÄSSE'), seed:909,
  blurb:localized('A pale mountain chain leaves three crossings open. The middle pass contains a relay.','Eine helle Gebirgskette lässt drei Übergänge offen. Der mittlere Pass besitzt ein Relais.'),
  objective:localized('Choose between the staying power of the outer hills and the mobility of the central relay, then concentrate on one crossing.','Wähle zwischen der Stabilität der äußeren Hügel und der Beweglichkeit des mittleren Relais und konzentriere dich auf einen Übergang.'),
  rule:localized('The rival reacts faster. The outer passes are hills; the middle pass is a relay.','Die KI reagiert schneller. Die äußeren Pässe sind Hügel, der mittlere ist ein Relais.'),
  aiThinkMs:960, aiDelaySeconds:3, aiSkill:.88, aiActions:1, neutralUnits:[5,11], mirrorNeutral:true,
  features:{all:true,group:true,relay:true,focus:true}, theme:'snow',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,3,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:[
    ...Array.from({length:7},(_,col)=>({col,row:6,terrain:Terrain.Decor,decor:'mountain' as const})).filter(({col})=>![1,3,5].includes(col)),
    {col:1,row:6,terrain:Terrain.Hill},{col:3,row:6,terrain:Terrain.Relay},{col:5,row:6,terrain:Terrain.Hill},
  ],
});
