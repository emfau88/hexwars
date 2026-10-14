import {routePoint} from './routes.js';
import {UNITS} from './rules.js';
export const FACTORY_X = [-5.7, -3.6, 3.6, 5.7];
export const baseSign = owner => owner === 'orange' ? 1 : -1;
export function factoryPosition(owner,slot) { return {x:FACTORY_X[slot],z:10.5*baseSign(owner)}; }
export function exitPath(owner,slot,lane) {
  const sign=baseSign(owner),x=slot===null?0:FACTORY_X[slot],entry=routePoint(lane,0),end={x:entry.x,z:entry.z*sign};
  return [{x,z:(slot===null?8.3:9.4)*sign},{x,z:7.4*sign},{x:end.x,z:7.4*sign},end];
}
export function pathLength(points) { return points.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-points[i].x,p.z-points[i].z),0); }
export function exitDuration(owner,slot,lane,type) { return pathLength(exitPath(owner,slot,lane))/UNITS[type].speed; }
export function exitPoint(unit,time) {
  const points=exitPath(unit.owner,unit.factory,unit.lane),total=pathLength(points);
  let distance=Math.max(0,Math.min(total,(time-unit.spawnTime)*UNITS[unit.type].speed));
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(distance<=length||i===points.length-1){const t=length?Math.min(1,distance/length):1;return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};}distance-=length;}
}