import * as T from 'three';
import {buildTechnology} from './technology.js';
import {getMission} from './missions.js';
import {buildRiver} from './river.js';
import {GLTFLoader} from '../../hexfront-3d/vendor/loaders/GLTFLoader.js';
import {RADIUS,STEP,corner,cornerHeight,surfaceHeight} from './map.js';

// Charming Frontier: warm limestone, sunlit meadow, chalk paths and jade ceramics.
// All visual relief is decoration; map.js remains the sole navigation surface.
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
function segmentDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}
function sampleImage(image){const c=canvas(image.width);c.getContext('2d').drawImage(image,0,0);return {pixels:c.getContext('2d').getImageData(0,0,c.width,c.height).data,size:c.width};}
function makeGround(m,game,stoneImage,earthImage){
 const size=1024,extent=11.5,c=canvas(size),b=canvas(size),ctx=c.getContext('2d'),bx=b.getContext('2d'),d=ctx.createImageData(size,size),bump=bx.createImageData(size,size);
 const stone=sampleImage(stoneImage),earth=sampleImage(earthImage),segments=getMission(game.missionId).art.tracks.flatMap(t=>t.slice(1).map((p,i)=>[t[i],p]));
 const upper=game.cells.filter(c=>c.height===2),wet=getMission(game.missionId).biome==='river';
 for(let row=0;row<size;row++)for(let col=0;col<size;col++){
  const x=(col/size-.5)*extent*2,z=(.5-row/size)*extent*2,n=noise(x*.49+9,z*.49+5),large=noise(x*.17+3,z*.17+7),fine=noise(x*6,z*6);
  let path=10;for(const [a,b] of segments)path=Math.min(path,segmentDistance(x,z,a,b));
  const wear=1-smooth(clamp((path-.14+(n-.5)*.25)/.46,0,1));
  const rock=upper.some(c=>{const dx=Math.abs(x-c.x),dz=Math.abs(z-c.z);return dx<=Math.sqrt(3)*RADIUS/2&&dz<=RADIUS&&dx/Math.sqrt(3)+dz<=RADIUS;});
  const grass=smooth(clamp((n*.7+large*.3-.39)*3.2,0,1))*(1-wear*.85);
  const palette=rock?[148,153,137]:wet?[mix(151,88,grass),mix(143,131,grass),mix(116,88,grass)]:[mix(168,98,grass),mix(140,137,grass),mix(104,78,grass)];
  const source=rock?stone:earth,u=Math.floor(fract(x*.32)*source.size),v=Math.floor(fract(z*.32)*source.size),p=(v*source.size+u)*4;
  const value=(source.pixels[p]+source.pixels[p+1]+source.pixels[p+2])/3,relief=(value-(rock?163:116))*(rock?.32:.18)+(fine-.5)*5;
  const i=(row*size+col)*4;
  for(let channel=0;channel<3;channel++)d.data[i+channel]=mix(palette[channel],rock?[163,165,148][channel]:[184,160,122][channel],wear*.7)+relief+(large-.5)*9;
  d.data[i+3]=255;const h=126+(value-116)*.22+(fine-.5)*15;for(let k=0;k<3;k++)bump.data[i+k]=h;bump.data[i+3]=255;
 }
 ctx.putImageData(d,0,0);bx.putImageData(bump,0,0);m.soil.map=canvasTexture(c);m.soil.bumpMap=canvasTexture(b,false);m.soil.needsUpdate=true;
}
export function createArtMaterials(game){
 const concrete=weatherMap('concrete'),metal=weatherMap('metal'),std=(colour,options={})=>new T.MeshStandardMaterial({color:colour,roughness:.85,...options});
 const m={
  soil:std(0xffffff,{bumpScale:.085,roughness:.96}),
  rock:std(0xc3c0a9,{vertexColors:true,roughness:.94,normalScale:new T.Vector2(.45,.45)}),
  cliff:std(0xccc6ad,{vertexColors:true,roughness:.98,normalScale:new T.Vector2(.40,.40)}),
  concrete:std(0xe1dcc7,{map:concrete,bumpMap:concrete,bumpScale:.018,roughness:.91}),
  olive:std(0x78998a,{map:metal,bumpMap:metal,bumpScale:.008,roughness:.76,metalness:.26}),
  steel:std(0x77847e,{map:metal,roughness:.63,metalness:.5}),
  dark:std(0x51615f,{map:metal,roughness:.72,metalness:.3}),
  copper:std(0x89745c,{map:metal,roughness:.72,metalness:.4}),
  light:std(0xd2daca,{emissive:0x738a74,emissiveIntensity:.20,roughness:.5}),
  orange:std(0xd59a59,{roughness:.68,metalness:.15}),blue:std(0x70a5bd,{roughness:.68,metalness:.15}),
  leaf:std(0xffffff,{vertexColors:true,roughness:.97,side:T.DoubleSide}),
  seam:std(0x434b45,{roughness:1}),
 };
 const loader=new T.TextureLoader(),get=async(asset,type)=>{const t=await loader.loadAsync(new URL(`../../hexfront-3d/public/assets/materials/${asset}_${type}.webp`,import.meta.url).href);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(type==='diff')t.colorSpace=T.SRGBColorSpace;return t;};
 m.ready=Promise.all(['rock_boulder_dry','rock_wall_02'].map(async name=>{const types=name==='rock_boulder_dry'?['diff','nor_gl','rough']:['diff','rough'],maps=await Promise.all(types.map(type=>get(name,type)));return {map:maps[0],normalMap:maps.length===3?maps[1]:null,roughnessMap:maps.at(-1)};})).then(([stone,wall])=>{
  Object.assign(m.rock,stone);m.rock.needsUpdate=true;Object.assign(m.cliff,{map:stone.map,normalMap:stone.normalMap,roughnessMap:wall.roughnessMap});m.cliff.needsUpdate=true;makeGround(m,game,stone.map.image,wall.map.image);
 });return m;
}
function mesh(parent,geometry,material,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function bevel(w,d,h,r=.08){const s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.lineTo(w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.lineTo(w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.lineTo(-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSize:.016,bevelThickness:.016,bevelSegments:2,steps:1,curveSegments:1});g.rotateX(-Math.PI/2);return g;}
function cylinder(parent,mat,r1,r2,h,x,y,z,n=12){return mesh(parent,new T.CylinderGeometry(r1,r2,h,n),mat,x,y,z);}
function box(parent,mat,w,h,d,x,y,z,r=.04){return mesh(parent,bevel(w,d,h,r),mat,x,y,z);}
function geometry(tris,colours=null,uvScale=.63){
 const p=[],uv=[],colors=[],colour=new T.Color();
 for(let i=0;i<tris.length;i++){
  const tri=tris[i],a=new T.Vector3(...tri[0]),b=new T.Vector3(...tri[1]),c=new T.Vector3(...tri[2]),normal=b.sub(a).cross(c.sub(a)).normalize();
  for(const v of tri){p.push(...v);const axis=Math.abs(normal.y)>.62?'y':Math.abs(normal.x)>Math.abs(normal.z)?'x':'z';uv.push((axis==='x'?v[2]:v[0])*uvScale,(axis==='y'?v[2]:v[1])*uvScale);if(colours){colour.set(colours[i]);colors.push(colour.r,colour.g,colour.b);}}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(colours)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
const addQuad=(out,a,b,c,d)=>out.push([a,b,c],[a,c,d]);
function frameTag(o,id,kind){o.userData.pickCell=id;if(kind)o.userData.pickKind=kind;return o;}

export function buildArtTerrain(s){
 const playable=s.game.cells,all=[...playable],compact=getMission(s.game.missionId).compactRim;
 if(!compact)for(const id of getMission(s.game.missionId).excluded){const [q,r]=id.split(',').map(Number);all.push({id:`rim${id}`,q,r,x:Math.sqrt(3)*RADIUS*(q+r/2),z:1.5*RADIUS*r,height:0,kind:'rim'});}
 if(!compact)for(let r=-4;r<=4;r++)for(let q=-4;q<=4;q++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))===4)all.push({id:`rim${q},${r}`,q,r,x:Math.sqrt(3)*RADIUS*(q+r/2),z:1.5*RADIUS*r,height:0,kind:'rim'});
 s.land=all;const tops=[],topUV=[],edges=[],jointNormals=new Map(),jointKey=p=>`${p.x.toFixed(4)},${p.z.toFixed(4)}`;
 const boundary=[],borderNormals=new Map();
 // A narrow continuous apron follows this mission's authored outline. Inward
 // bays stay empty: the canyon is real geometry, not another circular island.
 if(compact)for(const c of playable)for(let i=0;i<6;i++){
  const a=corner(c,i),b=corner(c,(i+1)%6),mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2};
  if(playable.some(n=>n!==c&&Math.hypot(n.x-mid.x,n.z-mid.z)<RADIUS*.89))continue;
  const normal=new T.Vector2(mid.x-c.x,mid.z-c.z).normalize();boundary.push({a,b,normal});
  for(const p of [a,b]){const k=jointKey(p);if(!borderNormals.has(k))borderNormals.set(k,new T.Vector2());borderNormals.get(k).add(normal);}
 }
 const visualPoint=(c,i)=>{const p=corner(c,i);if(c.kind!=='rim')return {...p,y:cornerHeight(playable,c,i)};const distance=Math.min(...playable.map(c=>Math.hypot(c.x-p.x,c.z-p.z))),f=smooth(clamp((distance-1.19)/1.0,0,1)),len=Math.hypot(p.x,p.z),angle=Math.atan2(p.z,p.x),radius=mix(len,8.45+Math.sin(angle*3+1)*.48+Math.sin(angle*7)*.26,f),offset=radius-len;return {x:p.x+p.x/len*offset,z:p.z+p.z/len*offset,y:(noise(p.x*.8,p.z*.8)-.5)*.12*f};};
 for(const c of all){
  for(let i=0;i<6;i++){
   const a=visualPoint(c,i),b=visualPoint(c,(i+1)%6),baseA=corner(c,i),baseB=corner(c,(i+1)%6);
   const tri=[[c.x,c.height*STEP,c.z],[b.x,b.y,b.z],[a.x,a.y,a.z]];tops.push(tri);for(const [x,y,z] of tri)topUV.push(x/23+.5,z/23+.5);
   const mid={x:(baseA.x+baseB.x)/2,z:(baseA.z+baseB.z)/2},other=all.find(n=>n!==c&&Math.hypot(n.x-mid.x,n.z-mid.z)<RADIUS*.89);
   const lowA=Math.min(a.y,other?(other.kind==='rim'?a.y:surfaceHeight(playable,other,baseA.x,baseA.z)):(compact?0:-1.1)),lowB=Math.min(b.y,other?(other.kind==='rim'?b.y:surfaceHeight(playable,other,baseB.x,baseB.z)):(compact?0:-1.1));
   if(a.y<=lowA+.015&&b.y<=lowB+.015)continue;
   const normal=new T.Vector2(mid.x-c.x,mid.z-c.z).normalize();edges.push({a,b,lowA,lowB,normal});
   for(const p of [a,b]){const key=jointKey(p);if(!jointNormals.has(key))jointNormals.set(key,new T.Vector2());jointNormals.get(key).add(normal);}
  }
  if(c.kind!=='rim'){
   const tri=[];for(let i=0;i<6;i++){const a=corner(c,i),b=corner(c,(i+1)%6);tri.push([[c.x,c.height*STEP,c.z],[b.x,cornerHeight(playable,c,(i+1)%6),b.z],[a.x,cornerHeight(playable,c,i),a.z]]);}
   const pick=new T.Mesh(geometry(tri),new T.MeshBasicMaterial({visible:false,side:T.DoubleSide}));pick.userData.cellId=c.id;s.scene.add(pick);s.picks.push(pick);
  }
 }
 for(const {a,b,normal} of boundary){
  const extend=p=>{const n=borderNormals.get(jointKey(p)).clone().normalize(),w=(getMission(s.game.missionId).biome==='river'&&Math.abs(p.z)<3.2?.10:.44)+noise(p.x*1.8,p.z*1.8)*.13;return {x:p.x+n.x*w,z:p.z+n.y*w,y:0};};
  const outA=extend(a),outB=extend(b),tri=[];
  addQuad(tri,[a.x,0,a.z],[b.x,0,b.z],[outB.x,0,outB.z],[outA.x,0,outA.z]);
  for(const t of tri){tops.push(t);for(const [x,y,z] of t)topUV.push(x/23+.5,z/23+.5);}
  edges.push({a:outA,b:outB,lowA:-1.1,lowB:-1.1,normal});
  for(const p of [outA,outB]){const k=jointKey(p);if(!jointNormals.has(k))jointNormals.set(k,new T.Vector2());jointNormals.get(k).add(normal);}
 }
 const topGeo=geometry(tops);topGeo.setAttribute('uv',new T.Float32BufferAttribute(topUV,2));const ground=mesh(s.static,topGeo,s.materials.soil);ground.userData.pickKind='ground';
 const walls=[],colours=[],lips=[],lipColours=[];
 for(const edge of edges){
  // The thin outer plinth has short curved edges: keep its shallow relief,
  // reserving the larger fractured bedding for the solid playable plateau.
  const outer=edge.lowA<0||edge.lowB<0,bands=outer?[0,.10,.25,.29,.46,.50,.66,.70,.86,.90,1]:[0,.10,.27,.31,.51,.58,.76,.81,1],ledges=outer?[0,.14,.10,.24,.05,.18,.12,.26,.09,.15,.105]:[.17,.29,.34,.12,.22,.39,.14,.20,.07];
  const {a,b,lowA,lowB,normal}=edge,na=jointNormals.get(jointKey(a)).clone().normalize(),nb=jointNormals.get(jointKey(b)).clone().normalize();
  const seed=hash(a.x+a.z,b.x-b.z),cuts=[0,.19+seed*.07,.36,.42,.62+seed*.04,.74,.86,1];
  const point=(u,layer)=>{const t=bands[layer],x=mix(a.x,b.x,u),z=mix(a.z,b.z,u),low=mix(lowA,lowB,u),high=mix(a.y,b.y,u),nx=mix(na.x,nb.x,u),nz=mix(na.y,nb.y,u),envelope=Math.sin(t*Math.PI);
   const relief=clamp((high-low)/.6,0,1),offset=(outer?ledges[layer]*(.6+noise(x*1.6+4,z*1.6+2)*.6)+envelope*(noise(x*4.2,z*4.2)-.5)*.11:ledges[layer]*(.45+noise(x*1.8+7,z*1.8+3)*1.15)+envelope*(noise(x*3.3+t*.9,z*3.3-t*.7)-.5)*.22)*relief;
   const y=mix(low,high,t)+envelope*(outer?(noise(x*1.5+t*2,z*1.5)-.5)*.13:(noise(x*.9+t*2.1,z*1.1-t*.7)-.5)*.35)*relief;
   return [x+nx*offset,y,z+nz*offset];};
  for(let i=0;i<cuts.length-1;i++){const u=cuts[i],v=cuts[i+1];addQuad(lips,[mix(a.x,b.x,u),mix(a.y,b.y,u),mix(a.z,b.z,u)],[mix(a.x,b.x,v),mix(a.y,b.y,v),mix(a.z,b.z,v)],point(v,bands.length-1),point(u,bands.length-1));lipColours.push(0xe4e4db,0xe4e4db);}
  for(let j=0;j<bands.length-1;j++)for(let i=0;i<cuts.length-1;i++){
   const u=cuts[i],v=cuts[i+1];addQuad(walls,point(u,j),point(u,j+1),point(v,j+1),point(v,j));
   const shade=new T.Color().setRGB(1,1,1).multiplyScalar(.78+bands[j]*.2+(noise(a.x+i*.4,a.z+j*.3)-.5)*.09);colours.push(shade.getHex(),shade.getHex());
  }
 }
 const rimLip=mesh(s.static,geometry(lips,lipColours,.55),s.materials.rock);rimLip.userData.pickKind='cliff';
 s.artCliffEdges=edges;
 const wall=mesh(s.static,geometry(walls,colours,.55),s.materials.cliff);wall.userData.pickKind='cliff';
 if(getMission(s.game.missionId).biome==='river')buildRiver(s);
 const floor=mesh(s.static,new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:0x0c171b,opacity:.17}),0,-1.2,0);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
 // Ramps use the continuous terrain surface and worn-earth atlas. No transverse
 // treads or regular marker posts: their real slope and hex edges show the route.
}

// Authored angular footprints: blade, shelf, fractured shoulder, wedge, scree.
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
function addRock(s,x,z,width,height,variant,rotation=0,y=0){const o=mesh(s.static,rockGeometry(variant),s.materials.rock,x,y,z);o.scale.set(width,height,width*(.75+hash(variant,8)*.35));o.rotation.y=rotation;frameTag(o,s.cellAt(x,z)?.id??null);s.contactAt(x,z,y,width*1.35,width);return o;}
function buttress(parent,m,x,z,h,rotation=0){
 const tri=[],a=[[-.14,0,-.26],[.14,0,-.26],[.14,0,.26],[-.14,0,.26]],b=[[-.10,h,-.18],[.10,h,-.18],[.10,h,.04],[-.10,h,.04]];
 for(let i=0;i<4;i++)addQuad(tri,a[i],b[i],b[(i+1)%4],a[(i+1)%4]);addQuad(tri,b[0],b[3],b[2],b[1]);const o=mesh(parent,geometry(tri),m,x,0,z);o.rotation.y=rotation;return o;
}
function pipe(parent,mat,points,r=.018){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(parent,new T.TubeGeometry(curve,12,r,6,false),mat);}
function stencil(parent,text,x,y,z,rotation=0){const c=canvas(128),ctx=c.getContext('2d');ctx.fillStyle='#d6d1b7';ctx.font='bold 74px monospace';ctx.textAlign='center';ctx.fillText(text,64,92);const mat=new T.MeshStandardMaterial({map:canvasTexture(c),transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-2}),p=mesh(parent,new T.PlaneGeometry(.25,.25),mat,x,y,z);p.rotation.x=-Math.PI/2;p.rotation.z=rotation;p.castShadow=false;return p;}
function ruin(s,x,z,length,y,rotation){
 const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;frameTag(g,s.cellAt(x,z)?.id??null);s.static.add(g);
 const heights=[.42,.58,.54,.35,.31,.39,.23],front=[],back=[],tris=[];
 for(let i=0;i<heights.length;i++){const px=(i/(heights.length-1)-.5)*length;front.push([px,heights[i],.12]);back.push([px,heights[i]-.035,-.12]);}
 for(let i=0;i<heights.length-1;i++){
  addQuad(tris,[front[i][0],0,.12],front[i],front[i+1],[front[i+1][0],0,.12]);
  addQuad(tris,[back[i+1][0],0,-.12],back[i+1],back[i],[back[i][0],0,-.12]);
  addQuad(tris,front[i],back[i],back[i+1],front[i+1]);
 }
 for(const i of [0,heights.length-1]){const a=front[i],b=back[i];if(i===0)addQuad(tris,[b[0],0,b[2]],b,a,[a[0],0,a[2]]);else addQuad(tris,[a[0],0,a[2]],a,b,[b[0],0,b[2]]);}
 mesh(g,geometry(tris.map(([a,b,c])=>[a,c,b])),s.materials.concrete);box(g,s.materials.dark,length+.1,.07,.34,0,.04,0);
 for(const px of [-length*.36,length*.32]){buttress(g,s.materials.olive,px,.17,.38);box(g,s.materials.steel,.05,.29,.045,px,.1,.20,.006);}
 pipe(g,s.materials.copper,[[.12,.35,0],[.15,.52,0],[.24,.60,0]],.013);pipe(g,s.materials.dark,[[.32,.30,-.04],[.33,.41,-.04],[.39,.47,-.07]],.012);
 s.contactAt(x,z,y,length*1.3,.7);
}

export function buildArtStructures(s){
 buildTechnology(s);
 // Mission-authored ruin fragments share the transport clearance data.
 for(const args of getMission(s.game.missionId).art.ruins)ruin(s,...args);
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
function vegetation(s,x,z,scale,seed,leafy=false){const cell=s.cellAt(x,z),y=cell?surfaceHeight(s.game.cells,cell,x,z):0,o=mesh(s.static,grassGeometry(seed,leafy),s.materials.leaf,x,y+.01,z);o.scale.setScalar(scale);o.rotation.y=hash(seed,7)*Math.PI*2;frameTag(o,cell?.id??null);o.castShadow=leafy;return o;}
export async function loadArtAssets(s){
 // Three large outcrops and four medium formations, placed by composition.
 const {rocks,shoulders,rubble,vegetation:groups,ferns}=getMission(s.game.missionId).art;
 for(const args of rocks)addRock(s,...args);
 // Joined fracture shoulders interrupt the cliff silhouette. They stay on
 // impassable edges, below the plateau and outside every traversable ramp.
 for(const [x,z,w,h,v,r] of shoulders){
  const o=addRock(s,x,z,w,h,v,r);o.scale.z*=.62;frameTag(o,null,'cliff');
 }
 // Shards attach to those outcrops and to four cliff-foot pockets. No ring of
 // boulders and no scatter rule over every playable hex.
 for(const args of rubble)addRock(s,...args);
 groups.forEach(([x,z,scale],i)=>{for(let j=0;j<4;j++){const a=j*2.3+i*.7,r=j?.20+j*.08:0;vegetation(s,x+Math.cos(a)*r,z+Math.sin(a)*r,scale*(.75+hash(i,j)*.4),i*9+j,j%3===0);}});
 const loader=new GLTFLoader(),gltf=await loader.loadAsync(new URL('../../hexfront-3d/public/assets/nature/Fern_1.gltf',import.meta.url).href),source=gltf.scene,box3=new T.Box3().setFromObject(source),center=box3.getCenter(new T.Vector3()),size=box3.getSize(new T.Vector3());
 source.position.set(-center.x,-box3.min.y,-center.z);const model=new T.Group();model.add(source);const width=Math.max(size.x,size.z);
 source.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;o.geometry.deleteAttribute('color');for(const mat of Array.isArray(o.material)?o.material:[o.material]){mat.vertexColors=false;mat.color.setHex(0xa7bf86);mat.roughness=.95;if(mat.map)mat.map.anisotropy=4;}}});
 for(const [i,p] of ferns.entries()){
  const o=model.clone(true),cell=s.cellAt(...p);o.scale.setScalar(.63/width);o.position.set(p[0],cell?surfaceHeight(s.game.cells,cell,...p):.01,p[1]);o.rotation.y=i*1.3;frameTag(o,cell?.id??null);s.static.add(o);
 }
}
