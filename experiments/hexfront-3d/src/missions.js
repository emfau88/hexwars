/** Mission data only. Shared simulation, economy and assets are deliberately unchanged. */
const originalArt={
 tracks:[
  [[-1.02,5.31],[-3.7,4.6],[-5.4,2.9],[-5.11,1.77],[-3.06,1.77],[-1.02,1.77],[0,0]],
  [[1.02,-5.31],[3.7,-4.6],[5.4,-2.9],[5.11,-1.77],[3.06,-1.77],[1.02,-1.77],[0,0]],
  [[-1.02,5.31],[1.2,5.0],[4.1,3.3],[5.7,1.1],[5.11,-1.77]],
  [[1.02,-5.31],[-1.4,-5.0],[-4.3,-3.3],[-5.7,-1.1],[-5.11,1.77]],
 ],
 ruins:[[-.96,-1.25,1.22,2.1,-.20],[1.22,1.20,.98,2.1,-.20],[-1.13,-2.40,1.48,0,-.45],[1.22,2.38,1.25,0,2.70]],
 rocks:[[-6.5,-3.05,2.05,1.32,0,.6],[5.55,-4.66,1.80,1.22,1,-.4],[6.95,1.76,2.08,1.12,2,1.5],[-4.65,5.91,1.40,.62,3,-.2],[.15,-7.12,1.35,.69,4,.8],[7.10,-.87,1.10,.64,5,-.7],[.75,6.92,1.48,.48,6,.2]],
 shoulders:[[-1.13,3.04,.91,1.84,3,.18],[1.14,3.05,.96,1.59,1,-.2],[-3.15,.15,.81,1.48,4,1.1],[3.12,.27,.79,1.79,0,-.8]],
 rubble:[[-5.71,-3.72,.67,.35,3,.7],[-6.55,-2.11,.51,.23,5,.4],[5.13,-5.57,.66,.32,4,-.3],[6.10,-3.99,.47,.22,2,.4],[6.57,2.86,.65,.28,3,-.5],[-4.13,6.30,.49,.22,1,1.1],[-2.39,2.49,.64,.36,5,.4],[-1.91,2.90,.37,.19,3,.1],[2.52,.61,.56,.31,4,.6],[2.70,.19,.32,.17,6,.4],[-2.20,-.84,.36,.18,2,-.6],[.30,-2.75,.45,.26,0,.4]],
 vegetation:[[-6.04,-2.1,1.0],[-5.95,-3.91,.8],[4.88,-5.9,1.0],[6.20,2.80,.9],[-4.32,5.95,.9],[.31,6.73,.7],[-2.42,2.62,.65],[2.61,.53,.62],[.47,-2.70,.7]],
 ferns:[[-5.96,-3.9],[5.9,-4.6],[-4.8,5.9],[2.7,.8]],
};
const windpassArt={
 // The two pale approach paths follow the legal north/south ramps exactly.
 // Broad lowland loops remain open; no tall props sit between the camera and a tile.
 tracks:[
  [[0,7.08],[1.022,5.31],[2.044,3.54],[3.066,1.77],[2.044,0],[3.066,-1.77],[4.088,-3.54],[3.066,-5.31],[0,-7.08]],
  [[0,7.08],[-3.066,5.31],[-4.088,3.54],[-3.066,1.77],[-4.088,0],[-5.110,-1.77],[-4.088,-3.54],[-3.066,-5.31],[0,-7.08]],
 ],
 ruins:[[3.45,5.72,.82,0,-.3],[-3.65,-5.60,.85,0,.2]],
 rocks:[[-2.67,7.45,.95,.60,2,.4],[2.77,-7.42,1.1,.68,0,-.7],[4.84,-3.31,.8,.5,3,.5],[-4.85,3.46,.83,.45,4,.8]],
 shoulders:[],
 rubble:[[-2.95,6.92,.35,.17,3,.6],[2.8,-6.88,.38,.17,4,.2],[4.55,3.99,.47,.2,1,.7],[-4.38,-3.99,.4,.2,5,-.4]],
 vegetation:[[-2.52,7.43,.56],[2.8,-7.36,.6],[4.54,-3.12,.50],[-4.55,3.32,.50],[3.24,5.69,.57],[-3.3,-5.77,.58]],
 ferns:[[-2.85,6.98],[2.91,-6.87]],
};
const floodplainArt={
 tracks:[
  [[1.022,5.31],[2.044,3.54],[1.022,1.77],[0,0],[-1.022,-1.77],[-2.044,-3.54],[-1.022,-5.31]],
  [[1.022,5.31],[-3.066,5.31],[-5.11,1.77],[-4.088,0],[-3.066,-1.77],[-4.088,-3.54],[-1.022,-5.31]],
  [[1.022,5.31],[4.088,3.54],[3.066,1.77],[4.088,0],[5.11,-1.77],[3.066,-5.31],[-1.022,-5.31]],
 ],
 ruins:[[2.76,5.66,.80,0,-.4],[-2.8,-5.65,.86,0,.4]],
 rocks:[[-2.50,5.85,.7,.35,4,.8],[2.61,-5.78,.9,.55,0,.4]],
 shoulders:[],rubble:[[-5.40,-1.98,.35,.17,5,.4],[5.40,1.98,.4,.2,6,-.4]],
 vegetation:[[-5.29,1.80,.65],[5.22,-1.79,.65],[-2.76,5.67,.65],[2.80,-5.68,.65]],
 ferns:[[-5.10,2.33],[5.13,-2.33],[-3.42,-3.95],[3.46,3.95]],
};
export const MISSIONS=[
 {
  id:'morgenwacht',index:1,title:'Morgenwacht',subtitle:'Die verlassene Zitadelle',
  briefing:'Sichere das Relais auf dem Festungsplateau und erobere das blaue Hauptquartier.',
  tactic:'Zwei seitliche Aufstiege führen aufs Plateau. Halte deine eroberten Felder mit dem HQ verbunden.',
  fields:37,excluded:[],terrace:['-1,0','0,-1','1,-1','1,0','0,1','-1,1','0,0'],terraceHeight:2,
  rampCells:['-2,1','2,-1'],
  ramps:[['-3,1','-2,1'],['-2,1','-1,1'],['3,-1','2,-1'],['2,-1','1,-1']],
  art:originalArt,
 },
 {
  id:'windpass',index:2,title:'Windpass',subtitle:'Zwei Wege über die Schlucht',
  briefing:'Ein schmaler Talsteg führt direkt zum Gegner. Der längere Höhenweg im Westen erschließt das Relais und die gegnerische Flanke.',
  tactic:'Rechts: kurzer Talsteg und Engpass. Links: längerer Höhenweg mit Relais. Sichere einen Weg und nutze den anderen für einen Flankenangriff.',
  fields:34,excluded:[],compactRim:true,
  rows:[[-4,1,3],[-3,0,3],[-2,-1,3],[-1,-2,-1],[-1,1,2],[0,-2,-2],[0,1,1],[1,-2,1],[2,-3,1],[3,-3,0],[4,-3,-1]],
  hqs:{orange:'-2,4',blue:'2,-4'},starts:{orange:['-2,3','-1,3'],blue:['1,-3','2,-3']},relay:'-2,0',
  terrace:['-2,-1','-2,0','-2,1'],terraceHeight:2,
  rampCells:['-1,-2','-3,2'],
  ramps:[['-3,3','-3,2'],['-3,2','-2,1'],['-2,-1','-1,-2'],['-1,-2','0,-3']],
  art:windpassArt,
 },
 {
  id:'auenstrom',index:3,title:'Auenstrom',subtitle:'Drei Furten, eine geteilte Front',
  briefing:'Ein Fluss trennt die beiden Ufer. Drei schmale Übergänge verbinden sie. Das mittlere Relais verbessert den Nachschub, die äußeren Furten öffnen die Flanken.',
  tactic:'Verteile deine Kräfte auf drei Furten. Binde den Gegner am Relais und bündle Truppen an einem anderen Übergang. Wasser ist unpassierbar.',
  fields:33,excluded:['-3,0','-1,0','1,0','3,0','0,-1','2,-1','-1,1','1,1'],compactRim:true,biome:'river',
  rows:[[-3,-1,3],[-2,-2,3],[-1,-2,3],[0,-3,3],[1,-3,2],[2,-3,2],[3,-3,1]],
  hqs:{orange:'-1,3',blue:'1,-3'},starts:{orange:['-1,2','0,2'],blue:['1,-2','0,-2']},relay:'0,0',relayHeight:1,
  terrace:['-3,2','-3,3','3,-2','3,-3'],terraceHeight:2,rampCells:['-2,2','2,-2','3,-1','-3,1'],
  ramps:[['-1,2','-2,2'],['-2,2','-3,2'],['1,-2','2,-2'],['2,-2','3,-2'],['0,1','0,0'],['0,0','1,-1'],['2,0','3,-1'],['3,-1','3,-2'],['-2,0','-3,1'],['-3,1','-3,2']],
  art:floodplainArt,
 },
];
export function getMission(id='morgenwacht'){
 const mission=MISSIONS.find(m=>m.id===id);
 if(!mission)throw new Error(`Unknown mission: ${id}`);
 return mission;
}
