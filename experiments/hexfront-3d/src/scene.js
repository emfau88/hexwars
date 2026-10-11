import * as T from 'three';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {RADIUS,STEP,corner,cornerHeight,surfaceHeight,neighbors,traversable,edgeKey,RAMPS} from './map.js';

const COLORS={orange:0xd59a59,blue:0x70a5bd,neutral:0x9eaa96};
const fract=n=>n-Math.floor(n);
const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
const smooth=t=>t*t*(3-2*t);
function noise(x,y){const a=Math.floor(x),b=Math.floor(y),u=smooth(fract(x)),v=smooth(fract(y));return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b),hash(a+1,b),u),T.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v);}
function texture(kind) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d'),data=ctx.createImageData(512,512);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const n=noise(x/70,y/70)*.5+noise(x/19,y/19)*.3+noise(x/4,y/4)*.2;
    const grit=hash(x,y)*14;
    let rgb;
    if(kind==='soil'){const moss=Math.max(0,noise(x/97+14,y/97)-.52)*90;rgb=[111+n*62-moss,108+n*48+moss*.12,83+n*40-moss*.25];}
    else if(kind==='rock'){const strata=Math.sin(y*.06+noise(x/18,y/26)*9)*4;rgb=[103+n*70+strata,111+n*68+strata,102+n*66+strata];}
    else {const scratch=hash(x,Math.floor(y/20))>.992?35:0;rgb=[110+n*56+scratch,116+n*52+scratch,107+n*49+scratch];}
    const i=(y*512+x)*4;for(let k=0;k<3;k++)data.data[i+k]=rgb[k]+grit;data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;return map;
}
function shadowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,'rgba(10,15,12,.56)');g.addColorStop(.4,'rgba(10,15,12,.25)');g.addColorStop(1,'rgba(10,15,12,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new T.CanvasTexture(c);}
function bevel(width,depth,height,r=.09){
  const s=new T.Shape(),w=width/2,d=depth/2;
  s.moveTo(-w+r,-d);s.lineTo(w-r,-d);s.lineTo(w,-d+r);s.lineTo(w,d-r);s.lineTo(w-r,d);s.lineTo(-w+r,d);s.lineTo(-w,d-r);s.lineTo(-w,-d+r);s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1,curveSegments:1,steps:1});g.rotateX(-Math.PI/2);return g;
}
function mesh(parent,geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,mat,r1,r2,h,x,y,z,n=10){return mesh(parent,new T.CylinderGeometry(r1,r2,h,n),mat,x,y,z);}
function ringGeometry(cell,cells,scale=.91,width=.012){
  const p=[];for(let i=0;i<6;i++){
    const a=corner(cell,i),b=corner(cell,(i+1)%6);
    for(const [v,s] of [[a,scale],[b,scale],[a,scale-width],[b,scale],[b,scale-width],[a,scale-width]]){
      const x=cell.x+(v.x-cell.x)*s,z=cell.z+(v.z-cell.z)*s;
      p.push(x,surfaceHeight(cells,cell,x,z)+.025,z);
    }
  }const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}

export class Diorama {
  constructor(container,labels,game,onSelect,onHover){
    this.container=container;this.labels=labels;this.game=game;this.onSelect=onSelect;this.onHover=onHover;this.selected=null;this.hovered=null;this.zoom=1;this.pan=new T.Vector3();this.quality='high';this.animations=[];this.markers=new Map();this.labelsById=new Map();this.picks=[];this.disposed=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene=new T.Scene();this.scene.background=new T.Color(0x192321);this.scene.fog=new T.Fog(0x192321,28,63);
    this.camera=new T.OrthographicCamera(-10,10,10,-10,.1,100);
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.14;container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label','Dreidimensionales Schlachtfeld. Wähle eine orange Garnison und danach ein Ziel.');
    this.scene.add(new T.HemisphereLight(0xd5e2df,0x414736,2.05));
    this.sun=new T.DirectionalLight(0xffe5bb,3.25);this.sun.position.set(-9,17,8);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:50});this.sun.shadow.bias=-.00025;this.sun.shadow.normalBias=.025;this.sun.shadow.radius=3;this.scene.add(this.sun);
    const fill=new T.DirectionalLight(0xabc9da,.75);fill.position.set(9,8,-12);this.scene.add(fill);
    this.static=new T.Group();this.scene.add(this.static);
    const soil=texture('soil'),rock=texture('rock'),metal=texture('metal');
    this.materials={
      soil:new T.MeshStandardMaterial({map:soil,bumpMap:soil,bumpScale:.055,roughness:.95,vertexColors:true}),
      rock:new T.MeshStandardMaterial({map:rock,bumpMap:rock,bumpScale:.10,roughness:.94,vertexColors:true}),
      olive:new T.MeshStandardMaterial({color:0x778071,map:metal,bumpMap:metal,bumpScale:.015,roughness:.72,metalness:.36}),
      steel:new T.MeshStandardMaterial({color:0x697574,map:metal,roughness:.54,metalness:.65}),
      dark:new T.MeshStandardMaterial({color:0x293532,roughness:.75,metalness:.45}),
      concrete:new T.MeshStandardMaterial({color:0xb3b19d,map:rock,roughness:.9}),
      copper:new T.MeshStandardMaterial({color:0x976b42,roughness:.65,metalness:.65}),
      light:new T.MeshStandardMaterial({color:0xb3ccad,emissive:0x81977a,emissiveIntensity:.7,roughness:.4}),
      orange:new T.MeshStandardMaterial({color:COLORS.orange,roughness:.58,metalness:.3}),
      blue:new T.MeshStandardMaterial({color:COLORS.blue,roughness:.58,metalness:.3}),
    };
    this.contact=new T.MeshBasicMaterial({map:shadowTexture(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    this.buildTerrain();this.buildStructures();this.buildMarkers();this.buildRovers();this.bind();this.resize();
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);
    this.ready=this.loadAssets().then(()=>{this.batchStatic();this.render(0);});
  }
  contactAt(x,z,y,sx,sz){const m=mesh(this.static,new T.PlaneGeometry(sx,sz),this.contact,x,y+.018,z);m.rotation.x=-Math.PI/2;m.castShadow=false;m.receiveShadow=false;}
  buildTerrain(){
    const playable=this.game.cells,all=[...playable];
    for(let r=-4;r<=4;r++)for(let q=-4;q<=4;q++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))===4)all.push({id:`rim${q},${r}`,q,r,x:Math.sqrt(3)*RADIUS*(q+r/2),z:1.5*RADIUS*r,height:0,kind:'rim'});
    this.land=all;const tops=[],topUV=[],topColors=[],walls=[],wallUV=[],wallColors=[];
    const col=new T.Color();
    const add=(pos,uv,colors,points,color,wall=false)=>{for(const [x,y,z] of points){pos.push(x,y,z);uv.push(wall?(x+z)*.7:x*.42,wall?y*.85:z*.42);col.set(color);const tint=.93+noise(x*2,z*2)*.13;col.multiplyScalar(tint);colors.push(col.r,col.g,col.b);}};
    for(const c of all){
      for(let i=0;i<6;i++){
        const a=corner(c,i),b=corner(c,(i+1)%6),ah=c.kind==='rim'?0:cornerHeight(playable,c,i),bh=c.kind==='rim'?0:cornerHeight(playable,c,(i+1)%6);
        // Clockwise in XZ is upward-facing in Three.js.
        add(tops,topUV,topColors,[[c.x,c.height*STEP,c.z],[b.x,bh,b.z],[a.x,ah,a.z]],c.height===2?0xc6c5a1:c.kind==='rim'?0x8a926d:0xabb489);
        const mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2};const other=all.find(n=>n!==c&&Math.hypot(n.x-mid.x,n.z-mid.z)<RADIUS*.89);
        let lowA=-1.25,lowB=-1.25;
        if(other){lowA=other.kind==='rim'?0:surfaceHeight(playable,other,a.x,a.z);lowB=other.kind==='rim'?0:surfaceHeight(playable,other,b.x,b.z);}
        if(ah<=lowA+.005&&bh<=lowB+.005)continue;
        // Stratified connected cliff faces, split into three irregular rock bands.
        for(let layer=0;layer<3;layer++){
          const t0=layer/3,t1=(layer+1)/3;
          const a0=lowA+(ah-lowA)*t0,a1=lowA+(ah-lowA)*t1,b0=lowB+(bh-lowB)*t0,b1=lowB+(bh-lowB)*t1;
          const bulge0=Math.sin(t0*Math.PI)*.065,bulge1=Math.sin(t1*Math.PI)*.065;
          const dx0=(mid.x-c.x)*bulge0,dz0=(mid.z-c.z)*bulge0,dx1=(mid.x-c.x)*bulge1,dz1=(mid.z-c.z)*bulge1;
          add(walls,wallUV,wallColors,[[a.x+dx0,a0,a.z+dz0],[a.x+dx1,a1,a.z+dz1],[b.x+dx0,b0,b.z+dz0],[b.x+dx0,b0,b.z+dz0],[a.x+dx1,a1,a.z+dz1],[b.x+dx1,b1,b.z+dz1]],layer===0?0x788172:layer===1?0xadb29f:0xc2c2aa,true);
        }
      }
      if(c.kind!=='rim'){
        const p=[];for(let i=0;i<6;i++){const a=corner(c,i),b=corner(c,(i+1)%6);p.push(c.x,c.height*STEP,c.z,b.x,cornerHeight(playable,c,(i+1)%6),b.z,a.x,cornerHeight(playable,c,i),a.z);}
        const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();
        const pick=new T.Mesh(g,new T.MeshBasicMaterial({visible:false,side:T.DoubleSide}));pick.userData.cellId=c.id;this.scene.add(pick);this.picks.push(pick);
      }
    }
    for(const [pos,uv,colors,mat] of [[tops,topUV,topColors,this.materials.soil],[walls,wallUV,wallColors,this.materials.rock]]){
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();mesh(this.static,g,mat);
    }
    const floor=mesh(this.static,new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:0x07110c,opacity:.22}),0,-1.3,0);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
    // Worn inset pavers and raised guard strips give the two ramps physical direction.
    for(const c of playable.filter(c=>c.kind==='ramp')){
      const ends=neighbors(playable,c).filter(n=>RAMPS.has(edgeKey(c,n)));
      for(const n of ends){const dx=n.x-c.x,dz=n.z-c.z;for(let j=1;j<=7;j++){
        const t=j/8,x=c.x+dx*t,z=c.z+dz*t,y=t<.5?surfaceHeight(playable,c,x,z):surfaceHeight(playable,n,x,z);
        const plank=mesh(this.static,bevel(.065,.75,.025,.012),this.materials.steel,x,y+.026,z);plank.rotation.z=Math.atan2((n.height-c.height)*STEP,Math.hypot(dx,dz));
      }}
      for(const s of [-1,1]){const bolt=cylinder(this.static,this.materials.copper,.065,.075,.25,c.x,c.height*STEP+.13,c.z+s*.55,8);bolt.castShadow=true;}
    }
  }
  buildStructures(){
    const m=this.materials;
    for(const c of this.game.cells.filter(c=>c.kind==='hq')){
      const g=new T.Group();g.position.set(c.x,c.height*STEP,c.z-.12);if(c.hq==='blue')g.rotation.y=Math.PI;this.static.add(g);
      this.contactAt(c.x,c.z,c.height*STEP,2.4,2.3);
      mesh(g,bevel(1.7,1.32,.13),m.concrete);mesh(g,bevel(1.3,1.02,.48,.19),m.olive,0,.13,0);
      mesh(g,bevel(1.35,1.07,.11,.16),m.dark,0,.64,0);mesh(g,bevel(1.2,.93,.07,.15),m.steel,0,.76,0);
      mesh(g,bevel(.72,.12,.3,.02),m.dark,0,.22,.525);mesh(g,bevel(.61,.05,.035,.01),m[c.hq],0,.54,.607);
      for(const x of [-.58,.58]){
        mesh(g,bevel(.18,.38,.63,.04),m.concrete,x,.1,.21);
        for(let j=0;j<4;j++)mesh(g,new T.BoxGeometry(.125,.03,.016),m.dark,x,.26+j*.08,.414);
        cylinder(g,m.copper,.025,.025,.09,x,.81,-.3,6);
      }
      mesh(g,bevel(.6,.4,.06,.03),m[c.hq],.05,.86,0);
      for(let i=0;i<6;i++)mesh(g,new T.BoxGeometry(.38,.015,.026),m.dark,.05,.929,-.13+i*.05);
      cylinder(g,m.dark,.08,.13,.16,-.39,.95,-.3);cylinder(g,m.steel,.019,.028,.85,-.39,1.41,-.3,8);
      const dish=mesh(g,new T.SphereGeometry(.24,12,6,0,Math.PI*2,0,Math.PI*.45),m.concrete,-.39,1.6,-.3);dish.rotation.z=-.7;
      cylinder(g,m.light,.028,.028,.055,.46,.87,.32,8);
      // Segmented conduit and a service hatch give a readable miniature silhouette.
      for(let i=0;i<3;i++)cylinder(g,m.steel,.07,.07,.3,.57,.3,-.2-i*.2,8);
    }
    const c=this.game.cell('0,0'),g=new T.Group();g.position.set(c.x,STEP*2,c.z-.16);this.static.add(g);this.contactAt(c.x,c.z,STEP*2,2,2);
    cylinder(g,m.concrete,.67,.75,.13,0,.06,0,6);cylinder(g,m.dark,.38,.48,.25,0,.23,0,8);
    cylinder(g,m.olive,.24,.32,.95,0,.8,0,8);cylinder(g,m.steel,.45,.36,.12,0,1.2,0,8);
    cylinder(g,m.light,.13,.13,.72,0,.82,0,12);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;mesh(g,bevel(.15,.17,1.01,.025),m.concrete,Math.cos(a)*.32,.24,Math.sin(a)*.32);}
    cylinder(g,m.copper,.035,.06,.65,0,1.55,0,8);
    this.relayRing=new T.Mesh(new T.TorusGeometry(.30,.014,5,32),m.light);this.relayRing.position.set(0,STEP*2+1.59,-.16);this.relayRing.rotation.x=Math.PI/2;this.scene.add(this.relayRing);
    // Fractured flagstones across the plateau; inset, never separate hex columns.
    for(const tile of this.game.cells.filter(c=>c.height===2&&c.kind!=='relay')){
      for(let i=0;i<3;i++){const s=mesh(this.static,bevel(.39,.47,.018,.06),m.concrete,tile.x-.48+i*.45,STEP*2+.006,tile.z-.35+(i%2)*.13);s.rotation.y=.08*(i-1);}
    }
  }
  async loadAssets(){
    const loader=new GLTFLoader(),specs=[['rockA','nature/Rock_Medium_1.gltf'],['rockB','nature/Rock_Medium_2.gltf'],['bush','nature/Bush_Common.gltf'],['fern','nature/Fern_1.gltf'],['wall','scifi/WallAstra_Straight_Broken.gltf'],['console','scifi/Prop_AccessPoint.gltf']];
    this.assets={};
    await Promise.all(specs.map(async([name,file])=>{
      const gltf=await loader.loadAsync(new URL(`../public/assets/${file}`,import.meta.url).href),s=gltf.scene;
      const box=new T.Box3().setFromObject(s),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
      s.position.set(-center.x,-box.min.y,-center.z);const wrap=new T.Group();wrap.add(s);wrap.userData.width=Math.max(size.x,size.z);
      s.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];for(const mat of mats){
        mat.roughness=Math.max(mat.roughness,.75);if(mat.map)mat.map.anisotropy=4;
        if(name==='fern'||name==='bush'){mat.vertexColors=false;mat.color.setHex(0xb3bc97);o.geometry.deleteAttribute('color');}
        if(name==='bush'){
          // Quaternius _C is a packed color mask, not a finished red leaf albedo.
          mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`\n#ifdef USE_MAP\nvec4 foliage = texture2D(map, vMapUv);\nfloat variation = max(foliage.r, max(foliage.g, foliage.b));\ndiffuseColor *= vec4(mix(vec3(.16,.23,.09),vec3(.43,.54,.24),variation),foliage.a);\n#endif\n`);};
          mat.customProgramCacheKey=()=> 'hexfront-olive-foliage-v1';
        }
        if(name==='wall'||name==='console'){mat.map=this.materials.olive.map;mat.bumpMap=mat.map;mat.bumpScale=.015;}
      }}});
      this.assets[name]=wrap;
    }));
    const place=(name,x,z,width,y=0,rotation=0)=>{const g=this.assets[name].clone(true),scale=width/g.userData.width;g.scale.setScalar(scale);g.position.set(x,y,z);g.rotation.y=rotation;this.static.add(g);this.contactAt(x,z,y,width*1.3,width*.9);return g;};
    for(let i=0;i<this.land.length;i++){
      const c=this.land[i],rim=c.kind==='rim',seed=hash(c.q+11,c.r+8);
      if(rim){
        if(i%3!==1){const rock=place(i%2?'rockA':'rockB',c.x+(seed-.5)*.5,c.z,.85+seed*1.25,-.04,seed*6.28);rock.scale.y*=.65+seed*.55;rock.scale.x*=1.15;}
        if(i%2===0)place('bush',c.x+.48,c.z-.38,.85+seed*.4,.01,seed*9);
        if(i%3!==0)place('fern',c.x-.47,c.z+.34,.82,.02,seed*7);
      } else if(c.kind==='field'){
        const x=c.x+.67,z=c.z-.33,y=surfaceHeight(this.game.cells,c,x,z);
        if(c.height===0){place(i%3?'fern':'bush',x,z,.48+seed*.16,y,seed*7);if(i%3===0)place('rockB',c.x-.65,c.z-.30,.46,c.height*STEP,seed*7);}
      }
    }
    // Fortification pieces sit along the rim of the contiguous upper plateau.
    place('wall',-1.06,-2.18,2.0,0,-.45);place('wall',1.1,2.2,1.8,0,2.7);
    place('wall',-.9,-1.28,1.3,STEP*2,Math.PI/2);place('wall',1.05,1.35,1.18,STEP*2,Math.PI/2);
    place('console',-1.65,.05,.46,STEP*2,.6);place('console',1.70,-.14,.44,STEP*2,-2.5);
    // Scree clusters at cliff feet anchor the stepped land into the lower plain.
    for(let i=0;i<15;i++){const a=i/15*Math.PI*2;const x=Math.cos(a)*3.22,z=Math.sin(a)*3.10;if(Math.abs(z)<1.25)continue;const stone=place(i%2?'rockA':'rockB',x,z,.7+hash(i,7)*.75,-.03,a);stone.scale.y*=1.15;stone.scale.z*=.75;if(i%3===0)place('fern',x+.23,z+.15,.6,.015,a);}
  }
  batchStatic(){
    this.static.updateMatrixWorld(true);const groups=new Map(),remove=[];
    this.static.traverse(o=>{
      if(!o.isMesh||Array.isArray(o.material))return;
      const key=o.material.uuid+o.castShadow+o.receiveShadow,g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
      // Attribute sets stay consistent within each batch.
      const attrs=Object.keys(g.attributes).sort().join(','),id=key+attrs;
      if(!groups.has(id))groups.set(id,{material:o.material,geos:[],cast:o.castShadow,receive:o.receiveShadow});
      groups.get(id).geos.push(g.index?g.toNonIndexed():g);remove.push(o);
    });
    for(const o of remove)o.removeFromParent();
    for(const g of groups.values()){const merged=mergeGeometries(g.geos);if(!merged)throw Error('Static scenery batching failed');const m=mesh(this.scene,merged,g.material);m.castShadow=g.cast;m.receiveShadow=g.receive;for(const geo of g.geos)geo.dispose();}
  }
  buildMarkers(){
    this.leaderLines=document.createElementNS('http://www.w3.org/2000/svg','svg');this.leaderLines.classList.add('label-leaders');this.leaderLines.setAttribute('aria-hidden','true');this.labels.append(this.leaderLines);
    for(const c of this.game.cells){
      const mat=new T.MeshBasicMaterial({color:COLORS[c.owner],transparent:true,opacity:.30,depthWrite:false,side:T.DoubleSide});
      const marker=mesh(this.scene,ringGeometry(c,this.game.cells,.92,.012),mat);marker.castShadow=false;marker.receiveShadow=false;
      const fillGeo=this.picks.find(p=>p.userData.cellId===c.id).geometry.clone();fillGeo.translate(0,.018,0);
      const fill=new T.Mesh(fillGeo,new T.MeshBasicMaterial({color:COLORS[c.owner],transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));this.scene.add(fill);
      this.markers.set(c.id,{marker,fill});
      const el=document.createElement('button');el.className='garrison '+c.owner;el.dataset.cell=c.id;el.type='button';el.innerHTML='<span class="count"></span><span class="cell-symbol"></span>';el.addEventListener('click',e=>{e.stopPropagation();this.onSelect(c.id);});el.addEventListener('pointerenter',()=>this.onHover(c.id));el.addEventListener('focus',()=>this.onHover(c.id));this.labels.append(el);this.labelsById.set(c.id,el);
    }
    this.pathLine=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({color:0xe8d6a7,dashSize:.18,gapSize:.12,transparent:true,opacity:.8}));this.pathLine.frustumCulled=false;this.scene.add(this.pathLine);
  }
  buildRovers(){
    const m=this.materials,g=new T.Group();
    mesh(g,bevel(.42,.58,.12,.10),m.olive,0,.11,0);
    mesh(g,bevel(.28,.26,.095,.065),m.steel,0,.25,-.05);
    for(const x of [-.21,.21]){
      mesh(g,bevel(.09,.58,.11,.035),m.dark,x,.035,0);
      for(let j=0;j<4;j++){const w=cylinder(g,m.copper,.055,.055,.025,x,.093,-.19+j*.125,8);w.rotation.z=Math.PI/2;}
    }
    mesh(g,new T.BoxGeometry(.05,.04,.30),m.dark,0,.31,-.24);
    cylinder(g,m.dark,.006,.006,.26,-.13,.40,.15,4);
    mesh(g,new T.BoxGeometry(.12,.025,.06),m.light,0,.19,.27);
    g.updateMatrixWorld(true);const buckets=new Map();
    g.traverse(o=>{if(o.isMesh){const id=o.material.uuid;if(!buckets.has(id))buckets.set(id,{mat:o.material,geos:[]});const geom=o.geometry.clone().applyMatrix4(o.matrixWorld);buckets.get(id).geos.push(geom.index?geom.toNonIndexed():geom);}});
    this.roverParts=[];
    for(const b of buckets.values()){const geo=mergeGeometries(b.geos);const inst=new T.InstancedMesh(geo,b.mat,128);inst.count=0;inst.castShadow=true;inst.receiveShadow=true;inst.instanceMatrix.setUsage(T.DynamicDrawUsage);this.scene.add(inst);this.roverParts.push(inst);}
    this.roverInsignia=new T.InstancedMesh(new T.BoxGeometry(.16,.018,.16),new T.MeshStandardMaterial({roughness:.7}),128);this.roverInsignia.instanceMatrix.setUsage(T.DynamicDrawUsage);this.scene.add(this.roverInsignia);
    this.dummy=new T.Object3D();
  }
  select(id){this.selected=id;}
  hover(id){this.hovered=id;}
  setQuality(mode){this.quality=mode;this.renderer.setPixelRatio(mode==='low'?1:Math.min(devicePixelRatio,1.6));this.sun.shadow.mapSize.setScalar(mode==='low'?1024:2048);if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.sun.shadow.needsUpdate=true;this.resize();}
  fit(){this.zoom=1;this.pan.set(0,0,0);this.resize();}
  zoomBy(factor){this.zoom=T.MathUtils.clamp(this.zoom*factor,1,1.85);this.resize();}
  resize(){
    const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;
    this.renderer.setSize(w,h,false);const aspect=w/h;
    const halfHeight=Math.max(6.7,9.3/aspect)/this.zoom;
    this.camera.left=-halfHeight*aspect;this.camera.right=halfHeight*aspect;this.camera.top=halfHeight;this.camera.bottom=-halfHeight;
    const target=new T.Vector3(this.pan.x,.65,this.pan.z);this.camera.position.copy(target).add(new T.Vector3(7.5,w<640?24:20,20));this.camera.lookAt(target);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
    this.width=w;this.height=h;
  }
  project(x,y,z){const v=new T.Vector3(x,y,z).project(this.camera);return {x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height};}
  layoutLabels(entries){
    const key=entries.map(e=>`${e.id}:${e.pos.x.toFixed(1)},${e.pos.y.toFixed(1)}:${e.width}`).join('|');
    if(key===this.labelLayoutKey)return;this.labelLayoutKey=key;
    // Include expanded touch hit areas. Displaced labels remain connected to
    // their exact projected surface, even where different heights overlap.
    const placed=[],lines=[],offsets=[{x:0,y:0}];
    for(const radius of [12,24,36,48,60,72])for(let j=0;j<12;j++)offsets.push({x:Math.cos(j*Math.PI/6)*radius,y:Math.sin(j*Math.PI/6)*radius});
    for(const e of entries.sort((a,b)=>a.pos.y-b.pos.y||a.id.localeCompare(b.id))){
      let best=null,bestScore=Infinity;
      for(const o of offsets){
        const x=T.MathUtils.clamp(e.pos.x+o.x,e.width/2+6,this.width-e.width/2-6),y=T.MathUtils.clamp(e.pos.y+o.y,22,this.height-22);
        let score=(x-e.pos.x)**2+(y-e.pos.y)**2;
        for(const p of placed){const dx=(e.width+p.width)/2+10-Math.abs(x-p.x),dy=38-Math.abs(y-p.y);if(dx>0&&dy>0)score+=100000+dx*dy*1000;}
        if(score<bestScore){bestScore=score;best={x,y,width:e.width};}
      }
      placed.push(best);e.el.style.transform=`translate(${best.x}px,${best.y}px) translate(-50%, -50%)`;
      if(Math.hypot(best.x-e.pos.x,best.y-e.pos.y)>6)lines.push(`<path d="M${e.pos.x},${e.pos.y} L${best.x},${best.y}"/><circle cx="${e.pos.x}" cy="${e.pos.y}" r="2"/>`);
    }
    this.leaderLines.innerHTML=lines.join('');
  }
  screenCell(id){const c=this.game.cell(id),p=this.project(c.x,c.height*STEP+.24,c.z+.36);const rect=this.container.getBoundingClientRect();return {x:p.x+rect.left,y:p.y+rect.top};}
  pick(event){const rect=this.renderer.domElement.getBoundingClientRect();const pointer=new T.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),ray=new T.Raycaster();ray.setFromCamera(pointer,this.camera);return ray.intersectObjects(this.picks)[0]?.object.userData.cellId||null;}
  bind(){
    const canvas=this.renderer.domElement;this.pointers=new Map();
    canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.down={x:e.clientX,y:e.clientY,pan:this.pan.clone(),moved:false};if(this.pointers.size===2){const p=[...this.pointers.values()];this.pinch={distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),zoom:this.zoom};}});
    canvas.addEventListener('pointermove',e=>{
      if(this.pointers.has(e.pointerId))this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(this.pointers.size===2&&this.pinch){const p=[...this.pointers.values()];this.zoom=T.MathUtils.clamp(this.pinch.zoom*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/this.pinch.distance,1,1.85);this.down.moved=true;this.resize();return;}
      if(this.pointers.size===1&&this.down){const dx=e.clientX-this.down.x,dy=e.clientY-this.down.y;if(Math.hypot(dx,dy)>8)this.down.moved=true;if(this.down.moved&&this.zoom>1){const scale=(this.camera.right-this.camera.left)/this.width;this.pan.x=T.MathUtils.clamp(this.down.pan.x-dx*scale*.92+dy*scale*.4,-5,5);this.pan.z=T.MathUtils.clamp(this.down.pan.z+dx*scale*.4+dy*scale*.92,-5,5);this.resize();}return;}
      this.onHover(this.pick(e));
    });
    canvas.addEventListener('pointerup',e=>{if(this.pointers.size===1&&this.down&&!this.down.moved)this.onSelect(this.pick(e));this.pointers.delete(e.pointerId);this.pinch=null;});
    canvas.addEventListener('pointercancel',e=>{this.pointers.delete(e.pointerId);this.pinch=null;this.down=null;});
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoomBy(e.deltaY>0?.92:1.08);},{passive:false});
  }
  effect(event){if(!event.id)return;const c=this.game.cell(event.id);if(!c)return;const m=new T.Mesh(new T.RingGeometry(.1,.14,32),new T.MeshBasicMaterial({color:COLORS[event.owner],transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(c.x,c.height*STEP+.1,c.z);this.scene.add(m);this.animations.push({mesh:m,start:performance.now()});}
  updateRovers(time){
    const units=[];
    for(const c of this.game.cells)if(c.owner!=='neutral'&&c.units>=2){units.push({x:c.x-.22,y:c.height*STEP,z:c.z+.18,owner:c.owner,rot:c.owner==='orange'?Math.PI:0});if(c.units>24&&c.kind!=='hq')units.push({x:c.x+.27,y:c.height*STEP,z:c.z-.02,owner:c.owner,rot:c.owner==='orange'?Math.PI:0});}
    for(const o of this.game.orders){const a=this.game.cell(o.path[o.segment]),b=this.game.cell(o.path[o.segment+1]),t=o.progress,x=T.MathUtils.lerp(a.x,b.x,t),z=T.MathUtils.lerp(a.z,b.z,t);units.push({x,y:surfaceHeight(this.game.cells,t<.5?a:b,x,z),z,owner:o.owner,rot:Math.atan2(a.x-b.x,a.z-b.z)});}
    for(let i=0;i<Math.min(units.length,128);i++){const u=units[i];this.dummy.position.set(u.x,u.y+.028,u.z);this.dummy.rotation.set(0,u.rot,0);this.dummy.updateMatrix();for(const part of this.roverParts)part.setMatrixAt(i,this.dummy.matrix);this.dummy.position.y+=.36;this.dummy.updateMatrix();this.roverInsignia.setMatrixAt(i,this.dummy.matrix);this.roverInsignia.setColorAt(i,new T.Color(COLORS[u.owner]));}
    for(const p of [...this.roverParts,this.roverInsignia]){p.count=Math.min(units.length,128);p.instanceMatrix.needsUpdate=true;}if(this.roverInsignia.instanceColor)this.roverInsignia.instanceColor.needsUpdate=true;
  }
  render(time){
    if(this.disposed)return;
    const selected=this.game.cell(this.selected),labelEntries=[];
    for(const c of this.game.cells){
      const {marker,fill}=this.markers.get(c.id),isSelected=c.id===this.selected,reachable=selected&&selected.owner==='orange'&&!!this.game.path(selected,c),hover=c.id===this.hovered;
      marker.material.color.setHex(isSelected?0xf2d9a4:reachable?0xe0d5ac:COLORS[c.owner]);marker.material.opacity=isSelected?.95:reachable?.7:c.owner==='neutral'?.24:.56;
      fill.material.color.setHex(isSelected?COLORS.orange:reachable?0xcbce9e:COLORS[c.owner]);fill.material.opacity=isSelected?.16:reachable?.08:c.owner!=='neutral'?.045:0;
      if(hover)fill.material.opacity+=.055;fill.visible=fill.material.opacity>.001;
      const el=this.labelsById.get(c.id),pos=this.project(c.x,c.height*STEP+.24,c.z+(c.kind==='hq'?.82:c.kind==='relay'?.68:.38));
      el.className=`garrison ${c.owner}${isSelected?' selected':''}${reachable?' reachable':''}`;
      el.querySelector('.count').textContent=Math.floor(c.units);el.querySelector('.cell-symbol').textContent=c.kind==='hq'?'⌂':c.kind==='relay'?'⌁':c.height>0?'↑':'';
      el.setAttribute('aria-label',`${c.name}, ${c.owner==='orange'?'Orange':c.owner==='blue'?'Blau':'neutral'}, ${Math.floor(c.units)} Truppen, Höhe ${c.height}`);el.setAttribute('aria-pressed',String(isSelected));
      const show=c.owner!=='neutral'||c.kind==='relay'||reachable||hover;
      el.style.visibility=!show||pos.x<12||pos.x>this.width-12||pos.y<12||pos.y>this.height-12?'hidden':'visible';
      if(el.style.visibility==='visible')labelEntries.push({id:c.id,el,pos,width:Math.floor(c.units)>99?44:38});
    }
    this.layoutLabels(labelEntries);
    const target=this.game.cell(this.hovered),path=selected&&target?this.game.path(selected,target):null;
    this.pathLine.visible=!!path;
    const pathKey=path?.map(c=>c.id).join('|');
    if(path&&pathKey!==this.lastPathKey){const pts=[];for(let i=0;i<path.length-1;i++)for(let s=0;s<=8;s++){const a=path[i],b=path[i+1],t=s/8,x=T.MathUtils.lerp(a.x,b.x,t),z=T.MathUtils.lerp(a.z,b.z,t);pts.push(new T.Vector3(x,surfaceHeight(this.game.cells,t<.5?a:b,x,z)+.15,z));}this.pathLine.geometry.dispose();this.pathLine.geometry=new T.BufferGeometry().setFromPoints(pts);this.pathLine.computeLineDistances();}this.lastPathKey=pathKey;
    if(!this.reduced)this.relayRing.rotation.z=time*.00025;
    for(const a of [...this.animations]){const t=(time-a.start)/900;if(t>1){a.mesh.removeFromParent();a.mesh.geometry.dispose();a.mesh.material.dispose();this.animations.splice(this.animations.indexOf(a),1);}else{a.mesh.scale.setScalar(1+t*8);a.mesh.material.opacity=(1-t)*.7;}}
    this.updateRovers(time);this.renderer.render(this.scene,this.camera);
  }
}
