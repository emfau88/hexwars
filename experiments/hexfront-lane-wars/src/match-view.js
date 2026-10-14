import * as T from 'three';
import {BattleView} from './battle-view.js';
import {createFactories,updateFactories} from './factory-view.js';
import {exitPose,laneEntry,baseSign} from './match-layout.js';
import {groundHeight,routePoint} from './routes.js';
import {missionRoute} from './missions.js';
import {firstHeight} from './landscape-view.js';
export class MatchView extends BattleView {
 constructor(stage,labels,onSelect,onFactory,mission=null){super(stage,labels,onSelect,{single:mission?.lanes===1});this.mission=mission;this.onFactory=onFactory;this.factoryBuildings=createFactories(this.scene,mission);this.factoryLabels=[];this.safeBottom=330;this.resize();}
 point(u,height=0){
   if(u.hq)return new T.Vector3(0,height+.9,baseSign(u.hq)*10.3);
   if(u.departing){const p=exitPose(u,this.matchTime||0);return new T.Vector3(p.x,(this.mission?.lanes===1?firstHeight:groundHeight)(p.x,p.z)+height,p.z);}
   const p=missionRoute(this.mission,u.lane,u.p,u.x);if(p)return new T.Vector3(p.x,firstHeight(p.x,p.z)+height,p.z);
   return super.point(u,height);
 }
 heading(u,lane,game){return u.departing?exitPose(u,this.matchTime||0).yaw:super.heading(u,lane,game);}
 pick(e){
   if(this.onLanePick?.(e))return;
   const rect=this.stage.getBoundingClientRect();this.raycaster.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),this.camera);
   const hit=this.raycaster.intersectObjects(Object.values(this.factoryBuildings).filter(b=>b.owner==='orange').map(b=>b.root),true)[0];
   if(hit){let object=hit.object;while(object.parent&&object.parent!==this.scene)object=object.parent;const factory=Object.values(this.factoryBuildings).find(f=>f.root===object);if(factory){this.onFactory(factory.slot);return;}}
   super.pick(e);
 }
 matchEvent(e){
   if(e.kind==='production'){const f=this.factoryBuildings[e.owner+':'+e.factory];if(f)f.lastProduction=e.time;return;}
   if(e.kind==='hq-shot'){
     const from=this.point({hq:e.owner},.65),to=this.point(e.to,.65),root=new T.Group(),beam=this.line(from,to,e.owner==='orange'?0xe9b16b:0x90c8e0,.04),pulse=new T.Mesh(new T.SphereGeometry(.1,6,5),new T.MeshBasicMaterial({color:0xffddaa})),muzzle=pulse.clone();root.add(beam,pulse,muzzle);this.scene.add(root);this.effects.push({root,age:0,life:.24,kind:'shot',from,to,pulse,beam,muzzle});return;
   }
   if(e.kind==='shot'&&String(e.target).startsWith('hq-'))e={...e,to:{...e.to,hq:e.target.slice(3)}};
   this.effect(e,e.lane);
 }
 renderMatch(match,dt=0,draw=true){
   this.currentMatch=match;const state=JSON.stringify([match.tick,match.phase,match.players.orange.factories,match.players.orange.pending,match.players.blue.factories]);if(state!==this.renderState)this.dirty=true;this.renderState=state;
   this.matchTime=match.time+Math.max(0,match.remainder||0);updateFactories(this.factoryBuildings,match);
   const lanes=match.lanes.map((g,lane)=>({units:[...g.units,...match.transit.filter(u=>u.lane===lane).map(u=>({...u,departing:true,p:laneEntry(u.owner,this.mission),target:null}))]}));

   if(this.hqs)for(const [i,hq] of this.hqs.entries()){const owner=i===0?'orange':'blue';const scale=match.players[owner].hq>0?1:.28;if(hq.scale.y!==scale)this.dirty=true;hq.scale.y=scale;hq.position.y=match.players[owner].hq>0?.04:-.25;}
   super.render(lanes,this.matchTime,dt,draw);
 }
 buildingBounds(root){const box=new T.Box3().setFromObject(root),pts=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])pts.push(new T.Vector3(x,y,z).project(this.camera));return {left:Math.min(...pts.map(p=>(p.x*.5+.5)*this.stage.clientWidth)),right:Math.max(...pts.map(p=>(p.x*.5+.5)*this.stage.clientWidth)),top:Math.min(...pts.map(p=>(-.5*p.y+.5)*this.stage.clientHeight)),bottom:Math.max(...pts.map(p=>(-.5*p.y+.5)*this.stage.clientHeight))};}
 laneAt(clientX,clientY){
  const rect=this.stage.getBoundingClientRect();let closest=null,distance=Infinity;
  for(let lane=0;lane<(this.mission?.lanes||2);lane++)for(let p=5;p<=25;p+=.5){const v=this.point({lane,p,x:0}).project(this.camera),x=(v.x*.5+.5)*rect.width+rect.left,y=(-v.y*.5+.5)*rect.height+rect.top,d=Math.hypot(clientX-x,clientY-y);if(d<distance){distance=d;closest=lane;}}
  return distance<Math.max(25,this.frame.scale*2.3)?closest:null;
 }
 highlightLane(lane){if(this.laneHighlight){this.laneHighlight.removeFromParent();this.laneHighlight.geometry.dispose();this.laneHighlight.material.dispose();this.laneHighlight=null;}if(lane===null)return;const pts=[];for(let p=4;p<=26;p+=.25)pts.push(this.point({lane,p,x:0},.08));const curve=new T.CatmullRomCurve3(pts);this.laneHighlight=new T.Mesh(new T.TubeGeometry(curve,90,.16,6,false),new T.MeshBasicMaterial({color:0xffd790,transparent:true,opacity:.85,depthWrite:false}));this.scene.add(this.laneHighlight);this.dirty=true;}
 laneScreens(){return Array.from({length:this.mission?.lanes||2},(_,lane)=>{const p=this.point({lane,p:15,x:0}).project(this.camera);return {lane,x:(p.x*.5+.5)*this.stage.clientWidth,y:(-.5*p.y+.5)*this.stage.clientHeight};});}
 factoryScreens(){
   return Object.values(this.factoryBuildings).map(f=>{const v=f.root.position.clone().add(new T.Vector3(0,1.9,0)).project(this.camera);return {owner:f.owner,slot:f.slot,state:f.root.userData.state,visible:f.root.visible,bounds:this.buildingBounds(f.root),x:(v.x*.5+.5)*this.stage.clientWidth,y:(-.5*v.y+.5)*this.stage.clientHeight};});
 }
}