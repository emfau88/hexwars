import * as T from 'three';
// Selected original Mixed Squads geometry / texture helpers; no map or runtime imports.
const fract=n=>n-Math.floor(n),mix=T.MathUtils.lerp,clamp=T.MathUtils.clamp;
const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
const smooth=t=>t*t*(3-2*t);
function noise(x,y){const a=Math.floor(x),b=Math.floor(y),u=smooth(fract(x)),v=smooth(fract(y));return mix(mix(hash(a,b),hash(a+1,b),u),mix(hash(a,b+1),hash(a+1,b+1),u),v);}
function canvasTexture(canvas,colour=true){const t=new T.CanvasTexture(canvas);if(colour)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;}
function canvas(size){const c=document.createElement('canvas');c.width=c.height=size;return c;}
function weatherMap(kind){
 const c=canvas(512),ctx=c.getContext('2d'),d=ctx.createImageData(512,512);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const broad=noise(x/85,y/95),grain=hash(x,y),fine=noise(x/8,y/8),pits=grain>.984?-32:0;
  const value=kind==='concrete'?163+broad*28+fine*8+grain*9+pits:156+broad*22+grain*7+(hash(x,Math.floor(y/61))>.992?24:0);
  const k=(y*512+x)*4;d.data[k]=value;d.data[k+1]=value+(kind==='concrete'?-2:2);d.data[k+2]=value+(kind==='concrete'?-9:3);d.data[k+3]=255;
 }ctx.putImageData(d,0,0);return canvasTexture(c);
}

function geometry(tris,colours=null,uvScale=.63){
 const p=[],uv=[],colors=[],colour=new T.Color();
 for(let i=0;i<tris.length;i++){
  const tri=tris[i],a=new T.Vector3(...tri[0]),b=new T.Vector3(...tri[1]),c=new T.Vector3(...tri[2]),normal=b.sub(a).cross(c.sub(a)).normalize();
  for(const v of tri){p.push(...v);const axis=Math.abs(normal.y)>.62?'y':Math.abs(normal.x)>Math.abs(normal.z)?'x':'z';uv.push((axis==='x'?v[2]:v[0])*uvScale,(axis==='y'?v[2]:v[1])*uvScale);if(colours){colour.set(colours[i]);colors.push(colour.r,colour.g,colour.b);}}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(colours)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}

const addQuad=(out,a,b,c,d)=>out.push([a,b,c],[a,c,d]);

const footprints=[
 [[-.60,-.28],[-.22,-.48],[.18,-.39],[.49,-.14],[.38,.32],[-.14,.47],[-.51,.22]],
 [[-.56,-.37],[.14,-.46],[.53,-.24],[.62,.02],[.28,.40],[-.40,.30]],
 [[-.45,-.38],[-.04,-.53],[.41,-.30],[.45,.18],[.08,.45],[-.30,.30],[-.61,.05]],
 [[-.67,-.15],[-.12,-.42],[.45,-.30],[.56,.22],[.22,.39],[-.49,.26]],
 [[-.50,-.45],[.14,-.38],[.57,-.11],[.41,.41],[-.25,.35],[-.55,.12]],
 [[-.43,-.28],[.30,-.41],[.60,.15],[.18,.42],[-.54,.31]],
 [[-.60,-.20],[.11,-.48],[.52,-.06],[.29,.29],[-.26,.43]],
];
function rockGeometry(variant){
 const outline=footprints[variant%footprints.length],seed=variant+13,tris=[],colours=[],levels=[[0,.90],[.10,1],[.29,.94],[.34,1.02],[.56,.83],[.61,.90],[.84,.68],[1,.48]];
 const point=(i,l)=>{const [y,r]=levels[l],p=outline[i],leanX=y*(hash(seed,1)-.5)*.48,leanZ=y*(hash(seed,2)-.5)*.34;return [p[0]*r+leanX,y*(.87+hash(i+seed,3)*.2),p[1]*r+leanZ];};
 for(let l=0;l<levels.length-1;l++)for(let i=0;i<outline.length;i++){
  addQuad(tris,point(i,l),point(i,l+1),point((i+1)%outline.length,l+1),point((i+1)%outline.length,l));
  const shade=new T.Color().setRGB(1,1,1).multiplyScalar(.80+levels[l][0]*.2+(hash(i,seed)-.5)*.1);colours.push(shade.getHex(),shade.getHex());
 }
 const top=outline.map((p,i)=>point(i,levels.length-1)),center=top.reduce((a,p)=>a.map((v,i)=>v+p[i]/top.length),[0,0,0]);center[1]+=.022;
 for(let i=0;i<top.length;i++){tris.push([center,top[(i+1)%top.length],top[i]]);colours.push(0xefefdf);}
 return geometry(tris,colours,.85);
}

function grassGeometry(seed,leafy=false){
 const tri=[],colours=[],count=leafy?8:18;
 const palette=leafy?[0x456f56,0x648e60,0x83b878,0x547c59]:[0x769b58,0x91af68,0xa4b97a,0x648e60];
 for(let i=0;i<count;i++){
  const a=hash(i+seed,1)*Math.PI*2,r=Math.sqrt(hash(i+seed,2))*.30,x=Math.cos(a)*r,z=Math.sin(a)*r,h=(leafy?.26:.14)+hash(i+seed,3)*(leafy?.32:.18),lean=.09+hash(i+seed,4)*.15;
  const dx=Math.cos(a),dz=Math.sin(a),sideX=-dz,sideZ=dx,w=leafy?.047:.021;
  const rows=[];for(let j=0;j<=3;j++){const t=j/3,width=w*(1-t*.91)*(leafy?Math.sin(.3+t*Math.PI*.85):1),cx=x+dx*lean*t*t,cz=z+dz*lean*t*t,cy=h*t;rows.push([[cx+sideX*width,cy,cz+sideZ*width],[cx,cy+.013*Math.sin(t*Math.PI),cz],[cx-sideX*width,cy,cz-sideZ*width]]);}
  for(let j=0;j<3;j++){addQuad(tri,rows[j][0],rows[j+1][0],rows[j+1][1],rows[j][1]);addQuad(tri,rows[j][1],rows[j+1][1],rows[j+1][2],rows[j][2]);for(let q=0;q<4;q++)colours.push(palette[(i+(q<2?0:1))%palette.length]);}
  if(leafy)for(const t of [.35,.60,.82])for(const side of [-1,1]){
   const cx=x+dx*lean*t*t,cz=z+dz*lean*t*t,cy=h*t,length=.17+(1-t)*.11,lx=sideX*side,lz=sideZ*side,width=.067;
   const rows=[];for(let k=0;k<=4;k++){const u=k/4,spread=Math.sin(u*Math.PI)*width,px=cx+lx*length*u,pz=cz+lz*length*u,py=cy+Math.sin(u*Math.PI*.82)*.075;rows.push([[px+dx*spread,py,pz+dz*spread],[px,py+.011*Math.sin(u*Math.PI),pz],[px-dx*spread,py,pz-dz*spread]]);}
   for(let k=0;k<4;k++){addQuad(tri,rows[k][0],rows[k+1][0],rows[k+1][1],rows[k][1]);addQuad(tri,rows[k][1],rows[k+1][1],rows[k+1][2],rows[k][2]);for(let j=0;j<4;j++)colours.push(palette[(i+j%2)%palette.length]);}
  }
 }
 const g=geometry(tri,colours),p=g.attributes.position,n=g.attributes.normal,sums=new Map(),colorSums=new Map(),colors=g.attributes.color;
 const key=i=>`${p.getX(i).toFixed(5)},${p.getY(i).toFixed(5)},${p.getZ(i).toFixed(5)}`;
 for(let i=0;i<p.count;i++){const k=key(i);if(!sums.has(k))sums.set(k,new T.Vector3());sums.get(k).add(new T.Vector3().fromBufferAttribute(n,i));if(!colorSums.has(k))colorSums.set(k,{sum:new T.Vector3(),count:0});const entry=colorSums.get(k);entry.sum.add(new T.Vector3().fromBufferAttribute(colors,i));entry.count++;}
 for(let i=0;i<p.count;i++){const v=sums.get(key(i)).clone().normalize();n.setXYZ(i,v.x,v.y,v.z);const entry=colorSums.get(key(i)),c=entry.sum.clone().divideScalar(entry.count);colors.setXYZ(i,c.x,c.y,c.z);}return g;
}

export {hash,noise,canvasTexture,canvas,weatherMap,geometry,rockGeometry,grassGeometry};