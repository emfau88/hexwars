export const MISSIONS=Object.freeze({
 first:{id:'first',number:1,name:'Erste Front',lanes:1,slots:2,startSlots:[0],start:[{type:'drone',lane:0}],entry:4,departure:4,ai:{profile:'balanced',reaction:150,refitInterval:60,buildAfter:65},rules:{startCredits:100,hqHP:480,hqDamage:4},objective:'Baue eine zweite Fabrik und zerstöre das blaue HQ.',target:'2–4 Minuten'},
 meadow:{id:'meadow',number:2,name:'Wiesenkrieg',lanes:2,slots:4,startSlots:[1,2],start:[{type:'mech',lane:0},{type:'rail',lane:1}],entry:4,departure:8,ai:{profile:'balanced',reaction:70,refitInterval:35,variant:1},rules:{},objective:'Verteile deine Produktion auf zwei Fronten und zerstöre das blaue HQ.',target:'4–7 Minuten'}
});
export const missionById=id=>{const m=MISSIONS[id];if(!m)throw new Error('Unbekannte Mission.');return m;};
export function missionRoute(mission,lane,p,lateral=0){
 if(mission?.lanes!==1)return null;
 return {x:lateral*2,z:9-p*.6};
}
