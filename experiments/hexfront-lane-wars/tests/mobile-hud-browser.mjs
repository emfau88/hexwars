import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',out=process.env.MOBILE_QA_OUTPUT||'docs/compact-hud/';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium'}),errors=[],layouts=[],checks=[];
async function boot(p){p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));await p.goto(base+'index.html?qa=1',{timeout:120000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:120000});}
async function layout(p){return p.evaluate(()=>{
 const rect=e=>e.getBoundingClientRect(),front=rect(document.querySelector('#fronts')),deck=rect(document.querySelector('.command-deck')),top=rect(document.querySelector('.game-top'));
 const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 const diag=__LANE_MATCH__.diagnostics(),controls=[...document.querySelectorAll('.factory-open,.route-button,#economy,#supply-units button,#match-play,#open-menu')].filter(b=>b.getClientRects().length&&!b.disabled);
 const buttons=controls.map(b=>{const r=rect(b);return {label:b.getAttribute('aria-label')||b.textContent,...r.toJSON(),uncovered:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
 return {width:innerWidth,height:innerHeight,mission:__LANE_MATCH__.snapshot().mission,clearFraction:(deck.top-front.bottom)/innerHeight,deckHeight:deck.height,hqHidden:diag.headquarters.some(h=>[...document.querySelectorAll('.front')].map(rect).concat([deck,top]).some(r=>overlap(h.bounds,r))),overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,buttons};
});}
const observe=p=>p.evaluate(()=>__LANE_MATCH__.observe());
const advance=(p,s)=>p.evaluate(s=>__LANE_MATCH_QA__.advance(s),s);
const edit=(p,n)=>p.locator('#factory-cards [data-edit="'+n+'"]').click();
try{
 for(const [width,height] of [[1440,960],[1024,768],[768,1024],[390,844],[360,640],[320,568],[412,915],[844,390]]){
  const c=await browser.newContext({viewport:{width,height},hasTouch:width<800,isMobile:width<800,deviceScaleFactor:1}),p=await c.newPage();await boot(p);
  for(const id of ['central','first','meadow']){
   await p.evaluate(id=>__LANE_MATCH_QA__.load(id),id);await advance(p,80);await p.mouse.move(width-2,height/2);await p.waitForTimeout(220);if(await p.locator('#hint').isVisible())await p.locator('#close-hint').click();
   const l=await layout(p);layouts.push(l);console.log(JSON.stringify({...l,buttons:undefined}));
   assert.equal(l.overflow,false,'No scroll overflow');assert.equal(l.hqHidden,false,'HQs remain outside permanent controls');
   assert.ok(l.buttons.every(b=>b.width>=43.9&&b.height>=43.9&&b.uncovered&&b.left>=0&&b.right<=width&&b.top>=0&&b.bottom<=height),JSON.stringify(l.buttons));
   assert.equal(await p.locator('#factory-cards').isVisible(),true);assert.equal(await p.locator('.factory-timer').count(),0);
   assert.equal(await p.locator('.building-marker:visible').count(),0);
   await p.screenshot({path:out+id+'-'+width+'x'+height+'.png'});
   // Each slot can be opened, all form controls can be reached and closing restores focus.
   for(const n of [0,(await observe(p)).factories.length-1]){
    await edit(p,n);assert.equal(await p.locator('#orders').isVisible(),true);assert.equal(await p.locator('#lane-field').isVisible(),id==='meadow');
    const regions=await p.evaluate(()=>({editor:document.querySelector('#orders').getBoundingClientRect().toJSON(),deck:document.querySelector('#command-deck').getBoundingClientRect().toJSON()}));
    assert.ok(regions.editor.top>=0&&regions.editor.bottom<=regions.deck.top-4,JSON.stringify(regions));
    await p.locator('#close-orders').click();assert.equal(await p.locator('#factory-cards [data-edit="'+n+'"]').evaluate(el=>document.activeElement===el),true);
   }
  }
  if(width===390){
   await p.evaluate(()=>__LANE_MATCH_QA__.load('central'));await advance(p,80);
   const money=(await observe(p)).credits;
   await edit(p,0);await p.locator('#factory-type').selectOption('drone');await p.locator('#apply-factory').click();assert.equal((await observe(p)).pending[0].type,'drone');assert.equal((await observe(p)).credits,money-120);
   await edit(p,0);await p.screenshot({path:out+'portrait-order.png'});await p.locator('#cancel-order').click();assert.equal((await observe(p)).credits,money);
   await edit(p,1);await p.locator('#factory-type').selectOption('drone');await p.locator('#apply-factory').click();assert.equal((await observe(p)).pending[1].type,'drone');assert.match(await p.locator('#factory-cards [data-slot="1"]').innerText(),/Mech/);await advance(p,20);assert.equal((await observe(p)).factories[1].type,'drone');
   await p.locator('#economy').click();assert.equal((await observe(p)).economy,true);assert.equal(await p.locator('#economy').isVisible(),false);assert.equal(await p.locator('#economy-done').isVisible(),true);assert.match(await p.locator('#income').innerText(),/3,2/);
   const before=(await observe(p)).credits;await p.locator('#supply-units [data-type="mech"]').tap();assert.equal((await observe(p)).credits,before-80);assert.equal((await observe(p)).supplyCooldown,30);const unavailable=await p.locator('#supply-units [data-type="rail"]').boundingBox();await p.touchscreen.tap(unavailable.x+unavailable.width/2,unavailable.y+unavailable.height/2);assert.equal((await observe(p)).credits,before-80);
   await p.screenshot({path:out+'portrait-upgraded.png'});
   await p.locator('#open-menu').tap();await p.locator('#show-camera').tap();await p.locator('#zoom-in').tap();await p.locator('#camera-home').tap();await p.locator('#close-camera').tap();assert.equal(await p.locator('#camera-panel').isVisible(),false);
   await p.locator('#open-menu').tap();await p.locator('#show-hint').tap();assert.equal(await p.locator('#hint').isVisible(),true);await p.locator('#close-hint').tap();assert.equal(await p.locator('#hint').isVisible(),false);
   await p.evaluate(()=>__LANE_MATCH_QA__.load('meadow'));await advance(p,80);await edit(p,0);await p.locator('#factory-lane').selectOption('1');await p.locator('#apply-factory').tap();assert.equal((await observe(p)).pending[0].lane,1);
   await p.locator('#supply-units [data-type="mech"]').tap();await p.locator('#fronts [data-lane="1"]').tap();assert.equal((await observe(p)).supplyCooldown,15);
   await p.locator('#fronts [data-lane="0"]').tap();assert.equal(await p.locator('#fronts [data-lane="0"] small').isVisible(),true);
   checks.push('Portrait touch: all slots, build/reserve/cancel/refund, refit on next wave, economy collapse, supply cost/cooldown, camera and hints, two-lane routing and supply');
  }
  if(width===1440){await p.evaluate(()=>__LANE_MATCH_QA__.load('central'));await advance(p,100);await edit(p,1);await p.screenshot({path:out+'desktop-order.png'});await p.keyboard.press('Escape');assert.equal(await p.locator('#orders').isVisible(),false);assert.equal(await p.locator('#main-menu').isVisible(),false);await p.locator('#toggle-camera').click();await p.locator('#zoom-in').click();await p.locator('#camera-home').click();await p.locator('#close-camera').click();checks.push('Desktop editor selection, Escape dismisses the editor without opening the menu, camera controls');}
  await c.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'browser-results.json',JSON.stringify({base,layouts,checks,errors},null,2)+'\n');console.log(JSON.stringify({checks,errors}));
}finally{await browser.close();}
