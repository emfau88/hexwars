import {Vector3,MathUtils} from 'three';

// Presentation-only input for Lane Wars. Multi-touch can never issue a unit/factory/lane tap.
export function bindMatchCamera(view){
 const stage=view.stage,points=new Map(),listeners=[];
 let drag=null,pinch=null,consumed=false;
 const on=(name,fn,options)=>{stage.addEventListener(name,fn,options);listeners.push([name,fn,options]);};
 const position=e=>({x:e.clientX,y:e.clientY});
 function pair(){const [a,b]=points.values();return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};}
 function rebase(){
  if(points.size>=2){const rect=stage.getBoundingClientRect(),p=pair();pinch={...p,zoom:view.zoom,anchor:new Vector3((p.x-rect.left)/rect.width*2-1,1-(p.y-rect.top)/rect.height*2,0).unproject(view.camera)};drag=null;consumed=true;}
  else if(points.size===1){const [p]=points.values();drag={...p,u:view.pan.u,v:view.pan.v,moved:consumed};pinch=null;}
  else{drag=null;pinch=null;}
 }
 on('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(!points.size)consumed=false;points.set(e.pointerId,position(e));stage.setPointerCapture(e.pointerId);rebase();
 });
 on('pointermove',e=>{
  if(!points.has(e.pointerId))return;points.set(e.pointerId,position(e));
  if(points.size>=2){
   e.preventDefault();const next=pair(),rect=stage.getBoundingClientRect();
   const anchor=pinch.anchor.clone();
   view.zoom=MathUtils.clamp(pinch.zoom*next.d/pinch.d,1,3.2);view.resize();
   // Retain the world point under the fingers while they spread and/or translate.
   const projected=anchor.project(view.camera),x=rect.left+(projected.x+1)*rect.width/2,y=rect.top+(1-projected.y)*rect.height/2;
   view.pan={u:view.pan.u+(x-next.x)/view.frame.scale,v:view.pan.v+(next.y-y)/view.frame.scale};view.resize();
  }else if(drag){
   const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5){drag.moved=true;consumed=true;}
   if(drag.moved){view.pan={u:drag.u-dx/view.frame.scale,v:drag.v+dy/view.frame.scale};view.resize();}
  }
 });
 function finish(e,cancelled){
  if(!points.has(e.pointerId))return;const tap=!cancelled&&!consumed&&points.size===1&&drag&&!drag.moved;
  if(cancelled)consumed=true;points.delete(e.pointerId);rebase();if(tap)view.pick(e);
 }
 on('pointerup',e=>finish(e,false));on('pointercancel',e=>finish(e,true));on('lostpointercapture',e=>finish(e,true));
 // Suppress the browser's compatibility click after pinch/drag, including supply targeting.
 on('click',e=>{if(consumed){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
 on('wheel',e=>{e.preventDefault();view.zoomBy(Math.exp(-e.deltaY*.001));},{passive:false});
 return ()=>{for(const [name,fn,options] of listeners)stage.removeEventListener(name,fn,options);points.clear();};
}
