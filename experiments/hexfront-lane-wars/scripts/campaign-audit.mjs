import fs from 'node:fs/promises';
import {Match} from '../src/match.js';
import {MatchAI} from '../src/match-ai.js';
import {MISSIONS} from '../src/missions.js';
function run(label,m,controllers,limit=720){
 m.controllers=controllers;m.start();const checkpoints=[];
 while(m.phase==='running'&&m.time<limit){m.advance(1);m.drainEvents();if(m.tick%1200===0)checkpoints.push({time:m.time,hq:[m.players.orange.hq,m.players.blue.hq],units:m.lanes.map(g=>g.units.length),credits:[m.credits('orange'),m.credits('blue')]});}
 return {label,mission:m.mission.id,...m.summary(),checkpoints,actions:controllers.flatMap(a=>(a.actions||[]).map(x=>({...x,owner:a.owner})))};
}
const cases=[];
for(const mission of Object.values(MISSIONS))for(const reactive of [false,true])for(const opening of ['factory','economy'])for(const profile of ['balanced','pressure']){
 const label=mission.id+'-'+(reactive?'reactive':'static')+'-'+opening+'-'+profile;
 cases.push(run(label,new Match({mission:mission.id}),[new MatchAI('orange',{profile,reactive,opening}),new MatchAI('blue',mission.ai)]));
}
class FixedPlan{
 constructor(owner,types,{economy=false,supply=true,laneMode='split'}={}){this.owner=owner;this.types=types;this.economy=economy;this.supply=supply;this.laneMode=laneMode;this.actions=[];}
 update(m){
  if(m.tick%50)return;const o=m.observe(this.owner),order=(action,data={})=>{if(m.command(this.owner,action,data).ok)this.actions.push({time:m.time,action,...data});};
  if(this.economy&&!o.economy){if(o.credits>=m.rules.economyCost)order('economy');return;}
  for(let i=0;i<m.slotCount;i++){const type=this.types[i%this.types.length],lane=this.laneMode==='focus'?0:i%m.laneCount,f=o.factories[i],pending=o.pending[i];
   if(!pending&&(!f||f.type!==type||f.lane!==lane)&&o.credits>=(!f?m.rules.factoryCost:f.type!==type?m.rules.refitCost:0)){order('factory',{slot:i,type,lane});return;}
  }
  if(!o.economy&&o.credits>=m.rules.economyCost){order('economy');return;}
  if(this.supply&&o.supplyCooldown===0&&o.credits>=m.rules.supplyCost)order('supply',{type:this.types[Math.floor(m.time/30)%this.types.length],lane:this.laneMode==='focus'?0:Math.floor(m.time/30)%m.laneCount});
 }
}
const mixes={drones:['drone'],mechs:['mech'],rails:['rail'],mechRail:['mech','rail'],varied:['drone','mech','rail','drone']},duels=[];
for(const [a,types] of Object.entries(mixes))for(const [b,other] of Object.entries(mixes)){
 if(a===b)continue;duels.push(run(a+'-vs-'+b,new Match({mission:'meadow'}),[new FixedPlan('orange',types),new FixedPlan('blue',other)]));
}
const controlled=[];
for(const economy of [false,true])for(const supply of [false,true])for(const hqDamage of [6,8,12]){
 controlled.push(run('eco-'+economy+'-supply-'+supply+'-hq-'+hqDamage,new Match({mission:'meadow',rules:{hqDamage}}),[new FixedPlan('orange',mixes.varied,{economy,supply}),new MatchAI('blue',MISSIONS.meadow.ai)]));
}
const summary=rows=>({total:rows.length,ended:rows.filter(x=>x.result!=='unresolved').length,target:rows.filter(x=>x.time>=(x.mission==='first'?120:240)&&x.time<=(x.mission==='first'?240:420)&&x.result!=='unresolved').length,orange:rows.filter(x=>x.result==='orange').length,draw:rows.filter(x=>x.result==='draw').length,min:Math.min(...rows.map(x=>x.time)),max:Math.max(...rows.map(x=>x.time))});
const report={description:'Deterministic complete-match probes; 720 s measurement cutoff is unresolved, never a game result. FixedPlan changes production through paid commands.',cases,duels,controlled,summary:{first:summary(cases.filter(x=>x.mission==='first')),meadow:summary(cases.filter(x=>x.mission==='meadow')),duels:summary(duels),controlled:summary(controlled)}};
await fs.mkdir(new URL('../docs/m21-qa/',import.meta.url),{recursive:true});await fs.writeFile(new URL('../docs/m21-qa/match-audit.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report.summary,null,2));for(const x of [...cases,...duels,...controlled])console.log(JSON.stringify({label:x.label,result:x.result,time:x.time,hq:x.hq}));
