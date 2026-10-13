// Native menu and mouse/touch input, real Battle progression, actual runtime captures.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dragDriver,dragOrder} from './drag-helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'docs/campaign');
await fs.mkdir(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4202'},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((r,j)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))r();});server.on('error',j);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={date:new Date().toISOString(),errors:[],views:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1}),page=await context.newPage();
 async function instrument(page){
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();let body=await response.text();
   body=body.replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);",`scene=new Diorama($('stage'),$('labels'),game,select,hover);window.__record=true;window.__s=scene;window.__draw=()=>scene.render(performance.now());window.__play=(active=true)=>{let next=game.time+3;for(let tick=0;tick<12000&&!game.result;tick++){game.update(.05);if(active&&game.time>next){const a=chooseOrder(game,'orange');if(a)game.send(a.from,a.to,a.fraction<.65?.5:1);next=game.time+(game.missionId==='auenstrom'?6:5);}if(!game.result)game.drainEvents();}processEvents();updateUI();window.__draw();return game.snapshot();};`);
   body=body.replace('scene.render(now);','if(!window.__record)scene.render(now);');await route.fulfill({response,body});
  });
 }
 async function ready(page){await page.waitForFunction(()=>window.__HEXFRONT3D__,{},{timeout:120000});await page.evaluate(()=>window.__draw());}
 await instrument(page);await page.goto('http://127.0.0.1:4202/?qa=1&clock=manual');await ready(page);
 await page.locator('#campaign-open').click();assert.equal(await page.locator('[data-mission="windpass"]').isDisabled(),true);
 await page.screenshot({path:path.join(out,'menu-desktop.png')});
 await page.locator('.campaign-launch').click();assert.equal((await page.evaluate(()=>window.__HEXFRONT3D__.snapshot())).running,true);
 await page.locator('#campaign-open').click();assert.equal((await page.evaluate(()=>window.__HEXFRONT3D__.snapshot())).paused,true);
 const paused=await page.evaluate(()=>window.__HEXFRONT3D__.advance(5));assert.equal(paused.time,0);
 await page.locator('.campaign-resume').click();assert.equal((await page.evaluate(()=>window.__HEXFRONT3D__.snapshot())).paused,false);
 const won=await page.evaluate(()=>window.__play());assert.equal(won.result,'victory');await page.waitForSelector('#result-dialog[open]');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hexfront.campaign.v1')));assert.deepEqual(saved.completed,['morgenwacht']);
 report.progression={mission1Victory:won.time,unlockSaved:true,pauseResume:true};
 await page.locator('#next-mission').click();await page.waitForURL('**/*mission=windpass*');await ready(page);
 assert.equal((await page.evaluate(()=>window.__HEXFRONT3D__.snapshot())).missionId,'windpass');
 await page.locator('#campaign-open').click();await page.screenshot({path:path.join(out,'menu-unlocked.png')});await page.locator('.campaign-resume').click();
 async function captureMap(page,name){
  await page.evaluate(()=>{window.__record=false;document.querySelector('#toast').classList.remove('visible');});await page.waitForTimeout(250);
  const data=await page.evaluate(()=>{const s=window.__s;return {cells:s.game.cells.map(c=>{const p=s.screenCell(c.id),pick=s.pick({clientX:p.x,clientY:p.y});const badge=document.querySelector(`[data-cell="${c.id}"]`),b=badge?.getBoundingClientRect();return {id:c.id,height:c.height,kind:c.kind,point:p,pick,badge:b?{x:b.x,y:b.y,width:b.width,height:b.height}:null};}),metrics:window.__HEXFRONT3D__.metrics(),scrollWidth:document.documentElement.scrollWidth,width:innerWidth};});
  assert.ok([33,34,37].includes(data.cells.length));assert.ok(data.cells.every(c=>c.pick===c.id),`Wrong terrain pick in ${name}: ${data.cells.filter(c=>c.pick!==c.id).map(c=>c.id)}`);assert.ok(data.cells.every(c=>c.point.x>0&&c.point.x<data.width&&c.point.y>0));assert.equal(data.scrollWidth,data.width);
  await page.screenshot({path:path.join(out,`${name}.png`)});report.views.push({name,...data});await page.evaluate(()=>window.__record=true);
 }
 await captureMap(page,'windpass-desktop');
 const mouse=await dragDriver(page,context,false);await dragOrder(page,mouse,'-2,4','-3,4');assert.equal((await page.evaluate(()=>window.__HEXFRONT3D__.snapshot())).commands,1);await mouse.close();
 await page.evaluate(()=>window.__HEXFRONT3D__.advance(4));await captureMap(page,'windpass-order-desktop');
 await page.locator('#zoom-in').click();await page.locator('#fit').click();assert.equal(await page.evaluate(()=>window.__s.zoom),1);
 await page.locator('#campaign-open').click();await page.locator('.campaign-launch').click();
 const loss=await page.evaluate(()=>window.__play(false));assert.equal(loss.result,'defeat');await page.waitForSelector('#result-dialog[open]');assert.equal(await page.locator('#next-mission').isVisible(),false);
 await page.locator('#restart').click();assert.equal((await page.evaluate(()=>window.__HEXFRONT3D__.snapshot())).time,0);
 const won2=await page.evaluate(()=>window.__play());assert.equal(won2.result,'victory');await page.waitForSelector('#result-dialog[open]');
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('hexfront.campaign.v1')).completed),['morgenwacht','windpass']);
 report.progression={...report.progression,mission2Victory:won2.time,mission2Defeat:loss.time,restart:true,campaignComplete:true,mouseCommand:true,zoomFit:true};
 await page.locator('#next-mission').click();await page.waitForURL('**/*mission=auenstrom*');await ready(page);
 await captureMap(page,'auenstrom-desktop');
 const riverMouse=await dragDriver(page,context,false);await dragOrder(page,riverMouse,'-1,3','0,3');assert.equal((await page.evaluate(()=>window.__HEXFRONT3D__.snapshot())).commands,1);await riverMouse.close();
 await page.locator('#campaign-open').click();await page.locator('.campaign-launch').click();
 const won3=await page.evaluate(()=>window.__play());assert.equal(won3.result,'victory');await page.waitForSelector('#result-dialog[open]');assert.equal(await page.locator('#next-mission').isVisible(),false);
 await page.locator('#restart').click();const loss3=await page.evaluate(()=>window.__play(false));assert.equal(loss3.result,'defeat');await page.waitForSelector('#result-dialog[open]');
 report.progression.mission3={victory:won3.time,defeat:loss3.time,mouseCommand:true};
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('hexfront.campaign.v1')).completed),['morgenwacht','windpass','auenstrom']);
 await page.locator('#result-campaign').click();await page.screenshot({path:path.join(out,'menu-complete.png')});
 await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}),phone=await mobile.newPage();await instrument(phone);
 await phone.goto('http://127.0.0.1:4202/?qa=1&clock=manual');await ready(phone);await phone.locator('#campaign-open').click();await phone.screenshot({path:path.join(out,'menu-mobile.png')});
 // QA may load mission 2 directly for independent touch/visibility checks; public builds cannot.
 await phone.goto('http://127.0.0.1:4202/?qa=1&clock=manual&mission=windpass');await ready(phone);await phone.locator('#primary').click();await captureMap(phone,'windpass-mobile');
 const touch=await dragDriver(phone,mobile,true);await dragOrder(phone,touch,'-2,4','-3,4');assert.equal((await phone.evaluate(()=>window.__HEXFRONT3D__.snapshot())).commands,1);
 await phone.evaluate(()=>window.__HEXFRONT3D__.advance(4));await phone.locator('#zoom-in').tap();await phone.locator('#fit').tap();assert.equal(await phone.evaluate(()=>window.__s.zoom),1);
 await captureMap(phone,'windpass-mobile-command');await touch.close();report.progression.touchCommand=true;
 await phone.setViewportSize({width:360,height:740});await phone.evaluate(()=>window.__draw());await captureMap(phone,'windpass-small-mobile');
 await phone.setViewportSize({width:390,height:844});await phone.goto('http://127.0.0.1:4202/?qa=1&clock=manual&mission=auenstrom');await ready(phone);await phone.locator('#primary').click();await captureMap(phone,'auenstrom-mobile');
 const riverTouch=await dragDriver(phone,mobile,true);await dragOrder(phone,riverTouch,'-1,3','0,3');assert.equal((await phone.evaluate(()=>window.__HEXFRONT3D__.snapshot())).commands,1);await riverTouch.close();
 await phone.locator('#quality').tap();await phone.locator('#zoom-in').tap();await phone.locator('#fit').tap();await captureMap(phone,'auenstrom-mobile-low');
 report.progression.mission3.touchCommand=true;report.progression.mission3.lowQuality=true;
 await mobile.close();assert.deepEqual(report.errors,[]);
 console.log('PASS campaign progression, three real victories, defeats, replay, native mouse/touch, zoom and responsive screenshots.');
}catch(error){report.failure=error.stack;throw error;}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'runtime-report.json'),JSON.stringify(report,null,2));}
