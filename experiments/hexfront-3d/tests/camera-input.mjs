import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4181'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={runs:[],errors:[]};let page;
const out=path.join(root,'docs/camera');await fs.mkdir(out,{recursive:true});
try{
 for(const [width,height] of [[1440,900],[390,844],[320,568],[375,667],[430,932]]){
  const mobile=width<640,context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();const body=(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover); window.__cameraScene=scene; window.__picked=[]; scene.onSelect=(id,reason)=>{window.__picked.push({id,reason});select(id,reason);};");await route.fulfill({response,body});});
  await page.goto('http://127.0.0.1:4181/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);
  const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await frame();
  const click=async selector=>{const b=await page.locator(selector).boundingBox();assert.ok(b,selector);const x=b.x+b.width/2,y=b.y+b.height/2;assert.ok(await page.evaluate(({x,y,s})=>Boolean(document.elementFromPoint(x,y)?.closest(s)),{x,y,s:selector}));if(mobile)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);await frame();};
  const state=()=>page.evaluate(()=>{const s=window.__cameraScene;return {angle:s.angle,view:s.view,zoom:s.zoom,pan:s.viewPan,framing:s.framing,selected:s.selected,commands:window.__HEXFRONT3D__.snapshot().commands,picked:window.__picked.length};});
  assert.equal((await state()).angle,70);
  const exposedPoints=id=>page.evaluate(async id=>{
   const {surfaceHeight,cornerHeight,corner}=await import('/src/map.js'),s=window.__cameraScene,rect=s.container.getBoundingClientRect(),all=[];let clipped=0;
   for(const c of s.game.cells.filter(c=>!id||c.id===id)){for(let i=0;i<6;i++){const v=corner(c,i),p=s.project(v.x,cornerHeight(s.game.cells,c,i),v.z);if(p.x<0||p.y<0||p.x>s.width||p.y>s.height)clipped++;}
    let found;for(const radius of [.48,.68,.24,0]){for(let i=0;i<12;i++){const x=c.x+Math.cos(i*Math.PI/6)*radius,z=c.z+Math.sin(i*Math.PI/6)*radius,p=s.project(x,surfaceHeight(s.game.cells,c,x,z)+.01,z),clientX=p.x+rect.left,clientY=p.y+rect.top;
     if(document.elementFromPoint(clientX,clientY)!==s.renderer.domElement)continue;
     if(s.pick({clientX,clientY})===c.id){found={id:c.id,height:c.height,x:clientX,y:clientY,kind:s.lastPick.kind};break;}
    }if(found)break;}all.push(found||{id:c.id,missing:true});
   }return {all,clipped};
  },id);
  const points=await exposedPoints(),overviewPoints=[],detailPoints=[],needsDetail=[];
  assert.equal(points.clipped,0,`${width}: no playable corner clipped`);
  const tapPoint=async p=>{const before=(await state()).picked;if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);assert.equal(await page.evaluate(()=>window.__picked.at(-1)?.id),p.id,`${width}: real input ${p.id}`);assert.equal((await state()).picked,before+1);await frame();};
  // Hover can reveal neutral labels and move neighbouring labels. Always
  // observe the current layout before the next real tap, as a player would.
  for(const c of points.all){const p=(await exposedPoints(c.id)).all[0];if(p.missing)needsDetail.push(c);else{await tapPoint(p);overviewPoints.push(p);}}
  if(width>=390)assert.equal(overviewPoints.length,37,`${width}: every field has an exposed tap point in overview`);
  // Very short phones retain the entire map in overview. Test the actual +
  // controls and drag navigation for fields whose surfaces are covered by HUD
  // labels at that scale, rather than shrinking the touch targets.
  if(overviewPoints.length<37){
   await click('#zoom-in');await click('#zoom-in');await click('#zoom-in');
   for(const missing of needsDetail){
    let point=(await exposedPoints(missing.id)).all[0];
    if(point.missing){
     const move=await page.evaluate(id=>{const s=window.__cameraScene,c=s.game.cell(id),p=s.project(c.x,c.height*1.05,c.z),r=s.container.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,dx:Math.max(-r.width*.35,Math.min(r.width*.35,r.width/2-p.x)),dy:Math.max(-r.height*.35,Math.min(r.height*.35,r.height/2-p.y))};},missing.id);
     const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:move.x,y:move.y,id:7}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:move.x+move.dx,y:move.y+move.dy,id:7}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frame();await cdp.detach();
     point=(await exposedPoints(missing.id)).all[0];
    }
    assert.ok(!point.missing,`${width}: ${missing.id} reachable with detail zoom`);await tapPoint(point);detailPoints.push(point);
   }
   await page.screenshot({path:path.join(out,`${width}-detail.png`)});await click('#fit');
  }
  await click('#primary');await click('[data-cell="-1,2"]');assert.equal((await state()).selected,'-1,2');
  const objectTests=[];
  const testOcclusion=async()=>{
   const samples=await page.evaluate(async()=>{
    const T=await import('/vendor/three.module.min.js'),s=window.__cameraScene,r=s.container.getBoundingClientRect(),roofs=[];let cliff;
    const sample=(v,id,kind)=>{const p=s.project(v.x,v.y,v.z),x=p.x+r.x,y=p.y+r.y;if(document.elementFromPoint(x,y)!==s.renderer.domElement)return;const found=s.pick({clientX:x,clientY:y});if(found===id&&s.lastPick.kind===kind)return {id,x,y,kind};};
    for(const c of s.game.cells.filter(c=>c.hq)){let roof;for(const x of [-.4,0,.4])for(const z of [-.3,-.1,.2])roof||=sample(new T.Vector3(c.x+x,.94,c.z+z),c.id,'object');if(roof)roofs.push(roof);}
    for(const o of s.occluders.filter(o=>o.userData.pickKind==='cliff')){const a=o.geometry.attributes.position;for(let i=0;i<a.count&&!cliff;i+=3){const v=new T.Vector3();for(let j=0;j<3;j++)v.add(new T.Vector3().fromBufferAttribute(a,i+j));v.divideScalar(3).applyMatrix4(o.matrixWorld);if(v.y>.15&&v.y<1.85&&Math.hypot(v.x,v.z)<4.5)cliff=sample(v,null,'cliff');}}
    return {angle:s.angle,roofs,cliff};
   });
   assert.equal(samples.roofs.length,2,`${width}: both HQ roofs map to their own logical field`);for(const roof of samples.roofs)await tapPoint(roof);
   assert.ok(samples.cliff,`${width}: exposed central cliff test point`);const selected=(await state()).selected;await tapPoint(samples.cliff);assert.equal((await state()).selected,selected,'cliff never changes selection');assert.equal(await page.evaluate(()=>window.__picked.at(-1).reason),'cliff');assert.match(await page.locator('#toast').textContent(),/Felswand/);
   objectTests.push({angle:samples.angle,hqRoofs:2,cliffPreservesSelection:true});
  };
  if(width>=390)await testOcclusion();
  const beforeSwitch=await state();await click('#camera-view');assert.equal((await state()).angle,55);assert.equal((await state()).selected,beforeSwitch.selected);if(width>=390)await testOcclusion();await page.screenshot({path:path.join(out,`${width}-diorama.png`)});await click('#fit');assert.equal((await state()).angle,70);assert.equal((await state()).selected,beforeSwitch.selected);
  await click('#zoom-in');assert.ok((await state()).zoom>1);const stage=await page.locator('#stage').boundingBox(),x=stage.x+stage.width*.5,y=stage.y+stage.height*.85;
  const beforeGesture=await state();
  if(mobile){
   const cdp=await context.newCDPSession(page),touch=(points,type)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
   await touch([{x:x-30,y,id:1},{x:x+30,y,id:2}],'touchStart');await touch([{x:x-65,y:y-10,id:1},{x:x+65,y:y+10,id:2}],'touchMove');await touch([{x:x+65,y:y+10,id:2}],'touchEnd');await touch([],'touchEnd');await frame();
   assert.ok((await state()).zoom>beforeGesture.zoom,'pinch zooms');
   await touch([{x,y,id:3}],'touchStart');await touch([{x:x+200,y:y-180,id:3}],'touchMove');await touch([],'touchEnd');await frame();
  }else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+600,y-450,{steps:8});await page.mouse.up();await frame();await page.mouse.move(x,y);await page.mouse.wheel(0,-300);await frame();}
  const afterGesture=await state();assert.equal(afterGesture.commands,beforeGesture.commands);assert.equal(afterGesture.selected,beforeGesture.selected);assert.equal(afterGesture.picked,beforeGesture.picked,'gestures never select a field');assert.ok(Math.abs(afterGesture.pan.u)<=afterGesture.framing.limitU+.001);assert.ok(Math.abs(afterGesture.pan.v)<=afterGesture.framing.limitV+.001);assert.ok(afterGesture.zoom<=2.2);
  await click('#fit');const reset=await state();assert.equal(reset.zoom,1);assert.ok(Math.abs(reset.pan.u)<.001&&Math.abs(reset.pan.v)<.001);assert.equal(reset.angle,70);
  if(width===390){await page.setViewportSize({width:402,height:874});await frame();assert.equal((await state()).selected,beforeSwitch.selected);assert.equal(await page.locator('[data-cell="-1,2"]').getAttribute('aria-pressed'),'true');await page.setViewportSize({width,height});await frame();}
  await click('#clear');const layout=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,footer:box('#primary').bottom<=innerHeight,stageClearsCommands:box('#stage').bottom<=box('.command-panel').top-15,scoreClearsTools:innerWidth>640||box('.battle-status').bottom<=box('.map-tools').top,toolsClearMap:innerWidth>640||box('.map-tools').bottom<=box('#stage').top};});assert.equal(layout.overflow,false);assert.equal(layout.footer,true);assert.equal(layout.stageClearsCommands,true);assert.equal(layout.scoreClearsTools,true);assert.equal(layout.toolsClearMap,true);
  await page.screenshot({path:path.join(out,`${width}-input.png`)});
  const result={width,height,canvasTaps:overviewPoints.length+detailPoints.length,overviewTaps:overviewPoints.length,detailTaps:detailPoints.length,heights:[...new Set([...overviewPoints,...detailPoints].map(p=>p.height))],clippedCorners:points.clipped,objectTests,viewSwitchPreservesSelection:true,gestureDoesNotSelect:true,zoomClamped:true,reset:true,...layout};report.runs.push(result);console.log(JSON.stringify(result));await context.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'input-failure.png')});throw e;}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'input-report.json'),JSON.stringify(report,null,2));}
