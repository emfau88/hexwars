import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraBasis,projectedBounds,frameBattlefield} from '../src/camera.js';
test('camera elevations are measured from horizontal, with orthonormal basis',()=>{
 for(const a of [55,60,70,80]){const b=cameraBasis(a);assert.ok(Math.abs(Math.asin(b.out[1])*180/Math.PI-a)<1e-9);for(const v of Object.values(b))assert.ok(Math.abs(Math.hypot(...v)-1)<1e-9);assert.ok(Math.abs(b.right.reduce((s,v,i)=>s+v*b.up[i],0))<1e-9);}
});
test('projected geometry including tall off-center objects fits every aspect ratio',()=>{
 const points=[-7,0,-7,7,0,-7,7,0,7,-7,0,7,5,5,-5];
 for(const a of [55,60,70,80])for(const [w,h] of [[1165,695],[390,457],[320,360],[430,555],[900,300]]){
  const b=projectedBounds(points,cameraBasis(a)),f=frameBattlefield(b,w,h);
  assert.ok((b.minU-f.centerU)*f.scale+w/2>=17.999);assert.ok((b.maxU-f.centerU)*f.scale+w/2<=w-17.999);
  assert.ok(h/2-(b.maxV-f.centerV)*f.scale>=17.999);assert.ok(h/2-(b.minV-f.centerV)*f.scale<=h-17.999);
 }
});
test('pan clamps at the actual cropped extent and resets on overview',()=>{
 const b={minU:-7,maxU:7,minV:-6,maxV:8};for(const zoom of [1,1.15,1.8,2.2]){const f=frameBattlefield(b,390,457,zoom,{u:999,v:-999});assert.equal(f.u,f.limitU);assert.equal(f.v,-f.limitV);if(zoom===1){assert.ok(Math.abs(f.u)<1e-9);assert.ok(Math.abs(f.v)<1e-9);}}
});
