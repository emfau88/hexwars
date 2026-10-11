import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const baseline=process.argv.includes('--baseline'),output=path.join(root,'docs/camera');await fs.mkdir(output,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4180'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']});
const report={baseline,date:new Date().toISOString(),runs:[],errors:[]};
try{
 for(const mobile of [false,true]){
  const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  // Expose the existing renderer for read-only measurements. No scene or game
  // values are changed by this instrumentation, including in the baseline.
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();const body=(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover); window.__cameraScene=scene;");await route.fulfill({response,body});});
  await page.goto('http://127.0.0.1:4180/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  for(const angle of baseline?['before']:[60,70,80]){
   if(!baseline)await page.evaluate(a=>{window.__cameraScene.setAngle(a);window.__cameraScene.render(0);},angle);
   await page.screenshot({path:path.join(output,`${name}-${angle}.png`)});
   const metrics=await page.evaluate(async()=>{
    const T=await import('/vendor/three.module.min.js'),M=await import('/src/map.js'),s=window.__cameraScene;
    s.scene.updateMatrixWorld(true);const solids=[];s.scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.visible&&o.material?.isMeshStandardMaterial&&!o.material.transparent&&!o.material.alphaTest)solids.push(o);});
    const cameraDirection=s.camera.position.clone().sub(s.camera.getWorldDirection(new T.Vector3()).add(s.camera.position));
    const angle=Math.asin(cameraDirection.normalize().y)*180/Math.PI,ray=new T.Raycaster(),sampled=[];
    for(const c of s.game.cells){const samples=[{x:c.x,z:c.z},...Array.from({length:6},(_,i)=>{const p=M.corner(c,i);return {x:c.x+(p.x-c.x)*.68,z:c.z+(p.z-c.z)*.68};})];let visible=0,pickable=0;
     for(const p of samples){const y=M.surfaceHeight(s.game.cells,c,p.x,p.z)+.04,v=new T.Vector3(p.x,y,p.z),screen=s.project(p.x,y,p.z),inside=screen.x>=0&&screen.x<=s.width&&screen.y>=0&&screen.y<=s.height;
      ray.setFromCamera(new T.Vector2(screen.x/s.width*2-1,1-screen.y/s.height*2),s.camera);const hit=ray.intersectObjects(solids,false)[0];if(inside&&(!hit||hit.distance>=ray.ray.origin.distanceTo(v)-.09))visible++;
      if(inside&&ray.intersectObjects(s.picks,false)[0]?.object.userData.cellId===c.id)pickable++;
     }sampled.push({id:c.id,height:c.height,visible,pickable});
    }
    const projected=s.game.cells.flatMap(c=>Array.from({length:6},(_,i)=>{const p=M.corner(c,i);return s.project(p.x,M.cornerHeight(s.game.cells,c,i),p.z);}));
    const bounds={minX:Math.min(...projected.map(p=>p.x)),maxX:Math.max(...projected.map(p=>p.x)),minY:Math.min(...projected.map(p=>p.y)),maxY:Math.max(...projected.map(p=>p.y))};
    return {angle:Number(angle.toFixed(2)),stage:{width:s.width,height:s.height},bounds,mostlyVisible:sampled.filter(c=>c.visible>=6).length,allSamplesVisible:sampled.filter(c=>c.visible===7).length,allSamplesPickable:sampled.filter(c=>c.pickable===7).length,sampled,state:window.__HEXFRONT3D__.snapshot()};
   });
   report.runs.push({name,angle,...metrics});console.log(JSON.stringify({name,angle,mostlyVisible:metrics.mostlyVisible,allSamplesVisible:metrics.allSamplesVisible,allSamplesPickable:metrics.allSamplesPickable,stage:metrics.stage,bounds:metrics.bounds}));
  }
  await context.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{await browser.close();server.kill();await fs.writeFile(path.join(output,baseline?'baseline.json':'angles.json'),JSON.stringify(report,null,2));}
