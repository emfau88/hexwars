import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true,channel:'chromium'}),results=[];
try{for(const device of [{name:'Desktop',width:1440,height:900,dpr:1},{name:'Mobile viewport',width:390,height:844,dpr:2}]){
 const p=await b.newPage({viewport:{width:device.width,height:device.height},deviceScaleFactor:device.dpr});
 await p.goto('http://127.0.0.1:4181/tests/fixtures/mech.html');await p.waitForFunction(()=>window.MECH_TEST);
 for(const animated of [false,true]){await p.evaluate(animated=>MECH_TEST.setup(animated),animated);
  for(const count of [16,64,128]){await p.evaluate(count=>MECH_TEST.crowd(count),count);
   const measurement=await p.evaluate(async()=>{const cpu=[],interval=[],sync=[];let last;
    for(let i=0;i<105;i++){await new Promise(requestAnimationFrame);const now=performance.now();const elapsed=MECH_TEST.frame();if(i>=15){cpu.push(elapsed);if(last)interval.push(now-last);}last=now;}
    // Separate transform/instance-buffer update cost, excluding renderer and GPU queue.
    for(let i=0;i<180;i++){const t=performance.now();MECH_TEST.frame(false);if(i>=30)sync.push(performance.now()-t);}
    const stats=a=>{a.sort((a,b)=>a-b);return {median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)]};};return {cpu:stats(cpu),frame:stats(interval),transforms:stats(sync),...MECH_TEST.benchmark()};});
   const row={device:device.name,animated,count,...measurement};results.push(row);console.log(JSON.stringify(row));
  }
 }await p.close();}
 await fs.writeFile('docs/mech-animation/performance.json',JSON.stringify({browser:b.version(),method:'Same landscape, HQs, shadows, original static mesh versus actual animated rig. 15 warm-up + 90 RAF samples; 150 warmed CPU-only transform samples. Mobile is viewport/DPR emulation on this GPU, not physical phone hardware.',results},null,2));
}finally{await b.close();}
