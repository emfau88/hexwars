import { Terrain } from '../core/types';
import { localized } from '../i18n/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'signal-gardens', name:localized('VIII · SIGNAL GARDENS','VIII · SIGNALGÄRTEN'), short:localized('SIGNAL GARDENS','SIGNALGÄRTEN'), seed:808,
  blurb:localized('Two relays stand on opposite sides of an open garden landscape.','Zwei Relais stehen auf unterschiedlichen Flanken in einer offenen Gartenlandschaft.'),
  objective:localized('Capture both relays and turn the two flanks into parallel launch lanes.','Erobere beide Relais und nutze die zwei Flanken als parallele Angriffskorridore.'),
  rule:localized('Each controlled relay launches up to 2 hexes; ordinary cells still require connected territory.','Jedes kontrollierte Relais sendet bis zu 2 Hexfelder weit; normale Felder benötigen weiterhin zusammenhängendes Gebiet.'),
  aiThinkMs:1125, aiDelaySeconds:1.75, aiSkill:.82, aiActions:1, neutralUnits:[4,10], enemyGrowthMultiplier:1.035,
  features:{all:true,group:true,relay:true}, theme:'garden',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:[
    {col:1,row:6,terrain:Terrain.Relay,units:8},{col:5,row:6,terrain:Terrain.Relay,units:8},{col:3,row:6,terrain:Terrain.Hill,units:30},
    {col:1,row:4,units:4},{col:5,row:4,units:4},{col:3,row:4,units:20},
    {col:1,row:8,units:4},{col:5,row:8,units:4},{col:3,row:8,units:20},
    {col:3,row:3,units:16},{col:3,row:5,units:16},{col:3,row:7,units:16},{col:3,row:9,units:16},
    ...([[0,3],[6,3],[0,9],[6,9]] as const).map(([col,row])=>({col,row,terrain:Terrain.Decor,decor:'ruin' as const})),
  ],
});
