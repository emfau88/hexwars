import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'ring', name:localized('X · THE RING','X · DER RING'), short:localized('THE RING','DER RING'), seed:1010,
  blurb:localized('The frozen ring is the final front. Two relays open routes around a long ice lake.','Der gefrorene Ring ist die letzte Front. Zwei Relais eröffnen Wege um einen langen Eissee.'),
  objective:localized('Concentrate on one shore, break through to the rival HQ and finish the campaign.','Bündele deine Truppen an einem Ufer, durchbrich die Front zum gegnerischen HQ und schließe die Kampagne ab.'),
  rule:localized('The rival can issue two commands per turn. Relay jumps create bridgeheads; auto supply needs a connected chain of your own cells.','Der Gegner kann zwei Befehle pro Zug geben. Relaissprünge schaffen Brückenköpfe; Auto-Nachschub braucht eine verbundene Kette eigener Felder.'),
  aiThinkMs:820, aiDelaySeconds:2.05, aiSkill:.94, aiActions:2, neutralUnits:[5,12],
  features:{all:true,group:true,relay:true}, theme:'snow',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:[
    ...[4,5,6,7,8].map(row=>({col:3,row,terrain:Terrain.Decor,decor:'water' as const})),
    {col:1,row:6,terrain:Terrain.Relay},{col:5,row:6,terrain:Terrain.Relay},{col:2,row:9,terrain:Terrain.Hill},{col:4,row:3,terrain:Terrain.Hill},
  ],
});
