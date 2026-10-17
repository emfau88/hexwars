import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true}),p=await b.newPage({viewport:{width:1400,height:1000}});p.on('pageerror',e=>console.log(e.message));
try{
await p.goto('http://127.0.0.1:4181/tests/fixtures/mech.html');await p.waitForFunction(()=>window.MECH_TEST);await p.evaluate(()=>MECH_TEST.setup());console.log(JSON.stringify(await p.evaluate(()=>MECH_TEST.rigAudit())));
await p.evaluate(()=>MECH_TEST.duel());for(let i=0;i<55;i++)await p.evaluate(()=>MECH_TEST.step(.05));await p.screenshot({path:'docs/mech-animation/game-duel.png'});
await p.goto('http://127.0.0.1:4181/mech-viewer.html');await p.waitForFunction(()=>window.__MECH_VIEWER__);await p.locator('[data-view=side]').click();for(const t of [0,.25,.5,.8]){await p.evaluate(t=>__MECH_VIEWER__.pose('Walk',t),t);await p.screenshot({path:'docs/mech-animation/side-'+t+'.png'});}await p.locator('#compare').check();await p.locator('[data-view=hero]').click();await p.screenshot({path:'docs/mech-animation/teams.png'});
}finally{await b.close();}
