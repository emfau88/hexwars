import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.PUBLIC_PLAY_URL||'http://127.0.0.1:4181/',out=process.env.RINGS_OUTPUT||'docs/factory-rings/local';
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chromium'}),checks=[],errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport,isMobile:viewport.width!==1440,hasTouch:viewport.width!==1440}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto(base+'index.html?qa=1',{timeout:120000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:120000});await p.locator('#loading').waitFor({state:'hidden',timeout:120000});
  await p.locator('#campaign-go').click();await p.locator('#loading').waitFor({state:'hidden'});
  for(const mission of (viewport.width===1440?['central','first','meadow']:['central'])){
   await p.evaluate(async id=>{await __LANE_MATCH_QA__.load(id);__LANE_MATCH_QA__.advance(0);},mission);
   const period=mission==='central'?20:15;
   const expected=await p.evaluate(()=>Object.values(__LANE_MATCH__.snapshot().players).reduce((n,p)=>n+p.factories.filter(Boolean).length,0));
   const sample=async seconds=>{await p.evaluate(s=>__LANE_MATCH_QA__.advance(s),seconds);return p.evaluate(()=>__LANE_MATCH__.diagnostics().waveRings);};
   let rings=await sample(period/2);let visible=rings.filter(r=>r.visible);assert.equal(visible.length,expected);assert.ok(visible.every(r=>Math.abs(r.progress-.5)<.001&&r.diameter>=30&&r.warning===0));
   const paused=await p.evaluate(()=>__LANE_MATCH__.snapshot());await p.waitForTimeout(150);assert.deepEqual(await p.evaluate(()=>__LANE_MATCH__.snapshot()),paused);
   await p.screenshot({path:out+'/'+mission+'-half-'+viewport.width+'.jpg',quality:85});
   rings=await sample(period/2-2);visible=rings.filter(r=>r.visible);assert.ok(visible.every(r=>r.warning>0&&Math.abs(r.remaining-2)<.001));await p.screenshot({path:out+'/'+mission+'-ready-'+viewport.width+'.jpg',quality:85});
   rings=await sample(2);visible=rings.filter(r=>r.visible);assert.ok(visible.every(r=>r.flash>.99&&r.progress<.001));await p.screenshot({path:out+'/'+mission+'-spawn-'+viewport.width+'.jpg',quality:85});
   rings=await sample(1);assert.ok(rings.filter(r=>r.visible).every(r=>r.flash===0&&Math.abs(r.progress-1/period)<.001));
   checks.push({viewport,mission,visible:visible.length,minDiameter:Math.min(...visible.map(r=>r.diameter)),synchronized:true,paused:true,warning:true,spawnPulse:true});
  }
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  // Exercise the actual rendering implementation against a full, unchanged match save.
  const fixture=await p.evaluate(async()=>{
   const T=await import('three'),{FactoryWaveRings}=await import('./src/factory-wave-rings.js'),{Match}=await import('./src/match.js'),{factoryPosition}=await import('./src/match-layout.js');
   const match=new Match({mission:'central'}),scene=new T.Scene(),camera=new T.PerspectiveCamera(),rings=new FactoryWaveRings(scene),factories={};
   for(const owner of ['orange','blue'])for(let slot=0;slot<4;slot++){const root=new T.Group(),pos=factoryPosition(owner,slot);root.position.set(pos.x,.06,pos.z);factories[owner+':'+slot]={root,owner,slot};}
   rings.update(factories,match,camera,10);if(rings.diagnostics().some(r=>r.visible))throw Error('Setup ring');
   match.start();match.advance(42);match.command('orange','factory',{slot:0,type:'mech',lane:0});const before=JSON.stringify(match.save());
   rings.update(factories,match,camera,10);if(rings.diagnostics().find(r=>r.id==='orange:0').visible)throw Error('Ghost ring');
   for(let i=0;i<20;i++)rings.update(factories,match,camera,10+i);
   if(JSON.stringify(match.save())!==before)throw Error('Rendering mutated simulation');
   match.advance(18);rings.update(factories,match,camera,10);if(!rings.diagnostics().find(r=>r.id==='orange:0').visible)throw Error('Built factory ring missing');
   for(const owner of ['orange','blue'])match.players[owner].factories=Array.from({length:4},()=>({type:'mech',lane:0}));
   rings.update(factories,match,camera,10);const all=rings.diagnostics().filter(r=>r.visible).length;if(all!==8)throw Error('Eight factories');
   for(const owner of ['orange','blue'])for(const [a,b] of [[0,1],[3,2]]){const left=rings.items.get(owner+':'+a),right=rings.items.get(owner+':'+b);if(Math.abs(left.position.x-right.position.x)*10<left.userData.diameter/2+right.userData.diameter/2+4.99)throw Error('Overlapping ring indicators');}
   match.phase='ended';rings.update(factories,match,camera,10);if(rings.diagnostics().some(r=>r.visible))throw Error('Ended ring');
   const sharedGeometry=new Set(rings.group.children.map(o=>o.geometry)).size,materials=new Set(rings.group.children.map(o=>o.material)).size;rings.dispose();
   return {all,sharedGeometry,materials,disposed:scene.children.length===0,saveUnchanged:true};
  });assert.equal(fixture.sharedGeometry,1);assert.equal(fixture.materials,2);assert.ok(fixture.disposed);checks.push({viewport,fixture});await context.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/results.json',JSON.stringify({base,checks,errors},null,2));console.log(JSON.stringify({base,checks,errors},null,2));
}finally{await browser.close();}

