import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',out=process.env.DEPLOY_QA_OUTPUT||'docs/deployment-qa/browser/';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],cases=[];
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
try{
 await page.goto(new URL('tests/fixtures/deployment.html',base).href,{timeout:90000});
 const gate=page.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();
 await page.waitForFunction(()=>window.DEPLOY_TEST,null,{timeout:90000});
 for(const owner of ['orange','blue'])for(const slot of [null,0,1,2,3])for(const type of ['drone','mech','rail']){
  const before=await page.evaluate(config=>window.DEPLOY_TEST.prepare(config),{owner,slot,type});
  const after=await page.evaluate(seconds=>window.DEPLOY_TEST.step(seconds),type==='rail'?.35:.2);
  const u=after.units.find(u=>u.id===after.actor),v=after.units.find(u=>u.id===after.enemy),original=before.units.find(u=>u.id===before.actor);
  assert.ok(u.hp<original.hp);assert.ok(v.hp<110);assert.deepEqual(u.world,original.world);
  assert.ok(after.shots.some(e=>e.source===u.id));assert.ok(after.effects>0);
  const dx=v.world.x-u.world.x,dz=v.world.z-u.world.z;
  const alignment=(dx*u.forward.x+dz*u.forward.z)/Math.hypot(dx,dz);
  assert.ok(alignment>.999,'rendered model faces its real combat target at the gate');
  cases.push({owner,slot,type,hp:u.hp,enemyHP:v.hp,firstShot:after.shots.find(e=>e.source===u.id).time,alignment});
  if(type==='mech'&&slot===0)await page.screenshot({path:out+owner+'-gate.png'});
  await page.evaluate(()=>window.DEPLOY_TEST.clearEnemy());
  const resumed=await page.evaluate(()=>window.DEPLOY_TEST.step(.1)),r=resumed.units.find(u=>u.id===resumed.actor);
  assert.ok(r.deployment.elapsed>0);assert.ok(Math.hypot(r.world.x-u.world.x,r.world.z-u.world.z)<.2);
 }
 await page.evaluate(()=>window.DEPLOY_TEST.prepare({mode:'range'}));
 let state;
 for(let i=0;i<60;i++){state=await page.evaluate(()=>window.DEPLOY_TEST.step(.05));if(state.shots.length)break;}
 assert.ok(state.shots.length);
 const a=state.units.find(u=>u.id===state.actor),b=state.units.find(u=>u.id===state.enemy);
 const centerGap=Math.hypot(a.world.x-b.world.x,a.world.z-b.world.z),modelGap=a.bounds.min[2]-b.bounds.max[2];
 assert.ok(centerGap>1.6);assert.ok(modelGap>.25,'actual mech meshes have a visible gap, including weapons');
 assert.ok(state.effects>0);await page.screenshot({path:out+'mech-range.png'});
 assert.deepEqual(errors,[]);
 const report={base,cases,range:{centerGap,modelGap,firstShot:state.shots[0].time},errors};
 await fs.writeFile(out+'results.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({cases:cases.length,range:report.range,errors}));
}finally{await browser.close();}
