export * from '../../hexfront-3d/src/map.js';
import {STEP,RADIUS,corner,neighbors,isRamp} from '../../hexfront-3d/src/map.js';

// Navigation and height tiers stay shared. Only dedicated slopes absorb the
// elevation difference; an adjoining meadow or plateau never bends toward it.
const slopeCell=cell=>cell.kind==='ramp'||(cell.missionId==='auenstrom'&&cell.kind==='relay');
export function cornerHeight(cells,cell,i){
 if(!slopeCell(cell))return cell.height*STEP;
 const p=corner(cell,i);let height=cell.height*STEP;
 for(const n of neighbors(cells,cell))if(isRamp(cell,n)){
  const mid={x:(cell.x+n.x)/2,z:(cell.z+n.z)/2};
  if(Math.hypot(p.x-mid.x,p.z-mid.z)<RADIUS*.51)height=(slopeCell(n)?(cell.height+n.height)/2:n.height)*STEP;
 }
 return height;
}

const surfaces=new WeakMap();
export function terrainTriangles(cells,cell){
 if(!surfaces.has(cells))surfaces.set(cells,new Map());
 const cache=surfaces.get(cells);if(cache.has(cell.id))return cache.get(cell.id);
 const center=[cell.x,cell.height*STEP,cell.z],triangles=[];
 const outer=Array.from({length:6},(_,i)=>{const p=corner(cell,i);return [p.x,cornerHeight(cells,cell,i),p.z];});
 // The river relay keeps a level landing beneath the building; its two
 // approach slopes are contained in its own edge band.
 const landing=cell.missionId==='auenstrom'&&cell.kind==='relay';
 const inner=landing?outer.map(p=>[cell.x+(p[0]-cell.x)*.68,cell.height*STEP,cell.z+(p[2]-cell.z)*.68]):outer;
 for(let i=0;i<6;i++){
  const j=(i+1)%6;triangles.push([center,inner[j],inner[i]]);
  if(landing)triangles.push([inner[i],inner[j],outer[j]],[inner[i],outer[j],outer[i]]);
 }
 cache.set(cell.id,triangles);return triangles;
}

export function surfaceHeight(cells,cell,x,z){
 if(!slopeCell(cell))return cell.height*STEP;
 for(const [a,b,c] of terrainTriangles(cells,cell)){
  const px=x-a[0],pz=z-a[2],bx=b[0]-a[0],bz=b[2]-a[2],cx=c[0]-a[0],cz=c[2]-a[2];
  const det=bx*cz-bz*cx,u=(px*cz-pz*cx)/det,v=(bx*pz-bz*px)/det;
  if(u>=-.001&&v>=-.001&&u+v<=1.002)return (1-u-v)*a[1]+u*b[1]+v*c[1];
 }
 return cell.height*STEP;
}
