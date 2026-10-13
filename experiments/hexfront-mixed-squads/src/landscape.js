import * as T from 'three';
import {RADIUS,corner} from './map.js';

export const LAND_EXTENT=64;
export const riverCenter=x=>Math.sin(x*.19)*.65;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

// Decoration only: this mesh never enters navigation, picking or camera bounds.
export function landscapeHeight(game,x,z){
 const distance=Math.min(...game.cells.map(c=>Math.hypot(c.x-x,c.z-z)));
 const away=smooth((distance-2.2)/5),rolling=.65+Math.sin(x*.23+z*.16)*.42+Math.cos(z*.31-x*.12)*.28;
 if(game.missionId==='morgenwacht')return away*rolling;
 const valley=game.missionId==='auenstrom'?Math.abs(z-riverCenter(x)):Math.abs(z-Math.sin(x*.22)*1.4);
 const bank=smooth((valley-1.7)/3.6);
 const base=-1.13*(1-smooth((valley-2.6)/1.6));
 // Keep a small depth separation below the authored shore apron.
 return base-.02+away*bank*(game.missionId==='windpass'?3.6+rolling*1.3:1.4+rolling*.5);
}

export function buildLandscape(s){
 const group=new T.Group();group.userData.landscape=true;s.static.add(group);s.landscape=group;
 const playable=new Set(s.game.cells.map(c=>c.id)),positions=[],uv=[];
 for(let r=-32;r<=32;r++)for(let q=-32;q<=32;q++){
  if(playable.has(`${q},${r}`))continue;
  const c={x:Math.sqrt(3)*RADIUS*(q+r/2),z:1.5*RADIUS*r};
  const center=[c.x,landscapeHeight(s.game,c.x,c.z),c.z];
  for(let i=0;i<6;i++){
   const a=corner(c,i),b=corner(c,(i+1)%6);
   for(const p of [center,[b.x,landscapeHeight(s.game,b.x,b.z),b.z],[a.x,landscapeHeight(s.game,a.x,a.z),a.z]]){
    positions.push(...p);uv.push(p[0]/(LAND_EXTENT*2)+.5,p[2]/(LAND_EXTENT*2)+.5);
   }
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
 // Share lighting across triangle/hex boundaries; the surroundings must read
 // as continuous slopes, without decorative hex facets competing with the grid.
 const normals=geo.attributes.normal,sums=new Map(),keys=[];
 for(let i=0;i<positions.length/3;i++){
  const key=positions.slice(i*3,i*3+3).map(n=>n.toFixed(4)).join(',');keys.push(key);
  if(!sums.has(key))sums.set(key,new T.Vector3());sums.get(key).add(new T.Vector3().fromBufferAttribute(normals,i));
 }
 for(const v of sums.values())v.normalize();
 keys.forEach((key,i)=>{const v=sums.get(key);normals.setXYZ(i,v.x,v.y,v.z);});
 const ground=new T.Mesh(geo,s.materials.landscape);ground.receiveShadow=true;group.add(ground);
 return group;
}
