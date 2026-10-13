import * as T from 'three';
import {riverCenter,LAND_EXTENT} from './landscape.js';

/** Authored shallow river ribbon, below the land and causeways. No playable water. */
export function buildRiver(scene){
 const positions=[],uvs=[];
 const segments=160;
 const point=(i,side)=>{const x=-LAND_EXTENT+i/segments*LAND_EXTENT*2;return [x,-.31,riverCenter(x)+side*6];};
 for(let i=0;i<segments;i++){
  const a=point(i,-1),b=point(i,1),c=point(i+1,1),d=point(i+1,-1);
  for(const tri of [[a,b,c],[a,c,d]])for(const p of tri){positions.push(...p);uvs.push(p[0]*.25,p[2]*.4);}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.computeVertexNormals();
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const context=canvas.getContext('2d'),data=context.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const u=x/256*Math.PI*2,v=y/256*Math.PI*2,k=(y*256+x)*4;
  data.data[k]=128+Math.cos(u*3+Math.sin(v*2)) * 17;
  data.data[k+1]=128+Math.sin(v*5+Math.cos(u*2))*23;data.data[k+2]=252;data.data[k+3]=255;
 }
 context.putImageData(data,0,0);const normal=new T.CanvasTexture(canvas);normal.wrapS=normal.wrapT=T.RepeatWrapping;
 const mat=new T.MeshStandardMaterial({color:0x477e80,roughness:.46,metalness:.17,normalMap:normal,normalScale:new T.Vector2(.40,.40)});
 const river=new T.Mesh(geo,mat);river.receiveShadow=true;river.userData.pickKind='water';scene.landscape.add(river);scene.riverNormal=normal;
 // Sparse foam ripples. Horizontal strips sit below the field surfaces and do
 // not mimic navigable hexes. No billboard, downloaded image or particle emitter.
 const lines=[],colours=[];
 for(let i=0;i<140;i++){
  const x=-56+i*.8,z=Math.sin(i*2.17)*.77+riverCenter(x),len=.10+(Math.sin(i*7.1)*.5+.5)*.19;
  lines.push(x,-.296,z,x+len,-.296,z+.016);const c=new T.Color(i%3?0x9cbdb0:0xc3d3b9);colours.push(c.r,c.g,c.b,c.r,c.g,c.b);
 }
 const ripples=new T.BufferGeometry();ripples.setAttribute('position',new T.Float32BufferAttribute(lines,3));ripples.setAttribute('color',new T.Float32BufferAttribute(colours,3));
 const strokes=new T.LineSegments(ripples,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.38}));scene.landscape.add(strokes);
}
