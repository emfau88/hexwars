import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const base=process.env.PUBLIC_PLAY_URL;if(!base)throw Error('PUBLIC_PLAY_URL required');
const b=await chromium.launch({headless:true,channel:'chromium'}),p=await b.newPage({viewport:{width:1440,height:960}}),errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>{if(r.url().startsWith(base))errors.push(r.url()+': '+r.failure()?.errorText);});
async function open(path,ready){await p.goto(base+path,{timeout:120000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(ready,null,{timeout:120000});}
try{
 await open('railgun-viewer.html',()=>window.__RAIL_VIEWER__);assert.equal((await p.evaluate(()=>__RAIL_VIEWER__.inspect())).clips.length,6);await p.locator('#clip').selectOption('Walk');await p.locator('#view').selectOption('teams');await p.locator('#speed').selectOption('.5');await p.screenshot({path:'docs/railgun-animation/public-viewer.png'});
 for(const file of ['public/models/railgun-animated/railgun.glb','public/models/railgun-animated/railgun-lod.glb','art/railgun-animation/railgun-animated.blend']){const r=await p.request.get(base+file);assert.equal(r.status(),200);assert.equal(createHash('sha256').update(await r.body()).digest('hex'),createHash('sha256').update(await fs.readFile(file)).digest('hex'));}checks.push('Public six-clip viewer, team comparison; GLB, LOD and Blender downloads byte-identical');
 await open('index.html?qa=1',()=>window.__LANE_MATCH_QA__);await p.locator('#central-opponent').selectOption('pressure');await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden',timeout:120000});await p.evaluate(()=>__LANE_MATCH_QA__.advance(0));await p.locator('#match-play').click();await p.waitForTimeout(850);await p.evaluate(()=>__LANE_MATCH_QA__.pause());
 let d=await p.evaluate(()=>__LANE_MATCH__.diagnostics());assert.equal(d.assets.railAnimated.animations,6);assert.equal(d.assets.mechAnimated.animations,5);assert.equal(d.factoryModel.asset,'factory.glb');assert.ok(d.units.some(u=>u.type==='rail'&&u.animation.walk>.5));
 await p.evaluate(()=>__LANE_MATCH_QA__.advance(7));d=await p.evaluate(()=>__LANE_MATCH__.diagnostics());const rail=d.units.find(u=>u.type==='rail'&&u.owner==='orange');await p.mouse.click(rail.x,rail.y);assert.match(await p.locator('#selected-details').innerText(),/Reichweite 5\.2/);await p.screenshot({path:'docs/railgun-animation/public-game.png'});checks.push('Public game walks articulated Railguns from factories; actual model picking displays range 5.2; original Mech/factory preserved');
 await p.evaluate(()=>{__LANE_MATCH_QA__.automatePlayer({strategy:'siege'});__LANE_MATCH_QA__.advance(720);});const result=await p.evaluate(()=>__LANE_MATCH__.summary());assert.equal(result.result,'orange');assert.equal(result.hq.blue,0);assert.equal(await p.locator('#match-result').isVisible(),true);checks.push('Public full match reaches real HQ destruction and victory screen');
 assert.deepEqual(errors,[]);await fs.writeFile('docs/railgun-animation/public.json',JSON.stringify({base,checks,result,errors},null,2));console.log(JSON.stringify({base,checks,result,errors},null,2));
}finally{await b.close();}
