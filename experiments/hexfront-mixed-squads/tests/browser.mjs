import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'test-results');
await fs.mkdir(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const servers=[];
async function serve(port,production=false){
  const child=spawn(process.execPath,['scripts/serve.mjs',...(production?['--production']:[])],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});servers.push(child);
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server startup timed out')),15000);child.stdout.on('data',data=>{if(String(data).includes('http://')){clearTimeout(timeout);resolve();}});child.on('error',reject);child.on('exit',code=>{if(code)reject(Error('Server failed: '+code));});});
}
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']});
const report={errors:[],checks:[],matches:[],screens:[]};let current;
function monitor(page){current=page;page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});}
async function instrument(page){
  monitor(page);
  await page.route('**/hexfront-mixed-squads/src/main.js',async route=>{
    const response=await route.fetch();let source=await response.text();
    // Test-only access to the existing objects. Full matches still use send,
    // production and the real update loop, never rewritten troops or results.
    source=source.replace('} catch(error){',`window.__mixedHarness={game,scene,draw:()=>{updateUI();scene.render(performance.now());},play:(player=true)=>{
      let next=game.time+3;const cadence=game.missionId==='auenstrom'?4:3.5;
      for(let n=0;n<18000&&!game.result;n++){game.update(.05);if(player&&game.time>=next){game.manageAI('orange');next=game.time+cadence;}if(!game.result)game.drainEvents();}
      processEvents();updateUI();scene.render(performance.now());return game.snapshot();
    }};
    } catch(error){`);
    await route.fulfill({response,body:source});
  });
}
async function ready(page){await page.waitForFunction(()=>window.__HEXFRONT3D__&&window.__mixedHarness,{},{timeout:60000});}
const snapshot=page=>page.evaluate(()=>window.__HEXFRONT3D__.snapshot());
const advance=(page,n)=>page.evaluate(n=>window.__HEXFRONT3D__.advance(n),n);
async function shot(page,name){await page.screenshot({path:path.join(out,name+'.png')});report.screens.push(name);}
async function clear(page){if(await page.locator('#clear').isVisible())await page.locator('#clear').click();}
async function pick(page,id){await page.locator(`.garrison[data-cell="${id}"]`).click();}
async function layout(page){
  const state=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('#command-options button,#primary')].filter(b=>b.getBoundingClientRect().width&&b.getBoundingClientRect().height).map(b=>{const r=b.getBoundingClientRect();return {id:b.id||b.dataset.unit,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}),height:innerHeight}));
  assert.equal(state.scroll,state.width,'horizontal overflow');
  for(const c of state.controls)assert.ok(c.x>=0&&c.right<=state.width+1&&c.y>=0&&c.bottom<=state.height+1,`Control outside viewport: ${JSON.stringify(c)}`);
}
try {
  await serve(4286);const base='http://127.0.0.1:4286/hexfront-mixed-squads/';
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await context.addInitScript(()=>{if(!localStorage.getItem('hexfront.campaign.v1'))localStorage.setItem('hexfront.campaign.v1','original-campaign-sentinel');});
  const page=await context.newPage();await instrument(page);await page.goto(base+'?qa=1&clock=manual');await ready(page);
  await page.locator('#campaign-open').click();assert.ok(await page.locator('[data-mission="windpass"]').isDisabled());await page.locator('.campaign-launch').click();
  await page.locator('#production-open').click();assert.ok((await snapshot(page)).paused);
  const initial=(await snapshot(page)).factions.orange.queue.length;await page.locator('#enqueue-mech').click();assert.equal((await snapshot(page)).factions.orange.queue.length,initial+1);
  await page.locator('#production-queue button').last().click();assert.equal((await snapshot(page)).factions.orange.queue.length,initial);
  await page.locator('#repeat-production').click();assert.equal((await snapshot(page)).factions.orange.repeat,false);
  await advance(page,3);assert.equal((await snapshot(page)).time,0);await page.locator('#production-done').click();assert.equal((await snapshot(page)).paused,false);
  await advance(page,.1);await page.locator('#production-open').click();const credits=(await snapshot(page)).factions.orange.credits;
  await page.locator('#production-cancel').click();assert.ok(Math.abs((await snapshot(page)).factions.orange.credits-credits-12)<1e-6);
  await page.locator('#repeat-production').click();await page.locator('#pause-production').click();await shot(page,'production-desktop');await page.locator('#production-done').click();
  const units=(await snapshot(page)).cells.find(c=>c.hq==='orange').units;await advance(page,3);assert.equal((await snapshot(page)).cells.find(c=>c.hq==='orange').units,units);
  await page.locator('#production-open').click();await page.locator('#pause-production').click();await page.locator('#production-done').click();report.checks.push('queue, repeat, refund, pause and planning via native buttons');
  await page.locator('#campaign-open').click();await page.locator('.campaign-launch').click();
  await pick(page,'-2,3');await page.locator('[data-unit="drone"]').click();await pick(page,'-3,3');await layout(page);await page.locator('#primary').click();
  let state=await snapshot(page);assert.equal(state.orders.length,1);assert.equal(state.orders[0].troops.mech.length,0);assert.equal(state.orders[0].units,14);
  state=await advance(page,1.4);assert.equal(state.cells.find(c=>c.id==='-3,3').owner,'orange');assert.equal(state.cells.find(c=>c.id==='-3,3').battle,null);await shot(page,'combat-desktop');
  state=await advance(page,3);assert.equal(state.cells.find(c=>c.id==='-3,3').owner,'orange');
  const poses=await page.evaluate(()=>window.__HEXFRONT3D__.formations());assert.ok(poses.drones.some(p=>p.cellId==='-3,3'&&p.owner==='orange'));assert.equal(state.cells.find(c=>c.hq==='blue').troops.mech[0].count,2);
  await clear(page);await pick(page,'-3,3');await page.locator('#rally-set').click();assert.equal((await snapshot(page)).factions.orange.rally,'-3,3');
  const before=(await snapshot(page)).cells.find(c=>c.id==='-3,3').units;state=await advance(page,18);assert.ok(state.cells.find(c=>c.id==='-3,3').units>before);assert.ok(state.cells.find(c=>c.hq==='orange').units>=6);
  await page.locator('[data-unit="all"]').click();await clear(page);
  const points=await page.evaluate(()=>['-3,3','-3,2'].map(id=>window.__HEXFRONT3D__.point(id)));const commands=(await snapshot(page)).commands;
  await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();await page.mouse.move(points[1].x,points[1].y,{steps:8});await page.mouse.up();assert.equal((await snapshot(page)).commands,commands+1);
  await page.locator('#quality').click();await page.locator('#zoom-in').click();await page.locator('#fit').click();await shot(page,'supply-desktop');report.checks.push('mouse click and drag, drone-only order, persistent squads, combat and rally delivery');
  // Real campaign progression, unchanged starting formations and credit rules.
  await page.locator('#campaign-open').click();await page.locator('.campaign-launch').click();
  for(const mission of ['morgenwacht','windpass','auenstrom']){
    await ready(page);const won=await page.evaluate(()=>window.__mixedHarness.play());assert.equal(won.missionId,mission);assert.equal(won.result,'victory');await page.waitForSelector('#result-dialog[open]');
    report.matches.push({mission,result:won.result,seconds:won.time,playerCommands:won.commands,aiCommands:won.aiCommands});
    assert.equal(await page.evaluate(()=>localStorage.getItem('hexfront.campaign.v1')),'original-campaign-sentinel');
    if(mission!=='auenstrom'){await page.locator('#next-mission').click();await page.waitForLoadState('load');}
  }
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('hexfront.mixed-squads.campaign.v1')).completed),['morgenwacht','windpass','auenstrom']);
  await page.locator('#result-campaign').click();await shot(page,'campaign-complete');await page.locator('.campaign-launch').click();
  const lost=await page.evaluate(()=>window.__mixedHarness.play(false));assert.equal(lost.result,'defeat');await page.waitForSelector('#result-dialog[open]');assert.equal(await page.locator('#next-mission').isVisible(),false);await page.locator('#restart').click();assert.equal((await snapshot(page)).time,0);
  report.checks.push('three wins, unlocks, defeat, replay; original campaign storage preserved');
  // Original 3D variant still runs from its unchanged entry point on this server.
  const original=await context.newPage();monitor(original);await original.goto('http://127.0.0.1:4286/hexfront-3d/?qa=1&clock=manual');await original.waitForFunction(()=>window.__HEXFRONT3D__);const old=await original.evaluate(()=>window.__HEXFRONT3D__.snapshot());assert.equal(old.economyMode,'hq-centralized');assert.equal(old.cells[0].troops,undefined);await original.close();
  await context.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  const phone=await mobile.newPage();await instrument(phone);await phone.goto(base+'?qa=1&clock=manual');await ready(phone);await phone.locator('#primary').tap();
  await phone.locator('.garrison[data-cell="-2,3"]').tap();await phone.locator('[data-unit="mech"]').tap();await phone.locator('.garrison[data-cell="-2,2"]').tap();await layout(phone);await shot(phone,'mobile-command');await phone.locator('#primary').tap();
  assert.equal((await snapshot(phone)).orders[0].troops.drone.length,0);await advance(phone,2);await clear(phone);await phone.locator('.garrison[data-cell="-2,3"]').tap();await phone.locator('[data-unit="all"]').tap();await clear(phone);
  const touch=await mobile.newCDPSession(phone),[from,to]=await phone.evaluate(()=>['-2,3','-3,3'].map(id=>window.__HEXFRONT3D__.point(id))),beforeTouch=(await snapshot(phone)).commands;
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:from.x,y:from.y}]});
  for(let n=1;n<=8;n++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*n/8,y:from.y+(to.y-from.y)*n/8}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await snapshot(phone)).commands,beforeTouch+1);await touch.detach();
  await phone.locator('#production-open').tap();await phone.locator('#enqueue-mech').tap();await shot(phone,'production-mobile');await phone.locator('#production-done').tap();
  await phone.setViewportSize({width:320,height:740});await phone.locator('#quality').tap();await phone.locator('#fit').tap();await layout(phone);await shot(phone,'mobile-small');
  report.checks.push('native touch tap and drag, mech selection, 390/320 px layouts, reduced motion, low quality');await mobile.close();
  await promisify(execFile)(process.execPath,['scripts/build.mjs'],{cwd:root,windowsHide:true});await serve(4287,true);
  const prodContext=await browser.newContext({viewport:{width:1100,height:700}}),prod=await prodContext.newPage();monitor(prod);
  await prod.goto('http://127.0.0.1:4287/hexfront-mixed-squads/?qa=1&clock=manual&mission=auenstrom');await prod.waitForSelector('#campaign-menu[open]');await prod.locator('.campaign-launch').click();
  await prod.waitForFunction(()=>document.querySelector('#loading').hidden);assert.equal(await prod.evaluate(()=>typeof window.__HEXFRONT3D__),'undefined');assert.equal(await prod.locator('#operation-index').textContent(),'01');await layout(prod);await shot(prod,'production-build');
  report.checks.push('standalone production build loads, no QA API, locked missions cannot be skipped');await prodContext.close();
  assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
} catch(error) {report.failure=error.stack;if(current&&!current.isClosed())await current.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw error;}
finally {await browser.close();for(const child of servers)child.kill();await fs.writeFile(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));}
