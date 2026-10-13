import {icon} from './ui-icons.js';

export const CAMPAIGN_KEY='hexfront.mixed-squads.campaign.v1';

/** Save only campaign completion, never claim that a live match is resumable after reload. */
export function normalizeCampaign(value,ids){
  const completed=[];
  if(value?.version===1&&Array.isArray(value.completed))for(const id of ids){
    if(!value.completed.includes(id))break;
    completed.push(id);
  }
  const unlocked=ids.slice(0,Math.min(ids.length,completed.length+1));
  return {version:1,completed,lastMission:unlocked.includes(value?.lastMission)?value.lastMission:ids[0]};
}

export function createCampaignStore(ids,storage,fallback){
  let current=normalizeCampaign(null,ids),persistent=true;
  try{current=normalizeCampaign(JSON.parse(storage?.getItem(CAMPAIGN_KEY)||'null'),ids);if(!storage)persistent=false;}catch{persistent=false;}
  try{const saved=fallback?.read(),session=normalizeCampaign(saved,ids);if(saved&&session.completed.length>=current.completed.length){if(session.completed.length>current.completed.length||session.lastMission!==current.lastMission)persistent=false;current=session;}}catch{}
  const read=()=>({...current,completed:[...current.completed],unlocked:ids.slice(0,Math.min(ids.length,current.completed.length+1)),persistent});
  const unlocked=id=>ids.includes(id)&&ids.indexOf(id)<=current.completed.length;
  const save=()=>{try{if(!storage)throw Error('No storage');storage.setItem(CAMPAIGN_KEY,JSON.stringify(current));persistent=true;}catch{persistent=false;}try{fallback?.write({...current,completed:[...current.completed]});}catch{}};
  return {
    read,unlocked,
    complete(id){if(!unlocked(id)||current.completed.includes(id))return read();current=normalizeCampaign({...current,completed:[...current.completed,id]},ids);save();return read();},
    select(id){if(unlocked(id)){current.lastMission=id;save();}return read();},
  };
}

function browserStore(missions){
  let storage;try{storage=globalThis.localStorage;}catch{}
  return createCampaignStore(missions.map(m=>typeof m==='string'?m:m.id),storage,{
    read:()=>globalThis.history?.state?.hexfrontMixedCampaign,
    write:progress=>globalThis.history?.replaceState({...globalThis.history.state,hexfrontMixedCampaign:progress},''),
  });
}
export const loadProgress=missions=>browserStore(missions).read();

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const artURL=id=>new URL(`../../hexfront-3d/public/assets/campaign/${id}.jpg`,import.meta.url).href;
export function createCampaign({missions,currentMission,onLaunch,onResume,onOpen,onSettings,getState=()=>({})}){
 const ids=missions.map(m=>m.id),store=browserStore(missions);
 let selected=store.unlocked(currentMission)?currentMission:ids[0],previousFocus=null;
 const dialog=document.createElement('dialog');dialog.id='campaign-menu';dialog.className='campaign-menu';dialog.dataset.view='home';dialog.setAttribute('aria-labelledby','campaign-title');
 dialog.innerHTML=`
 <div class="menu-home ceramic">
   <div class="menu-logo">${icon('hex')}<span>H</span></div>
   <h1 id="campaign-title">HEXFRONT</h1><p class="menu-subtitle">MIXED SQUADS</p>
   <p class="menu-welcome">Kleine Welt. Große Pläne.</p>
   <button class="campaign-resume primary" hidden>${icon('play')} Einsatz fortsetzen</button>
   <button class="campaign-quick primary">${icon('play')} Einsatz starten</button>
   <button class="campaign-choose">${icon('menu')} Mission wählen</button>
   <button class="campaign-settings">${icon('settings')} Einstellungen</button>
   <p class="campaign-progress" role="status"></p>
 </div>
 <section class="mission-picker ceramic" hidden aria-labelledby="picker-title">
   <header class="picker-header"><button class="campaign-back icon-button" aria-label="Zurück zum Hauptmenü">${icon('back')}</button><div><small>DEINE KAMPAGNE</small><h2 id="picker-title">Wohin geht's?</h2></div><button class="campaign-dismiss icon-button" aria-label="Zur laufenden Partie zurückkehren" hidden>×</button></header>
   <div class="campaign-cards">${missions.map((m,i)=>`<button class="campaign-card" data-mission="${escape(m.id)}" aria-pressed="false"><img src="${artURL(m.id)}" alt="" draggable="false"><span class="campaign-card-caption"><span class="campaign-index">0${i+1}</span><strong>${escape(m.title)}</strong><span class="campaign-card-state"></span><small>${m.fields??m.cells?.length??37} Felder · 3 Höhenstufen</small></span></button>`).join('')}</div>
   <div class="campaign-briefing"><strong></strong><p></p></div>
   <button class="campaign-launch primary">Einsatz starten ${icon('arrow')}</button>
   <p class="campaign-replace" hidden>Ein neuer Einsatz beendet deine laufende Partie.</p>
   <p class="campaign-save"></p>
 </section>
 <span class="menu-caption">Dein nächster Einsatz wartet.</span>`;
 document.body.append(dialog);
 const query=s=>dialog.querySelector(s),cards=[...dialog.querySelectorAll('.campaign-card')];
 const playing=()=>{const s=getState()||{};return !!s.running&&!s.finished;};
 function setView(view){dialog.dataset.view=view;query('.menu-home').hidden=view!=='home';query('.mission-picker').hidden=view!=='missions';(view==='missions'?query('.campaign-back'):playing()?query('.campaign-resume'):query('.campaign-quick')).focus({preventScroll:true});}
 function update(){
   const progress=store.read(),active=playing(),mission=missions.find(m=>m.id===selected),busy=!!getState()?.busy;
   query('.campaign-progress').textContent=`${progress.completed.length} von ${missions.length} Einsätzen abgeschlossen`;
   query('.campaign-save').textContent=progress.persistent?'Abgeschlossene Einsätze werden auf diesem Gerät gespeichert.':'Fortschritt bleibt in dieser Sitzung erhalten. Lass diesen Tab geöffnet.';
   query('.campaign-briefing strong').textContent=mission.title;
   query('.campaign-briefing p').textContent=mission.tactic||mission.briefing;
   query('.campaign-quick').innerHTML=icon('play')+(busy?'Gelände lädt …':'Einsatz starten');
   query('.campaign-quick').disabled=busy;query('.campaign-quick').hidden=active;
   query('.campaign-resume').hidden=!active;query('.campaign-dismiss').hidden=!active;query('.campaign-replace').hidden=!active;
   query('.campaign-launch').innerHTML=(busy?'Gelände lädt …':active?'Neuen Einsatz starten':progress.completed.includes(selected)?'Einsatz wiederholen':'Einsatz starten')+icon('arrow');
   query('.campaign-launch').disabled=busy;
   for(const card of cards){const id=card.dataset.mission,unlocked=store.unlocked(id),complete=progress.completed.includes(id);
     card.disabled=!unlocked;card.setAttribute('aria-pressed',String(id===selected));card.classList.toggle('selected',id===selected);card.classList.toggle('locked',!unlocked);
     card.querySelector('.campaign-card-state').textContent=!unlocked?`Nach Einsatz 0${ids.indexOf(id)}`:complete?'✓ Abgeschlossen':id===selected?'● Ausgewählt':'Bereit';
     card.setAttribute('aria-label',`${missions.find(m=>m.id===id).title}. ${!unlocked?'Gesperrt. Schließe zuerst den vorherigen Einsatz ab.':complete?'Abgeschlossen. Erneut spielbar.':'Bereit.'}`);
   }
 }
 function hide(){if(dialog.open)dialog.close();document.body.classList.remove('campaign-open');if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 function resume(){if(!playing())return;hide();onResume?.();}
 function launch(){if(!store.unlocked(selected)||getState()?.busy)return;store.select(selected);hide();onLaunch?.(selected);}
 function show(view='home'){if(!dialog.open){previousFocus=document.activeElement;onOpen?.();update();dialog.showModal();document.body.classList.add('campaign-open');}setView(view);}
 cards.forEach(card=>card.addEventListener('click',()=>{selected=card.dataset.mission;update();}));
 query('.campaign-choose').addEventListener('click',()=>setView('missions'));
 query('.campaign-back').addEventListener('click',()=>setView('home'));
 query('.campaign-settings').addEventListener('click',()=>onSettings?.());
 query('.campaign-dismiss').addEventListener('click',resume);query('.campaign-resume').addEventListener('click',resume);
 query('.campaign-launch').addEventListener('click',launch);query('.campaign-quick').addEventListener('click',launch);
 dialog.addEventListener('cancel',event=>{event.preventDefault();if(dialog.dataset.view==='missions')setView('home');else resume();});
 update();return {show,hide,refresh:update,complete(id){const p=store.complete(id);if(dialog.open)update();return p;},getProgress:()=>store.read(),isUnlocked:id=>store.unlocked(id),get open(){return dialog.open;},destroy(){hide();dialog.remove();}};
}
