import * as T from 'three';
import {prepareMechs,formationPoses,drawMechs,combatPose,weaponPoint} from './squads.js';
import {setSuppliedTeam} from './supplied-assets.js';
import {updateCommandHQ,commandHQEvent,resetCommandHQ} from './command-hq.js';
import {STEP,surfaceHeight} from './map.js';
import {structureClearance} from './transport.js';
import {TEAM,MAX_DRONES,prepareFrontier,articulateDrones} from './frontier.js';
export {TEAM,MAX_DRONES};
export const MAX_EFFECTS=24;
const clamp=T.MathUtils.clamp;
function mesh(parent,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
export function buildTechnology(s){s.technologyReady=Promise.all([prepareFrontier(s),prepareMechs(s)]);}

export function updateTechnology(s,time){
 const delta=s.visualLast===null?0:clamp(time-s.visualLast,0,80);s.visualLast=time;if(!s.game.paused)s.visualTime+=delta;const seconds=s.visualTime/1000;
 updateCommandHQ(s,s.game.paused?0:delta);
 for(const node of s.techStructures){
  const owner=s.game.cell(node.cell).owner;
  if(owner!==node.owner){node.owner=owner;node.activation=s.visualTime;for(const [name,mat] of node.mats){if(node.supplied){setSuppliedTeam(mat,owner);continue;}mat.color.setHex(TEAM[owner]);if(name==='Optic')mat.emissive.setHex(TEAM[owner]);}}
  const active=owner!=='neutral',pop=active&&!s.reduced?Math.max(0,1-(s.visualTime-node.activation)/700):0;
  for(const [name,mat] of node.mats)if(name==='Optic'||node.supplied)mat.emissiveIntensity=active?.16+pop*.27:0;
  for(const {name,part,base} of node.moving){
   part.position.copy(base.position);part.rotation.copy(base.rotation);
   if(!s.reduced){
    if(name==='Core'&&active){part.position.y+=Math.sin(seconds*1.8)*.018+Math.sin(pop*Math.PI)*.075;if(!node.supplied)part.rotation.y+=seconds*.25;}
    if((name==='DishL'||name==='DishR')&&active){part.rotation.y+=Math.sin(seconds*.32+(name==='DishL'?0:1.5))*.11;}
    if(name==='Rotor'&&active){part.rotation.y+=seconds*.15;part.rotation.z+=Math.sin(seconds*.8)*.045+pop*.10;}
    if(name==='Scanner'){part.rotation.y+=Math.sin(seconds*.55+node.root.position.x)*.22;part.rotation.z+=Math.sin(seconds*.82)*.06;}
   }
  }
 }
 const allPoses=formationPoses(s,seconds);drawMechs(s,allPoses.filter(p=>p.type==='mech'));
 const poses=allPoses.filter(p=>p.type==='drone').slice(0,MAX_DRONES);
 const d=s.droneDummy,col=new T.Color();let wake=0;s.dronePoses=poses;
 for(let i=0;i<poses.length;i++){
  const p=poses[i],scale=p.scale??1;d.position.set(p.x,p.y,p.z);d.rotation.set((p.pitch||0)+(s.reduced||p.idle?0:(p.thrust||0)*.065),p.yaw,p.roll||0,'YXZ');d.scale.setScalar(scale);d.updateMatrix();articulateDrones(s,seconds,p,i,d.matrix);for(const part of s.droneTeam)part.setColorAt(i,col.setHex(part.userData.optic?({orange:0xf28f24,blue:0x36b9ee,neutral:0x89a894}[p.owner]):TEAM[p.owner]));
  d.position.set(p.x,p.ground+.022,p.z);d.rotation.set(0,p.yaw,0);d.scale.setScalar(scale);d.updateMatrix();s.droneShadow.setMatrixAt(i,d.matrix);
  if(p.thrust&&!s.reduced&&s.quality==='high')for(const side of [-1,1]){
   const offset=new T.Vector3(side*.435,.07,.016).applyAxisAngle(new T.Vector3(0,1,0),p.yaw);d.position.set(p.x+offset.x,p.y+offset.y,p.z+offset.z);d.rotation.set(0,p.yaw,0);d.scale.set(scale,scale*(.3+p.thrust*.6),scale);d.updateMatrix();s.droneWake.setMatrixAt(wake,d.matrix);s.droneWake.setColorAt(wake++,col.setHex(TEAM[p.owner]));
  }
 }
 for(const part of [...s.droneParts,s.droneShadow]){part.count=poses.length;part.instanceMatrix.needsUpdate=true;}for(const part of s.droneTeam)if(part.instanceColor)part.instanceColor.needsUpdate=true;s.droneWake.count=wake;s.droneWake.instanceMatrix.needsUpdate=true;if(s.droneWake.instanceColor)s.droneWake.instanceColor.needsUpdate=true;
 updateEffects(s);
}
export function buildEffects(s){
 s.effectPool=[];const flashGeo=new T.IcosahedronGeometry(.16,1),boltGeo=new T.CylinderGeometry(.012,.020,1,6),chipGeo=new T.OctahedronGeometry(.035),hexGeo=new T.RingGeometry(.4,.435,6,1,-Math.PI/6).rotateX(-Math.PI/2);
 for(let i=0;i<MAX_EFFECTS;i++){
  const group=new T.Group();group.visible=false;s.scene.add(group);
  const mat=new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,toneMapped:false}),ringMat=mat.clone(),defMat=mat.clone();
  const flash=mesh(group,flashGeo,mat),muzzle=mesh(group,flashGeo,mat),bolt=mesh(group,boltGeo,mat),ring=mesh(group,hexGeo.clone(),ringMat),guard=mesh(group,hexGeo.clone(),defMat);
  const chips=new T.InstancedMesh(chipGeo,mat,10);chips.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(chips);
  group.traverse(o=>{o.castShadow=false;o.receiveShadow=false;});
  s.effectPool.push({group,mat,ringMat,defMat,flash,muzzle,bolt,ring,guard,chips,baseContour:hexGeo.attributes.position.array,active:false});
 }
}
export function technologyEffect(s,e){
 commandHQEvent(s,e);
 if(!['combat','capture','reinforce'].includes(e.type))return;
 const cell=s.game.cell(e.id);if(!cell)return;
 if(e.type==='combat'&&!e.returnFire)technologyEffect(s,{...e,owner:e.previous,previous:e.owner,returnFire:true});
 const type=e.returnFire?e.defenderType:e.attackerType,heavy=type==='mech';
 let origin=null,target=null;
 if(e.type==='combat'){
  const pose=combatPose(s,cell,e.from,type,e.owner,e.returnFire?'defend':'attack');
  const opponent=combatPose(s,cell,e.from,e.returnFire?e.attackerType:e.defenderType,e.previous,e.returnFire?'attack':'defend');
  origin=weaponPoint(pose);target=new T.Vector3(opponent.x,opponent.y+(opponent.type==='mech'?.38:.08),opponent.z);
 }
 const limit=s.quality==='low'?8:MAX_EFFECTS,pool=s.effectPool.slice(0,limit),fx=pool.find(f=>!f.active)||pool.reduce((a,b)=>a.start<b.start?a:b);
 const from=s.game.cell(e.from)||cell,dx=cell.x-from.x,dz=cell.z-from.z,length=Math.hypot(dx,dz)||1;
 Object.assign(fx,{active:true,start:s.visualTime,event:e,cell,duration:e.type==='capture'?(cell.hq?780:650):e.type==='reinforce'?240:360,heavy,origin,target,shooterType:type,dx:dx/length*(e.returnFire?-1:1),dz:dz/length*(e.returnFire?-1:1)});
 fx.group.visible=true;fx.mat.color.setHex(TEAM[e.owner]);fx.ringMat.color.setHex(TEAM[e.owner]);fx.defMat.color.setHex(TEAM[e.previous]||TEAM.neutral);

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
  f.bolt.visible=!quiet&&!!f.origin&&age<170;f.muzzle.visible=!quiet&&!!f.origin&&age<90;
  if(f.origin){
    const center=new T.Vector3(x,y,z),a=f.origin.clone().sub(center),b=f.target.clone().sub(center),dir=b.clone().sub(a),length=dir.length();
    f.muzzle.position.copy(a);f.muzzle.scale.setScalar(f.heavy?.25:.13);
    f.flash.position.copy(b);f.flash.scale.setScalar((f.heavy?.50:.28)*flash);f.flash.visible=age>100&&age<340;
    f.bolt.position.copy(a).lerp(b,attackPhase);f.bolt.quaternion.setFromUnitVectors(up,dir.normalize());f.bolt.scale.set(f.heavy?2.6:1,Math.min(.20,length*.22),f.heavy?2.6:1);
  }
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
export function clearTechnology(s){resetCommandHQ(s);for(const f of s.effectPool){f.active=false;f.group.visible=false;}s.droneGhosts=[];s.squadGhosts=[];s.lastRepresentatives=new Map();s.visualLast=null;for(const node of s.techStructures)node.activation=-1000;}
