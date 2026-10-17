import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true,channel:'chromium'}),results=[];
try{for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const p=await b.newPage({viewport});await p.goto('http://127.0.0.1:4181/tests/fixtures/rail.html');await p.waitForFunction(()=>window.RAIL_TEST);await p.evaluate(async()=>{await RAIL_TEST.setup();RAIL_TEST.crowd(64);});
 for(const effects of [false,true]){
  const measurement=await p.evaluate(async effects=>{
   const v=RAIL_TEST.view;
   if(effects){const {createRailShot}=await import('../../src/rail-effects.js');const poses=[...v.poses.values()];for(const pose of poses){pose.unit.moving=false;pose.unit.target=pose.unit.id;pose.unit.cooldown=.1;}for(let i=0;i<16;i++){const shot=createRailShot(poses[i].animator.muzzle(poses[i].world),poses[i+16].position.clone().add({x:0,y:.65,z:0}));v.scene.add(shot.root);v.effects.push(shot);}}
   const cpu=[],frames=[];let last;for(let i=0;i<100;i++){await new Promise(requestAnimationFrame);const now=performance.now();v.dirty=true;const start=performance.now();v.render(v.lastLanes,0,0);if(i>=20){cpu.push(performance.now()-start);frames.push(now-last);}last=now;}
   const stats=a=>{a.sort((a,b)=>a-b);return {median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)]};};return {cpuMs:stats(cpu),frameMs:stats(frames),...RAIL_TEST.benchmark()};
  },effects);results.push({viewport,effects,...measurement});console.log(JSON.stringify(results.at(-1)));
 }await p.close();}
 await fs.writeFile('docs/railgun-effects/performance.json',JSON.stringify({method:'64 static animated Railguns, baseline versus all 64 charging and 16 simultaneous frozen full-bright shots; 20 warmup + 80 RAF samples. Same desktop GPU; mobile viewport only, not phone hardware. No dynamic point lights or bloom passes.',results},null,2));
}finally{await b.close();}
