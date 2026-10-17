import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Combat} from '../src/simulation.js';
import {Combat as FrozenCombat} from './fixtures/m1-simulation.js';
import {SCENARIOS} from '../src/scenarios.js';
import {UNITS} from '../src/rules.js';
import {Match} from '../src/match.js';
import {CENTRAL_UNITS,CENTRAL_RULES} from '../src/central-rules.js';
import {CentralAI,centralOpening} from '../src/central-ai.js';
import {centralLate} from './fixtures/central-late.mjs';
import {run} from '../scripts/central-audit.mjs';

test('legacy engine fixture is the frozen M1 source; every scenario keeps identical tick traces',async()=>{
 const baseline=JSON.parse(await fs.readFile(new URL('../docs/core-baseline.json',import.meta.url)));
 const original=(await fs.readFile(new URL('./fixtures/m1-simulation.js',import.meta.url),'utf8')).replace("'../../src/rules.js'","'./rules.js'").split(String.fromCharCode(13)).join('');
 assert.equal(createHash('sha256').update(original).digest('hex'),baseline['simulation.js']);
 for(const scenario of SCENARIOS)for(const gap of [8,16]){
  const a=new Combat({...scenario,gap}),b=new FrozenCombat({...scenario,gap});
  while(!a.result&&a.time<60){a.step();b.step();assert.deepEqual(a.snapshot(),b.snapshot());assert.deepEqual(a.drainEvents(),b.drainEvents());}
 }
});
test('unit profiles preserve legacy missions and retain three actual counter roles at squad scale',()=>{
 assert.equal(new Match({mission:'meadow'}).unitSpecs,UNITS);
 assert.equal(new Match({mission:'central'}).unitSpecs,CENTRAL_UNITS);
 assert.equal(UNITS.mech.hp,120);assert.equal(UNITS.rail.interval,2.4);
 for(const batches of [1,4])for(const [a,b] of [['drone','rail'],['mech','drone'],['rail','mech']]){
  const duel=new Combat({orange:{[a]:batches},blue:{[b]:batches},specs:CENTRAL_UNITS});
  assert.equal(duel.run().result,'orange',a+' counters '+b+' at '+batches+' factories');
 }
 // With Mech range 3.0, the mixed formation withstands this pure-drone assault.
 assert.equal(new Combat({orange:{drone:4},blue:{mech:2,rail:2},specs:CENTRAL_UNITS}).run().result,'blue');
 assert.equal(new Combat({orange:{mech:2,rail:2},blue:{drone:4},specs:CENTRAL_UNITS}).run().result,'orange');
});
test('central economy, reservations and supply spend real money with exact production/cooldown boundaries',()=>{
 const m=new Match({mission:'central'});assert.equal(m.command('orange','configure',{slot:1,type:'toString',lane:0}).ok,false);assert.equal(m.command('orange','configure',{slot:0,type:'drone',lane:0}).ok,false);
 assert.ok(m.command('orange','configure',{slot:1,type:'drone',lane:0}).ok);m.start();assert.equal(m.credits('orange'),40);
 m.advance(20);assert.ok(m.command('orange','economy').ok);assert.equal(m.credits('orange'),0);m.advance(40);assert.equal(m.credits('orange'),128);
 assert.ok(m.command('orange','factory',{slot:0,type:'rail',lane:0}).ok);assert.equal(m.credits('orange'),8);
 m.advance(19.95);assert.equal(m.players.orange.factories[0],null);m.advance(.05);assert.equal(m.players.orange.factories[0].type,'rail');
 m.advance(5);assert.ok(m.command('orange','supply',{type:'drone',lane:0}).ok);
 assert.equal(m.command('orange','supply',{type:'drone',lane:0}).ok,false);
 m.advance(29.95);assert.equal(m.command('orange','supply',{type:'drone',lane:0}).ok,false);
 m.advance(.05);assert.ok(m.command('orange','supply',{type:'drone',lane:0}).ok);
 assert.equal(m.players.orange.metrics.supplies,2);assert.equal(m.rules.wave,20);assert.equal(m.rules.supplyCooldown,30);
});
test('central AI uses a public facade and different openings make different paid decisions',()=>{
 const traces=[];
 for(const strategy of ['pressure','siege','economy']){
  const m=new Match({mission:'central',blue:centralOpening(strategy)}),ai=new CentralAI('blue',{strategy});m.start();
  const facade={get tick(){return m.tick;},get phase(){return m.phase;},rules:m.rules,unitSpecs:m.unitSpecs,observe:o=>m.observe(o),command:(...a)=>m.command(...a)};
  for(let i=0;i<120;i++){m.advance(1);ai.update(facade);m.drainEvents();}
  assert.ok(m.credits('blue')>=0);traces.push(JSON.stringify(ai.actions.slice(0,3)));
  assert.equal('enemyCredits' in m.observe('orange'),false);
 }
 assert.equal(new Set(traces).size,3);
});
test('central save/resume preserves the chosen opponent, stats and all future actions exactly',()=>{
 const a=new Match({mission:'central',blue:centralOpening('economy')});a.controllers=[new CentralAI('blue',{strategy:'economy'})];a.start();a.advance(163.125);
 const data=JSON.parse(JSON.stringify({match:a.save(),ai:a.controllers.map(c=>c.save())}));
 const b=Match.restore(data.match);b.controllers=data.ai.map(CentralAI.restore);a.advance(360);b.advance(360);
 assert.deepEqual(a.snapshot(),b.snapshot());assert.deepEqual(a.orders,b.orders);assert.deepEqual(a.controllers[0].save(),b.controllers[0].save());
});
test('central reference runs preserve results and all economic metrics when fully mirrored',()=>{
 for(const [left,right] of [['pressure','siege'],['pressure','economy'],['siege','economy']]){
  // Mirror controller execution order as well as factions: same-tick orders are observable.
  const a=run({a:left,b:right}),b=run({a:right,b:left,reverseControllers:true});
  assert.equal(a.result,{pressure:{siege:'blue',economy:'blue'},siege:{economy:'orange'}}[left][right]);assert.equal(b.result,a.result==='orange'?'blue':a.result==='blue'?'orange':a.result);assert.equal(a.time,b.time);assert.equal(a.hq.orange,b.hq.blue);assert.equal(a.hq.blue,b.hq.orange);assert.deepEqual(a.metrics.orange,b.metrics.blue);assert.deepEqual(a.metrics.blue,b.metrics.orange);
 }
});
test('central role tuning: late refit prevents defeat and timed drone reinforcement wins',()=>{
 const ignored=centralLate({reacts:false}),response=centralLate({reacts:true}),burst=centralLate({reacts:true,supply:true,supplyAt:210,supplyType:'drone'});
 assert.deepEqual(ignored.decision,response.decision);assert.deepEqual(response.decision,burst.decision);
 assert.equal(ignored.result,'blue');assert.equal(burst.result,'orange');assert.ok(Math.abs(burst.time-402.45)<.001);assert.equal(burst.hq.orange,800);assert.equal(burst.hq.blue,0);assert.equal(burst.metrics.orange.supplies,1);
 assert.notEqual(ignored.result,'orange');assert.ok(ignored.hq.orange<=burst.hq.orange);assert.equal(response.result,'unresolved');
 const a=centralLate({initial:'rail',enemy:'drone',counter:'mech',reacts:false}),b=centralLate({initial:'rail',enemy:'drone',counter:'mech'});
 assert.notEqual(a.result,'orange');assert.equal(b.result,'orange');assert.deepEqual(a.decision,b.decision);
});
test('central symmetric matches have no forced ending or expiring survivors',()=>{
 const m=new Match({mission:'central'});m.start();m.advance(720);assert.equal(m.result,null);assert.equal(m.phase,'running');assert.equal(m.players.orange.hq,m.players.blue.hq);
 assert.equal(m.wave,37);assert.ok(m.lanes[0].units.length+m.transit.length>0);
});
test('central deployment spreads same-type factories symmetrically without changing their travel time',()=>{
 const m=new Match({mission:'central'});m.start();m.lanes[0].units=[];
 for(const owner of ['orange','blue'])for(let slot=0;slot<4;slot++)m.spawn(owner,slot,{type:'mech',lane:0});
 assert.equal(new Set(m.lanes[0].units.filter(u=>u.owner==='orange').map(u=>u.homeX)).size,4);
 assert.equal(new Set(m.lanes[0].units.map(u=>u.travelDuration)).size,1);
 assert.deepEqual(m.lanes[0].units.filter(u=>u.owner==='orange').map(u=>u.homeX),m.lanes[0].units.filter(u=>u.owner==='blue').map(u=>u.homeX));
});
