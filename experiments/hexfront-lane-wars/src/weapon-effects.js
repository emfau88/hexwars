import * as T from 'three';

export const shotColor=owner=>owner==='blue'?0x27bfff:0xff9b29;
export const effectMaterial=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,toneMapped:false});
// CSS-pixel widths, independent of device pixel ratio. Never modify the shot endpoints.
export function effectRadius(worldRadius,pixels,pixelsPerUnit=32){return Math.max(worldRadius,pixels/(2*Math.max(1,pixelsPerUnit)));}
export function streak(from,to,radius,color,opacity=1){
 const delta=to.clone().sub(from),mesh=new T.Mesh(new T.CylinderGeometry(1,1,1,6),effectMaterial(color,opacity));
 mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());mesh.scale.set(radius,Math.max(.001,delta.length()),radius);return mesh;
}
export function flash(position,color,size){
 const mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.ShaderMaterial({uniforms:{opacity:{value:1},tint:{value:new T.Color(color)}},transparent:true,depthWrite:false,depthTest:false,
 vertexShader:'varying vec2 uv0; void main(){uv0=uv; vec4 p=modelViewMatrix*vec4(0.,0.,0.,1.); vec2 s=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz)); gl_Position=projectionMatrix*(p+vec4(position.xy*s,0.,0.));}',
 fragmentShader:'varying vec2 uv0; uniform float opacity; uniform vec3 tint; void main(){float d=length(uv0-.5)*2.; float a=1.-smoothstep(.12,1.,d); vec3 c=mix(tint,vec3(1.),1.-smoothstep(.05,.5,d)); gl_FragColor=vec4(c,a*a*opacity);}'
 }));mesh.position.copy(position);mesh.scale.setScalar(size);mesh.renderOrder=4;return mesh;
}
export function createMechShot(from,to,owner='orange'){
 const color=shotColor(owner),root=new T.Group(),axis=to.clone().sub(from).normalize(),tip=from.clone().addScaledVector(axis,.32);
 const outline=streak(from,tip,.08,0x493d30,.45),halo=streak(from,tip,.06,color),core=streak(from,tip,.027,0xfff9ec);
 core.renderOrder=3;halo.renderOrder=2;outline.renderOrder=1;
 const muzzle=flash(from,color,.48),impact=flash(to,color,.55);
 const ring=new T.Mesh(new T.RingGeometry(.72,.8,32),effectMaterial(color));ring.material.side=T.DoubleSide;ring.rotation.x=-Math.PI/2;ring.position.copy(to);ring.position.y-=.56;
 root.add(outline,halo,core,muzzle,impact,ring);
 const e={root,from:from.clone(),to:to.clone(),axis,outline,halo,core,muzzle,impact,ring,age:0,life:.28,kind:'shot',mech:true,owner};sampleMechShot(e,0);return e;
}
export function sampleMechShot(e,age,pixelsPerUnit=32){
 const flight=.12,t=T.MathUtils.clamp(age/flight,0,1),length=e.from.distanceTo(e.to),boltLength=Math.min(length,Math.max(.5,8/pixelsPerUnit)),head=e.from.clone().addScaledVector(e.axis,boltLength+(length-boltLength)*t),tail=head.clone().addScaledVector(e.axis,-boltLength);
 // Start at the muzzle; a short bolt travels visually while the authoritative hit is immediate.
 const center=head.clone().add(tail).multiplyScalar(.5);
 for(const [mesh,radius,pixels] of [[e.outline,.085,5],[e.halo,.06,3.6],[e.core,.027,1.8]]){mesh.position.copy(center);mesh.scale.set(effectRadius(radius,pixels,pixelsPerUnit),head.distanceTo(tail),effectRadius(radius,pixels,pixelsPerUnit));mesh.visible=age<flight;}
 e.root.visible=age>=0&&age<e.life;
 e.muzzle.scale.setScalar(Math.max(.48,11/pixelsPerUnit));e.muzzle.material.uniforms.opacity.value=Math.max(0,1-age/.10);
 e.impact.scale.setScalar(Math.max(.55,13/pixelsPerUnit)*(1+age*2));e.impact.material.uniforms.opacity.value=Math.max(0,1-age/.22);
 e.ring.scale.setScalar(Math.min(1,.3+age*4));e.ring.material.opacity=Math.max(0,1-age/e.life)*.7;
}
// Amplify only existing rigid weapon/upper-body tracks; source geometry and locomotion stay untouched.
export function readableMechClips(clips){return clips.map(clip=>{
 if(clip.name!=='Attack')return clip;
 const result=clip.clone(),q=new T.Quaternion(),base=new T.Quaternion();
 for(const track of result.tracks){
  if(track.name==='Barrel.position'){const rest=Array.from(track.values.slice(0,3));for(let i=0;i<track.values.length;i++)track.values[i]=rest[i%3]+(track.values[i]-rest[i%3])*2;}
  if(['Elbow_R.quaternion','Torso.quaternion'].includes(track.name)){base.fromArray(track.values,0);for(let i=0;i<track.values.length;i+=4){q.fromArray(track.values,i);q.slerpQuaternions(base,q,1.5).toArray(track.values,i);}}
 }
 return result;
});}
