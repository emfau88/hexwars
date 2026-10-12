import fs from 'node:fs/promises';
import {Battle} from '../src/game.js';
import {RAMPS,edgeKey} from '../src/map.js';
import {strategyOrder} from './economy-strategies.mjs';
const runs=[],phases=process.argv.includes('--before-ai')?'before-ai':'comparison';
for(const mode of ['legacy-local','hq-centralized'])for(const profile of ['balanced','hq-only','expansion','relay','stockpile','idle'])for(const cadence of profile==='idle'?[0]:[5,8,12])for(const first of profile==='idle'?[5]:[5,12]){
 const g=new Battle({economyMode:mode});g.start();let next=first,sampleAt=0,hqOrders=0,peakHQ=40,capSeconds=0,relaySeconds=0,cutSeconds=0,remainingGarrisons=0,commandAttempts=0,aiHQOrders=0,aiRelayOrders=0;const samples=[],ramps=new Set(),aiRampEdges=new Set();
 for(let tick=0;tick<12000&&!g.result;tick++){
  g.update(.05);const hq=g.cells.find(c=>c.hq==='orange'),e=g.economy('orange');peakHQ=Math.max(peakHQ,hq.owner==='orange'?hq.units:0);if(hq.owner==='orange'&&hq.units>=99-1e-8)capSeconds+=.05;if(e.relayConnected)relaySeconds+=.05;if(e.isolatedIds.length)cutSeconds+=.05;
  for(const o of g.orders)for(let i=1;i<o.path.length;i++)if(RAMPS.has(edgeKey(o.path[i-1],o.path[i]))){ramps.add(edgeKey(o.path[i-1],o.path[i]));if(o.owner==='blue')aiRampEdges.add(edgeKey(o.path[i-1],o.path[i]));}
  if(g.time>=sampleAt){samples.push({time:+g.time.toFixed(2),orange:g.strength('orange'),blue:g.strength('blue'),fields:g.fields('orange'),connected:e.connectedFields,rate:e.rate,hq:+hq.units.toFixed(2),relay:g.cell('0,0').owner,readyGarrisons:g.cells.filter(c=>c.owner==='orange'&&!c.hq&&c.units>=5).length});sampleAt+=15;}
  if(cadence&&g.time>next){const a=strategyOrder(g,profile);if(a){commandAttempts++;const sent=g.send(a.from,a.to,a.fraction<.65?.5:1);if(sent.ok&&a.from===hq.id)hqOrders++;}next=g.time+cadence;}
  for(const event of g.drainEvents())if(event.type==='send'&&event.owner==='blue'){if(event.from==='2,-3')aiHQOrders++;if(event.to==='0,0')aiRelayOrders++;}
 }
 remainingGarrisons=g.cells.filter(c=>c.owner==='orange'&&!c.hq&&c.units>=5).length;
 runs.push({mode,profile,cadence,first,result:g.result||'timeout',seconds:+g.time.toFixed(2),commands:g.commands,commandAttempts,aiCommands:g.aiCommands,aiHQOrders,aiRelayOrders,aiRampEdges:[...aiRampEdges],hqOrders,peakHQ:+peakHQ.toFixed(2),capSeconds:+capSeconds.toFixed(2),relaySeconds:+relaySeconds.toFixed(2),cutSeconds:+cutSeconds.toFixed(2),rampEdges:ramps.size,remainingGarrisons,samples});
}
const summary=[];for(const mode of ['legacy-local','hq-centralized'])for(const profile of ['balanced','hq-only','expansion','relay','stockpile','idle']){
 const group=runs.filter(r=>r.mode===mode&&r.profile===profile),mean=k=>+(group.reduce((n,r)=>n+r[k],0)/group.length).toFixed(2);
 summary.push({mode,profile,n:group.length,wins:group.filter(r=>r.result==='victory').length,losses:group.filter(r=>r.result==='defeat').length,timeouts:group.filter(r=>r.result==='timeout').length,meanSeconds:mean('seconds'),meanCommands:mean('commands'),meanAI:mean('aiCommands'),meanPeakHQ:mean('peakHQ'),meanCapSeconds:mean('capSeconds'),meanRelaySeconds:mean('relaySeconds')});
}
await fs.mkdir('docs/economy',{recursive:true});await fs.writeFile(`docs/economy/${phases}.json`,JSON.stringify({date:new Date().toISOString(),maxSeconds:600,notes:'Deterministic decision policies, not human win rates. Common legal half/all inputs, 50ms simulation. Timeout means unfinished.',summary,runs},null,2));console.table(summary);
