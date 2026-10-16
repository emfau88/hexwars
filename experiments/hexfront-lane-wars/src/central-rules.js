import {UNITS} from './rules.js';
// Mode-scoped balance. Historical missions and the laboratory retain UNITS.
// Roles, formation order and counter weights are data, not extra unit classes.
export const CENTRAL_UNITS=Object.freeze(Object.fromEntries(Object.entries(UNITS).map(([id,spec])=>[id,Object.freeze({...spec,...(id==='mech'?{hp:110,secondary:9,range:2.8}:id==='rail'?{interval:2.8,damage:55}:{}),
 role:{drone:'Schwarm',mech:'Flächenkämpfer',rail:'Panzerbrecher'}[id],
 formation:{mech:0,drone:1,rail:2}[id],
 counters:{drone:{drone:0,mech:-1,rail:1},mech:{drone:1,mech:0,rail:-1},rail:{drone:-1,mech:1,rail:0}}[id]
})])));
export const CENTRAL_RULES=Object.freeze({startCredits:280,factoryCost:120,refitCost:30,income:2,economyCost:80,economyIncome:1.2,supplyCost:80,supplyCooldown:35,wave:20,hqHP:800,hqDamage:2,hqInterval:1,hqRange:4});
