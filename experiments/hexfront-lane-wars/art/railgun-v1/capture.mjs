import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true,channel:'chromium'}),p=await b.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>console.log(e.message));
try{await p.goto('http://127.0.0.1:4181/railgun-preview.html');await p.waitForFunction(()=>window.__RAIL_PREVIEW__,null,{timeout:90000});console.log(await p.evaluate(()=>__RAIL_PREVIEW__.inspect()));
for(const v of ['hero','side','rear','game']){await p.locator('[data-view='+v+']').click();await p.screenshot({path:'docs/railgun-model/'+v+'.png'});}await p.locator('[data-view=hero]').click();await p.locator('#view').selectOption('hq');await p.screenshot({path:'docs/railgun-model/compare.png'});await p.locator('#view').selectOption('teams');await p.screenshot({path:'docs/railgun-model/teams.png'});
await fs.writeFile('docs/railgun-model/geometry.json',JSON.stringify(await p.evaluate(()=>__RAIL_PREVIEW__.inspect()),null,2));}finally{await b.close();}
