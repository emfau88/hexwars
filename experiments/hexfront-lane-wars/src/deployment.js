import {exitPose} from './match-layout.js';
import {LENGTH,STEP} from './rules.js';

// The central apron and lane use the same (p,x) coordinates. Rendering never
// advances a deployment: elapsed time stops whenever combat acquires a target.
export function deploymentPosition(unit,elapsed) {
  const d=unit.deployment;
  const pose=exitPose({...unit,x:d.lateral,spawnTime:0},elapsed);
  const progress=(9-Math.abs(pose.z))/.6;
  return {p:unit.owner==='orange'?progress:LENGTH-progress,x:pose.x/2,yaw:pose.yaw||0};
}
export function deploymentMove(unit,engaged) {
  if(engaged)return {p:unit.p,x:unit.x,deployment:unit.deployment};
  const elapsed=Math.min(unit.travelDuration,unit.deployment.elapsed+STEP);
  const pose=deploymentPosition(unit,elapsed);
  return {...pose,deployment:elapsed>=unit.travelDuration-1e-9?null:{...unit.deployment,elapsed,yaw:pose.yaw}};
}
