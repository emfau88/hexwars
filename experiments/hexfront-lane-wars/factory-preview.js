import * as T from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {suppliedMaterial,SUPPLIED_TEAMS} from './src/team-material.js';
const $=id=>document.getElementById(id),stage=$('stage'),loader=new GLTFLoader();
const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;stage.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e5e4dc');
const camera=new T.PerspectiveCamera(35,1,.03,100);
const target=new T.Vector3(0,1,0);let yaw=-.55,pitch=.38,distance=6.8,drag=null,door=0,cycling=false,walking=false,showMech=false,mode='single',role='drone',team='orange',ghost=false,last=performance.now(),clock=0,walkTime=0;
const hemi=new T.HemisphereLight(0xe9f1f4,0x8c9e88,.65);scene.add(hemi);
const key=new T.DirectionalLight(0xfff3db,2.3);key.position.set(-3.8,7,-4);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:25});key.shadow.bias=-.0001;key.shadow.normalBias=.025;scene.add(key);
const fill=new T.DirectionalLight(0xb7d1e1,.7);fill.position.set(4,3,1);scene.add(fill);
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0xd0d3c5,roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-.006;floor.receiveShadow=true;scene.add(floor);
// A low-cost studio environment for real ceramic/metal reflections; no remote textures.
const studio=new T.Scene();studio.background=new T.Color(0xa4b9b9);
for(const [x,y,z,s] of [[-3,4,-3,4],[4,2,1,2],[0,6,0,3]]){
 const p=new T.Mesh(new T.PlaneGeometry(s,s),new T.MeshBasicMaterial({color:new T.Color(2,2,2)}));p.position.set(x,y,z);p.lookAt(0,0,0);studio.add(p);
}
const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(studio,.05);scene.environment=env.texture;scene.environmentIntensity=.4;pmrem.dispose();
const assets=await Promise.all(['factory','module-drone','module-mech','module-rail'].map(n=>loader.loadAsync('public/models/factory-preview/'+n+'.glb')));
const [hqGLB,mechGLB]=await Promise.all(['hq','mech'].map(n=>loader.loadAsync('public/models/'+n+'.glb')));
const manifest=await fetch('public/models/factory-preview/manifest.json').then(r=>r.json());
const holder=new T.Group(),batchGroup=new T.Group();scene.add(holder,batchGroup);let batches=[];
const factories=[];let refs=[],dirty=true;
function setupMesh(root){root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=true;}});}
function factory(owner){
 const root=assets[0].scene.clone(true),mixer=new T.AnimationMixer(root),action=mixer.clipAction(assets[0].animations[0]);action.play();action.paused=true;
 const socket=root.getObjectByName('Production_Socket'),modules={};
 for(const [i,name] of ['drone','mech','rail'].entries()){modules[name]=assets[i+1].scene.clone(true);socket.add(modules[name]);}
 setupMesh(root);holder.add(root);const item={root,mixer,action,socket,modules,owner};
 factories.push(item);return item;
}
function normalised(source,{width,height}){
 const root=source.scene.clone(true);root.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(root),s=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3()),scale=height?height/s.y:width/Math.max(s.x,s.z);
 const wrap=new T.Group();root.position.set(-c.x,-box.min.y,-c.z);wrap.add(root);wrap.scale.setScalar(scale);
 root.traverse(o=>{if(o.isMesh){o.material=suppliedMaterial(o.material,team);o.castShadow=o.receiveShadow=true;}});
 holder.add(wrap);refs.push(wrap);return wrap;
}
let mech,hq;
const materialCache=new Map();
function materialFor(source,owner,isGhost){
 const key=source.uuid+':'+(source.name==='Team'?owner:'shared')+':'+isGhost;if(materialCache.has(key))return materialCache.get(key);
 const m=source.clone();
 if(source.name==='Team')m.color.setHex(SUPPLIED_TEAMS[owner]);
 m.transparent=isGhost;m.opacity=isGhost?.34:1;m.depthWrite=!isGhost;
 materialCache.set(key,m);return m;
}
function appearance(){
 dirty=true;
 for(const f of factories){
  f.root.traverse(o=>{if(o.isMesh){o.userData.originalMaterial??=o.material;o.material=materialFor(o.userData.originalMaterial,f.owner,ghost);o.castShadow=!ghost;}});
  for(const [name,mod] of Object.entries(f.modules))mod.visible=name===role;
 }
 if(mode==='eight')makeBatches();
 $('scene-label').textContent=(mode==='single'?'FABRIK':mode==='compare'?'MASSSTAB / UNVERÄNDERTE SPIELGRÖSSEN':'ACHT INSTANZEN')+' / '+(team==='orange'?'ORANGE':'BLAU');
}

function clearBatches(){for(const {mesh} of batches)mesh.dispose();batches=[];batchGroup.clear();}
function makeBatches(){
 clearBatches();const groups=new Map();
 for(const f of factories)f.root.traverseVisible(o=>{
  if(!o.isMesh)return;o.layers.set(2);
  const key=o.geometry.uuid+':'+o.material.uuid;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
 });
 for(const nodes of groups.values()){
  const mesh=new T.InstancedMesh(nodes[0].geometry,nodes[0].material,nodes.length);
  mesh.castShadow=!ghost;mesh.receiveShadow=true;mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);batchGroup.add(mesh);batches.push({mesh,nodes});
 }
}
function updateBatches(){
 holder.updateMatrixWorld(true);
 for(const {mesh,nodes} of batches){nodes.forEach((o,i)=>mesh.setMatrixAt(i,o.matrixWorld));mesh.instanceMatrix.needsUpdate=true;}
}

function build(){
 clearBatches();
 for(const ref of refs)ref.traverse(o=>{if(o.isMesh)o.material.dispose();});
 holder.clear();factories.length=0;refs=[];
 if(mode==='eight'){
  for(let i=0;i<8;i++){const f=factory(i<4?'orange':'blue');f.root.position.set((i%4-1.5)*2.1,0,(i<4?1:-1)*2.8);if(i>=4)f.root.rotation.y=Math.PI;}
  mech=null;hq=null;$('legend').textContent='Gemeinsame Geometrien und Texturen · unabhängige Tore\nFabrikabstand 2,10 · wie auf den bestehenden Bauplätzen';
 }else{
  factory(team);
  mech=normalised(mechGLB,{height:1.45});mech.position.set(mode==='compare'?2.1:0,.06,-1.8);
  if(mode==='compare'){hq=normalised(hqGLB,{width:4.3});hq.position.set(-4.2,0,.35);$('legend').textContent='HQ: 4,30 Breite · Mech: 1,45 Höhe\nFabrik und Modul: reale GLB-Abmessungen, keine optische Skalierung';}
  else{$('legend').textContent='';hq=null;}
  mech.visible=mode==='compare'||showMech||walking;
 }
 appearance();setDoor(door);view('hero');
}
function setDoor(value){
 dirty=true;
 door=T.MathUtils.clamp(value,0,1);
 for(const f of factories){f.action.time=door*assets[0].animations[0].duration;f.mixer.update(0);}
 $('door').value=Math.round(door*100);$('door-value').textContent=door===0?'Geschlossen':door===1?'Offen':Math.round(door*100)+' %';
}
function view(name){
 dirty=true;
 const scale=mode==='single'?1:mode==='compare'?2.7:2.9;
 target.set(mode==='compare'?-1.6:0,mode==='compare'?1.3:mode==='eight'?.7:1,0);
 const span=mode==='single'?3:9;Object.assign(key.shadow.camera,{left:-span,right:span,top:span,bottom:-span});key.shadow.camera.updateProjectionMatrix();
 yaw={hero:-.56,front:0,rear:Math.PI+.45,game:Math.PI+.36}[name];pitch=name==='game'?70*Math.PI/180:name==='front'?.10:.43;
 distance=(name==='front'?6.8:7.0)*scale;
 document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===name));
}
$('scene').onchange=e=>{mode=e.target.value;build();};
$('team').onchange=e=>{team=e.target.value;build();};
$('module').onchange=e=>{role=e.target.value;appearance();};
$('door').oninput=e=>{cycling=false;$('animate').setAttribute('aria-pressed','false');setDoor(e.target.value/100);};
$('open').onclick=()=>{cycling=false;walking=false;setDoor(1);syncButtons();};
$('close').onclick=()=>{cycling=false;walking=false;setDoor(0);syncButtons();};
$('animate').onclick=()=>{cycling=!cycling;walking=false;syncButtons();};
$('mech').onclick=()=>{showMech=!showMech;if(mech)mech.visible=showMech||mode==='compare';syncButtons();};
$('walk').onclick=()=>{walking=!walking;cycling=false;walkTime=0;if(mech)mech.visible=true;if(walking)setDoor(1);syncButtons();};
$('ghost').onchange=e=>{ghost=e.target.checked;appearance();};
for(const b of document.querySelectorAll('[data-camera]'))b.onclick=()=>view(b.dataset.camera);
function syncButtons(){dirty=true;$('animate').setAttribute('aria-pressed',String(cycling));$('walk').setAttribute('aria-pressed',String(walking));$('mech').setAttribute('aria-pressed',String(showMech));}
stage.oncontextmenu=e=>e.preventDefault();
stage.addEventListener('pointerdown',e=>{if(e.target!==renderer.domElement)return;drag={x:e.clientX,y:e.clientY,pan:e.button===2};stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{if(!drag)return;dirty=true;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.pan){target.x-=dx*distance*.0015;target.y+=dy*distance*.0015;}else{yaw-=dx*.006;pitch=T.MathUtils.clamp(pitch+dy*.005,.02,1.53);}drag.x=e.clientX;drag.y=e.clientY;});
stage.addEventListener('pointerup',()=>drag=null);stage.addEventListener('pointercancel',()=>drag=null);
stage.addEventListener('wheel',e=>{e.preventDefault();dirty=true;distance=T.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),2,40);},{passive:false});
function resize(){dirty=true;renderer.setSize(stage.clientWidth,stage.clientHeight);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);
build();resize();$('loading').hidden=true;
function tick(now){
 const dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;
 if(cycling)setDoor((1-Math.cos(clock*1.3))/2);
 if(mech){
  if(walking){walkTime+=dt;const t=(walkTime%6)/6;mech.position.set(0,.11+Math.sin(clock*9)*.028,-.2-t*3.4);mech.rotation.z=Math.sin(clock*8)*.016;}
  else{mech.rotation.z=0;mech.position.set(mode==='compare'?2.1:0,.06,-1.8);}
  mech.visible=mode==='compare'||showMech||walking;
 }
 camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z-Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(target);
 if(dirty||cycling||walking||drag){updateBatches();renderer.render(scene,camera);dirty=false;}
 $('stats').textContent=manifest.assets[0].triangles.toLocaleString('de-DE')+' Dreiecke / Grundkörper · '+(manifest.assets[0].bytes/1024/1024).toFixed(2)+' MiB · '+renderer.info.render.calls+' Draw Calls in der Vorschau';
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.__FACTORY_PREVIEW__={
 setFactoryDoor:(index,value)=>{dirty=true;const f=factories[index];f.action.time=value*assets[0].animations[0].duration;f.mixer.update(0);},
 setDoor,view,scene:mode=>{$('scene').value=mode;$('scene').dispatchEvent(new Event('change'));},
 diagnostics:()=>{
  const f=factories[0],bounds=new T.Box3().setFromObject(f.root),size=bounds.getSize(new T.Vector3());
  return {ready:true,mode,team,role,door,walking,ghost,factories:factories.length,dimensions:size.toArray(),manifest,
   doorNodes:factories.map(f=>[1,2,3,4].map(i=>{const o=f.root.getObjectByName('Hangar_Segment_'+i);return {name:o.name,position:o.position.toArray()};})),
   geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,drawCalls:renderer.info.render.calls,batches:batches.length,
   meshes:factories.flatMap(f=>{const r=[];f.root.traverse(o=>{if(o.isMesh)r.push({geometry:o.geometry.uuid,material:o.material.uuid,visible:o.visible});});return r;}),
   visibleModule:factories.map(f=>Object.entries(f.modules).filter(([,m])=>m.visible).map(([name])=>name)),materials:factories.map(f=>{const r=[];f.root.traverseVisible(o=>{if(o.isMesh)r.push({name:o.material.name,color:o.material.color.getHexString(),opacity:o.material.opacity,depthWrite:o.material.depthWrite});});return r;}),camera:camera.position.toArray()};
 }
};
