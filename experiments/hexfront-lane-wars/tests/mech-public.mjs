import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const base=process.env.PUBLIC_PLAY_URL;if(!base)throw Error('PUBLIC_PLAY_URL must be the pinned experiment directory URL');
const b=await chromium.launch({headless:true,channel:'chromium'}),p=await b.newPage({viewport:{width:1440,height:960}}),errors=[],warnings=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>(r.url().startsWith(base)?errors:warnings).push(r.url()+': '+r.failure()?.errorText));
async function open(path,ready){await p.goto(base+path,{timeout:120000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(ready,null,{timeout:120000});}
try{
 await open('mech-viewer.html',()=>window.__MECH_VIEWER__);assert.equal((await p.evaluate(()=>__MECH_VIEWER__.clips)).length,5);
 await p.locator('#clip').selectOption('Walk');await p.locator('#compare').check();await p.locator('#speed').selectOption('.5');await p.screenshot({path:'docs/mech-animation/public-viewer.png'});
 for(const file of ['public/models/mech-animated/mech-rigged.glb','art/mech-animation/mech-rig.blend']){const r=await p.request.get(base+file);assert.equal(r.status(),200);assert.equal(createHash('sha256').update(await r.body()).digest('hex'),createHash('sha256').update(await fs.readFile(file)).digest('hex'));}checks.push('Public viewer loads all five real clips; GLB and Blender downloads byte-identical to tested local files');
 await open('index.html?qa=1',()=>window.__LANE_MATCH_QA__);await p.locator('#central-opponent').selectOption('pressure');await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden',timeout:120000});
 await p.evaluate(()=>__LANE_MATCH_QA__.advance(0));await p.locator('#match-play').click();await p.waitForTimeout(850);await p.evaluate(()=>__LANE_MATCH_QA__.pause());
 const diag=await p.evaluate(()=>__LANE_MATCH__.diagnostics());assert.equal(diag.assets.mechAnimated.animations,5);assert.ok(diag.units.some(u=>u.type==='mech'&&u.animation.walk>.5));assert.equal(diag.factoryModel.asset,'factory.glb');await p.screenshot({path:'docs/mech-animation/public-game.png'});checks.push('Public game uses animated Mechs with running joint states and the preserved GLB factories');
 await p.evaluate(()=>{__LANE_MATCH_QA__.automatePlayer({strategy:'siege'});__LANE_MATCH_QA__.advance(720);});const result=await p.evaluate(()=>__LANE_MATCH__.summary());assert.equal(result.result,'orange');assert.equal(result.hq.blue,0);assert.equal(await p.locator('#match-result').isVisible(),true);checks.push('Public match reaches real HQ destruction and victory screen');
 assert.deepEqual(errors,[]);await fs.writeFile('docs/mech-animation/public.json',JSON.stringify({base,checks,result,errors,warnings},null,2));console.log(JSON.stringify({base,checks,result,errors,warnings},null,2));
}finally{await b.close();}
