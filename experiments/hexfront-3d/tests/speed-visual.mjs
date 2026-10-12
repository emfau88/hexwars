import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {dragDriver,dragOrder,nextFrame} from './drag-helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),out=path.join(root,'docs/technology/speeds');
await fs.mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4193'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={runs:[],errors:[]};
try{
 for(const speed of [1.2,1.1,1.0]){
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),driver=await dragDriver(page,context,false);
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('**/src/game.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('TRANSPORT_SECONDS_PER_HEX = 1.1',`TRANSPORT_SECONDS_PER_HEX = ${speed}`)});});
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);",`scene=new Diorama($('stage'),$('labels'),game,select,hover);window.__s=scene;window.__step=seconds=>{for(let i=0;i<Math.round(seconds*20);i++){game.update(.05);processEvents();updateUI();scene.render((scene.visualLast??0)+50);}};`).replace('scene.render(now);','scene.render(window.__freeze?(scene.visualLast??0):now);')});});
  await page.goto('http://127.0.0.1:4193/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);await page.locator('#primary').click();await nextFrame(page);
  await dragOrder(page,driver,'-2,3','-3,3');
  await page.evaluate(()=>{window.__freeze=true;const s=window.__s;s.visualLast=0;s.zoomBy(2.2);const c=s.game.cell('-3,3'),p=s.project(c.x,.6,c.z);s.viewPan={u:(p.x-s.width/2)/s.framing.scale,v:(s.height/2-p.y)/s.framing.scale};s.resize();s.render(0);});
  const frames=[];for(let i=1;i<=4;i++){
   await page.evaluate(()=>window.__step(.3));await nextFrame(page);
   const file=`speed-${speed.toFixed(1)}-${i}.jpg`;await page.locator('canvas').screenshot({path:path.join(out,file),quality:80});
   frames.push({file,seconds:i*.3,state:await page.evaluate(()=>({orders:window.__HEXFRONT3D__.snapshot().orders,poses:window.__s.dronePoses.map(p=>({x:p.x,y:p.y,z:p.z}))}))});
  }
  assert.equal(await page.evaluate(()=>window.__HEXFRONT3D__.snapshot().cells.find(c=>c.id==='-3,3').owner),'orange');report.runs.push({speed,frames});await driver.close();await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log('PASS: 1.2 / 1.1 / 1.0 s runtime comparison captured.');
}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));}
