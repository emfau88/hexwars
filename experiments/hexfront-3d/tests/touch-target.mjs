import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4183'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise(r=>server.stdout.on('data',d=>{if(String(d).includes('http://'))r();}));
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await page.addInitScript(()=>{window.__events=[];document.addEventListener('pointerdown',e=>window.__events.push({target:e.target.dataset?.cell||e.target.nodeName,x:e.clientX,y:e.clientY}),true);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover); window.__s=scene; window.__taps=[];scene.onSelect=(id,reason)=>{window.__taps.push({id,reason});select(id,reason);};")});});
 await page.goto('http://127.0.0.1:4183/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 async function tap(id){
  const p=await page.evaluate(async id=>{const {surfaceHeight}=await import('/src/map.js'),s=window.__s,c=s.game.cell(id),r=s.container.getBoundingClientRect();for(const radius of [.48,.68,.24,0])for(let i=0;i<12;i++){const x=c.x+Math.cos(i*Math.PI/6)*radius,z=c.z+Math.sin(i*Math.PI/6)*radius,p=s.project(x,surfaceHeight(s.game.cells,c,x,z)+.01,z),clientX=p.x+r.x,clientY=p.y+r.y;if(document.elementFromPoint(clientX,clientY)===s.renderer.domElement&&s.pick({clientX,clientY})===id)return {x:clientX,y:clientY};}},id);
  const before=await page.evaluate(()=>window.__taps.length);await page.touchscreen.tap(p.x,p.y);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const result={wanted:id,p,...await page.evaluate(()=>({events:window.__events.at(-1),tap:window.__taps.at(-1),count:window.__taps.length}))};assert.equal(result.tap.id,id);assert.equal(result.count,before+1);results.push(result);
 }
 await tap('0,-3');await tap('1,-3');
 const label=await page.locator('[data-cell="2,-3"]').boundingBox(),before=await page.evaluate(()=>window.__taps.length);await page.touchscreen.tap(label.x+label.width/2,label.y+label.height/2);assert.equal(await page.evaluate(()=>window.__taps.at(-1).id),'2,-3');assert.equal(await page.evaluate(()=>window.__taps.length),before+1);
 await fs.writeFile('docs/camera/touch-target-report.json',JSON.stringify({viewport:'320 × 568',results,subsequentLabelTap:true},null,2));console.log('PASS: touch coordinates select the visible field despite browser retargeting; subsequent label taps remain functional.');
}finally{await browser.close();server.kill();}
