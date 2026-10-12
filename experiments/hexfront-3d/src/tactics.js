import {forecast} from './game.js';
import {neighbors,traversable} from './map.js';

export function reachability(game,source,target){
  if(!source||source.owner!=='orange')return 'none';
  if(source===target)return 'source';
  const path=game.path(source,target);
  return path?(path.length===2?'direct':'indirect'):neighbors(game.cells,source).includes(target)&&!traversable(source,target)?'cliff':'none';
}
export function orderPreview(game,source,target,fraction){
  const path=game.path(source,target),amount=Math.max(0,Math.min(Math.floor(source.units)-1,Math.floor(source.units*fraction)));
  return {path,amount,combat:path&&target.owner!==source.owner?forecast(path.at(-2),target,amount):null};
}
export const rateText=rate=>rate.toFixed(2).replace('.',',');
export function fieldInfo(game,cell){
  const e=game.economy(cell.owner),connected=e.connectedIds.includes(cell.id);
  if(cell.kind==='hq')return `${e.connectedFields} verbundene Felder · Relais +${Math.round(e.relayBonus*100)} % · ${Math.floor(cell.units)}/${e.cap} Truppen${cell.units>=e.cap?' · Produktion pausiert (voll)':''}`;
  if(e.mode==='legacy-local')return 'Lokale Produktion · Relaisbesitz erhöht gesamten Nachschub um 30 %.';
  return connected?(cell.kind==='relay'?'Verbunden · HQ-Produktion +20 %':'Verbunden · stärkt HQ-Produktion'):'Verbindung unterbrochen · kein Produktionsbonus';
}
