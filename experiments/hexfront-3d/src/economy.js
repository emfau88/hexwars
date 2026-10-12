import {neighbors,traversable} from './map.js';

export const ECONOMY_MODE='hq-centralized';
export const ECONOMY_MODES=['legacy-local','hq-centralized'];
export const PRODUCTION_CAP=99;
export const HQ_BASE_PRODUCTION=.48;

/** The same walkable edges as troop movement; only friendly cells conduct supply. */
export function connectedTerritory(cells,owner){
  const hq=cells.find(c=>c.hq===owner&&c.owner===owner),connected=new Set();
  if(!hq)return connected;
  const queue=[hq];connected.add(hq.id);
  for(let i=0;i<queue.length;i++)for(const next of neighbors(cells,queue[i])){
    if(next.owner===owner&&!connected.has(next.id)&&traversable(queue[i],next)){connected.add(next.id);queue.push(next);}
  }
  return connected;
}
export function centralProduction(connectedFields,relayConnected){
  const fields=Math.max(0,connectedFields),firstTen=Math.min(fields,10),additional=Math.max(0,fields-10);
  // The 0.95 base cap is applied before the explicit connected-relay multiplier.
  return Math.min(.95,HQ_BASE_PRODUCTION+firstTen*.03+additional*.015)*(relayConnected?1.20:1);
}
export function localProduction(cell,relayOwner){
  return (cell.kind==='hq'?.68:cell.kind==='relay'?.36:.075)*.70*(relayOwner===cell.owner?1.30:1);
}
export function economyState(cells,owner,mode=ECONOMY_MODE){
  const connected=connectedTerritory(cells,owner),hq=cells.find(c=>c.hq===owner&&c.owner===owner),relay=cells.find(c=>c.kind==='relay');
  const connectedFields=Math.max(0,connected.size-(hq?1:0)),relayConnected=!!relay&&connected.has(relay.id);
  const rate=!hq?0:mode==='legacy-local'?localProduction(hq,relay?.owner):centralProduction(connectedFields,relayConnected);
  return {mode,hqId:hq?.id??null,connectedIds:[...connected],connectedFields,isolatedIds:cells.filter(c=>c.owner===owner&&!connected.has(c.id)).map(c=>c.id),relayConnected,relayBonus:mode==='legacy-local'?(relay?.owner===owner ? .30 : 0):(relayConnected ? .20 : 0),rate,cap:PRODUCTION_CAP};
}
