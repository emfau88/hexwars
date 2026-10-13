import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle,chooseOrder} from '../src/game.js';
import {MISSIONS,getMission} from '../src/missions.js';
import {createMap,neighbors,traversable,graphDistance,rampsFor,edgeKey,surfaceHeight,STEP,corner,cornerHeight} from '../src/map.js';
import {transportPose} from '../src/transport.js';
import {cameraBasis} from '../src/camera.js';

// Protect the original scenario's authored terrain and starting state.
function legacyMap(){
 const cells=[];
 for(let r=-3;r<=3;r++)for(let q=Math.max(-3,-r-3);q<=Math.min(3,-r+3);q++){
  const id=`${q},${r}`,d=Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r)),height=d<=1?2:(id==='-2,1'||id==='2,-1'?1:0);
  const hq=id==='-2,3'?'orange':id==='2,-3'?'blue':null,owner=hq||(['-2,2','-1,2'].includes(id)?'orange':['2,-2','1,-2'].includes(id)?'blue':'neutral');
  const kind=hq?'hq':id==='0,0'?'relay':height===1?'ramp':'field';
  cells.push({id,q,r,height,hq,owner,kind,units:hq?(owner==='orange'?40:36):owner!=='neutral'?9:kind==='relay'?12:height===2?4:3});
 }
 return cells;
}
test('campaign data preserves original map, while mission selection and restart retain the chosen scenario',()=>{
 assert.equal(MISSIONS.length,3);assert.throws(()=>new Battle({missionId:'missing'}),/Unknown mission/);
 const original=createMap().map(({id,q,r,height,hq,owner,kind,units})=>({id,q,r,height,hq,owner,kind,units}));
 assert.deepEqual(original,legacyMap());
 const g=new Battle({missionId:'windpass'});g.start();g.send('-2,4','-3,4');g.update(.05);g.reset();
 assert.equal(g.mission,getMission('windpass'));assert.equal(g.missionId,'windpass');assert.deepEqual(g.snapshot(),new Battle({missionId:'windpass'}).snapshot());
});
test('new missions have distinct connected outlines, true tiers, HQs and legal crossings',()=>{
 for(const id of ['windpass','auenstrom']){
  const cells=createMap(id),mission=getMission(id),pass=new Set();assert.equal(cells.length,mission.fields);assert.equal(new Set(cells.map(c=>c.id)).size,cells.length);
  assert.deepEqual([...new Set(cells.map(c=>c.height))].sort(),[0,1,2]);assert.equal(cells.filter(c=>c.hq).length,2);assert.equal(cells.filter(c=>c.kind==='relay').length,1);
  for(const c of cells){assert.ok(Number.isFinite(graphDistance(cells,cells[0],c)));for(const n of neighbors(cells,c))if(c.height!==n.height&&traversable(c,n))pass.add(edgeKey(c,n));}
  assert.deepEqual(pass,rampsFor(id));
 }
 const canyon=createMap('windpass'),river=createMap('auenstrom');
 assert.equal(canyon.some(c=>c.id==='0,0'),false,'The canyon is an actual gap');
 assert.deepEqual(river.filter(c=>c.r===0).map(c=>c.q),[-2,0,2],'Exactly three river crossings');
 assert.notDeepEqual(canyon.map(c=>c.id),river.map(c=>c.id));
 assert.equal(canyon.find(c=>c.kind==='relay').q,-2,'Relay sits on the western ridge, not in the center');
});
test('each canyon route is playable and removing all three river crossings disconnects the banks',()=>{
 const canyon=createMap('windpass'),a=canyon.find(c=>c.hq==='orange'),b=canyon.find(c=>c.hq==='blue');
 for(const omit of [['1,0'],['-2,0']])assert.ok(Number.isFinite(graphDistance(canyon.filter(c=>!omit.includes(c.id)),a,b)));
 const river=createMap('auenstrom'),south=river.find(c=>c.hq==='orange'),north=river.find(c=>c.hq==='blue');
 assert.equal(graphDistance(river.filter(c=>c.r!==0),south,north),Infinity);
 for(const q of [-2,0,2])assert.ok(Number.isFinite(graphDistance(river.filter(c=>c.r!==0||c.q===q),south,north)));
});
test('new ramp joins and transport poses remain continuous in both directions',()=>{
 for(const id of ['windpass','auenstrom']){const g=new Battle({missionId:id});
 for(const edge of rampsFor(id))for(const reverse of [false,true]){
  const path=edge.split('|');if(reverse)path.reverse();const [a,b]=path.map(id=>g.cell(id));
  const x=(a.x+b.x)/2,z=(a.z+b.z)/2;assert.ok(Math.abs(surfaceHeight(g.cells,a,x,z)-surfaceHeight(g.cells,b,x,z))<1e-6);
  let previous;for(let i=0;i<=1000;i++){
   const p=transportPose(g,{path,segment:0,id:1,owner:'orange',progress:i/1000},0,true),c=p.t<.5?a:b;
   assert.ok(p.y-surfaceHeight(g.cells,c,p.x,p.z)>=.33999);
   if(previous)assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z)<.012);previous=p;
  }
 }}
});
test('both new missions win with human-cadence half/all commands, lose on inactivity and reset',()=>{
 for(const id of ['windpass','auenstrom'])for(const play of [true,false]){
  const g=new Battle({missionId:id});g.start();let next=3;
  for(let tick=0;tick<14000&&!g.result;tick++){
   g.update(.05);
   for(const o of g.orders)for(let i=1;i<o.path.length;i++)assert.ok(traversable(g.cell(o.path[i-1]),g.cell(o.path[i])));
   if(play&&g.time>next){const a=chooseOrder(g,'orange');if(a)assert.equal(g.send(a.from,a.to,a.fraction<.65?.5:1).ok,true);next=g.time+(id==='windpass'?5:6);}
   assert.ok(g.cells.every(c=>Number.isFinite(c.units)&&c.units>=0));g.drainEvents();
  }
  assert.equal(g.result,play?'victory':'defeat');assert.ok(g.aiCommands>5);
  console.log(`${id} ${g.result}: ${g.time.toFixed(2)}s, ${g.commands} player / ${g.aiCommands} AI commands`);
  const final=g.snapshot();g.update(.1);assert.deepEqual(g.snapshot(),final);g.reset();assert.deepEqual(g.snapshot(),new Battle({missionId:id}).snapshot());
 }
});

// A geometric visibility guard, complementary to the runtime prop/picking screenshots.
test('all new terrain centers are visible from the unchanged 70-degree tactical camera',()=>{
 for(const missionId of ['windpass','auenstrom']){const cells=createMap(missionId),direction=cameraBasis(70).out;
 const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),sub=(a,b)=>a.map((x,i)=>x-b[i]);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 function intersects(o,a,b,c){
  const ab=sub(b,a),ac=sub(c,a),p=cross(direction,ac),det=dot(ab,p);if(Math.abs(det)<1e-8)return false;
  const t=sub(o,a),u=dot(t,p)/det;if(u<0||u>1)return false;const q=cross(t,ab),v=dot(direction,q)/det;
  return v>=0&&v+u<=1&&dot(ac,q)/det>.00001;
 }
 const triangles=cells.flatMap(c=>Array.from({length:6},(_,i)=>{
  const a=corner(c,i),b=corner(c,(i+1)%6);return {cell:c.id,points:[[c.x,c.height*STEP,c.z],[a.x,cornerHeight(cells,c,i),a.z],[b.x,cornerHeight(cells,c,(i+1)%6),b.z]]};
 }));
 for(const c of cells){const o=[c.x,c.height*STEP+.02,c.z];assert.ok(!triangles.some(t=>t.cell!==c.id&&intersects(o,...t.points)),`${c.id} is hidden by terrain`);}
}
});
