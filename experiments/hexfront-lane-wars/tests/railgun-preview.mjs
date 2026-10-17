import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4181/railgun-preview.html';
const browser=await chromium.launch({headless:true,channel:'chromium'});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const checks=[];function check(name,value){assert.ok(value,name);checks.push(name);}
try{
 await page.goto(base);if(await page.getByText('Open the page',{exact:true}).count())await page.getByText('Open the page',{exact:true}).click();
 await page.waitForFunction(()=>window.__RAIL_PREVIEW__,null,{timeout:90000});
 const info=await page.evaluate(()=>__RAIL_PREVIEW__.inspect());
 check('Four exported animation clips',info.clips.length===4);check('15 articulation axes',info.joints===15);
 check('Authored scale and ground',Math.abs(info.bounds[1]-1.29)<.001);
 const rig=await page.evaluate(()=>{
  const v=__RAIL_PREVIEW__,r=v.root;v.pose('Rest',0);r.updateMatrixWorld(true);
  const snap=()=>{const out={};r.traverse(o=>{if(o.isMesh)out[o.uuid]=o.matrixWorld.toArray();});return out;};
  const rest=snap(),hierarchy=[];
  for(const leg of ['LF','LB','RF','RB']){
   const h=r.getObjectByName('Hip_'+leg),k=r.getObjectByName('Knee_'+leg),a=r.getObjectByName('Ankle_'+leg);
   let geometry=0;a.traverse(o=>{if(o.isMesh)geometry++;});hierarchy.push(k.parent===h&&a.parent===k&&geometry>0);
  }
  const changes={};for(const [clip,t] of [['Joint_Check',1],['Aim_Check',1],['Recoil_Check',.5],['Idle',.75]]){
   v.pose(clip,t);r.updateMatrixWorld(true);const now=snap();changes[clip]=Object.keys(rest).filter(k=>rest[k].some((x,i)=>Math.abs(x-now[k][i])>1e-5)).length;
  }
  v.pose('Rest',0);r.updateMatrixWorld(true);const back=snap();
  let finite=true;r.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)if(!Number.isFinite(n))finite=false;});
  return {hierarchy,changes,finite,restored:Object.keys(rest).every(k=>rest[k].every((x,i)=>Math.abs(x-back[k][i])<1e-5))};
 });
 check('Four connected hip/knee/foot chains with real geometry',rig.hierarchy.every(Boolean));
 for(const [clip,count] of Object.entries(rig.changes))check(clip+' moves mesh transforms',count>0);
 check('Rest restores all rigid geometry transforms',rig.restored);check('Finite geometry coordinates',rig.finite);
 await page.locator('#clip').selectOption('Joint_Check');await page.waitForTimeout(350);await page.locator('#pause').click();
 const times=await page.evaluate(()=>{let a=[];__RAIL_PREVIEW__.root.traverse(o=>{if(o.name.startsWith('Knee_'))a.push(...o.quaternion.toArray());});return a;});await page.waitForTimeout(200);
 check('Pause holds joint pose',JSON.stringify(times)===JSON.stringify(await page.evaluate(()=>{let a=[];__RAIL_PREVIEW__.root.traverse(o=>{if(o.name.startsWith('Knee_'))a.push(...o.quaternion.toArray());});return a;})));
 const neutral=await page.evaluate(()=>{let a=[];__RAIL_PREVIEW__.root.traverse(o=>{if(o.isMesh&&o.material.name!=='Team')a.push(o.material.color.getHex());});return a;});
 await page.locator('#team').selectOption('blue');
 check('Team swap preserves ceramic/metal palette',JSON.stringify(neutral)===JSON.stringify(await page.evaluate(()=>{let a=[];__RAIL_PREVIEW__.root.traverse(o=>{if(o.isMesh&&o.material.name!=='Team')a.push(o.material.color.getHex());});return a;})));
 check('Team accents turn blue',await page.evaluate(()=>{let ok=true;__RAIL_PREVIEW__.root.traverse(o=>{if(o.isMesh&&o.material.name==='Team'&&o.material.color.getHex()!==0x469dce)ok=false;});return ok;}));
 await page.locator('#view').selectOption('teams');check('Comparison forces Orange / Blue',await page.locator('#team').isDisabled()&&await page.evaluate(()=>{let ok=true;__RAIL_PREVIEW__.root.traverse(o=>{if(o.isMesh&&o.material.name==='Team'&&o.material.color.getHex()!==0xf49a43)ok=false;});return ok;}));await page.locator('#axes').check();
 for(const clip of ['Joint_Check','Aim_Check','Recoil_Check']){await page.evaluate(c=>__RAIL_PREVIEW__.pose(c,c==='Recoil_Check'?.5:1),clip);await page.screenshot({path:'docs/railgun-model/'+clip+'.png'});}
 for(const path of ['public/models/railgun-preview/railgun.glb','art/railgun-v1/railgun-source.blend','docs/railgun-model/REVIEW.md']){const response=await page.request.get(new URL(path,base).href);check('Download '+path,response.ok());}
 await page.setViewportSize({width:390,height:844});await page.locator('#view').selectOption('single');await page.screenshot({path:'docs/railgun-model/mobile.png'});
 check('Portrait has usable canvas',await page.locator('#stage').evaluate(e=>e.clientWidth>=300&&e.clientHeight>=300));
 check('No browser exceptions',errors.length===0);
 await fs.writeFile('docs/railgun-model/validation.json',JSON.stringify({base,checks,info,rig,errors},null,2));console.log(JSON.stringify({passed:checks.length,info,rig,errors},null,2));
}finally{await browser.close();}
