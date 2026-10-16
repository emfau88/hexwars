import {other} from './rules.js';
export const CENTRAL_STRATEGIES=Object.freeze({
 pressure:{name:'Vorhut',description:'Frühe Fabriken und Drohnendruck',opening:['drone','drone'],army:['drone','mech','drone','rail'],economyAt:4},
 siege:{name:'Eisenkeil',description:'Mechs mit schwerem Fernkampf',opening:['mech','rail'],army:['mech','rail','rail','mech'],economyAt:3},
 economy:{name:'Aufbaukommando',description:'Frühe Wirtschaft, später Gegenproduktion',opening:['mech','drone'],army:['drone','rail','mech','rail'],economyAt:2}
});
export const centralOpening=strategy=>CENTRAL_STRATEGIES[strategy].opening.map(type=>({type,lane:0}));
/** No direct access to player state or future orders. Six-second observation delay.
 * Opening plans are followed first; later refits change one factory at a time.
 */
export class CentralAI{
 constructor(owner,{strategy='siege',reactive=true,supply=true,economyFirst=null}={}){
  if(!CENTRAL_STRATEGIES[strategy])throw Error('Unknown central strategy.');
  Object.assign(this,{kind:'central',owner,strategy,reactive,supply,economyFirst,next:120,previous:null,lastRefit:60,actions:[]});
 }
 save(){return structuredClone({...this});}
 static restore(data){const ai=new CentralAI(data.owner,data);Object.assign(ai,structuredClone(data));return ai;}
 update(match){
  if(match.phase!=='running'||match.tick<this.next)return;this.next=match.tick+120;
  const now=match.observe(this.owner),seen=this.previous;this.previous=now;if(!seen)return;
  const plan=CENTRAL_STRATEGIES[this.strategy],rules=match.rules,specs=match.unitSpecs,types=Object.keys(specs),enemy=other(this.owner);
  const configs=now.factories.map((f,i)=>now.pending[i]||f),total=configs.filter(Boolean).length;
  const strength=list=>list.reduce((s,u)=>s+u.hp/specs[u.type].hp/specs[u.type].count,0);
  const enemyNear=seen.units.filter(u=>u.owner===enemy&&(this.owner==='orange'?u.p<8:u.p>22));
  const danger=strength(enemyNear)>1&&now.hq<rules.hqHP*.7;
  const order=(action,data={})=>{const r=match.command(this.owner,action,data);if(r.ok)this.actions.push({time:now.time,action,...data});return r.ok;};
  const counts=Object.fromEntries(types.map(t=>[t,seen.enemyFactories.filter(f=>f?.type===t).length]));
  let desired=plan.army;
  if(this.reactive&&now.time>=110){
   const dominant=types.reduce((a,b)=>counts[b]>counts[a]?b:a);
   // Counter weights belong to the role registry, so new roles need no extra branch here.
   const ranked=types.map(type=>({type,score:types.reduce((s,foe)=>s+(specs[type].counters?.[foe]||0)*counts[foe],0)})).sort((a,b)=>b.score-a.score||plan.army.indexOf(a.type)-plan.army.indexOf(b.type));
   if(counts[dominant]>=2&&ranked[0].score>0)desired=[...plan.army.slice(0,2),ranked[0].type,ranked[0].type];
  }
  const ecoAt=this.economyFirst===null?plan.economyAt:this.economyFirst?2:4;
  if(!now.economy&&total>=ecoAt&&!danger&&now.credits>=rules.economyCost){order('economy');return;}
  const slot=configs.findIndex(f=>!f);
  if(slot>=0&&now.credits>=rules.factoryCost){
   const present=configs.filter(Boolean).map(f=>f.type),remaining=[...desired];
   for(const type of present){const i=remaining.indexOf(type);if(i>=0)remaining.splice(i,1);}
   order('factory',{slot,type:remaining[0]||desired[0],lane:0});return;
  }
  if(this.reactive&&total===4&&now.time-this.lastRefit>=30&&now.credits>=rules.refitCost){
   const remaining=[...desired],extra=[];
   configs.forEach((f,i)=>{const j=remaining.indexOf(f.type);if(j>=0)remaining.splice(j,1);else if(!now.pending[i])extra.push(i);});
   if(remaining.length&&extra.length&&order('factory',{slot:extra.at(-1),type:remaining[0],lane:0})){this.lastRefit=now.time;return;}
  }
  const own=seen.units.filter(u=>u.owner===this.owner),foes=seen.units.filter(u=>u.owner===enemy);
  const pushing=own.some(u=>this.owner==='orange'?u.p>18:u.p<12)&&strength(own)>strength(foes)*1.25;
  if(this.supply&&now.supplyCooldown===0&&now.credits>=rules.supplyCost+(danger?0:rules.refitCost)&&
    (danger||(total===4&&now.economy&&pushing))){
   const ranked=types.map(type=>({type,score:foes.reduce((s,u)=>s+(specs[type].counters?.[u.type]||0)*u.hp/specs[u.type].hp/specs[u.type].count,0)})).sort((a,b)=>b.score-a.score);
   order('supply',{type:ranked[0].type,lane:0});
  }
 }
}
