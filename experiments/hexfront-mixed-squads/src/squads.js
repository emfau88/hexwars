import * as T from 'three';
import {GLTFLoader} from '../../hexfront-3d/vendor/loaders/GLTFLoader.js';
import {suppliedMaterial,SUPPLIED_TEAMS} from './supplied-assets.js';
import {countType,travelSeconds,troops} from './units.js';
import {HQ_RESERVE} from './economy.js';
import {MUZZLE,DEPLOY_SECONDS,hqPoint,hqLocal,hqYaw,parking,deploymentPoint} from './model-layout.js';
import {surfaceHeight} from './map.js';
import {transportEase,transportPose} from './transport.js';
export const MAX_REPRESENTATIVES=128;
export async function prepareMechs(s) {
  const gltf=await new GLTFLoader().loadAsync(new URL('../../hexfront-3d/public/assets/supplied/mech.glb',import.meta.url).href);
  const root=gltf.scene;root.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  const scale=.77/Math.max(size.y,.001),normalize=new T.Matrix4().makeScale(scale,scale,scale).multiply(new T.Matrix4().makeTranslation(-center.x,-box.min.y,-center.z));
  s.mechParts=[];const mats=new Map();
  root.traverse(o=>{
    if(!o.isMesh)return;
    if(!mats.has(o.material))mats.set(o.material,suppliedMaterial(o.material,'orange',true));
    const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld).applyMatrix4(normalize);
    const part=new T.InstancedMesh(geometry,mats.get(o.material),MAX_REPRESENTATIVES);part.count=0;part.setColorAt(0,new T.Color(0xffffff));
    part.instanceMatrix.setUsage(T.DynamicDrawUsage);part.frustumCulled=false;part.castShadow=part.receiveShadow=true;s.scene.add(part);s.mechParts.push(part);
  });
  s.mechDummy=new T.Object3D();s.lastRepresentatives=new Map();s.squadGhosts=[];s.hqRoutes=new Map();
}
function stationed(s,c,formation,owner,side,seconds) {
  const poses=[],fight=c.battle,from=fight?s.game.cell(fight.from):null;
  let vx=from?c.x-from.x:0,vz=from?c.z-from.z:owner==='blue'?-1:1,len=Math.hypot(vx,vz)||1;vx/=len;vz/=len;
  for(const type of ['drone','mech']) {
    if(!countType(formation,type))continue;
    if(c.hq&&!fight){
      const produced=s.game.factions[owner]?.produced[type]||0,surplus=countType(s.game.preview(c,'all',1,HQ_RESERVE),type);
      const leaving=s.hqLaunches?.some(l=>l.id===c.id&&l.unitType===type&&s.game.time-l.time<DEPLOY_SECONDS);
      if(!produced||!surplus||(produced===1&&leaving))continue;
      const park=parking(type),p=hqPoint(c,park.x,park.z),ground=surfaceHeight(s.game.cells,c,p.x,p.z);
      poses.push({...p,key:`cell:${c.id}:${side}:${owner}:${type}`,cellId:c.id,type,owner,ground,y:ground+(type==='drone'?.33:0),yaw:hqYaw(c),pitch:0,roll:0,scale:type==='drone'?.70:1,id:c.q*9+c.r,idle:true});continue;
    }
    const structure=c.hq||c.kind==='relay';
    const along=fight?(side==='attack'?(structure?-1.50:-.62):(structure?-.95:.42)):0,lateral=type==='drone'?-.38:.38;
    const x=c.x+vx*along+vz*lateral,z=c.z+vz*along-vx*lateral+(fight?0:c.hq?.92:c.kind==='relay'?.72:.32);
    const ground=surfaceHeight(s.game.cells,c,x,z),hover=type==='drone'?.33:0;
    const recoil=fight&&!s.reduced?Math.max(0,Math.sin(seconds*(type==='drone'?20:9)))*.024:0;
    poses.push({key:`cell:${c.id}:${side}:${owner}:${type}`,cellId:c.id,inCombat:!!fight,type,x:x-vx*recoil,z:z-vz*recoil,y:ground+hover+(type==='drone'&&!s.reduced?Math.sin(seconds*2.2+c.q)*.013:0),ground,owner,yaw:Math.atan2(side==='attack'?-vx:vx,side==='attack'?-vz:vz),pitch:0,roll:0,scale:type==='drone'?.70:1,id:poses.length+c.q*9+c.r,thrust:0,idle:true});
  }
  return poses;
}
export function combatPose(s,cell,from,type,owner,side){
  return stationed(s,{...cell,battle:{from}},troops(type==='drone'?1:0,type==='mech'?1:0),owner,side,s.visualTime/1000)[0];
}
export function weaponPoint(p){return new T.Vector3(...MUZZLE[p.type]).multiplyScalar(p.scale).applyEuler(new T.Euler(p.pitch||0,p.yaw,p.roll||0,'YXZ')).add(new T.Vector3(p.x,p.y,p.z));}
function hqRoute(s,hq,other){
  const key=hq.id+'|'+other.id;if(s.hqRoutes.has(key))return s.hqRoutes.get(key);
  const target=hqLocal(hq,other.x,other.z),side=target.x<0?-1:1;
  const local=[{x:0,z:-.82},{x:0,z:-1.03}];
  if(target.z>-.25){local.push({x:side*1.03,z:-.75});if(target.z>.35)local.push({x:side*1.06,z:.68});}
  local.push(target);const points=local.map(p=>{const v=hqPoint(hq,p.x,p.z);return new T.Vector3(v.x,0,v.z);});
  const curve=new T.CatmullRomCurve3(points,false,'centripetal');s.hqRoutes.set(key,curve);return curve;
}
export function formationPoses(s,seconds) {
  const poses=[];
  for(const c of s.game.cells) {
    poses.push(...stationed(s,c,c.troops,c.owner,'defend',seconds));
    if(c.battle)poses.push(...stationed(s,c,c.battle.troops,c.battle.owner,'attack',seconds));
  }
  const remainder=s.game.running&&!s.game.paused&&!s.game.result?(s.simulationRemainder||0):0;
  for(const o of s.game.orders)for(const type of ['drone','mech']) {
    if(!countType(o.troops,type))continue;
    const animated={...o,progress:o.blocked?0:Math.min(1,o.progress+remainder/travelSeconds(o.troops))};
    const p=transportPose(s.game,animated,seconds,s.reduced),mixed=countType(o.troops,'drone')&&countType(o.troops,'mech'),offset=mixed?(type==='drone'?-.25:.25):0;
    const a=s.game.cell(o.path[o.segment]),b=s.game.cell(o.path[o.segment+1]);
    if((a.hq&&o.segment===0)||(b.hq&&o.segment===o.path.length-2)){
      const outgoing=!!a.hq,curve=hqRoute(s,outgoing?a:b,outgoing?b:a),t=transportEase(animated.progress,true,true),point=curve.getPointAt(outgoing?t:1-t),tangent=curve.getTangentAt(outgoing?t:1-t).multiplyScalar(outgoing?1:-1);
      p.x=point.x;p.z=point.z;p.yaw=Math.atan2(-tangent.x,-tangent.z);p.pitch=p.roll=0;
      p.ground=surfaceHeight(s.game.cells,t<.5?a:b,p.x,p.z);p.y=p.ground+(type==='drone'?.33:0);
    }
    p.x+=Math.cos(p.yaw)*offset;p.z-=Math.sin(p.yaw)*offset;
    if(type==='mech') {
      const a=s.game.cell(o.path[o.segment]),b=s.game.cell(o.path[o.segment+1]);
      const t=transportEase(animated.progress,o.segment===0,o.segment===o.path.length-2);
      p.ground=surfaceHeight(s.game.cells,t<.5?a:b,p.x,p.z);p.y=p.ground;p.pitch=0;p.roll=0;
    }
    poses.push({...p,key:`order:${o.id}:${type}`,type,owner:o.owner,id:o.id,scale:type==='drone'?.70:1,idle:o.blocked});
  }
  s.hqLaunches=(s.hqLaunches||[]).filter(l=>s.game.time-l.time<DEPLOY_SECONDS);
  for(const l of s.hqLaunches){
    const c=s.game.cell(l.id),type=l.unitType;if(c.battle||c.owner!==l.owner||!countType(c.troops,type))continue;
    if(s.game.orders.some(o=>o.path[0]===c.id&&o.departedAt>=l.time&&countType(o.troops,type)))continue;
    const age=s.game.time-l.time,p=deploymentPoint(c,type,s.reduced?1:Math.max(0,(age-.12)/(DEPLOY_SECONDS-.12))),ground=surfaceHeight(s.game.cells,c,p.x,p.z);
    poses.push({...p,key:`launch:${c.id}:${l.time}:${type}`,cellId:c.id,type,owner:l.owner,ground,y:ground+(type==='drone'?.33:0),scale:type==='drone'?.70:1,pitch:0,roll:0,id:l.time,thrust:.5,idle:false,launch:true});
  }
  // Only the last visible representative of a defeated type disappears. Losses
  // within a still-existing formation are shown by its count and hit flashes.
  const live=new Map(poses.map(p=>[p.key,p]));
  for(const [key,p] of s.lastRepresentatives||[]) {
    const cell=s.game.cell(p.cellId),survived=cell?.owner===p.owner&&countType(cell.troops,p.type)>0;
    if(p.inCombat&&!live.has(key)&&!survived&&!s.reduced&&s.game.running)s.squadGhosts.push({...p,start:s.visualTime});
  }
  s.lastRepresentatives=live;
  s.squadGhosts=s.squadGhosts.filter(p=>s.visualTime-p.start<380).slice(-16);
  for(const p of s.squadGhosts){const t=(s.visualTime-p.start)/380;poses.push({...p,scale:p.scale*(1-t),roll:p.type==='mech'?t*.9:p.roll,ghost:true});}
  return poses;
}
export function drawMechs(s,poses) {
  const d=s.mechDummy,color=new T.Color();s.mechPoses=poses.slice(0,MAX_REPRESENTATIVES);
  s.mechPoses.forEach((p,i)=>{
    d.position.set(p.x,p.y,p.z);d.rotation.set(p.pitch||0,p.yaw,p.roll||0,'YXZ');d.scale.setScalar(p.scale??1);d.updateMatrix();
    for(const part of s.mechParts){part.setMatrixAt(i,d.matrix);part.setColorAt(i,color.setHex(SUPPLIED_TEAMS[p.owner]));}
  });
  for(const part of s.mechParts){part.count=s.mechPoses.length;part.instanceMatrix.needsUpdate=true;if(part.instanceColor)part.instanceColor.needsUpdate=true;part.castShadow=s.quality!=='low';}
}
