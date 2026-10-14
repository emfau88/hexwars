import fs from 'node:fs/promises';
import {Match} from '../src/match.js';
import {MatchAI,startingFactories} from '../src/match-ai.js';
const cases=[];
for(const profile of ['pressure','balanced','economy'])for(const reactive of [false,true])for(const opening of ['factory','economy']){
 const label=`${reactive?'reactive':'static'}-${opening}-vs-${profile}`;
 const m=new Match({orange:startingFactories('balanced'),blue:startingFactories(profile,1)});
 const player=new MatchAI('orange',{profile:'balanced',reactive,opening}),enemy=new MatchAI('blue',{profile,variant:1});
 m.controllers=[player,enemy];m.start();const checkpoints=[];
 while(m.phase==='running'&&m.time<600){m.advance(1);m.drainEvents();if(m.tick%1200===0)checkpoints.push({time:m.time,hq:[m.players.orange.hq,m.players.blue.hq],credits:[m.credits('orange'),m.credits('blue')],units:m.lanes.map(g=>g.units.length),orders:player.actions.length});}
 const result={label,...m.summary(),checkpoints,playerActions:player.actions,enemyActions:enemy.actions};cases.push(result);console.log(JSON.stringify({label,...m.summary()}));
}
await fs.writeFile(new URL('../docs/m2-match-audit.json',import.meta.url),JSON.stringify({measurementLimit:600,description:'Deterministic strategy probes, not human playtests; timeout is unresolved, never victory.',cases},null,2));