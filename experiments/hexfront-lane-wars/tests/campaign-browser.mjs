import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {Match} from '../src/match.js';
import {MatchAI} from '../src/match-ai.js';
import {MISSIONS} from '../src/missions.js';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',output=new URL(process.env.CAMPAIGN_QA_OUTPUT||'../docs/m21-qa/',import.meta.url);
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[],checks=[],results=[];
const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));}
watch(page);
const snap=()=>page.evaluate(()=>window.__LANE_MATCH__.snapshot()),info=()=>page.evaluate(()=>window.__LANE_MATCH__.observe());
const advance=s=>page.evaluate(s=>window.__LANE_MATCH_QA__.advance(s),s),load=id=>page.evaluate(id=>window.__LANE_MATCH_QA__.load(id),id);
const capture=name=>page.screenshot({path:fileURLToPath(new URL(name+'.png',output))});
async function boot(p){await p.goto(base+'?qa=1');await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:60000});}
async function assessLayout(p){
 const issues=await p.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};},overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const buttons=[...document.querySelectorAll('#factory-labels .orange:not([hidden]) button')],cards=[...document.querySelectorAll('#factory-cards button')],deck=rect(document.querySelector('.command-deck'));
  const d=window.__LANE_MATCH__.diagnostics(),buildings=d.factories.filter(f=>f.owner==='orange').map(f=>({x:f.bounds.left,y:f.bounds.top,w:f.bounds.right-f.bounds.left,h:f.bounds.bottom-f.bounds.top}));
  const errors=[];
  for(const [i,b] of buttons.entries()){const a=rect(b);if(a.w<44||a.h<44)errors.push('small building touch target');if(overlap(a,deck))errors.push('building control overlaps HUD');if(buildings.some(c=>overlap(a,c)))errors.push('building control overlaps model');if(buttons.slice(i+1).some(c=>overlap(a,rect(c))))errors.push('building controls overlap');}
  for(const b of cards)if(rect(b).h<44)errors.push('small card touch target');
  const hq=d.headquarters.find(h=>h.owner==='blue').bounds,hqRect={x:hq.left,y:hq.top,w:hq.width,h:hq.height};if([...document.querySelectorAll('.front')].some(f=>overlap(hqRect,rect(f))))errors.push('front display covers enemy HQ');
  if(document.documentElement.scrollWidth>innerWidth)errors.push('horizontal overflow');return errors;
 });
 assert.deepEqual(issues,[]);
}
try{
 await boot(page);assert.equal(await page.locator('#battle-error').isVisible(),false);assert.equal(await page.locator('button[data-mission="meadow"]').isDisabled(),true);assert.equal(await page.locator('#ai-profile').count(),0);await capture('01-menu');
 await page.locator('#campaign-go').click();await page.waitForFunction(()=>window.__LANE_MATCH__.snapshot().phase==='running');await advance(0);
 assert.equal((await snap()).lanes.length,1);assert.equal((await info()).factories.length,2);assert.equal(await page.locator('[data-route]').count(),0);
 await advance(51);await page.locator('#factory-cards [data-edit="1"]').click();assert.equal(await page.locator('#lane-field').isVisible(),false);
 await page.locator('#factory-type').selectOption('mech');await page.locator('#apply-factory').click();
 assert.equal((await info()).pending[1].type,'mech');assert.equal((await info()).factories[1],null);
 const ghost=await page.evaluate(()=>window.__LANE_MATCH__.diagnostics().factories.find(f=>f.owner==='orange'&&f.slot===1));assert.equal(ghost.visible,true);assert.equal(ghost.state,'planned');await capture('02-first-ghost');
 await page.locator('#factory-labels [data-edit="1"]').click();await page.locator('#cancel-order').click();assert.equal((await info()).pending[1],null);
 await page.locator('#factory-cards [data-edit="1"]').click();await page.locator('#factory-type').selectOption('mech');await page.locator('#apply-factory').click();await advance(10);assert.equal((await info()).factories[1].type,'mech');
 await capture('03-first-front');await assessLayout(page);
 checks.push('fresh campaign, locked second mission, actual single lane, no direction controls, ghost, cancellation/refund and next-wave activation through UI');
 await load('first');await page.evaluate(()=>window.__LANE_MATCH_QA__.automatePlayer({reactive:true,opening:'factory'}));await advance(720);assert.equal((await info()).result,'orange');
 await page.locator('#result-next').click();await page.waitForFunction(()=>window.__LANE_MATCH__.snapshot().mission==='meadow'&&window.__LANE_MATCH__.snapshot().phase==='running');await advance(0);
 await load('meadow');await advance(52);const before=await info();assert.deepEqual(before.factories.map(f=>!!f),[false,true,true,false]);
 await page.locator('#factory-labels [data-route="1"]').click();let after=await info();assert.equal(after.credits,before.credits);assert.equal(after.pending[1].lane,1);assert.equal(after.factories[1].lane,0);assert.match(await page.locator('#factory-cards [data-route="1"]').textContent(),/OST/);
 await page.locator('#factory-cards [data-route="1"]').click();assert.equal((await info()).pending[1],null);
 await page.locator('#factory-cards [data-edit="0"]').click();await page.locator('#factory-type').selectOption('rail');await page.locator('#factory-lane').selectOption('1');await page.locator('#apply-factory').click();await capture('04-meadow-ghost-arrows');
 await advance(8);await page.locator('#factory-cards [data-edit="1"]').click();await page.locator('#factory-type').selectOption('rail');await advance(10);await page.locator('#apply-factory').click();
 const refit=await page.evaluate(()=>window.__LANE_MATCH__.diagnostics().factories.find(f=>f.owner==='orange'&&f.slot===1));assert.equal(refit.visible,true);assert.equal(refit.state,'refit');await capture('05-refit');
 await advance(35);
 // Real pointer drag onto the rendered west lane.
 const source=await page.locator('#supply-units [data-type="mech"]').boundingBox(),west=await page.evaluate(()=>window.__LANE_MATCH__.diagnostics().laneTargets[0]);
 const credit=(await info()).credits;await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();await page.mouse.move(west.x,west.y,{steps:12});await capture('06-supply-drag');assert.equal(await page.locator('#supply-targeting').isVisible(),true);await page.mouse.up();
 assert.equal((await info()).credits,credit-60);assert.equal((await info()).supplyCooldown,15);assert.ok((await info()).departures.some(u=>u.factory===null&&u.type==='mech'&&u.lane===0));await capture('07-supply-sent');
 const unavailable=await page.locator('#supply-units [data-type="rail"]').boundingBox();await page.mouse.click(unavailable.x+unavailable.width/2,unavailable.y+unavailable.height/2);await page.locator('#fronts [data-lane="1"]').click();assert.equal((await info()).credits,credit-60);
 await advance(30);const tapCredit=(await info()).credits;await page.locator('#supply-units [data-type="rail"]').click();await page.locator('#fronts [data-lane="1"]').click();assert.equal((await info()).credits,tapCredit-60);
 checks.push('symmetric initial factories; building/card direction toggle is free and pending only; refit stays visible; real lane drag and tap supply charge once; cooldown refuses duplicate');
 await assessLayout(page);await capture('08-meadow');await page.setViewportSize({width:1100,height:750});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await assessLayout(page);await capture('11-compact');await page.setViewportSize({width:1440,height:960});
 // Persist/reload the exact paused simulation, including pending refit and AI.
 await page.evaluate(()=>window.__LANE_MATCH_QA__.save());const saved=await snap();await page.reload();await page.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:60000});assert.deepEqual(await snap(),saved);
 await page.locator('#resume-game').click();await advance(0);await page.locator('#open-menu').click();const firstSave=await page.evaluate(()=>JSON.stringify(window.__LANE_MATCH__.campaign().saves.first));
 await page.locator('[data-restart="first"]').click();await page.locator('#cancel-restart').click();assert.equal(await page.evaluate(()=>JSON.stringify(window.__LANE_MATCH__.campaign().saves.first)),firstSave);
 checks.push('reload restores exact state; resume works; cancelled restart preserves the separate mission save');
 // Full browser missions must equal the same headless simulation, through real HQ destruction.
 for(const [id,options] of [['first',{reactive:true,opening:'factory'}],['first',{reactive:false,opening:'factory'}],['meadow',{reactive:true,opening:'economy'}],['meadow',{reactive:false,opening:'economy'}]]){
  await load(id);await page.evaluate(options=>window.__LANE_MATCH_QA__.automatePlayer(options),options);
  const m=new Match({mission:id});m.controllers=[new MatchAI('blue',MISSIONS[id].ai),new MatchAI('orange',options)];m.start();m.advance(720);
  await advance(720);const actual=await page.evaluate(()=>window.__LANE_MATCH__.summary());assert.deepEqual(actual,m.summary());assert.notEqual(actual.result,'unresolved');
  assert.equal(await page.locator('#match-result').isVisible(),true);assert.equal(await page.locator('#match-play').isDisabled(),true);assert.ok(Object.values(actual.hq).includes(0));results.push({id,options,...actual});await capture('result-'+id+'-'+actual.result);
 }
 await page.locator('#result-menu').click();assert.equal(await page.locator('button[data-mission="meadow"]').isDisabled(),false);
 checks.push('four complete browser/headless-identical matches: victory and defeat on each mission; real HQ deaths, result controls, campaign unlock');
 const mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true}),mobile=await mobileContext.newPage();watch(mobile);await boot(mobile);
 await mobile.evaluate(()=>window.__LANE_MATCH_QA__.load('meadow'));await mobile.evaluate(()=>window.__LANE_MATCH_QA__.advance(80));
 await mobile.locator('#factory-labels [data-route="1"]').tap();assert.equal(await mobile.evaluate(()=>window.__LANE_MATCH__.observe().pending[1].lane),1);
 await mobile.locator('#supply-units [data-type="drone"]').tap();await mobile.locator('#fronts [data-lane="1"]').tap();assert.equal(await mobile.evaluate(()=>window.__LANE_MATCH__.observe().supplyCooldown),15);
 await assessLayout(mobile);await mobile.screenshot({path:fileURLToPath(new URL('09-mobile-meadow.png',output))});
 await mobile.evaluate(()=>window.__LANE_MATCH_QA__.advance(31));
 const t=await mobile.locator('#supply-units [data-type="mech"]').boundingBox(),dest=await mobile.evaluate(()=>window.__LANE_MATCH__.diagnostics().laneTargets[0]),cdp=await mobileContext.newCDPSession(mobile),sx=t.x+t.width/2,sy=t.y+t.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy,id:1}]});
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+(dest.x-sx)*i/12,y:sy+(dest.y-sy)*i/12,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await mobile.evaluate(()=>window.__LANE_MATCH__.observe().supplyCooldown),15);
 await mobile.evaluate(()=>window.__LANE_MATCH_QA__.advance(31));await mobile.locator('#supply-units [data-type="rail"]').tap();const east=await mobile.evaluate(()=>window.__LANE_MATCH__.diagnostics().laneTargets[1]);await mobile.touchscreen.tap(east.x,east.y);assert.equal(await mobile.evaluate(()=>window.__LANE_MATCH__.observe().supplyCooldown),15);
 await mobile.evaluate(()=>window.__LANE_MATCH_QA__.load('first'));await mobile.evaluate(()=>window.__LANE_MATCH_QA__.advance(60));await mobile.locator('#supply-units [data-type="rail"]').tap();assert.equal(await mobile.evaluate(()=>window.__LANE_MATCH__.observe().supplyCooldown),15);
 await mobile.screenshot({path:fileURLToPath(new URL('10-mobile-first.png',output))});await assessLayout(mobile);
 checks.push('390×844 touch: building toggle, type-then-lane tap, native touch drag onto road, one-tap single-lane supply; 44 px controls without model/HUD overlap');
 assert.deepEqual(errors,[]);
 await fs.writeFile(new URL('browser-results.json',output),JSON.stringify({checks,errors,results},null,2));console.log(JSON.stringify({checks,errors,results},null,2));
 await mobileContext.close();
}catch(e){await capture('failure');console.error('Browser errors:',errors);throw e;}finally{await browser.close();}
