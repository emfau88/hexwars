import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_KEY,normalizeCampaign,createCampaignStore} from '../src/campaign.js';
const ids=['morgenwacht','windpass','auenstrom'];
const memory=()=>{const data=new Map();return{getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};};

test('only a completed preceding mission unlocks the next campaign mission',()=>{
 const store=createCampaignStore(ids,memory());assert.equal(store.unlocked('morgenwacht'),true);assert.equal(store.unlocked('windpass'),false);
 store.complete('windpass');assert.deepEqual(store.read().completed,[]);
 store.complete('morgenwacht');assert.equal(store.unlocked('windpass'),true);store.complete('morgenwacht');assert.deepEqual(store.read().completed,['morgenwacht']);
 store.complete('windpass');assert.equal(store.unlocked('auenstrom'),true);store.complete('auenstrom');assert.deepEqual(store.read().completed,ids);assert.equal(store.unlocked('unknown'),false);
});
test('campaign saves completion and mission selection, without saving a live match',()=>{
 const storage=memory(),store=createCampaignStore(ids,storage);store.select('windpass');assert.equal(store.read().lastMission,'morgenwacht');
 store.complete('morgenwacht');store.select('windpass');const restored=createCampaignStore(ids,storage);
 assert.equal(restored.read().lastMission,'windpass');assert.deepEqual(restored.read().completed,['morgenwacht']);
 assert.deepEqual(Object.keys(JSON.parse(storage.getItem(CAMPAIGN_KEY))).sort(),['completed','lastMission','version']);
 const copy=restored.read();copy.completed.push('windpass');assert.deepEqual(restored.read().completed,['morgenwacht']);
});
test('malformed and unknown save data never skip mission progression',()=>{
 for(const data of [null,{}, {version:999,completed:ids},{version:1,completed:'morgenwacht'},{version:1,completed:['windpass'],lastMission:'windpass'},{version:1,completed:['unknown']}] )assert.deepEqual(normalizeCampaign(data,ids),{version:1,completed:[],lastMission:'morgenwacht'});
 const storage=memory();storage.setItem(CAMPAIGN_KEY,'{broken');const store=createCampaignStore(ids,storage);assert.equal(store.unlocked('morgenwacht'),true);assert.equal(store.unlocked('windpass'),false);
 store.complete('morgenwacht');assert.equal(createCampaignStore(ids,storage).unlocked('windpass'),true);
});
test('unavailable or quota-limited storage retains progress within the current session',()=>{
 for(const storage of [undefined,{getItem(){throw Error('Blocked')},setItem(){throw Error('Blocked')}},{getItem:()=>null,setItem(){throw Error('Quota')}}]){
  const store=createCampaignStore(ids,storage);store.complete('morgenwacht');assert.equal(store.unlocked('windpass'),true);assert.equal(store.read().persistent,false);
 }
});
test('same-tab history fallback preserves unlocks across a mission reload when local storage is blocked',()=>{
 let state;const fallback={read:()=>state,write:value=>state=value},storage={getItem:()=>null,setItem(){throw Error('Blocked')}};
 const first=createCampaignStore(ids,storage,fallback);first.complete('morgenwacht');first.select('windpass');
 const restored=createCampaignStore(ids,storage,fallback);assert.equal(restored.unlocked('windpass'),true);assert.equal(restored.read().lastMission,'windpass');assert.equal(restored.read().persistent,false);
});
