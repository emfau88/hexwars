import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error(m.text());}});
const base=process.env.BATTLE_URL||'http://127.0.0.1:4181/';
const out=new URL('../docs/visual-qa/',import.meta.url);await fs.mkdir(out,{recursive:true});
const shot=async name=>{await page.waitForTimeout(150);await page.screenshot({path:fileURLToPath(new URL(name,out))});};
try {
  await page.goto(`${base}?qa=1`);await page.waitForFunction(()=>window.__LANE_WARS__,null,{timeout:60000});
  await shot('01-battlefield.png');
  const metrics=await page.evaluate(()=>window.__LANE_WARS__.diagnostics());await fs.writeFile(new URL('metrics.json',out),JSON.stringify(metrics,null,2));console.log(JSON.stringify({assets:metrics.assets,drawCalls:metrics.drawCalls,triangles:metrics.triangles,scale:metrics.scale}));
  await page.locator('#camera-mode').click();await shot('02-tactical.png');
  await page.locator('#model-closeup').click();await shot('03-models-orange.png');
  const blueId=await page.evaluate(()=>window.__LANE_WARS__.diagnostics().units.find(u=>u.owner==='blue'&&u.type==='mech').id);
  await page.evaluate(id=>window.__LANE_WARS_QA__.select(id),blueId);await page.locator('#focus-unit').click();await shot('03b-models-blue.png');
  await page.locator('#close-selection').click();await page.locator('#camera-home').click();
  await page.evaluate(()=>window.__LANE_WARS_QA__.advance(8.1));await shot('04-combat.png');
  await page.evaluate(()=>window.__LANE_WARS_QA__.advance(2.6));await shot('05-hud-combat.png');
  await page.locator('#model-closeup').click();await shot('08-combat-closeup.png');
  await page.locator('#close-selection').click();await page.locator('#camera-home').click();
  await page.locator('#battle-reset').click();await page.setViewportSize({width:1100,height:750});await shot('06-compact.png');
  await page.setViewportSize({width:390,height:844});await shot('07-mobile.png');
  await page.setViewportSize({width:1800,height:1120});await page.goto(new URL('review.html',base).href);await page.locator('#comparison img').last().waitFor();await shot('09-reference-comparison.png');
  await fs.writeFile(new URL('capture-errors.json',out),JSON.stringify(errors,null,2));
} finally {await browser.close();}
if(errors.length)process.exitCode=1;
