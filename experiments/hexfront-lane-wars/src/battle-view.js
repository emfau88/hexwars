import * as T from 'three';
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
  constructor(stage,labels,onSelect) {
    this.stage=stage;this.labels=labels;this.onSelect=onSelect;this.poses=new Map();this.health=new Map();this.effects=[];this.selected=null;this.zoom=1;this.pan={u:0,v:0};this.mode='diorama';this.elapsed=0;this.pickIds={};this.lastLanes=[];
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene=new T.Scene();this.scene.background=new T.Color(0xadb699);this.scene.fog=new T.Fog(0xadb699,65,130);
    this.camera=new T.OrthographicCamera(-20,20,15,-15,.1,180);
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-label','HEXFRONT Wiesental: zwei Wege, orangefarbenes HQ unten, blaues HQ oben. Roboter anklicken zum Untersuchen.');stage.append(this.renderer.domElement);
    this.scene.add(new T.HemisphereLight(0xe4eff3,0x858575,2.0));
    const sun=new T.DirectionalLight(0xffefdb,2.65);sun.position.set(-12,24,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-21,right:21,top:21,bottom:-21,near:1,far:65});sun.shadow.bias=-.00025;sun.shadow.normalBias=.018;sun.shadow.radius=3;this.scene.add(sun);
    const fill=new T.DirectionalLight(0xd6e3e8,.48);fill.position.set(9,8,-12);this.scene.add(fill);
    this.dummy=new T.Object3D();this.raycaster=new T.Raycaster();
    this.selection=new T.Mesh(new T.RingGeometry(.57,.60,48),new T.MeshBasicMaterial({color:0xf4d493,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false}));this.selection.rotation.x=-Math.PI/2;this.selection.visible=false;this.scene.add(this.selection);
    this.ready=Promise.all([buildLandscape(this.scene),loadModels()]).then(([,models])=>{this.library=models.library;this.assetMetadata=models.metadata;this.batches=makeBatches(this.scene,this.library);this.hqs=['orange','blue'].map(owner=>addHQ(this.scene,this.library[owner].hq,owner));this.resize();});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(stage);this.bind();this.resize();
  }
  resize() {
    this.dirty=true;
    this.stage.parentElement.dataset.closeup=String(this.zoom>1.35);
    const w=this.stage.clientWidth,h=this.stage.clientHeight;if(!w||!h)return;
    const basis=cameraBasis(CAMERA_VIEWS[this.mode],0),points=[];
    for(const x of [-16,16])for(const z of [-12.4,12.4])for(const y of [0,2.3])points.push(x,y,z);
    const bounds=projectedBounds(points,basis),top=w<700?134:90,bottom=w<700?148:142;
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
    const hit=this.raycaster.intersectObjects(Object.values(this.batches).flat(),false)[0];this.selected=hit?this.pickIds[hit.object.userData.batch]?.[hit.instanceId]??null:null;this.dirty=true;this.onSelect(this.selected);
  }
  reset() {this.dirty=true;for(const e of this.effects)this.disposeEffect(e);this.effects=[];this.poses.clear();for(const label of this.health.values())label.remove();this.health.clear();this.selected=null;this.onSelect(null);}
  disposeEffect(e) {e.root.removeFromParent();e.root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
  line(from,to,color,width=.025) {
    const delta=to.clone().sub(from),mesh=new T.Mesh(new T.CylinderGeometry(width,width,delta.length(),5),new T.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false}));mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return mesh;
  }
  effect(event,lane) {
    const source=this.poses.get(key(lane,event.source??event.id));
    if(event.kind==='shot') {
      if(source)source.kick=1;
      const root=new T.Group(),base=visualPoint({...event.from,lane}),to=visualPoint({...event.to,lane},.65),yaw=Math.atan2(base.x-to.x,base.z-to.z);
      const muzzleLocal=event.type==='mech'?new T.Vector3(.58,.72,-.54):event.type==='rail'?new T.Vector3(0,.91,-.96):new T.Vector3(0,.50,-.35);
      const from=base.clone().add(muzzleLocal.applyAxisAngle(new T.Vector3(0,1,0),yaw)),color=event.owner==='orange'?0xf6cb83:0xb8d9df;
      // Pure event visualization; projectiles never calculate damage.
      const beam=this.line(from,to,color,event.type==='rail'?.026:.012);root.add(beam);
      const pulse=new T.Mesh(new T.SphereGeometry(event.type==='rail'?.09:.07,8,6),new T.MeshBasicMaterial({color}));pulse.position.copy(from);root.add(pulse);
      const muzzle=new T.Mesh(new T.SphereGeometry(event.type==='mech'?.12:.075,8,6),new T.MeshBasicMaterial({color,transparent:true,opacity:.8}));muzzle.position.copy(from);root.add(muzzle);
      this.scene.add(root);this.effects.push({root,age:0,life:event.type==='rail'?.32:.20,kind:'shot',from,to,pulse,beam,muzzle});
    } else if(event.kind==='hit'&&source) {
      source.hit=1;const root=new T.Group(),p=source.position.clone().add(new T.Vector3(0,.65,0));
      for(let i=0;i<4;i++){const s=new T.Mesh(new T.SphereGeometry(.028,4,3),new T.MeshBasicMaterial({color:0xffdf9b,transparent:true}));s.position.copy(p);s.userData.velocity=new T.Vector3(Math.cos(i*2.4)*.7,.3+i*.13,Math.sin(i*2.4)*.7);root.add(s);}this.scene.add(root);this.effects.push({root,age:0,life:.25,kind:'sparks'});
    } else if(event.kind==='destroyed') {
      const root=new T.Group(),p=visualPoint({...event,lane},.25);
      for(let i=0;i<8;i++){const m=new T.Mesh(new T.IcosahedronGeometry(i<3?.13:.055,0),new T.MeshStandardMaterial({color:i<3?0xb6ad94:SUPPLIED_TEAMS[event.owner],roughness:1,transparent:true,opacity:.8}));m.position.copy(p);m.userData.velocity=new T.Vector3(Math.cos(i*2.4)*(i<3?.4:1.1),.65+(i%3)*.25,Math.sin(i*2.4)*(i<3?.4:1.1));root.add(m);}this.scene.add(root);this.effects.push({root,age:0,life:.65,kind:'sparks'});
    }
  }
  render(lanes,seconds,dt=0,draw=true) {
    if(!this.batches)return;this.lastLanes=lanes;this.elapsed=seconds;
    const alive=new Set(),counts={},ids={};for(const id of Object.keys(this.batches)){counts[id]=0;ids[id]=[];}
    for(const [lane,game] of lanes.entries())for(const u of game.units) {
      const id=key(lane,u.id),p=visualPoint({...u,lane}),defaultYaw=u.owner==='orange'?0:Math.PI;alive.add(id);
      let pose=this.poses.get(id);if(!pose){pose={position:p.clone(),yaw:defaultYaw,kick:0,hit:0,unit:u};this.poses.set(id,pose);}pose.unit=u;
      const target=game.units.find(v=>v.id===u.target),destination=target?visualPoint({...target,lane}):visualPoint({...u,lane,p:u.p+(u.owner==='orange'?1:-1)});
      const yaw=Math.atan2(p.x-destination.x,p.z-destination.z),blend=dt>0?1-Math.exp(-dt*22):1;pose.position.lerp(p,blend);pose.yaw+=shortest(pose.yaw,yaw)*Math.min(1,dt*16||1);
      pose.kick=Math.max(0,pose.kick-dt*6);pose.hit=Math.max(0,pose.hit-dt*7);
      const bob=this.reduced?0:Math.sin(seconds*(u.type==='drone'?3.3:9)+u.id*1.7)*(u.type==='drone'?.05:u.moving?.028:0);
      this.dummy.position.copy(pose.position);this.dummy.position.y+=(u.type==='drone'?.28:0)+bob;
      this.dummy.position.x+=Math.sin(pose.yaw)*pose.kick*.06;this.dummy.position.z+=Math.cos(pose.yaw)*pose.kick*.06;
      // Static mech GLB: temporary whole-body sway/recoil, no articulated rig.
      this.dummy.rotation.set(pose.kick*.035,pose.yaw,pose.hit*.055+(u.moving&&!this.reduced?Math.sin(seconds*8+u.id)*.016:0));this.dummy.scale.setScalar(1);this.dummy.updateMatrix();
      const batch=`${u.owner}-${u.type}`,index=counts[batch]++;ids[batch].push(id);for(const mesh of this.batches[batch])mesh.setMatrixAt(index,this.dummy.matrix);
      let label=this.health.get(id);if(!label){label=document.createElement('div');label.className=`health ${u.owner}`;label.innerHTML='<i></i>';this.labels.append(label);this.health.set(id,label);}label.hidden=u.hp===UNITS[u.type].hp&&this.selected!==id;
      const q=pose.position.clone().add(new T.Vector3(0,u.type==='mech'?1.75:1.25,0)).project(this.camera);label.style.transform=`translate(${(q.x*.5+.5)*this.stage.clientWidth}px,${(-q.y*.5+.5)*this.stage.clientHeight}px)`;label.firstChild.style.width=`${u.hp/UNITS[u.type].hp*100}%`;label.dataset.unit=id;
    }
    for(const [id] of this.poses)if(!alive.has(id)){this.poses.delete(id);this.health.get(id)?.remove();this.health.delete(id);}
    for(const [id,meshes] of Object.entries(this.batches))for(const mesh of meshes){mesh.count=counts[id];mesh.instanceMatrix.needsUpdate=true;}
    this.pickIds=ids;
    const selected=this.poses.get(this.selected);this.selection.visible=!!selected;if(selected)this.selection.position.copy(selected.position).add(new T.Vector3(0,.04,0));
    for(const effect of [...this.effects]) {
      effect.age+=dt;const t=effect.age/effect.life;if(t>=1){this.disposeEffect(effect);this.effects.splice(this.effects.indexOf(effect),1);continue;}
      if(effect.kind==='shot'){effect.pulse.position.lerpVectors(effect.from,effect.to,Math.min(1,t*2));effect.pulse.visible=t<.65;effect.beam.material.opacity=(1-t)*.45;effect.muzzle.scale.setScalar(1-t);effect.muzzle.material.opacity=1-t;}
      else effect.root.children.forEach(m=>{m.position.addScaledVector(m.userData.velocity,dt);m.userData.velocity.y-=dt*.8;m.material.opacity=(1-t)*.7;m.scale.setScalar(1+t*.65);});
    }
    if(draw&&(dt>0||this.dirty)){this.renderer.render(this.scene,this.camera);this.dirty=false;}
  }
  inspect() {const p=this.poses.get(this.selected);return p?{...p.unit,lane:Number(this.selected.split(':')[0])}:null;}
  diagnostics() {
    const screen=v=>{v.project(this.camera);return {x:(v.x*.5+.5)*this.stage.clientWidth,y:(-v.y*.5+.5)*this.stage.clientHeight};};
    // Project actual vertices, not oversized box corners, for the readability audit.
    const bounds=(meshes,matrix)=>{
      let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;const v=new T.Vector3();
      for(const mesh of meshes){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const q=screen(v.fromBufferAttribute(p,i).applyMatrix4(matrix));left=Math.min(left,q.x);right=Math.max(right,q.x);top=Math.min(top,q.y);bottom=Math.max(bottom,q.y);}}
      return {left,right,top,bottom,width:right-left,height:bottom-top};
    };
    const projected=[];
    for(const [id,p] of this.poses){const position=screen(p.position.clone().add(new T.Vector3(0,.65,0))),batch=`${p.unit.owner}-${p.unit.type}`,index=this.pickIds[batch].indexOf(id),matrix=new T.Matrix4();this.batches[batch][0].getMatrixAt(index,matrix);projected.push({id,type:p.unit.type,owner:p.unit.owner,...position,bounds:bounds(this.batches[batch],matrix)});}
    const headquarters=this.hqs.map((hq,i)=>({owner:i===0?'orange':'blue',bounds:bounds(hq.children,hq.matrixWorld)}));
    return {assets:this.assetMetadata,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,zoom:this.zoom,mode:this.mode,scale:this.frame.scale,units:projected,headquarters,effects:this.effects.length};
  }
}
