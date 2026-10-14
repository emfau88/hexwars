import test from 'node:test';
import assert from 'node:assert/strict';
import {Match,MATCH_RULES} from '../src/match.js';
import {MatchAI,startingFactories} from '../src/match-ai.js';
import {STEP,UNITS} from '../src/rules.js';
import {exitDuration,exitPath,pathLength} from '../src/match-layout.js';
const running=()=>{const m=new Match();m.start();return m;};
test('setup has exactly two configurable paid factories, no income or waves until start',()=>{
 const m=new Match();assert.equal(m.players.orange.factories.filter(Boolean).length,2);m.advance(40);assert.equal(m.time,0);
 assert.equal(m.command('orange','configure',{slot:1,type:'drone',lane:0}).ok,true);assert.equal(m.command('orange','configure',{slot:2,type:'mech',lane:0}).ok,false);
 assert.equal(m.command('orange','economy').ok,false);m.start();assert.equal(m.credits('orange'),0);assert.equal(m.transit.filter(u=>u.owner==='orange').length,4);assert.equal(m.wave,1);assert.equal(m.start(),false);
});
test('income is exact; economy is paid once and changes future income only',()=>{
 const m=running();m.advance(40);assert.equal(m.credits('orange'),80);assert.ok(m.command('orange','economy').ok);assert.equal(m.credits('orange'),0);assert.equal(m.command('orange','economy').ok,false);m.advance(10);assert.equal(m.credits('orange'),30);assert.equal(m.credits('blue'),100);
});
test('build/refit reservation, correction, cancellation and simultaneous wave commit',()=>{
 const m=running();m.advance(50);const order=(slot,type,lane)=>m.command('orange','factory',{slot,type,lane});
 assert.ok(order(2,'rail',0).ok);assert.equal(m.credits('orange'),0);assert.equal(m.players.orange.factories[2],null);
 assert.ok(order(2,'mech',1).ok);assert.equal(m.credits('orange'),0);assert.ok(m.command('orange','cancel',{slot:2}).ok);assert.equal(m.credits('orange'),100);
 assert.ok(order(2,'drone',1).ok);m.advance(10);assert.deepEqual(m.players.orange.factories[2],{type:'drone',lane:1});assert.equal(m.wave,5);
 const survivors=m.lanes.flatMap(g=>g.units).map(u=>u.id+':'+u.lane);
 m.advance(5);assert.ok(order(0,'rail',1).ok);assert.equal(m.credits('orange'),0);assert.ok(order(0,'mech',1).ok);assert.equal(m.credits('orange'),30);
 assert.ok(order(0,'rail',1).ok);m.advance(10);assert.deepEqual(m.players.orange.factories[0],{type:'rail',lane:1});assert.equal(m.players.orange.metrics.refits,1);
 assert.ok(survivors.length>0);assert.ok(m.transit.some(u=>u.owner==='orange'&&u.factory===0&&u.type==='rail'&&u.spawnTime===75));
});
test('an order after a wave waits for the following wave; no skipped production',()=>{
 const m=running();m.advance(60);assert.ok(m.command('orange','factory',{slot:2,type:'mech',lane:0}).ok);m.advance(14.95);assert.equal(m.players.orange.factories[2],null);m.advance(.05);assert.equal(m.players.orange.factories[2].type,'mech');assert.ok(m.transit.some(u=>u.factory===2&&u.owner==='orange'&&u.spawnTime===75));
});
test('paid supply uses independent cooldown across wave boundary and persists existing robots',()=>{
 const m=running();m.advance(59);m.players.orange.cents=20000;
 assert.ok(m.command('orange','supply',{type:'drone',lane:1}).ok);assert.equal(m.credits('orange'),140);assert.equal(m.transit.filter(u=>u.factory===null).length,3);
 m.advance(1);assert.equal(m.command('orange','supply',{type:'drone',lane:0}).ok,false);m.advance(13.95);assert.equal(m.command('orange','supply',{type:'mech',lane:0}).ok,false);m.advance(.05);assert.ok(m.command('orange','supply',{type:'rail',lane:0}).ok);
});
test('factory exit travel has real type-dependent duration, mirrored for both factions',()=>{
 for(const slot of [null,0,1,2,3])for(const lane of [0,1])for(const type of ['drone','mech','rail']){
  assert.equal(exitDuration('orange',slot,lane,type),exitDuration('blue',slot,lane,type));assert.ok(exitDuration('orange',slot,lane,type)>0);assert.equal(exitDuration('orange',slot,lane,type),pathLength(exitPath('orange',slot,lane))/UNITS[type].speed);
 }
 const m=running(),first=m.transit.find(u=>u.owner==='orange');m.advance((first.arrivalTick-1)*STEP);assert.equal(m.lanes[first.lane].units.filter(u=>u.owner==='orange').length,0);m.advance(STEP);assert.ok(m.lanes[first.lane].units.some(u=>u.owner==='orange'));
});
test('HQ targeting prefers reachable robots and ignores distant robots when HQ is reachable',()=>{
 const m=running();m.transit=[];const g=m.lanes[0];g.units=[];
 const a=g.addUnit({type:'rail',owner:'orange',lane:0,p:27,x:0}),b=g.addUnit({type:'mech',owner:'blue',lane:0,p:28,x:0});
 assert.equal(g.chooseTarget(a,g.units).id,b.id);b.p=10;assert.equal(g.chooseTarget(a,g.units).id,'hq-blue');g.units=[a];m.advance(.4);assert.ok(m.players.blue.hq<1200);
});
test('one shared HQ weapon across both lanes and simultaneous HQ destruction',()=>{
 const m=running();m.transit=[];for(const g of m.lanes){g.units=[];g.addUnit({type:'mech',owner:'orange',lane:g.lane,p:26,x:0});}
 m.advance(STEP);assert.equal(m.lanes.reduce((n,g)=>n+g.units[0].hp,0),240-MATCH_RULES.hqDamage);
 const duel=running();duel.transit=[];duel.players.orange.hq=1;duel.players.blue.hq=1;duel.lanes[0].units=[];duel.lanes[1].units=[];
 duel.lanes[0].addUnit({type:'rail',owner:'orange',p:28,lane:0});duel.lanes[1].addUnit({type:'rail',owner:'blue',p:2,lane:1});
 duel.advance(1);assert.equal(duel.result,'draw');assert.equal(duel.phase,'ended');const before=duel.snapshot();duel.advance(100);assert.deepEqual(duel.snapshot(),before);assert.equal(duel.command('orange','economy').ok,false);
});
test('no artificial end, unit removal, or population gate in a long symmetric match',()=>{
 const m=running();m.advance(480);assert.equal(m.phase,'running');assert.equal(m.result,null);assert.equal(m.wave,33);assert.equal(m.players.orange.hq,m.players.blue.hq);
});
test('observer hides enemy pending orders, resources and AI uses only public observations',()=>{
 const m=running();m.advance(50);m.command('blue','factory',{slot:2,type:'rail',lane:0});
 const seen=m.observe('orange');assert.equal(seen.enemyFactories[2],null);assert.equal('enemyPending' in seen,false);assert.equal('enemyCredits' in seen,false);seen.factories[0].type='drone';assert.equal(m.players.orange.factories[0].type,'mech');
 const ai=new MatchAI('blue');const facade={tick:m.tick,phase:m.phase,rules:m.rules,observe:o=>m.observe(o),command:(...args)=>m.command(...args)};ai.update(facade);facade.tick+=50;ai.update(facade);
});
test('fixed and irregular frame slicing produce the same complete state with AI',()=>{
 const make=()=>{const m=new Match({blue:startingFactories('pressure')});m.controllers=[new MatchAI('blue',{profile:'pressure'})];m.start();return m;};
 const a=make(),b=make();a.advance(180);for(let i=0;i<1200;i++){b.advance(.01);b.advance(.04);b.advance(.1);}assert.deepEqual(b.snapshot(),a.snapshot());
});
test('bad and unaffordable actions are atomic',()=>{
 const m=running();for(const action of [{action:'factory',data:{slot:4,type:'mech',lane:0}},{action:'factory',data:{slot:0,type:'x',lane:0}},{action:'factory',data:{slot:2,type:'mech',lane:0}},{action:'supply',data:{type:'drone',lane:NaN}},{action:'supply',data:{type:'mech',lane:0}},{action:'economy'}]){const before=m.snapshot();assert.equal(m.command('orange',action.action,action.data).ok,false);assert.deepEqual(m.snapshot(),before);}
});
test('swapping factions preserves the entire AI match trace and economic spending',()=>{
 const a=new Match({orange:startingFactories('balanced'),blue:startingFactories('pressure',1)});
 const b=new Match({orange:startingFactories('pressure',1),blue:startingFactories('balanced')});
 a.controllers=[new MatchAI('orange',{opening:'factory'}),new MatchAI('blue',{profile:'pressure',variant:1})];
 b.controllers=[new MatchAI('blue',{opening:'factory'}),new MatchAI('orange',{profile:'pressure',variant:1})];
 a.start();b.start();a.advance(650);b.advance(650);
 assert.equal(a.phase,b.phase);assert.equal(a.result===null?null:a.result==='draw'?'draw':a.result==='orange'?'blue':'orange',b.result);assert.equal(a.time,b.time);assert.equal(a.players.orange.hq,b.players.blue.hq);assert.equal(a.players.blue.hq,b.players.orange.hq);
 assert.deepEqual(a.summary().metrics.orange,b.summary().metrics.blue);assert.deepEqual(a.summary().metrics.blue,b.summary().metrics.orange);
});
test('a correct visible production response after minute three changes the outcome',async()=>{
 const {lateResponse}=await import('./fixtures/late-response.mjs');
 const ignored=lateResponse({reacts:false}),reacted=lateResponse({reacts:true});
 assert.ok(reacted.visibleAtReaction.every(f=>f.type==='mech'));
 assert.notEqual(ignored.result,'orange');assert.ok(ignored.hq.orange<400);
 assert.equal(reacted.result,'orange');assert.ok(reacted.time>240&&reacted.time<420);
 assert.equal(reacted.hq.orange,MATCH_RULES.hqHP);assert.equal(reacted.metrics.orange.refits,4);
});
test('unopposed surviving robots are not removed when a lane temporarily empties',()=>{
 const m=running();m.transit=[];m.lanes[0].units=[];m.lanes[1].units=[];
 for(let i=0;i<150;i++)m.lanes[0].addUnit({owner:'orange',type:'drone',lane:0,p:i*.02,x:0});
 m.advance(.05);assert.equal(m.lanes[0].units.length,150);assert.equal(m.phase,'running');
});