import test from 'node:test';
import assert from 'node:assert/strict';
import {Match} from '../src/match.js';
import {MatchAI} from '../src/match-ai.js';
import {MISSIONS} from '../src/missions.js';
import {exitDuration,exitPose,laneEntry,factoryPosition} from '../src/match-layout.js';
import {routePoint} from '../src/routes.js';
import {missionRoute} from '../src/missions.js';
import {newCampaign,rememberMatch,unlocked,readCampaign,writeCampaign,STORAGE_KEY} from '../src/campaign.js';
import {frontState} from '../src/fronts.js';
for(const mission of Object.values(MISSIONS)){
 test(mission.id+': real lane/slot topology, no invalid lanes or duplicate waves',()=>{
  const m=new Match({mission:mission.id});assert.equal(m.lanes.length,mission.lanes);
  for(const p of Object.values(m.players)){assert.equal(p.factories.length,mission.slots);assert.equal(p.factories.filter(Boolean).length,mission.startSlots.length);}
  m.start();const count=m.players.orange.metrics.produced;
  assert.equal(m.command('orange','supply',{type:'mech',lane:mission.lanes}).ok,false);
  m.advance(m.rules.wave-.05);assert.equal(m.wave,1);m.advance(.05);assert.equal(m.wave,2);assert.equal(m.players.orange.metrics.produced,count*2);
 });
 test(mission.id+': every factory, lane, faction and formation has equal deployment time',()=>{
  for(const type of ['drone','mech','rail']){const durations=[];
   for(const owner of ['orange','blue'])for(const slot of [null,...Array.from({length:mission.slots},(_,i)=>i)])for(let lane=0;lane<mission.lanes;lane++)for(const x of [-.58,0,.58]){
    const duration=exitDuration(owner,slot,lane,type,x,mission);durations.push(duration);
    const u={owner,factory:slot,lane,type,x,spawnTime:0,missionId:mission.id},end=exitPose(u,duration),p=laneEntry(owner,mission);
    const expected=missionRoute(mission,lane,p,x)||routePoint(lane,p,x);
    // Blue formation lateral coordinates are mirrored consistently by the existing route presentation.
    const mirrored=missionRoute(mission,lane,laneEntry('orange',mission),x)||routePoint(lane,laneEntry('orange',mission),x);
    assert.ok(Math.abs(end.x-mirrored.x)<1e-6);assert.ok(Math.abs(end.z-mirrored.z*(owner==='orange'?1:-1))<1e-6);
   }assert.ok(durations.every(t=>t===durations[0]));
  }
 });
 test(mission.id+': save/resume preserves credits, production, unit IDs and AI decisions exactly',()=>{
  const m=new Match({mission:mission.id});m.controllers=['orange','blue'].map((o,i)=>new MatchAI(o,{...mission.ai,variant:i}));m.start();m.advance(83.125);
  const data=JSON.parse(JSON.stringify({match:m.save(),ai:m.controllers.map(a=>a.save())}));
  const n=Match.restore(data.match);n.controllers=data.ai.map(a=>MatchAI.restore(a));
  m.advance(127.4);n.advance(127.4);assert.deepEqual(n.snapshot(),m.snapshot());assert.deepEqual(n.controllers.map(a=>a.save()),m.controllers.map(a=>a.save()));
 });
 test(mission.id+': free pending direction change preserves paid refit and old units',()=>{
  const m=new Match({mission:mission.id});m.start();m.advance(51);const slot=mission.startSlots[0],dest=mission.lanes-1,units=structuredClone(m.transit);
  assert.ok(m.command('orange','factory',{slot,type:'rail',lane:0}).ok);
  const credits=m.credits('orange');assert.ok(m.command('orange','factory',{slot,type:'rail',lane:dest}).ok);assert.equal(m.credits('orange'),credits);assert.deepEqual(m.transit,units);
  m.command('orange','cancel',{slot});assert.equal(m.credits('orange'),credits+30);
 });
}
test('mission saves stay independent; only real victory unlocks level two',()=>{
 const c=newCampaign(),m=new Match({mission:'first'});m.start();m.advance(60);rememberMatch(c,m,[]);
 assert.equal(unlocked(c,'meadow'),false);const first=JSON.stringify(c.saves.first);
 const n=new Match({mission:'meadow'});rememberMatch(c,n,[]);assert.equal(JSON.stringify(c.saves.first),first);
 m.phase='ended';m.result='blue';rememberMatch(c,m,[]);assert.equal(unlocked(c,'meadow'),false);
 m.result='orange';rememberMatch(c,m,[]);assert.equal(unlocked(c,'meadow'),true);
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};writeCampaign(storage,c);assert.deepEqual(readCampaign(storage),c);assert.deepEqual([...store.keys()],[STORAGE_KEY]);
});
test('front indicators derive direction from position and warn at actual HQ approach',()=>{
 const m=new Match({mission:'meadow'});m.start();m.lanes[0].addUnit({type:'mech',owner:'orange',p:15,lane:0});m.lanes[0].addUnit({type:'mech',owner:'blue',p:16,lane:0});
 const old=frontState(m,0);m.time=5;m.lanes[0].units.forEach(u=>u.p+=2);assert.equal(frontState(m,0,old).label,'Eigene Front rückt vor');
 m.lanes[0].units[1].p=3;assert.equal(frontState(m,0).risk,true);
});

test('campaign deployments keep their heading, monotone route and exact combat handoff',()=>{
 for(const mission of Object.values(MISSIONS))for(const owner of ['orange','blue'])for(let slot=0;slot<mission.slots;slot++)for(let lane=0;lane<mission.lanes;lane++)for(const type of ['drone','mech','rail']){
  const duration=exitDuration(owner,slot,lane,type,0,mission),u={owner,factory:slot,lane,type,x:0,spawnTime:0,missionId:mission.id};
  let last=exitPose(u,0),sign=Math.sign(exitPose(u,duration).x-last.x);
  for(let i=1;i<=40;i++){const t=duration*i/40,p=exitPose(u,t),a=exitPose(u,t-.0001),b=exitPose(u,Math.min(duration,t+.0001));const dx=b.x-a.x,dz=b.z-a.z;
   assert.ok((p.x-last.x)*sign>=-1e-8);assert.ok((p.z-last.z)*(owner==='orange'?1:-1)<=1e-8);assert.ok((-Math.sin(p.yaw)*dx-Math.cos(p.yaw)*dz)/Math.hypot(dx,dz)>.999);last=p;
  }
  const m=new Match({mission:mission.id});m.start();m.transit=[];m.lanes.forEach(g=>g.units=[]);m.spawn(owner,slot,{type,lane});const tick=mission.id==='central'?Math.ceil(m.lanes[lane].units[0].travelDuration/.05-1e-9):m.transit[0].arrivalTick;
  m.advance(tick*.05);const unit=m.lanes[lane].units.find(v=>v.factory===slot&&v.owner===owner);assert.ok(unit);assert.ok(Math.abs(unit.p-laneEntry(owner,mission))<1e-8);
 }
});
test('campaign AI matches remain faction symmetric with swapped decision profiles',()=>{
 for(const mission of Object.values(MISSIONS)){
  const a=new Match({mission:mission.id}),b=new Match({mission:mission.id}),slow=mission.ai,fast={profile:'balanced',opening:'economy'};
  a.controllers=[new MatchAI('orange',fast),new MatchAI('blue',slow)];b.controllers=[new MatchAI('orange',slow),new MatchAI('blue',fast)];a.start();b.start();a.advance(720);b.advance(720);
  assert.equal(a.time,b.time);assert.equal(a.players.orange.hq,b.players.blue.hq);assert.equal(a.players.blue.hq,b.players.orange.hq);assert.deepEqual(a.players.orange.metrics,b.players.blue.metrics);
 }
});
test('a paid response at 3:20 can change a campaign loss to a victory',async()=>{
 const {lateResponse}=await import('./fixtures/late-response.mjs');
 const ignored=lateResponse({mission:'meadow',initial:'mech',enemy:'rail',counter:'drone',reacts:false,budget:720});
 const reacted=lateResponse({mission:'meadow',initial:'mech',enemy:'rail',counter:'drone',reacts:true,concentrate:true,budget:720});
 assert.equal(ignored.result,'blue');assert.equal(reacted.result,'orange');assert.ok(reacted.time<420);assert.ok(reacted.hq.orange>0);
});
