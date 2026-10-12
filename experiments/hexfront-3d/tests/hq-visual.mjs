// Actual runtime comparisons, fixed game state and camera; inspection camera is test-only.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'docs/hq-command');await fs.mkdir(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const baseline='f65213b',phase=process.argv.includes('--before')?'before':'after',detail=process.argv.includes('--detail');
if(phase==='after'&&!(await fs.readFile(path.join(root,'src/frontier.js'),'utf8')).includes('buildCommandHQ'))throw Error('Model-first review: apply docs/hq-command/integration-draft.patch before running the after-gameplay capture.');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4198'},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((r,j)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))r();});server.on('error',j);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={phase,baseline,runs:[],errors:[]};
try{for(const mobile of detail?[false]:[false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),name=mobile?'mobile':'desktop';
 page.on('pageerror',e=>{report.errors.push(e.message);console.log(e.message);});
 if(phase==='before')for(const f of ['frontier.js','technology.js','main.js'])await page.route('**/src/'+f,r=>r.fulfill({body:execFileSync('git',['show',`${baseline}:experiments/hexfront-3d/src/${f}`],{cwd:root,windowsHide:true}),contentType:'text/javascript'}));
 await page.route('**/src/main.js',async route=>{
  const response=await route.fetch(),original=phase==='before'?execFileSync('git',['show',`${baseline}:experiments/hexfront-3d/src/main.js`],{cwd:root,windowsHide:true}).toString():await response.text();
  const body=original.replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover);window.__s=scene;window.__step=t=>{for(let i=0;i<Math.round(t*20);i++){game.update(.05);processEvents();updateUI();scene.render((scene.visualLast||0)+50);}};").replace('scene.render(now);','if(!window.__record)scene.render(now);');await route.fulfill({response,body});
 });
 await page.goto('http://127.0.0.1:4198/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__,{timeout:60000});
 await page.evaluate(()=>{window.__record=true;const s=window.__s;s.visualTime=0;s.visualLast=0;s.render(0);});
 const info=await page.evaluate(()=>{const s=window.__s;return {state:s.game.snapshot(),camera:s.camera.matrixWorld.toArray(),projection:s.camera.projectionMatrix.toArray(),render:s.renderer.info.render,memory:s.renderer.info.memory};});
 await page.screenshot({path:path.join(out,`${name}-${phase}.png`)});
 if(!mobile){
  await page.evaluate(async()=>{const s=window.__s,T=await import('/vendor/three.module.min.js'),c=s.game.cell('-2,3'),target=new T.Vector3(c.x,.64,c.z-.1),e=38*Math.PI/180;s.camera.position.copy(target).add(new T.Vector3(-.62*Math.cos(e),Math.sin(e),.785*Math.cos(e)).multiplyScalar(30));s.camera.lookAt(target);s.camera.left=-1.03*s.width/s.height;s.camera.right=-s.camera.left;s.camera.top=1.03;s.camera.bottom=-1.03;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();for(const m of s.markers.values())for(const o of Object.values(m))o.visible=false;s.gridUnderlay.visible=false;s.pathLine.visible=false;s.labels.style.display='none';document.querySelectorAll('.map-tools,.economy-readout,.map-title,.map-hint,#toast,.camera-guidance,.map-caption,.map-label,.map-signature').forEach(o=>o.style.visibility='hidden');s.renderer.render(s.scene,s.camera);});
  await page.locator('canvas').screenshot({path:path.join(out,`detail-${phase}.png`)});
  if(phase==='after'){
   // Blue uses exactly the same authored geometry. Inspect it in-place, in engine.
   await page.evaluate(()=>{const s=window.__s,a=s.game.cell('-2,3'),b=s.game.cell('2,-3');s.camera.position.x+=b.x-a.x;s.camera.position.z+=b.z-a.z;s.camera.updateMatrixWorld();s.renderer.render(s.scene,s.camera);});
   await page.locator('canvas').screenshot({path:path.join(out,'detail-blue.png')});
  }
 }
 report.runs.push({name,...info});await context.close();
}assert.deepEqual(report.errors,[]);console.log('HQ runtime screenshots: '+phase);}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,`${phase}-visual.json`),JSON.stringify(report,null,2));}
