import assert from 'node:assert/strict';
import {dragDriver,dragOrder,nextFrame} from './drag-helpers.mjs';
const useDrag=process.argv.includes('--drag');
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'));}catch{throw Error('Install optional browser-test dependency: npm install --no-save --package-lock=false playwright@1.62.1');}
const output=path.join(root,process.env.TEST_OUTPUT||'test-results');await fs.mkdir(output,{recursive:true});
const servers=[];
async function serve(port,production=false){
  const proc=spawn(process.execPath,['scripts/serve.mjs',...(production?['--production']:[])],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe'],windowsHide:true});servers.push(proc);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timeout')),10000);proc.stdout.on('data',d=>{if(String(d).includes('http://')){clearTimeout(timer);resolve();}});proc.on('error',reject);proc.on('exit',code=>{if(code)reject(Error(`Server exit ${code}`));});});
}
const report={date:new Date().toISOString(),browser:'Chromium / Playwright',runs:[],errors:[]};let browser,currentPage;
try{
  await serve(4175);browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']});report.browserVersion=browser.version();
  for(const mobile of process.argv.includes('--mobile')?[true]:[false,true]){
    const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:768},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
    const page=await context.newPage();currentPage=page;const driver=useDrag?await dragDriver(page,context,mobile):null;page.setDefaultTimeout(8000);page.on('pageerror',e=>report.errors.push(`${name}: ${e.message}`));page.on('console',m=>{if(m.type()==='error')report.errors.push(`${name}: ${m.text()}`);});page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
    const response=await page.goto('http://127.0.0.1:4175/?qa=1&clock=manual');assert.equal(response.status(),200);await page.waitForFunction(()=>window.__HEXFRONT3D__);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const readyMs=await page.evaluate(()=>performance.now());
    await page.screenshot({path:path.join(output,`${name}-overview.png`)});
    const click=async selector=>{
      await nextFrame(page);
      const loc=page.locator(selector);assert.equal(await loc.isVisible(),true,`Visible target: ${selector}`);
      const box=await loc.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
      const hit=await page.evaluate(({x,y,selector})=>Boolean(document.elementFromPoint(x,y)?.closest(selector)),{x,y,selector});assert.ok(hit,`Unoccluded target: ${selector}`);
      if(mobile)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
      await nextFrame(page);
    };
    const snapshot=()=>page.evaluate(()=>window.__HEXFRONT3D__.snapshot());
    const advance=seconds=>page.evaluate(s=>window.__HEXFRONT3D__.advance(s),seconds);
    await click('#help');assert.equal(await page.locator('#help-dialog').isVisible(),true);await click('#understood');
    await click('#primary');assert.equal((await snapshot()).running,true);
    await click('#pause');const before=(await snapshot()).time;await advance(10);assert.equal((await snapshot()).time,before);await click('#pause');
    await click('[data-cell="-1,2"]');
    // Actual raycast on the elevated top, not direct state mutation or a command hook.
    const blockedPoint=await page.evaluate(()=>window.__HEXFRONT3D__.point('0,1'));
    if(mobile)await page.touchscreen.tap(blockedPoint.x,blockedPoint.y);else await page.mouse.click(blockedPoint.x,blockedPoint.y);
    assert.match(await page.locator('#toast').innerText(),/Kein begehbarer Weg|Felswände/);assert.equal((await snapshot()).commands,0);
    await click('#clear');
    const initial=await snapshot();assert.equal(initial.cells.length,37);assert.equal(initial.cells.find(c=>c.hq==='orange').units,40);
    await advance(5.05);let turn=0,captured=false;const selectedHeights=new Set();
    while(!(await snapshot()).result&&turn<120){
      const action=await page.evaluate(()=>window.__HEXFRONT3D__.suggest());
      if(action){
        if(await page.locator('#clear').isVisible())await click('#clear');
        await click(`[data-cell="${action.from}"]`);
        assert.equal(await page.locator(`[data-cell="${action.from}"]`).getAttribute('aria-pressed'),'true');selectedHeights.add((await snapshot()).cells.find(c=>c.id===action.from).height);
        await click(action.fraction<.65?'#half':'#all');
        const old=(await snapshot()).commands;
        if(useDrag){
          await dragOrder(page,driver,action.from,action.to,async()=>{if(turn===20){await page.screenshot({path:path.join(output,`${name}-battle.png`)});captured=true;}});
        }else{
          await click(`[data-cell="${action.to}"]`);
          assert.equal(await page.locator('#primary').isEnabled(),true);
          if(turn===20){await page.screenshot({path:path.join(output,`${name}-battle.png`)});captured=true;}
          await click('#primary');
        }
        assert.equal((await snapshot()).commands,old+1);
        if(turn===9){await click('#camera-view');assert.match(await page.locator('#camera-view').innerText(),/Diorama/);assert.equal(await page.locator(`[data-cell="${action.from}"]`).getAttribute('aria-pressed'),'true');await click('#fit');assert.match(await page.locator('#camera-view').innerText(),/Taktik/);}
      }
      // Mirror the unit strategy's strict deadline on the same 50 ms clock.
      // A fixed 5.05 interval drifts to a different strategy with faster transports.
      const now=(await snapshot()).time,deadline=now+5;let stepTime=now,steps=0;while(stepTime<=deadline){stepTime+=.05;steps++;}
      await advance(steps*.05);turn++;if(turn%15===0)console.log(`${name}: ${turn} human UI decisions, ${(await snapshot()).time.toFixed(1)} simulated seconds`);
    }
    let state=await snapshot();assert.equal(state.result,'victory',`${name}: complete UI match must win (time ${state.time})`);assert.ok(state.aiCommands>15);assert.ok(captured);
    await page.screenshot({path:path.join(output,`${name}-victory.png`)});
    assert.deepEqual([...selectedHeights].sort(),[0,1,2]);const victory={seconds:Number(state.time.toFixed(2)),commands:state.commands,aiCommands:state.aiCommands,selectedHeights:[...selectedHeights].sort()};
    await click('#restart');state=await snapshot();assert.equal(state.time,0);assert.equal(state.result,null);assert.equal(state.commands,0);assert.equal(state.cells.find(c=>c.hq==='orange').units,40);
    await advance(400);state=await snapshot();assert.equal(state.result,'defeat');assert.equal(state.cells.find(c=>c.hq==='orange').owner,'blue');
    await page.screenshot({path:path.join(output,`${name}-defeat.png`)});const defeat={seconds:Number(state.time.toFixed(2)),aiCommands:state.aiCommands};
    await click('#restart');await click('#pause');
    await click('#zoom-in');await click('#fit');await click('#quality');assert.match(await page.locator('#quality').getAttribute('aria-label'),/Reduziert/);await click('#quality');
    const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,primary:document.getElementById('primary').getBoundingClientRect().bottom<=innerHeight,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()}));assert.equal(layout.overflow,false);assert.equal(layout.primary,true);
    const frameTimes=await page.evaluate(()=>new Promise(resolve=>{const times=[];let prev=performance.now();function measure(now){times.push(now-prev);prev=now;if(times.length<121)requestAnimationFrame(measure);else resolve(times.slice(1));}requestAnimationFrame(measure);}));
    const sorted=[...frameTimes].sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)],p95=sorted[Math.floor(sorted.length*.95)];
    const metrics=await page.evaluate(()=>window.__HEXFRONT3D__.metrics());
    const run={name,input:useDrag?'drag-and-drop':'click',viewport:mobile?'390 × 844':'1366 × 768',readyMs:Math.round(readyMs),victory,defeat,medianFrameMs:Number(median.toFixed(2)),p95FrameMs:Number(p95.toFixed(2)),metrics,layout};report.runs.push(run);console.log(JSON.stringify(run));await context.close();
  }
  execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root,stdio:'inherit'});await serve(4176,true);
  const production=await browser.newPage();await production.goto('http://127.0.0.1:4176/?qa=1&clock=manual');await production.waitForFunction(()=>document.getElementById('loading').hidden);assert.equal(await production.evaluate(()=>typeof window.__HEXFRONT3D__),'undefined');await production.locator('#primary').click();await production.waitForFunction(()=>document.getElementById('timer').textContent!=='00:00');report.production={loads:true,qaApiAbsent:true,realClockAdvances:true};await production.close();
  assert.deepEqual(report.errors,[]);await fs.writeFile(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));console.log(`PASS: ${report.runs.map(r=>r.name).join(' + ')} complete victory, defeat, restart; production verified.`);
}catch(error){report.failure=error.stack;if(currentPage&&!currentPage.isClosed())await currentPage.screenshot({path:path.join(output,'failure.png')});throw error;}finally{await browser?.close();for(const server of servers)server.kill();await fs.writeFile(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));}
