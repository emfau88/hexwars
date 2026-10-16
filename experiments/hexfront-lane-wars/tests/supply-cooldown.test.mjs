import test from 'node:test';
import assert from 'node:assert/strict';
import {Match,MATCH_RULES} from '../src/match.js';
import {CENTRAL_RULES} from '../src/central-rules.js';
import {STEP} from '../src/rules.js';

test('only central supply cooldown changes; legacy modes retain 15 seconds',()=>{
 assert.deepEqual(CENTRAL_RULES,{startCredits:280,factoryCost:120,refitCost:30,income:2,economyCost:80,economyIncome:1.2,supplyCost:80,supplyCooldown:30,wave:20,hqHP:800,hqDamage:2,hqInterval:1,hqRange:4});
 assert.equal(MATCH_RULES.supplyCooldown,15);
 for(const mission of ['first','meadow'])assert.equal(new Match({mission}).rules.supplyCooldown,15);
});

test('both factions pay 80 and can reinforce at exactly 30 seconds, never a tick earlier',()=>{
 const m=new Match({mission:'central'});m.start();m.advance(80);
 for(const owner of ['orange','blue']){
  const credits=m.credits(owner);assert.ok(m.command(owner,'supply',{type:'drone',lane:0}).ok);
  assert.equal(m.credits(owner),credits-80);assert.equal(m.observe(owner).supplyCooldown,30);
 }
 m.advance(29.95);
 for(const owner of ['orange','blue']){
  const before=m.snapshot();assert.equal(m.command(owner,'supply',{type:'drone',lane:0}).ok,false);assert.deepEqual(m.snapshot(),before);
 }
 m.advance(.05);
 for(const owner of ['orange','blue'])assert.ok(m.command(owner,'supply',{type:'drone',lane:0}).ok);
});

test('old central saves count elapsed cooldown for both sides without changing other saved data',()=>{
 for(const version of [1,2])for(const elapsed of [0,12,29.95,30,34.95,35,40]){
  const m=new Match({mission:'central',rules:{supplyCooldown:35,hqHP:1200,hqDamage:6}});m.start();m.advance(80);
  for(const owner of ['orange','blue'])assert.ok(m.command(owner,'supply',{type:'drone',lane:0}).ok);
  m.advance(elapsed);
  const saved=m.save();saved.version=version;
  const untouched=structuredClone(saved),expected=structuredClone(saved);
  expected.version=2;expected.rules.supplyCooldown=30;
  for(const p of Object.values(expected.players))if(p.supplyReady>expected.tick)p.supplyReady=Math.max(expected.tick,p.supplyReady-5/STEP);
  const restored=Match.restore(saved);
  assert.deepEqual(saved,untouched,'loading must not mutate source save');
  assert.deepEqual(restored.save(),expected);
  for(const owner of ['orange','blue'])assert.ok(Math.abs(restored.observe(owner).supplyCooldown-Math.max(0,30-elapsed))<1e-8);
  assert.deepEqual(Match.restore(restored.save()).save(),restored.save(),'migration is applied only once');
 }
});

test('legacy saves and central saves with other cooldown settings are restored unchanged',()=>{
 for(const mission of ['first','meadow','central'])for(const supplyCooldown of [15,30,40]){
  const m=new Match({mission,rules:{supplyCooldown}});m.start();m.advance(80);
  for(const owner of ['orange','blue'])assert.ok(m.command(owner,'supply',{type:'drone',lane:0}).ok);
  m.advance(10);assert.deepEqual(Match.restore(m.save()).save(),m.save());
 }
});

