// Capture unchanged central-front exit transforms and terrain for offline Blender validation.
import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {exitPose,exitDuration,factoryPosition,baseSign} from '../../src/match-layout.js';
import {missionById} from '../../src/missions.js';
const mission=missionById('central'),poses=[];
for(const owner of ['orange','blue'])for(let slot=0;slot<4;slot++){
 const origin=factoryPosition(owner,slot,mission),sign=baseSign(owner),lateral=(slot-1.5)*mission.formationSpread;
 const unit={owner,factory:slot,lane:0,type:'mech',x:lateral,spawnTime:0,missionId:mission.id,
  travelDuration:exitDuration(owner,slot,0,'mech',lateral,mission)};
 for(let time=0;time<1.5;time+=.05){
  const p=exitPose(unit,time);
  poses.push({owner,slot,time,x:(p.x-origin.x)*sign,y:(origin.z-p.z)*sign,yaw:-p.yaw-(owner==='blue'?Math.PI:0),worldX:p.x,worldZ:p.z});
 }
}
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 // A blank same-origin page avoids rendering the game while sampling its height function.
 await page.goto(process.env.FACTORY_ORIGIN||'http://127.0.0.1:4181/factory-preview.html');
 const result=await page.evaluate(async poses=>{
  const {firstHeight}=await import('./src/landscape-view.js');
  return poses.map(({worldX,worldZ,...pose})=>({...pose,groundOffset:firstHeight(worldX,worldZ)-.06}));
 },poses);
 await fs.writeFile(new URL('exit-poses.json',import.meta.url),JSON.stringify(result));
 console.log('Captured',result.length,'exit poses; height range',Math.min(...result.map(p=>p.groundOffset)),Math.max(...result.map(p=>p.groundOffset)));
}finally{await browser.close();}
