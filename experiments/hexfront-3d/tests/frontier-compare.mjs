import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'docs/frontier');
const baseline='4867c595a6d18e3f20340d7a7b283574adb7645c';
const old=Object.fromEntries(['art.js','scene.js','technology.js'].map(name=>[name,execFileSync('git',['show',`${baseline}:experiments/hexfront-3d/src/${name}`],{cwd:root,encoding:'utf8',windowsHide:true})]));
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4196'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={baseline,runs:[],errors:[]};
try{
 for(const mobile of [false,true]){
  const name=mobile?'mobile':'desktop',viewport=mobile?{width:390,height:844}:{width:1440,height:900};let camera,state;
  for(const phase of ['before','after']){
   const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
   page.on('pageerror',e=>report.errors.push(e.message));
   await page.route('**/src/*.js',async route=>{
    const file=new URL(route.request().url()).pathname.split('/').at(-1),response=await route.fetch();
    let body=phase==='before'&&old[file]?old[file]:await response.text();
    if(file==='main.js')body=body.replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover);window.__s=scene;").replace('scene.render(now);','if(!window.__still)scene.render(now);');
    await route.fulfill({response,body});
   });
   await page.goto('http://127.0.0.1:4196/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const initial=await page.evaluate(()=>window.__HEXFRONT3D__.snapshot());
   if(phase==='before')state=initial;else assert.deepEqual(initial,state);
   const actual=await page.evaluate(saved=>{
    const s=window.__s;window.__still=true;s.visualTime=0;s.visualLast=null;
    if(saved){for(const k of ['left','right','top','bottom','near','far'])s.camera[k]=saved[k];s.camera.position.fromArray(saved.position);s.camera.quaternion.fromArray(saved.quaternion);s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();}
    s.render(0);const c=s.camera;
    return {left:c.left,right:c.right,top:c.top,bottom:c.bottom,near:c.near,far:c.far,position:c.position.toArray(),quaternion:c.quaternion.toArray()};
   },phase==='after'?camera:null);
   if(phase==='before')camera=actual;else assert.deepEqual(actual,camera);
   await page.screenshot({path:path.join(out,`compare-${name}-${phase}.png`)});await context.close();
  }
  report.runs.push({name,viewport,identicalState:true,identicalCamera:true,camera});
 }
 assert.deepEqual(report.errors,[]);console.log('PASS: before/after rendered from Git baseline with identical game states and exact camera matrices.');
}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'comparison-report.json'),JSON.stringify(report,null,2)+'\n');}
