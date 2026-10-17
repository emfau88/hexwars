import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const out=process.env.RAIL_EFFECTS_OUTPUT||'docs/weapon-clarity/rail-regression/',base=process.env.MATCH_URL||'http://127.0.0.1:4181/';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base+'tests/fixtures/rail.html');await page.waitForFunction(()=>window.RAIL_TEST);await page.evaluate(()=>RAIL_TEST.duel(true));
 let charged=false,shot=false;
 for(let i=0;i<400&&!shot;i++){
  const s=await page.evaluate(()=>RAIL_TEST.step(.025));
  const counts=await page.evaluate(()=>Object.values(RAIL_TEST.view.railLights).map(m=>m.count));
  if(counts.every(n=>n===2)){charged=true;await page.screenshot({path:out+'game-charge.png'});}
  if(s.events.some(e=>e.kind==='shot'&&e.type==='rail')){
   shot=true;const audit=await page.evaluate(()=>{
    const v=RAIL_TEST.view,before=JSON.stringify(RAIL_TEST.match.snapshot()),shots=v.effects.filter(e=>e.rail);
    const states=shots.map(e=>({beam:e.beam.visible,opacity:e.beam.material.opacity,impact:e.impact.position.distanceTo(e.to),origin:e.muzzle.position.distanceTo(e.origins[0]),age:e.age}));
    v.renderMatch(RAIL_TEST.match,0);return {states,unchanged:before===JSON.stringify(RAIL_TEST.match.snapshot()),lights:Object.values(v.railLights).map(m=>m.count)};
   });assert.equal(audit.states.length,2);assert.ok(audit.states.every(s=>s.beam&&s.opacity>.8&&s.impact===0&&s.origin===0));assert.ok(audit.unchanged);assert.deepEqual(audit.lights,[0,0]);await page.screenshot({path:out+'game-shot.png'});
  }
 }
 assert.ok(charged&&shot);checks.push('Real charge and shot events for both factions: two aligned rails, bright instantaneous beams, impacts exactly at targets; no snapshot changes from rendering');
 const decay=await page.evaluate(()=>{const v=RAIL_TEST.view;v.renderMatch(RAIL_TEST.match,.18);return v.effects.filter(e=>e.rail).map(e=>({beam:e.beam.visible,ring:e.ring.material.opacity}));});assert.ok(decay.every(e=>!e.beam&&e.ring>0));
 await page.screenshot({path:out+'game-impact.png'});
 await page.evaluate(()=>RAIL_TEST.view.renderMatch(RAIL_TEST.match,.25));assert.equal(await page.evaluate(()=>RAIL_TEST.view.effects.filter(e=>e.rail).length),0);checks.push('Beam gone after 180 ms; impact outlives beam; effect resources removed after 340 ms');
 await page.goto(base+'railgun-viewer.html');await page.waitForFunction(()=>window.__RAIL_VIEWER__);
 await page.evaluate(()=>__RAIL_VIEWER__.pose('Charge',.30));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>__RAIL_VIEWER__.effects.charge.count),2);await page.screenshot({path:out+'viewer-charge.png'});
 await page.locator('#view').selectOption('teams');await page.evaluate(()=>__RAIL_VIEWER__.pose('Attack',.04));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>__RAIL_VIEWER__.effects.shots.filter(e=>e.root.visible).length),2);await page.screenshot({path:out+'viewer-shot.png'});
 const pause=await page.evaluate(()=>__RAIL_VIEWER__.effects.shots.map(e=>e.beam.material.opacity));await page.waitForTimeout(200);assert.deepEqual(await page.evaluate(()=>__RAIL_VIEWER__.effects.shots.map(e=>e.beam.material.opacity)),pause);
 await page.evaluate(()=>__RAIL_VIEWER__.pose('Attack',.22));await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>__RAIL_VIEWER__.effects.shots.every(e=>!e.beam.visible&&e.ring.material.opacity>0)));await page.screenshot({path:out+'viewer-impact.png'});
 await page.evaluate(()=>__RAIL_VIEWER__.pose('Idle',.1));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>__RAIL_VIEWER__.effects.shots.length),0);
 await page.setViewportSize({width:390,height:844});await page.locator('#view').selectOption('single');await page.evaluate(()=>__RAIL_VIEWER__.pose('Attack',.04));await page.waitForTimeout(100);await page.screenshot({path:out+'viewer-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 checks.push('Shared viewer effects: both teams, frozen pause, scrubbed decay, idle clears effects, portrait viewport');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'tests.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
