import {connectedTerritory} from '../../hexfront-3d/src/economy.js';
export const ECONOMY_MODE='credits';
export const ECONOMY_MODES=['credits'];
export const ARMY_LIMIT=160;
export const QUEUE_LIMIT=12;
export const HQ_RESERVE=6;
export function economyState(cells,owner) {
  const connected=connectedTerritory(cells,owner),hq=cells.find(c=>c.hq===owner&&c.owner===owner);
  const relayConnected=cells.some(c=>c.kind==='relay'&&connected.has(c.id));
  const connectedFields=Math.max(0,connected.size-(hq?1:0));
  const rate=hq?(2+connectedFields*.9)*(relayConnected?1.2:1):0;
  return {mode:ECONOMY_MODE,hqId:hq?.id??null,connectedIds:[...connected],connectedFields,
    isolatedIds:cells.filter(c=>c.owner===owner&&!connected.has(c.id)).map(c=>c.id),
    relayConnected,relayBonus:relayConnected?.2:0,rate,cap:ARMY_LIMIT};
}
