import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import {fileURLToPath} from 'node:url';
const output=new URL('../docs/m21-qa/',import.meta.url),browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:fileURLToPath(output),size:{width:1280,height:900}}}),p=await context.newPage(),errors=[];
p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto('http://127.0.0.1:4181/?qa=1');await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:60000});
 await p.evaluate(()=>window.__LANE_MATCH_QA__.load('meadow'));await p.evaluate(()=>window.__LANE_MATCH_QA__.advance(90));
 const source=await p.locator('#supply-units [data-type="mech"]').boundingBox(),west=await p.evaluate(()=>window.__LANE_MATCH__.diagnostics().laneTargets[0]);
 await p.mouse.move(source.x+source.width/2,source.y+source.height/2);await p.waitForTimeout(700);await p.mouse.down();await p.mouse.move(west.x,west.y,{steps:32});await p.waitForTimeout(1100);await p.mouse.up();await p.waitForTimeout(700);
 const before=await p.evaluate(()=>window.__LANE_MATCH__.observe().time);await p.locator('#match-play').click();await p.waitForTimeout(3500);await p.locator('#match-play').click();const after=await p.evaluate(()=>window.__LANE_MATCH__.observe().time);assert.ok(after>before+.2);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>window.__LANE_MATCH__.observe().time),after);
 await p.evaluate(()=>window.__LANE_MATCH_QA__.advance(30));
 await p.locator('#supply-units [data-type="rail"]').click();await p.waitForTimeout(1000);await p.locator('#fronts [data-lane="1"]').click();await p.waitForTimeout(1100);
 await p.locator('#match-play').click();await p.waitForTimeout(3000);await p.locator('#match-play').click();
 const video=p.video();await context.close();await video.saveAs(fileURLToPath(new URL('supply-demo.webm',output)));const original=await video.path();if(original!==fileURLToPath(new URL('supply-demo.webm',output)))await fs.unlink(original);
 console.log(JSON.stringify({video:'docs/m21-qa/supply-demo.webm',errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
