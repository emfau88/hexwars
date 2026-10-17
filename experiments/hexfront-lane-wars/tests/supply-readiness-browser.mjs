import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium} from '@playwright/test';
const base=process.env.PUBLIC_PLAY_URL||'http://127.0.0.1:4181/',out=process.env.SUPPLY_STATUS_OUTPUT||'docs/supply-abilities/local';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium'}),checks=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'index.html?qa=1',{timeout:120000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:120000});await p.locator('#loading').waitFor({state:'hidden',timeout:120000});await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden'});
 const snapshot=()=>p.evaluate(()=>__LANE_MATCH__.snapshot());
 const advance=s=>p.evaluate(s=>__LANE_MATCH_QA__.advance(s),s);
 const load=()=>p.evaluate(async()=>{await __LANE_MATCH_QA__.load('central');__LANE_MATCH_QA__.advance(0);});
 const state=()=>p.evaluate(()=>({money:document.querySelector('#supply-money').textContent,buttons:[...document.querySelectorAll('#supply-units button')].map(b=>({disabled:b.getAttribute('aria-disabled'),state:b.dataset.state,badge:b.querySelector('.supply-badge').textContent,label:b.getAttribute('aria-label'),sweep:getComputedStyle(b.querySelector('.ability-sweep')).display,angle:b.style.getPropertyValue('--supply-charge-angle')}))}));
 for(const [width,height] of [[390,844],[320,568],[844,390],[1440,900]]){
  await p.setViewportSize({width,height});await load();let s=await state();assert.equal(s.money,'40 Cr fehlen');assert.ok(s.buttons.every(b=>b.state==='credits'&&b.badge===''&&b.sweep==='none'));await p.screenshot({path:out+'/credits-'+width+'.jpg',quality:85});
  const before=await snapshot();await p.locator('#supply-units [data-type=mech]').click({force:true});assert.deepEqual(await snapshot(),before);assert.match(await p.locator('#notice').textContent(),/40 Credits/);assert.equal(await p.locator('#supply-targeting').isVisible(),false);
  await advance(20);s=await state();assert.equal(s.money,'');assert.ok(s.buttons.every(b=>b.disabled==='false'&&b.badge===''));
  await p.locator('#supply-units [data-type=mech]').click();s=await state();assert.equal(s.money,'80 Cr fehlen');assert.ok(s.buttons.every(b=>b.state==='cooldown'&&b.badge==='30'&&b.sweep==='block'&&b.angle==='0deg'&&b.label.includes('80 Credits')&&b.label.includes('30 Sekunden')));
  const blocked=await snapshot();await p.locator('#supply-units [data-type=rail]').click({force:true});assert.deepEqual(await snapshot(),blocked);const reason=await p.locator('#notice').textContent();assert.match(reason,/80 Credits/);assert.match(reason,/30 Sekunden/);
  await advance(30);s=await state();assert.equal(s.money,'20 Cr fehlen');assert.ok(s.buttons.every(b=>b.sweep==='none'&&b.badge===''));assert.ok(s.buttons.every(b=>b.disabled==='true'));
  await advance(10);s=await state();assert.equal(s.money,'');assert.ok(s.buttons.every(b=>b.disabled==='false'));
  await p.screenshot({path:out+'/ready-'+width+'.jpg',quality:85});
  await load();await advance(50);await p.locator('#supply-units [data-type=drone]').click();await advance(10);s=await state();assert.equal(s.money,'');assert.ok(s.buttons.every(b=>b.disabled==='true'&&b.badge==='20'&&b.sweep==='block'&&Math.abs(parseFloat(b.angle)-120)<.001));
  if(await p.locator('#hint').isVisible())await p.locator('#close-hint').click();
  await p.screenshot({path:out+'/funded-cooldown-'+width+'.jpg',quality:85});
  const layout=await p.evaluate(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON(),tray=rect('.supply-tray'),deck=rect('#command-deck'),header=rect('.game-top');return {tray,deck,header,overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('#supply-units button')].map(b=>{const r=b.getBoundingClientRect();return {...r.toJSON(),hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};})};});
  assert.equal(layout.overflow,false);assert.ok(layout.buttons.every(b=>b.width>=44&&b.height>=44&&b.hit));if(width<1000){assert.ok(layout.tray.top>=layout.header.bottom,JSON.stringify(layout));assert.ok(layout.tray.bottom<=layout.deck.top,JSON.stringify(layout));}
  const paused=await state();await p.waitForTimeout(180);assert.deepEqual(await state(),paused);
  await advance(19.95);assert.ok((await state()).buttons.every(b=>b.disabled==='true'));await advance(.05);assert.ok((await state()).buttons.every(b=>b.disabled==='false'));
  checks.push({width,height,states:['credits only','ready','credits + cooldown','funded + cooldown','ready at exact cooldown boundary'],blockedClickUnchanged:true,layout});
 }
 await p.evaluate(async()=>{await __LANE_MATCH_QA__.load('meadow');__LANE_MATCH_QA__.advance(80);});await p.locator('#supply-units [data-type=rail]').click();assert.ok(await p.locator('#supply-targeting').isVisible());await p.locator('[data-supply-lane="1"]').click();assert.equal(await p.evaluate(()=>__LANE_MATCH__.observe().supplyCooldown),15);checks.push('Two-lane targeting and historical 15-second supply cooldown retained');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/results.json',JSON.stringify({base,checks,errors},null,2));console.log(JSON.stringify({base,checks:checks.map(c=>typeof c==='string'?c:{width:c.width,height:c.height,states:c.states}),errors},null,2));
}finally{await browser.close();}
