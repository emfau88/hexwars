import test from 'node:test';
import assert from 'node:assert/strict';
import {Match} from '../src/match.js';
import {OWNERS,TYPES,UNITS,STEP} from '../src/rules.js';
import {routePoint} from '../src/routes.js';
import {exitPath,exitPose,exitDuration,laneEntry,baseSign} from '../src/match-layout.js';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const slots=[null,0,1,2,3],laterals=[-.58,0,.58];

test('all factory and HQ exits move toward their lane without doubling back',()=>{
 for(const owner of OWNERS)for(const slot of slots)for(const lane of [0,1])for(const x of laterals){
  const points=exitPath(owner,slot,lane,x),sign=Math.sign(points.at(-1).x-points[0].x);
  for(let i=1;i<points.length;i++){
   assert.ok((points[i].x-points[i-1].x)*sign>=-1e-10);
   assert.ok((points[i].z-points[i-1].z)*baseSign(owner)<=1e-10);
  }
 }
});
test('exit poses face the actual motion, travel at unit speed and join the correct lane formation',()=>{
 for(const owner of OWNERS)for(const slot of slots)for(const lane of [0,1])for(const type of TYPES)for(const x of type==='drone'?laterals:[0]){
  const u={owner,factory:slot,lane,type,x,spawnTime:15},duration=exitDuration(owner,slot,lane,type,x);
  for(const fraction of [.01,.1,.25,.5,.75,.9,.99]){
   const t=15+duration*fraction,a=exitPose(u,t-.00001),b=exitPose(u,t+.00001),p=exitPose(u,t);
   const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
   assert.ok((-Math.sin(p.yaw)*dx-Math.cos(p.yaw)*dz)/length>.999);
   near(length/.00002,UNITS[type].speed,.003);
  }
  const start=exitPose(u,15);near(Math.sin(start.yaw),0);near(Math.cos(start.yaw),baseSign(owner));
  const end=exitPose(u,15+duration),entry=routePoint(lane,laneEntry(owner),x);
  near(end.x,entry.x);near(end.z,entry.z);
  const next=routePoint(lane,laneEntry(owner)+(owner==='orange'?.001:-.001),x);
  const d=Math.hypot(next.x-entry.x,next.z-entry.z);
  assert.ok((-Math.sin(end.yaw)*(next.x-entry.x)-Math.cos(end.yaw)*(next.z-entry.z))/d>.99999);
 }
});
test('every exit position, heading and individual arrival time is faction mirrored',()=>{
 for(const slot of slots)for(const lane of [0,1])for(const type of TYPES)for(const x of laterals){
  const duration=exitDuration('orange',slot,lane,type,x);assert.equal(duration,exitDuration('blue',slot,lane,type,x));
  for(const t of [0,duration*.1,duration*.5,duration*.9,duration]){
   const u={factory:slot,lane,type,x,spawnTime:0},a=exitPose({...u,owner:'orange'},t),b=exitPose({...u,owner:'blue'},t);
   near(a.x,b.x);near(a.z,-b.z);near(Math.sin(a.yaw),Math.sin(b.yaw));near(Math.cos(a.yaw),-Math.cos(b.yaw));
  }
 }
});
test('arrival uses the physical merge point without teleporting the formation',()=>{
 for(const owner of OWNERS)for(const slot of slots)for(const lane of [0,1])for(const type of TYPES){
  const m=new Match();m.start();m.transit=[];m.lanes.forEach(g=>g.units=[]);m.spawn(owner,slot,{type,lane});
  const departures=[...m.transit],lastTick=Math.max(...departures.map(u=>u.arrivalTick));
  while(m.tick<lastTick){
   m.advance(STEP);
   for(const u of departures.filter(u=>u.arrivalTick===m.tick)){
    const unit=m.lanes[lane].units.find(v=>v.owner===owner&&v.factory===slot&&v.homeX===u.x);
    assert.ok(unit);near(unit.p,laneEntry(owner));near(unit.x,u.x);
    const before=exitPose(u,m.time-STEP),after=routePoint(lane,unit.p,unit.x);
    assert.ok(Math.hypot(after.x-before.x,after.z-before.z)<=UNITS[type].speed*STEP+.001);
   }
  }
 }
});

test('new reinforcements can still turn back to engage attackers at their own HQ',()=>{
 for(const owner of OWNERS)for(const type of TYPES){
  const m=new Match();m.start();m.transit=[];m.lanes.forEach(g=>g.units=[]);
  const g=m.lanes[0];
  m.spawn(owner,0,{type,lane:0});
  const firstTick=Math.min(...m.transit.map(u=>u.arrivalTick));m.advance(firstTick*STEP);
  const enemy=g.addUnit({owner:owner==='orange'?'blue':'orange',type:'drone',lane:0,p:owner==='orange'?1.05:28.95,x:0});m.advance(STEP);
  const guards=g.units.filter(u=>u.owner===owner);
  assert.ok(guards.some(u=>u.target===enemy.id||(u.p-laneEntry(owner))*baseSign(owner)<0));
 }
});
