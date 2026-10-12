// Real first-order captures. Only the GLB changes between the two runs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dragDriver,dragOrder,nextFrame} from './drag-helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'docs/drone-reference');
await fs.mkdir(out,{recursive:true});
const baseline='55d7047',old=execFileSync('git',['show',`${baseline}:experiments/hexfront-3d/public/assets/frontier/frontier.glb`],{cwd:root,maxBuffer:5e6,windowsHide:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4197'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((r,j)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))r();});server.on('error',j);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={baseline,runs:[],errors:[]};
try{
 for(const mobile of (process.argv.includes('--detail')?[false]:[false,true]))for(const phase of (process.argv.includes('--detail')?['after']:['before','after'])){
  const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')console.log('BROWSER',e.text());});
  if(phase==='before'){
   await page.route('**/frontier.glb',r=>r.fulfill({body:old,contentType:'model/gltf-binary'}));
   for(const file of ['frontier.js','technology.js'])await page.route('**/src/'+file,r=>r.fulfill({body:execFileSync('git',['show',`${baseline}:experiments/hexfront-3d/src/${file}`],{cwd:root,windowsHide:true}),contentType:'text/javascript'}));
  }
  await page.route('**/src/main.js',async route=>{
   const response=await route.fetch(),body=(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover); window.__s=scene;window.__step=t=>{for(let i=0;i<Math.round(t*20);i++){game.update(.05);processEvents();updateUI();scene.render((scene.visualLast||0)+50);}};").replace('scene.render(now);','if(!window.__record)scene.render(now);');await route.fulfill({response,body});
  });
  await page.goto('http://127.0.0.1:4197/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);
  await page.locator('#primary').click();await nextFrame(page);await page.evaluate(()=>{window.__record=true;window.__s.visualTime=0;window.__s.visualLast=0;});
  const driver=await dragDriver(page,context,mobile);await dragOrder(page,driver,'-2,3','-3,3');await page.evaluate(()=>window.__step(1.2));await dragOrder(page,driver,'-3,3','-3,2');await page.evaluate(()=>window.__step(.55));
  const metrics=await page.evaluate(()=>{const s=window.__s,p=s.dronePoses.find(p=>!p.idle&&!p.reaction),centre=s.project(p.x,p.y,p.z),left=s.project(p.x-.62,p.y,p.z),right=s.project(p.x+.62,p.y,p.z);return {state:window.__HEXFRONT3D__.snapshot(),drone:p,projectedWidth:Math.hypot(right.x-left.x,right.y-left.y),centre,stats:s.renderer.info.render,geometry:s.renderer.info.memory,model:s.frontierStats,camera:s.camera.matrixWorld.toArray()};});
  await page.screenshot({path:path.join(out,`${name}-${phase}.png`)});
  if(!mobile){
   await page.evaluate(async()=>{const s=window.__s,T=await import('/vendor/three.module.min.js'),p=s.dronePoses.find(p=>!p.idle&&!p.reaction),target=new T.Vector3(p.x,p.y+.24,p.z),e=55*Math.PI/180;s.camera.position.copy(target).add(new T.Vector3(-Math.sin(p.yaw)*Math.cos(e),Math.sin(e),-Math.cos(p.yaw)*Math.cos(e)).multiplyScalar(30));s.camera.lookAt(target);s.camera.left=-.72*s.width/s.height;s.camera.right=-s.camera.left;s.camera.top=.72;s.camera.bottom=-.72;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();for(const m of s.markers.values())for(const o of Object.values(m))o.visible=false;s.gridUnderlay.visible=false;s.pathLine.visible=false;s.labels.style.display='none';document.querySelectorAll('.map-tools,.economy-readout,.map-title,.map-hint,#toast,.camera-guidance').forEach(o=>o.style.visibility='hidden');s.renderer.render(s.scene,s.camera);});
   await page.locator('canvas').screenshot({path:path.join(out,`detail-${phase}.png`)});
  }
  if(phase==='after'&&!process.argv.includes('--detail')){const prev=report.runs.find(r=>r.name===name&&r.phase==='before');assert.deepEqual(metrics.state,prev.state);assert.deepEqual(metrics.camera,prev.camera);}
  report.runs.push({name,phase,...metrics});await driver.close();await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log('PASS: four native-order runtime views and two drone close-ups; identical state/camera, no clips.');
}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
