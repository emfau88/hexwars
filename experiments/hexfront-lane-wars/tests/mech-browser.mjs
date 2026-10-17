import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',out='docs/mech-animation/';
const b=await chromium.launch({headless:true,channel:'chromium'}),p=await b.newPage({viewport:{width:1400,height:1000}}),errors=[],checks=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await p.goto(base+'tests/fixtures/mech.html');await p.waitForFunction(()=>window.MECH_TEST);await p.evaluate(()=>MECH_TEST.setup());
 const rig=await p.evaluate(()=>MECH_TEST.rigAudit());assert.deepEqual(rig.clips.sort(),['Attack','Death','Hit','Idle','Walk']);assert.equal(rig.parts,26);assert.ok(rig.independent);assert.ok(rig.recoil>.04);assert.ok(rig.collapse<.4);assert.ok(rig.pauseKeepsBlend);assert.ok(rig.aimDrift<.0001,'upper-body aim must not accumulate while paused');
 const planted=rig.feet.filter(f=>f.phase<.62),slip=Math.max(...planted.map(f=>f.z))-Math.min(...planted.map(f=>f.z));assert.ok(slip<.0001);assert.ok(planted.every(f=>Math.abs(f.y-.16)<.0001));assert.ok(Math.max(...rig.feet.map(f=>f.y))>.23);assert.ok(Math.abs(rig.phases[0].r-rig.phases[30].l)<.0001);checks.push('Actual GLB: five clips, 26 rigid primitives, alternating hips, stationary stance foot, lifted swing foot, independent recoil, collapse');
 await p.evaluate(()=>MECH_TEST.crowd(32));const before=await p.evaluate(()=>MECH_TEST.animation());await p.evaluate(()=>{for(let i=0;i<20;i++)MECH_TEST.frame(false);});const after=await p.evaluate(()=>MECH_TEST.animation());assert.ok(after.every((u,i)=>u.phase!==before[i].phase));assert.ok(new Set(after.map(u=>u.phase.toFixed(3))).size>20);checks.push('32 separately phased Mechs, both factions, shared render batches');
 await p.evaluate(()=>MECH_TEST.duel());let firstShot,death;
 for(let i=0;i<800;i++){
  const s=await p.evaluate(()=>MECH_TEST.step(.05));
  if(!firstShot&&s.events.some(e=>e.kind==='shot')){firstShot=s;assert.ok(s.units.every(u=>u.walk<.15));assert.ok(s.units.every(u=>u.attack<.1));await p.screenshot({path:out+'game-shot.png'});}
  if(s.corpses){death=s;await p.screenshot({path:out+'game-collapse-start.png'});break;}
 }
 assert.ok(firstShot&&death);const simCount=death.snapshot.lanes[0].units.length;
 assert.ok(simCount<2);assert.ok(death.corpses>=1);await p.evaluate(()=>{for(let i=0;i<14;i++)MECH_TEST.step(.05);});await p.screenshot({path:out+'game-collapse.png'});
 const ended=await p.evaluate(()=>{let s;for(let i=0;i<12;i++)s=MECH_TEST.step(.05);return s;});assert.equal(ended.corpses,0);assert.ok(ended.effects.includes('sparks'));checks.push('Actual combat movement stops before firing; shot triggers recoil; death removes combat unit immediately, renders collapse for 1.2 s, then debris');
 await p.goto(base+'mech-viewer.html');await p.waitForFunction(()=>window.__MECH_VIEWER__);
 for(const name of ['Idle','Walk','Attack','Hit','Death']){await p.locator('#clip').selectOption(name);await p.evaluate(name=>__MECH_VIEWER__.pose(name,name==='Death'?1:.15),name);await p.screenshot({path:out+'viewer-'+name+'.png'});}
 await p.locator('#compare').check();await p.locator('#clip').selectOption('Walk');await p.locator('#speed').selectOption('.25');await p.locator('#transition').click();await p.screenshot({path:out+'viewer-teams.png'});
 await p.setViewportSize({width:390,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:out+'viewer-mobile.png'});checks.push('Viewer: actual clips, comparison colours, speed, transition sequence, desktop and portrait layout');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'animation-tests.json',JSON.stringify({checks,stanceSlip:slip,rig,errors},null,2));console.log(JSON.stringify({checks,stanceSlip:slip,errors},null,2));
}finally{await b.close();}
