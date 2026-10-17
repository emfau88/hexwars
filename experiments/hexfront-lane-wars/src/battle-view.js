import {createMechShot,sampleMechShot} from './weapon-effects.js';
import {railAudio} from './rail-audio.js';
import * as T from 'three';
import {railMuzzles,createRailCharge,writeRailCharge,finishRailCharge,createRailShot,sampleRailShot} from './rail-effects.js';
import {RailAnimator} from './rail-animation.js';
import {MechAnimator} from './mech-animation.js';
import {UNITS} from './rules.js';
import {CAMERA_VIEWS,cameraBasis,projectedBounds,frameBattlefield} from './camera.js';
import {routePoint,groundHeight} from './routes.js';
import {buildLandscape} from './landscape-view.js';
import {loadModels,makeBatches,addHQ} from './model-library.js';
import {SUPPLIED_TEAMS} from './team-material.js';

const key=(lane,id)=>`${lane}:${id}`;
const visualPoint=(u,height=0)=>{const p=routePoint(u.lane,u.p,u.x);return new T.Vector3(p.x,groundHeight(p.x,p.z)+height,p.z);};
const shortest=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

export class BattleView {
  constructor(stage,labels,onSelect,options={}) {
    this.audio=railAudio;this.corpses=new Map();this.options=options;this.specs=options.specs||UNITS;
    this.stage=stage;this.labels=labels;this.onSelect=onSelect;this.poses=new Map();this.health=new Map();this.effects=[];this.selected=null;this.zoom=1;this.pan={u:0,v:0};this.mode='diorama';this.elapsed=0;this.pickIds={};this.lastLanes=[];
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene=new T.Scene();this.scene.background=new T.Color(0xadb699);this.scene.fog=new T.Fog(0xadb699,65,130);
    this.camera=new T.OrthographicCamera(-20,20,15,-15,.1,180);
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-label','HEXFRONT: '+(options.single?'eine zentrale Front':'zwei Wege')+', orangefarbenes HQ unten, blaues HQ oben. Roboter anklicken zum Untersuchen.');stage.append(this.renderer.domElement);
    this.scene.add(new T.HemisphereLight(0xe4eff3,0x858575,2.0));
    const sun=new T.DirectionalLight(0xffefdb,2.65);sun.position.set(-12,24,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-21,right:21,top:21,bottom:-21,near:1,far:65});sun.shadow.bias=-.00025;sun.shadow.normalBias=.018;sun.shadow.radius=3;this.scene.add(sun);
    const fill=new T.DirectionalLight(0xd6e3e8,.48);fill.position.set(9,8,-12);this.scene.add(fill);
    this.dummy=new T.Object3D();this.raycaster=new T.Raycaster();
    this.selection=new T.Mesh(new T.RingGeometry(.57,.60,48),new T.MeshBasicMaterial({color:0xf4d493,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false}));this.selection.rotation.x=-Math.PI/2;this.selection.visible=false;this.scene.add(this.selection);
    this.ready=Promise.all([buildLandscape(this.scene,options.single,options.slots),loadModels({animatedMechs:options.animatedMechs!==false,animatedRails:options.animatedRails!==false})]).then(([,models])=>{this.mechRig=models.mechRig;this.railRig=models.railRig;this.railLod=models.railLod;this.railLowParts={};this.railLod?.scene.traverse(o=>{if(o.isMesh)this.railLowParts[o.name]=o.geometry;});this.library=models.library;this.assetMetadata=models.metadata;this.batches=makeBatches(this.scene,this.library);this.createRailLights(128);this.hqs=['orange','blue'].map(owner=>addHQ(this.scene,this.library[owner].hq,owner));this.resize();});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(stage);this.bind();this.resize();
  }
  createRailLights(capacity){
    for(const mesh of Object.values(this.railLights||{})){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();mesh.dispose();}
    this.railLights={};if(!this.railRig)return;for(const owner of ['orange','blue']){const mesh=createRailCharge(capacity);mesh.count=0;mesh.frustumCulled=false;this.railLights[owner]=mesh;this.scene.add(mesh);}
  }
  railElevation(position,target){return target?Math.atan2(target.y+.65-position.y-1.055,Math.max(.5,Math.hypot(target.x-position.x,target.z-position.z))):0;}
  dispose(){this.observer.disconnect();this.reset();const geometries=new Set(),materials=new Set(),textures=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());for(const g of Object.values(this.railLowParts||{}))g.dispose();for(const parts of Object.values(this.library||{}))for(const p of parts.rail||[])p.geometry.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
  point(u,height=0) {return visualPoint(u,height);}
  heading(u,lane,game) {
    const p=this.point({...u,lane}),target=game.units.find(v=>v.id===u.target);
    const destination=target?this.point({...target,lane}):this.point({...u,lane,p:u.p+(u.owner==='orange'?1:-1)});
    return Math.atan2(p.x-destination.x,p.z-destination.z);
  }
  mechAim(position,yaw,target) {
    return target?shortest(yaw,Math.atan2(position.x-target.x,position.z-target.z)):0;
  }
  mechWeaponAim(position,target) {
    // Converge the offset gun with the weapon arm; retain the torso silhouette and combat gap.
    return target?Math.atan2(.65,Math.max(.6,Math.hypot(target.x-position.x,target.z-position.z))):0;
  }
  resize() {
    this.dirty=true;
    this.stage.parentElement.dataset.closeup=String(this.zoom>1.35);
    const w=this.stage.clientWidth,h=this.stage.clientHeight;if(!w||!h)return;
    const basis=cameraBasis(CAMERA_VIEWS[this.mode],0),points=[];
    const halfWidth=this.fitHalfWidth??(this.options.single?10:16);
    for(const x of [-halfWidth,halfWidth])for(const z of [-12.4,12.4])for(const y of [0,2.3])points.push(x,y,z);
    const bounds=projectedBounds(points,basis),top=this.safeTop??(w<700?134:90),bottom=this.safeBottom??(w<700?148:142);
    const frame=frameBattlefield(bounds,w,Math.max(150,h-top-bottom),this.zoom,this.pan,8);this.pan={u:frame.u,v:frame.v};this.frame=frame;
    const centerU=frame.centerU,centerV=frame.centerV+(top-bottom)/(2*frame.scale);
    const target=new T.Vector3(...basis.right).multiplyScalar(centerU).addScaledVector(new T.Vector3(...basis.up),centerV);
    this.camera.position.copy(target).addScaledVector(new T.Vector3(...basis.out),60);this.camera.up.set(...basis.up);this.camera.lookAt(target);
    Object.assign(this.camera,{left:-w/(2*frame.scale),right:w/(2*frame.scale),top:h/(2*frame.scale),bottom:-h/(2*frame.scale)});this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.camera.updateMatrixWorld();
  }
  setCamera(mode) {this.mode=mode;this.resize();}
  zoomBy(factor) {this.zoom=T.MathUtils.clamp(this.zoom*factor,1,3.2);this.resize();}
  home() {this.zoom=1;this.pan={u:0,v:0};this.resize();}
  focusSelected() {const pose=this.poses.get(this.selected);if(!pose)return;const b=cameraBasis(CAMERA_VIEWS[this.mode],0);this.zoom=3.2;this.pan={u:pose.position.x,v:pose.position.dot(new T.Vector3(...b.up))};this.resize();}
  bind() {
    let drag=null;
    this.stage.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,u:this.pan.u,v:this.pan.v,moved:false};this.stage.setPointerCapture(e.pointerId);});
    this.stage.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;if(drag.moved){this.pan={u:drag.u-dx/this.frame.scale,v:drag.v+dy/this.frame.scale};this.resize();}});
    this.stage.addEventListener('pointerup',e=>{if(drag&&!drag.moved)this.pick(e);drag=null;});
    this.stage.addEventListener('pointercancel',()=>{drag=null;});
    this.stage.addEventListener('wheel',e=>{e.preventDefault();this.zoomBy(Math.exp(-e.deltaY*.001));},{passive:false});
  }
  pick(e) {
    if(!this.batches)return;const rect=this.stage.getBoundingClientRect();this.raycaster.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),this.camera);
    const selectable=Object.values(this.batches).flat();
    // Instance transforms and LOD geometry move after the first render; refresh pick bounds on demand.
    for(const mesh of selectable)mesh.computeBoundingSphere();
    const hit=this.raycaster.intersectObjects(selectable,false)[0];this.selected=hit?this.pickIds[hit.object.userData.batch]?.[hit.instanceId]??null:null;this.dirty=true;this.onSelect(this.selected);
  }
  reset() {this.audio.stopAll();this.dirty=true;for(const e of this.effects)this.disposeEffect(e);this.effects=[];for(const p of [...this.poses.values(),...this.corpses.values()])p.animator?.dispose();this.corpses.clear();this.poses.clear();for(const label of this.health.values())label.remove();this.health.clear();this.selected=null;this.onSelect(null);}
  disposeEffect(e) {e.root.removeFromParent();e.root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
  line(from,to,color,width=.025) {
    const delta=to.clone().sub(from),mesh=new T.Mesh(new T.CylinderGeometry(width,width,delta.length(),5),new T.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false}));mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return mesh;
  }
  effect(event,lane) {
    const source=this.poses.get(key(lane,event.source??event.id));
    if(event.kind==='shot') {
      if(source){source.kick=1;source.animator?.shot();}
      const root=new T.Group(),base=this.point({...event.from,lane}),to=this.point({...event.to,lane},.65),yaw=Math.atan2(base.x-to.x,base.z-to.z);
      const muzzleLocal=event.type==='mech'?new T.Vector3(.58,.72,-.54):event.type==='rail'?new T.Vector3(0,.91,-.96):new T.Vector3(0,.50,-.35);
      const from=base.clone().add(muzzleLocal.applyAxisAngle(new T.Vector3(0,1,0),yaw)),color=event.owner==='orange'?0xf6cb83:0xb8d9df;
      if(source?.animator){source.animator.sample(0,0,!!(source.unit.moving||source.unit.departing),this.mechAim(source.position,source.yaw,to),source.unit.type==='rail'?this.railElevation(source.position,to.clone().add(new T.Vector3(0,-.65,0))):this.mechWeaponAim(source.position,to),source.unit);const world=new T.Matrix4().makeRotationY(source.yaw).setPosition(source.position);source.animator.muzzle(world,from);}
      // Pure event visualization; projectiles never calculate damage.
      if(event.type==='rail'){const muzzleWorld=source?.animator?new T.Matrix4().makeRotationY(source.yaw).setPosition(source.position).multiply(source.animator.nodes.Muzzle.matrixWorld):new T.Matrix4().makeRotationY(yaw).setPosition(from);const effect=createRailShot(from,to,railMuzzles(muzzleWorld),new T.Vector3(0,0,-1).transformDirection(muzzleWorld),event.owner);this.scene.add(effect.root);this.effects.push(effect);this.audio.shot(from.clone().project(this.camera).x,to.clone().project(this.camera).x);return;}
      if(event.type==='mech'){const effect=createMechShot(from,to,event.owner);this.scene.add(effect.root);this.effects.push(effect);return;}
      const beam=this.line(from,to,color,event.type==='rail'?.026:.012);root.add(beam);if(this.options.clarity&&event.type!=='rail')beam.visible=false;
      const pulse=new T.Mesh(new T.SphereGeometry(event.type==='rail'?.09:.07,8,6),new T.MeshBasicMaterial({color}));pulse.position.copy(from);root.add(pulse);
      const muzzle=new T.Mesh(new T.SphereGeometry(event.type==='mech'?.12:.075,8,6),new T.MeshBasicMaterial({color,transparent:true,opacity:.8}));muzzle.position.copy(from);root.add(muzzle);
      this.scene.add(root);this.effects.push({root,age:0,life:event.type==='rail'?(this.options.clarity ? .38 : .32):.20,kind:'shot',from,to,pulse,beam,muzzle});
    } else if(event.kind==='hit'&&source) {
      source.hit=1;source.animator?.hit();const root=new T.Group(),p=source.position.clone().add(new T.Vector3(0,.65,0));
      for(let i=0;i<4;i++){const s=new T.Mesh(new T.SphereGeometry(.028,4,3),new T.MeshBasicMaterial({color:0xffdf9b,transparent:true}));s.position.copy(p);s.userData.velocity=new T.Vector3(Math.cos(i*2.4)*.7,.3+i*.13,Math.sin(i*2.4)*.7);root.add(s);}this.scene.add(root);this.effects.push({root,age:0,life:.25,kind:'sparks'});
    } else if(event.kind==='destroyed') {
      if(source?.animator&&!event.afterCollapse){source.animator.die();source.deathEvent={...event,afterCollapse:true};source.deathLane=lane;this.corpses.set(key(lane,event.id),source);this.poses.delete(key(lane,event.id));this.health.get(key(lane,event.id))?.remove();this.health.delete(key(lane,event.id));return;}
      const root=new T.Group(),p=this.point({...event,lane},.25);
      for(let i=0;i<8;i++){const m=new T.Mesh(new T.IcosahedronGeometry(i<3?.13:.055,0),new T.MeshStandardMaterial({color:i<3?0xb6ad94:SUPPLIED_TEAMS[event.owner],roughness:1,transparent:true,opacity:.8}));m.position.copy(p);m.userData.velocity=new T.Vector3(Math.cos(i*2.4)*(i<3?.4:1.1),.65+(i%3)*.25,Math.sin(i*2.4)*(i<3?.4:1.1));root.add(m);}this.scene.add(root);this.effects.push({root,age:0,life:.65,kind:'sparks'});
    }
  }
  render(lanes,seconds,dt=0,draw=true) {
    if(!this.batches)return;this.lastLanes=lanes;this.elapsed=seconds;
    const needed=this.corpses.size+Math.max(1,...['orange','blue'].flatMap(owner=>Object.keys(this.specs).map(type=>lanes.reduce((n,g)=>n+g.units.filter(u=>u.owner===owner&&u.type===type).length,0)))); if(needed>Object.values(this.batches)[0][0].instanceMatrix.count){const capacity=2**Math.ceil(Math.log2(needed));for(const mesh of Object.values(this.batches).flat()){mesh.removeFromParent();mesh.dispose();}this.batches=makeBatches(this.scene,this.library,capacity);this.createRailLights(capacity);} const alive=new Set(),counts={},ids={},lightCounts={orange:0,blue:0};for(const id of Object.keys(this.batches)){counts[id]=0;ids[id]=[];}
    const chargeSounds=[];const low=this.zoom<1.8;if(this.railRig)for(const owner of ['orange','blue'])for(const [i,p] of this.library[owner].rail.entries())this.batches[owner+'-rail'][i].geometry=low?(this.railLowParts[p.node]||p.geometry):p.geometry;this.railDetail=low?'overview':'full';
    for(const [lane,game] of lanes.entries())for(const u of game.units) {
      const id=key(lane,u.id),p=this.point({...u,lane}),yaw=this.heading(u,lane,game);alive.add(id);
      let pose=this.poses.get(id);if(!pose){pose={position:p.clone(),yaw,kick:0,hit:0,unit:u};this.poses.set(id,pose);}pose.unit=u;if(u.type==='mech'&&this.mechRig&&!pose.animator)pose.animator=new MechAnimator(this.mechRig,u.id);if(u.type==='rail'&&this.railRig&&!pose.animator)pose.animator=new RailAnimator(this.railRig,u.id);
      const distance=pose.position.distanceTo(p),targetUnit=game.units.find(v=>v.id===u.target),targetPoint=targetUnit?this.point({...targetUnit,lane}):String(u.target).startsWith('hq-')?this.point({hq:u.target.slice(3)}):null;
      const blend=dt>0?1-Math.exp(-dt*22):1;
      if(u.departing){pose.position.copy(p);pose.yaw=yaw;}
      else{pose.position.lerp(p,blend);pose.yaw+=shortest(pose.yaw,yaw)*Math.min(1,dt*16||1);}
      pose.kick=Math.max(0,pose.kick-dt*6);pose.hit=Math.max(0,pose.hit-dt*7);
      const bob=(this.reduced||pose.animator)?0:Math.sin(seconds*(u.type==='drone'?3.3:9)+u.id*1.7)*(u.type==='drone'?.05:u.moving?.028:0);
      this.dummy.position.copy(pose.position);this.dummy.position.y+=(u.type==='drone'?.28:0)+bob;
      if(!pose.animator){this.dummy.position.x+=Math.sin(pose.yaw)*pose.kick*.06;this.dummy.position.z+=Math.cos(pose.yaw)*pose.kick*.06;}
      // Articulated robots share rigid-part instance batches while keeping individual poses.
      this.dummy.rotation.set(pose.kick*.035,pose.yaw,pose.hit*.055+(u.moving&&!this.reduced?Math.sin(seconds*8+u.id)*.016:0));if(pose.animator)this.dummy.rotation.set(0,pose.yaw,0);this.dummy.scale.setScalar(1);this.dummy.updateMatrix();
      const batch=`${u.owner}-${u.type}`,index=counts[batch]++;ids[batch].push(id);pose.world??=new T.Matrix4();pose.world.copy(this.dummy.matrix);if(pose.animator){pose.animator.sample(dt,distance*(u.departing?1:blend),!!(u.moving||u.departing),this.mechAim(pose.position,pose.yaw,targetPoint),u.type==='rail'?this.railElevation(pose.position,targetPoint):this.mechWeaponAim(pose.position,targetPoint),u);pose.animator.write(this.batches[batch],index,this.dummy.matrix,this.library[u.owner][u.type]);}else for(const mesh of this.batches[batch])mesh.setMatrixAt(index,this.dummy.matrix);
      if(u.type==='rail'&&pose.animator?.charge>0){const carriage=new T.Matrix4().multiplyMatrices(pose.world,pose.animator.nodes.Recoil_Carriage.matrixWorld);lightCounts[u.owner]=writeRailCharge(this.railLights[u.owner],lightCounts[u.owner],carriage,pose.animator.charge);if(dt>0)chargeSounds.push({id,progress:pose.animator.charge,pan:pose.position.clone().project(this.camera).x});}
      let label=this.health.get(id);if(!label){label=document.createElement('div');label.className=`health ${u.owner}`;label.innerHTML='<i></i>';this.labels.append(label);this.health.set(id,label);}label.hidden=u.hp===this.specs[u.type].hp&&this.selected!==id;
      const q=pose.position.clone().add(new T.Vector3(0,u.type==='mech'?1.75:1.25,0)).project(this.camera);label.style.transform=`translate(${(q.x*.5+.5)*this.stage.clientWidth}px,${(-q.y*.5+.5)*this.stage.clientHeight}px)`;label.firstChild.style.width=`${u.hp/this.specs[u.type].hp*100}%`;label.dataset.unit=id;
    }
    for(const [id] of this.poses)if(!alive.has(id)){this.poses.get(id).animator?.dispose();this.poses.delete(id);this.health.get(id)?.remove();this.health.delete(id);}
    for(const [id,pose] of this.corpses){
      pose.animator.sample(dt,0,false);if(pose.animator.deathAge>=1.2){this.corpses.delete(id);pose.animator.dispose();this.effect(pose.deathEvent,pose.deathLane);continue;}
      const batch=pose.unit.owner+'-'+pose.unit.type,index=counts[batch]++;ids[batch].push(null);pose.animator.write(this.batches[batch],index,pose.world,this.library[pose.unit.owner][pose.unit.type]);
    }
    for(const [id,meshes] of Object.entries(this.batches))for(const mesh of meshes){mesh.count=counts[id];mesh.instanceMatrix.needsUpdate=true;}
    for(const [owner,mesh] of Object.entries(this.railLights))finishRailCharge(mesh,lightCounts[owner]);
    if(dt>0)this.audio.updateCharges(chargeSounds);
    this.pickIds=ids;
    const selected=this.poses.get(this.selected);this.selection.visible=!!selected;if(selected)this.selection.position.copy(selected.position).add(new T.Vector3(0,.04,0));
    for(const effect of [...this.effects]) {
      effect.age+=dt;const t=effect.age/effect.life;if(t>=1){this.disposeEffect(effect);this.effects.splice(this.effects.indexOf(effect),1);continue;}
      if(effect.rail)sampleRailShot(effect,effect.age,this.frame.scale);
      else if(effect.mech)sampleMechShot(effect,effect.age,this.frame.scale);
      else if(effect.kind==='shot'){effect.pulse.position.lerpVectors(effect.from,effect.to,Math.min(1,t*2));effect.pulse.visible=t<.65;effect.beam.material.opacity=(1-t)*.45;effect.muzzle.scale.setScalar(1-t);effect.muzzle.material.opacity=1-t;}
      else effect.root.children.forEach(m=>{m.position.addScaledVector(m.userData.velocity,dt);m.userData.velocity.y-=dt*.8;m.material.opacity=(1-t)*.7;m.scale.setScalar(1+t*.65);});
    }
    if(draw&&(dt>0||this.dirty)){this.renderer.render(this.scene,this.camera);this.dirty=false;}
  }
  inspect() {const p=this.poses.get(this.selected);return p?{...p.unit,lane:Number(this.selected.split(':')[0])}:null;}
  diagnostics() {
    const screen=v=>{v.project(this.camera);return {x:(v.x*.5+.5)*this.stage.clientWidth,y:(-v.y*.5+.5)*this.stage.clientHeight};};
    // Project actual vertices, not oversized box corners, for the readability audit.
    const bounds=(meshes,matrix,index=null)=>{
      let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;const v=new T.Vector3();
      for(const mesh of meshes){if(index!==null)mesh.getMatrixAt(index,matrix);const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const q=screen(v.fromBufferAttribute(p,i).applyMatrix4(matrix));left=Math.min(left,q.x);right=Math.max(right,q.x);top=Math.min(top,q.y);bottom=Math.max(bottom,q.y);}}
      return {left,right,top,bottom,width:right-left,height:bottom-top};
    };
    const projected=[];
    for(const [id,p] of this.poses){const position=screen(p.position.clone().add(new T.Vector3(0,.65,0))),batch=`${p.unit.owner}-${p.unit.type}`,index=this.pickIds[batch].indexOf(id),matrix=new T.Matrix4();this.batches[batch][0].getMatrixAt(index,matrix);projected.push({id,type:p.unit.type,owner:p.unit.owner,departing:!!p.unit.departing,world:{x:p.position.x,z:p.position.z},yaw:p.yaw,...position,animation:p.animator?{walk:p.animator.walkWeight,phase:p.animator.phase,attack:p.animator.attackAge<.45,hit:p.animator.hitAge<.3,aim:p.animator.aim,charge:p.animator.charge??0}:null,bounds:bounds(this.batches[batch],matrix,index)});}
    const headquarters=this.hqs.map((hq,i)=>({owner:i===0?'orange':'blue',bounds:bounds(hq.children,hq.matrixWorld)}));
    return {assets:this.assetMetadata,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,railDetail:this.railDetail,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,zoom:this.zoom,mode:this.mode,scale:this.frame.scale,units:projected,headquarters,dyingMechs:[...this.corpses.values()].filter(p=>p.unit.type==='mech').length,dyingRails:[...this.corpses.values()].filter(p=>p.unit.type==='rail').length,effects:this.effects.length};
  }
}
