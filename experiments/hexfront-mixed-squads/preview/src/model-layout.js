// Authored local coordinates: both supplied robots face -Z. The mech's gun is
// on +X (its right arm), measured on the GLB before its .77 m normalization.
export const MUZZLE={drone:[0,-.04,-.32],mech:[.332,.378,-.285]};
export const DEPLOY_SECONDS=1.2;
export const hqYaw=cell=>cell.hq==='orange'?Math.PI:0;
export function hqPoint(cell,x,z){const yaw=hqYaw(cell),c=Math.cos(yaw),s=Math.sin(yaw);return {x:cell.x+x*c+z*s,z:cell.z-.10-x*s+z*c};}
export function hqLocal(cell,x,z){const yaw=hqYaw(cell),c=Math.cos(yaw),s=Math.sin(yaw),dx=x-cell.x,dz=z-cell.z+.10;return {x:dx*c-dz*s,z:dx*s+dz*c};}
export const parking=type=>({x:type==='drone'?-.79:.79,z:-.52});
export function deploymentPoint(cell,type,progress){
  const t=Math.max(0,Math.min(1,progress)),park=parking(type);
  const local=t<.5?{x:0,z:-.46-t*1.12}:{x:park.x*(t-.5)*2,z:-1.02+(park.z+1.02)*(t-.5)*2};
  const next=t<.5?{x:0,z:-1.02}:park,previous=t<.5?{x:0,z:-.46}:{x:0,z:-1.02};
  const p=hqPoint(cell,local.x,local.z),a=hqPoint(cell,previous.x,previous.z),b=hqPoint(cell,next.x,next.z);
  return {...p,yaw:Math.atan2(a.x-b.x,a.z-b.z)};
}
