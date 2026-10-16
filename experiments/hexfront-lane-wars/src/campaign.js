import {MISSIONS} from './missions.js';
export const STORAGE_KEY='hexfront-lane-wars-campaign-v1';
export const newCampaign=()=>({version:1,centralRuns:0,completed:[],active:null,saves:{},settings:{camera:'diorama',motion:true,hints:true}});
export function readCampaign(storage){
 try{const x=JSON.parse(storage.getItem(STORAGE_KEY));if(!x||x.version!==1)return newCampaign();
  return {version:1,centralRuns:Number.isInteger(x.centralRuns)?x.centralRuns:0,completed:Array.isArray(x.completed)?x.completed.filter(id=>MISSIONS[id]):[],active:MISSIONS[x.active]?x.active:null,saves:x.saves&&typeof x.saves==='object'?x.saves:{},settings:{...newCampaign().settings,...x.settings}};
 }catch{return newCampaign();}
}
export function writeCampaign(storage,campaign){storage.setItem(STORAGE_KEY,JSON.stringify(campaign));}
export const unlocked=(campaign,id)=>id==='central'||id==='first'||campaign.completed.includes('first');
export function rememberMatch(campaign,match,ai){
 if(!match.mission)return;
 const id=match.mission.id;
 campaign.active=id;campaign.saves[id]={match:match.save(),ai:ai.map(c=>c.save())};
 if(match.phase==='ended'&&match.result==='orange'&&!campaign.completed.includes(id))campaign.completed.push(id);
}
