// Presentation only. Combat distances stay in the unchanged (p, x) lane space.
// Both lanes use the same mirrored curve and the same longitudinal scale.
// Equal-arc-length sampling: the longer, broad routes have identical visual
// speed at every point. The table is presentation data, never combat navigation.
const samples=[];let arc=0;
for(let i=0;i<=300;i++){const t=i/300*Math.PI,x=2+10.5*Math.sin(t),z=8.5*Math.cos(t);if(i)arc+=Math.hypot(x-samples[i-1].x,z-samples[i-1].z);samples.push({x,z,arc,t});}
export const ROUTE_WORLD_LENGTH=arc;
export function routePoint(lane,p,lateral=0) {
  const along=Math.max(0,Math.min(1,p/30))*arc;
  let i=1;while(i<samples.length-1&&samples[i].arc<along)i++;
  const a=samples[i-1],b=samples[i],u=(along-a.arc)/(b.arc-a.arc),sign=lane===0?-1:1,t=a.t+(b.t-a.t)*u;
  const dx=sign*10.5*Math.cos(t),dz=-8.5*Math.sin(t),length=Math.hypot(dx,dz);
  return {x:sign*(a.x+(b.x-a.x)*u)-dz/length*lateral*2,z:a.z+(b.z-a.z)*u+dx/length*lateral*2};
}
export function pathDistance(x,z) {
  // Ellipse distance estimate only for decorative terrain clearance.
  const px=Math.max(0,Math.abs(x)-2),angle=Math.atan2(px/10.5,z/8.5);
  const ex=2+10.5*Math.sin(angle),ez=8.5*Math.cos(angle);
  const lane=Math.hypot(Math.abs(x)-ex,z-ez);
  const apron=Math.hypot(x*.8,Math.abs(z)-10.3);
  return Math.min(lane,apron);
}
export const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x-a)/(b-a))); return t*t*(3-2*t); };
export function groundHeight(x, z) {
  const clear = smooth(2.15, 4.3, pathDistance(x,z)) * (1-smooth(9.5,12.2,Math.abs(z)));
  const center = Math.exp(-((x+1.5)**2/22+(z+1.8)**2/24));
  const west = Math.exp(-((x+17)**2/12+(z-1.6)**2/42));
  const east = Math.exp(-((x-17)**2/16+(z+3)**2/35));
  return clear * (center*1.65+west*1.6+east*.65) + smooth(13,20,Math.abs(z))*.4;
}
