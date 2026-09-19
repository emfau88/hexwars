import { Owner, Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'two-passes', name:localized('V · TWO PASSES','V · DIE ZWEI PÄSSE'), short:localized('TWO PASSES','ZWEI PÄSSE'), seed:505,
  blurb:localized('Two shield outposts anchor the mountain passes before the rival headquarters.','Zwei Schildvorposten sichern die Gebirgspässe vor dem gegnerischen Hauptquartier.'),
  objective:localized('Break one or both guardians before the HQ, or pay the finite shield cost of a direct assault.','Brich einen oder beide Wächter vor dem HQ – oder bezahle bei einem Direktangriff den endlichen Schildpreis.'),
  rule:localized('Each active guardian supplies 48 HQ shield. Guardians do not grow or receive automatic supply; capturing them permanently removes their remaining shield.','Jeder aktive Wächter liefert 48 HQ-Schild. Wächter wachsen nicht und erhalten keinen Auto-Nachschub; ihre Eroberung entfernt den Restschild dauerhaft.'),
  aiThinkMs:1650, aiDelaySeconds:1.25, aiSkill:.67, aiActions:1, neutralUnits:[3,8], enemyGrowthMultiplier:1.02,
  features:{all:true,group:true,relay:false}, theme:'passes',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,4,5],[1,2,4,5],[1,5],[1,2,4,5],[1,2,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:Array.from({length:7},(_,col)=>({col,row:6,terrain:Terrain.Decor,decor:'mountain' as const})).filter(({col})=>![1,5].includes(col)),
  structures:[
    {id:'enemy-guardian-west',type:'guardian',col:1,row:4,owner:Owner.Enemy,units:8,linkedTo:'enemy-hq',shield:48,footprint:.78},
    {id:'enemy-guardian-east',type:'guardian',col:5,row:4,owner:Owner.Enemy,units:8,linkedTo:'enemy-hq',shield:48,footprint:.78},
  ],
});
