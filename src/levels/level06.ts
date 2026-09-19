import { Owner, Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'double-front', name:localized('VI · SPLIT FIELD','VI · GETEILTES FELD'), short:localized('SPLIT FIELD','GETEILTES FELD'), seed:606,
  blurb:localized('Wetlands split the front. One shield outpost strengthens the western route; the east remains open but pays the HQ shield.','Feuchtgebiete teilen die Front. Ein Schildvorposten stärkt die Westroute; der Osten bleibt offen, muss aber den HQ-Schild bezahlen.'),
  objective:localized('Choose a front: break the western guardian to weaken the HQ, or advance east and spend units against its finite shield.','Wähle eine Front: Brich den westlichen Wächter und schwäche das HQ oder rücke im Osten vor und bezahle den endlichen Schild mit Einheiten.'),
  rule:localized('The guardian neither grows nor receives automatic supply. Your own supply still follows the controlled route toward the rival.','Der Wächter wächst nicht und erhält keinen Auto-Nachschub. Dein eigener Nachschub folgt weiter der kontrollierten Route zum Gegner.'),
  aiThinkMs:1450, aiDelaySeconds:1.45, aiSkill:.72, aiActions:1, neutralUnits:[4,9], enemyGrowthMultiplier:1.025,
  features:{all:true,group:true,relay:false}, theme:'marsh',
  activeRows:[[],[3],[2,3,4],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:Array.from({length:6},(_,index)=>({col:3,row:index+3,terrain:Terrain.Decor,decor:(index+3)%2?'marsh' as const:'water' as const})),
  structures:[
    {id:'enemy-guardian-west',type:'guardian',col:2,row:4,owner:Owner.Enemy,units:7,linkedTo:'enemy-hq',shield:36,footprint:.78},
  ],
});
