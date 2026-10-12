import {chooseOrder,forecast} from '../src/game.js';
import {graphDistance} from '../src/map.js';

/** Test policies issue only the same half/all orders offered by the UI. */
export function strategyOrder(game,profile='balanced',owner='orange'){
 if(profile==='idle')return null;
 if(profile==='balanced')return chooseOrder(game,owner);
 const hq=game.cells.find(c=>c.hq===owner),enemy=game.cells.find(c=>c.hq&&c.hq!==owner),relay=game.cell('0,0');
 if(profile==='stockpile'&&hq.units<80)return null;
 if(profile==='relay'&&relay.owner===owner)return chooseOrder(game,owner);
 const own=game.cells.filter(c=>c.owner===owner&&(profile==='hq-only'||profile==='stockpile'?c===hq:true)),choices=[];
 for(const a of own)for(const b of game.cells){
  if(b.owner===owner)continue;const route=game.path(a,b);if(!route)continue;
  const incoming=game.orders.filter(o=>o.owner===owner&&o.path.at(-1)===b.id).reduce((n,o)=>n+o.units,0);if(incoming>b.units+2)continue;
  for(const fraction of [.5,1]){
   const amount=Math.min(Math.floor(a.units)-1,Math.floor(a.units*fraction));if(amount<1)continue;
   const f=forecast(route.at(-2),b,amount);if(!f.win)continue;
   const goal=profile==='relay'?relay:enemy,distance=graphDistance(game.cells,b,goal);
   let score=(b.hq?1000:25)+(9-distance)*9-(route.length-1)*3-amount*.25;
   if(profile==='expansion')score=(b.hq?1000:60)-b.units*3-(route.length-1)*5+(b.kind==='relay'?70:0);
   if(profile==='relay')score+=b.kind==='relay'?180:b.height*20;
   choices.push({from:a.id,to:b.id,fraction,score});
  }
 }
 choices.sort((a,b)=>b.score-a.score||a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
 return choices[0]||null;
}
