import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'docs/frontier');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={baseline:'4867c595a6d18e3f20340d7a7b283574adb7645c',unchanged:[],files:[],viewer:[],errors:[]};
for(const name of ['game.js','economy.js','tactics.js','map.js','transport.js','camera.js','main.js','style.css']){
 const file='src/'+name,old=execFileSync('git',['show',`${report.baseline}:experiments/hexfront-3d/${file}`],{cwd:root,windowsHide:true});
 const current=await fs.readFile(path.join(root,file));assert.equal(current.toString().replaceAll('\r\n','\n'),old.toString().replaceAll('\r\n','\n'));report.unchanged.push(file);
}
async function scan(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){
 const p=path.join(dir,e.name);if(e.isDirectory())await scan(p);else{const file=path.relative(path.join(root,'dist'),p),bytes=await fs.readFile(p),preview=await fs.readFile(path.join(root,'preview',file));assert.equal(sha(bytes),sha(preview));report.files.push({path:file.replaceAll('\\','/'),bytes:bytes.length,sha256:sha(bytes)});}
}}
await scan(path.join(root,'dist'));report.totalBytes=report.files.reduce((n,f)=>n+f.bytes,0);
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4196'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']});
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:900});await page.goto('http://127.0.0.1:4196/docs/frontier/compare.html');
  for(const mode of ['desktop','mobile']){await page.locator('#'+mode).click();await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));assert.ok((await page.locator('#after').getAttribute('src')).includes(mode));}
  for(const value of ['0','100']){await page.locator('#split').fill(value);assert.ok((await page.locator('#after').getAttribute('style')).includes(value+'%'));}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('video').count(),0);report.viewer.push({width,images:true,tabs:true,slider:true,noOverflow:true,noVideo:true});
 }
 await page.goto('http://127.0.0.1:4196/preview/?economy=legacy-local');await page.waitForFunction(()=>document.querySelector('#loading')?.hidden,{},{timeout:45000});
 assert.equal(await page.evaluate(()=>typeof window.__HEXFRONT3D__),'undefined');await page.locator('#primary').click();await page.waitForFunction(()=>document.querySelector('#timer').textContent!=='00:00');
 assert.match(await page.locator('.economy-readout').innerText(),/Lokal/i);report.legacyProduction={qaAbsent:true,clockAdvances:true};assert.deepEqual(report.errors,[]);
 console.log(`PASS: ${report.unchanged.length} guarded sources unchanged, ${report.files.length} preview files byte-identical, comparison viewer and legacy production start.`);
}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,'delivery-report.json'),JSON.stringify(report,null,2)+'\n');}
