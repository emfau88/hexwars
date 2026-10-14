import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',out='docs/mobile-hud/';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[],layouts=[],checks=[];
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));}
async function layout(p){
 return p.evaluate(()=>{
  const rect=e=>e.getBoundingClientRect(),front=rect(document.querySelector('#fronts')),deck=rect(document.querySelector('.command-deck'));
  const diag=window.__LANE_MATCH__.diagnostics(),overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const hqHidden=diag.headquarters.some(h=>overlap(h.bounds,front)||overlap(h.bounds,deck));
  const controls=[...document.querySelectorAll('.mobile-deck-bar button,#supply-units button,#match-play,#factory-labels .orange:not([hidden]) button')];
  const buttons=controls.map(b=>({label:b.getAttribute('aria-label')||b.textContent,...rect(b).toJSON(),uncovered:b.contains(document.elementFromPoint(rect(b).x+rect(b).width/2,rect(b).y+rect(b).height/2))}));
  return {width:innerWidth,height:innerHeight,mission:window.__LANE_MATCH__.snapshot().mission,clearHeight:deck.top-front.bottom,clearFraction:(deck.top-front.bottom)/innerHeight,deckHeight:deck.height,hqHidden,overflow:document.documentElement.scrollWidth>innerWidth,buttons};
 });
}
try{
 for(const size of [[390,844],[360,640],[320,568],[412,915],[844,390]]){
  const c=await browser.newContext({viewport:{width:size[0],height:size[1]},hasTouch:true,isMobile:true,deviceScaleFactor:1}),p=await c.newPage();watch(p);
  await p.goto(base+'?qa=1');await p.waitForFunction(()=>window.__LANE_MATCH_QA__);
  for(const id of ['first','meadow']){
   await p.evaluate(id=>window.__LANE_MATCH_QA__.load(id),id);await p.evaluate(()=>window.__LANE_MATCH_QA__.advance(80));
   const measured=await layout(p);layouts.push(measured);
   assert.equal(measured.overflow,false);assert.equal(measured.hqHidden,false);
   assert.ok(measured.clearFraction>=(size[0]<651?.57:.45),JSON.stringify(measured));
   assert.ok(measured.deckHeight<=125);
   assert.ok(measured.buttons.every(b=>b.width>=43.9&&b.height>=43.9&&b.uncovered),JSON.stringify(measured.buttons));
   assert.equal(await p.locator('#hint').isVisible(),false);assert.equal(await p.locator('#factory-cards').isVisible(),false);
   await p.screenshot({path:out+id+'-'+size[0]+'x'+size[1]+'.png'});
  }
  await p.locator('#toggle-factories').tap();assert.equal(await p.locator('#factory-cards').isVisible(),true);
  assert.equal(await p.locator('#toggle-factories').getAttribute('aria-expanded'),'true');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  // A touch on a card must hit that card even in a short, scrollable drawer.
  await p.locator('#factory-cards [data-edit="3"]').tap();assert.equal(await p.locator('#orders').isVisible(),true);
  assert.equal(await p.locator('#factory-cards').isVisible(),false);await p.locator('#close-orders').tap();
  if(size[0]===390){
   await p.locator('#toggle-factories').tap();await p.screenshot({path:out+'drawer-390x844.png'});
   await p.locator('#factory-cards [data-edit="0"]').tap();await p.locator('#factory-type').selectOption('rail');await p.locator('#apply-factory').tap();
   assert.equal((await p.evaluate(()=>window.__LANE_MATCH__.observe())).pending[0].type,'rail');
   await p.locator('#factory-labels [data-edit="0"]').tap();await p.locator('#cancel-order').tap();
   assert.equal((await p.evaluate(()=>window.__LANE_MATCH__.observe())).pending[0],null);
   await p.locator('#factory-labels [data-route="1"]').tap();assert.equal((await p.evaluate(()=>window.__LANE_MATCH__.observe())).pending[1].lane,1);
   await p.locator('#toggle-factories').tap();await p.locator('#factory-cards [data-edit="1"]').tap();await p.locator('#factory-type').selectOption('drone');await p.locator('#apply-factory').tap();
   assert.equal((await p.evaluate(()=>window.__LANE_MATCH__.observe())).pending[1].type,'drone');
   await p.locator('#supply-units [data-type="mech"]').tap();const east=await p.evaluate(()=>window.__LANE_MATCH__.diagnostics().laneTargets[1]);await p.touchscreen.tap(east.x,east.y);
   assert.equal((await p.evaluate(()=>window.__LANE_MATCH__.observe())).supplyCooldown,15);
   await p.locator('#fronts [data-lane="0"]').tap();assert.equal(await p.locator('#fronts [data-lane="0"] small').isVisible(),true);
   await p.locator('#fronts [data-lane="0"]').tap();assert.equal(await p.locator('#fronts [data-lane="0"] small').isVisible(),false);
   await p.locator('#toggle-hint').tap();assert.equal(await p.locator('#hint').isVisible(),true);await p.locator('#toggle-hint').tap();
   await p.evaluate(()=>window.__LANE_MATCH_QA__.load('first'));await p.evaluate(()=>window.__LANE_MATCH_QA__.advance(60));
   await p.locator('#toggle-factories').tap();await p.locator('#economy').tap();assert.equal((await p.evaluate(()=>window.__LANE_MATCH__.observe())).economy,true);
   assert.equal(await p.locator('#factory-cards').isVisible(),false);
   checks.push('Touch drawer, build/cancel/refund, refit, free building direction, supply onto road, expandable front details, optional hint, economy closes drawer');
  }
  await c.close();
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(out+'browser-results.json',JSON.stringify({layouts,checks,errors},null,2)+'\n');
 console.log(JSON.stringify({layouts:layouts.map(({buttons,...r})=>r),checks,errors},null,2));
}finally{await browser.close();}
