import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=new URL(process.env.PREVIEW_URL),match=url.pathname.match(/^\/emfau88\/hexwars\/([a-f0-9]{40})\/experiments\/hexfront-3d\/preview\/index.html$/);
assert.equal(url.hostname,'rawcdn.githack.com');assert.ok(match,'Use a pinned production commit URL');
const commit=match[1],prefix='experiments/hexfront-3d/preview/',base=new URL('.',url).href,out=path.resolve(root,process.env.TEST_OUTPUT||'docs/technology/live');
assert.ok(out.startsWith(root+path.sep));await fs.mkdir(out,{recursive:true});
const git=(...args)=>execFileSync('git',args,{cwd:path.resolve(root,'../..'),windowsHide:true,maxBuffer:8*1024*1024});
const files=git('ls-tree','-r','--name-only',commit,'--',prefix).toString().trim().split('\n').filter(Boolean);assert.ok(files.length>20);
const report={date:new Date().toISOString(),commit,base,files:[],allVerified:false},sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']});
try{
 const context=await browser.newContext(),page=await context.newPage();
 await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:45000});
 if(await page.title()==='External Content Notice | rawgit.hack')await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:45000}),page.getByRole('button',{name:'Open the page',exact:true}).click()]);
 await page.waitForFunction(()=>document.getElementById('loading')?.hidden,{},{timeout:45000});
 for(const file of files){
  const name=file.slice(prefix.length),expected=git('show',`${commit}:${file}`),response=await context.request.get(new URL(name,base).href,{timeout:45000}),actual=await response.body(),contentType=response.headers()['content-type'];
  const entry={path:name,bytes:actual.length,sha256:sha(actual),status:response.status(),contentType,verified:response.status()===200&&sha(actual)===sha(expected)};report.files.push(entry);
  assert.ok(entry.verified,`Hosted bytes match Git: ${name}`);
  if(name.endsWith('.js'))assert.match(contentType,/javascript/);if(name.endsWith('.css'))assert.match(contentType,/text\/css/);
 }
 report.totalBytes=report.files.reduce((n,f)=>n+f.bytes,0);report.allVerified=true;console.log(`PASS: ${report.files.length} public files / ${report.totalBytes} bytes match ${commit}.`);
}catch(error){report.failure=error.message;throw error;}finally{await browser.close();await fs.writeFile(path.join(out,'assets-report.json'),JSON.stringify(report,null,2)+'\n');}
