import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'relay-island', name:localized('VII · RELAY ISLAND','VII · DIE RELAISINSEL'), short:localized('RELAY ISLAND','RELAISINSEL'), seed:707,
  blurb:localized('A relay sits on a small island between two shores.','Ein Relais liegt auf einer kleinen Insel zwischen zwei Ufern.'),
  objective:localized('Secure the island without neglecting your main territory.','Sichere die Insel, ohne dein Hauptgebiet zu vernachlässigen.'),
  rule:localized('Only a controlled relay can reach targets at hex distance 2.','Nur ein kontrolliertes Relais darf Ziele in Hexdistanz 2 erreichen.'),
  aiThinkMs:1300, aiDelaySeconds:4, aiSkill:.77, aiActions:1, neutralUnits:[4,10],
  features:{all:true,group:true,relay:true,focus:true}, theme:'island',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[2,3,4],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:[
    {col:3,row:6,terrain:Terrain.Relay,units:12},
    ...([[0,5],[1,5],[5,5],[6,5],[0,6],[1,6],[5,6],[6,6],[0,7],[1,7],[5,7],[6,7]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'water' as const})),
  ],
});
