import {createMap,neighbors,traversable,route,graphDistance} from './map.js';
export const opposite = owner => owner==='orange'?'blue':'orange';
/** A single height bonus, never multiplied by an inherited Hill bonus. */
export function defenseFactor(from,to) {return 1+Math.max(to.height>from.height?.30:0,to.kind==='hq'?.20:0);}
export function attackFactor(from,to) {return from.height>to.height?1.15:1;}
export function forecast(from,to,amount) {
  const effective=amount*attackFactor(from,to)/defenseFactor(from,to);
  return {effective,win:effective>to.units,remaining:Math.abs(effective-to.units),defense:defenseFactor(from,to),attack:attackFactor(from,to)};
}
export class Battle {
  constructor(){this.reset();}
  reset(){this.cells=createMap();this.time=0;this.orders=[];this.events=[];this.result=null;this.running=false;this.paused=false;this.nextAI=10;this.serial=0;this.commands=0;this.captures=0;this.aiCommands=0;}
  cell(id){return this.cells.find(c=>c.id===id);}
  start(){this.running=true;}
  strength(owner){return Math.floor(this.cells.filter(c=>c.owner===owner).reduce((n,c)=>n+c.units,0)+this.orders.filter(o=>o.owner===owner).reduce((n,o)=>n+o.units,0));}
  fields(owner){return this.cells.filter(c=>c.owner===owner).length;}
  path(from,to){return route(this.cells,from,to);}
  send(fromId,toId,fraction=1,owner='orange') {
    const a=this.cell(fromId),b=this.cell(toId);
    if(!this.running||this.paused||this.result)return {ok:false,reason:'Die Schlacht ist angehalten.'};
    if(!a||a.owner!==owner)return {ok:false,reason:'Wähle eine eigene Garnison.'};
    if(!b||a===b)return {ok:false,reason:'Wähle ein anderes Zielfeld.'};
    const path=this.path(a,b);
    if(!path)return {ok:false,reason:'Felswand oder fremdes Gebiet. Nutze einen der Aufstiege.'};
    const units=Math.min(Math.floor(a.units)-1,Math.floor(a.units*fraction));
    if(units<1)return {ok:false,reason:'Mindestens zwei Truppen nötig. Eine Einheit hält die Stellung.'};
    a.units-=units;
    const order={id:++this.serial,owner,units,path:path.map(c=>c.id),segment:0,progress:0};
    this.orders.push(order);owner==='orange'?this.commands++:this.aiCommands++;
    this.events.push({type:'send',owner,from:a.id,to:b.id,units});return {ok:true,order};
  }
  arrive(order,from,to) {
    if(to.owner===order.owner)to.units+=order.units;
    else {
      const f=forecast(from,to,order.units);const previous=to.owner;
      if(f.win) {
        to.owner=order.owner;to.units=Math.max(1,f.remaining);if(order.owner==='orange')this.captures++;
        this.events.push({type:'capture',id:to.id,owner:order.owner,previous});
        if(to.hq&&to.hq!==order.owner){this.result=order.owner==='orange'?'victory':'defeat';this.running=false;this.events.push({type:'result',result:this.result});}
      } else {to.units=f.remaining;this.events.push({type:'combat',id:to.id,owner:order.owner});}
    }
  }
  update(dt) {
    if(!this.running||this.paused||this.result)return;
    dt=Math.min(Math.max(dt,0),.1);this.time+=dt;
    const relay=this.cell('0,0').owner;
    for(const c of this.cells)if(c.owner!=='neutral') {
      const rate=c.kind==='hq'?.68:c.kind==='relay'?.36:.075;
      if(c.units<99)c.units=Math.min(99,c.units+rate*dt*.70*(relay===c.owner?1.3:1));
    }
    for(const o of [...this.orders]) {
      const from=this.cell(o.path[o.segment]),to=this.cell(o.path[o.segment+1]);
      // Every animated edge is checked against the same rule as the UI and AI.
      if(!traversable(from,to))throw Error('Invalid terrain edge in movement');
      o.progress+=dt*.50;
      if(o.progress<1)continue;
      if(to.owner!==o.owner||o.segment===o.path.length-2){this.arrive(o,from,to);this.orders.splice(this.orders.indexOf(o),1);}
      else {o.segment++;o.progress-=1;}
      if(this.result)break;
    }
    if(!this.result&&this.time>=this.nextAI){const action=chooseOrder(this,'blue');if(action)this.send(action.from,action.to,action.fraction,'blue');this.nextAI=this.time+6.3;}
  }
  snapshot(){return {time:this.time,result:this.result,running:this.running,paused:this.paused,cells:this.cells.map(c=>({...c})),orders:this.orders.map(o=>({...o,path:[...o.path]})),commands:this.commands,aiCommands:this.aiCommands,captures:this.captures};}
  drainEvents(){return this.events.splice(0);}
}
/** Honest deterministic opponent: identical graph, units, production and combat. */
export function chooseOrder(game,owner,{aggression=1}={}) {
  const enemy=opposite(owner),hq=game.cells.find(c=>c.hq===enemy),own=game.cells.filter(c=>c.owner===owner),choices=[];
  const incoming=id=>game.orders.filter(o=>o.owner===owner&&o.path.at(-1)===id).reduce((n,o)=>n+o.units,0);
  const dist=new Map(game.cells.map(c=>[c.id,graphDistance(game.cells,c,hq)]));
  const relay=game.cell('0,0'),relayDist=new Map(game.cells.map(c=>[c.id,graphDistance(game.cells,c,relay)]));
  const front=own.filter(c=>neighbors(game.cells,c).some(n=>n.owner!==owner&&traversable(c,n)));
  for(const a of own) {
    if(a.units<4)continue;
    for(const b of game.cells) {
      if(b===a||b.owner===owner)continue;
      const path=game.path(a,b);if(!path)continue;
      const last=path.at(-2),available=Math.floor(a.units)-(a.kind==='hq'?10:1);
      const required=b.units*defenseFactor(last,b)/attackFactor(last,b)-incoming(b.id)+2;
      if(required>available&&(b.owner!==enemy||available<Math.max(16,required*.58)))continue;
      if(incoming(b.id)>b.units+3)continue;
      const fraction=b.owner==='neutral'?Math.min(available/a.units,Math.max(.35,(required+2)/a.units)):available/a.units;
      const score=(b.kind==='hq'?1000:b.kind==='relay'?150:28)+(b.owner===enemy?30:0)+(9-dist.get(b.id))*5-(path.length-1)*4-required*.45+(b.height>0?48:0)+(relay.owner!==owner?(8-relayDist.get(b.id))*4:0);
      choices.push({from:a.id,to:b.id,fraction,score:score*aggression});
    }
    // Concentrate safe rear troops at a useful, connected frontline.
    for(const b of front) {
      if(a===b||incoming(b.id)>15||b.units>70)continue;
      const path=game.path(a,b);if(!path)continue;
      const pressure=neighbors(game.cells,b).filter(n=>traversable(b,n)&&n.owner===enemy).reduce((m,n)=>Math.max(m,n.units),0);
      if(dist.get(b.id)>=dist.get(a.id)&&pressure<10)continue;
      const threatened=neighbors(game.cells,a).some(n=>traversable(a,n)&&n.owner===enemy&&n.units>a.units*.65);
      if(threatened&&a.units<35)continue;
      const score=12+a.units*.6+(dist.get(a.id)-dist.get(b.id))*5+Math.min(25,pressure*.3)-(path.length-1)*2-incoming(b.id);
      if(a.kind==='hq'&&a.units<15)continue;
      choices.push({from:a.id,to:b.id,fraction:a.kind==='hq'?Math.min(.72,(a.units-10)/a.units):.9,score});
    }
  }
  choices.sort((a,b)=>b.score-a.score||a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
  return choices[0]||null;
}
