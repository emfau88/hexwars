import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'test-results');
await fs.mkdir(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)('playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,windowsHide:true,env:{...process.env,PORT:'4289'},stdio:['ignore','pipe','pipe']});
const report={checks:[],errors:[],frames:[]};let browser,page;
try{
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Server timeout')),10000);server.stdout.once('data',()=>{clearTimeout(t);resolve();});server.once('error',reject);});
 browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']});
 page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/hexfront-mixed-squads/src/main.js',async route=>{const response=await route.fetch(),source=(await response.text()).replace('} catch(error){','window.__landscape={game,scene};\n} catch(error){');await route.fulfill({response,body:source});});
 for(const mission of ['morgenwacht','windpass','auenstrom']){
  await page.goto(`http://127.0.0.1:4289/hexfront-mixed-squads/?qa=1&clock=manual&mission=${mission}`);
  await page.waitForFunction(()=>window.__landscape,{},{timeout:60000});await page.locator('#primary').click();
  for(const [width,height] of [[1440,900],[390,844],[320,740],[844,390]]){
   await page.setViewportSize({width,height});await page.locator('#fit').click();
   await page.waitForFunction(()=>window.__landscape.scene.width===innerWidth&&window.__landscape.scene.height===innerHeight);
   const check=await page.evaluate(async()=>{
    const {scene,game}=window.__landscape,T=await import('three'),{corner,cornerHeight}=await import('/hexfront-mixed-squads/src/map.js');
    const corners=game.cells.flatMap(c=>Array.from({length:6},(_,i)=>{const p=corner(c,i);return scene.project(p.x,cornerHeight(game.cells,c,i),p.z);}));
    const safe=scene.safeFrame,hqs=game.cells.filter(c=>c.hq).map(c=>({owner:c.hq,...scene.project(c.x,0,c.z)}));
    const background=[[.01,.01],[.99,.01],[.01,.99],[.99,.99]].map(([x,y])=>{const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x*2-1,1-y*2),scene.camera);return ray.intersectObjects(scene.scene.children,true).some(hit=>hit.object.material===scene.materials.landscape);});
    const statusEl=document.querySelector('.battle-status'),status=statusEl.getBoundingClientRect();statusEl.style.pointerEvents='auto';
    const statusVisible=!!document.elementFromPoint(status.x+status.width/2,status.y+status.height/2)?.closest('.battle-status');statusEl.style.pointerEvents='';
    return {safe,hqs,background,statusVisible,width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,count:game.cells.length,picks:scene.picks.length,inside:corners.every(p=>p.x>=safe.left&&p.x<=safe.right&&p.y>=safe.top&&p.y<=safe.bottom),outsidePick:scene.pick({clientX:4,clientY:innerHeight/2}),metrics:window.__HEXFRONT3D__.metrics()};
   });
   assert.equal(check.scroll,width);assert.equal(check.picks,check.count);assert.equal(check.inside,true,JSON.stringify(check));assert.equal(check.outsidePick,null);assert.ok(check.background.every(Boolean));assert.ok(check.statusVisible);
   assert.ok(Math.abs(check.hqs.find(h=>h.owner==='orange').x-width/2)<1);
   report.frames.push({mission,...check});
   await page.screenshot({path:path.join(out,`landscape-${mission}-${width}.png`)});
   await page.locator('.mission > summary').click();assert.ok(await page.locator('.landscape-note').isVisible());
   const info=await page.locator('.mission-content').boundingBox();assert.ok(info.x>=0&&info.x+info.width<=width&&info.y+info.height<=height);
   await page.keyboard.press('Escape');assert.equal(await page.locator('#mission-info').getAttribute('open'),null);
  }
  await page.setViewportSize({width:1440,height:900});await page.locator('#camera-view').click();
  await page.locator('#quality').click();for(let i=0;i<8;i++)await page.locator('#zoom-in').click();
  await page.mouse.move(400,500);await page.mouse.down({button:'middle'});await page.mouse.move(1100,200,{steps:6});await page.mouse.up({button:'middle'});
  await page.locator('#fit').click();
  const source=await page.evaluate(()=>window.__landscape.game.cells.find(c=>c.owner==='orange'&&c.kind!=='hq').id);
  await page.locator(`.garrison[data-cell="${source}"]`).click();assert.equal(await page.locator('.garrison.selected').getAttribute('data-cell'),source);await page.locator('#clear').click();
  report.checks.push(`${mission}: full canvas, land at viewport corners, all fields visible, HQ centered, scenery non-playable, briefing, zoom/pan and selection at four viewport sizes`);console.log(report.checks.at(-1));
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify({checks:report.checks,errors:report.errors,metrics:report.frames.map(f=>({map:f.mission,width:f.width,...f.metrics}))},null,2));
}catch(error){report.failure=error.stack;if(page)await page.screenshot({path:path.join(out,'landscape-failure.png')}).catch(()=>{});throw error;}
finally{await browser?.close();server.kill();await fs.writeFile(path.join(out,'landscape-report.json'),JSON.stringify(report,null,2));}
