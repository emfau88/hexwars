import * as T from 'three';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {hash,noise,canvasTexture,canvas,weatherMap,rockGeometry,grassGeometry} from './art-helpers.js';
import {groundHeight as meadowHeight,pathDistance as meadowDistance,smooth} from './routes.js';

const groundHeight=meadowHeight,pathDistance=meadowDistance;
const firstDistance=(x,z)=>Math.min(Math.abs(x),Math.hypot(x*.8,Math.abs(z)-10.3));
export const firstHeight=(x,z)=>smooth(2.2,5.3,firstDistance(x,z))*(1-smooth(8,12,Math.abs(z)))*(.35+Math.exp(-((Math.abs(x)-7)**2/9+z*z/65)));
const extent=35, size=1024;
const mesh=(parent,g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
function groundTexture(earth,pathDistance=meadowDistance) {
  const c=canvas(size),ctx=c.getContext('2d'),d=ctx.createImageData(size,size);
  const photo=canvas(256),pctx=photo.getContext('2d');pctx.drawImage(earth,0,0,256,256);const pixels=pctx.getImageData(0,0,256,256).data;
  for(let row=0;row<size;row++)for(let col=0;col<size;col++) {
    const x=(col/size-.5)*extent*2,z=(row/size-.5)*extent*2;
    const broad=noise(x*.25+3,z*.25+7),patch=noise(x*.66+9,z*.66+5),fine=hash(col,row);
    const path=pathDistance(x,z),trail=(1-smooth(1.40,3.05,path+(patch-.5)*.8))*(1-smooth(10.3,12.5,Math.abs(z)));
    // Broad worn aprons blend into the two routes, without rectangular bases.
    const apron=1-smooth(2.2,4.7,Math.hypot(x*.9,Math.abs(z)-10.3));
    const worn=Math.max(trail,apron*.9);
    const green=smooth(.15,.82,patch*.6+broad*.4)*(1-worn*.94);
    const grass=[111,142,78],soil=[183,161,123];
    const pi=(((Math.floor(z*38)%256+256)%256)*256+(Math.floor(x*38)%256+256)%256)*4;
    const texture=(pixels[pi]+pixels[pi+1]+pixels[pi+2])/3-115;
    const relief=texture*.2+(fine-.5)*9+(broad-.5)*12;
    const i=(row*size+col)*4;
    for(let k=0;k<3;k++)d.data[i+k]=T.MathUtils.lerp(soil[k],grass[k],green)+relief;
    d.data[i+3]=255;
  }
  ctx.putImageData(d,0,0);return canvasTexture(c);
}
function scatter(parent,geometry,material,poses,shadows=true,height=meadowHeight) {
  const m=new T.InstancedMesh(geometry,material,poses.length),dummy=new T.Object3D();
  poses.forEach((p,i)=>{dummy.position.set(p.x,p.y??height(p.x,p.z),p.z);dummy.rotation.set(0,p.r||0,0);dummy.scale.set(p.w||p.s||1,p.h||p.s||1,p.d||p.w||p.s||1);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});
  m.castShadow=shadows;m.receiveShadow=true;parent.add(m);return m;
}
// Reuse complete source data across mission changes. Geometry/material instances remain view-owned.
let fernSource;
async function loadFern(){
 const base=new URL('../public/nature/',import.meta.url);
 if(!fernSource)fernSource=(async()=>{
  const response=await fetch(new URL('Fern_1.gltf',base));if(!response.ok)throw Error('Farnmodell: HTTP '+response.status);
  const data=await response.json();
  await Promise.all(data.buffers.map(async buffer=>{const response=await fetch(new URL(buffer.uri,base));if(!response.ok)throw Error('Farngeometrie: HTTP '+response.status);const bytes=new Uint8Array(await response.arrayBuffer());buffer.uri='data:application/octet-stream;base64,'+btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));}));
  return JSON.stringify(data);
 })().catch(error=>{fernSource=null;throw error;});
 return (await new GLTFLoader().parseAsync(await fernSource,base.href)).scene;
}

export async function buildLandscape(scene,single=false) {
  const groundHeight=single?firstHeight:meadowHeight,pathDistance=single?firstDistance:meadowDistance;
  const instances=(parent,geometry,material,poses,shadows=true)=>scatter(parent,geometry,material,poses,shadows,groundHeight);
  const root=new T.Group();scene.add(root);
  const loader=new T.TextureLoader(),get=async file=>{const t=await loader.loadAsync(new URL(`../public/materials/${file}.webp`,import.meta.url).href);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(file.endsWith('diff'))t.colorSpace=T.SRGBColorSpace;return t;};
  const [albedo,normal,rough,earth]=await Promise.all(['rock_boulder_dry_diff','rock_boulder_dry_nor_gl','rock_boulder_dry_rough','rock_wall_02_diff'].map(get));
  const groundMap=groundTexture(earth.image,pathDistance),geo=new T.PlaneGeometry(extent*2,extent*2,180,180);geo.rotateX(-Math.PI/2);
  const positions=geo.attributes.position;for(let i=0;i<positions.count;i++)positions.setY(i,groundHeight(positions.getX(i),positions.getZ(i)));geo.computeVertexNormals();
  const ground=mesh(root,geo,new T.MeshStandardMaterial({map:groundMap,bumpMap:groundMap,bumpScale:.06,roughness:.98}));ground.castShadow=false;
  const rock=new T.MeshStandardMaterial({color:0xc3c0a9,map:albedo,normalMap:normal,normalScale:new T.Vector2(.45,.45),roughnessMap:rough,vertexColors:true,roughness:.94});
  const formations=single?[[-7,-1,3,2],[-8,-5,2.2,1.6],[7,2,2.4,1.2],[8,-6,2,1],[-8,8,2,1],[8,10,2,1.4],[-6,4,1.5,.8]]:[[-16.8,0,3.4,2.8],[-15.7,-4.8,2.1,2.5],[-15.1,5.3,2.5,1.8],[-17.6,2.4,2.6,2.0],[-3.8,-2.4,4.2,2.2],[-1.9,.1,2.9,1.4],[-3.6,-4.3,2.5,1.6],[16.7,-5.7,2.3,1.4],[16.2,5.4,1.9,1.0],[-7.6,-11.7,2.2,1.1],[8.3,11.2,2.4,1.3],[-4.8,3.8,1.35,.8],[3.1,-6,1.5,1.05],[-19,9.6,3.7,2.4],[19,2.1,3.3,1.2],[-16,-12.2,3.2,2.7],[16.9,-12.8,3.7,2.0]];  const rocks=Array.from({length:7},()=>[]);
  formations.forEach(([x,z,w,h],i)=>{
    rocks[i%7].push({x,z,w,h,r:hash(i,4)*6.28,y:groundHeight(x,z)-.05});
    for(let j=0;j<5;j++){const a=hash(i,j+90)*6.28,dist=w*.45+hash(i,j+120)*.9,px=x+Math.cos(a)*dist,pz=z+Math.sin(a)*dist;if(pathDistance(px,pz)<2.2&&Math.abs(pz)<10)continue;rocks[(i+j)%7].push({x:px,z:pz,w:.16+hash(i,j+45)*.65,h:.13+hash(i,j+46)*.5,r:a});}
  });
  rocks.forEach((poses,i)=>instances(root,rockGeometry(i),rock,poses));
  const leaf=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.98});
  for(let variant=0;variant<4;variant++) {
    const poses=[];
    for(let i=0;i<190;i++){const n=variant*190+i,x=(hash(n,41)-.5)*46,z=(hash(n,42)-.5)*34;if(pathDistance(x,z)<2.2&&Math.abs(z)<11||Math.hypot(x,Math.abs(z)-10.3)<4.1)continue;poses.push({x,z,s:.6+hash(n,43)*1.0,r:hash(n,44)*6.28});}
    instances(root,grassGeometry(variant+13,variant===0),leaf,poses,variant===0);
  }
  const concreteMap=weatherMap('concrete'),concrete=new T.MeshStandardMaterial({color:0xe1dcc7,map:concreteMap,bumpMap:concreteMap,bumpScale:.025,roughness:.91});
  const jade=new T.MeshStandardMaterial({color:0x78998a,roughness:.8,metalness:.2});
  const dark=new T.MeshStandardMaterial({color:0x4c605b,roughness:.7,metalness:.35});
  // A broken service wall and two inert cabinets: scenery, not capture points.
  const ruin=new T.Group();ruin.position.set(single?-6:1.15,groundHeight(single?-6:1.15,2.9),2.9);ruin.rotation.y=-.22;root.add(ruin);
  for(let i=0;i<4;i++) {const h=[.7,1.1,.58,.32][i];mesh(ruin,new T.BoxGeometry(.67,h,.28),concrete,(i-1.5)*.68,h/2,0);}
  for(const x of [-1.3,1.35]){mesh(ruin,new T.BoxGeometry(.26,1.15,.4),jade,x,.56,-.05);mesh(ruin,new T.BoxGeometry(.18,.07,.07),dark,x,.85,-.29);}
  const panel=mesh(ruin,new T.BoxGeometry(.7,.055,.6),jade,.2,.2,.8);panel.rotation.z=.16;
  for(const [x,z,r] of [[-16,8.1,.25],[16,-8.7,2.7]]) {const cabinet=new T.Group();cabinet.position.set(x,groundHeight(x,z),z);cabinet.rotation.y=r;root.add(cabinet);mesh(cabinet,new T.BoxGeometry(.5,.72,.45),jade,0,.36,0);mesh(cabinet,new T.BoxGeometry(.33,.18,.035),dark,0,.5,-.244);mesh(cabinet,new T.BoxGeometry(.7,.12,.64),concrete,0,.03,0);}
  // Subtle empty hardstands reserve four future factory footprints per base.
  for(const z of [-10.5,10.5])for(const x of (single?[-3.6,3.6]:[-5.7,-3.6,3.6,5.7])) {
    const plate=mesh(root,new T.CylinderGeometry(.86,.94,.08,8),concrete,x,.025,z);plate.receiveShadow=true;
    for(const dx of [-.66,.66])mesh(root,new T.BoxGeometry(.06,.012,.3),jade,x+dx,.075,z);
  }
  const fern=await loadFern();
  fern.updateMatrixWorld(true);const b=new T.Box3().setFromObject(fern),c=b.getCenter(new T.Vector3()),sz=b.getSize(new T.Vector3()),scale=1.1/Math.max(sz.x,sz.z);
  const fernPoints=single?[[-6,3.3],[-7,-2.4],[6,-4.7],[7,1.9]]:[[-15.5,3.3],[-16.1,-2.4],[-1.8,-4.7],[2.2,1.9],[15,5.7],[16,-5.0]];
  fern.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.translate(-c.x,-b.min.y,-c.z);g.scale(scale,scale,scale);g.deleteAttribute('color');const m=o.material.clone();m.vertexColors=false;m.color.setHex(0xa7bf86);m.roughness=.95;instances(root,g,m,fernPoints.map(([x,z],i)=>({x,z,r:i*1.3})),false);});
  return root;
}
