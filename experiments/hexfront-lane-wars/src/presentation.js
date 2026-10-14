import { Combat } from './simulation.js';

// Scenario orchestration only; no waves, factories, economy or HQ combat.
export const PRESENTATIONS = [
  { id:'encounter', name:'Begegnung im Wiesental', description:'Zwei vorbereitete Gefechte · alle drei Robotertypen', lanes:[
    {orange:{drone:2,mech:1,rail:1},blue:{drone:1,mech:2,rail:1},gap:18},
    {orange:{drone:1,mech:2,rail:1},blue:{drone:2,mech:1,rail:1},gap:18}
  ]},
  { id:'counter', name:'Schwarm trifft schwere Front', description:'West: Schwarm gegen Mech + Fernkampf · Ost: Mechs gegen Schwarm', lanes:[
    {orange:{drone:4},blue:{mech:2,rail:2},gap:16},
    {orange:{mech:4},blue:{drone:4},gap:16}
  ]},
  { id:'mirror', name:'Spiegelgefecht', description:'Identische Verbände · identische Regeln für beide Fraktionen', lanes:[
    {orange:{drone:2,mech:1,rail:1},blue:{drone:2,mech:1,rail:1},gap:18},
    {orange:{drone:1,mech:1,rail:2},blue:{drone:1,mech:1,rail:2},gap:18}
  ]}
];
export function createPresentation(id='encounter') {
  const preset = PRESENTATIONS.find(p=>p.id===id) || PRESENTATIONS[0];
  return { preset, lanes:preset.lanes.map((config,lane)=>{
    const game=new Combat({...config,lane,spacing:.9});
    // Only the demonstration's initial formation is more generously spaced.
    // The lab presets, movement, separation and combat core remain unchanged.
    for(const u of game.units){const sign=u.owner==='orange'?-1:1,depth=Math.abs(u.p-15)-config.gap/2;u.p=15+sign*(config.gap/2+depth*1.3);}
    return game;
  }) };
}
