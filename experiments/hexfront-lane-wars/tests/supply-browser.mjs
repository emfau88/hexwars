import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',out='docs/supply-30-qa/';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[],checks=[];
try{
 const p=await browser.newPage({viewport:{width:1440,height:960}});
 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 p.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
 await p.goto(base+'?qa=1',{timeout:90000});
 const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();
 await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:90000});
 await p.locator('#campaign-go').click();
 await p.locator('#loading').waitFor({state:'hidden'});
 await p.evaluate(()=>window.__LANE_MATCH_QA__.load('central'));
 const advance=s=>p.evaluate(s=>window.__LANE_MATCH_QA__.advance(s),s);
 const observe=()=>p.evaluate(()=>window.__LANE_MATCH__.observe());
 const button=p.locator('#supply-units [data-type="drone"]');
 await advance(80);
 const money=(await observe()).credits;
 await button.click();
 assert.equal((await observe()).credits,money-80);
 assert.equal((await observe()).supplyCooldown,30);
 assert.match(await p.locator('#supply-status').innerText(),/30\.0 s/);
 assert.equal(await button.getAttribute('aria-disabled'),'true');
 await p.screenshot({path:out+'cooldown-30.png'});
 checks.push('Real HUD order costs 80 credits and starts a displayed 30.0-second cooldown');
 await advance(12);
 const before=await p.evaluate(()=>{window.__LANE_MATCH_QA__.save();return window.__LANE_MATCH__.snapshot();});
 await p.reload();await p.waitForFunction(()=>window.__LANE_MATCH_QA__);
 await advance(0);assert.deepEqual(await p.evaluate(()=>window.__LANE_MATCH__.snapshot()),before);
 assert.equal((await observe()).supplyCooldown,18);
 await p.locator('#resume-game').click();await advance(0);
 // Re-enter a saved pause without allowing a real animation frame to advance the exact boundary.
 const remaining=(await observe()).supplyCooldown;
 await advance(remaining-.05);
 assert.ok(Math.abs((await observe()).supplyCooldown-.05)<1e-8);
 const spent=(await observe()).credits;
 assert.equal(await button.getAttribute('aria-disabled'),'true');
 await button.click({force:true});assert.equal((await observe()).credits,spent);
 await advance(.05);
 assert.equal((await observe()).supplyCooldown,0);
 assert.equal(await button.getAttribute('aria-disabled'),'false');
 await button.click();assert.ok(Math.abs((await observe()).credits-(spent+.1-80))<1e-8);
 assert.equal((await observe()).supplyCooldown,30);
 checks.push('Reload retains 18 seconds; order rejected one tick early and accepted at 30 seconds');
 for(const mission of ['first','meadow']){
  await p.evaluate(id=>window.__LANE_MATCH_QA__.load(id),mission);
  await advance(80);
  const result=await p.evaluate(()=>window.__LANE_MATCH_QA__.command('orange','supply',{type:'drone',lane:0}));
  assert.ok(result.ok);assert.equal((await observe()).supplyCooldown,15);
  assert.match(await p.locator('#supply-title').innerText(),/60/);
 }
 checks.push('Both legacy missions still use 15 seconds and 60 credits');
 assert.deepEqual(errors,[]);
 await fs.writeFile(out+'browser.json',JSON.stringify({base,checks,errors},null,2));
 console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}

