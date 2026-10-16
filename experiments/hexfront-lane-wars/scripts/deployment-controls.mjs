import fs from 'node:fs/promises';
import {run} from './central-audit.mjs';
const games=[];
for(const [a,b] of [['pressure','siege'],['pressure','economy'],['siege','economy']]){
 const r=run({a,b,rules:{hqHP:1200,hqDamage:6}});
 games.push({a,b,result:r.result,time:r.time,hq:r.hq});
}
await fs.mkdir('docs/deployment-qa',{recursive:true});
await fs.writeFile('docs/deployment-qa/previous-hq-control.json',JSON.stringify({
 note:'Same corrected deployment and range; only restore previous HQ HP and damage.',games
},null,2));
console.log(JSON.stringify(games));
