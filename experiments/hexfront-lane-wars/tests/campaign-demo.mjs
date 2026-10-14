import assert from 'node:assert/strict';import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true}),p=await b.newPage({viewport:{width:1100,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:4181/m21-review.html');await p.waitForFunction(()=>document.querySelector('video').readyState>=1);
const duration=await p.locator('video').evaluate(v=>v.duration);assert.ok(duration>10);
await p.locator('button').click();await p.waitForTimeout(700);assert.ok(await p.locator('video').evaluate(v=>v.currentTime)>.1);
const images=await p.locator('img').evaluateAll(imgs=>imgs.map(i=>({source:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})));assert.ok(images.every(i=>i.loaded));
assert.equal((await p.request.get('http://127.0.0.1:4181/docs/m21-qa/supply-demo.webm')).headers()['content-type'],'video/webm');assert.deepEqual(errors,[]);
await fs.writeFile(new URL('../docs/m21-qa/demo-results.json',import.meta.url),JSON.stringify({duration,images,errors,playback:true},null,2));console.log(JSON.stringify({duration,images:images.length,errors,playback:true}));await b.close();