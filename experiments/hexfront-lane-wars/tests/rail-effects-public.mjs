import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.PUBLIC_PLAY_URL;if(!base)throw Error('PUBLIC_PLAY_URL required');
const b=await chromium.launch({headless:true,channel:'chromium'}),p=await b.newPage({viewport:{width:1440,height:960}}),errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));
async function open(path,ready){await p.goto(base+path,{timeout:120000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(ready,null,{timeout:120000});}
try{
 await open('railgun-viewer.html',()=>window.__RAIL_VIEWER__);
 await p.evaluate(()=>__RAIL_VIEWER__.pose('Charge',.30));await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>__RAIL_VIEWER__.effects.charge.count),2);
 await p.locator('#view').selectOption('teams');await p.evaluate(()=>__RAIL_VIEWER__.pose('Attack',.04));await p.waitForTimeout(100);assert.ok(await p.evaluate(()=>__RAIL_VIEWER__.effects.shots.length===2&&__RAIL_VIEWER__.effects.shots.every(e=>e.beam.visible&&e.impact.material.uniforms.opacity.value>0)));
 await p.screenshot({path:'docs/railgun-effects/public-viewer.png'});checks.push('Public actual GLB viewer: charged rails, strong beam and impact, both factions');
 const module=await p.request.get(base+'src/rail-effects.js');assert.equal(module.status(),200);assert.equal((await module.text()).replaceAll('\r\n','\n'),(await fs.readFile('src/rail-effects.js','utf8')).replaceAll('\r\n','\n'));checks.push('Public shared effects module equals tested local source');
 await open('index.html?qa=1',()=>window.__LANE_MATCH_QA__);await p.locator('#central-opponent').selectOption('pressure');await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden',timeout:120000});await p.evaluate(()=>__LANE_MATCH_QA__.advance(0));await p.locator('#match-play').click();await p.waitForTimeout(850);await p.evaluate(()=>__LANE_MATCH_QA__.pause());
 const d=await p.evaluate(()=>__LANE_MATCH__.diagnostics());assert.equal(d.assets.railAnimated.animations,6);assert.equal(d.assets.mechAnimated.animations,5);assert.equal(d.factoryModel.asset,'factory.glb');
 await p.evaluate(()=>{__LANE_MATCH_QA__.automatePlayer({strategy:'siege'});__LANE_MATCH_QA__.advance(720);});const result=await p.evaluate(()=>__LANE_MATCH__.summary());assert.equal(result.result,'orange');assert.equal(result.hq.blue,0);assert.equal(await p.locator('#match-result').isVisible(),true);checks.push('Public game: existing models preserved; full match ends with actual HQ destruction and victory');
 assert.deepEqual(errors,[]);await fs.writeFile('docs/railgun-effects/public.json',JSON.stringify({base,checks,result,errors},null,2));console.log(JSON.stringify({base,checks,result,errors},null,2));
}finally{await b.close();}
