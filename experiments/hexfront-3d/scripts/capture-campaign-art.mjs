// Menu illustrations are photographs of our running Three.js maps, not concept art.
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
await fs.mkdir('public/assets/campaign',{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4204'},windowsHide:true,stdio:['ignore','pipe','pipe']});await new Promise(r=>server.stdout.on('data',d=>String(d).includes('http://')&&r()));
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']});
try{const page=await browser.newPage({viewport:{width:1000,height:800},deviceScaleFactor:1});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover);window.__s=scene;").replace('scene.render(now);','if(!window.__poster)scene.render(now);')});});
 for(const id of ['morgenwacht','windpass','auenstrom']){
  await page.goto(`http://127.0.0.1:4204/?qa=1&clock=manual&mission=${id}`);await page.waitForFunction(()=>window.__HEXFRONT3D__);
  await page.addStyleTag({content:'body>header,main>*:not(#stage),#labels{display:none!important}main{position:fixed!important;inset:0!important}#stage{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important}'});
  await page.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));window.__poster=true;const s=window.__s;s.setView('diorama');s.fit();s.render(0);for(const v of s.markers.values())for(const part of Object.values(v))part.visible=false;s.renderer.render(s.scene,s.camera);});
  await page.locator('canvas').screenshot({path:`public/assets/campaign/${id}.jpg`,quality:90});
 }
 console.log('Captured three real-engine map illustrations.');
}finally{await browser.close();server.kill();}
