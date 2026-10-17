import * as T from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {suppliedMaterial} from './src/team-material.js';
const $=id=>document.getElementById(id),stage=$('stage');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;stage.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#d9ddd3');const camera=new T.PerspectiveCamera(35,1,.02,80);
scene.add(new T.HemisphereLight(0xffffff,0x7e8979,1.6));const sun=new T.DirectionalLight(0xfff1dc,2.5);sun.position.set(-3,6,-4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:15});sun.shadow.normalBias=.015;scene.add(sun);
const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:0xbfcbb4,roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=-.003;scene.add(floor);
const grid=new T.GridHelper(12,48,0x899b85,0xaabb9e);grid.position.y=.001;grid.material.transparent=true;grid.material.opacity=.25;scene.add(grid);
const gltf=await new GLTFLoader().loadAsync('public/models/mech-animated/mech-rigged.glb');
const root=gltf.scene;scene.add(root);const materials=[];
root.traverse(o=>{if(o.isMesh){const original=o.material;o.userData.original=original;o.material=original.name==='Supplied_Surface'?suppliedMaterial(original,'orange'):original.clone();materials.push(o);o.castShadow=o.receiveShadow=true;}});
const twin=root.clone(true);scene.add(twin);twin.visible=false;const pairs=[];twin.traverse(o=>{const original=root.getObjectByName(o.name);if(original&&o!==twin)pairs.push([original,o]);if(o.isMesh)o.material=o.userData.original.name==='Supplied_Surface'?suppliedMaterial(original.userData.original,'blue'):o.material;});
const mixer=new T.AnimationMixer(root);let active,clip='Idle',paused=false,speed=1,travel=false,dirty=true,last=performance.now(),yaw=-.55,pitch=.28,distance=3.8,drag=null;
let transitionTime=null;function play(name){clip=name;$('clip').value=name;const next=mixer.clipAction(gltf.animations.find(c=>c.name===name));next.reset().setLoop(['Idle','Walk'].includes(name)?T.LoopRepeat:T.LoopOnce,Infinity).setEffectiveWeight(1).play();next.clampWhenFinished=true;if(active&&active!==next){next.crossFadeFrom(active,.15,false);}active=next;dirty=true;}
play('Idle');$('loading').hidden=true;
$('compare').onchange=e=>{twin.visible=e.target.checked;distance=twin.visible?6:3.8;dirty=true;};$('transition').onclick=()=>{transitionTime=0;paused=false;play('Idle');};
$('zoom-in').onclick=()=>{distance=Math.max(2,distance/1.2);dirty=true;};$('zoom-out').onclick=()=>{distance=Math.min(12,distance*1.2);dirty=true;};
$('clip').onchange=e=>play(e.target.value);$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Fortsetzen':'Pause';};$('restart').onclick=()=>play(clip);$('speed').onchange=e=>speed=Number(e.target.value);$('travel').onchange=e=>{travel=e.target.checked;dirty=true;};
$('team').onchange=e=>{for(const o of materials){o.material.dispose();o.material=o.userData.original.name==='Supplied_Surface'?suppliedMaterial(o.userData.original,e.target.value):o.userData.original.clone();}dirty=true;$('scene-label').textContent='MECH / '+e.target.value.toUpperCase();};
$('scrub').oninput=e=>{paused=true;$('pause').textContent='Fortsetzen';active.time=Number(e.target.value)*active.getClip().duration;mixer.update(0);dirty=true;};
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{yaw={hero:-.55,front:0,side:-Math.PI/2,rear:Math.PI}[b.dataset.view];pitch=b.dataset.view==='hero'?.28:.06;dirty=true;};
stage.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);});stage.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.006;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.005,.01,1.4);drag={x:e.clientX,y:e.clientY};dirty=true;});stage.addEventListener('pointerup',()=>drag=null);stage.addEventListener('wheel',e=>{e.preventDefault();distance=T.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),2,12);dirty=true;},{passive:false});
new ResizeObserver(()=>{renderer.setSize(stage.clientWidth,stage.clientHeight);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();dirty=true;}).observe(stage);
function tick(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused){if(transitionTime!==null){const before=transitionTime;transitionTime+=dt*speed;for(const [t,n] of [[1,'Walk'],[3,'Attack'],[3.6,'Idle']])if(before<t&&transitionTime>=t)play(n);if(transitionTime>4.6)transitionTime=null;}mixer.update(dt*speed);dirty=true;$('scrub').value=active.time/active.getClip().duration;}
 for(const [a,b] of pairs){b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);}root.position.x=twin.visible?-.95:0;twin.position.x=.95;
 root.position.z=travel&&clip==='Walk'?1.2-(mixer.time*.28/.62)%2.4:0;
 twin.position.z=root.position.z;
 camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,.70+Math.sin(pitch)*distance,-Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(0,.70,0);
 if(dirty){renderer.render(scene,camera);dirty=false;}$('stats').textContent=clip+' · '+active.time.toFixed(2)+' s · '+renderer.info.render.calls+' Draw Calls';requestAnimationFrame(tick);}
requestAnimationFrame(tick);
window.__MECH_VIEWER__={play,pose:(name,t)=>{mixer.stopAllAction();active=null;play(name);mixer.update(0);paused=true;active.time=t;mixer.update(0);dirty=true;},get root(){return root;},get renderer(){return renderer;},get clips(){return gltf.animations.map(c=>({name:c.name,duration:c.duration,tracks:c.tracks.length}));}};
