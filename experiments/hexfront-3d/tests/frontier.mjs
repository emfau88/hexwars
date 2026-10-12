import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {dragDriver,dragOrder,nextFrame} from './drag-helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const details=process.argv.includes('--details');
const baseline=process.argv.includes('--baseline'),phase=baseline?'before':'after',out=path.join(root,process.env.TEST_OUTPUT||'docs/frontier');
await fs.mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4191'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);server.on('exit',code=>{if(code)reject(Error(`Server exit ${code}`));});});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={phase,date:new Date().toISOString(),runs:[],errors:[]};
try{
 for(const mobile of details?[false]:[false,true]){
  const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await page.route('**/src/main.js',async route=>{const response=await route.fetch(),body=(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover); window.__artScene=scene; window.__techEvents=[]; const effect=scene.effect.bind(scene); scene.effect=e=>{window.__techEvents.push({...e,time:game.time});effect(e);}; window.__techFrame=seconds=>{for(let i=0;i<Math.round(seconds*20);i++){game.update(.05);processEvents();updateUI();scene.render((scene.visualLast??0)+50);}};").replace('scene.render(now);','if(!window.__artCapture)scene.render(now);');await route.fulfill({response,body});});
  await page.goto('http://127.0.0.1:4191/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);await nextFrame(page);
  const info=await page.evaluate(()=>({state:window.__HEXFRONT3D__.snapshot(),angle:window.__artScene.angle,metrics:window.__HEXFRONT3D__.metrics()}));
  assert.equal(info.angle,70);assert.equal(info.state.cells.length,37);
  if(!baseline){const old=JSON.parse(await fs.readFile(path.join(root,'docs/frontier/before-report.json'),'utf8')).runs.find(r=>r.name===name);assert.deepEqual(info.state,old.state);}
  await page.screenshot({path:path.join(out,`${name}-${phase}-start.png`)});
  if(!baseline&&!mobile){
   await page.evaluate(()=>{window.__artCapture=true;const s=window.__artScene;s.render(0);for(const m of s.markers.values())for(const o of Object.values(m))o.visible=false;s.gridUnderlay.visible=false;s.pathLine.visible=false;s.labels.style.display='none';document.querySelectorAll('.map-tools,.economy-readout,.map-caption,.map-label,.map-signature,.map-title,.map-hint,#toast,.camera-guidance').forEach(o=>o.style.visibility='hidden');s.renderer.render(s.scene,s.camera);});
   await page.locator('canvas').screenshot({path:path.join(out,'landscape.png')});
   for(const [label,id] of [['hq-detail','-2,3'],['relay-detail','0,0']]){
    await page.evaluate(id=>{const s=window.__artScene;s.setView('diorama');s.zoom=4.0;s.resize();const c=s.game.cell(id),p=s.project(c.x,c.height*1.05+.7,c.z);s.viewPan={u:(p.x-s.width/2)/s.framing.scale,v:(s.height/2-p.y)/s.framing.scale};s.resize();s.renderer.render(s.scene,s.camera);},id);
    await page.locator('canvas').screenshot({path:path.join(out,`${label}.png`)});
   }
   await page.evaluate(()=>{const s=window.__artScene;s.fit();s.gridUnderlay.visible=true;s.labels.style.display='';document.querySelectorAll('.map-tools,.economy-readout,.map-caption,.map-label,.map-signature,.map-title,.map-hint,#toast,.camera-guidance').forEach(o=>o.style.visibility='');for(const m of s.markers.values())m.marker.visible=true;window.__artCapture=false;s.render(performance.now());});
  }
  if(details){report.runs.push({name,...info});await context.close();continue;}
  await page.locator('#primary').click();await nextFrame(page);
  const driver=await dragDriver(page,context,mobile);await dragOrder(page,driver,'-2,3','-3,3');
  await page.evaluate(seconds=>window.__HEXFRONT3D__.advance(seconds),baseline?1:.55);await nextFrame(page);
  await page.screenshot({path:path.join(out,`${name}-${phase}-transport.png`)});
  info.transport=await page.evaluate(()=>window.__HEXFRONT3D__.snapshot());
  if(!baseline){
   await page.evaluate(()=>{window.__artCapture=true;window.__artScene.visualLast=0;});
   const frame=seconds=>page.evaluate(t=>window.__techFrame(t),seconds);
   // Finish the actual player's first capture; record the visual event, not a mock.
   await frame(.55);assert.equal((await page.evaluate(()=>window.__HEXFRONT3D__.snapshot())).cells.find(c=>c.id==='-3,3').owner,'orange');
   await frame(.15);await page.screenshot({path:path.join(out,`${name}-capture.png`)});
   if(!mobile){
    await page.locator('#clear').click();await page.locator('[data-cell="-2,2"]').click();await page.locator('#half').click();
    await dragOrder(page,driver,'-2,2','-3,2');await frame(1.2);
    await page.locator('#clear').click();await page.locator('[data-cell="-2,2"]').click();await page.locator('#half').click();
    await dragOrder(page,driver,'-2,2','-3,1');
    const sequence=path.join(out,'sequence');await fs.mkdir(sequence,{recursive:true});
    await page.evaluate(()=>{const s=window.__artScene;s.zoomBy(2.2);const c=s.game.cell('-3,2'),p=s.project(c.x,.6,c.z);s.viewPan={u:(p.x-s.width/2)/s.framing.scale,v:(s.height/2-p.y)/s.framing.scale};s.resize();s.render(s.visualLast);});
    info.sequence=[];
    for(let i=0;i<=28;i++){
     if(i)await frame(.10);
     const file=`sequence/action-${String(i).padStart(2,'0')}.jpg`;if(!process.argv.includes('--no-sequence'))await page.screenshot({path:path.join(out,file),quality:78});
     info.sequence.push({file,elapsed:i/10,orders:(await page.evaluate(()=>window.__HEXFRONT3D__.snapshot())).orders.length});
     if(i===8){
      await page.screenshot({path:path.join(out,'drone-gameplay-detail.png')});
      // Actual in-flight model/event, inspected from its sensor side. This is a
      // test-only close-up camera; the product's fixed cameras are unchanged.
      await page.evaluate(async()=>{
       const s=window.__artScene,T=await import('/vendor/three.module.min.js'),p=s.dronePoses.find(p=>!p.idle&&!p.reaction);
       window.__inspectionCamera=s.camera.clone();const target=new T.Vector3(p.x,p.y+.14,p.z),e=55*Math.PI/180;
       s.camera.position.copy(target).add(new T.Vector3(-Math.sin(p.yaw)*Math.cos(e),Math.sin(e),-Math.cos(p.yaw)*Math.cos(e)).multiplyScalar(30));s.camera.lookAt(target);
       s.camera.left=-.65*s.width/s.height;s.camera.right=-s.camera.left;s.camera.top=.65;s.camera.bottom=-.65;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();
       for(const m of s.markers.values())for(const o of Object.values(m))o.visible=false;s.gridUnderlay.visible=false;s.pathLine.visible=false;s.labels.style.display='none';
       document.querySelectorAll('.map-tools,.economy-readout,.map-title,.map-hint,#toast,.camera-guidance').forEach(o=>o.style.visibility='hidden');s.renderer.render(s.scene,s.camera);
      });
      await page.locator('canvas').screenshot({path:path.join(out,'drone-detail.png')});
      await page.evaluate(()=>{const s=window.__artScene;s.camera.copy(window.__inspectionCamera);s.gridUnderlay.visible=true;s.labels.style.display='';document.querySelectorAll('.map-tools,.economy-readout,.map-title,.map-hint,#toast,.camera-guidance').forEach(o=>o.style.visibility='');s.render(s.visualLast);});
     }
     if(i===23)await page.screenshot({path:path.join(out,'combat-effect.png')});
    }
    const state=await page.evaluate(()=>window.__HEXFRONT3D__.snapshot());assert.equal(state.cells.find(c=>c.id==='-3,1').owner,'neutral');
    const events=await page.evaluate(()=>window.__techEvents);assert.ok(events.some(e=>e.type==='combat'&&e.id==='-3,1'));info.events=events;
    info.effects=await page.evaluate(()=>{
     const s=window.__artScene,before=JSON.stringify(s.game.snapshot());s.clearEffects();
     for(let i=0;i<72;i++)s.effect({type:i%2?'capture':'combat',id:'-2,1',from:'-3,1',owner:i%2?'orange':'blue',previous:'neutral'});
     s.render(s.visualLast+100);const peak=s.effectPool.filter(f=>f.active).length,memory={...s.renderer.info.memory};
     for(let i=0;i<15;i++)s.render(s.visualLast+80);
     const cleared=s.effectPool.filter(f=>f.active).length;
     for(let i=0;i<72;i++)s.effect({type:i%2?'capture':'combat',id:'-2,1',from:'-3,1',owner:i%2?'orange':'blue',previous:'neutral'});s.render(s.visualLast+50);
     const repeat={...s.renderer.info.memory};s.clearEffects();s.setQuality('low');
     for(let i=0;i<30;i++)s.effect({type:'capture',id:'-2,1',from:'-3,1',owner:'orange',previous:'blue'});s.render(s.visualLast+50);
     const low={active:s.effectPool.filter(f=>f.active).length,particles:s.effectPool.reduce((n,f)=>n+(f.active?f.chips.count:0),0),wake:s.droneWake.count};s.clearEffects();s.setQuality('high');
     return {peak,cleared,memory,repeat,low,simulationUnchanged:before===JSON.stringify(s.game.snapshot())};
    });
    assert.equal(info.effects.peak,24);assert.equal(info.effects.cleared,0);assert.equal(info.effects.low.active,8);assert.equal(info.effects.low.particles,0);assert.equal(info.effects.low.wake,0);assert.equal(info.effects.simulationUnchanged,true);assert.deepEqual(info.effects.memory,info.effects.repeat);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>window.__artScene.reduced);
    info.reduced=await page.evaluate(()=>{const s=window.__artScene;s.effect({type:'capture',id:'-3,1',from:'-3,2',owner:'orange',previous:'neutral'});s.render(s.visualLast+50);return {reduced:s.reduced,particles:s.effectPool.reduce((n,f)=>n+(f.active?f.chips.count:0),0),wake:s.droneWake.count,ghosts:s.droneGhosts.length};});assert.deepEqual(info.reduced,{reduced:true,particles:0,wake:0,ghosts:0});
   }
  }
  await driver.close();report.runs.push({name,...info});await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(`${phase}: desktop/mobile baseline and drag transport captured.`);
}catch(error){report.failure=error.stack;throw error;}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,details?'details-report.json':`${phase}-report.json`),JSON.stringify(report,null,2));}
