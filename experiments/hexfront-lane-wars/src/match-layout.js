import {routePoint} from './routes.js';
import {LENGTH,UNITS} from './rules.js';

export const FACTORY_X = [-5.7, -3.6, 3.6, 5.7];
export const baseSign = owner => owner === 'orange' ? 1 : -1;
// Join the existing road just outside the outer buildings, not at its inner tip.
// This is a physical lane entrance; the inherited M1 combat rules are unchanged.
export const ENTRY_PROGRESS = 4;
export const laneEntry = owner => owner === 'orange' ? ENTRY_PROGRESS : LENGTH-ENTRY_PROGRESS;
export function factoryPosition(owner,slot) { return {x:FACTORY_X[slot],z:10.5*baseSign(owner)}; }

const curves=new Map();
function curve(slot,lane,lateral=0) {
  const key=[slot,lane,lateral].join(':');
  if(curves.has(key))return curves.get(key);
  // Build once in orange coordinates and mirror z for blue, including tangents.
  // The narrow gate formation fans out into the actual lateral lane positions.
  const start={x:(slot===null?0:FACTORY_X[slot])+lateral*.4,z:9.4};
  const end=routePoint(lane,ENTRY_PROGRESS,lateral);
  const ahead=routePoint(lane,ENTRY_PROGRESS+.001,lateral);
  const size=Math.hypot(ahead.x-end.x,ahead.z-end.z);
  const tangent={x:(ahead.x-end.x)/size,z:(ahead.z-end.z)/size};
  const gap={x:Math.abs(end.x-start.x),z:start.z-end.z};
  const handle=Math.min(.85,gap.x*.4/Math.abs(tangent.x),gap.z*.4/Math.abs(tangent.z));
  const controls=[start,{x:start.x,z:start.z-Math.min(.65,gap.z*.35)},
    {x:end.x-tangent.x*handle,z:end.z-tangent.z*handle},end];
  const sample=t=>{
    const s=1-t,[a,b,c,d]=controls;
    return {x:s*s*s*a.x+3*s*s*t*b.x+3*s*t*t*c.x+t*t*t*d.x,
      z:s*s*s*a.z+3*s*s*t*b.z+3*s*t*t*c.z+t*t*t*d.z};
  };
  let length=0;
  const points=Array.from({length:257},(_,i)=>{
    const t=i/256,p=sample(t);
    if(i){const previous=sample((i-1)/256);length+=Math.hypot(p.x-previous.x,p.z-previous.z);}
    return {...p,t,arc:length};
  });
  const result={controls,points,length,sample};curves.set(key,result);return result;
}
export function exitPath(owner,slot,lane,lateral=0) {
  const sign=baseSign(owner);
  return curve(slot,lane,lateral).points.map(p=>({x:p.x,z:p.z*sign}));
}
export function pathLength(points) { return points.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-points[i].x,p.z-points[i].z),0); }
export function exitDuration(owner,slot,lane,type,lateral=0) {
  return curve(slot,lane,lateral).length/UNITS[type].speed;
}
export function exitPose(unit,time) {
  const c=curve(unit.factory,unit.lane,unit.x||0),sign=baseSign(unit.owner);
  const distance=Math.max(0,Math.min(c.length,(time-unit.spawnTime)*UNITS[unit.type].speed));
  let lo=1,hi=c.points.length-1;
  while(lo<hi){const mid=(lo+hi)>>1;if(c.points[mid].arc<distance)lo=mid+1;else hi=mid;}
  const a=c.points[lo-1],b=c.points[lo],fraction=b.arc===a.arc?0:(distance-a.arc)/(b.arc-a.arc);
  const t=a.t+(b.t-a.t)*fraction,s=1-t,p={x:a.x+(b.x-a.x)*fraction,z:a.z+(b.z-a.z)*fraction},[v0,v1,v2,v3]=c.controls;
  const dx=3*s*s*(v1.x-v0.x)+6*s*t*(v2.x-v1.x)+3*t*t*(v3.x-v2.x);
  const dz=(3*s*s*(v1.z-v0.z)+6*s*t*(v2.z-v1.z)+3*t*t*(v3.z-v2.z))*sign;
  return {x:p.x,z:p.z*sign,yaw:Math.atan2(-dx,-dz)};
}
export function exitPoint(unit,time) { const {x,z}=exitPose(unit,time);return {x,z}; }
