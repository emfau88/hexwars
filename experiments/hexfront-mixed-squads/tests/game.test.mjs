import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle,chooseOrder} from '../src/game.js';
import {UNIT,troops,cloneTroops,countTroops,countType,health,mergeTroops,takeTroops,applyDamage} from '../src/units.js';
import {ARMY_LIMIT,HQ_RESERVE} from '../src/economy.js';
import {createMap,neighbors,traversable} from '../src/map.js';
import {MISSIONS} from '../src/missions.js';
import {CAMPAIGN_KEY,createCampaignStore} from '../src/campaign.js';
const advance=(g,seconds)=>{for(let n=0;n<Math.round(seconds*20)&&!g.result;n++){g.update(.05);g.drainEvents();}};
function fixture(){const g=new Battle({ai:false});g.start();for(const f of Object.values(g.factions)){f.queue=[];f.repeat=false;}return g;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('all three existing maps retain every terrain and ownership attribute',()=>{
  for(const mission of MISSIONS){const g=new Battle({missionId:mission.id});const old=createMap(mission.id);
    assert.deepEqual(g.cells.map(({id,height,kind,owner,x,z})=>({id,height,kind,owner,x,z})),old.map(({id,height,kind,owner,x,z})=>({id,height,kind,owner,x,z})));
  }
});
test('injured formations split and merge without creating health or losing units',()=>{
  const a=troops(9,3),b=troops(2,1);applyDamage(a,31.7);applyDamage(b,9.3);
  const hp=health(a)+health(b),n=countTroops(a)+countTroops(b);mergeTroops(a,b);near(health(a),hp);assert.equal(countTroops(a),n);
  const half=takeTroops(a,'all',.5);near(health(a)+health(half),hp);assert.equal(countTroops(a)+countTroops(half),n);
  const rest=cloneTroops(a);mergeTroops(rest,half);near(health(rest),hp);assert.equal(countTroops(rest),n);
  applyDamage(rest,1e6);assert.equal(countTroops(rest),0);assert.equal(health(rest),0);
});
test('idle territory gives credits, not free robots; cuts remove its income',()=>{
  const g=fixture(),start=g.strength('orange'),f=g.factions.orange,rate=g.economy('orange').rate;advance(g,5);
  assert.equal(g.strength('orange'),start);near(f.credits,64+rate*5);
  g.cell('-2,2').owner='blue';g.cell('-1,2').owner='blue';assert.equal(g.economy('orange').connectedFields,0);assert.equal(g.economy('orange').rate,2);
});
test('queue spends once, finishes after build time, repeats and refunds cancellation exactly',()=>{
  const g=fixture(),f=g.factions.orange;f.credits=12;assert.ok(g.enqueue('drone').ok);f.repeat=true;g.update(.05);
  assert.equal(f.spent,12);assert.equal(f.produced.drone,0);advance(g,1.7);assert.equal(f.produced.drone,0);advance(g,.05);assert.equal(f.produced.drone,1);
  assert.deepEqual(f.queue,['drone']);f.credits=0;advance(g,.5);assert.equal(f.active,null);assert.equal(f.produced.drone,1);
  f.credits=40;f.queue=['mech'];g.update(.05);const credits=f.credits;g.paused=true;assert.ok(g.cancelProduction());near(f.credits,credits+40);assert.equal(g.cancelProduction(),false);
  assert.ok(g.enqueue('mech').ok,'planning while paused must work');
});
test('army cap defers paid completion and never deletes reinforcements',()=>{
  const g=fixture(),hq=g.cell('-2,3'),f=g.factions.orange;hq.troops=troops(ARMY_LIMIT);f.queue=['drone'];advance(g,4);assert.equal(f.active,null);
  hq.troops=troops(1);advance(g,.1);assert.ok(f.active);hq.troops=troops(ARMY_LIMIT+10);advance(g,3);assert.ok(f.active);assert.equal(hq.units,ARMY_LIMIT+10);
  hq.troops=troops(1);advance(g,.05);assert.equal(hq.units,2);assert.equal(f.active,null);
});
test('type selection, mixed speed and all-send conserve the army',()=>{
  const g=fixture(),a=g.cell('-2,3'),b=g.cell('-2,2');a.troops=troops(8,3);const total=g.strength('orange');
  const drone=g.send(a.id,b.id,1,'orange','drone');assert.equal(drone.order.seconds,UNIT.drone.travel);assert.equal(drone.order.units,8);assert.equal(countType(a.troops,'mech'),3);
  const mech=g.send(a.id,b.id,1,'orange','mech');assert.equal(mech.order.seconds,UNIT.mech.travel);assert.equal(a.units,0);assert.equal(g.strength('orange'),total);
  advance(g,2);assert.equal(g.strength('orange'),total);assert.equal(g.orders.length,0);
  const mixed=g.send(b.id,a.id,1);assert.equal(mixed.order.seconds,UNIT.mech.travel);
});
test('cliffs and invalid commands cannot remove units',()=>{
  const g=fixture(),before=g.snapshot();assert.equal(g.send('-1,2','0,1').ok,false);assert.equal(g.send('-2,3','-2,2',NaN).ok,false);assert.equal(g.send('-2,3','-2,2',1,'orange','tank').ok,false);assert.deepEqual(g.snapshot(),before);
});
test('combat takes time and supports reinforcements for attacker and defender',()=>{
  const g=fixture(),a=g.cell('-2,3'),b=g.cell('-3,3');a.troops=troops(10);b.owner='blue';b.troops=troops(10);
  const order=g.send(a.id,b.id).order;advance(g,1.1);assert.ok(b.battle);assert.equal(b.owner,'blue');
  const defenders=b.units;g.arrive({owner:'blue',troops:troops(3),units:3,kind:'command'},a,b);assert.equal(b.units,defenders+3);
  g.arrive({owner:'orange',troops:troops(20,2),units:22,kind:'command'},a,b);assert.ok(countType(b.battle.troops,'mech')===2);
  advance(g,10);assert.equal(b.owner,'orange');assert.equal(b.battle,null);assert.ok(b.units>0);
});
test('mutual destruction invents no survivor; engaged troops cannot leave',()=>{
  const g=fixture(),a=g.cell('-2,2'),b=neighbors(g.cells,a).find(c=>c.height===a.height&&c.kind==='field');
  b.owner='blue';b.troops=troops(4);g.arrive({owner:'orange',troops:troops(4),kind:'command'},a,b);
  assert.equal(g.send(b.id,a.id,1,'blue').ok,false);advance(g,20);assert.equal(b.units,0);assert.equal(b.battle,null);assert.equal(b.owner,'blue');
});
test('opposing arrivals on neutral defenders wait without losing or duplicating a formation',()=>{
  const g=fixture(),target=g.cells.find(c=>c.owner==='neutral'&&c.height===0&&neighbors(g.cells,c).filter(n=>traversable(n,c)).length>=2);
  const [a,b]=neighbors(g.cells,target).filter(n=>traversable(n,target));a.owner='orange';b.owner='blue';a.troops=troops(8);b.troops=troops(8);target.troops=troops(20);
  assert.ok(g.send(a.id,target.id,1,'orange').ok);assert.ok(g.send(b.id,target.id,1,'blue').ok);advance(g,1.1);
  assert.ok(target.battle);assert.ok(g.orders.some(o=>o.waiting));advance(g,20);assert.equal(g.orders.length,0);assert.equal(target.battle,null);
});
test('automatic supply leaves a HQ reserve and never accepts a hostile rally',()=>{
  const g=fixture();assert.equal(g.setRally('2,-3').ok,false);assert.ok(g.setRally('-2,2').ok);const before=g.strength('orange');advance(g,.1);
  assert.equal(g.cell('-2,3').units,HQ_RESERVE);assert.equal(g.orders[0].kind,'supply');advance(g,2);assert.equal(g.strength('orange'),before);
});
test('a captured supply target stops the convoy without attacking or dropping health',()=>{
  const g=fixture(),target=g.cell('-2,2');g.setRally(target.id);advance(g,.2);const total=g.strength('orange'),targetCount=target.units;
  target.owner='blue';advance(g,.1);assert.equal(target.battle,null);assert.equal(g.orders.length,0);assert.equal(g.strength('orange'),total-targetCount);
});
test('rerouting and disconnected waiting do not move supply across enemy terrain',()=>{
  const g=fixture();for(const id of ['-3,3','-3,2','-3,1'])g.cell(id).owner='orange';g.setRally('-3,1');advance(g,.05);
  const o=g.orders[0],middle=g.cell(o.path[1]),goal=g.cell('-3,1');middle.owner='blue';advance(g,.05);assert.ok(!g.orders.length||g.orders[0].blocked||g.orders[0].path.every(id=>g.cell(id).owner==='orange'));assert.equal(goal.battle,null);
  assert.ok(g.setRally('-1,2').ok);advance(g,5);assert.equal(g.cell('-1,2').owner,'orange');assert.equal(middle.battle,null);
});
test('pause freezes income, movement, combat and production; reset isolates snapshots',()=>{
  const g=new Battle();g.start();advance(g,8);g.paused=true;const snapshot=g.snapshot();advance(g,10);assert.deepEqual(g.snapshot(),snapshot);
  snapshot.cells[0].troops.drone[0].count=999;assert.notEqual(g.cells[0].units,999);g.reset();assert.deepEqual(g.snapshot(),new Battle().snapshot());
});
test('campaign saves never read or overwrite the original campaign key',()=>{
  assert.notEqual(CAMPAIGN_KEY,'hexfront.campaign.v1');const data=new Map([['hexfront.campaign.v1','original']]);
  const store=createCampaignStore(MISSIONS.map(m=>m.id),{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)});store.complete('morgenwacht');assert.equal(data.get('hexfront.campaign.v1'),'original');assert.ok(data.has(CAMPAIGN_KEY));
});

export function play(missionId,player=true,cadence=3.5) {
  const g=new Battle({missionId});g.start();let next=3,combatTicks=0;
  for(let n=0;n<18000&&!g.result;n++) {
    g.update(.05);if(g.cells.some(c=>c.battle))combatTicks++;
    if(player&&g.time>=next){g.manageAI('orange');next=g.time+cadence;}
    if(n%100===0)for(const owner of ['orange','blue']){
      const f=g.factions[owner];assert.ok(f.credits>=0);near(f.credits,64+f.earned-f.spent);
    }
    for(const o of g.orders)assert.ok(traversable(g.cell(o.path[o.segment]),g.cell(o.path[o.segment+1])));
    g.drainEvents();
  }
  return {g,combatTicks};
}
test('all three missions finish through ordinary commands, production and AI',()=>{
  for(const mission of MISSIONS){
    const {g,combatTicks}=play(mission.id,true,mission.id==='auenstrom'?4:3.5);console.log(`${mission.id}: ${g.result} at ${g.time.toFixed(1)}s; ${g.commands}/${g.aiCommands} commands`);
    assert.equal(g.result,'victory',mission.id);assert.ok(combatTicks>20);assert.ok(g.aiCommands>0);assert.ok(g.factions.blue.produced.mech>0);assert.ok(g.factions.orange.spent>64);
    const {g:idle}=play(mission.id,false);console.log(`${mission.id} idle: ${idle.result} at ${idle.time.toFixed(1)}s`);assert.equal(idle.result,'defeat',mission.id);
  }
});
