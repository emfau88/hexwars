import * as T from 'three';
import {buildDrones,buildEffects,updateTechnology,technologyEffect,clearTechnology} from './technology.js';
import {createArtMaterials,buildArtTerrain,buildArtStructures,loadArtAssets} from './art.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {RADIUS,STEP,corner,surfaceHeight,neighbors,traversable} from './map.js';
import {CAMERA_VIEWS,MAX_ZOOM,cameraBasis,projectedBounds,frameBattlefield} from './camera.js';

const COLORS={orange:0xd59a59,blue:0x70a5bd,neutral:0x9eaa96};
function shadowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,'rgba(10,15,12,.56)');g.addColorStop(.4,'rgba(10,15,12,.25)');g.addColorStop(1,'rgba(10,15,12,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new T.CanvasTexture(c);}
function mesh(parent,geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
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
    this.container=container;this.labels=labels;this.game=game;this.onSelect=onSelect;this.onHover=onHover;this.selected=null;this.hovered=null;this.zoom=1;this.quality='high';this.markers=new Map();this.labelsById=new Map();this.picks=[];this.disposed=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.view='tactical';this.angle=CAMERA_VIEWS.tactical;this.viewPan={u:0,v:0};this.boundsCache=new Map();this.occluders=[];
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{this.reduced=e.matches;if(this.reduced)this.droneGhosts=[];});
    this.scene=new T.Scene();this.scene.background=new T.Color(0x192321);this.scene.fog=new T.Fog(0x192321,28,63);
    this.camera=new T.OrthographicCamera(-10,10,10,-10,.1,100);
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.10;container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label','Dreidimensionales Schlachtfeld. Ziehe eine orange Garnison zum Ziel und lasse los. Alternativ Quelle und Ziel antippen.');
    this.scene.add(new T.HemisphereLight(0xdce5e7,0x727367,1.9));
    this.sun=new T.DirectionalLight(0xffecd3,2.7);this.sun.position.set(-8,18,6);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:50});this.sun.shadow.bias=-.00025;this.sun.shadow.normalBias=.018;this.sun.shadow.radius=3;this.scene.add(this.sun);
    const fill=new T.DirectionalLight(0xb9cbd7,.50);fill.position.set(9,8,-12);this.scene.add(fill);
    this.static=new T.Group();this.scene.add(this.static);
    this.materials=createArtMaterials(game);
    this.contact=new T.MeshBasicMaterial({map:shadowTexture(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    this.buildTerrain();this.buildStructures();this.buildMarkers();buildDrones(this);buildEffects(this);this.bind();this.resize();
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);
    this.ready=this.loadAssets().then(()=>{this.captureBattlefieldGeometry();this.batchStatic();this.resize();this.render(0);});
  }
  contactAt(x,z,y,sx,sz){const m=mesh(this.static,new T.PlaneGeometry(sx,sz),this.contact,x,y+.018,z);m.rotation.x=-Math.PI/2;m.castShadow=false;m.receiveShadow=false;}
  buildTerrain(){buildArtTerrain(this);}
  buildStructures(){buildArtStructures(this);}
  async loadAssets(){await Promise.all([loadArtAssets(this),this.materials.ready]);}
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
  cellAt(x,z){
    // Pointy hex half-planes; logical IDs remain independent of the camera.
    return this.game.cells.find(c=>{const dx=Math.abs(x-c.x),dz=Math.abs(z-c.z);return dx<=Math.sqrt(3)*RADIUS/2+.001&&dz<=RADIUS+.001&&dx/Math.sqrt(3)+dz<=RADIUS+.001;});
  }
  captureBattlefieldGeometry(){
    this.static.updateMatrixWorld(true);const points=[],tacticalPoints=[],v=new T.Vector3();this.occluders=[];
    this.static.traverse(o=>{
      if(!o.isMesh||o.material.isShadowMaterial||o.material===this.contact)return;
      let owner=o;while(owner&&!Object.hasOwn(owner.userData,'pickCell'))owner=owner.parent;
      const attr=o.geometry.attributes.position;for(let i=0;i<attr.count;i++){v.fromBufferAttribute(attr,i).applyMatrix4(o.matrixWorld);points.push(v.x,v.y,v.z);if(owner?.userData.pickCell||this.cellAt(v.x,v.z))tacticalPoints.push(v.x,v.y,v.z);}
      const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.some(m=>m.transparent||m.alphaTest))return;
      o.userData.pickCell=owner?.userData.pickCell??null;
      // Keep the unbatched meshes only as frozen CPU hit surfaces. Rendering
      // still uses the original material batches; no extra draw calls.
      this.occluders.push(o);
    });
    this.fitPoints=new Float32Array(points);this.tacticalFitPoints=new Float32Array(tacticalPoints);this.boundsCache.clear();
  }
  buildMarkers(){
    this.leaderLines=document.createElementNS('http://www.w3.org/2000/svg','svg');this.leaderLines.classList.add('label-leaders');this.leaderLines.setAttribute('aria-hidden','true');this.labels.append(this.leaderLines);
    for(const c of this.game.cells){
      const mat=new T.MeshBasicMaterial({color:COLORS[c.owner],transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide,toneMapped:false});
      const marker=mesh(this.scene,ringGeometry(c,this.game.cells,.94,.035),mat);marker.castShadow=false;marker.receiveShadow=false;marker.renderOrder=2;
      const fillGeo=this.picks.find(p=>p.userData.cellId===c.id).geometry.clone();fillGeo.translate(0,.018,0);
      const fill=new T.Mesh(fillGeo,new T.MeshBasicMaterial({color:COLORS[c.owner],transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,toneMapped:false}));fill.renderOrder=1;this.scene.add(fill);
      // Keep territory colour independent of orders, as in the original board.
      // A separate inset contour marks selection/reachability on the real slope.
      const action=new T.Mesh(ringGeometry(c,this.game.cells,.80,.025),new T.MeshBasicMaterial({color:0xf2d9a4,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide,toneMapped:false}));action.visible=false;action.renderOrder=3;this.scene.add(action);
      this.markers.set(c.id,{marker,fill,action});
      const el=document.createElement('button');el.className='garrison '+c.owner;el.dataset.cell=c.id;el.type='button';el.innerHTML='<span class="badge-face"><span class="count"></span><span class="cell-symbol"></span></span>';el.addEventListener('click',e=>{e.stopPropagation();this.onSelect(c.id);});el.addEventListener('pointerenter',()=>this.onHover(c.id));el.addEventListener('focus',()=>this.onHover(c.id));this.labels.append(el);this.labelsById.set(c.id,el);
    }
    this.pathLine=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({color:0xe8d6a7,dashSize:.18,gapSize:.12,transparent:true,opacity:.8}));this.pathLine.frustumCulled=false;this.scene.add(this.pathLine);
  }
  select(id){this.selected=id;}
  hover(id){this.hovered=id;}
  setQuality(mode){this.quality=mode;this.renderer.setPixelRatio(mode==='low'?1:Math.min(devicePixelRatio,1.6));this.sun.shadow.mapSize.setScalar(mode==='low'?1024:2048);if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.sun.shadow.needsUpdate=true;this.resize();}
  setView(view){this.view=view;this.setAngle(CAMERA_VIEWS[view]);this.onViewChange?.(this.view);}
  setAngle(angle){this.cancelGesture();this.angle=T.MathUtils.clamp(angle,50,85);this.zoom=1;this.viewPan={u:0,v:0};this.resize();}
  fit(){this.setView('tactical');}
  zoomBy(factor,anchor){
    const old=this.framing;if(!old)return;
    const x=(anchor?.x??this.width/2)-this.width/2,y=this.height/2-(anchor?.y??this.height/2);
    const worldU=old.centerU+x/old.scale,worldV=old.centerV+y/old.scale;
    this.zoom=T.MathUtils.clamp(this.zoom*factor,1,MAX_ZOOM);this.resize();
    this.viewPan.u+=worldU-this.framing.centerU-x/this.framing.scale;this.viewPan.v+=worldV-this.framing.centerV-y/this.framing.scale;this.resize();
  }
  resize(){
    const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;
    this.renderer.setSize(w,h,false);
    if(!this.fitPoints)this.captureBattlefieldGeometry();
    const basis=cameraBasis(this.angle),key=`${this.view}:${this.angle}`;let bounds=this.boundsCache.get(key);if(!bounds){bounds=projectedBounds(this.view==='diorama'?this.fitPoints:this.tacticalFitPoints,basis);this.boundsCache.set(key,bounds);}
    const f=frameBattlefield(bounds,w,h,this.zoom,this.viewPan);this.framing=f;this.projectedWorldBounds=bounds;this.viewPan={u:f.u,v:f.v};
    this.camera.position.fromArray(basis.out).multiplyScalar(30);this.camera.lookAt(0,0,0);
    this.camera.left=f.centerU-f.halfW;this.camera.right=f.centerU+f.halfW;this.camera.top=f.centerV+f.halfH;this.camera.bottom=f.centerV-f.halfH;this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
    this.width=w;this.height=h;
    this.container.dataset.zoomed=String(this.zoom>1.01);
    this.onFrameChange?.({zoom:this.zoom,small:Math.sqrt(3)*RADIUS*f.fitScale*Math.sin(this.angle*Math.PI/180)<44});
  }
  project(x,y,z){const v=new T.Vector3(x,y,z).project(this.camera);return {x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height};}
  layoutLabels(entries){
    const key=entries.map(e=>`${e.id}:${e.pos.x.toFixed(1)},${e.pos.y.toFixed(1)}:${e.width}`).join('|');
    if(key===this.labelLayoutKey)return;this.labelLayoutKey=key;
    // Match circular hit areas, preserving HQ/relay anchors before other values.
    // Displaced labels remain connected to
    // their exact projected surface, even where different heights overlap.
    const placed=[],lines=[],offsets=[{x:0,y:0}];this.labelPositions=new Map();
    for(const radius of [12,24,36,48,60,72])for(let j=0;j<12;j++)offsets.push({x:Math.cos(j*Math.PI/6)*radius,y:Math.sin(j*Math.PI/6)*radius});
    for(const e of entries.sort((a,b)=>Number(this.drag?.labelPositions.has(b.id)||false)-Number(this.drag?.labelPositions.has(a.id)||false)||b.strategic-a.strategic||a.pos.y-b.pos.y||a.id.localeCompare(b.id))){
      const locked=this.drag?.labelPositions.get(e.id);
      let best=locked||null,bestScore=Infinity;
      for(const o of locked?[]:offsets){
        const x=T.MathUtils.clamp(e.pos.x+o.x,e.width/2+6,this.width-e.width/2-6),y=T.MathUtils.clamp(e.pos.y+o.y,e.width/2+2,this.height-e.width/2-2);
        let score=(x-e.pos.x)**2+(y-e.pos.y)**2;
        for(const p of placed){const overlap=(e.width+p.width)/2+2-Math.hypot(x-p.x,y-p.y);if(overlap>0)score+=100000+overlap*overlap*1000;}
        if(score<bestScore){bestScore=score;best={x,y,width:e.width};}
      }
      placed.push(best);this.labelPositions.set(e.id,best);e.el.style.transform=`translate(${best.x}px,${best.y}px) translate(-50%, -50%)`;
      if(Math.hypot(best.x-e.pos.x,best.y-e.pos.y)>6)lines.push(`<path d="M${e.pos.x},${e.pos.y} L${best.x},${best.y}"/><circle cx="${e.pos.x}" cy="${e.pos.y}" r="2"/>`);
    }
    this.leaderLines.innerHTML=lines.join('');
  }
  screenCell(id){const c=this.game.cell(id),x=c.x,z=c.z+.36,p=this.project(x,surfaceHeight(this.game.cells,c,x,z)+.015,z);const rect=this.container.getBoundingClientRect();return {x:p.x+rect.left,y:p.y+rect.top};}
  pick(event){
    const rect=this.renderer.domElement.getBoundingClientRect(),pointer=new T.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),ray=new T.Raycaster();ray.setFromCamera(pointer,this.camera);
    const ground=ray.intersectObjects(this.picks,false)[0],object=ray.intersectObjects(this.occluders,false)[0];this.lastPick={kind:'ground',id:ground?.object.userData.cellId??null};
    if(object&&(!ground||object.distance<ground.distance-.045)){
      const id=object.object.userData.pickCell;this.lastPick={kind:object.object.userData.pickKind==='cliff'?'cliff':'object',id:id??null};return id??null;
    }
    return this.lastPick.id;
  }
  hitAt(event){
    // Pointer capture changes event.target. Always inspect the actual drop point,
    // including badges, HQ roofs and occluding cliff faces.
    const element=document.elementFromPoint(event.clientX,event.clientY);
    if(!element||!this.container.contains(element))return {id:null,reason:'outside'};
    const label=element.closest('.garrison');
    if(label)return {id:label.dataset.cell,reason:null};
    if(element!==this.renderer.domElement)return {id:null,reason:'outside'};
    const id=this.pick(event);
    return {id,reason:this.lastPick.kind==='cliff'?'cliff':id?null:'outside'};
  }
  updateDrag(event){
    if(!this.drag)return;
    const hit=this.hitAt(event),rect=this.container.getBoundingClientRect();
    this.drag.x=event.clientX-rect.left;this.drag.y=event.clientY-rect.top;
    if(hit.id!==this.drag.target||hit.reason!==this.drag.reason){
      this.drag.target=hit.id;this.drag.reason=hit.reason;
      this.onDrag?.('move',hit.id,hit.reason);
    }
  }
  endDrag(cancel=false){
    if(!this.drag)return;
    const {target,reason}=this.drag;this.drag=null;this.labelLayoutKey=null;
    this.container.removeAttribute('data-dragging');this.dragTip.hidden=true;
    this.onDrag?.(cancel?'cancel':'end',target,reason);
  }
  cancelGesture(){
    this.endDrag(true);
    if(this.pointers?.size){this.suppressNextClick=true;this.suppressClickUntil=performance.now()+350;}
    const ids=[...(this.pointers?.keys()||[])];this.pointers?.clear();this.pinch=null;this.down=null;
    for(const id of ids)if(this.container.hasPointerCapture(id))this.container.releasePointerCapture(id);
  }
  bind(){
    const canvas=this.renderer.domElement,input=this.container;this.pointers=new Map();
    this.dragTip=document.createElement('div');this.dragTip.className='drag-tip';this.dragTip.hidden=true;this.dragTip.setAttribute('aria-live','polite');input.append(this.dragTip);
    input.addEventListener('click',e=>{if((this.suppressNextClick&&e.detail>0)||performance.now()<(this.suppressClickUntil||0)){this.suppressNextClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
    input.addEventListener('contextmenu',e=>e.preventDefault());
    input.addEventListener('pointerdown',e=>{
      if(e.button!==0)e.preventDefault();
      if(!this.pointers.size){this.suppressNextClick=false;this.suppressClickUntil=0;}
      const label=document.elementFromPoint(e.clientX,e.clientY)?.closest('.garrison'),retargeted=label!==e.target.closest('.garrison');
      if(!label||retargeted||e.button!==0)input.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(this.pointers.size===1){
        const hit=this.hitAt(e),cell=this.game.cell(hit.id);
        const command=e.button===0&&this.game.running&&!this.game.paused&&!this.game.result&&cell?.owner==='orange';
        this.down={x:e.clientX,y:e.clientY,pan:{...this.viewPan},moved:false,label:label?.dataset.cell,retargeted,from:command?cell.id:null,button:e.button};
      }else{
        this.endDrag(true);this.down.moved=true;this.down.from=null;
        for(const id of this.pointers.keys())input.setPointerCapture(id);
        const p=[...this.pointers.values()];
        this.pinch={distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};
      }
    });
    input.addEventListener('pointermove',e=>{
      if(this.pointers.has(e.pointerId))this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(this.pointers.size>=2&&this.pinch){
        const p=[...this.pointers.values()],distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),x=(p[0].x+p[1].x)/2,y=(p[0].y+p[1].y)/2,rect=canvas.getBoundingClientRect();
        this.zoomBy(distance/Math.max(1,this.pinch.distance),{x:x-rect.left,y:y-rect.top});
        this.viewPan.u-=(x-this.pinch.x)/this.framing.scale;this.viewPan.v+=(y-this.pinch.y)/this.framing.scale;this.resize();
        this.pinch={distance,x,y};return;
      }
      if(this.pointers.size===1&&this.down){
        const dx=e.clientX-this.down.x,dy=e.clientY-this.down.y;
        if(!this.down.moved&&Math.hypot(dx,dy)>8){
          this.down.moved=true;input.setPointerCapture(e.pointerId);
          if(this.down.from){
            this.drag={from:this.down.from,target:null,reason:null,labelPositions:new Map(this.labelPositions)};
            input.dataset.dragging='true';this.onDrag?.('start',this.down.from);
          }
        }
        if(this.drag)this.updateDrag(e);
        else if(this.down.moved&&this.zoom>1&&!this.pinch){this.viewPan={u:this.down.pan.u-dx/this.framing.scale,v:this.down.pan.v+dy/this.framing.scale};this.resize();}
        return;
      }
      this.onHover(e.target.closest('.garrison')?.dataset.cell||this.pick(e));
    });
    input.addEventListener('pointerup',e=>{
      if(this.down?.moved){this.suppressClickUntil=performance.now()+350;this.suppressNextClick=true;}
      if(this.drag){this.updateDrag(e);this.endDrag();}
      else if(this.down?.retargeted)this.suppressNextClick=true;
      if(this.pointers.size===1&&this.down&&!this.down.moved&&this.down.button===0){
        if(!this.down.label){const hit=this.hitAt(e);this.onSelect(hit.id,hit.reason==='cliff'?'cliff':null);}
        else if(this.down.retargeted)this.onSelect(this.down.label);
      }
      this.pointers.delete(e.pointerId);if(!this.pointers.size){this.pinch=null;this.down=null;}
    });
    input.addEventListener('pointerleave',()=>{if(!this.pointers.size)this.onHover(null);});
    input.addEventListener('pointercancel',()=>this.cancelGesture());
    // Touch transfers implicit capture from a badge to the stage. That loss
    // bubbles from the badge and is not a cancelled gesture.
    input.addEventListener('lostpointercapture',e=>{if(e.target===input&&this.pointers.has(e.pointerId))this.cancelGesture();});
    input.addEventListener('wheel',e=>{e.preventDefault();if(this.pointers.size)return;const rect=canvas.getBoundingClientRect();this.zoomBy(e.deltaY>0?.92:1.08,{x:e.clientX-rect.left,y:e.clientY-rect.top});},{passive:false});
  }
  effect(event){technologyEffect(this,event);}
  clearEffects(){clearTechnology(this);}
  render(time){
    if(this.disposed)return;
    const selected=this.game.cell(this.selected),labelEntries=[],movingFrom=new Set(this.game.orders.map(o=>o.path[0])),movingTo=new Set(this.game.orders.map(o=>o.path.at(-1)));
    const touch=matchMedia('(max-width:640px)').matches;
    for(const c of this.game.cells){
      const {marker,fill,action}=this.markers.get(c.id),isSelected=c.id===this.selected,reachable=selected&&selected.owner==='orange'&&!!this.game.path(selected,c),hover=c.id===this.hovered,owned=c.owner!=='neutral',isTarget=c.id===this.pending;
      const moving=movingFrom.has(c.id)||movingTo.has(c.id),key=c.kind==='hq'||c.kind==='relay',front=owned&&neighbors(this.game.cells,c).some(n=>n.owner!=='neutral'&&n.owner!==c.owner&&traversable(c,n));
      const priority=isSelected||isTarget||key||moving||c.units>=30?'important':reachable||hover||front?'normal':selected||!owned?'quiet':'normal';
      marker.material.color.setHex(owned?COLORS[c.owner]:0xc9d0bb);marker.material.opacity=owned?.95:.62;
      fill.material.color.setHex(owned?COLORS[c.owner]:0xcbce9e);fill.material.opacity=owned?(isSelected?.34:.28):reachable?.025:0;
      if(hover)fill.material.opacity+=.045;fill.visible=fill.material.opacity>.001;
      action.visible=!!(isSelected||isTarget||reachable);action.material.color.setHex(isTarget&&this.drag&&!reachable?0xd49079:isTarget?0xf4efe0:isSelected?0xf2d9a4:0xd1c9a9);action.material.opacity=(isSelected||isTarget)?.98:hover?.68:.40;
      const el=this.labelsById.get(c.id),anchorZ=c.z+(c.kind==='hq'?.82:c.kind==='relay'?.68:.38),pos=this.project(c.x,surfaceHeight(this.game.cells,c,c.x,anchorZ)+.24,anchorZ);
      const classes=`garrison ${c.owner}${isSelected?' selected':''}${reachable?' reachable':''}${moving?' in-transit':''}`;if(el.className!==classes)el.className=classes;
      if(el.dataset.priority!==priority)el.dataset.priority=priority;const role=isSelected?'source':isTarget?'target':movingTo.has(c.id)?'incoming':movingFrom.has(c.id)?'outgoing':'field';if(el.dataset.role!==role)el.dataset.role=role;
      const count=String(Math.floor(c.units)),symbol=c.kind==='hq'?'⌂':c.kind==='relay'?'⌁':'';if(el.querySelector('.count').textContent!==count)el.querySelector('.count').textContent=count;if(el.querySelector('.cell-symbol').textContent!==symbol)el.querySelector('.cell-symbol').textContent=symbol;
      el.setAttribute('aria-label',`${isSelected?'Quelle, ':isTarget?'Ziel, ':''}${c.name}, ${c.owner==='orange'?'Orange':c.owner==='blue'?'Blau':'neutral'}, ${Math.floor(c.units)} Truppen, Höhe ${c.height}`);el.setAttribute('aria-pressed',String(isSelected));
      const show=c.owner!=='neutral'||c.kind==='relay'||reachable||hover||moving;
      el.style.visibility=!show||pos.x<12||pos.x>this.width-12||pos.y<12||pos.y>this.height-12?'hidden':'visible';
      const hitWidth=Math.max(touch?44:38,count.length*8+16);if(el.style.width!==`${hitWidth}px`)el.style.width=`${hitWidth}px`;
      if(el.style.visibility==='visible')labelEntries.push({id:c.id,el,pos,width:hitWidth,strategic:key?1:0});
    }
    this.layoutLabels(labelEntries);
    const target=this.game.cell(this.pending||this.hovered),path=selected&&target?this.game.path(selected,target):null;
    this.pathLine.visible=!!path;
    const pathKey=path?.map(c=>c.id).join('|');
    if(path&&pathKey!==this.lastPathKey){const pts=[];for(let i=0;i<path.length-1;i++)for(let s=0;s<=8;s++){const a=path[i],b=path[i+1],t=s/8,x=T.MathUtils.lerp(a.x,b.x,t),z=T.MathUtils.lerp(a.z,b.z,t);pts.push(new T.Vector3(x,surfaceHeight(this.game.cells,t<.5?a:b,x,z)+.15,z));}this.pathLine.geometry.dispose();this.pathLine.geometry=new T.BufferGeometry().setFromPoints(pts);this.pathLine.computeLineDistances();}this.lastPathKey=pathKey;
    if(this.drag){
      const amount=Math.max(0,Math.min(Math.floor(selected?.units||0)-1,Math.floor((selected?.units||0)*(this.orderFraction??1))));
      const valid=!!path&&target?.id!==selected?.id&&amount>0&&selected?.owner==='orange'&&this.game.running&&!this.game.paused;
      const text=valid?`Loslassen · ${amount} Truppen`:this.drag.reason==='cliff'?'Felswand · kein Ziel':!target?'Außerhalb · Abbrechen':target===selected?'Zum Zielfeld ziehen':amount<1?'Mindestens 2 Truppen nötig':'Kein begehbarer Weg';
      this.dragTip.hidden=false;this.dragTip.dataset.valid=String(valid);
      if(this.dragTip.textContent!==text)this.dragTip.textContent=text;
      this.dragTip.style.left=`${T.MathUtils.clamp(this.drag.x,100,this.width-100)}px`;
      this.dragTip.style.top=`${T.MathUtils.clamp(this.drag.y-48,12,this.height-48)}px`;
    }
    updateTechnology(this,time);this.renderer.render(this.scene,this.camera);
  }
}
