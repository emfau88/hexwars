// Public build smoke: no source injection, no QA API or simulated clock.
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs','--production'],{env:{...process.env,PORT:'4203'},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((r,j)=>{server.stdout.on('data',d=>String(d).includes('http://')&&r());server.on('error',j);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),errors=[],report={};
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4203/?qa=1&clock=manual&mission=auenstrom&play=1');await page.waitForSelector('#campaign-menu[open]');
 assert.equal(await page.evaluate(()=>typeof window.__HEXFRONT3D__),'undefined');assert.ok((await page.title()).includes('Morgenwacht'));
 report.qaDisabled=true;report.lockedUrlSafe=true;
 await page.locator('.campaign-launch').click();await page.waitForFunction(()=>document.querySelector('#timer').textContent!=='00:00');await page.locator('#pause').click();
 assert.equal(await page.locator('[data-cell]').count(),37);await page.screenshot({path:'docs/campaign/morgenwacht-desktop.png'});report.realClockRuns=true;
 // A completed-save fixture checks the public restore/menu path. Actual wins
 // and persisted unlocks are independently covered in campaign-browser.mjs.
 await page.evaluate(()=>localStorage.setItem('hexfront.campaign.v1',JSON.stringify({version:1,completed:['morgenwacht','windpass','auenstrom'],lastMission:'auenstrom'})));
 await page.goto('http://127.0.0.1:4203/');await page.waitForSelector('#campaign-menu[open]');
 for(const [id,count] of [['windpass',34],['auenstrom',33]]){
  await page.locator(`[data-mission="${id}"]`).click();await page.locator('.campaign-launch').click();await page.waitForURL(`**/*mission=${id}*`);await page.waitForSelector('#loading',{state:'hidden'});
  assert.equal(await page.locator('[data-cell]').count(),count);await page.locator('#campaign-open').click();
 }
 report.publicMissionSwitch=true;await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto('http://127.0.0.1:4203/');await phone.waitForSelector('#campaign-menu[open]');await phone.screenshot({path:'docs/campaign/menu-mobile.png'});
 assert.equal(await phone.locator('.campaign-card').count(),3);const launch=await phone.locator('.campaign-launch').boundingBox();assert.ok(launch.y+launch.height<=844);
 await phone.locator('.campaign-launch').tap();await phone.locator('#pause').tap();assert.equal(await phone.locator('[data-cell]').count(),37);
 await phone.setViewportSize({width:320,height:568});await phone.locator('#campaign-open').tap();const small=await phone.locator('.campaign-resume').boundingBox();assert.ok(small.y+small.height<=568);
 assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth),320);report.mobileAndSmallMenu=true;
 await mobile.close();assert.deepEqual(errors,[]);report.errors=errors;console.log('PASS public build: real clock, QA disabled, locked URL, restored mission navigation and 390/320px menu.');
}catch(e){report.failure=e.stack;throw e;}finally{await browser.close();server.kill();await fs.writeFile('docs/campaign/production-report.json',JSON.stringify(report,null,2));}
