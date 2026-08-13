import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'signal-gardens', name:localized('VIII · SIGNAL GARDENS','VIII · SIGNALGÄRTEN'), short:localized('SIGNAL GARDENS','SIGNALGÄRTEN'), seed:808,
  blurb:localized('Two relays stand on opposite sides of an open garden landscape.','Zwei Relais stehen auf unterschiedlichen Flanken in einer offenen Gartenlandschaft.'),
  objective:localized('Commit to at least one relay instead of spreading support across both.','Konzentriere dich auf mindestens ein Relais, statt deine Unterstützung auf beide zu verteilen.'),
  rule:localized('Relays do not replace connected territory; only the relay itself can make a distance-2 send.','Relais ersetzen kein zusammenhängendes Gebiet; nur das Relais selbst kann über Distanz 2 senden.'),
  aiThinkMs:1125, aiDelaySeconds:3.5, aiSkill:.82, aiActions:1, neutralUnits:[4,10],
  features:{all:true,group:true,relay:true,focus:true}, theme:'garden',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:[
    {col:1,row:6,terrain:Terrain.Relay},{col:5,row:6,terrain:Terrain.Relay},{col:3,row:6,terrain:Terrain.Hill},
    ...([[0,3],[6,3],[0,9],[6,9]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'ruin' as const})),
  ],
});
