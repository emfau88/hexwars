import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'chromium'}),results=[];
try{
 for(const [version,base] of [['before','https://rawcdn.githack.com/emfau88/hexwars/9cc31a630445fd7781b604a788bf6a80519d8c95/experiments/hexfront-lane-wars/'],['after','http://127.0.0.1:4181/']])for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const p=await browser.newPage({viewport});await p.goto(base+'tests/fixtures/rail.html',{timeout:120000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(()=>window.RAIL_TEST,null,{timeout:120000});
  const result=await p.evaluate(async()=>{
   await RAIL_TEST.setup();const v=RAIL_TEST.view,lanes=[{units:Array.from({length:64},(_,id)=>({id,type:id%4<2?'mech':'rail',owner:id%2?'blue':'orange',p:5+Math.floor(id/8)*2,x:(id%8-3.5)*.5,hp:id%4<2?110:40,moving:false,target:null}))}];
   v.render(lanes,0,0);for(let i=0;i<16;i++){const u=lanes[0].units[i],target=lanes[0].units[i+16];v.effect({kind:'shot',owner:u.owner,type:u.type,source:u.id,target:target.id,from:u,to:target},0);}v.render(lanes,0,0);
   const cpu=[],frames=[];let last=performance.now();for(let i=0;i<75;i++){await new Promise(requestAnimationFrame);const now=performance.now(),start=performance.now();v.dirty=true;v.render(lanes,0,0);if(i>=15){cpu.push(performance.now()-start);frames.push(now-last);}last=now;}
   const stats=a=>{a.sort((a,b)=>a-b);return {median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)]};};return {cpuMs:stats(cpu),frameMs:stats(frames),calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,geometries:v.renderer.info.memory.geometries};
  });results.push({version,viewport,...result});console.log(JSON.stringify(results.at(-1)));await p.close();
 }
 await fs.mkdir('docs/weapon-clarity',{recursive:true});await fs.writeFile('docs/weapon-clarity/performance.json',JSON.stringify({method:'Same desktop GPU, 64 stationary articulated robots, 8 Mech and 8 Railgun shots frozen at full brightness. Before=9cc31a6, after=working tree. 15 warmup + 60 RAF samples. Mobile viewport only; no phone hardware claim. Paired measurement is indicative, not a universal FPS guarantee.',results},null,2));
}finally{await browser.close();}
