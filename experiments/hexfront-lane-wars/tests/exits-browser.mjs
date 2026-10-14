import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/';
const output=new URL('../docs/exit-qa/',import.meta.url);await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
const cases=[];
try{
 await page.goto(new URL('tests/fixtures/exits.html',base).href);await page.waitForFunction(()=>window.EXIT_TEST,null,{timeout:60000});
 for(const type of ['drone','mech','rail'])for(const lane of [0,1])for(const supply of [false,true]){
  const units=await page.evaluate(({type,lane,supply})=>window.EXIT_TEST.prepare(type,lane,supply),{type,lane,supply});
  const [frameA,frameB]=await page.evaluate(()=>[window.EXIT_TEST.sample(0,false,.01),window.EXIT_TEST.sample(0,false,.02)]);
  assert.ok(frameA.every(a=>{const b=frameB.find(p=>p.id===a.id);return Math.hypot(b.x-a.x,b.z-a.z)>.005;}),'departure moves smoothly between fixed simulation ticks');
  let samples=0,minAlignment=1;
  for(const time of [.1,.3,.7,1.2,2,3.5,5,7,9]){
   const [before,center,after]=await page.evaluate(t=>[window.EXIT_TEST.sample(t-.002),window.EXIT_TEST.sample(t),window.EXIT_TEST.sample(t+.002)],time);
   for(const u of units.filter(u=>time+.002<u.duration)){
    const a=before.find(p=>p.id===u.id),b=after.find(p=>p.id===u.id),p=center.find(p=>p.id===u.id);
    const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),alignment=(p.dx*dx+p.dz*dz)/(d*Math.hypot(p.dx,p.dz));
    assert.ok(Number.isFinite(alignment)&&alignment>.997,`${type} lane=${lane} supply=${supply} ${u.id} t=${time} alignment=${alignment}`);
    minAlignment=Math.min(minAlignment,alignment);samples++;
   }
  }
  assert.ok(samples>0);
  cases.push({type,lane,supply,samples,minAlignment});
  if(!supply&&lane===1){await page.evaluate(()=>window.EXIT_TEST.sample(2,true));await page.screenshot({path:fileURLToPath(new URL(type+'-east.png',output))});}
 }
 assert.deepEqual(errors,[]);
 const report={url:base,browser:browser.version(),description:'Actual rendered instance matrices face their measured movement on every factory/HQ exit, for all three models and both factions/lanes.',cases,errors};
 await fs.writeFile(new URL('browser-results.json',output),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
