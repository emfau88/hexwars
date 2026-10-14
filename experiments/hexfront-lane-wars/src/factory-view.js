import * as T from 'three';
import {factoryPosition,baseSign} from './match-layout.js';
import {SUPPLIED_TEAMS} from './team-material.js';
function shellGeometry(w,h,d){
 const radius=Math.min(w,h,d)*.13,shape=new T.Shape();
 shape.moveTo(-w/2+radius,-d/2);shape.lineTo(w/2-radius,-d/2);shape.quadraticCurveTo(w/2,-d/2,w/2,-d/2+radius);shape.lineTo(w/2,d/2-radius);shape.quadraticCurveTo(w/2,d/2,w/2-radius,d/2);shape.lineTo(-w/2+radius,d/2);shape.quadraticCurveTo(-w/2,d/2,-w/2,d/2-radius);shape.lineTo(-w/2,-d/2+radius);shape.quadraticCurveTo(-w/2,-d/2,-w/2+radius,-d/2);
 const geometry=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSize:Math.min(.035,h*.12),bevelThickness:Math.min(.035,h*.12),bevelSegments:2,steps:1,curveSegments:3});geometry.rotateX(-Math.PI/2);geometry.translate(0,-h/2,0);return geometry;
}
export function createFactories(scene) {
  const all={};
  for(const owner of ['orange','blue'])for(let slot=0;slot<4;slot++){
    const root=new T.Group(),position=factoryPosition(owner,slot);root.position.set(position.x,.06,position.z);root.rotation.y=owner==='orange'?0:Math.PI;
    const ceramic=new T.MeshStandardMaterial({color:0xe6e2d2,roughness:.72,metalness:.12});
    const team=new T.MeshStandardMaterial({color:SUPPLIED_TEAMS[owner],roughness:.65,metalness:.22});
    const dark=new T.MeshStandardMaterial({color:0x344541,roughness:.65,metalness:.28});
    const glow=new T.MeshStandardMaterial({color:0xbce7cc,emissive:0x80c4a1,emissiveIntensity:.5,roughness:.4});
    const box=(w,h,d,m,x,y,z)=>{const o=new T.Mesh(shellGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o;};
    box(1.85,.16,2.0,ceramic,0,.05,0);box(1.75,.13,1.85,team,0,.19,0);
    box(.3,1.0,1.65,ceramic,-.7,.7,.06);box(.3,1.0,1.65,ceramic,.7,.7,.06);
    box(1.25,1.0,.36,ceramic,0,.7,.7);box(1.3,.15,1.78,ceramic,0,1.2,0);
    const cap=box(1.45,.22,1.25,team,0,1.4,.12);cap.rotation.z=.035;
    box(1.12,.81,.04,dark,0,.65,-.77);
    const door=box(1.08,.74,.06,team,0,.65,-.81);box(1.16,.06,.1,glow,0,1.06,-.84);
    for(const x of [-.43,-.2,.03,.26,.49])box(.045,.04,.47,dark,x,1.535,.14);
    box(.26,.55,.32,team,.96,.45,.36);box(.28,.06,.36,ceramic,.96,.75,.36);
    const roofMark=new T.Mesh(new T.CylinderGeometry(.23,.23,.025,6),glow);roofMark.position.set(0,1.54,-.3);root.add(roofMark);
    root.visible=false;scene.add(root);all[owner+':'+slot]={root,door,roofMark,lastProduction:-10,owner,slot};
  }
  return all;
}
export function updateFactories(items,match){
  for(const item of Object.values(items)){
    const factory=match.players[item.owner].factories[item.slot];item.root.visible=!!factory;
    const open=Math.max(0,1-(match.time-item.lastProduction)/2);
    item.door.scale.y=1-open*.94;item.door.position.y=.65+open*.34;
    item.roofMark.material.emissiveIntensity=.35+open;
    item.roofMark.scale.x=factory?.type==='rail'?1.6:1;item.roofMark.scale.z=factory?.type==='mech'?1.5:1;
  }
}