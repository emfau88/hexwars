// Health buckets represent a whole formation. No robot has a position or AI.
// Equal-health members share one bucket; merging/splitting preserves injuries.
export const UNIT_TYPES = ['drone', 'mech'];
export const UNIT = Object.freeze({
  drone: Object.freeze({name:'Drohne', short:'D', cost:12, seconds:1.8, hp:12, dps:3, travel:1.1}),
  mech: Object.freeze({name:'Mech', short:'M', cost:40, seconds:4.8, hp:48, dps:8, travel:1.9}),
});
export const emptyTroops = () => ({drone:[], mech:[]});
export function troops(drone=0, mech=0) {
  return Object.fromEntries(UNIT_TYPES.map(type=>[type, (type==='drone'?drone:mech)>0 ? [{count:Math.floor(type==='drone'?drone:mech), hp:UNIT[type].hp}] : []]));
}
export const cloneTroops = value => Object.fromEntries(UNIT_TYPES.map(type=>[type,value[type].map(b=>({...b}))]));
export const countType = (value,type) => value[type].reduce((n,b)=>n+b.count,0);
export const countTroops = value => UNIT_TYPES.reduce((n,type)=>n+countType(value,type),0);
export const health = value => UNIT_TYPES.reduce((n,type)=>n+value[type].reduce((sum,b)=>sum+b.count*b.hp,0),0);
export const damageRate = value => UNIT_TYPES.reduce((n,type)=>n+countType(value,type)*UNIT[type].dps,0);
export const power = value => Math.sqrt(health(value)*damageRate(value));
// One healthy drone is one strength point. Terrain bonuses stay in the order
// forecast; the map shows a compact, rounded comparison of the resident force.
export const combatValue = value => countTroops(value) ? Math.max(1,Math.round(power(value)/Math.sqrt(UNIT.drone.hp*UNIT.drone.dps))) : 0;
export const travelSeconds = value => countType(value,'mech') ? UNIT.mech.travel : UNIT.drone.travel;
export function mergeTroops(target,source) {
  for(const type of UNIT_TYPES) {
    const buckets = new Map();
    for(const b of [...target[type],...source[type]]) if(b.count>0&&b.hp>1e-8) {
      const key=b.hp.toFixed(8), old=buckets.get(key);
      if(old) old.count+=b.count; else buckets.set(key,{...b});
    }
    target[type]=[...buckets.values()].sort((a,b)=>a.hp-b.hp);
  }
  return target;
}
export function takeTroops(source,filter='all',fraction=1,reserve=0) {
  const taken=emptyTroops();
  let budget=Math.max(0,countTroops(source)-reserve);
  for(const type of UNIT_TYPES) {
    if(filter!=='all'&&filter!==type)continue;
    let needed=Math.min(budget,Math.floor(countType(source,type)*fraction));
    budget-=needed;
    // The injured travel first. Their exact health is carried with them.
    for(const b of source[type]) {
      const n=Math.min(needed,b.count);
      if(n){taken[type].push({count:n,hp:b.hp});b.count-=n;needed-=n;}
    }
    source[type]=source[type].filter(b=>b.count>0);
  }
  return taken;
}
function damageType(buckets,damage) {
  for(const b of buckets) {
    if(damage<=1e-8)break;
    const whole=Math.min(b.count,Math.floor((damage+1e-8)/b.hp));
    b.count-=whole;damage=Math.max(0,damage-whole*b.hp);
    if(b.count&&damage>1e-8){b.count--;buckets.push({count:1,hp:b.hp-damage});damage=0;}
  }
  return buckets.filter(b=>b.count>0&&b.hp>1e-8).sort((a,b)=>a.hp-b.hp);
}
export function applyDamage(value,amount) {
  const before=countTroops(value), total=health(value);
  if(!Number.isFinite(amount)||amount<=0||!total)return 0;
  // Spread fire over the two types by their current health, then hit the most
  // injured health bucket. Both sides' damage is calculated before casualties.
  for(const type of UNIT_TYPES) {
    const hp=value[type].reduce((n,b)=>n+b.hp*b.count,0);
    value[type]=damageType(value[type],Math.min(hp,amount*hp/total));
  }
  return before-countTroops(value);
}
export const troopText = value => `${countType(value,'drone')} D · ${countType(value,'mech')} M`;
