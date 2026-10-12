import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4183'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={date:new Date().toISOString(),runs:[],errors:[]},out=path.join(root,'docs/camera');
try{
 for(const mobile of [false,true]){
  const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  // Read the renderer; all orders still go through real UI input.
  await page.route('**/src/main.js',async route=>{const response=await route.fetch(),body=(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover); window.__cameraScene=scene;");await route.fulfill({response,body});});
  await page.goto('http://127.0.0.1:4183/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);
  const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await frame();
  const click=async selector=>{const b=await page.locator(selector).boundingBox();assert.ok(b,selector);const x=b.x+b.width/2,y=b.y+b.height/2;assert.ok(await page.evaluate(({x,y,s})=>!!document.elementFromPoint(x,y)?.closest(s),{x,y,s:selector}),`Unoccluded ${selector}`);if(mobile)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);await frame();};
  const snapshot=()=>page.evaluate(()=>window.__HEXFRONT3D__.snapshot());
  const layers=()=>page.evaluate(()=>{const s=window.__cameraScene;return s.game.cells.map(c=>{const {marker,fill,action}=s.markers.get(c.id);return {id:c.id,owner:c.owner,height:c.height,outline:marker.material.color.getHexString(),fill:fill.material.color.getHexString(),opacity:fill.material.opacity,action:action.visible,selected:s.selected===c.id,label:s.labelsById.get(c.id).className};});});
  const checkColours=rows=>{for(const r of rows){if(r.owner==='neutral')continue;const colour=r.owner==='orange'?'d59a59':'70a5bd';assert.equal(r.outline,colour,`${r.id}: team outline`);assert.equal(r.fill,colour,`${r.id}: team floor`);assert.ok(r.opacity>=.28,`${r.id}: visible territory`);assert.ok(r.label.includes(r.owner),`${r.id}: matching troop badge`);}};
  const initial=await snapshot();checkColours(await layers());
  await click('#primary');await click('[data-cell="-2,3"]');
  let selected=await layers();checkColours(selected);assert.ok(selected.find(c=>c.id==='-2,3').action);assert.ok(selected.find(c=>c.id==='-2,2').action);assert.ok(selected.find(c=>c.id==='-3,3').action);
  await click('[data-cell="-3,3"]');await click('#primary');await page.evaluate(()=>window.__HEXFRONT3D__.advance(30));await frame();
  const state=await snapshot(),captures=state.cells.filter(c=>initial.cells.find(a=>a.id===c.id).owner==='neutral'&&c.owner!=='neutral');
  assert.ok(captures.some(c=>c.owner==='orange'));assert.ok(captures.some(c=>c.owner==='blue'));assert.ok(state.aiCommands>0);checkColours(await layers());
  await click('#clear');await click('[data-cell="-3,3"]');checkColours(await layers());
  assert.ok((await layers()).find(c=>c.id==='-3,3').action,'Captured field selectable with independent command ring');
  // Same ownership and action layers must follow the 3D surface in both views.
  await click('#camera-view');checkColours(await layers());await click('#zoom-in');checkColours(await layers());await click('#fit');checkColours(await layers());
  await page.mouse.move(0,0);await frame();await page.screenshot({path:path.join(out,`territory-${name}.png`)});
  await click('#clear');await page.evaluate(()=>window.__HEXFRONT3D__.advance(400));await frame();
  assert.equal((await snapshot()).result,'defeat');checkColours(await layers());
  await click('#restart');checkColours(await layers());
  assert.deepEqual((await snapshot()).cells.map(c=>c.owner),initial.cells.map(c=>c.owner),'Restart restores territory colours and owners');
  report.runs.push({name,seconds:state.time,commands:state.commands,aiCommands:state.aiCommands,captures:captures.map(({id,owner,height})=>({id,owner,height})),teamColoursMatch:true,independentSelection:true,viewZoomFit:true,restart:true});console.log(JSON.stringify(report.runs.at(-1)));await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log('PASS: real Orange and Blue captures update floor, outlines and labels; selection, camera, zoom and restart preserve ownership.');
}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'territory-report.json'),JSON.stringify(report,null,2));}
