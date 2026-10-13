import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'test-results');
await fs.mkdir(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,windowsHide:true,env:{...process.env,PORT:'4288'},stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Server timeout')),10000);server.stdout.once('data',()=>{clearTimeout(t);resolve();});server.once('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),errors=[],report={checks:[],shots:[]};
let page;
async function instrument(p){
 p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='error')errors.push(e.text());});p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()}: ${r.url()}`);});
 await p.route('**/hexfront-mixed-squads/src/main.js',async route=>{const response=await route.fetch();let source=await response.text();source=source.replace('} catch(error){','window.__readability={game,scene,draw:()=>{updateUI();scene.render(performance.now());}};\n} catch(error){');await route.fulfill({response,body:source});});
}
const advance=(p,n)=>p.evaluate(n=>window.__HEXFRONT3D__.advance(n),n);
const pick=(p,id)=>p.locator(`.garrison[data-cell="${id}"]`).click();
async function shot(name){await page.screenshot({path:path.join(out,name+'.png')});report.shots.push(name);}
async function load(mission='morgenwacht'){await page.goto(`http://127.0.0.1:4288/hexfront-mixed-squads/?qa=1&clock=manual&mission=${mission}`);await page.waitForFunction(()=>window.__readability,{},{timeout:60000});await page.locator('#primary').click();}
try{
 page=await browser.newPage({viewport:{width:1440,height:900}});await instrument(page);await load();
 let poses=await page.evaluate(()=>window.__HEXFRONT3D__.formations());assert.equal(poses.mechs.length,0);assert.ok(!poses.drones.some(p=>p.cellId==='-2,3'||p.cellId==='2,-3'));
 assert.equal(await page.locator('.garrison.neutral:not(.empty)').count(),1);assert.ok((await page.locator('.garrison .count').allTextContents()).every(t=>t===''||/^[1-9]\d*$/.test(t)));
 await shot('readable-start');await page.locator('#hq-production').click();assert.ok((await page.locator('.income-popover').innerText()).includes('2 verbundene Felder × 0,9'));assert.equal(await page.locator('.income-popover [data-income="total"]').textContent(),'+3,8 Cr/s');await shot('income-desktop');await page.locator('#hq-production').click();
 await advance(page,2.1);poses=await page.evaluate(()=>window.__HEXFRONT3D__.formations());assert.ok(poses.drones.some(p=>p.launch&&p.cellId==='-2,3'));
 await page.evaluate(()=>{const {scene}=window.__readability,hq=scene.game.cells.find(c=>c.hq==='orange'),p=scene.project(hq.x,.3,hq.z);scene.zoomBy(2.2,p);});
 await page.waitForFunction(()=>window.__readability.scene.commandHQs.find(n=>n.owner==='orange').hatch.scale.y<.1);await shot('hq-deployment');
 await advance(page,1.2);poses=await page.evaluate(()=>window.__HEXFRONT3D__.formations());assert.ok(!poses.drones.some(p=>p.launch));const parked=poses.drones.find(p=>p.cellId==='-2,3');assert.ok(parked);assert.ok(Math.abs(parked.x+1.021909976)>0.5);
 report.checks.push('empty neutral map; HQ reserve hidden; produced drone exits gate and parks; income formula visible');console.log(report.checks.at(-1));
 // Two controlled fronts; all combat still enters through native UI orders.
 await page.evaluate(async()=>{const {game,scene}=window.__readability,{troops}=await import('/hexfront-mixed-squads/src/units.js');game.reset();game.aiEnabled=false;game.start();scene.clearEffects();scene.fit();for(const f of Object.values(game.factions)){f.queue=[];f.repeat=false;}for(const id of ['-2,2','-1,2'])game.cell(id).troops=troops(8,3);for(const id of ['-3,2','0,2']){game.cell(id).owner='blue';game.cell(id).troops=troops(8,3);}window.__readability.draw();});
 await pick(page,'-2,2');await pick(page,'-3,2');await page.locator('#primary').click();assert.ok(await page.locator('#command-options').isHidden());
 await pick(page,'-1,2');assert.equal(await page.locator('.garrison.selected').getAttribute('data-cell'),'-1,2');await pick(page,'0,2');await page.locator('#primary').click();
 await advance(page,2.75);await page.evaluate(()=>{const {game,scene}=window.__readability;game.paused=true;scene.visualTime+=65;scene.render(performance.now());});
 const fronts=await page.evaluate(()=>{const {game,scene}=window.__readability;return {battles:game.cells.filter(c=>c.battle).map(c=>c.id),rings:[...scene.markers.values()].filter(m=>m.combat.visible).length,shots:scene.effectPool.filter(f=>f.active&&f.shooterType==='mech').map(f=>{const side=f.event.returnFire?'defend':'attack',p=scene.mechPoses.find(p=>p.key===`cell:${f.cell.id}:${side}:${f.event.owner}:mech`),dx=f.origin.x-p.x,dz=f.origin.z-p.z;return {owner:f.event.owner,cell:f.cell.id,x:dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw),y:f.origin.y-p.y,z:dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw)};})};});
 assert.equal(fronts.battles.length,2);assert.equal(fronts.rings,2);assert.ok(fronts.shots.length>=4);for(const p of fronts.shots){assert.ok(Math.abs(p.x-.332)<.035);assert.ok(Math.abs(p.y-.378)<.01);assert.ok(Math.abs(p.z+.285)<.035);}report.fronts=fronts;await shot('parallel-battles');
 report.checks.push('selection resets between orders; two active fronts; both mech gun arms use measured +X muzzle');console.log(report.checks.at(-1));
 for(const mission of ['morgenwacht','windpass','auenstrom']){await load(mission);const framing=await page.evaluate(()=>{const {scene,game}=window.__readability,a=game.cells.find(c=>c.hq==='orange'),b=game.cells.find(c=>c.hq==='blue');return {a:scene.project(a.x,0,a.z),b:scene.project(b.x,0,b.z),width:scene.width};});assert.ok(Math.abs(framing.a.x-framing.width/2)<1);assert.ok(Math.abs(framing.a.x-framing.b.x)<1);assert.ok(framing.a.y>framing.b.y);}
 report.checks.push('own HQ centered below enemy HQ on all three maps');console.log(report.checks.at(-1));
 for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await page.locator('#fit').click();await page.locator('#hq-production').click();
   const bounds=await page.evaluate(()=>{const r=document.querySelector('.income-popover').getBoundingClientRect(),s=document.querySelector('#hq-production').getBoundingClientRect(),m=document.querySelector('.map-tools').getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,overlap:s.right>m.left&&s.left<m.right&&s.bottom>m.top&&s.top<m.bottom};});assert.equal(bounds.scroll,bounds.width);assert.ok(bounds.left>=0&&bounds.right<=bounds.width&&bounds.bottom<=bounds.height);assert.equal(bounds.overlap,false);await shot('income-mobile-'+width);await page.locator('#hq-production').click();
   await page.locator('#production-shortcut').click();assert.ok((await page.locator('#enqueue-drone').innerText()).includes('12 Cr'));assert.ok((await page.locator('#enqueue-mech').innerText()).includes('40 Cr'));assert.ok((await page.locator('#enqueue-mech').innerText()).includes('4× Lebenspunkte'));await shot('units-mobile-'+width);await page.locator('#production-close').click();
 }
 report.checks.push('390/320 px income stays clear of camera controls; unit roles, costs and speed visible');assert.deepEqual(errors,[]);console.log(JSON.stringify(report,null,2));
}catch(error){report.failure=error.stack;if(page)await page.screenshot({path:path.join(out,'readability-failure.png')}).catch(()=>{});throw error;}
finally{report.errors=errors;await browser.close();server.kill();await fs.writeFile(path.join(out,'readability-report.json'),JSON.stringify(report,null,2));}
