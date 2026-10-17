import test from 'node:test';
import assert from 'node:assert/strict';
import {Combat} from '../src/simulation.js';
import {Match} from '../src/match.js';
import {CENTRAL_UNITS} from '../src/central-rules.js';
import {UNITS} from '../src/rules.js';

test('Central roles: both factions move at requested speeds and Mechs acquire at exactly 3.0',()=>{
 for(const owner of ['orange','blue']){
  const enemy=owner==='orange'?'blue':'orange',dir=owner==='orange'?1:-1;
  for(const [type,speed] of [['drone',1.8],['mech',.9],['rail',.8]]){
   const g=new Combat({specs:CENTRAL_UNITS}),a=g.addUnit({owner,type,p:owner==='orange'?3:27});g.addUnit({owner:enemy,type:'mech',p:owner==='orange'?27:3});
   const initial=a.p;g.advance(.5);assert.ok(Math.abs((a.p-initial)*dir-speed*.5)<1e-8,`${owner} ${type} displacement`);
  }
  const g=new Combat({specs:CENTRAL_UNITS}),a=g.addUnit({owner,type:'mech',p:10}),b=g.addUnit({owner:enemy,type:'rail',p:13});assert.equal(g.chooseTarget(a,g.units).id,b.id);b.p=13.0001;assert.equal(g.chooseTarget(a,g.units),null);
 }
 assert.equal(CENTRAL_UNITS.rail.range,5.2);
 for(const mission of ['first','meadow'])assert.deepEqual(new Match({mission}).unitSpecs,UNITS);
});

test('Old central saves adopt only the three defaults; custom values, missions and every saved unit state survive',()=>{
 for(const mission of ['central','first','meadow']){
  const m=new Match({mission});m.start();m.advance(23.125);const data=m.save();
  if(mission==='central'){data.unitSpecs.rail.speed=1;data.unitSpecs.mech.range=2.8;data.unitSpecs.drone.speed=1.6;}
  const input=structuredClone(data),expected=structuredClone(data);if(mission==='central'){expected.unitSpecs.rail.speed=.8;expected.unitSpecs.mech.range=3;expected.unitSpecs.drone.speed=1.8;}
  assert.deepEqual(Match.restore(data).save(),expected);assert.deepEqual(data,input);
  data.unitSpecs.rail.speed=.7;data.unitSpecs.mech.range=3.2;data.unitSpecs.drone.speed=2;assert.deepEqual(Match.restore(data).save(),data);
 }
});
