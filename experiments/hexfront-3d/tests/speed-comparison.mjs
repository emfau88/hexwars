import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/game.js',import.meta.url),'utf8').replace("'./map.js'",JSON.stringify(new URL('../src/map.js',import.meta.url).href));
const results=[];
for(const speed of [2,1.2,1.1,1]){
 const {Battle,chooseOrder}=await import('data:text/javascript;base64,'+Buffer.from(source.replace('TRANSPORT_SECONDS_PER_HEX = 1.1','TRANSPORT_SECONDS_PER_HEX = '+speed)).toString('base64'));
 for(const cadence of [5,6.3,7.5,0]){
  const g=new Battle();g.start();let next=5,relays=new Set();
  while(g.time<600&&!g.result){g.update(.05);relays.add(g.cell('0,0').owner);g.drainEvents();if(cadence&&g.time>next){const a=chooseOrder(g,'orange');if(a)g.send(a.from,a.to,a.fraction<.65?.5:1);next=g.time+cadence;}}
  results.push({secondsPerHex:speed,cadence,result:g.result,seconds:+g.time.toFixed(2),commands:g.commands,aiCommands:g.aiCommands,relayOwners:[...relays]});
 }
}
fs.writeFileSync(new URL('../docs/technology/speed-comparison.json',import.meta.url),JSON.stringify({method:'Deterministic half/all strategy, no initial-state edits; identical AI and production for all transport durations. Not human playtesting.',results},null,2));console.table(results);
