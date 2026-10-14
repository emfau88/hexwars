import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {Match} from '../src/match.js';
import {MatchAI,startingFactories} from '../src/match-ai.js';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',browser=await chromium.launch({headless:true});
let phase='boot';
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[],checks=[];
const output=new URL(process.env.MATCH_QA_OUTPUT||(new URL(base).pathname.includes('/dist/')?'../docs/m2-qa/production/':'../docs/m2-qa/'),import.meta.url);await fs.mkdir(output,{recursive:true});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>{const message=phase+': '+r.url()+': '+r.failure()?.errorText;errors.push(message);console.error(message);});
const advance=seconds=>page.evaluate(s=>window.__LANE_MATCH_QA__.advance(s),seconds);
const at=seconds=>page.evaluate(s=>window.__LANE_MATCH_QA__.advance(Math.max(0,s-window.__LANE_MATCH__.snapshot().tick*.05)),seconds);
const info=()=>page.evaluate(()=>window.__LANE_MATCH__.observe());
try{
 await page.goto(base+'?qa=1');await page.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:60000});
 assert.equal(await page.locator('#battle-error').isVisible(),false);
 const metrics=await page.evaluate(()=>window.__LANE_MATCH__.diagnostics());
 assert.equal(metrics.factories.filter(f=>f.visible).length,4);assert.equal(metrics.assets.hq.triangles,44540);
 await page.screenshot({path:new URL('01-setup.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
 await page.locator('#factory-type').selectOption('drone');await page.locator('#factory-lane').selectOption('1');await page.locator('#apply-factory').click();assert.deepEqual((await info()).factories[0],{type:'drone',lane:1});
 await page.locator('#match-play').click();await advance(0);assert.equal((await info()).phase,'running');const started=await info();assert.equal(started.credits,Math.round(started.time*2*100)/100);
 assert.ok((await info()).departures.some(u=>u.factory===0&&u.type==='drone'&&u.lane===1));
 await at(1);const departures=await page.evaluate(()=>window.__LANE_MATCH__.diagnostics().units);assert.ok(departures.length>0&&departures.every(u=>Number.isFinite(u.bounds.width)&&u.bounds.width>5));await page.screenshot({path:new URL('02-factory-exits.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
 phase='controls';checks.push('setup configures real factories; first wave exits its origin buildings; HQ models preserved');
 await at(40);await page.locator('#economy').click();assert.equal((await info()).income,3);assert.equal((await info()).credits,0);
 await at(75);await page.locator('#factory-2').click();await page.locator('#factory-type').selectOption('mech');await page.locator('#factory-lane').selectOption('0');await page.locator('#apply-factory').click();assert.equal((await info()).credits,5);assert.equal((await info()).factories[2],null);
 await page.locator('#cancel-order').click();assert.equal((await info()).credits,105);await page.locator('#factory-type').selectOption('mech');await page.locator('#factory-lane').selectOption('0');await page.locator('#apply-factory').click();
 await at(90);assert.deepEqual((await info()).factories[2],{type:'mech',lane:0});
 checks.push('economy, build reservation, refund and wave-boundary building construction work through controls');
 await at(100);await page.locator('#factory-0').click();await page.locator('#factory-type').selectOption('mech');await page.locator('#factory-lane').selectOption('0');await page.locator('#apply-factory').click();assert.equal((await info()).pending[0].paid,30);
 await at(105);assert.deepEqual((await info()).factories[0],{type:'mech',lane:0});
 await at(125);await page.locator('#open-supply').click();await page.locator('#supply-type').selectOption('rail');await page.locator('#supply-lane').selectOption('1');await page.locator('#send-supply').click();assert.equal((await info()).supplyCooldown,15);assert.ok((await info()).departures.some(u=>u.factory===null&&u.type==='rail'));
 assert.equal(await page.locator('#send-supply').isDisabled(),true);await page.locator('#close-supply').click();await page.locator('#close-orders').click();await page.locator('#enemy-factories-toggle').click();
 await page.screenshot({path:new URL('03-live-match.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});await page.locator('#enemy-factories-toggle').click();
 checks.push('refit, free lane assignment, paid HQ supply, independent cooldown and enemy production inspection work');
 const paused=await page.evaluate(()=>window.__LANE_MATCH__.snapshot());await page.locator('#camera-mode').click();await page.locator('#zoom-in').click();await page.locator('#camera-home').click();assert.deepEqual(await page.evaluate(()=>window.__LANE_MATCH__.snapshot()),paused);
 await page.locator('#match-play').click();await page.waitForFunction(()=>window.__LANE_MATCH__.snapshot().tick>2505);await page.locator('#match-play').click();const stop=await page.evaluate(()=>window.__LANE_MATCH__.snapshot());await page.waitForTimeout(200);assert.deepEqual(await page.evaluate(()=>window.__LANE_MATCH__.snapshot()),stop);
 checks.push('normal playback progresses, pause stops simulation and camera leaves it unchanged');
 for(const size of [{width:1100,height:750},{width:390,height:844}]){await page.setViewportSize(size);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await page.locator('#factory-3').isVisible());await page.screenshot({path:new URL(size.width===390?'05-narrow.png':'04-compact.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});}
 await page.setViewportSize({width:1440,height:960});
 phase='full-matches';const matches=[];
 for(const profile of ['balanced','pressure','economy']){
  await page.evaluate(()=>window.__LANE_MATCH_QA__.reset());await page.locator('#ai-profile').selectOption(profile);
  await page.evaluate(()=>{window.__LANE_MATCH_QA__.automatePlayer({profile:'balanced',opening:'economy',reactive:false});window.__LANE_MATCH_QA__.start();});
  const expected=new Match({blue:startingFactories(profile)});expected.controllers=[new MatchAI('blue',{profile}),new MatchAI('orange',{profile:'balanced',opening:'economy',reactive:false})];expected.start();while(expected.phase==='running'&&expected.time<900){expected.advance(1);expected.drainEvents();}
  assert.equal(expected.phase,'ended',profile+' must actually end');
  for(let i=0;i<Math.ceil(expected.time/15)+1;i++)await advance(15);
  const actual=await page.evaluate(()=>window.__LANE_MATCH__.summary());assert.deepEqual(actual,expected.summary(),profile);
  assert.ok(await page.locator('#match-result').isVisible());assert.equal(actual.hq[actual.result==='orange'?'blue':'orange'],0);
  assert.equal(await page.locator('#next-production').innerText(),'Keine weiteren Wellen');assert.equal(await page.locator('#factory-0').isDisabled(),true);assert.equal(await page.locator('#orders').isVisible(),false);
  await page.screenshot({path:new URL('06-result-'+profile+'.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});matches.push({profile,...actual});console.log(profile+': '+actual.result+' at '+actual.time+'s');
  await page.locator('#new-match').click();assert.equal((await info()).phase,'setup');assert.equal((await info()).credits,200);
 }
 checks.push('three complete browser matches reach real HQ destruction and exactly match headless simulation; restart returns to setup');
 await page.locator('#ai-profile').selectOption('pressure');await page.evaluate(()=>window.__LANE_MATCH_QA__.start());
 const loss=new Match({blue:startingFactories('pressure')});loss.controllers=[new MatchAI('blue',{profile:'pressure'})];loss.start();while(loss.phase==='running'&&loss.time<900){loss.advance(1);loss.drainEvents();}assert.equal(loss.result,'blue');
 for(let i=0;i<Math.ceil(loss.time/15)+1;i++)await advance(15);
 assert.deepEqual(await page.evaluate(()=>window.__LANE_MATCH__.summary()),loss.summary());
 assert.equal(await page.locator('#result-title').innerText(),'Dein HQ wurde zerstört.');
 await page.screenshot({path:new URL('07-defeat.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
 matches.push({profile:'pressure-unanswered',...loss.summary()});checks.push('an unanswered AI attack destroys the player HQ and displays the defeat state');
 phase='lab-navigation';await page.goto(new URL('lab.html',base).href);await page.waitForFunction(()=>window.__COMBAT_LAB__);assert.equal(await page.locator('#scenario').count(),1);
 checks.push('separate M1 diagnostic lab remains available');assert.deepEqual(errors,[]);
 const report={url:base,browser:browser.version(),checks,matches,errors};await fs.writeFile(new URL('browser-results.json',output),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}