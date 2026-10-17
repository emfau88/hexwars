import * as T from 'three';

// Presentation only: sampled from existing charge state and authoritative shot events.
const energy=0x54dce9;
const material=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,toneMapped:false});
export function createRailCharge(capacity=1){
  const mesh=new T.InstancedMesh(new T.BoxGeometry(.042,.026,.91),material(0xffffff),capacity*2);
  mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);return mesh;
}
const local=new T.Matrix4(),matrix=new T.Matrix4(),color=new T.Color(),white=new T.Color(0xe6ffff);
export function writeRailCharge(mesh,index,carriage,amount){
  const intensity=T.MathUtils.clamp(amount,0,1),width=.5+intensity*.7;
  color.setHex(energy).lerp(white,intensity*.7).multiplyScalar(.45+intensity*.55);
  for(const side of [-1,1]){
    local.makeScale(width,.65+intensity*.7,1).setPosition(side*.145,.097,-.59);
    matrix.multiplyMatrices(carriage,local);mesh.setMatrixAt(index,matrix);mesh.setColorAt(index++,color);
  }
  return index;
}
export function finishRailCharge(mesh,count){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
function beam(from,to,radius,color,opacity){
  const delta=to.clone().sub(from),m=new T.Mesh(new T.CylinderGeometry(radius,radius,delta.length(),8),material(color,opacity));
  m.position.copy(from).add(to).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
}
// Aperture centres from build_railgun.py: x +/- .145, forward 1.164.
// The existing central Muzzle socket is at forward 1.13; start just outside each jaw.
export function railMuzzles(muzzleWorld){return [-1,1].map(side=>new T.Vector3(side*.145,0,-.036).applyMatrix4(muzzleWorld));}
export function createRailShot(from,to,origins=railMuzzles(new T.Matrix4().setPosition(from)),axis=to.clone().sub(from).normalize()){
  // Parallel rays follow the actual barrel axes, never converge or bend at the apertures.
  const length=Math.max(.1,to.clone().sub(from).dot(axis)),ends=origins.map(origin=>origin.clone().addScaledVector(axis,length));
  const root=new T.Group(),barrels=origins.map((origin,i)=>{
    const core=beam(origin,ends[i],.023,0xf3ffff,1),halo=beam(origin,ends[i],.046,energy,.28);
    const muzzle=new T.Mesh(new T.SphereGeometry(.075,8,6),material(0xeaffff));muzzle.position.copy(origin);core.renderOrder=1;root.add(halo,core,muzzle);return {beam:core,halo,muzzle};
  });
  // Camera-facing soft flash stays readable on the target's opaque armour.
  const impact=new T.Mesh(new T.PlaneGeometry(.85,.85),new T.ShaderMaterial({
    uniforms:{opacity:{value:1}},transparent:true,depthWrite:false,depthTest:false,
    vertexShader:'varying vec2 uv0; void main(){uv0=uv; vec4 center=modelViewMatrix*vec4(0.,0.,0.,1.); vec2 size=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz)); gl_Position=projectionMatrix*(center+vec4(position.xy*size,0.,0.));}',
    fragmentShader:'varying vec2 uv0; uniform float opacity; void main(){float d=length(uv0-.5)*2.; float alpha=pow(max(0.,1.-d),2.); vec3 color=mix(vec3(.20,.85,.94),vec3(1.),(1.-smoothstep(0.,.6,d))); gl_FragColor=vec4(color,alpha*opacity);}'
  }));impact.position.copy(to);impact.renderOrder=3;
  const ring=new T.Mesh(new T.RingGeometry(.10,.145,24),material(energy));ring.material.side=T.DoubleSide;ring.position.copy(to);ring.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),from.clone().sub(to).normalize());
  // Eight short spark streaks in one draw call, analytically expanded during decay.
  const vertices=[];for(let i=0;i<8;i++){const angle=i*2.39996,y=.3+(i%3)*.28,d=new T.Vector3(Math.cos(angle),y,Math.sin(angle)).normalize();vertices.push(...d.clone().multiplyScalar(.19).toArray(),...d.clone().multiplyScalar(.32).toArray());}
  const sparks=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3)),new T.LineBasicMaterial({color:0xffe8a3,transparent:true,depthWrite:false,toneMapped:false}));sparks.position.copy(to);
  root.add(impact,ring,sparks);
  const effect={root,from:from.clone(),to:to.clone(),origins:origins.map(p=>p.clone()),ends,axis:axis.clone(),barrels,...barrels[0],impact,ring,sparks,kind:'shot',rail:true,age:0,life:.34};sampleRailShot(effect,0);return effect;
}
export function sampleRailShot(e,age){
  e.root.visible=age>=0&&age<e.life;
  const flash=Math.max(0,1-age/.13),decay=Math.max(0,1-age/e.life);
  for(const b of e.barrels){b.beam.visible=b.halo.visible=flash>0;b.beam.material.opacity=Math.sqrt(flash);b.halo.material.opacity=flash*.28;
    b.muzzle.visible=age<.10;b.muzzle.scale.setScalar(1+age*5);b.muzzle.material.opacity=Math.max(0,1-age/.10);}
  e.impact.scale.setScalar(.8+Math.min(age,.12)*9);e.impact.material.uniforms.opacity.value=Math.max(0,1-age/.24);
  e.ring.scale.setScalar(1+age*10);e.ring.material.opacity=decay*.85;
  e.sparks.scale.setScalar(1+age*6);e.sparks.material.opacity=decay;
}
