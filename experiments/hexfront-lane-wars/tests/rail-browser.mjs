import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',out='docs/railgun-animation/';
const b=await chromium.launch({headless:true,channel:'chromium'}),p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(base+'tests/fixtures/rail.html');await p.waitForFunction(()=>window.RAIL_TEST);await p.evaluate(()=>RAIL_TEST.setup());
 const rig=await p.evaluate(()=>RAIL_TEST.rigAudit());assert.deepEqual(rig.clips.sort(),['Attack','Charge','Death','Hit','Idle','Walk']);assert.equal(rig.parts,32);assert.ok(rig.independent&&rig.recoil>.08&&rig.collapse<.37);assert.ok(rig.aimDrift<1e-6&&rig.pitchDrift<1e-6);
 let slip=0;for(const leg of ['LF','LB','RF','RB']){const planted=rig.feet.filter(f=>f.leg===leg&&f.phase<.64);slip=Math.max(slip,Math.max(...planted.map(f=>f.z))-Math.min(...planted.map(f=>f.z)));assert.ok(planted.every(f=>Math.abs(f.y-.135)<.0001));assert.ok(rig.feet.some(f=>f.leg===leg&&f.y>.20));}assert.ok(slip<.0001);checks.push('Six real GLB clips; four planted stance feet, lifted swing feet, <0.1 mm slip; independent recoil, collapse, no aim drift');
 const lod=await p.evaluate(()=>{const v=RAIL_TEST.view;return v.library.orange.rail.every(p=>v.railLowParts[p.node]);});assert.ok(lod,'Every articulated primitive has a matching LOD');
 await p.evaluate(()=>RAIL_TEST.crowd(32));const before=await p.evaluate(()=>RAIL_TEST.animation());await p.evaluate(()=>{for(let i=0;i<15;i++)RAIL_TEST.frame(false);});const after=await p.evaluate(()=>RAIL_TEST.animation());assert.ok(after.every((u,i)=>u.phase!==before[i].phase));assert.ok(new Set(after.map(u=>u.phase.toFixed(3))).size>20);assert.deepEqual([...new Set(after.map(u=>u.owner))].sort(),['blue','orange']);checks.push('32 independent robots, both factions, rigid shared render batches');
 await p.evaluate(()=>{RAIL_TEST.crowd(1);for(let i=0;i<20;i++)RAIL_TEST.frame();});
 for(const zoom of [1,3.2]){const point=await p.evaluate(zoom=>{const v=RAIL_TEST.view;v.selected='0:0';if(zoom>1)v.focusSelected();else v.home();for(let i=0;i<12;i++)RAIL_TEST.frame();return v.diagnostics().units[0];},zoom);await p.mouse.click(point.x,point.y);assert.equal(await p.evaluate(()=>RAIL_TEST.view.selected),'0:0');}checks.push('Moved instance remains selectable in overview and full-detail geometry');
 await p.evaluate(()=>RAIL_TEST.duel());let charge=false,shot=false;
 for(let i=0;i<400&&!shot;i++){
  const s=await p.evaluate(()=>RAIL_TEST.step(.05));
  if(await p.evaluate(()=>[...RAIL_TEST.view.poses.values()].some(p=>p.unit.type==='rail'&&p.animator.charge>0)))charge=true;
  if(s.events.some(e=>e.kind==='shot'&&e.type==='rail')){shot=true;assert.ok(s.units.some(u=>u.attack<.1));assert.ok(await p.evaluate(()=>[...RAIL_TEST.view.poses.values()].filter(p=>p.unit.type==='rail').every(p=>p.animator.charge===0)));await p.screenshot({path:out+'game-shot.png'});
   assert.ok(s.muzzleErrors.length&&s.muzzleErrors.every(e=>e<1e-7));
  }
 }assert.ok(charge&&shot);checks.push('Existing target windup charges weapon; actual shot triggers recoil, clears glow and starts beam at animated muzzle');
 let hit=false;for(let i=0;i<180&&!hit;i++){const s=await p.evaluate(()=>RAIL_TEST.step(.05));hit=await p.evaluate(()=>[...RAIL_TEST.view.poses.values()].some(p=>p.unit.type==='rail'&&p.animator.hitAge<.1));}assert.ok(hit,'Actual surviving Railgun hit triggers mechanical reaction');checks.push('Actual nonlethal damage triggers Railgun hit reaction');
 await p.evaluate(()=>RAIL_TEST.duel(true));let death;
 for(let i=0;i<400;i++){const s=await p.evaluate(()=>RAIL_TEST.step(.05));if(s.corpses){death=s;break;}}
 assert.ok(death);assert.equal(death.snapshot.lanes[0].units.length,0);assert.equal(death.corpses,2);await p.evaluate(()=>{for(let i=0;i<14;i++)RAIL_TEST.step(.05);});await p.screenshot({path:out+'game-collapse.png'});
 const end=await p.evaluate(()=>{let s;for(let i=0;i<12;i++)s=RAIL_TEST.step(.05);return s;});assert.equal(end.corpses,0);assert.ok(end.effects.includes('sparks'));checks.push('Both factions collapse after genuine lethal shots; dead units leave simulation immediately and visual corpses expire after 1.2 s');
 await p.goto(base+'railgun-viewer.html');await p.waitForFunction(()=>window.__RAIL_VIEWER__);
 for(const name of ['Idle','Walk','Charge','Attack','Hit','Death']){await p.evaluate(n=>__RAIL_VIEWER__.pose(n,n==='Death'?1.1:n==='Walk'?.75:.15),name);await p.screenshot({path:out+'viewer-'+name+'.png'});}
 await p.locator('#view').selectOption('teams');await p.locator('#transition').click();await p.waitForTimeout(1000);await p.locator('#speed').selectOption('.25');await p.locator('#travel').check();await p.screenshot({path:out+'viewer-teams.png'});
 await p.setViewportSize({width:390,height:844});await p.locator('#view').selectOption('single');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:out+'viewer-mobile.png'});checks.push('Actual animation viewer: six clips, transitions, slow motion, travel, team comparison, portrait');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'animation-tests.json',JSON.stringify({checks,stanceSlip:slip,rig,errors},null,2));console.log(JSON.stringify({checks,stanceSlip:slip,errors},null,2));
}finally{await b.close();}
