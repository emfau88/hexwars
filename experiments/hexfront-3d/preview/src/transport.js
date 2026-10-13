import {getMission} from './missions.js';
import {surfaceHeight} from './map.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
// The existing decoration locations are shared with art.js. They never enter
// the movement graph; a drone only gains enough visual height to clear them.
export const RUINS=getMission().art.ruins;
export function structureClearance(game,x,z,ground=0){
 let clearance=0;
 for(const c of game.cells)if(c.kind==='hq'||c.kind==='relay'){
  const d=Math.hypot(x-c.x,z-(c.z-.10)),u=clamp((1.65-d)/.90,0,1);
  clearance=Math.max(clearance,(c.kind==='hq'?1.25:1.43)*u*u*(3-2*u));
 }
 for(const [rx,rz,length,base,angle] of getMission(game.missionId).art.ruins){
  const dx=x-rx,dz=z-rz,c=Math.cos(angle),s=Math.sin(angle);
  const outside=Math.hypot(Math.max(0,Math.abs(dx*c-dz*s)-length/2),Math.max(0,Math.abs(dx*s+dz*c)-.25));
  const u=clamp((.85-outside)/.45,0,1);
  clearance=Math.max(clearance,Math.max(0,base+.65-ground)*u*u*(3-2*u));
 }
 return clearance;
}
// Cubic Hermite endpoints keep route nodes exact. Only departure and terminal
// arrival ease; owned intermediate edges retain speed and continuous position.
export function transportEase(t,depart,arrive){
 t=clamp(t,0,1);const a=depart?.22:1,b=arrive?.22:1;
 return (t*t*t-2*t*t+t)*a+(-2*t*t*t+3*t*t)+(t*t*t-t*t)*b;
}
export function transportPose(game,order,seconds=0,reduced=false){
 const a=game.cell(order.path[order.segment]),b=game.cell(order.path[order.segment+1]);
 const final=order.segment===order.path.length-2||b.owner!==order.owner;
 const t=transportEase(order.progress,order.segment===0,final),x=mix(a.x,b.x,t),z=mix(a.z,b.z,t);
 const ground=surfaceHeight(game.cells,t<.5?a:b,x,z);let yaw=Math.atan2(a.x-b.x,a.z-b.z);
 const smooth=u=>u*u*(3-2*u),turn=(a,b,u)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*u;
 if(t<.2&&order.segment>0){const p=game.cell(order.path[order.segment-1]);yaw=turn(Math.atan2(p.x-a.x,p.z-a.z),yaw,.5+.5*smooth(t/.2));}
 else if(t>.8&&!final){const n=game.cell(order.path[order.segment+2]);yaw=turn(yaw,Math.atan2(b.x-n.x,b.z-n.z),.5*smooth((t-.8)/.2));}
 const moving=game.running&&!game.paused&&!game.result,bob=reduced?0:Math.sin(seconds*3.2+order.id*1.7)*.012;
 const thrust=(order.segment===0?clamp(order.progress/.20,0,1):1)*(final?clamp((1-order.progress)/.20,0,1):1);
 return {x,z,y:ground+structureClearance(game,x,z,ground)+.34+bob+(reduced?0:thrust*.025),ground,yaw,
  pitch:reduced?0:clamp((b.height-a.height)*.13,-.13,.13)-Math.sin(t*Math.PI)*.035,
  roll:reduced?0:Math.sin(seconds*2+order.id)*.015,thrust:.3+.7*thrust,moving,t};
}
