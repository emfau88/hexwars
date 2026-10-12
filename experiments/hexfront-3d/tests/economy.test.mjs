import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle} from '../src/game.js';
import {connectedTerritory,centralProduction,economyState,localProduction} from '../src/economy.js';
const advance=(g,seconds)=>{for(let i=0;i<Math.round(seconds*20);i++)g.update(.05);};
const central=()=>new Battle({economyMode:'hq-centralized'});
test('central formula counts fields without HQ, caps before relay and retains diminishing returns',()=>{
 assert.equal(centralProduction(0,false),.48);assert.equal(centralProduction(10,false),.78);assert.equal(centralProduction(12,false),.81);assert.equal(centralProduction(99,false),.95);assert.equal(centralProduction(99,true),1.14);
 const g=central(),e=economyState(g.cells,'orange');assert.equal(e.connectedFields,2);assert.equal(e.rate,.54);
});
test('normal conquest raises HQ rate, normal and relay garrisons do not grow',()=>{
 const g=central();g.start();const initial=g.cell('-2,3').units;g.cell('-3,3').owner='orange';assert.equal(g.economy('orange').rate,.57);
 const fields=g.cells.filter(c=>c.owner==='orange'&&!c.hq).map(c=>[c.id,c.units]);advance(g,2);assert.ok(Math.abs(g.cell('-2,3').units-initial-1.14)<1e-8);for(const [id,units] of fields)assert.equal(g.cell(id).units,units);
 g.cell('0,0').owner='orange';const units=g.cell('0,0').units;advance(g,2);assert.equal(g.cell('0,0').units,units);
});
test('connected relay grants 20%, loss/cut removes it, restoration reconnects without resetting garrisons',()=>{
 const g=central(),chain=['-3,3','-3,2','-3,1','-2,1','-1,1','0,0'];for(const id of chain)g.cell(id).owner='orange';
 const before=g.economy('orange');assert.equal(before.relayConnected,true);assert.ok(Math.abs(before.rate-centralProduction(before.connectedFields,false)*1.2)<1e-9);
 g.cell('-2,1').owner='blue';const cut=g.economy('orange');assert.equal(cut.relayConnected,false);assert.ok(cut.isolatedIds.includes('0,0'));assert.ok(cut.rate<before.rate);
 const relayUnits=g.cell('0,0').units;g.cell('-2,1').owner='orange';assert.deepEqual(g.economy('orange'),before);assert.equal(g.cell('0,0').units,relayUnits);
 g.cell('0,0').owner='blue';assert.equal(g.economy('orange').relayBonus,0);
});
test('supply never crosses steep height edges and both factions use identical production rules',()=>{
 const g=central();g.cell('0,1').owner='orange';assert.ok(!connectedTerritory(g.cells,'orange').has('0,1'));
 assert.equal(g.economy('orange').rate,g.economy('blue').rate);
 for(const c of g.cells)c.owner=c.hq||'neutral';g.cell('0,0').owner='orange';assert.equal(g.economy('orange').rate,.48);assert.equal(g.economy('orange').relayBonus,0);
});
test('cap stops only new production, reinforcements over cap survive, sending resumes growth, reset keeps mode',()=>{
 const g=central();g.start();g.cell('-2,3').units=98.95;advance(g,1);assert.equal(g.cell('-2,3').units,99);
 g.cell('-2,3').units=120;advance(g,1);assert.equal(g.cell('-2,3').units,120);
 assert.ok(g.send('-2,3','-2,2',.5).ok);advance(g,.5);assert.ok(g.cell('-2,3').units>60);g.reset();assert.equal(g.economyMode,'hq-centralized');assert.deepEqual(g.snapshot(),central().snapshot());
});
test('legacy-local reproduces previous per-field rates and the unconnected global 30% relay bonus',()=>{
 const g=new Battle({economyMode:'legacy-local'});g.start();g.cell('0,0').owner='orange';const before=g.cells.map(c=>({...c}));advance(g,1);
 for(const c of g.cells.filter(c=>c.owner==='orange'))assert.ok(Math.abs(c.units-before.find(b=>b.id===c.id).units-localProduction(c,'orange'))<1e-8);
 assert.equal(g.economy('orange').relayBonus,.30);assert.equal(g.economy('orange').relayConnected,false);
});
