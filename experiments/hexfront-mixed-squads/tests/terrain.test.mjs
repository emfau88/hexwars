import test from 'node:test';
import assert from 'node:assert/strict';
import {createMap,corner,cornerHeight,terrainTriangles,surfaceHeight,STEP,neighbors,traversable,isRamp} from '../src/map.js';
import * as original from '../../hexfront-3d/src/map.js';
import {transportPose} from '../src/transport.js';

for(const mission of ['morgenwacht','windpass','auenstrom']){
 test(`${mission}: ordinary fields stay level, with unchanged routes and height tiers`,()=>{
  const cells=createMap(mission),base=original.createMap(mission);assert.deepEqual(cells,base);
  for(const c of cells){
   for(const n of neighbors(cells,c))assert.equal(traversable(c,n),original.traversable(c,n));
   if(c.kind==='ramp'||(mission==='auenstrom'&&c.kind==='relay'))continue;
   for(let i=0;i<6;i++){assert.equal(cornerHeight(cells,c,i),c.height*STEP);const p=corner(c,i);assert.equal(surfaceHeight(cells,c,p.x,p.z),c.height*STEP);}
   for(const triangle of terrainTriangles(cells,c))for(const p of triangle)assert.equal(p[1],c.height*STEP);
  }
 });
 test(`${mission}: every legal ascent joins seamlessly and moving drones follow the new surface`,()=>{
  const cells=createMap(mission),game={cells,missionId:mission,cell:id=>cells.find(c=>c.id===id),running:true};
  for(const a of cells)for(const b of neighbors(cells,a))if(isRamp(a,b)){
   const x=(a.x+b.x)/2,z=(a.z+b.z)/2;
   assert.ok(Math.abs(surfaceHeight(cells,a,x,z)-surfaceHeight(cells,b,x,z))<1e-8,`${a.id} → ${b.id}`);
   for(let i=0;i<6;i++){const p=corner(a,i);if(Math.hypot(p.x-x,p.z-z)<1)assert.ok(Math.abs(surfaceHeight(cells,a,p.x,p.z)-surfaceHeight(cells,b,p.x,p.z))<1e-8);}
   for(const progress of [.1,.3,.499,.501,.7,.9]){
    const p=transportPose(game,{id:1,path:[a.id,b.id],segment:0,progress,owner:a.owner},0,true);
    assert.ok(Math.abs(p.ground-surfaceHeight(cells,p.t<.5?a:b,p.x,p.z))<1e-8);
   }
  }
 });
}
test('river relay has a level landing and pick triangles agree with surface queries',()=>{
 const cells=createMap('auenstrom'),relay=cells.find(c=>c.kind==='relay');
 for(const x of [-.4,0,.4])for(const z of [-.4,0,.4])assert.ok(Math.abs(surfaceHeight(cells,relay,relay.x+x,relay.z+z)-relay.height*STEP)<1e-8);
 for(const c of cells)for(const tri of terrainTriangles(cells,c)){
  const average=axis=>tri.reduce((sum,p)=>sum+p[axis]/3,0);
  assert.ok(Math.abs(surfaceHeight(cells,c,average(0),average(2))-average(1))<1e-8);
 }
});
