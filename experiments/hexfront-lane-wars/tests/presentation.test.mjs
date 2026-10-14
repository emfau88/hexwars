import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PRESENTATIONS,createPresentation} from '../src/presentation.js';
import {routePoint,ROUTE_WORLD_LENGTH} from '../src/routes.js';

test('M1 combat rules, simulation and original test scenarios retain their frozen hashes',async()=>{
  const baseline=JSON.parse(await fs.readFile(new URL('../docs/core-baseline.json',import.meta.url),'utf8'));
  for(const [name,hash] of Object.entries(baseline)){const source=await fs.readFile(new URL(`../src/${name}`,import.meta.url));assert.equal(createHash('sha256').update(source).digest('hex'),hash,name);}
});
test('both longer routes have equal length, mirrored positions and uniform progress',()=>{
  assert.ok(ROUTE_WORLD_LENGTH>29&&ROUTE_WORLD_LENGTH<31);
  const segments=[];
  for(let i=0;i<=600;i++) {
    const p=i/20,a=routePoint(0,p,.6),b=routePoint(1,p,-.6);assert.ok(Math.abs(a.x+b.x)<1e-10);assert.ok(Math.abs(a.z-b.z)<1e-10);
    if(i){const now=routePoint(0,p),before=routePoint(0,p-.05);segments.push(Math.hypot(now.x-before.x,now.z-before.z));}
  }
  assert.ok(Math.max(...segments)/Math.min(...segments)<1.001);
});
test('all visual preparations finish identically under irregular and fixed frame slicing',()=>{
  for(const {id} of PRESENTATIONS) {
    const fixed=createPresentation(id),variable=createPresentation(id);
    for(const game of fixed.lanes)game.run();
    const frames=[.016,.047,.021,.009,.08,.027];let i=0;
    while(variable.lanes.some(g=>!g.result)&&i<10000){for(const game of variable.lanes){game.advance(frames[i%frames.length]);game.drainEvents();}i++;}
    assert.deepEqual(variable.lanes.map(g=>g.summary()),fixed.lanes.map(g=>g.summary()),id);
    assert.ok(fixed.lanes.every(g=>g.result),id);
  }
});
test('mirrored west/east encounter swaps winners and preserves time and damage',()=>{
  const {lanes}=createPresentation('encounter');for(const g of lanes)g.run();
  const [a,b]=lanes.map(g=>g.summary());assert.equal(a.time,b.time);assert.equal(a.result,'blue');assert.equal(b.result,'orange');assert.deepEqual(a.stats.orange,b.stats.blue);assert.deepEqual(a.stats.blue,b.stats.orange);
});
