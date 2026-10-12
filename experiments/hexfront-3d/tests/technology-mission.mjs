import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {dragDriver,dragOrder,nextFrame} from './drag-helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),out=path.join(root,'docs/technology');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4192'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={date:new Date().toISOString(),errors:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1}),page=await context.newPage(),driver=await dragDriver(page,context,false);
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch(),body=(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);",`scene=new Diorama($('stage'),$('labels'),game,select,hover); window.__scene=scene;window.__events=[];window.__routes=[];window.__bothSides=false; const effect=scene.effect.bind(scene);scene.effect=e=>{window.__events.push({...e,time:game.time});effect(e);};window.__step=seconds=>{for(let i=0;i<Math.round(seconds*20);i++){for(const o of game.orders)window.__routes.push({owner:o.owner,path:[...o.path],segment:o.segment});if(game.orders.some(o=>o.owner==='orange')&&game.orders.some(o=>o.owner==='blue'))window.__bothSides=true;game.update(.05);processEvents();updateUI();scene.render((scene.visualLast??0)+50);}};`).replace('scene.render(now);','scene.render(window.__capture?(scene.visualLast??0):now);');await route.fulfill({response,body});});
 await page.goto('http://127.0.0.1:4192/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);await page.locator('#primary').click();await nextFrame(page);await page.evaluate(()=>{window.__capture=true;window.__scene.visualLast=0;});
 const advance=s=>page.evaluate(s=>window.__step(s),s),send=async(a,b)=>{await dragOrder(page,driver,a,b);assert.match(await page.locator('#toast').innerText(),/unterwegs/,a+' -> '+b);};
 for(const [a,b] of [['-2,3','-3,3'],['-3,3','-3,2'],['-3,2','-3,1']]){await send(a,b);await advance(1.2);}
 await send('-3,1','-2,1');await advance(.55);await page.screenshot({path:path.join(out,'ramp-lower.png')});await advance(.65);
 await send('-2,1','-1,1');await advance(.55);await page.screenshot({path:path.join(out,'ramp-upper.png')});await advance(.65);
 // Reinforce the plateau over multiple already-owned fields, using real input.
 await send('-2,2','-1,1');await advance(4.6);
 await send('-1,1','0,0');await advance(1.20);
 const state=await page.evaluate(()=>window.__HEXFRONT3D__.snapshot());assert.equal(state.cells.find(c=>c.id==='0,0').owner,'orange');
 await page.screenshot({path:path.join(out,'relay-active.png')});
 await advance(4);
 report.events=await page.evaluate(()=>window.__events);assert.ok(report.events.some(e=>e.type==='reinforce'));assert.ok(report.events.some(e=>e.type==='capture'&&e.id==='0,0'));
 report.routes=await page.evaluate(()=>[...new Map(window.__routes.map(r=>[r.owner+':'+r.path.join('|'),r])).values()]);report.bothSides=await page.evaluate(()=>window.__bothSides);assert.equal(report.bothSides,true);
 assert.ok(report.routes.some(r=>r.owner==='orange'&&r.path.length>=4));assert.ok(report.routes.some(r=>r.owner==='blue'));
 report.clearance=await page.evaluate(async()=>{
  const s=window.__scene,T=await import('/vendor/three.module.min.js'),{transportPose}=await import('/src/transport.js'),{RAMPS,surfaceHeight}=await import('/src/map.js');let samples=0,min=Infinity;const matrix=new T.Matrix4(),dummy=new T.Object3D(),v=new T.Vector3();
  for(const edge of RAMPS)for(const reverse of [false,true]){const path=edge.split('|');if(reverse)path.reverse();for(let i=0;i<=20;i++){
   const p=transportPose(s.game,{id:1,owner:'orange',path,segment:0,progress:i/20},0,false);dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.pitch,p.yaw,p.roll,'YXZ');dummy.updateMatrix();matrix.copy(dummy.matrix);
   for(const part of s.droneParts){const a=part.geometry.attributes.position;for(let j=0;j<a.count;j++){v.fromBufferAttribute(a,j).applyMatrix4(matrix);const cell=s.cellAt(v.x,v.z);if(cell){min=Math.min(min,v.y-surfaceHeight(s.game.cells,cell,v.x,v.z));samples++;}}}
  }}return {samples,minimumMetres:min};
 });assert.ok(report.clearance.minimumMetres>0,'The actual drone mesh clears the real ramp surfaces');
 report.ruins=await page.evaluate(async()=>{
  const s=window.__scene,T=await import('/vendor/three.module.min.js'),{transportPose,RUINS}=await import('/src/transport.js'),{neighbors,traversable}=await import('/src/map.js');let vertices=0,min=Infinity;const dummy=new T.Object3D(),v=new T.Vector3();
  for(const a of s.game.cells)for(const b of neighbors(s.game.cells,a))if(traversable(a,b)&&a.height===b.height){
   for(let i=0;i<=12;i++){
    const p=transportPose(s.game,{id:1,owner:'orange',path:[a.id,b.id],segment:0,progress:i/12},0,false);dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.pitch,p.yaw,p.roll,'YXZ');dummy.updateMatrix();
    for(const part of s.droneParts){const points=part.geometry.attributes.position;for(let j=0;j<points.count;j++){
     v.fromBufferAttribute(points,j).applyMatrix4(dummy.matrix);
     for(const [rx,rz,length,base,angle] of RUINS){const dx=v.x-rx,dz=v.z-rz,c=Math.cos(angle),sn=Math.sin(angle);if(Math.abs(dx*c-dz*sn)<=length/2&&Math.abs(dx*sn+dz*c)<=.25){min=Math.min(min,v.y-(base+.62));vertices++;}}
    }}
   }
  }return {vertices,minimumMetres:min};
 });assert.ok(report.ruins.vertices>0&&report.ruins.minimumMetres>0,'Drone vertices clear conservative bounding tops of the existing ruins');
 report.state=await page.evaluate(()=>window.__HEXFRONT3D__.snapshot());report.metrics=await page.evaluate(()=>window.__HEXFRONT3D__.metrics());assert.deepEqual(report.errors,[]);console.log(JSON.stringify({bothSides:report.bothSides,clearance:report.clearance,ruins:report.ruins,events:report.events.length,metrics:report.metrics}));await driver.close();
}catch(error){report.failure=error.stack;throw error;}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'mission-report.json'),JSON.stringify(report,null,2));}
