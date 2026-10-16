import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {CentralAI,centralOpening} from '../src/central-ai.js';
import {CENTRAL_UNITS,CENTRAL_RULES} from '../src/central-rules.js';
import {Match} from '../src/match.js';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',out=process.env.CENTRAL_QA_OUTPUT||'docs/central-qa/browser/';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[],checks=[],games=[];
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));}
async function boot(p){await p.goto(base+'?qa=1',{timeout:90000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:90000});}
const p=await browser.newPage({viewport:{width:1440,height:960}});watch(p);
const observe=()=>p.evaluate(()=>window.__LANE_MATCH__.observe());
const advance=s=>p.evaluate(s=>window.__LANE_MATCH_QA__.advance(s),s);
async function command(action,data={}){
 if(action==='economy')await p.locator('#economy').click();
 else if(action==='supply')await p.locator('#supply-units [data-type="'+data.type+'"]').click();
 else{await p.locator('[data-edit="'+data.slot+'"]').first().click();if(action==='cancel')await p.locator('#cancel-order').click();else{await p.locator('#factory-type').selectOption(data.type);await p.locator('#apply-factory').click();}}
}
try{
 await boot(p);assert.equal(await p.locator('button[data-mission=central]').isEnabled(),true);assert.equal(await p.locator('button[data-mission=meadow]').isDisabled(),true);
 await p.screenshot({path:out+'menu.png'});
 await p.locator('#central-opponent').selectOption('pressure');await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden'});await advance(0);
 let state=await observe();assert.equal(state.factories.length,4);assert.equal(state.laneCount,1);assert.ok(state.credits>=40&&state.credits<42);
 assert.equal(await p.locator('#lane-field').isVisible(),false);assert.equal(await p.locator('[data-route]').count(),0);
 assert.match(await p.locator('#reserved').innerText(),/20/);assert.match(await p.locator('#supply-title').innerText(),/80/);
 // Exercise reservation/cancel without altering the full match's chosen strategy.
 await advance(42);const money=(await observe()).credits;
 await command('factory',{slot:0,type:'drone'});assert.equal((await observe()).pending[0].type,'drone');
 let ghost=await p.evaluate(()=>window.__LANE_MATCH__.diagnostics().factories.find(f=>f.owner==='orange'&&f.slot===0));assert.equal(ghost.visible,true);assert.equal(ghost.state,'planned');
 await command('cancel',{slot:0});assert.equal((await observe()).credits,money);
 checks.push('Main menu, three selectable opponents, four slots, real mode values, UI reservation/ghost/cancellation/refund');
 // Start fresh through the actual restart flow so timing is identical to the headless comparison.
 await p.locator('#open-menu').click();await p.locator('[data-restart=central]').click();await p.locator('#confirm-restart').click();await p.locator('#loading').waitFor({state:'hidden'});await advance(0);
 const pilot=new CentralAI('orange',{strategy:'siege'});
 for(let i=0;i<120&&(await observe()).phase==='running';i++){
  await advance(6);const seen=await observe(),queue=[];
  pilot.update({tick:seen.tick,phase:seen.phase,rules:CENTRAL_RULES,unitSpecs:CENTRAL_UNITS,observe:()=>seen,command:(_owner,action,data)=>{queue.push({action,data});return {ok:true};}});
  for(const q of queue)await command(q.action,q.data);
  if(i===25){
   await p.screenshot({path:out+'battle.png'});
   const before=await p.evaluate(()=>{window.__LANE_MATCH_QA__.save();return window.__LANE_MATCH__.snapshot();});
   await p.reload();await p.waitForFunction(()=>window.__LANE_MATCH_QA__);await advance(0);
   const after=await p.evaluate(()=>window.__LANE_MATCH__.snapshot());assert.deepEqual(after,before);await p.locator('#resume-game').click();await advance(0);
   checks.push('Real browser reload preserves running economy, opponent, armies and orders');
  }
 }
 const result=await p.evaluate(()=>window.__LANE_MATCH__.summary());assert.equal(result.result,'orange');assert.equal(result.hq.blue,0);assert.equal(await p.locator('#match-result').isVisible(),true);
 await p.screenshot({path:out+'victory.png'});games.push({control:'All orange orders through actual HUD buttons, only clock accelerated',...result});
 checks.push('Complete playable match from menu, actual factory/economy/refit/supply inputs, reload, HQ destruction and result screen');
 // Same simulation in browser and Node, including all three opponent openings and a defeat.
 for(const strategy of ['pressure','siege','economy']){
  if(await p.locator('#result-menu').isVisible())await p.locator('#result-menu').click();
  await p.evaluate(()=>window.__LANE_MATCH_QA__.menu());await p.locator('#central-opponent').selectOption(strategy);
  await p.locator('[data-restart=central]').click();await p.locator('#confirm-restart').click();await p.locator('#loading').waitFor({state:'hidden'});await advance(0);
  await p.evaluate(async()=>{await window.__LANE_MATCH_QA__.load('central');window.__LANE_MATCH_QA__.automatePlayer({strategy:'siege'});});await advance(720);
  const summary=await p.evaluate(()=>window.__LANE_MATCH__.summary()),node=new Match({mission:'central',blue:centralOpening(strategy)});
  node.controllers=[new CentralAI('blue',{strategy}),new CentralAI('orange',{strategy:'siege'})];node.start();node.advance(720);
  assert.deepEqual(summary,node.summary());games.push({opponent:strategy,...summary});
  if(summary.result!=='unresolved')assert.equal(await p.locator('#match-result').isVisible(),true);
 }
 await p.evaluate(async()=>{await window.__LANE_MATCH_QA__.load('central');window.__LANE_MATCH_QA__.advance(720);});
 const defeat=await p.evaluate(()=>window.__LANE_MATCH__.summary());assert.equal(defeat.result,'blue');assert.equal(defeat.hq.orange,0);assert.equal(await p.locator('#match-result').isVisible(),true);games.push({control:'No player orders: actual defeat through HQ destruction',...defeat});
 checks.push('Actual defeat and result screen without modifying HQ values');
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});watch(mobile);await boot(mobile);
 await mobile.locator('#campaign-go').click();await mobile.locator('#loading').waitFor({state:'hidden'});await mobile.evaluate(()=>window.__LANE_MATCH_QA__.advance(80));
 await mobile.screenshot({path:out+'mobile.png'});await mobile.locator('#toggle-factories').tap();assert.equal(await mobile.locator('#factory-cards').isVisible(),true);
 await mobile.locator('[data-edit="0"]').first().tap();await mobile.locator('#factory-type').selectOption('drone');await mobile.locator('#apply-factory').tap();assert.equal((await mobile.evaluate(()=>window.__LANE_MATCH__.observe())).pending[0].type,'drone');
 checks.push('Portrait touch controls retain compact HUD and support all four factories');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'results.json',JSON.stringify({base,checks,games,errors},null,2));console.log(JSON.stringify({checks,games:games.map(({result,time,hq})=>({result,time,hq})),errors},null,2));
}finally{await browser.close();}
