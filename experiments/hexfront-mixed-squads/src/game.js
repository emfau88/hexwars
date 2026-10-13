import {getMission} from './missions.js';
import {createMap,neighbors,traversable,route,graphDistance} from './map.js';
import {ECONOMY_MODE,economyState,ARMY_LIMIT,QUEUE_LIMIT,HQ_RESERVE} from './economy.js';
import {UNIT,UNIT_TYPES,troops,emptyTroops,cloneTroops,countTroops,countType,health,power,damageRate,mergeTroops,takeTroops,applyDamage,travelSeconds} from './units.js';
export {ECONOMY_MODE};
export const TRANSPORT_SECONDS_PER_HEX=1.1;
export const opposite=owner=>owner==='orange'?'blue':'orange';
export const defenseFactor=(from,to)=>1+Math.max(to.height>from.height?.30:0,to.kind==='hq'?.20:0);
export const attackFactor=(from,to)=>from.height>to.height?1.15:1;
export function forecast(from,to,formation) {
  const attacking=typeof formation==='number'?troops(formation):formation;
  const defense=defenseFactor(from,to),attack=attackFactor(from,to);
  const effective=power(attacking)*Math.sqrt(attack/defense),opposition=power(to.troops);
  return {effective,win:effective>opposition,remaining:Math.abs(effective-opposition),defense,attack};
}
function faction(){return {credits:64,queue:['drone','drone','mech'],repeat:true,productionPaused:false,active:null,rally:null,nextSupply:0,spent:0,produced:{drone:0,mech:0},earned:0};}
function counted(object) {Object.defineProperty(object,'units',{enumerable:true,get(){return countTroops(this.troops);}});return object;}
export class Battle {
  constructor({missionId='morgenwacht',ai=true}={}) {this.mission=getMission(missionId);this.missionId=this.mission.id;this.economyMode=ECONOMY_MODE;this.aiEnabled=ai;this.reset();}
  reset() {
    this.cells=createMap(this.missionId).map(c=>{
      const old=c.units;delete c.units;
      c.troops=c.hq?troops(c.owner==='orange'?14:13,2):c.owner==='neutral'?troops(old):troops(4);
      c.battle=null;return counted(c);
    });
    this.factions={orange:faction(),blue:faction()};this.economyCache=new Map();
    this.time=0;this.orders=[];this.events=[];this.result=null;this.running=false;this.paused=false;
    this.nextAI=7;this.serial=0;this.commands=0;this.captures=0;this.aiCommands=0;
  }
  cell(id){return this.cells.find(c=>c.id===id);}
  economy(owner) {
    const key=this.cells.map(c=>c.owner[0]).join(''),cached=this.economyCache.get(owner);
    if(cached?.key===key)return cached.value;
    const value=economyState(this.cells,owner);this.economyCache.set(owner,{key,value});return value;
  }
  start(){if(!this.result)this.running=true;}
  strength(owner){return this.cells.reduce((n,c)=>n+(c.owner===owner?c.units:0)+(c.battle?.owner===owner?countTroops(c.battle.troops):0),0)+this.orders.filter(o=>o.owner===owner).reduce((n,o)=>n+o.units,0);}
  fields(owner){return this.cells.filter(c=>c.owner===owner).length;}
  path(from,to){return route(this.cells,from,to);}
  ownedPath(from,to,owner) {
    if(!from||!to||from.owner!==owner||to.owner!==owner)return null;
    if(from===to)return [from];
    // An ongoing fight blocks through traffic. Defensive reinforcement at the
    // owned endpoint is allowed, so supply can help defend a rally point.
    return route(this.cells.filter(c=>!c.battle||c===from||c===to),from,to,owner);
  }
  preview(from,filter='all',fraction=1,reserve=0) {return from?takeTroops(cloneTroops(from.troops),filter,fraction,reserve):emptyTroops();}
  canCommand(owner){return !!this.factions[owner]&&this.running&&!this.paused&&!this.result;}
  canManage(owner){return !!this.factions[owner]&&this.running&&!this.result;}
  enqueue(type,owner='orange') {
    const f=this.factions[owner];if(!this.canManage(owner)||!UNIT_TYPES.includes(type))return {ok:false,reason:'Produktion ist gerade nicht verfügbar.'};
    if(f.queue.length+(f.active?1:0)>=QUEUE_LIMIT)return {ok:false,reason:'Die Warteschlange ist voll (12 Aufträge).'};
    f.queue.push(type);return {ok:true};
  }
  removeQueued(index,owner='orange') {const f=this.factions[owner];if(!this.canManage(owner)||!Number.isInteger(index)||index<0||index>=f.queue.length)return false;f.queue.splice(index,1);return true;}
  cancelProduction(owner='orange') {const f=this.factions[owner];if(!this.canManage(owner)||!f.active)return false;f.credits+=UNIT[f.active.type].cost;f.spent-=UNIT[f.active.type].cost;f.active=null;return true;}
  toggleRepeat(owner='orange'){if(!this.canManage(owner))return false;return this.factions[owner].repeat=!this.factions[owner].repeat;}
  toggleProduction(owner='orange'){if(!this.canManage(owner))return false;return this.factions[owner].productionPaused=!this.factions[owner].productionPaused;}
  setRally(id,owner='orange') {
    if(!this.canCommand(owner))return {ok:false,reason:'Die Schlacht ist angehalten.'};
    const target=this.cell(id);
    if(id!==null&&target?.owner!==owner)return {ok:false,reason:'Der Sammelpunkt muss auf einem eigenen Feld liegen.'};
    this.factions[owner].rally=id;this.factions[owner].nextSupply=this.time;
    return {ok:true};
  }
  send(fromId,toId,fraction=1,owner='orange',filter='all',kind='command',reserve=0) {
    const a=this.cell(fromId),b=this.cell(toId);
    if(!this.canCommand(owner))return {ok:false,reason:'Die Schlacht ist angehalten.'};
    if(!a||a.owner!==owner)return {ok:false,reason:'Wähle einen eigenen Verband.'};
    if(a.battle)return {ok:false,reason:'Dieser Verband ist im Gefecht gebunden.'};
    if(!b||a===b)return {ok:false,reason:'Wähle ein anderes Zielfeld.'};
    if(!['all',...UNIT_TYPES].includes(filter)||!Number.isFinite(fraction)||fraction<=0||fraction>1)return {ok:false,reason:'Ungültige Truppenauswahl.'};
    if(this.orders.filter(o=>o.owner===owner).length>=24)return {ok:false,reason:'24 Verbände sind unterwegs. Warte auf ihre Ankunft.'};
    const path=kind==='supply'?this.ownedPath(a,b,owner):this.path(a,b);
    if(!path)return {ok:false,reason:'Kein begehbarer Weg über eigenes Gebiet.'};
    const formation=takeTroops(a.troops,filter,fraction,reserve);
    if(!countTroops(formation))return {ok:false,reason:'Keine Einheiten dieses Typs verfügbar.'};
    const order=counted({id:++this.serial,owner,troops:formation,path:path.map(c=>c.id),segment:0,progress:0,kind,blocked:false,seconds:travelSeconds(formation)});
    this.orders.push(order);if(kind==='command')owner==='orange'?this.commands++:this.aiCommands++;
    this.events.push({type:'send',owner,from:a.id,to:b.id,units:order.units,kind});return {ok:true,order};
  }
  arrive(order,from,to) {
    if(to.owner===order.owner) {
      mergeTroops(to.troops,order.troops);
      this.events.push({type:'reinforce',id:to.id,from:from.id,owner:order.owner,units:order.units});return;
    }
    if(order.kind==='supply')throw Error('Supply must never attack');
    if(!to.battle)to.battle={owner:order.owner,troops:emptyTroops(),from:from.id,elapsed:0,tick:0};
    if(to.battle.owner!==order.owner)throw Error('Only two player factions are supported');
    mergeTroops(to.battle.troops,order.troops);
    this.events.push({type:'engage',id:to.id,from:from.id,owner:order.owner,previous:to.owner});
  }
  updateEconomy(dt) {
    for(const owner of ['orange','blue']) {
      const f=this.factions[owner],e=this.economy(owner),hq=this.cell(e.hqId);
      f.credits+=e.rate*dt;f.earned+=e.rate*dt;
      if(!hq||hq.battle||f.productionPaused)continue;
      if(!f.active&&f.queue.length&&this.strength(owner)<ARMY_LIMIT) {
        const type=f.queue[0],spec=UNIT[type];
        if(f.credits+1e-8>=spec.cost){f.credits=Math.max(0,f.credits-spec.cost);f.spent+=spec.cost;f.active={type,elapsed:0};f.queue.shift();}
      }
      if(!f.active)continue;
      const spec=UNIT[f.active.type];f.active.elapsed=Math.min(spec.seconds,f.active.elapsed+dt);
      if(f.active.elapsed+1e-8<spec.seconds||this.strength(owner)>=ARMY_LIMIT)continue;
      const type=f.active.type;mergeTroops(hq.troops,troops(type==='drone'?1:0,type==='mech'?1:0));
      f.produced[type]++;f.active=null;if(f.repeat)f.queue.push(type);
      this.events.push({type:'produced',id:hq.id,owner,unitType:type});
    }
  }
  updateSupply() {
    for(const owner of ['orange','blue']) {
      const f=this.factions[owner];if(this.time<f.nextSupply)continue;f.nextSupply=this.time+2;
      const hq=this.cell(this.economy(owner).hqId),target=this.cell(f.rally);
      if(hq&&target&&target!==hq&&target.owner===owner&&!hq.battle&&hq.units>HQ_RESERVE)
        this.send(hq.id,target.id,1,owner,'all','supply',HQ_RESERVE);
    }
  }
  updateOrders(dt) {
    for(const o of [...this.orders]) {
      let from=this.cell(o.path[o.segment]),to=this.cell(o.path[o.segment+1]);
      if(o.kind==='supply'&&o.progress===0) {
        // Replan only at a reached waypoint; changing the rally never teleports
        // a convoy. A cut route waits here until a friendly route is available.
        if(from.owner!==o.owner){this.orders.splice(this.orders.indexOf(o),1);this.events.push({type:'supplyLost',id:from.id,owner:o.owner});continue;}
        const target=this.cell(this.factions[o.owner].rally);
        if(from.battle){mergeTroops(from.troops,o.troops);this.orders.splice(this.orders.indexOf(o),1);continue;}
        if(!target||target===from){mergeTroops(from.troops,o.troops);this.orders.splice(this.orders.indexOf(o),1);continue;}
        const path=this.ownedPath(from,target,o.owner);
        if(!path||from.battle){o.blocked=true;continue;}
        o.path=path.map(c=>c.id);o.segment=0;to=path[1];o.blocked=false;
      }
      if(o.kind==='supply'&&to.owner!==o.owner) {
        // Stop on the safe end of this edge. Merge back into its defenders so
        // captured cargo cannot remain invulnerable inside hostile territory.
        if(from.owner===o.owner)mergeTroops(from.troops,o.troops);
        this.events.push({type:'supplyStopped',id:from.id,owner:o.owner});
        this.orders.splice(this.orders.indexOf(o),1);continue;
      }
      if(!traversable(from,to))throw Error('Invalid terrain edge');
      o.progress+=dt/o.seconds;
      if(o.progress<1-1e-8)continue;
      // If both factions reach neutral defenders, the later arrival waits at
      // the edge. It then reinforces the winner or starts the next engagement.
      if(to.battle&&to.owner!==o.owner&&to.battle.owner!==o.owner){o.progress=1;o.waiting=true;continue;}
      o.waiting=false;
      if(to.owner!==o.owner||to.battle||o.segment===o.path.length-2) {
        this.arrive(o,from,to);this.orders.splice(this.orders.indexOf(o),1);
      } else {o.segment++;o.progress=0;}
    }
  }
  capture(cell,battle) {
    const previous=cell.owner;cell.owner=battle.owner;cell.troops=battle.troops;cell.battle=null;
    if(cell.owner==='orange')this.captures++;
    this.events.push({type:'capture',id:cell.id,from:battle.from,owner:cell.owner,previous});
    if(cell.hq&&cell.hq!==cell.owner){this.result=cell.owner==='orange'?'victory':'defeat';this.running=false;this.events.push({type:'result',result:this.result});}
  }
  updateCombat(dt) {
    for(const c of this.cells) {
      const b=c.battle;if(!b)continue;b.elapsed+=dt;b.tick+=dt;
      if(b.tick<.25-1e-8)continue;
      const step=b.tick;b.tick=0;
      const from=this.cell(b.from),attack=damageRate(b.troops)*attackFactor(from,c),defend=damageRate(c.troops)*defenseFactor(from,c);
      const defenderLost=applyDamage(c.troops,attack*step),attackerLost=applyDamage(b.troops,defend*step);
      this.events.push({type:'combat',id:c.id,from:b.from,owner:b.owner,previous:c.owner,attackerLost,defenderLost});
      if(!countTroops(b.troops)){c.battle=null;this.events.push({type:'repelled',id:c.id,owner:c.owner});}
      else if(!c.units)this.capture(c,b);
      if(this.result)break;
    }
  }
  update(dt) {
    if(!this.running||this.paused||this.result||!Number.isFinite(dt))return;
    dt=Math.min(Math.max(dt,0),.1);if(!dt)return;this.time+=dt;
    this.updateEconomy(dt);this.updateOrders(dt);this.updateCombat(dt);
    if(this.result)return;
    this.updateSupply();
    if(this.aiEnabled&&this.time>=this.nextAI){this.manageAI('blue');this.nextAI=this.time+4.8;}
  }
  manageAI(owner) {
    const f=this.factions[owner];if(!f.queue.length&&!f.active){f.queue.push('drone','drone','mech');f.repeat=true;}
    const action=chooseOrder(this,owner);if(action)this.send(action.from,action.to,action.fraction,owner,action.filter||'all','command',action.reserve||0);
    const hq=this.cell(this.economy(owner).hqId),enemyHQ=this.cells.find(c=>c.hq===opposite(owner));
    const fronts=this.cells.filter(c=>c.owner===owner&&c!==hq&&!c.battle&&this.ownedPath(hq,c,owner)&&neighbors(this.cells,c).some(n=>n.owner!==owner&&traversable(c,n)));
    fronts.sort((a,b)=>graphDistance(this.cells,a,enemyHQ)-graphDistance(this.cells,b,enemyHQ));
    f.rally=fronts[0]?.id||null;
  }
  snapshot(){return {missionId:this.missionId,economyMode:this.economyMode,time:this.time,result:this.result,running:this.running,paused:this.paused,cells:this.cells.map(c=>({...c,troops:cloneTroops(c.troops),battle:c.battle?{...c.battle,troops:cloneTroops(c.battle.troops)}:null})),orders:this.orders.map(o=>({...o,troops:cloneTroops(o.troops),path:[...o.path]})),factions:structuredClone(this.factions),commands:this.commands,aiCommands:this.aiCommands,captures:this.captures};}
  drainEvents(){return this.events.splice(0);}
}
export function chooseOrder(game,owner) {
  const enemy=opposite(owner),hq=game.cells.find(c=>c.hq===enemy),own=game.cells.filter(c=>c.owner===owner),choices=[];
  const incoming=id=>game.orders.filter(o=>o.owner===owner&&o.path.at(-1)===id).reduce((n,o)=>n+power(o.troops),0);
  const dist=new Map(game.cells.map(c=>[c.id,graphDistance(game.cells,c,hq)]));
  for(const a of own) {
    if(a.battle||a.units<2)continue;
    const reserve=a.kind==='hq'?HQ_RESERVE:0,available=game.preview(a,'all',1,reserve),strength=power(available);
    if(!countTroops(available))continue;
    for(const b of game.cells) {
      if(b===a)continue;const path=game.path(a,b);if(!path)continue;
      const sent=incoming(b.id);
      if(b.owner===owner) {
        const threat=b.battle?power(b.battle.troops):Math.max(0,...neighbors(game.cells,b).filter(n=>n.owner===enemy&&traversable(b,n)).map(n=>power(n.troops)));
        if(b.battle&&power(b.troops)+sent<threat*1.4)choices.push({from:a.id,to:b.id,fraction:1,reserve,score:180+threat-path.length*5});
        else if(!b.battle&&dist.get(b.id)<dist.get(a.id)&&neighbors(game.cells,b).some(n=>n.owner!==owner&&traversable(b,n))&&sent<strength*.6)
          choices.push({from:a.id,to:b.id,fraction:1,reserve,score:15+strength*.18+(dist.get(a.id)-dist.get(b.id))*4-path.length*3});
        continue;
      }
      const last=path.at(-2),needed=power(b.troops)*Math.sqrt(defenseFactor(last,b)/attackFactor(last,b));
      const alliedFight=b.battle?.owner===owner?power(b.battle.troops):0;
      if(sent+alliedFight>needed*1.5+5||strength+sent+alliedFight<needed*1.15+3)continue;
      const filter=b.owner==='neutral'&&countType(available,'drone')>=Math.ceil(b.units*1.7)?'drone':'all';
      choices.push({from:a.id,to:b.id,fraction:1,filter,reserve,score:(b.hq?500:b.kind==='relay'?95:35)+(b.owner===enemy?25:0)+(12-dist.get(b.id))*4-path.length*4-needed*.13});
    }
  }
  choices.sort((a,b)=>b.score-a.score||a.from.localeCompare(b.from)||a.to.localeCompare(b.to));return choices[0]||null;
}
