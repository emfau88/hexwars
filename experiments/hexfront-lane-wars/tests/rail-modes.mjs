import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',out='docs/railgun-animation/';
const browser=await chromium.launch({headless:true,channel:'chromium'}),p=await browser.newPage({viewport:{width:1440,height:960}}),errors=[],checks=[],results=[];
p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(base+'index.html?qa=1');await p.waitForFunction(()=>window.__LANE_MATCH_QA__);
 await p.locator('#central-opponent').selectOption('pressure');await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden'});await p.evaluate(()=>__LANE_MATCH_QA__.advance(0));
 let d=await p.evaluate(()=>__LANE_MATCH__.diagnostics());assert.equal(d.assets.railAnimated.animations,6);assert.equal(d.assets.mechAnimated.animations,5);assert.equal(d.factoryModel.asset,'factory.glb');
 await p.locator('#match-play').click();await p.waitForTimeout(700);await p.evaluate(()=>__LANE_MATCH_QA__.pause());d=await p.evaluate(()=>__LANE_MATCH__.diagnostics());assert.ok(d.units.some(u=>u.type==='rail'&&u.animation.walk>.8));await p.screenshot({path:out+'factory-exit.png'});
 await p.evaluate(()=>{__LANE_MATCH_QA__.automatePlayer({strategy:'siege'});__LANE_MATCH_QA__.advance(120);__LANE_MATCH_QA__.save();});const saved=await p.evaluate(()=>__LANE_MATCH__.snapshot());await p.screenshot({path:out+'battle.png'});
 await p.reload();await p.waitForFunction(()=>window.__LANE_MATCH_QA__);assert.deepEqual(await p.evaluate(()=>__LANE_MATCH__.snapshot()),saved);
 await p.evaluate(()=>{__LANE_MATCH_QA__.automatePlayer({strategy:'siege'});__LANE_MATCH_QA__.advance(600);});const result=await p.evaluate(()=>__LANE_MATCH__.summary());assert.ok(['orange','blue'].includes(result.result));assert.ok(result.hq.orange===0||result.hq.blue===0);results.push(result);await p.screenshot({path:out+'victory.png'});checks.push('Full central match through real HQ destruction, new Railgun walks out of factory; original Mech/factory GLBs; save/reload exact');
 for(const id of ['first','meadow']){await p.evaluate(id=>__LANE_MATCH_QA__.load(id),id);await p.evaluate(()=>{__LANE_MATCH_QA__.automatePlayer({strategy:'balanced'});__LANE_MATCH_QA__.advance(90);});d=await p.evaluate(()=>__LANE_MATCH__.diagnostics());assert.equal(d.assets.railAnimated.animations,6);assert.equal(d.factoryModel.asset,'factory.glb');await p.screenshot({path:out+'mission-'+id+'.png'});checks.push(id+' mission loads, produces and fights with preserved models');}
 await p.goto(base+'m15.html?qa=1');await p.waitForFunction(()=>window.__LANE_WARS_QA__);await p.evaluate(()=>__LANE_WARS_QA__.advance(7));d=await p.evaluate(()=>__LANE_WARS__.diagnostics());assert.equal(d.assets.railAnimated.animations,6);await p.screenshot({path:out+'m15.png'});checks.push('M1.5 two-lane demo retains new articulated renderer');
 await p.goto(base+'lab.html');await p.waitForFunction(()=>window.__COMBAT_LAB__);assert.ok(await p.locator('#scenario').count());checks.push('Combat laboratory remains separately accessible');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'modes.json',JSON.stringify({base,checks,results,errors},null,2));console.log(JSON.stringify({checks,results,errors},null,2));
}finally{await browser.close();}
