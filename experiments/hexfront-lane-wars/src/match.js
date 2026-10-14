import {Combat} from './simulation.js';
import {STEP,LENGTH,OWNERS,TYPES,UNITS,other,distance} from './rules.js';
import {exitDuration,laneEntry} from './match-layout.js';
import {missionById} from './missions.js';

export const MATCH_RULES=Object.freeze({startCredits:200,factoryCost:100,refitCost:30,income:2,economyCost:80,economyIncome:1,supplyCost:60,supplyCooldown:15,wave:15,hqHP:1200,hqDamage:8,hqInterval:.8,hqRange:4});
const validConfig=c=>c&&TYPES.includes(c.type)&&(c.lane===0||c.lane===1);
const clone=x=>structuredClone(x);

/** The M1 step, movement, aiming, splash and simultaneous robot hits stay inherited. */
export class MatchLane extends Combat {
  constructor(match,lane){super();this.match=match;this.lane=lane;this.result=null;}
  resolveResult() { this.result=null; }
  chooseTarget(unit,snapshot) {
    const robot=super.chooseTarget(unit,snapshot);if(robot)return robot;
    const owner=other(unit.owner),p=owner==='orange'?0:LENGTH;
    if(this.match.players[owner].hq>0&&Math.abs(p-unit.p)<=UNITS[unit.type].range+1e-9)
      return {id:'hq-'+owner,owner,p,x:unit.x,lane:this.lane,order:Infinity};
    return null;
  }
}

export class Match {
  constructor({orange,blue,rules={},mission=null}={}) {
    this.mission=mission?missionById(typeof mission==='string'?mission:mission.id):null;
    this.laneCount=this.mission?.lanes||2;this.slotCount=this.mission?.slots||4;this.startSlots=this.mission?.startSlots||[0,1];
    orange??=this.mission?.start||[{type:'mech',lane:0},{type:'rail',lane:1}];blue??=orange;
    this.rules=Object.freeze({...MATCH_RULES,...this.mission?.rules,...rules});this.tick=0;this.time=0;this.remainder=0;this.phase='setup';this.result=null;this.wave=0;this.transit=[];this.serial=0;this.events=[];this.orders=[];this.controllers=[];
    this.players=Object.fromEntries(OWNERS.map(owner=>[owner,{cents:this.rules.startCredits*100,hq:this.rules.hqHP,hqCooldown:0,economy:false,supplyReady:0,factories:Array.from({length:this.slotCount},(_,i)=>this.startSlots.includes(i)?{...(owner==='orange'?orange:blue)[this.startSlots.indexOf(i)]}:null),pending:Array(this.slotCount).fill(null),metrics:{spent:0,earned:0,produced:0,hqDamage:0,builds:0,refits:0,laneChanges:0,supplies:0,economyAt:null}}]));
    for(const owner of OWNERS)if(!this.startSlots.every(i=>this.validConfig(this.players[owner].factories[i])))throw Error('Two valid starting factories required.');
    this.lanes=Array.from({length:this.laneCount},(_,i)=>new MatchLane(this,i));this.peakUnits=0;
  }
  validConfig(c){return validConfig(c)&&c.lane<this.laneCount;}
  get nextWave(){return this.phase==='setup'?0:Math.max(0,(this.wave* Math.round(this.rules.wave/STEP)-this.tick)*STEP);}
  credits(owner){return this.players[owner].cents/100;}
  income(owner){return this.rules.income+(this.players[owner].economy?this.rules.economyIncome:0);}
  record(owner,action,detail={}) {this.orders.push({time:this.time,owner,action,...detail});}
  command(owner,action,data={}) {
    const fail=reason=>({ok:false,reason}),p=this.players[owner];if(!p)return fail('Unbekannte Fraktion.');
    if(this.phase==='ended')return fail('Die Partie ist beendet.');
    if(action==='configure'){
      if(this.phase!=='setup'||!this.startSlots.includes(data.slot)||!this.validConfig(data))return fail('Zwei Startfabriken mit Typ und Lane wählen.');
      p.factories[data.slot]={type:data.type,lane:data.lane};return {ok:true};
    }
    if(this.phase!=='running')return fail('Zuerst die Partie starten.');
    if(action==='factory'||action==='cancel'){
      const slot=data.slot;if(!Number.isInteger(slot)||slot<0||slot>=this.slotCount)return fail('Ungültiger Fabrikplatz.');
      const old=p.pending[slot],refund=old?.paid||0;
      if(action==='cancel'){p.cents+=refund*100;p.pending[slot]=null;this.record(owner,'cancel',{slot,refund});return {ok:true};}
      if(!this.validConfig(data))return fail('Typ und Lane wählen.');
      const actual=p.factories[slot],paid=!actual?this.rules.factoryCost:actual.type!==data.type?this.rules.refitCost:0;
      if(p.cents+refund*100<paid*100)return fail('Nicht genügend Credits.');
      p.cents+=(refund-paid)*100;
      p.pending[slot]=actual&&actual.type===data.type&&actual.lane===data.lane?null:{type:data.type,lane:data.lane,paid};
      this.record(owner,'factory',{slot,type:data.type,lane:data.lane,paid});return {ok:true};
    }
    if(action==='economy'){
      if(p.economy)return fail('Wirtschaft bereits ausgebaut.');
      if(p.cents<this.rules.economyCost*100)return fail('Nicht genügend Credits.');
      p.cents-=this.rules.economyCost*100;p.economy=true;p.metrics.spent+=this.rules.economyCost;p.metrics.economyAt=this.time;this.record(owner,action);return {ok:true};
    }
    if(action==='supply'){
      if(!this.validConfig(data))return fail('Typ und Lane wählen.');
      if(this.tick<p.supplyReady)return fail('Sofortnachschub lädt noch auf.');
      if(p.cents<this.rules.supplyCost*100)return fail('Nicht genügend Credits.');
      p.cents-=this.rules.supplyCost*100;p.supplyReady=this.tick+Math.round(this.rules.supplyCooldown/STEP);p.metrics.spent+=this.rules.supplyCost;p.metrics.supplies++;this.spawn(owner,null,data);this.record(owner,action,{type:data.type,lane:data.lane});return {ok:true};
    }
    return fail('Unbekannter Auftrag.');
  }
  start() {
    if(this.phase!=='setup')return false;
    for(const owner of OWNERS){const p=this.players[owner];p.cents-=this.startSlots.length*this.rules.factoryCost*100;p.metrics.spent+=this.startSlots.length*this.rules.factoryCost;}
    this.phase='running';this.produceWave();return true;
  }
  spawn(owner,factory,config) {
    for(let i=0;i<UNITS[config.type].count;i++){
      const lateral=(i-(UNITS[config.type].count-1)/2)*.58;
      const duration=exitDuration(owner,factory,config.lane,config.type,lateral,this.mission);
      this.transit.push({id:-(++this.serial),owner,factory,type:config.type,lane:config.lane,missionId:this.mission?.id,hp:UNITS[config.type].hp,x:lateral,spawnTime:this.time,arrivalTick:this.tick+Math.max(1,Math.ceil(duration/STEP-1e-9)),moving:true});
      this.players[owner].metrics.produced++;
    }
    this.events.push({kind:'production',owner,factory,lane:config.lane,type:config.type,time:this.time});
  }
  produceWave() {
    for(const owner of OWNERS){
      const p=this.players[owner];
      for(let i=0;i<this.slotCount;i++){const pending=p.pending[i];if(!pending)continue;const prev=p.factories[i];p.metrics.spent+=pending.paid;if(!prev)p.metrics.builds++;else {if(prev.type!==pending.type)p.metrics.refits++;if(prev.lane!==pending.lane)p.metrics.laneChanges++;}
        p.factories[i]={type:pending.type,lane:pending.lane};p.pending[i]=null;
      }
    }
    for(const owner of OWNERS)this.players[owner].factories.forEach((f,i)=>{if(f)this.spawn(owner,i,f);});
    this.wave++;this.events.push({kind:'wave',wave:this.wave,time:this.time});
  }
  step() {
    if(this.phase!=='running')return;
    // All headquarters and robots choose attacks from the same pre-hit state.
    const hqHits=[];
    for(const owner of OWNERS){
      const p=this.players[owner];p.hqCooldown=Math.max(0,p.hqCooldown-STEP);
      const candidates=this.lanes.flatMap((g,lane)=>g.units.filter(u=>u.owner!==owner&&Math.abs(u.p-(owner==='orange'?0:LENGTH))<=this.rules.hqRange+1e-9).map(u=>({u,lane,d:Math.abs(u.p-(owner==='orange'?0:LENGTH))})));
      candidates.sort((a,b)=>(Math.abs(a.d-b.d)>1e-8?a.d-b.d:0)||a.u.order-b.u.order||a.lane-b.lane);
      if(candidates.length&&p.hqCooldown<=1e-9){const {u,lane}=candidates[0];hqHits.push({id:u.id,lane,owner,damage:this.rules.hqDamage});p.hqCooldown=this.rules.hqInterval;this.events.push({kind:'hq-shot',owner,lane,to:{p:u.p,x:u.x,lane},time:this.time});}
    }
    const damage={orange:0,blue:0};
    for(const [lane,g] of this.lanes.entries()){
      g.step();
      for(const e of g.drainEvents()){if(e.kind==='shot'&&String(e.target).startsWith('hq-'))damage[e.target.slice(3)]+=UNITS[e.type].damage;this.events.push({...e,lane});}
    }
    for(const hit of hqHits){
      const g=this.lanes[hit.lane],u=g.units.find(v=>v.id===hit.id);if(!u)continue;
      const amount=Math.min(u.hp,hit.damage);u.hp=Math.max(0,u.hp-hit.damage);this.events.push({kind:'hit',id:u.id,owner:u.owner,damage:amount,lane:hit.lane,time:this.time+STEP});
      if(!u.hp){g.stats[u.owner].lost++;this.events.push({kind:'destroyed',...u,lane:hit.lane,time:this.time+STEP});g.units=g.units.filter(v=>v!==u);}
    }
    this.tick++;this.time=this.tick*STEP;
    for(const owner of OWNERS){const p=this.players[owner],amount=Math.min(p.hq,damage[owner]);p.hq=Math.max(0,p.hq-damage[owner]);this.players[other(owner)].metrics.hqDamage+=amount;p.cents+=Math.round(this.income(owner)*STEP*100);p.metrics.earned+=Math.round(this.income(owner)*STEP*100)/100;}
    const dead=OWNERS.filter(owner=>this.players[owner].hq<=0);
    if(dead.length){this.phase='ended';this.result=dead.length===2?'draw':other(dead[0]);this.record(null,'end',{result:this.result});return;}
    for(const u of this.transit.filter(u=>u.arrivalTick<=this.tick)){
      const g=this.lanes[u.lane],unit=g.addUnit({type:u.type,owner:u.owner,lane:u.lane,p:laneEntry(u.owner,this.mission),x:u.x});unit.factory=u.factory;unit.spawnTime=u.spawnTime;
    }
    this.transit=this.transit.filter(u=>u.arrivalTick>this.tick);
    if(this.tick%Math.round(this.rules.wave/STEP)===0)this.produceWave();
    this.peakUnits=Math.max(this.peakUnits,this.transit.length+this.lanes.reduce((n,g)=>n+g.units.length,0));
    for(const controller of this.controllers)controller.update(this);
    if(this.events.length>4096)this.events.splice(0,this.events.length-4096);
  }
  advance(seconds){
    if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('Invalid duration.');
    if(this.phase!=='running')return;this.remainder+=seconds;
    while(this.remainder+1e-9>=STEP&&this.phase==='running'){this.step();this.remainder-=STEP;}
    if(this.phase==='ended')this.remainder=0;
  }
  observe(owner) {
    const p=this.players[owner],enemy=this.players[other(owner)];
    return clone({laneCount:this.laneCount,slotCount:this.slotCount,time:this.time,tick:this.tick,phase:this.phase,result:this.result,wave:this.wave,nextWave:this.nextWave,owner,credits:this.credits(owner),income:this.income(owner),economy:p.economy,supplyCooldown:Math.max(0,(p.supplyReady-this.tick)*STEP),hq:p.hq,enemyHQ:enemy.hq,factories:p.factories,pending:p.pending,enemyFactories:enemy.factories,units:this.lanes.flatMap(g=>g.units),departures:this.transit.map(({arrivalTick,...u})=>u)});
  }
  drainEvents(){return this.events.splice(0);}
  snapshot(){return clone({mission:this.mission?.id||null,tick:this.tick,phase:this.phase,result:this.result,wave:this.wave,players:this.players,lanes:this.lanes.map(g=>g.snapshot()),transit:this.transit});}
  save(){return clone({version:1,mission:this.mission?.id||null,rules:this.rules,tick:this.tick,time:this.time,remainder:this.remainder,phase:this.phase,result:this.result,wave:this.wave,players:this.players,transit:this.transit,serial:this.serial,orders:this.orders,peakUnits:this.peakUnits,lanes:this.lanes.map(g=>({...g.snapshot(),serial:g.serial,remainder:g.remainder}))});}
  static restore(data){
    if(!data||data.version!==1||!Number.isInteger(data.tick)||data.tick<0||!['setup','running','ended'].includes(data.phase))throw Error('Ungültiger Spielstand.');
    const m=new Match({mission:data.mission,rules:data.rules});
    if(data.lanes?.length!==m.laneCount||OWNERS.some(o=>data.players?.[o]?.factories?.length!==m.slotCount||data.players[o].pending?.length!==m.slotCount))throw Error('Spielstand passt nicht zur Mission.');
    for(const name of ['tick','time','remainder','phase','result','wave','players','transit','serial','orders','peakUnits'])m[name]=clone(data[name]);
    for(const [i,g] of m.lanes.entries())for(const name of ['tick','time','result','units','stats','serial','remainder'])g[name]=clone(data.lanes[i][name]);
    return m;
  }
  summary(){return {result:this.result||'unresolved',time:this.time,waves:this.wave,peakUnits:this.peakUnits,hq:Object.fromEntries(OWNERS.map(o=>[o,this.players[o].hq])),metrics:Object.fromEntries(OWNERS.map(o=>[o,{...this.players[o].metrics,earned:Number(this.players[o].metrics.earned.toFixed(2)),credits:this.credits(o)}])),lateOrders:this.orders.filter(o=>o.time>=120&&['factory','supply','economy'].includes(o.action)).length};}
}