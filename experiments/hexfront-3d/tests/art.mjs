import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const phase=process.argv.includes('--baseline')?'before':'after',out=path.join(root,'docs/art');await fs.mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4184'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={phase,date:new Date().toISOString(),runs:[],errors:[]};
try{
 for(const mobile of [false,true]){
  const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await page.route('**/src/main.js',async route=>{const response=await route.fetch(),body=(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover); window.__artScene=scene;").replace('scene.render(now);','if(!window.__artCapture)scene.render(now);');await route.fulfill({response,body});});
  await page.goto('http://127.0.0.1:4184/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const info=await page.evaluate(()=>{const s=window.__artScene;return {angle:s.angle,view:s.view,zoom:s.zoom,state:window.__HEXFRONT3D__.snapshot(),metrics:window.__HEXFRONT3D__.metrics(),textures:s.renderer.info.memory.textures,geometries:s.renderer.info.memory.geometries,readyMs:performance.now(),stage:{width:s.width,height:s.height},overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.equal(info.angle,70);assert.equal(info.state.cells.length,37);assert.equal(info.overflow,false);
  if(phase==='after'){
   const baseline=JSON.parse(await fs.readFile(path.join(out,'before-report.json'),'utf8')).runs.find(r=>r.name===name);assert.deepEqual(info.state,baseline.state,'Identical before/after game state');
   const geometry=await page.evaluate(async()=>{
    const T=await import('/vendor/three.module.min.js'),M=await import('/src/map.js'),s=window.__artScene,ray=new T.Raycaster(),ground=s.occluders.filter(o=>o.userData.pickKind==='ground'),cliffs=s.occluders.filter(o=>o.userData.pickKind==='cliff');let samples=0,wallSamples=0;const failures=[];
    for(const c of s.game.cells)for(const p of [{x:c.x,z:c.z},...Array.from({length:6},(_,i)=>{const p=M.corner(c,i);return {x:c.x+(p.x-c.x)*.68,z:c.z+(p.z-c.z)*.68};})]){
     const expected=M.surfaceHeight(s.game.cells,c,p.x,p.z);ray.set(new T.Vector3(p.x,10,p.z),new T.Vector3(0,-1,0));const hit=ray.intersectObjects(ground)[0];samples++;if(!hit||Math.abs(hit.point.y-expected)>.0001)failures.push({kind:'ground',id:c.id,expected,actual:hit?.point.y});
    }
    for(const e of s.artCliffEdges)for(const u of [.2,.5,.8]){
     const high=T.MathUtils.lerp(e.a.y,e.b.y,u),low=T.MathUtils.lerp(e.lowA,e.lowB,u);if(high-low<.1)continue;
     for(const t of [.25,.55,.8]){const x=T.MathUtils.lerp(e.a.x,e.b.x,u),z=T.MathUtils.lerp(e.a.z,e.b.z,u),y=T.MathUtils.lerp(low,high,t);ray.set(new T.Vector3(x+e.normal.x*.65,y,z+e.normal.y*.65),new T.Vector3(-e.normal.x,0,-e.normal.y));const hit=ray.intersectObjects(cliffs)[0];wallSamples++;if(!hit||hit.distance>1.0)failures.push({kind:'wall',x,y,z,distance:hit?.distance});}
    }
    const invalid=[];s.scene.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;if(p&&Array.from(p.array).some(v=>!Number.isFinite(v)))invalid.push(o.uuid);}});
    return {samples,wallSamples,failures,invalid};
   });assert.deepEqual(geometry.failures,[],'Visual terrain must retain the logical tops and close every cliff/ramp flank');assert.deepEqual(geometry.invalid,[]);info.geometry=geometry;
  }

  await page.screenshot({path:path.join(out,`${name}-${phase}.png`)});
  await page.evaluate(()=>{window.__artCapture=true;const s=window.__artScene;s.render(0);for(const m of s.markers.values())for(const o of Object.values(m))o.visible=false;s.pathLine.visible=false;for(const p of [...s.roverParts,s.roverInsignia])p.visible=false;s.labels.hidden=true;document.querySelectorAll('.map-tools,.map-title,#toast,.map-hint,#camera-guidance').forEach(e=>e.style.visibility='hidden');s.renderer.render(s.scene,s.camera);});
  await page.locator('#stage canvas').screenshot({path:path.join(out,`${name}-${phase}-landscape.png`)});
  if(!mobile&&phase==='after'){
   await page.evaluate(()=>{const s=window.__artScene;s.setView('diorama');s.renderer.render(s.scene,s.camera);});
   await page.locator('#stage canvas').screenshot({path:path.join(out,'landscape-diorama.png')});
   for(const [label,id] of [['hq-detail','-2,3'],['plateau-detail','0,0']]){
    await page.evaluate(id=>{const s=window.__artScene;s.fit();s.zoomBy(2.2);const c=s.game.cell(id),p=s.project(c.x,c.height*1.05+.5,c.z);s.viewPan={u:(p.x-s.width/2)/s.framing.scale,v:(s.height/2-p.y)/s.framing.scale};s.resize();s.renderer.render(s.scene,s.camera);},id);
    await page.locator('#stage canvas').screenshot({path:path.join(out,`${label}.png`)});
   }
  }
  report.runs.push({name,...info});console.log(JSON.stringify({name,phase,angle:info.angle,metrics:info.metrics,stage:info.stage,readyMs:Math.round(info.readyMs)}));await context.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,`${phase}-report.json`),JSON.stringify(report,null,2));}
