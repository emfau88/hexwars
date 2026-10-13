import * as T from 'three';
import {STEP} from './map.js';
import {hqPose} from './hq-motion.js';
import {suppliedMaterial,setSuppliedTeam} from './supplied-assets.js';
const colours={orange:0xe89842,blue:0x629ebf,neutral:0x89a894};
const lights={orange:0xffbd70,blue:0x88d1ed,neutral:0x89a894};

function surfaceMaps(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d'),data=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const n=Math.sin(x*127.1+y*311.7)*43758.5453,v=249+(n-Math.floor(n))*6,k=(y*256+x)*4;
  data.data[k]=data.data[k+1]=data.data[k+2]=v;data.data[k+3]=255;
 }ctx.putImageData(data,0,0);const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}
export function buildCommandHQ(s,library,{supplied=false}={}){
 s.commandHQs=[];s.hqPendingResult=null;
 s.finishHQCapture=callback=>{
  if(s.reduced){callback();return;}
  const pending={due:s.visualTime+1050,callback,timer:null};s.hqPendingResult=pending;
  // A slow renderer must not hold the result dialog behind clamped visual time.
  pending.timer=setTimeout(()=>{if(s.hqPendingResult===pending){s.hqPendingResult=null;callback();}},1050);
 };
 const grain=surfaceMaps();const materials=new Map();
 library.traverse(o=>{if(!o.isMesh||materials.has(o.material.name))return;materials.set(o.material.name,o.material);
  if(['HQ_Ceramic','HQ_Team','HQ_Metal','HQ_Alloy'].includes(o.material.name)){o.material.map=grain;o.material.bumpMap=grain;o.material.bumpScale=.002;o.material.needsUpdate=true;}
 });
 for(const c of s.game.cells.filter(c=>c.hq)){
  const root=library.getObjectByName('CommandHQ').clone(true);root.position.set(c.x,c.height*STEP,c.z-.10);root.rotation.y=c.hq==='orange'?Math.PI:0;root.userData.pickCell=c.id;
  const mats=new Map();root.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;
   if(supplied){const n=o.material.name;if(!mats.has(n))mats.set(n,suppliedMaterial(o.material,c.owner));o.material=mats.get(n);o.userData.frontierAnimated=true;}
   else if(['HQ_Team','HQ_Lights','HQ_Core'].includes(o.material.name)){const n=o.material.name;if(!mats.has(n))mats.set(n,o.material.clone());o.material=mats.get(n);}
  });
  const parts={};for(const name of ['Radar_Pivot','Dish_Tilt','Hangar_Door']){
   const part=root.getObjectByName(name);if(!part)throw Error('Missing HQ articulation: '+name);
   parts[name]={part,rotation:part.rotation.clone(),position:part.position.clone()};part.traverse(o=>{if(o.isMesh)o.userData.frontierAnimated=true;});
  }
  s.static.add(root);s.contactAt(c.x,c.z,c.height*STEP,1.87,1.83);
  s.commandHQs.push({cell:c.id,root,mats,parts,owner:c.owner,previous:c.owner,scanTime:0,send:-Infinity,hit:-Infinity,capture:-Infinity,supplied});
 }
 updateCommandHQ(s,0);
}
export function commandHQEvent(s,e){
 const node=s.commandHQs?.find(n=>n.cell===(e.type==='send'?e.from:e.id));if(!node)return;
 if(e.type==='send')node.send=s.visualTime;
 if(e.type==='combat')node.hit=s.visualTime;
 if(e.type==='capture'){node.previous=e.previous;node.owner=e.owner;node.capture=s.visualTime;node.send=-Infinity;}
}
export function updateCommandHQ(s,delta){
 for(const n of s.commandHQs||[]){
  const c=s.game.cell(n.cell),running=s.game.running&&!s.game.paused&&!s.game.result;
  if(c.owner!==n.owner){n.owner=c.owner;n.previous=c.owner;n.capture=-Infinity;}
  if(running)n.scanTime+=delta/1000;
  const economy=s.game.economy(c.owner),producing=running&&economy.hqId===c.id&&!!s.game.factions[c.owner]?.active&&!s.game.factions[c.owner]?.productionPaused&&!c.battle;
  const pose=hqPose({seconds:n.scanTime,sendAge:(s.visualTime-n.send)/1000,hitAge:(s.visualTime-n.hit)/1000,captureAge:(s.visualTime-n.capture)/1000,producing,running,reduced:s.reduced});n.pose=pose;
  const owner=pose.useNewTeam?n.owner:n.previous;
  for(const [name,m] of n.mats){if(n.supplied){setSuppliedTeam(m,owner);m.emissiveIntensity=pose.intensity*2+pose.pulse;continue;}m.color.setHex(name==='HQ_Team'?colours[owner]:lights[owner]);if(name!=='HQ_Team'){m.emissive.setHex(lights[owner]);m.emissiveIntensity=pose.intensity+(name==='HQ_Core'?pose.pulse:0);}}
  for(const p of Object.values(n.parts)){p.part.position.copy(p.position);p.part.rotation.copy(p.rotation);}
  n.parts.Radar_Pivot.part.rotation.y+=pose.yaw+pose.reacquire;
  // Blender glTF stores the authored tilt as an X rotation; rotate locally.
  n.parts.Dish_Tilt.part.rotation.x+=pose.tilt;
  n.parts.Hangar_Door.part.position.y+=pose.door;
 }
 if(s.hqPendingResult&&s.visualTime>=s.hqPendingResult.due){const {callback,timer}=s.hqPendingResult;clearTimeout(timer);s.hqPendingResult=null;callback();}
}
export function resetCommandHQ(s){
 if(s.hqPendingResult)clearTimeout(s.hqPendingResult.timer);
 s.hqPendingResult=null;for(const n of s.commandHQs||[]){n.send=n.hit=n.capture=-Infinity;n.scanTime=0;}
}
