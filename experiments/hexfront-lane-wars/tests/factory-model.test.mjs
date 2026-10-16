import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const folder=new URL('../public/models/factory-preview/',import.meta.url);
function read(name){const b=fs.readFileSync(new URL(name+'.glb',folder));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);return {b,j:JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)))};}
const base=read('factory'),modules=['drone','mech','rail'].map(role=>read('module-'+role));
test('factory approval assets are self-contained GLBs with embedded resources',()=>{
 for(const {j} of [base,...modules]){
  assert.equal(j.buffers.length,1);assert.equal(j.buffers[0].uri,undefined);
  for(const image of j.images||[]){assert.equal(image.uri,undefined);assert.ok(Number.isInteger(image.bufferView));}
  assert.ok(j.meshes.length>0);
 }
 assert.ok(fs.statSync(new URL('../art/factory-v1/factory-source.blend',import.meta.url)).size>100000);
});
test('four actual door assemblies have independent translation channels in one one-second clip',()=>{
 const j=base.j,clip=j.animations.find(a=>a.name==='Door_Open');
 assert.ok(clip);assert.equal(clip.channels.length,4);
 const targetIds=new Set(clip.channels.map(c=>c.target.node));assert.equal(targetIds.size,4);
 for(let i=1;i<=4;i++){
  const n=j.nodes.findIndex(n=>n.name==='Hangar_Segment_'+i);assert.ok(targetIds.has(n));
  assert.ok(j.nodes[n].children.some(child=>j.nodes[child].mesh!==undefined));
 }
 for(const c of clip.channels){
  assert.equal(c.target.path,'translation');
  const a=j.accessors[clip.samplers[c.sampler].input];assert.deepEqual(a.min,[0]);assert.deepEqual(a.max,[1]);
 }
});
test('factory and all visual modules support the same named team-colour variants and socket',()=>{
 assert.ok(base.j.nodes.some(n=>n.name==='Production_Socket'));
 for(const {j} of [base,...modules]){
  assert.deepEqual(j.extensions.KHR_materials_variants.variants.map(v=>v.name),['Orange','Blue']);
  const mapped=j.meshes.flatMap(m=>m.primitives).filter(p=>p.extensions?.KHR_materials_variants);
  assert.ok(mapped.length>0);
  for(const p of mapped)assert.equal(p.extensions.KHR_materials_variants.mappings.length,2);
 }
});
test('factory stays within the eight-instance geometry and payload budget',()=>{
 function tris(j){return j.meshes.flatMap(m=>m.primitives).reduce((sum,p)=>sum+j.accessors[p.indices].count/3,0);}
 assert.ok(tris(base.j)<20000);assert.ok(base.b.length<1024*1024);
 assert.ok(base.j.meshes.flatMap(m=>m.primitives).length<=16);
 for(const {j,b} of modules){assert.ok(tris(j)<3000);assert.ok(b.length<150000);}
 assert.ok((tris(base.j)+Math.max(...modules.map(({j})=>tris(j))))*8<160000);
});
test('exported geometry matches the clearance report and clears the mech and eight existing exit routes',()=>{
 const r=JSON.parse(fs.readFileSync(new URL('../docs/factory-model/qa/geometry.json',import.meta.url)));
 assert.equal(createHash('sha256').update(base.b).digest('hex'),r.factorySHA256);
 const mech=fs.readFileSync(new URL('../public/models/mech.glb',import.meta.url));
 assert.equal(createHash('sha256').update(mech).digest('hex'),r.mechSHA256);
 assert.equal(r.straightSamples,144);assert.equal(r.actualRouteSamples,240);
 assert.deepEqual(r.straightIntersections,[]);assert.deepEqual(r.actualRouteIntersections,[]);assert.deepEqual(r.stackIntersections,[]);assert.equal(r.doorMotionSamples,13);assert.deepEqual(r.doorMotionIntersections,[]);
 assert.ok(r.factoryBoundsBlenderXYZ.max[0]-r.factoryBoundsBlenderXYZ.min[0]<2.1);
});
