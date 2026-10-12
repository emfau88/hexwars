/** Axial pointy-top hexes. World coordinates are metres; data heights are tiers. */
export const RADIUS = 1.18;
export const STEP = 1.05;
export const DIRECTIONS = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
export const key = (q,r) => `${q},${r}`;
export const distance = (a,b) => Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r));
export const edgeKey = (a,b) => [typeof a==='string'?a:a.id,typeof b==='string'?b:b.id].sort().join('|');
export const RAMPS = new Set([
  edgeKey('-3,1','-2,1'),edgeKey('-2,1','-1,1'),
  edgeKey('3,-1','2,-1'),edgeKey('2,-1','1,-1'),
]);
export function createMap() {
  const cells=[];
  for(let r=-3;r<=3;r++) for(let q=Math.max(-3,-r-3);q<=Math.min(3,-r+3);q++) {
    const id=key(q,r), d=distance({q,r},{q:0,r:0});
    const height=d<=1?2:(id==='-2,1'||id==='2,-1'?1:0);
    const hq=id==='-2,3'?'orange':id==='2,-3'?'blue':null;
    const owner=hq||(['-2,2','-1,2'].includes(id)?'orange':['2,-2','1,-2'].includes(id)?'blue':'neutral');
    const kind=hq?'hq':id==='0,0'?'relay':height===1?'ramp':'field';
    cells.push({id,q,r,x:Math.sqrt(3)*RADIUS*(q+r/2),z:1.5*RADIUS*r,height,kind,hq,owner,
      units:hq?(owner==='orange'?40:36):owner!=='neutral'?9:kind==='relay'?12:height===2?4:3,
      name:hq?(hq==='orange'?'Kommando Süd':'Kommando Nord'):kind==='relay'?'Relais der Zitadelle':height===1?(q<0?'Westaufstieg':'Ostaufstieg'):height===2?'Festungsplateau':'Felsvorland'});
  }
  return cells;
}
export function neighbors(cells,cell) { return cells.filter(other=>distance(cell,other)===1); }
export function traversable(a,b) {
  return !!a&&!!b&&distance(a,b)===1&&(a.height===b.height||RAMPS.has(edgeKey(a,b)));
}
/** Only friendly intermediate nodes; the final node may be hostile. */
export function route(cells,from,to,owner=from?.owner) {
  if(!from||!to||from===to||from.owner!==owner)return null;
  const queue=[[from]], seen=new Set([from.id]);
  for(let i=0;i<queue.length;i++) {
    const path=queue[i],last=path.at(-1);
    for(const next of neighbors(cells,last)) {
      if(seen.has(next.id)||!traversable(last,next))continue;
      if(next.id===to.id)return [...path,next];
      if(next.owner===owner){seen.add(next.id);queue.push([...path,next]);}
    }
  }
  return null;
}
export function graphDistance(cells,a,b) {
  const queue=[[a,0]],seen=new Set([a.id]);
  for(let i=0;i<queue.length;i++){
    const [c,d]=queue[i];if(c.id===b.id)return d;
    for(const n of neighbors(cells,c))if(!seen.has(n.id)&&traversable(c,n)){seen.add(n.id);queue.push([n,d+1]);}
  }return Infinity;
}
export function corner(cell,i) {
  const angle=(i*60-30)*Math.PI/180;
  return {x:cell.x+RADIUS*Math.cos(angle),z:cell.z+RADIUS*Math.sin(angle)};
}
/** The vertices on a ramp's shared edge meet at the same half-tier height. */
export function cornerHeight(cells,cell,i) {
  const p=corner(cell,i);let h=cell.height*STEP;
  for(const n of neighbors(cells,cell))if(RAMPS.has(edgeKey(cell,n))) {
    const mid={x:(cell.x+n.x)/2,z:(cell.z+n.z)/2};
    if(Math.hypot(p.x-mid.x,p.z-mid.z)<RADIUS*.51)h=(cell.height+n.height)*STEP/2;
  }return h;
}
export function surfaceHeight(cells,cell,x,z) {
  // Same triangular fan as the visible and pickable terrain mesh.
  const px=x-cell.x,pz=z-cell.z;
  for(let i=0;i<6;i++){
    const a=corner(cell,i),b=corner(cell,(i+1)%6);
    const ax=a.x-cell.x,az=a.z-cell.z,bx=b.x-cell.x,bz=b.z-cell.z;
    const det=ax*bz-az*bx,u=(px*bz-pz*bx)/det,v=(ax*pz-az*px)/det;
    if(u>=-.001&&v>=-.001&&u+v<=1.002)return (1-u-v)*cell.height*STEP+u*cornerHeight(cells,cell,i)+v*cornerHeight(cells,cell,(i+1)%6);
  }return cell.height*STEP;
}
