import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/dist/',out=process.env.FACTORY_GAME_OUTPUT||'docs/factory-integration/';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[],hostWarnings=[],checks=[];
const p=await browser.newPage({viewport:{width:1440,height:960}});
p.on('pageerror',e=>errors.push(e.message));
p.on('requestfailed',r=>(r.url().startsWith(new URL('.',base).href)?errors:hostWarnings).push(r.url()+': '+r.failure()?.errorText));
const diag=()=>p.evaluate(()=>window.__LANE_MATCH__.diagnostics());
const observe=()=>p.evaluate(()=>window.__LANE_MATCH__.observe());
const advance=s=>p.evaluate(s=>window.__LANE_MATCH_QA__.advance(s),s);
const capture=n=>p.screenshot({path:out+n+'.png'});
try{
 await p.goto(base+'?qa=1',{timeout:90000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();
 await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:90000});
 await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden'});await advance(0);
 let d=await diag();assert.equal(d.factoryModel.asset,'factory.glb');
 assert.equal(d.factories.filter(f=>f.visible).length,4);assert.ok(d.factories.filter(f=>f.visible).every(f=>f.door===1&&f.segments.length===4));
 await capture('production');
 await advance(8);d=await diag();assert.ok(d.factories.filter(f=>f.visible).every(f=>f.door===0));
 const f=d.factories.find(f=>f.owner==='orange'&&f.slot===1);
 // A real click on the geometry must still select its factory slot after batching.
 await p.mouse.click((f.bounds.left+f.bounds.right)/2,(f.bounds.top+f.bounds.bottom)/2);
 assert.equal(await p.locator('#orders').isVisible(),true);assert.match(await p.locator('#factory-number').textContent(),/02/);
 await p.locator('#close-orders').click();
 checks.push('Actual GLB in the playable main mode, production opens four segments, idle doors close, model click opens the correct factory editor');
 await advance(34);await p.locator('#factory-cards [data-edit="0"]').click();await p.locator('#factory-type').selectOption('drone');await p.locator('#apply-factory').click();
 d=await diag();assert.equal(d.factories.find(f=>f.owner==='orange'&&f.slot===0).ghost,true);assert.ok(d.factories.filter(f=>f.visible&&f.slot!==0).every(f=>!f.ghost&&f.opacity===1));await capture('construction');
 await advance(17.5);d=await diag();assert.ok(d.factories.find(f=>f.owner==='orange'&&f.slot===0).door>0);
 await advance(.5);d=await diag();const built=d.factories.find(f=>f.owner==='orange'&&f.slot===0);assert.equal(built.ghost,false);assert.equal(built.module,'drone');assert.equal(built.door,1);
 await p.locator('#factory-cards [data-edit="1"]').click();await p.locator('#factory-type').selectOption('rail');await p.locator('#apply-factory').click();
 assert.equal((await diag()).factories.find(f=>f.owner==='orange'&&f.slot===1).module,'mech');await advance(20);
 assert.equal((await diag()).factories.find(f=>f.owner==='orange'&&f.slot===1).module,'rail');
 await p.evaluate(()=>window.__LANE_MATCH_QA__.save());const snapshot=await p.evaluate(()=>window.__LANE_MATCH__.snapshot());
 await p.reload();await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:90000});assert.deepEqual(await p.evaluate(()=>window.__LANE_MATCH__.snapshot()),snapshot);
 assert.equal((await diag()).factories.find(f=>f.owner==='orange'&&f.slot===1).module,'rail');
 checks.push('Transparent construction without material leakage; pre-opening; production module changes at the paid refit wave; save/reload keeps simulation and models');
 const fixture=await p.evaluate(async()=>{
  const T=await import('three'),{createFactories,updateFactories,disposeFactories,factoryDiagnostics}=await import('./src/factory-view.js'),{Match}=await import('./src/match.js'),{MISSIONS,missionRoute}=await import('./src/missions.js');
  const cases=[];
  for(const id of ['central','first','meadow']){
   const scene=new T.Scene(),items=await createFactories(scene,MISSIONS[id]),m=new Match({mission:id});
   for(const owner of ['orange','blue'])m.players[owner].factories=Array.from({length:m.slotCount},(_,slot)=>({type:['drone','mech','rail'][slot%3],lane:slot%m.laneCount}));
   m.start();const before=JSON.stringify(m.snapshot());updateFactories(items,m);
   if(JSON.stringify(m.snapshot())!==before)throw Error('Renderer changed the simulation');
   const shared=new Map(),colours={};
   for(const item of Object.values(items))item.root.traverseVisible(o=>{if(o.isMesh){const key=o.name;if(shared.has(key)&&shared.get(key)!==o.geometry)throw Error('Geometry not shared');shared.set(key,o.geometry);if(o.material.name==='Team')colours[item.owner]=o.material.color.getHexString();}});
   if(colours.orange!=='f49a43'||colours.blue!=='469dce')throw Error('Wrong faction colours');
   const count=factoryDiagnostics(items);if(count.batches>55)throw Error('Factory draw-call budget exceeded');
   if(id==='central'){
    // Keep a real deployed robot at its original gate after the normal production hold.
    const unit=structuredClone(m.lanes[0].units.find(u=>u.factory===0&&u.owner==='orange'));
    m.advance(8);m.lanes[0].units=[unit];m.transit=[];updateFactories(items,m);
    if(items['orange:0'].open!==1)throw Error('Gate closed on a stationary deployed robot');
    m.lanes[0].units=[];m.time+=1.1;updateFactories(items,m);
    if(items['orange:0'].open!==0)throw Error('Gate did not close after the doorway cleared');
   }
   m.players.orange.factories[0]=null;m.players.orange.pending[0]={type:'drone',lane:0,paid:120};updateFactories(items,m);
   items['orange:0'].root.traverseVisible(o=>{if(o.isMesh&&(o.material.opacity!==.34||o.material.depthWrite))throw Error('Construction mesh is not transparent');});
   items['blue:0'].root.traverseVisible(o=>{if(o.isMesh&&(o.material.opacity!==1||!o.material.depthWrite))throw Error('Construction transparency leaked to enemy');});
   cases.push({mission:id,...count,colours,constructionMaterialsIsolated:true});disposeFactories(items);
  }
  return cases;
 });
 checks.push('All three missions, every slot and production module, shared geometry, both faction colours; gate stays open for a stationary robot; view does not mutate match state');
 for(const id of ['first','meadow','central']){
  await p.evaluate(async id=>{await window.__LANE_MATCH_QA__.load(id);window.__LANE_MATCH_QA__.advance(16);},id);
  assert.equal((await diag()).factoryModel.asset,'factory.glb');await capture(id);
 }
 await p.setViewportSize({width:390,height:844});await capture('portrait');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 const report={base,checks,fixture,errors,hostWarnings};await fs.writeFile(out+'browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(e){await capture('failure');throw e;}finally{await browser.close();}
