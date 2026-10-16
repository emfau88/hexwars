import * as T from 'three';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {factoryPosition,exitPose} from './match-layout.js';
import {missionRoute} from './missions.js';
import {routePoint} from './routes.js';

// Cache bytes, not GPU objects: each mission view owns and disposes its resources.
const bytes=new Map(),systems=new WeakMap();
async function asset(name){
 const url=new URL('../public/models/factory-preview/'+name+'.glb',import.meta.url);
 if(!bytes.has(name))bytes.set(name,fetch(url).then(r=>{if(!r.ok)throw Error('Fabrikmodell '+name+': HTTP '+r.status);return r.arrayBuffer();}).catch(e=>{bytes.delete(name);throw e;}));
 return new GLTFLoader().parseAsync(await bytes.get(name),new URL('.',url).href);
}
const roles=['drone','mech','rail'];
const clamp=x=>T.MathUtils.clamp(x,0,1);

export async function createFactories(scene,mission=null){
 const assets=await Promise.all(['factory',...roles.map(r=>'module-'+r)].map(asset));
 const items={},group=new T.Group(),materials=new Map();group.name='Factory_instances';scene.add(group);
 const system={group,materials,batches:[],signature:null,mission};systems.set(items,system);
 system.material=(source,owner,ghost)=>{
  const key=source.uuid+':'+(source.name==='Team'?owner:'neutral')+':'+ghost;
  if(!materials.has(key)){
   const m=source.clone();if(source.name==='Team')m.color.setHex(owner==='orange'?0xf49a43:0x469dce);
   m.transparent=ghost;m.opacity=ghost?.34:1;m.depthWrite=!ghost;materials.set(key,m);
  }
  return materials.get(key);
 };
 for(const owner of ['orange','blue'])for(let slot=0;slot<(mission?.slots||4);slot++){
  const root=assets[0].scene.clone(true),position=factoryPosition(owner,slot,mission);
  root.position.set(position.x,.06,position.z);root.rotation.y=owner==='orange'?0:Math.PI;
  const socket=root.getObjectByName('Production_Socket'),modules={};
  for(const [i,role] of roles.entries()){modules[role]=assets[i+1].scene.clone(true);socket.add(modules[role]);}
  const mixer=new T.AnimationMixer(root),action=mixer.clipAction(assets[0].animations[0]);action.play();action.paused=true;
  root.traverse(o=>{if(o.isMesh){o.userData.sourceMaterial=o.material;o.layers.set(2);o.castShadow=o.receiveShadow=true;}});
  root.visible=false;scene.add(root);
  items[owner+':'+slot]={root,modules,mixer,action,duration:assets[0].animations[0].duration,owner,slot,lastProduction:-10,heldAt:-10,open:0,ghost:false,type:null,asset:'factory.glb'};
 }
 // Clones retain the textures and geometries; source material objects are no longer used.
 for(const gltf of assets)gltf.scene.traverse(o=>{if(o.isMesh) o.material.dispose();});
 return items;
}
function rebuild(items,system){
 for(const b of system.batches)b.mesh.dispose();system.batches=[];system.group.clear();
 const grouped=new Map();
 for(const item of Object.values(items))item.root.traverseVisible(o=>{
  if(!o.isMesh)return;
  const material=system.material(o.userData.sourceMaterial,item.owner,item.ghost);o.material=material;
  const key=o.geometry.uuid+':'+material.uuid;
  if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(o);
 });
 for(const nodes of grouped.values()){
  const mesh=new T.InstancedMesh(nodes[0].geometry,nodes[0].material,nodes.length);
  mesh.name='Factory_batch';mesh.castShadow=!mesh.material.transparent;mesh.receiveShadow=true;mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);system.group.add(mesh);system.batches.push({mesh,nodes});
 }
}
export function updateFactories(items,match){
 const system=systems.get(items);if(!system)return;
 const time=match.time+Math.max(0,match.remainder||0),waveStart=(match.wave-1)*match.rules.wave;
 const occupants=[...match.lanes.flatMap((g,lane)=>g.units.map(u=>missionRoute(match.mission,lane,u.p,u.x)||routePoint(lane,u.p,u.x))),...match.transit.map(u=>exitPose(u,time))];
 for(const item of Object.values(items)){
  const player=match.players[item.owner],factory=player.factories[item.slot],pending=item.owner==='orange'?player.pending[item.slot]:null;
  const ghost=!factory&&!!pending,type=(factory||pending)?.type||null;
  item.ghost=ghost;item.type=type;item.root.visible=!!factory||ghost;
  item.root.userData.state=ghost?'planned':pending?'refit':'active';
  if(factory&&!item.wasBuilt)item.activatedAt=time;item.wasBuilt=!!factory;
  // The module settles on completion; never squash the gate around a newly spawned mech.
  for(const [role,module] of Object.entries(item.modules)){
   module.visible=role===type;module.scale.y=ghost?1:Math.min(1,.85+Math.max(0,time-(item.activatedAt??time))*.3);
  }
  const upcoming=match.phase==='running'?clamp(1-match.nextWave):0;
  const recent=factory&&match.wave>0?clamp(3-(time-Math.max(waveStart,item.lastProduction))):0;
  // Visual safety only: no collision, targeting or simulation timing is changed.
  const occupied=item.root.visible&&occupants.some(p=>{
   const forward=(item.root.position.z-p.z)*(item.owner==='orange'?1:-1);
   return Math.abs(p.x-item.root.position.x)<1.65&&forward>-.15&&forward<2.25;
  });
  if(occupied)item.heldAt=time;
  item.open=ghost?upcoming:Math.max(upcoming,recent,clamp(1-(time-item.heldAt)));
  item.action.time=item.open*item.duration;item.mixer.update(0);
 }
 const signature=JSON.stringify(Object.values(items).map(f=>[f.root.visible,f.ghost,f.type]));
 if(signature!==system.signature){rebuild(items,system);system.signature=signature;}
 for(const item of Object.values(items))item.root.updateMatrixWorld(true);
 for(const {mesh,nodes} of system.batches){nodes.forEach((o,i)=>mesh.setMatrixAt(i,o.matrixWorld));mesh.instanceMatrix.needsUpdate=true;}
}
export function disposeFactories(items){
 const system=systems.get(items);if(!system)return;
 for(const b of system.batches)b.mesh.dispose();
 for(const material of system.materials.values())material.dispose();
 for(const f of Object.values(items)){f.mixer.stopAllAction();f.mixer.uncacheRoot(f.root);}
 systems.delete(items);
}
export function factoryDiagnostics(items){
 const system=systems.get(items);
 return {asset:'factory.glb',batches:system?.batches.length||0,instances:Object.values(items).filter(f=>f.root.visible).length};
}
