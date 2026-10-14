import fs from 'node:fs/promises';
import {Match} from '../src/match.js';
import {MatchAI,startingFactories} from '../src/match-ai.js';
const cases=[];
for(const plan of ['mixed','swarm','ranged'])for(const enemy of ['pressure','balanced','economy'])for(const opening of ['factory','economy']){
 const type=lane=>plan==='swarm'?'drone':plan==='ranged'?'rail':lane===0?'mech':'rail';
 const army=[{type:type(0),lane:0},{type:type(1),lane:1}];
 const m=new Match({orange:army,blue:startingFactories(enemy,1)});m.controllers=[new MatchAI('blue',{profile:enemy,variant:1})];m.start();
 let nextDecision=50,supplies=0;const timeline=[];
 while(m.phase==='running'&&m.time<600){
  m.advance(.05);m.drainEvents();
  if(m.tick>=nextDecision){nextDecision=m.tick+50;const o=m.observe('orange'),buy=(a,d)=>{if(m.command('orange',a,d).ok)timeline.push({time:m.time,action:a,...d});};
   const count=o.factories.filter(Boolean).length+o.pending.filter((p,i)=>p&&!o.factories[i]).length;
   if(opening==='economy'&&!o.economy){if(o.credits>=80)buy('economy');continue;}
   const slot=o.factories.findIndex((f,i)=>!f&&!o.pending[i]);
   if(slot>=0){if(o.credits>=100)buy('factory',{slot,type:type(slot%2),lane:slot%2});continue;}
   if(!o.economy){if(o.credits>=80)buy('economy');continue;}
   if(count===4&&o.credits>=60&&o.supplyCooldown===0){const lane=supplies%2;buy('supply',{type:type(lane),lane});supplies++;}
  }
 }
 cases.push({plan,enemy,opening,...m.summary(),timeline});
}
const report={description:'Controlled opening comparison: each pair has identical start army, final factory types/lanes, supply sequence and opponent. Only economy-first versus factory-first differs. Both planners act every 2.5s with no secret enemy data. Measurement limit is not a match timer.',cases};
await fs.writeFile(new URL('../docs/m2-economy-comparison.json',import.meta.url),JSON.stringify(report,null,2));
for(const c of cases)console.log(JSON.stringify({plan:c.plan,enemy:c.enemy,opening:c.opening,result:c.result,time:c.time,hq:c.hq,credits:c.metrics.orange.credits,produced:c.metrics.orange.produced}));