import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {PRESENTATIONS,createPresentation} from '../src/presentation.js';
const browser=await chromium.launch({headless:true}),base=process.env.BATTLE_URL||'http://127.0.0.1:4181/m15.html';
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1}),errors=[],requests=[],checks=[];
let phase='initial-load';
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>{const message=`${phase}: ${r.url()}: ${r.failure()?.errorText}`;errors.push(message);console.error(message);});page.on('request',r=>requests.push(r.url()));
try {
  await page.goto(`${base}?qa=1`);await page.waitForFunction(()=>window.__LANE_WARS__,null,{timeout:60000});
  assert.equal(await page.locator('#battle-error').isVisible(),false);
  assert.equal(await page.locator('#battle-stage canvas').count(),1);
  const metrics=await page.evaluate(()=>window.__LANE_WARS__.diagnostics());
  assert.equal(metrics.assets.hoverbot.triangles,14070);assert.equal(metrics.assets.mech.triangles,23502);assert.equal(metrics.assets.hq.triangles,44540);
  assert.equal(metrics.assets.mech.skins,0);assert.equal(metrics.assets.mech.animations,0);
  assert.equal(metrics.units.length,28);assert.equal(metrics.zoom,1);
  phase='interaction';
  for(const hq of metrics.headquarters){assert.ok(hq.bounds.top>90&&hq.bounds.bottom<770,`${hq.owner} HQ inside unobscured overview`);}
  assert.ok(metrics.units.filter(u=>u.type==='drone').every(u=>u.bounds.width>=20&&u.bounds.height>=16));
  for(const type of ['drone','mech','rail'])for(const owner of ['orange','blue'])assert.ok(metrics.units.some(u=>u.type===type&&u.owner===owner));
  checks.push('actual HQ/drone/mech GLBs loaded; both factions and all three robot types visible');
  assert.equal(await page.locator('.factory-card:disabled').count(),4);assert.match(await page.locator('.economy-preview').innerText(),/VORSCHAU/);
  checks.push('four factory cards disabled; economy and HQ values explicitly preview only');
  const before=await page.evaluate(()=>window.__LANE_WARS__.snapshot());
  await page.locator('#camera-mode').click();await page.locator('#zoom-in').click();await page.locator('#camera-home').click();
  assert.deepEqual(await page.evaluate(()=>window.__LANE_WARS__.snapshot()),before);
  checks.push('camera switch, zoom and reset do not mutate simulation');
  await page.locator('#camera-mode').click();
  const unit=(await page.evaluate(()=>window.__LANE_WARS__.diagnostics())).units.find(u=>u.type==='mech'&&u.owner==='orange');
  await page.mouse.click(unit.x,unit.y);assert.equal(await page.locator('#selection').isVisible(),true);assert.match(await page.locator('#selected-name').innerText(),/Mech/);
  await page.locator('#focus-unit').click();assert.equal((await page.evaluate(()=>window.__LANE_WARS__.diagnostics())).zoom,3.2);await page.locator('#close-selection').click();await page.locator('#camera-home').click();
  checks.push('instanced robot picking, honest animation label and close-up work');
  await page.locator('#battle-play').click();await page.waitForFunction(()=>window.__LANE_WARS__.snapshot()[0].time>=.5);await page.locator('#battle-play').click();
  const paused=await page.evaluate(()=>window.__LANE_WARS__.snapshot());await page.waitForTimeout(220);assert.deepEqual(await page.evaluate(()=>window.__LANE_WARS__.snapshot()),paused);
  checks.push('real requestAnimationFrame playback advances and pause freezes combat');
  for(const {id} of PRESENTATIONS) {
    await page.locator('#presentation').selectOption(id);await page.locator('#battle-reset').click();
    await page.evaluate(()=>window.__LANE_WARS_QA__.advance(40));
    const expected=createPresentation(id).lanes.map(g=>g.run());assert.deepEqual(await page.evaluate(()=>window.__LANE_WARS__.summary()),expected,id);
    checks.push(`both rendered lanes exactly match headless results: ${id}`);
  }
  await page.locator('#presentation').selectOption('encounter');
  await page.evaluate(()=>window.__LANE_WARS_QA__.advance(8.05));
  const during=await page.evaluate(()=>window.__LANE_WARS__.diagnostics());assert.ok(during.effects>0);assert.ok(await page.locator('.health:not([hidden])').count()>0);
  checks.push('actual shot/hit/death events create effects and damaged-unit HP bars');
  await page.locator('#battle-reset').click();
  for(const viewport of [{width:1100,height:750},{width:390,height:844}]){await page.setViewportSize(viewport);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('#battle-play').isVisible(),true);}
  checks.push('compact desktop and narrow layout retain working controls without horizontal overflow');
  assert.ok(requests.filter(u=>u.startsWith('http')).every(u=>u.startsWith(new URL(base).origin)));
  assert.ok(!requests.some(u=>/hexfront-mixed-squads|hexfront-3d/.test(u)));
  checks.push('all runtime requests stay inside this local standalone variant');
  phase='open-lab';await page.locator('.lab-link').click();await page.waitForFunction(()=>window.__COMBAT_LAB__);assert.equal(await page.locator('#scenario').count(),1);phase='return-to-game';await page.locator('footer a').click();await page.waitForFunction(()=>window.__LANE_MATCH__);
  checks.push('game → retained combat lab → game round trip works');
  assert.deepEqual(errors,[]);
  const report={url:base,browser:browser.version(),checks,errors,assets:metrics.assets,initialDrawCalls:metrics.drawCalls,initialTriangles:metrics.triangles};
  await fs.writeFile(new URL(process.env.VISUAL_QA_OUTPUT||'../docs/m21-qa/regression-m15.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
