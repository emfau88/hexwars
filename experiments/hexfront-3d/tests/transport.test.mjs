import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle,TRANSPORT_SECONDS_PER_HEX} from '../src/game.js';
import {RAMPS,surfaceHeight} from '../src/map.js';
import {transportEase,transportPose} from '../src/transport.js';
test('central transport duration is exact within one simulation tick, with one arrival',()=>{
 const g=new Battle();g.start();g.send('-2,3','-3,3');g.drainEvents();
 for(let i=0;i<Math.round(TRANSPORT_SECONDS_PER_HEX/.05)-1;i++)g.update(.05);
 assert.equal(g.orders.length,1);g.update(.05);assert.equal(g.orders.length,0);
 const events=g.drainEvents();assert.equal(events.filter(e=>e.type==='capture').length,1);assert.equal(events[0].from,'-2,3');assert.equal(events[0].previous,'neutral');
});
test('departure and arrival ease without overshoot or slowing owned intermediate nodes',()=>{
 for(const [start,end] of [[true,true],[true,false],[false,true],[false,false]]){
  let previous=-1;for(let i=0;i<=100;i++){const t=transportEase(i/100,start,end);assert.ok(t>=previous&&t>=0&&t<=1);previous=t;}
  assert.equal(transportEase(0,start,end),0);assert.equal(transportEase(1,start,end),1);
 }
 assert.ok(transportEase(.1,true,true)<.1);assert.ok(transportEase(.9,true,true)>.9);assert.equal(transportEase(.4,false,false),.4);
});
test('both ramps in both directions have continuous poses and terrain clearance',()=>{
 const g=new Battle();let samples=0;
 for(const edge of RAMPS)for(const reverse of [false,true]){
  const path=edge.split('|');if(reverse)path.reverse();const o={path,segment:0,id:1,owner:'orange',progress:0};let previous;
  for(let i=0;i<=100;i++){
   o.progress=i/100;const p=transportPose(g,o,0,true),cell=g.cell(path[p.t<.5?0:1]);
   assert.ok(p.y-surfaceHeight(g.cells,cell,p.x,p.z)>=.33999);
   if(previous)assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z)<.06,'No step/teleport on a ramp');previous=p;samples++;
  }
 }
 assert.equal(samples,808);
});
test('reinforcement and losing combat emit visual data without changing battle formulas',()=>{
 const g=new Battle();g.start();const own=g.cell('-2,2'),before=own.units;
 g.arrive({id:7,owner:'orange',units:5},g.cell('-2,3'),own);assert.equal(own.units,before+5);assert.equal(g.drainEvents()[0].type,'reinforce');
 const enemy=g.cell('2,-3'),previous=enemy.units;g.arrive({id:8,owner:'orange',units:1},g.cell('2,-2'),enemy);
 assert.equal(enemy.owner,'blue');assert.ok(Math.abs(enemy.units-(previous-1/1.2))<1e-10);const events=g.drainEvents();assert.deepEqual(events.map(e=>e.type),['combat']);assert.equal(events[0].previous,'blue');
});
test('owned multi-edge route preserves position and heading at segment boundaries',()=>{
 const g=new Battle();for(const id of ['-3,3','-3,2'])g.cell(id).owner='orange';
 const path=g.path(g.cell('-2,3'),g.cell('-3,1')).map(c=>c.id);assert.ok(path.length>2);
 for(let segment=0;segment<path.length-2;segment++){
  const a=transportPose(g,{id:4,owner:'orange',path,segment,progress:1},1,true),b=transportPose(g,{id:4,owner:'orange',path,segment:segment+1,progress:0},1,true);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-8);assert.ok(Math.abs(Math.atan2(Math.sin(a.yaw-b.yaw),Math.cos(a.yaw-b.yaw)))<1e-8);
 }
});
