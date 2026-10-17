import * as T from 'three';
import {SUPPLIED_TEAMS} from './team-material.js';

// One shared quad and two materials; purely visual, driven by the match clock.
export class FactoryWaveRings {
 constructor(scene){
  this.group=new T.Group();this.group.name='Factory_wave_rings';scene.add(this.group);
  this.geometry=new T.PlaneGeometry(2,2);this.items=new Map();this.up=new T.Vector3();this.right=new T.Vector3();this.gap=new T.Vector3();
  this.materials=Object.fromEntries(['orange','blue'].map(owner=>[owner,new T.ShaderMaterial({
   transparent:true,depthWrite:false,depthTest:false,toneMapped:false,
   uniforms:{team:{value:new T.Color(SUPPLIED_TEAMS[owner])},progress:{value:0},warning:{value:0},flash:{value:0}},
   vertexShader:'varying vec2 point; void main(){point=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:`
    varying vec2 point;
    uniform vec3 team;
    uniform float progress,warning,flash;
    void main(){
     float r=length(point);
     float edge=(1.0-smoothstep(.97,1.0,r))*smoothstep(.55,.58,r);
     if(edge<.001)discard;
     float angle=mod(atan(point.x,point.y)+6.2831853,6.2831853)/6.2831853;
     float band=smoothstep(.62,.65,r)*(1.0-smoothstep(.87,.90,r));
     float filled=step(angle,progress);
     vec3 ceramic=vec3(.78,.81,.78);
     vec3 track=vec3(.035,.065,.075);
     vec3 ink=mix(team,vec3(1.0),max(warning*.36,flash*.85));
     vec3 color=mix(ceramic,mix(track,ink,filled),band);
     gl_FragColor=vec4(color,edge*.96);
     #include <colorspace_fragment>
    }`
  })]));
 }
 update(factories,match,camera,pixelsPerUnit){
  const time=match.time+Math.max(0,match.remainder||0),remaining=Math.max(0,match.nextWave-Math.max(0,match.remainder||0));
  const progress=T.MathUtils.clamp(1-remaining/match.rules.wave,0,1);
  const sinceWave=time-(match.wave-1)*match.rules.wave;
  const flash=match.wave>0?T.MathUtils.clamp(1-sinceWave/.55,0,1):0;
  const warning=remaining<=3?(.65+.35*Math.sin(time*Math.PI*4)):0;
  for(const material of Object.values(this.materials)){
   material.uniforms.progress.value=flash>0?1:progress;
   material.uniforms.warning.value=warning;material.uniforms.flash.value=flash;
  }
  for(const [id,factory] of Object.entries(factories)){
   if(!this.items.has(id)){
    const ring=new T.Mesh(this.geometry,this.materials[factory.owner]);ring.name='Wave_'+id;ring.renderOrder=30;ring.frustumCulled=false;this.group.add(ring);this.items.set(id,ring);
   }
   const ring=this.items.get(id);
   ring.visible=match.phase==='running'&&!!match.players[factory.owner].factories[factory.slot];
   // Screen-facing and pixel-sized: the circular indicator stays legible in portrait.
   const diameter=T.MathUtils.clamp(pixelsPerUnit*1.05,30,38)*(1+flash*.08);
   ring.position.copy(factory.root.position);ring.position.y+=2.65;
   this.up.set(0,1,0).applyQuaternion(camera.quaternion);ring.position.addScaledVector(this.up,diameter*.75/pixelsPerUnit);
   ring.quaternion.copy(camera.quaternion);ring.scale.setScalar(diameter/(2*pixelsPerUnit));
   ring.userData={progress,remaining,flash,warning,diameter};
  }
  // At the most distant landscape framing, adjacent slots are narrower than
  // the minimum readable ring. Nudge only the outer indicator outward.
  this.right.set(1,0,0).applyQuaternion(camera.quaternion);
  for(const owner of ['orange','blue'])for(const [outer,inner] of [[0,1],[3,2]]){
   if(!this.items.has(owner+':3'))continue;
   const a=this.items.get(owner+':'+outer),b=this.items.get(owner+':'+inner);
   if(!a?.visible||!b?.visible)continue;
   const gap=this.gap.copy(a.position).sub(b.position).dot(this.right);
   const needed=(a.userData.diameter/2+b.userData.diameter/2+5)/pixelsPerUnit;
   if(Math.abs(gap)<needed)a.position.addScaledVector(this.right,Math.sign(gap||outer-1.5)*(needed-Math.abs(gap)));
  }
 }
 diagnostics(){return [...this.items].map(([id,ring])=>({id,visible:ring.visible,...ring.userData}));}
 dispose(){this.group.removeFromParent();this.geometry.dispose();for(const m of Object.values(this.materials))m.dispose();this.items.clear();}
}
