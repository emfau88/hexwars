import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {dragDriver,dragOrder,center,nextFrame} from './drag-helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=path.join(root,process.env.TEST_OUTPUT||'docs/drag');await fs.mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4188'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={runs:[],errors:[]};let page;
try{
 for(const mobile of [false,true]){
  const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover);window.__scene=scene;")});});
  await page.goto('http://127.0.0.1:4188/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);await nextFrame(page);
  const driver=await dragDriver(page,context,mobile),click=async selector=>{const p=await center(page,selector);if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);await nextFrame(page);};
  const state=()=>page.evaluate(()=>({game:window.__HEXFRONT3D__.snapshot(),selected:window.__scene.selected,drag:!!window.__scene.drag,pan:{...window.__scene.viewPan},zoom:window.__scene.zoom,frame:{...window.__scene.framing}}));
  const advance=s=>page.evaluate(s=>window.__HEXFRONT3D__.advance(s),s);
  const reset=async()=>{await page.reload();await page.waitForFunction(()=>window.__HEXFRONT3D__);await click('#primary');};
  const surface=id=>page.evaluate(async id=>{const s=window.__scene,c=s.game.cell(id),r=s.container.getBoundingClientRect(),{surfaceHeight}=await import('/src/map.js');for(const radius of [.48,.68,.2,0])for(let i=0;i<16;i++){const x=c.x+Math.cos(i*Math.PI/8)*radius,z=c.z+Math.sin(i*Math.PI/8)*radius,p=s.project(x,surfaceHeight(s.game.cells,c,x,z)+.015,z),q={x:p.x+r.x,y:p.y+r.y};if(document.elementFromPoint(q.x,q.y)===s.renderer.domElement&&s.pick({clientX:q.x,clientY:q.y})===id)return q;}throw Error(`No exposed surface ${id}`);},id);
  await click('#primary');
  // Direct idle drag, without a preceding selection or confirmation button.
  const start=await center(page,'[data-cell="-2,3"]'),before=await state();
  await driver.begin(start);await driver.move({x:start.x+11,y:start.y});await driver.move(await center(page,'[data-cell="-3,3"]'));
  const dragging=await state();assert.equal(dragging.drag,true);assert.deepEqual(dragging.frame,before.frame,'HUD must not reframe under a held pointer');assert.equal(dragging.game.commands,0,'preview never sends');assert.match(await page.locator('.drag-tip').textContent(),/Loslassen.*39/);
  await page.screenshot({path:path.join(out,`${name}-drag.png`)});await driver.end();
  let s=await state();assert.equal(s.game.commands,1);assert.equal(s.game.orders[0].units,39);assert.deepEqual(s.game.orders[0].path,['-2,3','-3,3']);assert.equal(s.selected,'-2,3','synthetic click cannot deselect source');assert.equal(s.drag,false);
  await advance(6);s=await state();assert.equal(s.game.cells.find(c=>c.id==='-3,3').owner,'orange');
  // Fraction choice, surface raycast source, and normal click fallback coexist.
  await reset();await click('[data-cell="-2,3"]');await click('#half');await click('#clear');
  const source=await surface('-2,3');await driver.begin(source);await driver.move({x:source.x+11,y:source.y});await driver.move(await surface('-3,3'));await driver.end();s=await state();assert.equal(s.game.commands,1);assert.equal(s.game.orders[0].units,20);
  await click('[data-cell="-1,3"]');await click('#primary');assert.equal((await state()).game.commands,2,'click fallback still sends');
  console.log(`${name}: direct drag, fraction and click fallback passed`);await reset();
  // Unreachable high ground, exact cliff geometry, outside release, same source.
  await dragOrder(page,driver,'-2,3','0,0');assert.equal((await state()).game.commands,0);assert.match(await page.locator('#toast').textContent(),/Felswand|Gebiet/);
  const cliff=await page.evaluate(async()=>{const T=await import('/vendor/three.module.min.js'),s=window.__scene,r=s.container.getBoundingClientRect();for(const o of s.occluders.filter(o=>o.userData.pickKind==='cliff')){const a=o.geometry.attributes.position;for(let i=0;i<a.count;i+=3){const v=new T.Vector3();for(let j=0;j<3;j++)v.add(new T.Vector3().fromBufferAttribute(a,i+j));v.divideScalar(3).applyMatrix4(o.matrixWorld);const p=s.project(v.x,v.y,v.z),q={x:p.x+r.x,y:p.y+r.y};if(document.elementFromPoint(q.x,q.y)!==s.renderer.domElement)continue;s.pick({clientX:q.x,clientY:q.y});if(s.lastPick.kind==='cliff')return q;}}throw Error('No cliff sample');});
  const own=()=>center(page,'[data-cell="-2,3"]');
  await driver.begin(await own());await driver.move(cliff);assert.equal(await page.locator('.drag-tip').getAttribute('data-valid'),'false');await driver.end();assert.match(await page.locator('#toast').textContent(),/Felswand/);
  await driver.begin(await own());await driver.move({x:12,y:20});await driver.end();assert.equal((await state()).game.commands,0,'outside is not a drop');
  await driver.begin(await own());await driver.move({x:start.x+16,y:start.y});await driver.move(await own());await driver.end();assert.equal((await state()).game.commands,0,'same source is not an order');
  // Escape / native touch cancellation cannot send, including trailing clicks.
  await driver.begin(await own());await driver.move(await center(page,'[data-cell="-3,3"]'));await driver.cancel();assert.equal((await state()).game.commands,0);assert.equal((await state()).drag,false);
  // A second finger changes to navigation and irrevocably cancels the order.
  if(mobile){const a=await own();await driver.begin(a);await driver.move({x:a.x+12,y:a.y});await driver.touch('touchStart',[{x:a.x+12,y:a.y,id:1},{x:a.x+72,y:a.y,id:2}]);await driver.touch('touchMove',[{x:a.x-8,y:a.y-10,id:1},{x:a.x+92,y:a.y+10,id:2}]);await driver.touch('touchEnd',[{x:a.x+92,y:a.y+10,id:2}]);await driver.touch('touchEnd',[]);await nextFrame(page);assert.equal((await state()).game.commands,0);assert.equal((await state()).drag,false);assert.ok((await state()).zoom>1);}
  await click('#fit');await click('#zoom-in');await click('#zoom-in');
  const box=await page.locator('#stage').boundingBox(),blank={x:box.x+12,y:box.y+14},navBefore=await state();
  await driver.begin(blank);await driver.move({x:blank.x+70,y:blank.y+45});await driver.end();const navAfter=await state();assert.equal(navAfter.game.commands,0);assert.notDeepEqual(navAfter.pan,navBefore.pan,'background drag pans');
  await click('#fit');await click('#zoom-in');
  const zoomBefore=await state();await dragOrder(page,driver,'-2,3','-3,3');const zoomAfter=await state();assert.equal(zoomAfter.game.commands,1);assert.deepEqual(zoomAfter.pan,zoomBefore.pan,'owned drag cannot pan while zoomed');
  await click('#pause');await dragOrder(page,driver,'-1,2','-1,3');assert.equal((await state()).game.commands,1,'paused gesture cannot send');await click('#pause');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  report.runs.push({name,idleDrag:true,stableFraming:true,exactlyOneOrder:true,capture:true,halfSend:true,surfacePicking:true,clickFallback:true,invalidAndCliffBlocked:true,outsideAndSelfCancelled:true,nativeCancellation:true,secondFingerCancels:mobile,backgroundPan:true,zoomedDrag:true,pausedNoSend:true});console.log(JSON.stringify(report.runs.at(-1)));await driver.close();await context.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'failure.png')});throw e;}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'input-report.json'),JSON.stringify(report,null,2));}
