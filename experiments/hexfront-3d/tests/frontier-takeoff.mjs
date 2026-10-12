// Records a real first order and its capture; advances the existing simulation
// clock without changing owners, unit counts, speed, AI or combat outcomes.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {dragDriver,dragOrder,nextFrame} from './drag-helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'docs/frontier/takeoff');
await fs.mkdir(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4195'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={frames:[],events:[],errors:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1}),page=await context.newPage(),driver=await dragDriver(page,context,false);
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/src/main.js',async route=>{
  const response=await route.fetch(),body=(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover); window.__s=scene;window.__events=[];const oldEffect=scene.effect.bind(scene);scene.effect=e=>{window.__events.push({...e,time:game.time});oldEffect(e);}; window.__step=t=>{for(let i=0;i<Math.round(t*20);i++){game.update(.05);processEvents();updateUI();scene.render((scene.visualLast||0)+50);}};").replace('scene.render(now);','if(!window.__record)scene.render(now);');await route.fulfill({response,body});
 });
 await page.goto('http://127.0.0.1:4195/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);
 await page.locator('#primary').click();await nextFrame(page);
 await page.evaluate(()=>{const s=window.__s;s.zoomBy(2.2);const a=s.game.cell('-2,3'),b=s.game.cell('-3,3'),p=s.project((a.x+b.x)/2,.6,(a.z+b.z)/2);s.viewPan={u:(p.x-s.width/2)/s.framing.scale,v:(s.height/2-p.y)/s.framing.scale};s.resize();window.__record=true;s.visualLast=0;});
 await dragOrder(page,driver,'-2,3','-3,3');
 for(let i=0;i<19;i++){
  if(i)await page.evaluate(()=>window.__step(.1));else await page.evaluate(()=>window.__s.render(0));
  const file=`start-${String(i).padStart(2,'0')}.jpg`;await page.screenshot({path:path.join(out,file),quality:82});

  if(i===6){
   await page.evaluate(async()=>{
    const s=window.__s,T=await import('/vendor/three.module.min.js'),p=s.dronePoses.find(p=>!p.idle&&!p.reaction);window.__savedCamera=s.camera.clone();
    const target=new T.Vector3(p.x,p.y+.14,p.z),e=55*Math.PI/180;s.camera.position.copy(target).add(new T.Vector3(-Math.sin(p.yaw)*Math.cos(e),Math.sin(e),-Math.cos(p.yaw)*Math.cos(e)).multiplyScalar(30));s.camera.lookAt(target);
    s.camera.left=-.65*s.width/s.height;s.camera.right=-s.camera.left;s.camera.top=.65;s.camera.bottom=-.65;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();
    for(const m of s.markers.values())for(const o of Object.values(m))o.visible=false;s.gridUnderlay.visible=false;s.pathLine.visible=false;s.labels.style.display='none';
    document.querySelectorAll('.map-tools,.economy-readout,.map-title,.map-hint,#toast,.camera-guidance').forEach(o=>o.style.visibility='hidden');s.renderer.render(s.scene,s.camera);
   });
   await page.locator('canvas').screenshot({path:path.join(root,'docs/frontier/drone-detail.png')});
   await page.evaluate(()=>{const s=window.__s;s.camera.copy(window.__savedCamera);s.gridUnderlay.visible=true;s.labels.style.display='';document.querySelectorAll('.map-tools,.economy-readout,.map-title,.map-hint,#toast,.camera-guidance').forEach(o=>o.style.visibility='');s.render(s.visualLast);});
  }
  report.frames.push({file,elapsed:i/10,state:await page.evaluate(()=>({time:window.__s.game.time,targetOwner:window.__s.game.cell('-3,3').owner,poses:window.__s.dronePoses.filter(p=>!p.idle)}))});
 }
 report.events=await page.evaluate(()=>window.__events);assert.ok(report.events.some(e=>e.type==='capture'&&e.id==='-3,3'));assert.equal(report.frames.at(-1).state.targetOwner,'orange');assert.deepEqual(report.errors,[]);await driver.close();
 console.log('PASS: real takeoff, transport and capture recorded at 10 frames per simulation second.');
}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
