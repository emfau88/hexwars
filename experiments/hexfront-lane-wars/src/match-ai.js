import {TYPES,UNITS,other} from './rules.js';
import {MATCH_RULES} from './match.js';
export const AI_PROFILES=['balanced','pressure','economy'];
export function startingFactories(profile='balanced',variant=0){
  const lane=variant%2;
  if(profile==='pressure')return [{type:'drone',lane},{type:'mech',lane}];
  if(profile==='economy')return [{type:'rail',lane},{type:'mech',lane:1-lane}];
  return [{type:'mech',lane},{type:'rail',lane:1-lane}];
}
export class MatchAI {
  constructor(owner,{profile='balanced',reactive=true,variant=0,opening=null,reaction=50,refitInterval=30,buildAfter=0}={}){
    if(!AI_PROFILES.includes(profile))throw Error('Unknown AI profile.');
    this.reaction=reaction;this.refitInterval=refitInterval;this.buildAfter=buildAfter;this.owner=owner;this.profile=profile;this.reactive=reactive;this.variant=variant;this.opening=opening;this.next=reaction;this.previous=null;this.lastRefit=-100;this.actions=[];
  }
  save(){return structuredClone({...this});}
  static restore(data){const ai=new MatchAI(data.owner,data);Object.assign(ai,structuredClone(data));return ai;}
  update(match){
    if(match.tick<this.next||match.phase!=='running')return;this.next=match.tick+this.reaction;
    const now=match.observe(this.owner),seen=this.previous;this.previous=now;if(!seen)return;
    const rules=match.rules,enemy=other(this.owner),laneCount=now.laneCount??2,slotCount=now.slotCount??now.factories.length;
    const score=lane=>seen.units.filter(u=>u.owner===enemy&&u.lane===lane).reduce((sum,u)=>sum+u.hp/UNITS[u.type].hp,0);
    const laneIds=Array.from({length:laneCount},(_,i)=>i);
    const threat=laneIds.map(lane=>seen.units.filter(u=>u.owner===enemy&&u.lane===lane&&Math.abs(u.p-(this.owner==='orange'?0:30))<10).length);
    const defend=threat.some(Boolean)?laneIds.reduce((a,b)=>threat[b]>threat[a]?b:a):null;
    const weak=laneIds.reduce((a,b)=>score(b)<score(a)?b:a);
    const swarmPush=this.reactive&&seen.enemyFactories.filter(f=>f?.type==='rail').length>=3&&seen.enemyFactories.filter(f=>f?.type==='mech').length<=1;
    const lane=swarmPush?this.variant%laneCount:this.reactive?(defend??weak):(this.variant%laneCount);
    const counter=lane=>{
      if(swarmPush)return 'drone';
      if(!this.reactive)return this.profile==='pressure'?'drone':(Math.floor(now.time/30)+this.variant)%2?'mech':'rail';
      const amounts=Object.fromEntries(TYPES.map(t=>[t,0]));
      for(const f of seen.enemyFactories)if(f?.lane===lane)amounts[f.type]+=2;
      for(const u of seen.units)if(u.owner===enemy&&u.lane===lane)amounts[u.type]+=u.hp/UNITS[u.type].hp/UNITS[u.type].count;
      const dominant=TYPES.reduce((a,b)=>amounts[b]>amounts[a]?b:a,'drone');
      if(amounts.mech&&amounts.rail&&amounts.drone<amounts.mech*.7)return 'drone';
      return {drone:'mech',mech:'rail',rail:'drone'}[dominant];
    };
    const order=(action,data={})=>{const result=match.command(this.owner,action,data);if(result.ok)this.actions.push({time:now.time,action,...data});return result.ok;};
    const total=now.factories.filter(Boolean).length+now.pending.filter((p,i)=>p&&!now.factories[i]).length;
    const economyFirst=this.opening==='economy'||(!this.opening&&this.profile==='economy');
    if(!now.economy&&economyFirst){if(now.credits>=rules.economyCost)order('economy');return;}
    const empty=now.factories.findIndex((f,i)=>!f&&!now.pending[i]);
    if(empty>=0&&now.time>=this.buildAfter&&now.credits>=rules.factoryCost){
      const dest=swarmPush?lane:this.reactive?(defend??(empty%2===0?lane:(lane+1)%laneCount)):empty%laneCount;
      order('factory',{slot:empty,type:counter(dest),lane:dest});return;
    }
    if(!now.economy&&total===slotCount&&now.credits>=rules.economyCost&&!(defend!==null&&now.hq<rules.hqHP*.4)){order('economy');return;}
    if(this.reactive&&total===slotCount&&now.time-this.lastRefit>=(swarmPush?15:this.refitInterval)&&now.credits>=rules.refitCost+(now.economy?0:rules.economyCost)){
      const slots=now.factories.map((f,i)=>({f,i})).filter(({f,i})=>f&&!now.pending[i]);
      const change=swarmPush?slots.find(({f})=>f.type!=='drone'||f.lane!==lane):slots.find(({f})=>f.lane===lane&&f.type!==counter(lane))||slots.find(({f})=>defend!==null&&f.lane!==defend&&slots.filter(s=>s.f.lane===defend).length<2);
      if(change&&order('factory',{slot:change.i,type:counter(lane),lane})){this.lastRefit=now.time;return;}
    }
    if(now.supplyCooldown===0&&now.credits>=rules.supplyCost&&((total===slotCount&&now.economy)||defend!==null&&now.hq<rules.hqHP*.3))order('supply',{type:counter(lane),lane});
  }
}