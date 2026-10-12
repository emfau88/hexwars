// Native input, real simulation events and screenshots from the running game.
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
import {dragDriver,dragOrder} from './drag-helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'docs/hq-command/animation');await fs.mkdir(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4199'},windowsHide:true,stdio:['ignore','pipe','pipe']});await new Promise((r,j)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))r();});server.on('error',j);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={date:new Date().toISOString(),runs:[],errors:[]};
try{for(const mobile of [false,true]){
 const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1}),page=await context.newPage(),driver=await dragDriver(page,context,mobile);
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch(),body=(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);",`scene=new Diorama($('stage'),$('labels'),game,select,hover);window.__s=scene;window.__events=[];const oldEffect=scene.effect.bind(scene);scene.effect=e=>{window.__events.push({...e,time:game.time});oldEffect(e);};window.__step=t=>{const draw=scene.renderer.render;scene.renderer.render=()=>{};try{for(let i=0;i<Math.round(t*20);i++){game.update(.05);processEvents();updateUI();scene.render((scene.visualLast||0)+50);}}finally{scene.renderer.render=draw;draw.call(scene.renderer,scene.scene,scene.camera);}};`).replace('scene.render(now);','if(!window.__record)scene.render(now);');await route.fulfill({response,body});});
 await page.goto('http://127.0.0.1:4199/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);
 await page.evaluate(()=>{window.__record=true;window.__s.visualTime=0;window.__s.visualLast=0;});await page.locator('#primary').click();
 const step=t=>page.evaluate(t=>window.__step(t),t),poses=()=>page.evaluate(()=>window.__s.commandHQs.map(n=>({cell:n.cell,owner:n.owner,send:n.send,pose:n.pose,radar:n.parts.Radar_Pivot.part.rotation.toArray(),door:n.parts.Hangar_Door.part.position.toArray()})));
 await step(.05);assert.ok((await poses()).every(n=>n.pose.producing));
 await dragOrder(page,driver,'-2,3','-3,3');await step(.05);const sent=await poses();assert.ok(sent.find(n=>n.cell==='-2,3').pose.door>0);const state=await page.evaluate(()=>window.__HEXFRONT3D__.snapshot());assert.equal(state.commands,1);assert.equal(state.orders.length,1);
 const run={name,sendImmediate:true,frames:[],radar:[]};
 if(!mobile){
  await page.evaluate(async()=>{const s=window.__s,T=await import('/vendor/three.module.min.js'),c=s.game.cell('-2,3'),target=new T.Vector3(c.x,.64,c.z-.1),e=38*Math.PI/180;window.__cam=s.camera.clone();s.camera.position.copy(target).add(new T.Vector3(-.62*Math.cos(e),Math.sin(e),.785*Math.cos(e)).multiplyScalar(30));s.camera.lookAt(target);s.camera.left=-1.03*s.width/s.height;s.camera.right=-s.camera.left;s.camera.top=1.03;s.camera.bottom=-1.03;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();s.labels.style.display='none';document.querySelectorAll('.map-tools,.economy-readout,.map-title,.map-hint,#toast,.camera-guidance,.map-caption,.map-label,.map-signature').forEach(o=>o.style.visibility='hidden');s.renderer.render(s.scene,s.camera);});
  for(let i=0;i<6;i++){if(i)await step(.2);const file=`hangar-${i}.png`;await page.locator('canvas').screenshot({path:path.join(out,file)});run.frames.push({file,elapsed:.05+i*.2,hqs:await poses()});}
  assert.ok(run.frames[2].hqs.find(n=>n.cell==='-2,3').pose.door>.19);assert.equal(run.frames[5].hqs.find(n=>n.cell==='-2,3').pose.door,0);
  // Live gameplay keeps running during a full scan; AI uses the same HQ model.
  for(let i=0;i<9;i++){if(i)await step(2);const file=`radar-${i}.jpg`;await page.locator('canvas').screenshot({path:path.join(out,file),quality:88});run.radar.push({file,seconds:i*2,hqs:await poses()});}
  assert.ok((await page.evaluate(()=>window.__events)).some(e=>e.type==='send'&&e.owner==='blue'));
  await page.evaluate(()=>{const s=window.__s;s.camera.copy(window.__cam);s.labels.style.display='';document.querySelectorAll('.map-tools,.economy-readout,.map-title,.map-hint,#toast,.camera-guidance,.map-caption,.map-label,.map-signature').forEach(o=>o.style.visibility='');s.render(s.visualLast);});
 }
 await step(1.2);await page.locator('#pause').click();await step(.05);const before=await poses();await step(2);const after=await poses();assert.deepEqual(before,after);run.pause=true;
 await page.locator('#quality').click();await page.locator('#quality').click();await page.locator('#zoom-in').click();await page.locator('#fit').click();run.qualityZoomReset=true;
 // Focused visual-event stress never changes the battle state. This supplements
 // the real send/AI sequence and full victory/defeat match, not a fake match.
 run.stress=await page.evaluate(async()=>{const s=window.__s,old=JSON.stringify(s.game.snapshot()),{commandHQEvent,updateCommandHQ,resetCommandHQ}=await import('/src/command-hq.js');s.game.paused=false;
  const state=JSON.stringify(s.game.snapshot()),memory={...s.renderer.info.memory};for(let i=0;i<50;i++){commandHQEvent(s,{type:'send',from:'-2,3'});commandHQEvent(s,{type:'combat',id:'-2,3'});}updateCommandHQ(s,0);s.render(s.visualLast+50);const peak=s.commandHQs[0].pose.intensity;
  const same=state===JSON.stringify(s.game.snapshot());resetCommandHQ(s);updateCommandHQ(s,0);return {simulationUnchanged:same,memoryBefore:memory,memoryAfter:{...s.renderer.info.memory},peak,doorReset:s.commandHQs.every(n=>n.pose.door===0)};});
 assert.equal(run.stress.simulationUnchanged,true);assert.equal(run.stress.doorReset,true);assert.deepEqual(run.stress.memoryBefore,run.stress.memoryAfter);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.__s.reduced);await step(.2);
 assert.ok((await poses()).every(n=>n.pose.yaw===0&&n.pose.tilt===0&&n.pose.door===0));run.reduced=true;
 run.events=await page.evaluate(()=>window.__events);await page.screenshot({path:path.join(out,`${name}-integration.png`)});report.runs.push(run);await driver.close();await context.close();
}assert.deepEqual(report.errors,[]);console.log('PASS HQ native send, live radar sequence, AI HQ, pause, reduced motion, LQ/HQ and event stress.');}catch(e){report.failure=e.stack;throw e;}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));}
