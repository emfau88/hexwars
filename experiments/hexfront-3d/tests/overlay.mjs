import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const phase=process.argv.includes('--baseline')?'before':'after',out=path.join(root,'docs/hud');
await fs.mkdir(out,{recursive:true});
if(phase==='before')try{await fs.access(path.join(out,'before-report.json'));throw Error('Preserve the existing baseline');}catch(e){if(e.code!=='ENOENT')throw e;}
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4187'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={phase,date:new Date().toISOString(),runs:[],errors:[]};let page;
try{
 for(const mobile of [false,true]){
  const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await page.goto('http://127.0.0.1:4187/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);
  const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
  const click=async selector=>{const b=await page.locator(selector).boundingBox();assert.ok(b,selector);const x=b.x+b.width/2,y=b.y+b.height/2;assert.ok(await page.evaluate(({x,y,selector})=>!!document.elementFromPoint(x,y)?.closest(selector),{x,y,selector}),`Unoccluded ${selector}`);if(mobile)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);await frame();};
  const snapshot=()=>page.evaluate(()=>window.__HEXFRONT3D__.snapshot());
  const run={name,states:[]};
  const capture=async state=>{
   await page.mouse.move(0,0);await frame();
   const layout=await page.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
    const badges=[...document.querySelectorAll('.garrison')].filter(e=>getComputedStyle(e).visibility==='visible').map(e=>{const face=e.querySelector('.badge-face')||e,b=face.getBoundingClientRect(),hit=e.getBoundingClientRect(),s=getComputedStyle(face);return {id:e.dataset.cell,role:e.dataset.role,priority:e.dataset.priority,units:e.querySelector('.count').textContent,face:{width:b.width,height:b.height},hit:{x:hit.x,y:hit.y,width:hit.width,height:hit.height},font:s.fontSize,opacity:s.opacity,background:s.backgroundColor};});
    return {stage:rect('#stage'),panel:rect('.command-panel'),score:rect('.battle-status'),tools:rect('.map-tools'),header:rect('.topbar'),overflow:document.documentElement.scrollWidth>innerWidth,hud:document.body.dataset.hud,visibleBadges:badges.length,faceArea:Math.round(badges.reduce((sum,b)=>sum+b.face.width*b.face.height,0)),badges};
   });
   assert.equal(layout.overflow,false);
   const game=await snapshot();
   if(phase==='after'){
    const before=JSON.parse(await fs.readFile(path.join(out,'before-report.json'),'utf8')).runs.find(r=>r.name===name).states.find(s=>s.state===state);
    assert.deepEqual(game,before.game,`${name} ${state}: unchanged game state`);
    if(mobile){assert.ok(layout.stage.bottom<=layout.panel.y-15);assert.ok(layout.score.bottom<=layout.tools.y);assert.ok(layout.tools.bottom<=layout.stage.y);}
    if(state==='battle'){assert.ok(layout.faceArea<before.layout.faceArea*.75,'Less visible badge area');if(mobile)assert.ok(layout.stage.height>before.layout.stage.height+100,'Recover at least 100px of mobile map height');}
    for(const b of layout.badges){if(mobile)assert.ok(b.hit.width>=43.99&&b.hit.height>=43.99,'Preserve touch area');assert.ok(parseFloat(b.font)>=11,'Legible badge text');}
    if(state==='command'){assert.ok(layout.badges.some(b=>b.role==='source'));assert.ok(layout.badges.some(b=>b.role==='target'));}
   }
   await page.screenshot({path:path.join(out,`${name}-${phase}-${state}.jpg`),type:'jpeg',quality:90});
   run.states.push({state,game,layout});
  };
  await capture('start');await click('#primary');await capture('running');
  await page.evaluate(()=>window.__HEXFRONT3D__.advance(5.05));
  for(let turn=0;turn<20;turn++){
   const action=await page.evaluate(()=>window.__HEXFRONT3D__.suggest());
   if(action){if(await page.locator('#clear').isVisible())await click('#clear');await click(`[data-cell="${action.from}"]`);await click(action.fraction<.65?'#half':'#all');await click(`[data-cell="${action.to}"]`);await click('#primary');}
   await page.evaluate(()=>window.__HEXFRONT3D__.advance(5.05));
  }
  if(await page.locator('#clear').isVisible())await click('#clear');
  await capture('battle');
  const action=await page.evaluate(()=>window.__HEXFRONT3D__.suggest());assert.ok(action);
  await click(`[data-cell="${action.from}"]`);await capture('selection');
  await click(action.fraction<.65?'#half':'#all');await click(`[data-cell="${action.to}"]`);await capture('command');
  await click('#primary');await capture('movement');
  report.runs.push(run);console.log(JSON.stringify({name,phase,states:run.states.map(s=>({state:s.state,seconds:s.game.time,badges:s.layout.visibleBadges,faceArea:s.layout.faceArea,stageHeight:s.layout.stage.height,panelHeight:s.layout.panel.height}))}));
  await context.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;if(page&&!page.isClosed())await page.screenshot({path:path.join(out,`${phase}-failure.png`)});throw e;}
finally{await browser.close();server.kill();await fs.writeFile(path.join(out,`${phase}-report.json`),JSON.stringify(report,null,2));}
