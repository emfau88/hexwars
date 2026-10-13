import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'test-results');
await fs.mkdir(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)('playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,windowsHide:true,env:{...process.env,PORT:'4290'},stdio:['ignore','pipe','pipe']});
const report={checks:[],errors:[]};let browser,page;
async function shot(name){await page.screenshot({path:path.join(out,`cozy-${name}.png`)});}
async function visibleControlsFit(selector){
 const bad=await page.locator(selector).evaluate(root=>[...root.querySelectorAll('button')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.left<0||r.right>innerWidth+1||r.top<0||r.bottom>innerHeight+1);}).map(el=>el.id||el.className));
 assert.deepEqual(bad,[],`Clipped controls in ${selector}`);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),await page.evaluate(()=>innerWidth));
}
try{
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Server timeout')),10000);server.stdout.once('data',()=>{clearTimeout(t);resolve();});server.once('error',reject);});
 browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']});page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/hexfront-mixed-squads/src/main.js',async route=>{const response=await route.fetch(),source=(await response.text()).replace('} catch(error){','window.__cozy={game,scene,showResult,updateUI};\n} catch(error){');await route.fulfill({response,body:source});});
 await page.goto('http://127.0.0.1:4290/hexfront-mixed-squads/?qa=1&clock=manual');await page.waitForFunction(()=>window.__cozy,{},{timeout:60000});
 await page.locator('#campaign-open').click();await visibleControlsFit('.menu-home');await shot('home');
 await page.locator('.campaign-settings').click();await page.locator('#help').click();assert.ok(await page.locator('#help-dialog').isVisible());await page.keyboard.press('Escape');assert.ok(await page.locator('#settings-dialog').isVisible());await page.keyboard.press('Escape');assert.ok(await page.locator('.menu-home').isVisible());
 await page.locator('.campaign-choose').click();assert.ok(await page.locator('[data-mission="windpass"]').isDisabled());await visibleControlsFit('.mission-picker');await shot('missions');await page.keyboard.press('Escape');assert.ok(await page.locator('.menu-home').isVisible());
 await page.locator('.campaign-quick').click();await page.locator('#pause').click();
 await page.locator('#production-shortcut').click();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__cozy.game.paused),true);await page.locator('#pause').click();
 await page.locator('#campaign-open').click();await page.locator('.campaign-settings').click();await page.locator('#quality').click();assert.equal(await page.locator('#quality').textContent(),'Reduziert');await page.locator('#settings-close').click();assert.equal(await page.evaluate(()=>window.__cozy.game.paused),true);await page.locator('.campaign-resume').click();assert.equal(await page.evaluate(()=>window.__cozy.game.paused),false);
 report.checks.push('Menu, mission locks, settings/help keyboard back navigation, graphics toggle, deliberate pause preserved, explicit resume');
 for(const [width,height] of [[1440,900],[390,844],[320,740],[844,390]]){
   await page.setViewportSize({width,height});await page.locator('#fit').click();
   await page.waitForFunction(()=>window.__cozy.scene.width===innerWidth);
   await visibleControlsFit('.topbar');await shot(`hud-${width}`);
   await page.locator('#campaign-open').click();await visibleControlsFit('.menu-home');await shot(`menu-${width}`);await page.locator('.campaign-resume').click();
   await page.locator('#production-shortcut').click();await shot(`production-${width}`);await page.locator('#production-done').click();
   // Layout fixture only. Full ordinary-match results are covered by browser.mjs.
   for(const result of ['victory','defeat']){
     await page.evaluate(result=>{const h=window.__cozy;h.game.result=result;h.showResult();},result);
     await visibleControlsFit('.result-card');assert.equal(await page.locator('#result-title').textContent(),result==='victory'?'Sektor gesichert':'Einsatz verloren');await shot(`${result}-${width}`);
     if(await page.locator('#restart').isVisible())await page.locator('#restart').click();else{await page.locator('#result-campaign').click();await page.locator('.campaign-launch').click();}
   }
   report.checks.push(`${width}×${height}: home, HUD, production, victory and defeat`);console.log(report.checks.at(-1));
 }
 await page.setViewportSize({width:1440,height:900});
 await page.goto('http://127.0.0.1:4290/hexfront-mixed-squads/preview/index.html?qa=1&clock=manual');
 await page.waitForSelector('#campaign-menu[open]');await page.locator('.campaign-quick').click();
 await page.waitForFunction(()=>document.querySelector('#phase').textContent==='IM EINSATZ');
 assert.equal(await page.evaluate(()=>typeof window.__HEXFRONT3D__),'undefined');await shot('branch-preview');
 report.checks.push('Packaged branch preview starts with correct sibling asset paths and QA disabled');
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}catch(error){report.failure=error.stack;if(page)await shot('failure').catch(()=>{});throw error;}
finally{await browser?.close();server.kill();await fs.writeFile(path.join(out,'cozy-report.json'),JSON.stringify(report,null,2));}
