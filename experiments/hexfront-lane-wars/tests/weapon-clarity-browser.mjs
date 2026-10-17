import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.PUBLIC_PLAY_URL||'http://127.0.0.1:4181/',out=process.env.WEAPON_OUTPUT||'docs/weapon-clarity/local';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium'}),checks=[],errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  async function open(path,ready){await p.goto(base+path,{timeout:120000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(ready,null,{timeout:120000});}
  for(const type of ['mech','rail']){
   await open('tests/fixtures/'+type+'.html',()=>window.MECH_TEST||window.RAIL_TEST);
   await p.evaluate(async type=>{const f=window.MECH_TEST||window.RAIL_TEST;await f.duel(true);f.view.home();window.weaponFixture=f;},type);
   let fired=false;
   for(let n=0;n<180&&!fired;n++)fired=await p.evaluate(type=>weaponFixture.step(.025).events.some(e=>e.kind==='shot'&&e.type===type),type);
   assert.ok(fired,type+' real shot');
   const audit=await p.evaluate(type=>{
    const v=weaponFixture.view,match=v.currentMatch,before=JSON.stringify(match.save()),effects=v.effects.filter(e=>e[type]),scale=v.frame.scale;
    const out={count:effects.length,scale,teams:effects.map(e=>e.owner),minCore:Math.min(...effects.map(e=>type==='rail'?e.beam.geometry.parameters.radiusTop*e.beam.scale.x*2*scale:e.core.scale.x*2*scale)),parallel:effects.every(e=>!e.rail||e.ends.every((end,i)=>end.clone().sub(e.origins[i]).normalize().dot(e.axis)>1-1e-8)),life:effects.map(e=>e.life)};
    v.renderMatch(match,0);v.renderMatch(match,0);out.renderDoesNotMutate=before===JSON.stringify(match.save());return out;
   },type);
   assert.equal(audit.count,2);assert.deepEqual(audit.teams.sort(),['blue','orange']);assert.ok(audit.parallel&&audit.renderDoesNotMutate);assert.ok(audit.minCore>=(1.79));
   await p.screenshot({path:out+'/'+type+'-'+viewport.width+'.png'});
   const after=await p.evaluate(type=>{const v=weaponFixture.view;v.renderMatch(v.currentMatch,.18);return v.effects.filter(e=>e[type]).map(e=>({beam:type==='rail'?e.beam.visible:e.core.visible,impact:e.impact.material.uniforms.opacity.value}));},type);assert.ok(after.every(e=>!e.beam&&e.impact>0));
   await p.evaluate(()=>weaponFixture.view.renderMatch(weaponFixture.view.currentMatch,.2));assert.equal(await p.evaluate(type=>weaponFixture.view.effects.filter(e=>e[type]).length,type),0);
   if(type==='mech'){const rig=await p.evaluate(()=>MECH_TEST.rigAudit());assert.ok(rig.recoil>.09&&rig.recoil<.12);assert.ok(rig.aimDrift<1e-5&&rig.independent);audit.recoil=rig.recoil;}
   checks.push({viewport,type,...audit});
  }
  await open('index.html?qa=1',()=>window.__LANE_MATCH_QA__);await p.locator('#loading').waitFor({state:'hidden',timeout:120000});
  assert.equal(await p.evaluate(()=>__LANE_MATCH__.snapshot().phase),'setup');assert.equal(await p.evaluate(()=>__LANE_MATCH__.playing),false);
  assert.ok(await p.locator('#start-type-0').isVisible());assert.ok(await p.locator('#start-type-1').isVisible());
  await p.locator('#start-type-0').selectOption('drone');await p.locator('#start-type-1').selectOption('rail');
  await p.screenshot({path:out+'/setup-'+viewport.width+'.png'});await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>__LANE_MATCH__.snapshot().tick),0);
  await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden'});await p.evaluate(()=>__LANE_MATCH_QA__.pause());
  assert.deepEqual(await p.evaluate(()=>__LANE_MATCH__.snapshot().players.orange.factories.filter(Boolean).map(f=>f.type)),['drone','rail']);
  await p.evaluate(()=>__LANE_MATCH_QA__.advance(35));await p.locator('#open-menu').click();const saved=await p.evaluate(()=>__LANE_MATCH__.snapshot());
  await p.locator('#restart-round').click();await p.locator('#cancel-restart').click();assert.deepEqual(await p.evaluate(()=>__LANE_MATCH__.snapshot()),saved);
  await p.locator('#restart-round').click();await p.locator('#confirm-restart').click();assert.equal(await p.evaluate(()=>__LANE_MATCH__.playing),false);assert.deepEqual(await p.evaluate(()=>__LANE_MATCH__.snapshot()),saved);
  await p.locator('#start-type-0').selectOption('mech');await p.locator('#start-type-1').selectOption('mech');await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden'});await p.evaluate(()=>__LANE_MATCH_QA__.pause());
  const fresh=await p.evaluate(()=>__LANE_MATCH__.snapshot());assert.ok(fresh.tick<20);assert.deepEqual(fresh.players.orange.factories.filter(Boolean).map(f=>f.type),['mech','mech']);assert.equal(fresh.players.orange.hq,800);
  await p.evaluate(()=>{__LANE_MATCH_QA__.automatePlayer({strategy:'siege'});__LANE_MATCH_QA__.advance(720);});const result=await p.evaluate(()=>__LANE_MATCH__.summary());assert.notEqual(result.result,'unresolved');assert.ok(Object.values(result.hq).includes(0));
  await p.locator('#result-next').click();assert.ok(await p.locator('#main-menu').isVisible());assert.ok(await p.locator('#start-type-0').isVisible());assert.equal(await p.evaluate(()=>__LANE_MATCH__.playing),false);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await p.locator('#start-type-0').selectOption('mech');await p.locator('#start-type-1').selectOption('rail');await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden'});await p.evaluate(()=>__LANE_MATCH_QA__.pause());
  for(const type of ['mech','rail']){const seen=await p.evaluate(type=>{for(let i=0;i<600;i++){__LANE_MATCH_QA__.advance(.05);if(__LANE_MATCH__.snapshot().lanes.some(l=>l.units.some(u=>u.type===type&&u.cooldown>(type==='mech'?1.15:2.75))))return true;}return false;},type);assert.ok(seen,'real game '+type+' attack');await p.screenshot({path:out+'/game-'+type+'-'+viewport.width+'.png'});}
  checks.push({viewport,setup:'choice before first production, cancel preserves match, restart returns to choice, new units verified, result returns to choice',result});await context.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/results.json',JSON.stringify({base,checks,errors},null,2));console.log(JSON.stringify({base,checks,errors},null,2));
}finally{await browser.close();}
