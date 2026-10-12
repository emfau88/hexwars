import * as T from 'three';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {STEP,surfaceHeight} from './map.js';
import {TRANSPORT_SECONDS_PER_HEX} from './game.js';
import {transportPose,structureClearance} from './transport.js';

export const TEAM={orange:0xd99b57,blue:0x74b1c6,neutral:0x718079};
export const MAX_DRONES=64,MAX_EFFECTS=24;
const mix=T.MathUtils.lerp,clamp=T.MathUtils.clamp;
const hex=r=>Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3)*r,Math.sin(i*Math.PI/3)*r]);
const cutRect=(w,d,c)=>[[-w/2+c,-d/2],[w/2-c,-d/2],[w/2,-d/2+c],[w/2,d/2-c],[w/2-c,d/2],[-w/2+c,d/2],[-w/2,d/2-c],[-w/2,-d/2+c]];
// Authored profile lofts: changing section widths, offsets and bevel shoulders
// define armour, rather than stacking unmodified boxes/cylinders.
function loft(outline,levels){
 const vertices=[],uv=[];const point=(i,l)=>{const [y,scale,dx=0,dz=0]=levels[l],p=outline[i];return [p[0]*scale+dx,y,p[1]*scale+dz];};
 const tri=(a,b,c)=>{for(const p of [a,b,c]){vertices.push(...p);uv.push(p[0]*.7+p[1]*.2,p[2]*.7+p[1]*.3);}};
 for(let l=0;l<levels.length-1;l++)for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length,a=point(i,l),b=point(i,l+1),c=point(j,l+1),d=point(j,l);tri(a,b,c);tri(a,c,d);}
 const last=levels.length-1,top=levels[last],bottom=levels[0];
 for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;tri([top[2]||0,top[0],top[3]||0],point(j,last),point(i,last));tri([bottom[2]||0,bottom[0],bottom[3]||0],point(i,0),point(j,0));}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
function mesh(parent,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
function plate(parent,mat,outline,h,x=0,y=0,z=0){return mesh(parent,loft(outline,[[0,.91],[.018,1],[h-.018,1],[h,.86]]),mat,x,y,z);}
function strip(g,m,w,d,x,y,z){return plate(g,m,cutRect(w,d,Math.min(w,d)*.22),.025,x,y,z);}
function materials(s){
 const weather=s.materials.steel.map;
 const std=(color,roughness,metalness,extra={})=>new T.MeshStandardMaterial({color,map:weather,roughness,metalness,...extra});
 return {armour:std(0xa7b7b0,.57,.48),chassis:std(0x283d40,.68,.55),edge:std(0x667d7c,.42,.70),ivory:std(0xd3d4c2,.73,.18),
  lens:std(0x132d32,.20,.65),ceramic:std(0x4f645e,.8,.22),
  orange:std(TEAM.orange,.44,.35,{emissive:TEAM.orange,emissiveIntensity:.26}),blue:std(TEAM.blue,.44,.35,{emissive:TEAM.blue,emissiveIntensity:.26}),
  neutral:std(0xa1b1a5,.52,.45)};
}
function architecture(s,c,relay=false){
 const m=s.techMaterials,g=new T.Group();g.position.set(c.x,c.height*STEP,c.z-.10);g.rotation.y=relay?Math.PI/6:c.hq==='blue'?Math.PI:0;g.userData.pickCell=c.id;s.static.add(g);
 const r=relay?.69:.88;
 plate(g,s.materials.concrete,hex(r+.06),.10,0,.005,0);
 plate(g,m.chassis,hex(r),.16,0,.11,0);
 plate(g,m.edge,hex(r*.88),.06,0,.27,0);
 // Three swept structural fins leave open service cavities around a central
 // technical core. HQ has a split armour crown; relay has a suspended spindle.
 const pylon=[[-.19,-.28],[.19,-.28],[.24,.17],[.11,.34],[-.11,.34],[-.24,.17]];
 for(let i=0;i<3;i++){
  const arm=new T.Group();arm.rotation.y=i*Math.PI*2/3;g.add(arm);
  const tall=relay?1.02:.78,span=relay?.37:.48;
  mesh(arm,loft(pylon,[[.23,1.18,0,span],[.43,1.15,0,span],[tall,.64,0,span*.78],[tall+.06,.54,0,span*.72]]),m.armour);
  plate(arm,m.chassis,cutRect(.24,.26,.055),.075,0,tall+.03,span*.75);
  strip(arm,m.ivory,.22,.08,0,tall+.108,span*.76);
  for(let j=0;j<3;j++)strip(arm,m.chassis,.19,.028,0,.37+j*.072,span+.29);
  // Separate sloping outer cheek and exposed dark strut; readable at 70°.
  mesh(arm,loft([[-.12,-.16],[.12,-.16],[.16,.19],[-.16,.19]],[[.30,1,0,span+.03],[.38,1,0,span+.04],[.64,.75,0,span+.04]]),m.ceramic);
  if(!relay){
   strip(arm,m.edge,.30,.11,0,.84,span*.68);
   const comm=mesh(arm,loft(cutRect(.13,.27,.03),[[0,1],[.20,.60,0,-.03],[.24,.50,0,-.045]]),m.edge,.18,.82,span*.45);comm.rotation.z=.12;
  }
 }
 plate(g,m.chassis,hex(relay?.25:.40),relay?.76:.62,0,.30,0);
 if(!relay){
  // A deep longitudinal core slot between two bevelled shield petals, not a
  // conventional roof, turret or historical bunker cupola.
  const petal=[[-.07,-.42],[.23,-.34],[.35,-.05],[.27,.33],[-.07,.40]];
  for(const sign of [-1,1]){
   const p=petal.map(([x,z])=>[sign*x,z]);if(sign<0)p.reverse();
   mesh(g,loft(p,[[.81,1],[.91,1.05],[1.16,.85,0,-.055],[1.20,.68,0,-.07]]),m.ivory,sign*.15,0,0);
   strip(g,m.edge,.07,.30,sign*.30,1.21,-.065);
   for(const z of [-.28,.15]){plate(g,m.chassis,hex(.035),.016,sign*.24,1.215,z);plate(g,m.edge,hex(.021),.020,sign*.24,1.23,z);}
   strip(g,m.ceramic,.022,.34,sign*.40,1.12,-.025);
   for(let j=0;j<4;j++)strip(g,m.edge,.11,.025,sign*.62,.60,-.05+j*.057);
  }
  plate(g,m.lens,hex(.19),.095,0,1.02,-.06);
  for(const z of [-.25,.13])strip(g,m.armour,.13,.05,0,1.20,z);
 }else{
  plate(g,m.edge,hex(.35),.055,0,.43,0);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const p=mesh(g,loft(cutRect(.10,.18,.025),[[0,1],[.44,.85],[.52,.50]]),m.ivory,Math.sin(a)*.38,.89,Math.cos(a)*.38);p.rotation.y=a;p.rotation.z=.10;}
 }
 const accents=new T.Group();accents.userData.pickCell=c.id;accents.position.copy(g.position);accents.rotation.copy(g.rotation);s.scene.add(accents);
 const mat=m[c.owner].clone();mat.emissive=new T.Color(TEAM[c.owner]);mat.emissiveIntensity=relay&&c.owner==='neutral'?0:.28;
 for(let i=0;i<3;i++){
  const a=i*Math.PI*2/3,o=strip(accents,mat,relay?.15:.22,.075,Math.sin(a)*r*.65,relay?1.13:.91,Math.cos(a)*r*.65);o.rotation.y=a;
 }
 let spindle;
 if(relay){
  spindle=mesh(accents,loft(hex(.19),[[0,.25],[.18,1],[.48,.8],[.62,.20]]),mat,0,.76,0);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const rim=strip(accents,m.edge,.18,.065,Math.sin(a)*.28,1.10,Math.cos(a)*.28);rim.rotation.y=a;}
 }
 else strip(accents,mat,.045,.57,0,1.17,-.03);
 s.techStructures.push({cell:c.id,mat,spindle,owner:c.owner,activation:-1000,accents});
 s.contactAt(c.x,c.z,c.height*STEP,relay?1.75:2.12,relay?1.75:2.02);
}
export function buildTechnology(s){s.techMaterials=materials(s);s.techStructures=[];for(const c of s.game.cells.filter(c=>c.hq))architecture(s,c);architecture(s,s.game.cell('0,0'),true);}

function droneModel(m){
 const g=new T.Group(),hull=[[-.15,-.52],[.15,-.52],[.29,-.22],[.25,.33],[.13,.43],[-.13,.43],[-.25,.33],[-.29,-.22]];
 mesh(g,loft(hull,[[0,.70],[.05,1],[.17,.88,0,.01],[.24,.50,0,.04]]),m.chassis);
 const shoulder=[[-.055,-.36],[.14,-.42],[.27,-.22],[.29,.20],[.12,.36],[-.03,.25]];
 for(const sign of [-1,1]){
  const p=shoulder.map(([x,z])=>[x*sign,z]);if(sign<0)p.reverse();
  mesh(g,loft(p,[[.05,.8],[.10,1],[.22,.82,0,.025],[.25,.62,0,.04]]),m.armour,sign*.20,0,0);
  strip(g,m.edge,.045,.24,sign*.33,.256,.075);
  plate(g,m.chassis,cutRect(.16,.21,.04),.10,sign*.30,.015,.33);
  plate(g,m.lens,cutRect(.10,.10,.025),.025,sign*.30,.035,.425);
  strip(g,m.team,.14,.055,sign*.30,.16,.407);
 }
 const spine=[[-.07,-.38],[.07,-.38],[.14,-.13],[.11,.20],[-.11,.20],[-.14,-.13]];
 mesh(g,loft(spine,[[.17,1],[.25,.84],[.29,.52,0,.04]]),m.ivory);
 plate(g,m.lens,cutRect(.21,.11,.025),.035,0,.15,-.445);
 strip(g,m.team,.13,.035,0,.194,-.467);
 strip(g,m.team,.055,.19,0,.292,.06);
 for(const x of [-.10,.10])strip(g,m.edge,.023,.16,x,.24,-.06);
 return g;
}
function batchModel(g){
 g.updateMatrixWorld(true);const buckets=new Map();g.traverse(o=>{if(!o.isMesh)return;const id=o.material.uuid;if(!buckets.has(id))buckets.set(id,{mat:o.material,geos:[]});const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);buckets.get(id).geos.push(geo.index?geo.toNonIndexed():geo);o.geometry.dispose();});
 return [...buckets.values()].map(b=>{const geometry=mergeGeometries(b.geos);for(const geo of b.geos)geo.dispose();return {geometry,material:b.mat};});
}
export function buildDrones(s){
 const m=s.techMaterials,team=new T.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:.35,roughness:.5,metalness:.30});
 s.droneParts=batchModel(droneModel({...m,team})).map(p=>{const inst=new T.InstancedMesh(p.geometry,p.material,MAX_DRONES);inst.count=0;inst.castShadow=inst.receiveShadow=true;inst.instanceMatrix.setUsage(T.DynamicDrawUsage);inst.frustumCulled=false;s.scene.add(inst);return inst;});
 s.droneTeam=s.droneParts.find(p=>p.material===team);s.droneDummy=new T.Object3D();s.droneGhosts=[];s.visualTime=0;s.visualLast=null;s.dronePoses=[];
 const glowMaterial=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false,toneMapped:false});
 s.droneWake=new T.InstancedMesh(new T.ConeGeometry(.085,.34,8).rotateX(Math.PI/2),glowMaterial,MAX_DRONES*2);s.droneWake.instanceMatrix.setUsage(T.DynamicDrawUsage);s.droneWake.frustumCulled=false;s.scene.add(s.droneWake);
 s.droneShadow=new T.InstancedMesh(new T.PlaneGeometry(.93,1.06).rotateX(-Math.PI/2),s.contact,MAX_DRONES);s.droneShadow.instanceMatrix.setUsage(T.DynamicDrawUsage);s.droneShadow.frustumCulled=false;s.scene.add(s.droneShadow);
}
export function updateTechnology(s,time){
 const delta=s.visualLast===null?0:clamp(time-s.visualLast,0,80);s.visualLast=time;if(!s.game.paused)s.visualTime+=delta;const seconds=s.visualTime/1000;
 for(const node of s.techStructures){
  const owner=s.game.cell(node.cell).owner;if(owner!==node.owner){node.owner=owner;node.activation=s.visualTime;node.mat.color.setHex(owner==='neutral'?0xa1b1a5:TEAM[owner]);node.mat.emissive.setHex(TEAM[owner]);}
  const active=owner!=='neutral';node.mat.emissiveIntensity=active?.26:0;
  if(active&&!s.reduced&&s.quality==='high')node.mat.emissiveIntensity+=Math.max(0,1-(s.visualTime-node.activation)/700)*.45;
  if(node.spindle){node.spindle.rotation.y=active&&!s.reduced?seconds*.18:0;node.spindle.position.y=.76+(active&&!s.reduced?Math.sin(seconds*1.4)*.018:0);}
 }
 s.droneGhosts=s.droneGhosts.filter(g=>s.visualTime-g.start<g.duration);
 const remainder=s.game.running&&!s.game.paused&&!s.game.result?(s.simulationRemainder||0):0;
 const poses=s.game.orders.slice(0,MAX_DRONES).map(o=>({...transportPose(s.game,{...o,progress:Math.min(1,o.progress+remainder/TRANSPORT_SECONDS_PER_HEX)},seconds,s.reduced),owner:o.owner,id:o.id,scale:1}));
 for(const g of s.droneGhosts){if(poses.length===MAX_DRONES)break;const t=(s.visualTime-g.start)/g.duration;poses.push({...g.pose,scale:Math.max(.02,1-t*t),owner:g.owner,thrust:.2});}
 // Garrison badges represent stationary forces. Models are reserved for actions.
 const d=s.droneDummy,col=new T.Color();let wake=0;s.dronePoses=poses;
 for(let i=0;i<poses.length;i++){
  const p=poses[i],scale=p.scale??1;d.position.set(p.x,p.y,p.z);d.rotation.set(p.pitch||0,p.yaw,p.roll||0,'YXZ');d.scale.setScalar(scale);d.updateMatrix();for(const part of s.droneParts)part.setMatrixAt(i,d.matrix);s.droneTeam.setColorAt(i,col.setHex(TEAM[p.owner]));
  d.position.set(p.x,p.ground+.022,p.z);d.rotation.set(0,p.yaw,0);d.scale.setScalar(scale);d.updateMatrix();s.droneShadow.setMatrixAt(i,d.matrix);
  if(p.thrust&&!s.reduced&&s.quality==='high')for(const side of [-1,1]){
   const offset=new T.Vector3(side*.30,.07,.50+.05*p.thrust).applyAxisAngle(new T.Vector3(0,1,0),p.yaw);d.position.set(p.x+offset.x,p.y+offset.y,p.z+offset.z);d.rotation.set(0,p.yaw,0);d.scale.set(scale*.65,scale*.55,scale*(.25+p.thrust*.65));d.updateMatrix();s.droneWake.setMatrixAt(wake,d.matrix);s.droneWake.setColorAt(wake++,col.setHex(TEAM[p.owner]));
  }
 }
 for(const part of [...s.droneParts,s.droneShadow]){part.count=poses.length;part.instanceMatrix.needsUpdate=true;}s.droneTeam.instanceColor&&(s.droneTeam.instanceColor.needsUpdate=true);s.droneWake.count=wake;s.droneWake.instanceMatrix.needsUpdate=true;if(s.droneWake.instanceColor)s.droneWake.instanceColor.needsUpdate=true;
 updateEffects(s);
}
export function buildEffects(s){
 s.effectPool=[];const flashGeo=new T.IcosahedronGeometry(.16,1),boltGeo=new T.CylinderGeometry(.012,.020,1,6),chipGeo=new T.OctahedronGeometry(.035),hexGeo=new T.RingGeometry(.4,.435,6,1,-Math.PI/6).rotateX(-Math.PI/2);
 for(let i=0;i<MAX_EFFECTS;i++){
  const group=new T.Group();group.visible=false;s.scene.add(group);
  const mat=new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,toneMapped:false}),ringMat=mat.clone(),defMat=mat.clone();
  const flash=mesh(group,flashGeo,mat),bolt=mesh(group,boltGeo,mat),ring=mesh(group,hexGeo.clone(),ringMat),guard=mesh(group,hexGeo.clone(),defMat);
  const chips=new T.InstancedMesh(chipGeo,mat,10);chips.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(chips);
  group.traverse(o=>{o.castShadow=false;o.receiveShadow=false;});
  s.effectPool.push({group,mat,ringMat,defMat,flash,bolt,ring,guard,chips,baseContour:hexGeo.attributes.position.array,active:false});
 }
}
export function technologyEffect(s,e){
 const cell=s.game.cell(e.id);if(!cell)return;
 const limit=s.quality==='low'?8:MAX_EFFECTS,pool=s.effectPool.slice(0,limit),fx=pool.find(f=>!f.active)||pool.reduce((a,b)=>a.start<b.start?a:b);
 const from=s.game.cell(e.from)||cell,dx=cell.x-from.x,dz=cell.z-from.z,length=Math.hypot(dx,dz)||1;
 Object.assign(fx,{active:true,start:s.visualTime,event:e,cell,duration:e.type==='capture'?(cell.hq?780:650):e.type==='reinforce'?240:360,dx:dx/length,dz:dz/length});
 fx.group.visible=true;fx.mat.color.setHex(TEAM[e.owner]);fx.ringMat.color.setHex(TEAM[e.owner]);fx.defMat.color.setHex(TEAM[e.previous]||TEAM.neutral);
 if(e.from&&!s.reduced){s.droneGhosts.push({start:s.visualTime,duration:e.type==='combat'?320:220,lost:e.type==='combat',owner:e.owner,pose:{x:cell.x,z:cell.z,y:cell.height*STEP+structureClearance(s.game,cell.x,cell.z,cell.height*STEP)+.34,ground:cell.height*STEP,yaw:Math.atan2(-dx,-dz),pitch:0,roll:0}});if(s.droneGhosts.length>MAX_EFFECTS)s.droneGhosts.shift();}
}
function updateEffects(s){
 const dummy=s.droneDummy,up=new T.Vector3(0,1,0);
 for(let i=0;i<s.effectPool.length;i++){
  const f=s.effectPool[i];if(!f.active)continue;const age=s.visualTime-f.start,t=age/f.duration;
  if(t>=1||(s.quality==='low'&&i>=8)){f.active=false;f.group.visible=false;continue;}
  const {cell,event:e}=f,capture=e.type==='capture',reinforce=e.type==='reinforce',quiet=s.reduced,x=cell.x,z=cell.z,y=cell.height*STEP+.09,roof=structureClearance(s.game,x,z,cell.height*STEP);
  f.group.position.set(x,y,z);f.mat.opacity=quiet?.15:(1-t)*.75;f.ringMat.opacity=(1-t)*(quiet?.18:.7);f.defMat.opacity=(1-t)*.48;
  const attackPhase=clamp(age/140,0,1),flash=quiet?.5:Math.sin(clamp((age-65)/230,0,1)*Math.PI);
  f.flash.visible=!reinforce&&age<340;f.flash.position.set(f.dx*.12,roof+.28,f.dz*.12);f.flash.scale.setScalar(.45+flash*(cell.hq?2.3:1.3));
  f.bolt.visible=!quiet&&!reinforce&&age<170;
  const a=new T.Vector3(-f.dx*.72,roof+.39,-f.dz*.72),b=new T.Vector3(f.dx*.13,roof+.22,f.dz*.13),dir=b.clone().sub(a);f.bolt.position.copy(a.lerp(b,attackPhase*.5+.3));f.bolt.quaternion.setFromUnitVectors(up,dir.clone().normalize());f.bolt.scale.set(1,dir.length()*(.22+.45*(1-attackPhase)),1);
  f.ring.visible=capture||reinforce;const r=quiet?(cell.hq?2.3:1):capture?(cell.hq?2+t*.55:.60+t*1.30):.5+t*.70;
  f.guard.visible=!capture&&!reinforce;
  // Fixed-size pooled buffers follow the real slope; no clipping on ramps.
  for(const [o,scale] of [[f.ring,r],[f.guard,quiet?1:1.1+Math.sin(t*Math.PI)*.28]]){
   const p=o.geometry.attributes.position;
   for(let k=0;k<p.count;k++){const px=f.baseContour[k*3]*scale,pz=f.baseContour[k*3+2]*scale;p.setXYZ(k,px,surfaceHeight(s.game.cells,cell,x+px,z+pz)-y+.045,pz);}p.needsUpdate=true;o.geometry.computeBoundingSphere();
  }
  const count=quiet||s.quality==='low'||reinforce?0:capture?6:10;f.chips.count=count;
  for(let k=0;k<count;k++){const a=k*2.399,r=(.15+t*.70)*(capture?.9:1),px=Math.cos(a)*r,pz=Math.sin(a)*r;dummy.position.set(px,surfaceHeight(s.game.cells,cell,x+px,z+pz)-y+roof+.18+Math.sin(t*Math.PI)*(.16+(k%3)*.075),pz);dummy.rotation.set(t*5,k,t*4);dummy.scale.setScalar((1-t)*(k%3===0?1.6:1));dummy.updateMatrix();f.chips.setMatrixAt(k,dummy.matrix);}if(count)f.chips.instanceMatrix.needsUpdate=true;
 }
}
export function clearTechnology(s){for(const f of s.effectPool){f.active=false;f.group.visible=false;}s.droneGhosts=[];s.visualLast=null;for(const node of s.techStructures)node.activation=-1000;}
