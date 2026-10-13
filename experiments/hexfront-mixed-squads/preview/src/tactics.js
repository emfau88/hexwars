import {forecast} from './game.js';
import {neighbors,traversable} from './map.js';
import {countTroops} from './units.js';
export function reachability(game,source,target){
  if(!source||source.owner!=='orange'||source.battle||!target)return 'none';
  if(source===target)return 'source';
  const path=game.path(source,target);
  return path?(path.length===2?'direct':'indirect'):neighbors(game.cells,source).includes(target)&&!traversable(source,target)?'cliff':'none';
}
export function orderPreview(game,source,target,fraction,filter='all'){
  const path=source.battle?null:game.path(source,target),formation=game.preview(source,filter,fraction);
  return {path,formation,amount:countTroops(formation),combat:path&&target.owner!==source.owner?forecast(path.at(-2),target,formation):null};
}
export const rateText=rate=>rate.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:2});
export function fieldInfo(game,cell){
  if(cell.battle)return 'Im Gefecht gebunden · Verstärkungen können eintreffen.';
  const e=game.economy(cell.owner),connected=e.connectedIds.includes(cell.id);
  if(cell.kind==='hq')return `${e.connectedFields} verbundene Felder · Produktion im HQ-Menü`;
  return connected?(cell.kind==='relay'?'Verbunden · Einkommen +20 %':'Verbunden · liefert 0,9 Credits/s'):'Abgeschnitten · kein Einkommen';
}
