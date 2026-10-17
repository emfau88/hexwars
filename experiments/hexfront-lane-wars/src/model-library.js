import * as T from 'three';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {suppliedMaterial,SUPPLIED_TEAMS} from './team-material.js';

function bevel(w,h,d) {
  const r=Math.min(w,h,d)*.15,s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
  const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,steps:1,curveSegments:3});g.rotateX(-Math.PI/2);return g;
}
function railPlaceholder(owner) {
  const root=new T.Group(),ceramic=new T.MeshStandardMaterial({color:0xece8d9,roughness:.66,metalness:.10}),team=new T.MeshStandardMaterial({color:SUPPLIED_TEAMS[owner],roughness:.62,metalness:.18}),dark=new T.MeshStandardMaterial({color:0x364746,roughness:.55,metalness:.55}),light=new T.MeshStandardMaterial({color:0xa9d5cf,emissive:0x6f9897,emissiveIntensity:.35});
  const box=(w,h,d,m,x,y,z)=>{const o=new T.Mesh(bevel(w,h,d),m);o.position.set(x,y,z);root.add(o);return o;};
  box(.6,.28,.66,ceramic,0,.44,.05);box(.47,.13,.54,team,0,.73,.06);
  for(const x of [-.38,.38])for(const z of [-.27,.34]) {const strut=box(.14,.36,.16,dark,x,.16,z);strut.rotation.z=-Math.sign(x)*.2;box(.22,.1,.36,ceramic,x*1.15,.055,z-.06);box(.18,.09,.16,team,x*1.15,.15,z-.06);}
  box(.38,.22,.47,dark,0,.85,-.03);box(.5,.14,.42,ceramic,0,1.04,.08);
  for(const x of [-.155,.155]) {box(.095,.11,1.04,dark,x,.93,-.51);box(.068,.09,.64,team,x,.97,-.36);box(.026,.024,.74,light,x,1.045,-.48);}
  box(.19,.11,.10,dark,0,.68,-.32);box(.11,.035,.03,light,0,.72,-.381);box(.025,.34,.025,dark,.24,1.1,.22);
  root.updateMatrixWorld(true);return root;
}
function partsOf(root,{width,height,owner,supplied=true}) {
  root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),scale=height?height/size.y:width/Math.max(size.x,size.z),groups=new Map();
  root.traverse(o=>{if(!o.isMesh)return;if(Array.isArray(o.material))throw Error('Expected single-material supplied mesh');
    if(!groups.has(o.material))groups.set(o.material,[]);
    let g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.translate(-center.x,-bounds.min.y,-center.z);g.scale(scale,scale,scale);if(g.index)g=g.toNonIndexed();for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);groups.get(o.material).push(g);
  });
  return [...groups].map(([source,geos])=>{const geometry=mergeGeometries(geos);geos.forEach(g=>g.dispose());return {geometry,material:supplied?suppliedMaterial(source,owner):source};});
}
// Keep immutable source bytes for mission switches; each view owns its parsed GPU resources.
const modelBytes=new Map();
async function modelData(name){
 const url=new URL('../public/models/'+name+'.glb',import.meta.url);
 if(!modelBytes.has(name))modelBytes.set(name,fetch(url).then(response=>{if(!response.ok)throw Error('Modell '+name+': HTTP '+response.status);return response.arrayBuffer();}).catch(error=>{modelBytes.delete(name);throw error;}));
 return modelBytes.get(name);
}
export async function loadModels({animatedMechs=true,animatedRails=true}={}) {
  const loader=new GLTFLoader(),entries=await Promise.all(['hoverbot','mech','hq',...(animatedMechs?['mech-animated/mech-rigged']:[]),...(animatedRails?['railgun-animated/railgun','railgun-animated/railgun-lod']:[])].map(async name=>[name,await loader.parseAsync(await modelData(name),new URL('../public/models/',import.meta.url).href)])),files=Object.fromEntries(entries),library={},metadata={};
  for(const [name,gltf] of entries){let meshes=0,skins=0,triangles=0;gltf.scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}if(o.isSkinnedMesh)skins++;});metadata[name]={meshes,skins,animations:gltf.animations.length,triangles};}
  const railLod=files['railgun-animated/railgun-lod'];const railRig=files['railgun-animated/railgun'];if(railRig){metadata.railAnimated=metadata['railgun-animated/railgun'];delete metadata['railgun-animated/railgun'];}
  const rig=files['mech-animated/mech-rigged'];if(rig){metadata.mechAnimated=metadata['mech-animated/mech-rigged'];delete metadata['mech-animated/mech-rigged'];}
  for(const owner of ['orange','blue']) {
    const rigParts=[];const shared=new Map();if(rig)rig.scene.traverse(o=>{if(o.isMesh){if(!shared.has(o.material))shared.set(o.material,o.material.name==='Supplied_Surface'?suppliedMaterial(o.material,owner):o.material.clone());rigParts.push({geometry:o.geometry,material:shared.get(o.material),node:o.name});}});
    const railParts=[],railShared=new Map();if(railRig)railRig.scene.traverse(o=>{if(o.isMesh){if(!railShared.has(o.material)){const m=o.material.clone();if(m.name==='Team')m.color.setHex(SUPPLIED_TEAMS[owner]);railShared.set(o.material,m);}railParts.push({geometry:o.geometry,material:railShared.get(o.material),node:o.name});}});
    library[owner]={drone:partsOf(files.hoverbot.scene,{width:1.08,owner}),mech:rig?rigParts:partsOf(files.mech.scene,{height:1.45,owner}),hq:partsOf(files.hq.scene,{width:4.3,owner}),rail:railRig?railParts:partsOf(railPlaceholder(owner),{height:1.3,owner,supplied:false})};
  }
  return {library,metadata,mechRig:rig,railRig,railLod};
}
export function makeBatches(scene,library,capacity=128) {
  const batches={};
  for(const owner of ['orange','blue'])for(const type of Object.keys(library[owner]).filter(type=>type!=='hq')) {
    const id=`${owner}-${type}`;batches[id]=library[owner][type].map(({geometry,material})=>{const mesh=new T.InstancedMesh(geometry,material,capacity);mesh.count=0;mesh.castShadow=mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.userData.batch=id;scene.add(mesh);return mesh;});
  }
  return batches;
}
export function addHQ(scene,parts,owner) {
  const root=new T.Group();root.position.set(0,.04,owner==='orange'?10.3:-10.3);root.rotation.y=owner==='orange'?0:Math.PI;
  for(const {geometry,material} of parts){const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
  scene.add(root);return root;
}
