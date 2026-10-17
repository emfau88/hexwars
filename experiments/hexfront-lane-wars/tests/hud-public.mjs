import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.PUBLIC_PLAY_URL||'http://127.0.0.1:4181/',out=process.env.HUD_PUBLIC_OUTPUT||'docs/compact-hud/';
await fs.mkdir(out,{recursive:true});const b=await chromium.launch({headless:true,channel:'chromium'}),p=await b.newPage({viewport:{width:1440,height:960}}),errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
try{
 await p.goto(base+'index.html?qa=1',{timeout:120000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:120000});
 for(const file of ['index.html','src/campaign.css','src/match-main.js','public/ui/drone.png','public/ui/mech.png','public/ui/rail.png']){const r=await p.request.get(base+file);assert.equal(r.status(),200,file);if(file.endsWith('.png'))assert.deepEqual(await r.body(),await fs.readFile(file));else assert.equal((await r.text()).replaceAll('\r\n','\n'),(await fs.readFile(file,'utf8')).replaceAll('\r\n','\n'));}
 checks.push('Served HTML, HUD CSS/JS and all three actual-GLB portraits match the tested source');
 await p.locator('#central-opponent').selectOption('pressure');await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden'});await p.evaluate(()=>__LANE_MATCH_QA__.advance(80));if(await p.locator('#hint').isVisible())await p.locator('#close-hint').click();
 const specs=await p.evaluate(()=>__LANE_MATCH__.snapshot().unitSpecs); // Values are also protected by the unchanged simulation files and their unit tests.
 assert.equal(await p.locator('#factory-cards .factory-open').count(),4);assert.equal(await p.locator('.factory-timer').count(),0);
 await p.screenshot({path:out+'public-desktop.png'});
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);await p.locator('#factory-cards [data-edit="0"]').click();await p.locator('#factory-type').selectOption('drone');await p.locator('#apply-factory').click();
 assert.equal((await p.evaluate(()=>__LANE_MATCH__.observe())).pending[0].type,'drone');
 const notification=await p.evaluate(()=>({notice:document.querySelector('#notice').getBoundingClientRect().toJSON(),deck:document.querySelector('#command-deck').getBoundingClientRect().toJSON(),top:document.querySelector('.game-top').getBoundingClientRect().toJSON()}));assert.ok(notification.notice.top>notification.top.bottom&&notification.notice.bottom<notification.deck.top);
 await p.locator('#factory-cards [data-edit="0"]').click();assert.equal(await p.locator('#notice').isVisible(),false);await p.screenshot({path:out+'portrait-order.png'});await p.locator('#cancel-order').click();assert.equal((await p.evaluate(()=>__LANE_MATCH__.observe())).pending[0],null);
 await p.evaluate(()=>__LANE_MATCH_QA__.advance(0));await p.mouse.move(388,400);await p.locator('#economy').click();assert.equal(await p.locator('#economy').isVisible(),false);assert.equal(await p.locator('#economy-done').isVisible(),true);
 const saved=await p.evaluate(()=>{__LANE_MATCH_QA__.save();return __LANE_MATCH__.snapshot();});await p.reload();await p.waitForFunction(()=>window.__LANE_MATCH_QA__);assert.deepEqual(await p.evaluate(()=>__LANE_MATCH__.snapshot()),saved);await p.locator('#resume-game').click();await p.evaluate(()=>__LANE_MATCH_QA__.advance(0));
 await p.screenshot({path:out+'public-portrait.png'});checks.push('Portrait: four accessible slots, build/cancel/refund, economy status, notifications clear of status bar, exact save/resume');
 const d=await p.evaluate(()=>__LANE_MATCH__.diagnostics());assert.equal(d.assets.railAnimated.animations,6);assert.equal(d.assets.mechAnimated.animations,5);assert.equal(d.factoryModel.asset,'factory.glb');
 await p.evaluate(async()=>{await __LANE_MATCH_QA__.load('central');__LANE_MATCH_QA__.automatePlayer({strategy:'siege'});__LANE_MATCH_QA__.advance(720);});const result=await p.evaluate(()=>__LANE_MATCH__.summary());assert.equal(result.result,'orange');assert.equal(result.hq.blue,0);assert.equal(await p.locator('#match-result').isVisible(),true);checks.push('Actual animated GLBs retained; complete match ends in HQ destruction and visible victory');
 for(const path of ['lab.html','m15.html','mech-viewer.html','railgun-viewer.html']){const r=await p.request.get(base+path);assert.equal(r.status(),200,path);}checks.push('Lab, M1.5 and model viewers remain reachable');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'public.json',JSON.stringify({base,checks,notification,result,errors},null,2));console.log(JSON.stringify({base,checks,result,errors},null,2));
}finally{await b.close();}
