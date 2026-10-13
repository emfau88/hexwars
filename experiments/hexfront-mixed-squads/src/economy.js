import {connectedTerritory} from '../../hexfront-3d/src/economy.js';
export const ECONOMY_MODE='credits';
export const ECONOMY_MODES=['credits'];
export const ARMY_LIMIT=160;
export const QUEUE_LIMIT=12;
export const HQ_RESERVE=6;
export const HQ_INCOME=2,FIELD_INCOME=.9,RELAY_BONUS=.2;
export function economyState(cells,owner) {
  const connected=connectedTerritory(cells,owner),hq=cells.find(c=>c.hq===owner&&c.owner===owner);
  const relayConnected=cells.some(c=>c.kind==='relay'&&connected.has(c.id));
  const connectedFields=Math.max(0,connected.size-(hq?1:0));
  const hqIncome=hq?HQ_INCOME:0,fieldIncome=hq?connectedFields*FIELD_INCOME:0;
  const baseIncome=hqIncome+fieldIncome,bonusIncome=relayConnected?baseIncome*RELAY_BONUS:0,rate=baseIncome+bonusIncome;
  return {mode:ECONOMY_MODE,hqId:hq?.id??null,connectedIds:[...connected],connectedFields,
    isolatedIds:cells.filter(c=>c.owner===owner&&!connected.has(c.id)).map(c=>c.id),
    relayConnected,relayBonus:relayConnected?RELAY_BONUS:0,hqIncome,fieldIncome,baseIncome,bonusIncome,rate,cap:ARMY_LIMIT};
}
