// Elevation is measured UP from the horizontal XZ ground plane.
export const CAMERA_VIEWS={tactical:70,diorama:55};
export const MAX_ZOOM=2.2;
export function cameraBasis(elevation,azimuth=Math.atan2(7.5,20)){
  const a=elevation*Math.PI/180,s=Math.sin(azimuth),c=Math.cos(azimuth);
  return {right:[c,0,-s],up:[-s*Math.sin(a),Math.cos(a),-c*Math.sin(a)],out:[s*Math.cos(a),Math.sin(a),c*Math.cos(a)]};
}
export function projectedBounds(points,basis){
  let minU=Infinity,maxU=-Infinity,minV=Infinity,maxV=-Infinity;
  for(let i=0;i<points.length;i+=3){const x=points[i],y=points[i+1],z=points[i+2],u=x*basis.right[0]+y*basis.right[1]+z*basis.right[2],v=x*basis.up[0]+y*basis.up[1]+z*basis.up[2];minU=Math.min(minU,u);maxU=Math.max(maxU,u);minV=Math.min(minV,v);maxV=Math.max(maxV,v);}
  return {minU,maxU,minV,maxV};
}
export function frameBattlefield(bounds,width,height,zoom=1,pan={u:0,v:0},padding=18){
  const spanU=bounds.maxU-bounds.minU,spanV=bounds.maxV-bounds.minV;
  const fitScale=Math.min(Math.max(1,width-2*padding)/spanU,Math.max(1,height-2*padding)/spanV);
  const scale=fitScale*zoom,halfW=width/(2*scale),halfH=height/(2*scale);
  // A zoomed view may reach the perimeter but cannot move past the battlefield.
  const limitU=Math.max(0,spanU/2+padding/scale-halfW),limitV=Math.max(0,spanV/2+padding/scale-halfH);
  const u=Math.max(-limitU,Math.min(limitU,pan.u)),v=Math.max(-limitV,Math.min(limitV,pan.v));
  return {scale,fitScale,halfW,halfH,u,v,limitU,limitV,centerU:(bounds.minU+bounds.maxU)/2+u,centerV:(bounds.minV+bounds.maxV)/2+v};
}
