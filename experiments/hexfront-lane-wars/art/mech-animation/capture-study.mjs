import {chromium} from '@playwright/test';
const b=await chromium.launch({headless:true}),p=await b.newPage({viewport:{width:1400,height:1000}});p.on('pageerror',e=>console.log(e.message));await p.goto('http://127.0.0.1:4181/mech-viewer.html');await p.waitForFunction(()=>window.__MECH_VIEWER__);console.log(await p.evaluate(()=>window.__MECH_VIEWER__.clips));
for(const [name,t] of [['Idle',0],['Walk',.0],['Walk',.25],['Walk',.50],['Death',1.0]]){await p.evaluate(([n,t])=>window.__MECH_VIEWER__.pose(n,t),[name,t]);await p.screenshot({path:'docs/mech-animation/study-'+name+'-'+t+'.png'});}
await b.close();
