import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle,chooseOrder,forecast} from '../src/game.js';
import {reachability,orderPreview,fieldInfo} from '../src/tactics.js';
import {traversable} from '../src/map.js';

test('direct, indirect and cliff indications use the command path, including both ramp directions',()=>{
 const g=new Battle(),source=g.cell('-2,3');
 assert.equal(reachability(g,source,g.cell('-2,2')),'direct');
 assert.equal(reachability(g,source,g.cell('0,2')),'indirect');
 assert.equal(reachability(g,g.cell('-1,2'),g.cell('0,1')),'cliff');
 for(const [lower,ramp,upper] of [['-3,1','-2,1','-1,1'],['3,-1','2,-1','1,-1']]){
  for(const id of [lower,ramp,upper])g.cell(id).owner='orange';
  for(const [a,b] of [[lower,ramp],[ramp,upper],[upper,ramp],[ramp,lower]])assert.equal(reachability(g,g.cell(a),g.cell(b)),'direct');
 }
});

test('UI forecast uses the final route edge, preserves max defense and can show both downhill and HQ bonuses',()=>{
 const g=new Battle();for(const id of ['-3,3','-3,2','-3,1','-2,1','-1,1'])g.cell(id).owner='orange';
 const source=g.cell('-2,3'),target=g.cell('0,0'),p=orderPreview(g,source,target,1);
 assert.ok(p.path.length>3);assert.equal(source.height,0);assert.equal(p.path.at(-2).height,2);assert.equal(p.combat.defense,1);assert.deepEqual(p.combat,forecast(p.path.at(-2),target,p.amount));
 assert.equal(orderPreview(g,g.cell('-2,1'),g.cell('-1,1'),1).combat,null);
 g.cell('-1,1').owner='neutral';assert.equal(orderPreview(g,g.cell('-2,1'),g.cell('-1,1'),1).combat.defense,1.3);
 g.cell('-3,1').owner='blue';assert.equal(orderPreview(g,g.cell('-2,1'),g.cell('-3,1'),1).combat.attack,1.15);
 const f=forecast({height:2},{height:0,kind:'hq',units:20},30);assert.equal(f.defense,1.2);assert.equal(f.attack,1.15);
 assert.equal(orderPreview(g,source,g.cell('3,-1'),1).combat,null);
});

test('actual capture updates cached economy immediately, failed attack leaves ownership/rate intact',()=>{
 const g=new Battle();g.start();const rate=g.economy('orange').rate;assert.ok(g.send('-2,3','-3,3',.5).ok);
 for(let i=0;i<22;i++)g.update(.05);assert.equal(g.cell('-3,3').owner,'orange');assert.ok(Math.abs(g.economy('orange').rate-rate-.03)<1e-9);
 const before=g.economy('orange');g.cell('-3,2').units=100;assert.ok(g.send('-3,3','-3,2',.5).ok);for(let i=0;i<22;i++)g.update(.05);assert.equal(g.cell('-3,2').owner,'neutral');assert.deepEqual(g.economy('orange'),before);
});

test('existing AI can reconnect a cut relay, use its HQ, and traverse either ramp without a production cheat',()=>{
 for(const owner of ['orange','blue']){
  const g=new Battle(),sign=owner==='orange'?1:-1;
  const id=(q,r)=>`${q*sign},${r*sign}`;
  for(const c of g.cells)c.units=1;
  for(const [q,r] of [[-3,3],[-3,2],[-3,1],[-1,1],[0,0]])g.cell(id(q,r)).owner=owner;
  g.cell(id(-3,1)).units=50;
  assert.equal(g.economy(owner).relayConnected,false);
  const a=chooseOrder(g,owner);assert.equal(a.to,id(-2,1));const route=g.path(g.cell(a.from),g.cell(a.to));assert.ok(route.every((c,i)=>!i||traversable(route[i-1],c)));
  g.start();g.send(a.from,a.to,a.fraction,owner);for(let i=0;i<44;i++)g.update(.05);
  assert.equal(g.economy(owner).relayConnected,true);
 }
 const g=new Battle();g.start();let usedHQ=false;for(let i=0;i<1200;i++){g.update(.05);usedHQ ||= g.drainEvents().some(e=>e.type==='send'&&e.owner==='blue'&&e.from==='2,-3');}assert.equal(usedHQ,true);
});

test('central mode has reproducible victory and defeat without altering starting state; reset restores economy',()=>{
 for(const idle of [false,true]){
  const g=new Battle();g.start();let next=5;
  for(let i=0;i<12000&&!g.result;i++){
   g.update(.05);if(!idle&&g.time>next){const a=chooseOrder(g,'orange');if(a)g.send(a.from,a.to,a.fraction<.65?.5:1);next=g.time+5;}
   g.drainEvents();
  }
  assert.equal(g.result,idle?'defeat':'victory');assert.ok(g.aiCommands>15);assert.ok(g.time>180&&g.time<360);console.log(`Central ${g.result}: ${g.time.toFixed(2)}s, ${g.commands} player / ${g.aiCommands} AI orders`);
  g.reset();assert.equal(g.economy('orange').rate,.54);assert.equal(g.economy('orange').relayBonus,0);assert.match(fieldInfo(g,g.cell('-2,3')),/2 verbundene Felder/);
 }
});


test('relay and isolated-field information follow the live supply network',()=>{
 const g=new Battle();for(const id of ['-3,3','-3,2','-3,1','-2,1','-1,1','0,0'])g.cell(id).owner='orange';
 assert.match(fieldInfo(g,g.cell('0,0')),/Verbunden.*20 %/);
 g.cell('-2,1').owner='blue';assert.match(fieldInfo(g,g.cell('0,0')),/Verbindung unterbrochen.*kein Produktionsbonus/);
 g.cell('-2,1').owner='orange';assert.match(fieldInfo(g,g.cell('0,0')),/Verbunden.*20 %/);
});
