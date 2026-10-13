export * from '../../../hexfront-3d/src/transport.js';
import {transportPose as originalPose,structureClearance as originalClearance} from '../../../hexfront-3d/src/transport.js';
import {surfaceHeight} from './map.js';
import {getMission} from './missions.js';

export const RUINS=getMission().art.ruins;
export function structureClearance(game,x,z,ground=0){
 if(game.missionId!=='morgenwacht')return originalClearance(game,x,z,ground);
 const clamp=v=>Math.max(0,Math.min(1,v));let clearance=0;
 for(const c of game.cells)if(c.kind==='hq'||c.kind==='relay'){
  const u=clamp((1.65-Math.hypot(x-c.x,z-(c.z-.10)))/.90);
  clearance=Math.max(clearance,(c.kind==='hq'?1.25:1.43)*u*u*(3-2*u));
 }
 for(const [rx,rz,length,base,angle] of RUINS){
  const dx=x-rx,dz=z-rz,c=Math.cos(angle),s=Math.sin(angle);
  const outside=Math.hypot(Math.max(0,Math.abs(dx*c-dz*s)-length/2),Math.max(0,Math.abs(dx*s+dz*c)-.25)),u=clamp((.85-outside)/.45);
  clearance=Math.max(clearance,Math.max(0,base+.65-ground)*u*u*(3-2*u));
 }
 return clearance;
}

export function transportPose(game,order,seconds=0,reduced=false){
 const p=originalPose(game,order,seconds,reduced),cell=game.cell(order.path[order.segment+(p.t<.5?0:1)]);
 const ground=surfaceHeight(game.cells,cell,p.x,p.z);
 p.y+=ground+structureClearance(game,p.x,p.z,ground)-p.ground-originalClearance(game,p.x,p.z,p.ground);
 p.ground=ground;return p;
}
