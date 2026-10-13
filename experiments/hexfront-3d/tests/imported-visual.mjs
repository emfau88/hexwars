import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const phase=process.argv.includes('--before')?'before':'after',out='docs/imported-assets';await fs.mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4206'},windowsHide:true,stdio:['ignore','pipe','pipe']});await new Promise(r=>server.stdout.on('data',d=>String(d).includes('http://')&&r()));
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={phase,errors:[],views:[]};
try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover);window.__s=scene;").replace('scene.render(now);','if(!window.__record)scene.render(now);')});});
 await page.goto('http://127.0.0.1:4206/?qa=1&clock=manual'+(phase==='before'?'&assets=classic':''));await page.waitForFunction(()=>window.__HEXFRONT3D__,{},{timeout:120000});
 await page.evaluate(()=>{window.__s.game.start();window.__s.game.send('-2,3','-3,3',.5);window.__HEXFRONT3D__.advance(.8);window.__record=true;window.__s.visualTime=800;window.__s.render(800);});
 await page.evaluate(()=>window.__record=false);await page.waitForTimeout(250);
 await page.screenshot({path:`${out}/${phase}-${mobile?'mobile':'desktop'}.png`});await page.evaluate(()=>window.__record=true);
 report.views.push(await page.evaluate(()=>({width:innerWidth,triangles:window.__s.renderer.info.render.triangles,draws:window.__s.renderer.info.render.calls,frontier:window.__s.frontierStats,orders:window.__s.game.orders.length,cells:window.__s.game.cells.map(c=>({id:c.id,pick:window.__s.pick({clientX:window.__s.screenCell(c.id).x,clientY:window.__s.screenCell(c.id).y})}))})));
 if(!mobile){for(const kind of ['hq','relay','drone']){
  await page.evaluate(async kind=>{const s=window.__s,T=await import('/vendor/three.module.min.js'),c=s.game.cell(kind==='relay'?'0,0':'-2,3'),p=kind==='drone'?s.dronePoses.find(p=>!p.idle):null,target=p?new T.Vector3(p.x,p.y,p.z):new T.Vector3(c.x,c.height*1.05+(kind==='hq'?.56:.55),c.z-.1),e=38*Math.PI/180;
   s.camera.position.copy(target).add(new T.Vector3(-.62*Math.cos(e),Math.sin(e),.785*Math.cos(e)).multiplyScalar(30));s.camera.lookAt(target);const range=kind==='drone'?.63:1.15;s.camera.left=-range*s.width/s.height;s.camera.right=-s.camera.left;s.camera.top=range;s.camera.bottom=-range;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();s.labels.style.display='none';for(const m of s.markers.values())for(const o of Object.values(m))o.visible=false;s.gridUnderlay.visible=false;s.pathLine.visible=false;s.renderer.render(s.scene,s.camera);
  },kind);
  await page.locator('canvas').screenshot({path:`${out}/${phase}-${kind}-close.png`});
 }}await context.close();
}if(report.views.some(v=>v.cells.some(c=>c.id!==c.pick)))throw Error('Projected hex selection mismatch');if(report.errors.length)throw Error(report.errors.join('\n'));console.log('Captured '+phase+' assets in the real game.');}finally{await browser.close();server.kill();await fs.writeFile(`${out}/${phase}.json`,JSON.stringify(report,null,2));}
