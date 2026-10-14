import {OWNERS,LANES,LANE_LENGTH,HQ_HEALTH,INCOME,START_CREDITS,UNIT_LIMIT,QUEUE_LIMIT,STEP,UNITS,other} from './rules.js';

const faction = () => ({credits:START_CREDITS,hp:HQ_HEALTH,queue:[],active:null,repeat:false,earned:0,spent:0,produced:0,lost:0,damage:0,guard:0});
export class Battle {
  constructor({ai=true,difficulty='normal',seed=17}={}) {
    this.ai=ai;this.difficulty=difficulty;this.seed=seed;this.reset();
  }
  reset() {
    this.time=0;this.running=false;this.paused=false;this.result=null;this.serial=0;this.orderSerial=0;
    this.units=[];this.events=[];this.factions={orange:faction(),blue:faction()};this.nextAI={orange:2,blue:4};this.randomState=this.seed;
  }
  random() {this.randomState=(1664525*this.randomState+1013904223)>>>0;return this.randomState/4294967296;}
  emit(event) {this.events.push({...event,time:this.time});if(this.events.length>512)this.events.splice(0,this.events.length-512);}
  drainEvents() {return this.events.splice(0);}
  start() {if(!this.result)this.running=true;}
  pause(value=!this.paused) {if(this.running&&!this.result)this.paused=value;}
  queue(type,lane,owner='orange') {
    const f=this.factions[owner];
    if(!f||!UNITS[type]||!LANES.includes(lane))return {ok:false,reason:'Ungültiger Auftrag.'};
    if(!this.running||this.result)return {ok:false,reason:'Starte zuerst einen Einsatz.'};
    if(f.queue.length+(f.active?1:0)>=QUEUE_LIMIT)return {ok:false,reason:'Die Produktionsfolge ist voll.'};
    const order={id:++this.orderSerial,type,lane};f.queue.push(order);return {ok:true,order};
  }
  cancel(id,owner='orange') {
    const f=this.factions[owner];if(!f||!this.running||this.result)return false;
    if(f.active?.id===id){f.credits+=UNITS[f.active.type].cost;f.spent-=UNITS[f.active.type].cost;f.active=null;return true;}
    const index=f.queue.findIndex(o=>o.id===id);if(index<0)return false;f.queue.splice(index,1);return true;
  }
  repeat(value,owner='orange') {if(this.running&&!this.result&&this.factions[owner])this.factions[owner].repeat=!!value;}
  count(owner) {return this.units.filter(u=>u.owner===owner).length;}
  spawn(type,lane,owner) {
    const spec=UNITS[type],base=owner==='orange'?0:LANE_LENGTH,dir=owner==='orange'?1:-1;
    for(let n=0;n<spec.count;n++)this.units.push({id:++this.serial,type,lane,owner,hp:spec.hp,p:base+dir*n*.11,column:spec.count===3?n:(this.serial%3),cooldown:.4,born:this.time,moving:true});
    this.factions[owner].produced+=spec.count;this.emit({kind:'spawn',owner,lane,type});
  }
  production(dt) {
    for(const owner of OWNERS) {
      const f=this.factions[owner];f.credits+=INCOME*dt;f.earned+=INCOME*dt;
      if(!f.active&&f.queue.length) {
        const order=f.queue[0],spec=UNITS[order.type];
        if(f.credits+1e-7>=spec.cost&&this.count(owner)+spec.count<=UNIT_LIMIT) {
          f.queue.shift();f.credits-=spec.cost;f.spent+=spec.cost;f.active={...order,elapsed:0};
        }
      }
      if(!f.active)continue;
      f.active.elapsed=Math.min(UNITS[f.active.type].build,f.active.elapsed+dt);
      if(f.active.elapsed+1e-7>=UNITS[f.active.type].build) {
        const order=f.active;this.spawn(order.type,order.lane,owner);f.active=null;
        if(f.repeat&&f.queue.length<QUEUE_LIMIT)f.queue.push({id:++this.orderSerial,type:order.type,lane:order.lane});
      }
    }
  }
  // All shots are collected before damage is applied, including both HQ guns.
  // Each visible robot is one simulated unit; shots never spill over on death.
  combat(dt) {
    const damage=new Map(),baseDamage={orange:0,blue:0},positions=new Map(this.units.map(u=>[u.id,u.p]));
    const add=(id,amount)=>damage.set(id,(damage.get(id)||0)+amount);
    for(const u of this.units) {
      const spec=UNITS[u.type],dir=u.owner==='orange'?1:-1;u.cooldown=Math.max(0,u.cooldown-dt);u.moving=false;
      const enemies=this.units.filter(v=>v.owner!==u.owner&&v.lane===u.lane);
      enemies.sort((a,b)=>Math.abs(a.p-u.p)-Math.abs(b.p-u.p)||a.id-b.id);
      const target=enemies[0],distance=target?Math.hypot(target.p-u.p,(target.column-u.column)*.28):Infinity;
      const base=other(u.owner),baseDistance=u.owner==='orange'?LANE_LENGTH-u.p:u.p;
      if(distance<=spec.range || (!target&&baseDistance<=spec.range)) {
        if(u.cooldown>1e-7)continue;u.cooldown=spec.cooldown;
        if(target) {
          add(target.id,spec.damage);
          if(spec.splash)for(const v of enemies)if(v!==target&&Math.hypot(v.p-target.p,(v.column-target.column)*.28)<=spec.splash)add(v.id,spec.damage);
          this.emit({kind:'shot',owner:u.owner,type:u.type,from:{lane:u.lane,p:u.p,column:u.column},to:{lane:target.lane,p:target.p,column:target.column},splash:spec.splash});
        } else {
          baseDamage[base]+=spec.damage;this.factions[u.owner].damage+=spec.damage;
          this.emit({kind:'shot',owner:u.owner,type:u.type,from:{lane:u.lane,p:u.p,column:u.column},to:{lane:u.lane,p:base==='orange'?0:LANE_LENGTH,column:1},hq:base});
        }
        continue;
      }
      let next=u.p+dir*spec.speed*dt;
      // Three small columns permit swarms but prevent same-column stacking.
      for(const v of this.units)if(v!==u&&v.lane===u.lane) {
        const gap=(positions.get(v.id)-u.p)*dir;
        if(gap>0&&((v.owner===u.owner&&v.column===u.column)||v.owner!==u.owner)) {
          const spacing=v.owner===u.owner?.55:.38;
          if((next-positions.get(v.id))*dir>-spacing)next=positions.get(v.id)-dir*spacing;
        }
      }
      next=dir===1?Math.max(u.p,next):Math.min(u.p,next);u.moving=Math.abs(next-u.p)>.001;u.p=Math.max(0,Math.min(LANE_LENGTH,next));
    }
    for(const owner of OWNERS) {
      const f=this.factions[owner];f.guard=Math.max(0,f.guard-dt);
      const targets=this.units.filter(u=>u.owner!==owner&&(owner==='orange'?u.p:LANE_LENGTH-u.p)<2.7).sort((a,b)=>owner==='orange'?a.p-b.p:b.p-a.p);
      if(targets.length&&f.guard<=1e-7) {
        const v=targets[0];f.guard=1.4;add(v.id,8);
        this.emit({kind:'shot',owner,type:'guard',from:{lane:v.lane,p:owner==='orange'?0:LANE_LENGTH,column:1},to:{lane:v.lane,p:v.p,column:v.column}});
      }
      f.hp=Math.max(0,f.hp-baseDamage[owner]);
    }
    for(const u of this.units)u.hp=Math.max(0,u.hp-(damage.get(u.id)||0));
    for(const u of this.units.filter(u=>u.hp<=0)){this.factions[u.owner].lost++;this.emit({kind:'destroyed',owner:u.owner,type:u.type,lane:u.lane,p:u.p,column:u.column});}
    this.units=this.units.filter(u=>u.hp>0);
    if(OWNERS.some(o=>this.factions[o].hp<=0)) {
      this.result=this.factions.orange.hp<=0?(this.factions.blue.hp<=0?'draw':'defeat'):'victory';this.running=false;
      this.emit({kind:'result',result:this.result});
    }
  }
  plan(owner) {
    const f=this.factions[owner];if(f.queue.length||!this.running||this.result)return;
    const enemy=other(owner),lanes=LANES.map(lane=>{
      const hostile=this.units.filter(u=>u.owner===enemy&&u.lane===lane),friendly=this.units.filter(u=>u.owner===owner&&u.lane===lane);
      const score=hostile.reduce((s,u)=>s+UNITS[u.type].cost/UNITS[u.type].count*(.5+(owner==='orange'?1-u.p/LANE_LENGTH:u.p/LANE_LENGTH)),0)-friendly.reduce((s,u)=>s+UNITS[u.type].cost/UNITS[u.type].count,0);
      return {lane,hostile,score};
    }).sort((a,b)=>b.score-a.score);
    const lane=lanes[0].score-lanes[1].score>8?lanes[0]:lanes[Math.floor(this.random()*2)];
    const weights={drone:0,mech:0,rail:0};for(const u of lane.hostile)weights[u.type]+=u.hp/UNITS[u.type].hp*UNITS[u.type].cost/UNITS[u.type].count;
    const dominant=Object.keys(weights).sort((a,b)=>weights[b]-weights[a])[0];
    const counters={drone:'mech',mech:'rail',rail:'drone'};
    const type=weights[dominant]>8&&this.random()>.22?counters[dominant]:['drone','mech','rail'][Math.floor(this.random()*3)];
    this.queue(type,lane.lane,owner);
  }
  step(dt=STEP,{playerAI=false}={}) {
    if(!this.running||this.paused||this.result||!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(dt,STEP);this.time+=dt;
    for(const owner of OWNERS)if((owner==='blue'?this.ai:playerAI)&&this.time>=this.nextAI[owner]) {
      this.plan(owner);this.nextAI[owner]=this.time+(owner==='blue'&&this.difficulty==='relaxed'?5:2.1);
    }
    this.production(dt);this.combat(dt);
  }
  advance(seconds,options={}) {for(let i=0;i<Math.ceil(seconds/STEP)&&!this.result;i++)this.step(STEP,options);}
  snapshot() {return structuredClone({time:this.time,running:this.running,paused:this.paused,result:this.result,units:this.units,factions:this.factions});}
}
