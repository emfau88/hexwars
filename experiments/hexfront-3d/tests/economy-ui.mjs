import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {nextFrame,dragDriver,dragOrder,center} from './drag-helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const screensOnly=process.argv.includes('--screens-only');
const baseline=process.argv.includes('--baseline'),phase=baseline?'before':'after',out=path.join(root,'docs/economy');await fs.mkdir(out,{recursive:true});
if(baseline){try{await fs.access(path.join(out,'before-report.json'));throw Error('Baseline already saved');}catch(e){if(e.code!=='ENOENT')throw e;}}
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4195'},stdio:['ignore','pipe','pipe'],windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});server.on('error',reject);});
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),report={phase,runs:[],errors:[]};
try{
 for(const [width,height] of [[1440,900],[390,844],[320,568]]){
  const mobile=width<640,context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("scene=new Diorama($('stage'),$('labels'),game,select,hover);","scene=new Diorama($('stage'),$('labels'),game,select,hover);window.__scene=scene;window.__pickLog=[];scene.onSelect=(id,reason)=>{window.__pickLog.push({id,reason});select(id,reason)};")});});
  await page.goto('http://127.0.0.1:4195/?qa=1&clock=manual');await page.waitForFunction(()=>window.__HEXFRONT3D__);await page.locator('#primary').click();await page.evaluate(()=>window.__HEXFRONT3D__.advance(5.05));await nextFrame(page);
  await page.screenshot({path:path.join(out,`${width}-${phase}-running.png`)});
  await page.locator('[data-cell="-2,3"]').click();await nextFrame(page);await page.screenshot({path:path.join(out,`${width}-${phase}-selection.png`)});
  const run={width,height,state:await page.evaluate(()=>window.__HEXFRONT3D__.snapshot()),checks:[]};
  if(!baseline){
    const click=async selector=>{const p=await center(page,selector);if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);await nextFrame(page);};
    const clear=async()=>{if(await page.locator('#clear').isVisible())await click('#clear');};
    const audit=async name=>{
      const result=await page.evaluate(async()=>{
        const s=window.__scene,{surfaceHeight}=await import('/src/map.js'),r=s.container.getBoundingClientRect();let maxError=0,minHit=Infinity;const badHits=[],faces=[];
        for(const c of s.game.cells){
          const el=s.labelsById.get(c.id),b=el.getBoundingClientRect(),p=s.project(c.x,surfaceHeight(s.game.cells,c,c.x,c.z),c.z),x=b.x+b.width/2,y=b.y+b.height/2;
          maxError=Math.max(maxError,Math.hypot(x-r.x-p.x,y-r.y-p.y));minHit=Math.min(minHit,b.width,b.height);
          if(x>r.x&&x<r.right&&y>r.y&&y<r.bottom&&s.hitAt({clientX:x,clientY:y}).id!==c.id)badHits.push(c.id);
          const f=el.firstElementChild.getBoundingClientRect();faces.push({id:c.id,x:f.x,y:f.y,right:f.right,bottom:f.bottom});
        }
        let overlaps=0;for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length;j++){const a=faces[i],b=faces[j];if(a.x<b.right&&b.x<a.right&&a.y<b.bottom&&b.y<a.bottom)overlaps++;}
        return {count:s.labelsById.size,visible:[...s.labelsById.values()].filter(e=>getComputedStyle(e).visibility==='visible').length,maxError,minHit,badHits,overlaps,zoom:s.zoom,angle:s.angle};
      });
      assert.equal(result.count,37);assert.equal(result.visible,37);assert.ok(result.maxError<.02,`${name}: fixed centers`);assert.deepEqual(result.badHits,[],`${name}: center picks`);assert.ok(result.minHit>=(mobile?44:38)-.02);run.checks.push({name,...result});
    };
    await clear();await audit('tactical-fit');
    // Native inputs at all 37 centers; transparent halos cannot steal a neighbor.
    const ids=await page.evaluate(()=>window.__scene.game.cells.map(c=>c.id));
    for(const id of screensOnly?[]:ids){await click(`[data-cell="${id}"]`);assert.equal(await page.evaluate(()=>window.__pickLog.at(-1).id),id);await clear();}
    run.nativeCenterPicks=screensOnly?0:37;
    await click('#camera-view');await audit('diorama-fit');await click('#zoom-in');await click('#zoom-in');await audit('diorama-zoom');
    const driver=await dragDriver(page,context,mobile),box=await page.locator('#stage').boundingBox(),p={x:box.x+10,y:box.y+12};
    const panBefore=await page.evaluate(()=>({...window.__scene.viewPan}));await driver.begin(p);await driver.move({x:p.x+35,y:p.y+20});await driver.end();assert.notDeepEqual(await page.evaluate(()=>window.__scene.viewPan),panBefore);await audit('diorama-pan');await click('#fit');await audit('reset');await driver.close();
    // Explicit integration fixture: actual terrain/paths/combat; only ownership
    // and counts are arranged. Full untouched-start matches are a separate test.
    await page.evaluate(()=>{const g=window.__scene.game;for(const id of ['-3,3','-3,2','-3,1','-2,1'])g.cell(id).owner='orange';g.cell('-2,1').units=24;g.cell('-1,1').owner='blue';g.cell('-1,1').units=18;g.cell('-2,3').units=120;window.__scene.render(performance.now());});
    await click('[data-cell="-2,1"]');await audit('one-two-three-digit-values');
    assert.equal(await page.locator('[data-cell="-3,1"]').getAttribute('data-access'),'direct');assert.equal(await page.locator('[data-cell="-1,1"]').getAttribute('data-access'),'direct');assert.equal(await page.locator('[data-cell="-1,0"]').getAttribute('data-access'),'cliff');assert.equal(await page.locator('[data-cell="-2,3"]').getAttribute('data-access'),'indirect');
    await page.screenshot({path:path.join(out,`${width}-ramp-selected.png`)});
    await click('[data-cell="-1,0"]');assert.match(await page.locator('#toast').innerText(),/Felswand – Aufstieg benutzen/);assert.equal(await page.locator('#toast').getAttribute('data-kind'),'blocked');await page.screenshot({path:path.join(out,`${width}-ramp-blocked.png`)});
    await click('[data-cell="-1,1"]');assert.match(await page.locator('#command-detail').innerText(),/Verteidiger \+30 %.*Unterlegen/);assert.match(await page.locator('#command-title').innerText(),/23 Truppen → 18 Verteidiger/);await page.evaluate(()=>document.getElementById('toast').classList.remove('visible'));await page.waitForFunction(()=>Number(getComputedStyle(document.getElementById('toast')).opacity)<.01);await page.screenshot({path:path.join(out,`${width}-uphill-forecast.png`)});
    const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,footerBottom:document.querySelector('.command-panel').getBoundingClientRect().bottom,stageBottom:document.getElementById('stage').getBoundingClientRect().bottom,footerTop:document.querySelector('.command-panel').getBoundingClientRect().top,viewport:innerHeight}));assert.equal(layout.overflow,false);assert.ok(layout.footerBottom<=layout.viewport);assert.ok(layout.stageBottom<layout.footerTop);run.layout=layout;
    if(width===320){await click('#zoom-in');await click('#zoom-in');await audit('small-screen-detail');assert.equal(run.checks.at(-1).overlaps,0);await page.screenshot({path:path.join(out,'320-detail.png')});await click('#fit');}
    // Descending the same ramp has the opposite, exact combat factor.
    await clear();await page.evaluate(()=>{const g=window.__scene.game;g.cell('-1,1').owner='orange';g.cell('-1,1').units=24;g.cell('-2,1').owner='blue';});await click('[data-cell="-1,1"]');assert.equal(await page.locator('[data-cell="-2,1"]').getAttribute('data-access'),'direct');await click('[data-cell="-2,1"]');assert.match(await page.locator('#command-detail').innerText(),/Bergab: Angriff \+15 %/);run.upDownCliffAndForecast=true;
    await clear();await click('[data-cell="-2,3"]');assert.match(await page.locator('#command-detail').innerText(),/120\/99.*voll/);assert.match(await page.locator('#hq-production').innerText(),/0,00.*voll/);
    await page.goto('http://127.0.0.1:4195/?qa=1&clock=manual&economy=legacy-local');await page.waitForFunction(()=>window.__HEXFRONT3D__);assert.equal(await page.evaluate(()=>window.__HEXFRONT3D__.snapshot().economyMode),'legacy-local');assert.match(await page.locator('#economy-mode').innerText(),/Lokale/);run.legacyURL=true;
  }
  report.runs.push(run);console.log(`PASS ${width}: ${baseline?'baseline':screensOnly?'screen refresh, projection/zoom/ramp/forecast checks':'37 center inputs, both views, zoom/pan/reset, ramp/cliff/forecast, cap, legacy URL'}`);await context.close();

 }
 assert.deepEqual(report.errors,[]);console.log(`PASS ${phase}: three viewport snapshots.`);
}catch(e){report.failure=e.stack;throw e;}finally{await browser.close();server.kill();await fs.writeFile(path.join(out,`${screensOnly?'screens':phase}-report.json`),JSON.stringify(report,null,2));}
