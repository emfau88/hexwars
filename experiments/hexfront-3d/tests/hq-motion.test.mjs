import test from 'node:test';
import assert from 'node:assert/strict';
import {hqPose,radarScan} from '../src/hq-motion.js';
test('radar has 16 second cycle, two holds, bounded 23 degree sweeps',()=>{
 assert.equal(radarScan(0),radarScan(16));assert.equal(radarScan(6),radarScan(8));assert.equal(radarScan(14),radarScan(15));
 for(let t=0;t<50;t+=.01)assert.ok(Math.abs(radarScan(t))<=.401);
 assert.ok(Math.abs(radarScan(5.999)-radarScan(6.001))<.001);
});
test('send and hit return to rest; capture extinguishes then switches faction',()=>{
 assert.equal(hqPose({seconds:0,sendAge:0}).door,0);assert.ok(hqPose({seconds:0,sendAge:.5}).door>.2);assert.equal(hqPose({seconds:0,sendAge:1}).door,0);
 assert.equal(hqPose({seconds:0,hitAge:1}).intensity,.20);
 assert.equal(hqPose({seconds:0,captureAge:.2}).intensity,0);assert.equal(hqPose({seconds:0,captureAge:.2}).useNewTeam,false);assert.equal(hqPose({seconds:0,captureAge:.5}).useNewTeam,true);
});
test('reduced motion suppresses motion and transients, production is conditional',()=>{
 const p=hqPose({seconds:4,sendAge:.4,hitAge:.15,captureAge:.5,reduced:true});assert.equal(p.door,0);assert.equal(p.yaw,0);assert.equal(p.tilt,0);assert.equal(p.pulse,0);assert.equal(p.reacquire,0);
 assert.equal(hqPose({seconds:2,producing:false}).intensity,.20);assert.ok(hqPose({seconds:2,producing:true}).intensity>.20);
});
