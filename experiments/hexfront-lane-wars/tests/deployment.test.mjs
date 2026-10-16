import test from 'node:test';
import assert from 'node:assert/strict';
import {Match} from '../src/match.js';
import {CENTRAL_UNITS} from '../src/central-rules.js';
import {STEP,OWNERS,TYPES,other,direction,distance} from '../src/rules.js';
import {exitPose,laneEntry} from '../src/match-layout.js';
import {missionRoute} from '../src/missions.js';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,a+' != '+b);
function empty(options={}){const m=new Match({mission:'central',...options,rules:{hqDamage:0,...options.rules}});m.start();m.lanes[0].units=[];m.drainEvents();return m;}

test('all factory gates and HQ supply exits immediately trade real damage for either faction',()=>{
 for(const owner of OWNERS)for(const factory of [null,0,1,2,3])for(const type of TYPES){
  const m=empty(),g=m.lanes[0];m.spawn(owner,factory,{type,lane:0});assert.equal(m.transit.length,0);
  const unit=g.units[0],start={p:unit.p,x:unit.x};
  const enemy=g.addUnit({owner:other(owner),type:'mech',p:unit.p+direction(owner)*.7,x:unit.x});
  m.advance(.4);
  assert.ok(unit.hp<CENTRAL_UNITS[type].hp,owner+' '+factory+' '+type+' is vulnerable');
  assert.ok(enemy.hp<CENTRAL_UNITS.mech.hp,owner+' '+factory+' '+type+' fires at gate');
  near(unit.p,start.p);near(unit.x,start.x);assert.equal(unit.deployment.elapsed,0);
  const shots=m.drainEvents().filter(e=>e.kind==='shot'&&e.source===unit.id);
  assert.ok(shots.length);assert.ok(shots[0].time<=CENTRAL_UNITS[type].windup+STEP);
  assert.equal(unit.target,enemy.id);
 }
});
test('a robot killed at its gate never resurrects at the old lane entry time',()=>{
 for(const owner of OWNERS){
  const m=empty(),g=m.lanes[0];m.spawn(owner,0,{type:'rail',lane:0});const unit=g.units[0];
  g.addUnit({owner:other(owner),type:'rail',p:unit.p+direction(owner),x:unit.x});
  m.advance(.4);assert.equal(g.units.length,0);m.advance(8);assert.equal(g.units.length,0);
  assert.equal(g.stats.orange.lost,1);assert.equal(g.stats.blue.lost,1);
 }
});
test('a blocked exit resumes from the same position and saves cooldown, HP and route progress',()=>{
 const m=empty(),g=m.lanes[0];m.spawn('orange',3,{type:'mech',lane:0});m.advance(1);
 const unit=g.units[0],elapsed=unit.deployment.elapsed,position={p:unit.p,x:unit.x};
 g.addUnit({owner:'blue',type:'mech',p:unit.p+.7,x:unit.x});m.advance(.4);
 near(unit.deployment.elapsed,elapsed);near(unit.p,position.p);near(unit.x,position.x);
 const n=Match.restore(JSON.parse(JSON.stringify(m.save())));
 assert.deepEqual(n.snapshot(),m.snapshot());
 for(const game of [m,n]){game.lanes[0].units=game.lanes[0].units.filter(u=>u.owner==='orange');game.advance(.05);}
 assert.deepEqual(n.snapshot(),m.snapshot());assert.ok(unit.deployment.elapsed>elapsed);
 assert.ok(distance(unit,position)<.15);assert.equal(unit.hp,100);
 m.advance(8);assert.equal(unit.deployment,undefined);assert.ok(unit.p>=4);assert.equal(unit.id,g.units[0].id);
});
test('central approach remains continuous and mirrored for every gate, type and supply formation',()=>{
 for(const type of TYPES)for(const slot of [null,0,1,2,3]){
  const a=empty(),b=empty();a.spawn('orange',slot,{type,lane:0});b.spawn('blue',slot,{type,lane:0});
  const duration=a.lanes[0].units[0].travelDuration;
  for(let i=0;i<Math.ceil(duration/STEP-1e-9);i++){
   const before=a.lanes[0].units.map(u=>missionRoute(a.mission,0,u.p,u.x));
   a.advance(STEP);b.advance(STEP);
   a.lanes[0].units.forEach((u,j)=>{
    const v=b.lanes[0].units[j],p=missionRoute(a.mission,0,u.p,u.x);
    near(u.p,30-v.p);near(u.x,v.x);assert.ok(Math.hypot(p.x-before[j].x,p.z-before[j].z)<.2);
   });
  }
  for(const u of a.lanes[0].units){near(u.p,laneEntry('orange',a.mission));near(u.x,u.homeX);assert.equal(u.deployment,undefined);}
 }
});
test('short-range attackers can reach both outer gates instead of sticking to lane bounds',()=>{
 const specs={...CENTRAL_UNITS,mech:{...CENTRAL_UNITS.mech,damage:0,secondary:0}};
 for(const owner of OWNERS)for(const slot of [0,3]){
  const m=empty({unitSpecs:specs}),g=m.lanes[0];m.spawn(owner,slot,{type:'mech',lane:0});const guard=g.units[0];
  const attacker=g.addUnit({owner:other(owner),type:'drone',p:guard.p+direction(owner)*1.4,x:Math.sign(guard.x)*1.4});
  // Isolate robot pursuit from the separate HQ target at this exact location.
  m.players[owner].hq=0;for(let i=0;i<40;i++)g.step();assert.ok(Math.abs(attacker.x)>1.4);assert.ok(guard.hp<specs.mech.hp);
 }
});
test('Mech fires from a visible gap while the rail unit still outranges and counters it',()=>{
 const m=empty(),g=m.lanes[0],mech=g.addUnit({owner:'orange',type:'mech',p:10}),rail=g.addUnit({owner:'blue',type:'rail',p:16});
 let first;
 while(!first&&m.time<10){m.advance(STEP);first=m.drainEvents().find(e=>e.kind==='shot'&&e.source===mech.id);}
 assert.ok(first);const from=missionRoute(m.mission,0,first.from.p,first.from.x),to=missionRoute(m.mission,0,first.to.p,first.to.x);
 assert.ok(Math.hypot(to.x-from.x,to.z-from.z)>1.6);assert.ok(CENTRAL_UNITS.mech.range<CENTRAL_UNITS.rail.range);
});
test('old central saves migrate visible exits in place and keep their existing HQ balance',()=>{
 const m=empty();m.spawn('orange',2,{type:'mech',lane:0});const save=m.save(),u=m.lanes[0].units[0];
 save.version=1;save.tick=20;save.time=1;save.unitSpecs={...CENTRAL_UNITS,mech:{...CENTRAL_UNITS.mech,range:1.6}};
 save.rules.hqHP=1200;save.rules.hqDamage=6;save.players.orange.hq=900;
 save.transit=[{...u,id:-1,x:u.homeX,arrivalTick:134}];save.lanes[0].units=[];
 const pose=exitPose(save.transit[0],save.time),restored=Match.restore(save),active=restored.lanes[0].units[0],actual=missionRoute(restored.mission,0,active.p,active.x);
 near(actual.x,pose.x);near(actual.z,pose.z);assert.equal(restored.transit.length,0);
 assert.equal(restored.rules.hqHP,1200);assert.equal(restored.players.orange.hq,900);assert.equal(restored.unitSpecs.mech.range,2.8);
 restored.advance(.4);assert.ok(active.deployment.elapsed>1);
});
