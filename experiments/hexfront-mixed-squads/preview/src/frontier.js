import * as T from 'three';
import {GLTFLoader} from '../../../hexfront-3d/vendor/loaders/GLTFLoader.js';
import {mergeGeometries} from '../../../hexfront-3d/vendor/utils/BufferGeometryUtils.js';
import {STEP} from './map.js';
import {buildCommandHQ} from './command-hq.js';
import {loadSupplied,suppliedMaterial} from './supplied-assets.js';

export const TEAM={orange:0xe6a05c,blue:0x70b5cd,neutral:0x89a894};
export const MAX_DRONES=128;

function coating(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d'),data=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const k=(y*256+x)*4,h=Math.sin(x*127.1+y*311.7)*43758.5453,n=h-Math.floor(h);
  const v=244+n*7-(n>.995?19:0);data.data[k]=data.data[k+1]=data.data[k+2]=v;data.data[k+3]=255;
 }ctx.putImageData(data,0,0);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;return map;
}

function architecture(s,library,c,supplied=false){
 const relay=c.kind==='relay',root=library.getObjectByName(relay?'Seed':'Haven').clone(true);
 root.position.set(c.x,c.height*STEP,c.z-.10);root.rotation.y=relay?Math.PI/6:c.hq==='orange'?Math.PI:0;root.userData.pickCell=c.id;
 const mats=new Map(),moving=[];
 root.traverse(o=>{if(!o.isMesh)return;
  if(supplied){const name=o.material.name;if(!mats.has(name))mats.set(name,suppliedMaterial(o.material,c.owner));o.material=mats.get(name);o.userData.frontierAnimated=true;}
  else if(['Team','Optic'].includes(o.material.name)){
   const name=o.material.name;if(!mats.has(name))mats.set(name,o.material.clone());o.material=mats.get(name);
   o.material.color.setHex(TEAM[c.owner]);o.material.emissive.setHex(name==='Optic'?TEAM[c.owner]:0x000000);o.material.emissiveIntensity=c.owner==='neutral'?0:.20;
  }
  o.castShadow=o.receiveShadow=true;
 });
 for(const name of relay?(supplied?['Core','DishL','DishR']:['Core','Rotor']):['Scanner']){
  const part=root.getObjectByName(name);if(!part)throw Error(`Missing authored articulation: ${name}`);
  const base={position:part.position.clone(),rotation:part.rotation.clone()};moving.push({name,part,base});
  part.traverse(o=>{if(o.isMesh)o.userData.frontierAnimated=true;});
 }
 s.static.add(root);s.techStructures.push({cell:c.id,owner:c.owner,activation:-1000,root,mats,moving,supplied});
 s.contactAt(c.x,c.z,c.height*STEP,relay?1.62:2.02,relay?1.62:1.92);
}

function drones(s,library,supplied=false){
 const root=library.getObjectByName('PIP');root.updateMatrixWorld(true);
 if(supplied){const mats=new Map();root.traverse(o=>{if(!o.isMesh)return;const key=o.material;if(!mats.has(key))mats.set(key,suppliedMaterial(key,'orange',true));o.material=mats.get(key);});}
 // Tint optical emission per instance; white emission washed the small eye out.
 // This material belongs only to the drone, leaving architecture untouched.
 const optics=new Map();root.traverse(o=>{if(!o.isMesh||o.material.name!=='Optic')return;
  if(!optics.has(o.material)){
   const m=o.material.clone();m.metalness=.12;m.roughness=.26;m.emissiveIntensity=.34;
   m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
#ifdef USE_INSTANCING_COLOR
 totalEmissiveRadiance *= vColor;
#endif`);};
   m.customProgramCacheKey=()=> 'pip-coloured-optic-v1';optics.set(o.material,m);
  }o.material=optics.get(o.material);
 });
 const groups=new Map(),movingNames=new Set(['Sensor','FinL','FinR','Antenna']);
 s.dronePivots={};root.traverse(o=>{if(movingNames.has(o.name))s.dronePivots[o.name]=o.getWorldPosition(new T.Vector3());});
 root.traverse(o=>{
  if(!o.isMesh)return;let p=o.parent,joint='Body';while(p&&p!==root){if(movingNames.has(p.name)){joint=p.name;break;}p=p.parent;}
  const key=joint+'|'+o.material.name;if(!groups.has(key))groups.set(key,{joint,material:o.material,geos:[]});
  let geo=o.geometry.clone().applyMatrix4(o.matrixWorld);if(geo.index)geo=geo.toNonIndexed();
  // The coating uses UV0 only. Blender joins can retain a second unused UV set;
  // normalize attributes before combining the authored nacelles and shell.
  for(const name of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(name))geo.deleteAttribute(name);
  groups.get(key).geos.push(geo);
 });
 s.droneParts=[...groups.values()].map(({joint,material,geos})=>{
  const geometry=mergeGeometries(geos);if(!geometry)throw Error('PIP material batching failed');geos.forEach(g=>g.dispose());
  const inst=new T.InstancedMesh(geometry,material,MAX_DRONES);inst.count=0;inst.castShadow=inst.receiveShadow=true;inst.instanceMatrix.setUsage(T.DynamicDrawUsage);inst.frustumCulled=false;
  inst.userData.joint=joint;inst.userData.optic=material.name==='Optic';inst.userData.team=supplied||['Team','Optic'].includes(material.name);s.scene.add(inst);return inst;
 });
 s.droneTeam=s.droneParts.filter(p=>p.userData.team);
 s.droneJointMatrices={};for(const name of movingNames)if(s.dronePivots[name])s.droneJointMatrices[name]=new T.Matrix4();
 const glow=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.28,depthWrite:false,toneMapped:false});
 s.droneWake=new T.InstancedMesh(new T.ConeGeometry(.053,.16,8),glow,MAX_DRONES*2);s.droneWake.instanceMatrix.setUsage(T.DynamicDrawUsage);s.droneWake.frustumCulled=false;s.scene.add(s.droneWake);
 s.droneShadow=new T.InstancedMesh(new T.PlaneGeometry(1.0,.88).rotateX(-Math.PI/2),s.contact,MAX_DRONES);s.droneShadow.instanceMatrix.setUsage(T.DynamicDrawUsage);s.droneShadow.frustumCulled=false;s.scene.add(s.droneShadow);
 s.frontierStats={droneBatches:s.droneParts.length,droneTriangles:s.droneParts.reduce((n,p)=>n+p.geometry.attributes.position.count/3,0)};
}

export function prepareFrontier(s){
 s.techStructures=[];s.droneParts=[];s.droneTeam=[];s.droneDummy=new T.Object3D();s.droneGhosts=[];s.visualTime=0;s.visualLast=null;s.dronePoses=[];
 const useFallback=new URLSearchParams(location.search).get('assets')==='classic';
 const imported=useFallback?Promise.resolve(null):loadSupplied().catch(error=>{console.warn('Supplied assets unavailable; keeping the classic models.',error);return null;});
 return imported.then(assets=>assets?[assets,null,null]:Promise.all([null,new GLTFLoader().loadAsync(new URL('../../../hexfront-3d/public/assets/frontier/frontier.glb',import.meta.url).href),new GLTFLoader().loadAsync(new URL('../../../hexfront-3d/public/assets/command-hq/command-hq.glb',import.meta.url).href)])).then(([assets,gltf,hq])=>{
  const map=assets?null:coating(),seen=new Set();gltf?.scene.traverse(o=>{
   if(!o.isMesh||seen.has(o.material))return;seen.add(o.material);
   if(['Porcelain','Jade','Alloy','Graphite'].includes(o.material.name)){o.material.map=map;o.material.bumpMap=map;o.material.bumpScale=o.material.name==='Porcelain'?.007:.011;o.material.needsUpdate=true;}
  });
  for(const c of s.game.cells.filter(c=>c.kind==='relay'))architecture(s,assets?.relay||gltf.scene,c,!!assets);
  buildCommandHQ(s,assets?.hq||hq.scene,{supplied:!!assets});
  drones(s,assets?.drone||gltf.scene,!!assets);
  s.assetFamily=assets?'supplied':'classic';
  // Clones retain geometry/material references. Only the loaded scene container
  // is discarded; no per-frame geometry allocation or texture downloads.
 });
}

const pivot=new T.Matrix4(),inverse=new T.Matrix4(),rotation=new T.Matrix4();
export function articulateDrones(s,seconds,pose,index,rootMatrix){
 const quiet=s.reduced,phase=seconds*2.4+(pose.id||index)*1.71;
 const angles={Sensor:quiet?0:Math.sin(phase*.65)*.13,FinL:quiet?0:Math.sin(phase)*.075,FinR:quiet?0:-Math.sin(phase+.7)*.075,Antenna:quiet?0:Math.sin(phase*1.4)*.05};
 for(const [name,m] of Object.entries(s.droneJointMatrices)){
  const v=s.dronePivots[name];pivot.makeTranslation(v.x,v.y,v.z);inverse.makeTranslation(-v.x,-v.y,-v.z);
  if(name==='Sensor')rotation.makeRotationY(angles[name]);else rotation.makeRotationZ(angles[name]);
  m.copy(rootMatrix).multiply(pivot).multiply(rotation).multiply(inverse);
 }
 for(const part of s.droneParts)part.setMatrixAt(index,s.droneJointMatrices[part.userData.joint]||rootMatrix);
}
