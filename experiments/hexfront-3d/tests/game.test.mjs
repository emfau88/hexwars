import test from 'node:test';
import assert from 'node:assert/strict';
import {createMap,neighbors,traversable,graphDistance,RAMPS,edgeKey,STEP,surfaceHeight} from '../src/map.js';
import {Battle,defenseFactor,attackFactor,forecast,chooseOrder} from '../src/game.js';
const advance=(g,seconds)=>{for(let n=0;n<Math.round(seconds*20);n++)g.update(.05);};

test('one 37-cell level, three real tiers, two HQs, one relay; the legal graph is connected',()=>{
  const cells=createMap();assert.equal(cells.length,37);assert.equal(new Set(cells.map(c=>c.id)).size,37);assert.deepEqual([...new Set(cells.map(c=>c.height))].sort(),[0,1,2]);assert.equal(cells.filter(c=>c.hq).length,2);assert.equal(cells.filter(c=>c.kind==='relay').length,1);
  for(const c of cells)assert.ok(Number.isFinite(graphDistance(cells,cells[0],c)));
});
test('only the four explicit ramp edges cross heights; both players share the rule',()=>{
  const cells=createMap(),pass=new Set();let blocked=0;
  for(const c of cells)for(const n of neighbors(cells,c))if(c.height!==n.height){if(traversable(c,n))pass.add(edgeKey(c,n));else blocked++;}
  assert.deepEqual(pass,RAMPS);assert.ok(blocked>10);
});
test('ramp surfaces meet continuously at the midpoint of every movement edge',()=>{
  const cells=createMap();for(const edge of RAMPS){const [a,b]=edge.split('|').map(id=>cells.find(c=>c.id===id));const x=(a.x+b.x)/2,z=(a.z+b.z)/2;
    assert.ok(Math.abs(surfaceHeight(cells,a,x,z)-surfaceHeight(cells,b,x,z))<1e-6);
    assert.ok(Math.abs(surfaceHeight(cells,a,x,z)-(a.height+b.height)*STEP/2)<1e-6);
  }
});
test('an attempted command through a cliff is rejected without changing units',()=>{
  const g=new Battle();g.start();const before=g.cell('-1,2').units;assert.equal(g.send('-1,2','0,1').ok,false);assert.equal(g.cell('-1,2').units,before);assert.equal(g.orders.length,0);
});
test('movement paths use owned intermediates and reject enemy shortcuts',()=>{
  const g=new Battle();const a=g.cell('-2,3'),b=g.cell('-3,1');assert.equal(g.path(a,b),null);g.cell('-3,2').owner='orange';g.cell('-3,3').owner='orange';const p=g.path(a,b);assert.ok(p);for(let i=1;i<p.length;i++)assert.ok(traversable(p[i-1],p[i]));assert.ok(p.slice(0,-1).every(c=>c.owner==='orange'));
});
test('height/HQ defense uses the maximum once, downhill grants exactly 15 percent',()=>{
  const a={height:0},b={height:2,kind:'hq',units:10};assert.equal(defenseFactor(a,b),1.3);assert.equal(defenseFactor(b,{height:2,kind:'hq'}),1.2);assert.equal(attackFactor(b,a),1.15);assert.equal(forecast(a,b,13).effective,10);assert.equal(forecast(a,b,14).win,true);
});
test('all and half commands retain a garrison; no free or duplicate units',()=>{
  const g=new Battle();g.start();const a=g.cell('-2,3'),b=g.cell('-2,2'),sum=a.units+b.units;
  const result=g.send(a.id,b.id,1);assert.equal(result.ok,true);assert.equal(a.units,1);assert.equal(result.order.units+a.units+b.units,sum);assert.equal(g.send(a.id,b.id,1).ok,false);
});
test('a captured intermediate field intercepts a convoy instead of teleporting it',()=>{
  const g=new Battle();g.start();g.cell('-3,2').owner='orange';g.cell('-3,3').owner='orange';const out=g.send('-2,3','-3,1');assert.ok(out.ok);const middle=g.cell(out.order.path[1]);middle.owner='blue';middle.units=90;advance(g,2.1);assert.equal(g.orders.some(o=>o.id===out.order.id),false);assert.equal(g.cell('-3,1').owner,'neutral');
});
test('relay raises production by 30 percent, and pause freezes both AI and units',()=>{
  const a=new Battle(),b=new Battle();a.start();b.start();b.cell('0,0').owner='orange';const initial=a.cell('-2,3').units;advance(a,2);advance(b,2);assert.ok(Math.abs((b.cell('-2,3').units-initial)/(a.cell('-2,3').units-initial)-1.3)<1e-9);
  b.paused=true;const snap=b.snapshot();advance(b,30);assert.deepEqual(b.snapshot(),snap);
});
test('production cap never deletes reinforcements concentrated above 99',()=>{const g=new Battle();g.start();g.cell('-2,2').units=120;advance(g,1);assert.equal(g.cell('-2,2').units,120);});
function play(cadence){const g=new Battle();g.start();let next=5;const relays=new Set();for(let t=0;t<12000&&!g.result;t++){
  g.update(.05);relays.add(g.cell('0,0').owner);
  for(const o of g.orders)for(let i=1;i<o.path.length;i++)assert.ok(traversable(g.cell(o.path[i-1]),g.cell(o.path[i])));
  for(const c of g.cells)assert.ok(c.units>=0&&Number.isFinite(c.units));
  if(cadence&&g.time>next){const a=chooseOrder(g,'orange');if(a)g.send(a.from,a.to,a.fraction<.65?.5:1);next=g.time+cadence;}
}return {g,relays};}
test('a complete human-paced half/all strategy wins without rewriting the starting state',()=>{const {g,relays}=play(5);assert.equal(g.result,'victory');assert.equal(g.cell('2,-3').owner,'orange');assert.ok(g.time>=150&&g.time<=360,`Duration ${g.time}`);assert.ok(g.aiCommands>15);assert.ok(relays.has('orange'));console.log(`Victory ${g.time.toFixed(1)}s / ${g.commands} commands / ${g.aiCommands} AI orders`);const snap=g.snapshot();advance(g,10);assert.deepEqual(g.snapshot(),snap);});
test('the opponent independently takes the player HQ; restart resets the entire match',()=>{const {g,relays}=play(0);assert.equal(g.result,'defeat');assert.equal(g.cell('-2,3').owner,'blue');assert.ok(relays.has('blue'));console.log(`Idle defeat ${g.time.toFixed(1)}s / ${g.aiCommands} AI orders`);g.reset();assert.deepEqual(g.snapshot(),new Battle().snapshot());});
