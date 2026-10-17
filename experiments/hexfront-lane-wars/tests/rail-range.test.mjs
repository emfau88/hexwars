import test from 'node:test';
import assert from 'node:assert/strict';
import {UNITS} from '../src/rules.js';
import {CENTRAL_UNITS} from '../src/central-rules.js';
import {Combat} from '../src/simulation.js';
import {Match} from '../src/match.js';
test('Central Railgun has the requested 5.2 range for both factions; historical profiles retain 4.0',()=>{
 assert.equal(UNITS.rail.range,4);assert.equal(CENTRAL_UNITS.rail.range,5.2);
 for(const mission of ['first','meadow'])assert.equal(new Match({mission}).unitSpecs.rail.range,4);
 for(const owner of ['orange','blue']){
  const g=new Combat({specs:CENTRAL_UNITS}),enemy=owner==='orange'?'blue':'orange',a=g.addUnit({owner,type:'rail',p:10}),b=g.addUnit({owner:enemy,type:'mech',p:15.2});
  assert.equal(g.chooseTarget(a,g.units).id,b.id);b.p=15.2001;assert.equal(g.chooseTarget(a,g.units),null);
 }
});
test('Central saves migrate previous standard range without altering state; custom and historical ranges survive',()=>{
 for(const mission of ['central','first','meadow'])for(const oldRange of [4,4.8]){
  const m=new Match({mission});m.start();m.advance(17.125);const save=m.save();save.unitSpecs.rail.range=mission==='central'?oldRange:4;
  const original=structuredClone(save),restored=Match.restore(save);assert.equal(restored.unitSpecs.rail.range,mission==='central'?5.2:4);assert.deepEqual(restored.snapshot(),m.snapshot());assert.deepEqual(save,original);
  save.unitSpecs.rail.range=6.1;assert.equal(Match.restore(save).unitSpecs.rail.range,6.1);
 }
});
