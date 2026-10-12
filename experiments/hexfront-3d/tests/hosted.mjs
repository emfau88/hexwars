import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const local=process.env.PREVIEW_URL==='local';
const camera=process.argv.includes('--camera'),art=process.argv.includes('--art'),shots=process.env.TEST_OUTPUT||(art?'docs/art':camera?'docs/camera':'docs/screenshots');
if(!path.resolve(root,shots).startsWith(root+path.sep))throw Error('Test output must remain inside this experiment');
const url=local?'http://127.0.0.1:4178/':process.env.PREVIEW_URL;
if(!url)throw Error('Set PREVIEW_URL to local or the production URL documented in README.md');
let server;
if(local){server=spawn(process.execPath,['scripts/serve.mjs','--production'],{cwd:root,env:{...process.env,PORT:'4178'},stdio:['ignore','pipe','pipe'],windowsHide:true});await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);server.on('exit',code=>{if(code)reject(Error(`Server exit ${code}`));});});}
const report={url,date:new Date().toISOString(),runs:[],errors:[]};
await fs.mkdir(path.join(root,shots),{recursive:true});await fs.mkdir(path.join(root,'test-results'),{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']});
try{
 for(const mobile of [false,true]){
  const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:camera||art?{width:1440,height:900}:{width:1366,height:768},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  let response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});assert.equal(response.status(),200);
  let repositoryNoticeConfirmed=false;
  if(await page.title()==='External Content Notice | rawgit.hack'){
   const destination=new URL(url);assert.equal(destination.hostname,'rawcdn.githack.com');
   assert.ok(destination.pathname.startsWith('/emfau88/hexwars/'));
   const source=`https://raw.githubusercontent.com${destination.pathname}`;
   assert.equal(await page.locator(`a[href="${source}"]`).count(),1);
   [response]=await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:45000}),page.getByRole('button',{name:'Open the page',exact:true}).click()]);
   assert.equal(response.status(),200);assert.equal(page.url(),url);repositoryNoticeConfirmed=true;
  }
  await page.waitForFunction(()=>document.getElementById('loading')?.hidden,{},{timeout:45000});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const info=await page.evaluate(()=>{const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_debug_renderer_info');return {title:document.title,qa:typeof window.__HEXFRONT3D__,overflow:document.documentElement.scrollWidth>innerWidth,readyMs:Math.round(performance.now()),renderer:extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};});
  assert.equal(info.qa,'undefined');assert.equal(info.overflow,false);
  await page.screenshot({path:path.join(root,`${shots}/${camera||art?'final-':''}${name}.png`)});
  const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const click=async s=>{await frame();const b=await page.locator(s).boundingBox();if(mobile)await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);else await page.mouse.click(b.x+b.width/2,b.y+b.height/2);};
  await click('#primary');
  if(process.argv.includes('--match')){await frame();await page.screenshot({path:path.join(root,`${shots}/${name}-running.png`)});}
  await click('[data-cell="-2,3"]');await click('[data-cell="-3,3"]');assert.equal(await page.locator('#primary').isEnabled(),true);
  if(process.argv.includes('--match')){await frame();await page.screenshot({path:path.join(root,`${shots}/${name}-command.png`)});}
  await click('#primary');await page.waitForFunction(()=>document.getElementById('timer').textContent!=='00:00');assert.match(await page.locator('#toast').innerText(),/unterwegs/);
  await page.screenshot({path:path.join(root,`test-results/${name}-hosted-command.png`)});await click('#pause');assert.match(await page.locator('#phase').innerText(),/PAUSIERT/);
  report.runs.push({name,...info,repositoryNoticeConfirmed,commandAccepted:true,clockAdvances:true,pause:true});console.log(JSON.stringify(report.runs.at(-1)));await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log('PASS: production build, desktop and touch, real commands, clock and screenshots.');
}finally{await browser.close();server?.kill();await fs.writeFile(path.join(root,process.env.TEST_OUTPUT?`${shots}/production-report.json`:art?'docs/art/production-report.json':camera?'docs/camera/production-report.json':'test-results/hosted-report.json'),JSON.stringify(report,null,2));}
