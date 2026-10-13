
export const CAMPAIGN_KEY='hexfront.campaign.v1';

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
    read:()=>globalThis.history?.state?.hexfrontCampaign,
    write:progress=>globalThis.history?.replaceState({...globalThis.history.state,hexfrontCampaign:progress},''),
  });
}
export const loadProgress=missions=>browserStore(missions).read();

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const emblem='<svg viewBox="0 0 40 44" aria-hidden="true"><path d="M20 2 38 12v20L20 42 2 32V12Z"/><path d="M13 14v16m14-16v16M13 22h14"/></svg>';
const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
const lock='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 9V6a4 4 0 0 1 8 0v3M4 9h12v9H4Zm6 3v3"/></svg>';

const artURL=id=>new URL(`../public/assets/campaign/${id}.jpg`,import.meta.url).href;

export function createCampaign({missions,currentMission,onLaunch,onResume,onOpen,getState=()=>({})}){
  const ids=missions.map(m=>m.id),store=browserStore(missions);
  let selected=store.unlocked(currentMission)?currentMission:ids[0],previousFocus=null;
  const dialog=document.createElement('dialog');dialog.id='campaign-menu';dialog.className='campaign-menu';
  dialog.setAttribute('aria-labelledby','campaign-title');
  dialog.innerHTML=`
    <div class="campaign-shell">
      <header class="campaign-masthead"><div class="campaign-brand">${emblem}<span>HEXFRONT<small>SMALL WORLDS. BIG TACTICS.</small></span></div><span class="campaign-edition">FIELD OPERATIONS <i></i> 01—${String(missions.length).padStart(2,'0')}</span><button type="button" class="campaign-dismiss" aria-label="Zur laufenden Partie zurückkehren" hidden>×</button></header>
      <div class="campaign-body">
        <section class="campaign-intro"><img class="campaign-hero-art" alt="" aria-hidden="true"><div class="campaign-kicker"><span></span> DEINE KAMPAGNE</div><h1 id="campaign-title">Kleine Welt.<br><em>Große Pläne.</em></h1><p class="campaign-lead">Führe Orange durch drei Einsätze. Sichere Wege, bündle deine Drohnen und erobere das blaue Hauptquartier.</p><div class="campaign-route" aria-hidden="true"><span>01</span><i></i><span>02</span><i></i><span>03</span></div><p class="campaign-progress" role="status" aria-live="polite"></p><div class="campaign-primer"><span class="campaign-primer-symbol">↗</span><p><strong>Greifen. Ziehen. Erobern.</strong><span>Ziehe von einem eigenen Feld zum Ziel. Oder tippe beide Felder an und bestätige den Befehl.</span></p></div></section>
        <section class="campaign-selection" aria-label="Mission auswählen"><div class="campaign-selection-title"><span>EINSATZGEBIETE</span><span>ORANGE / BLAU</span></div><div class="campaign-cards">${missions.map((m,index)=>`<button type="button" class="campaign-card" data-mission="${escape(m.id)}" aria-pressed="false"><div class="campaign-card-top"><span class="campaign-index">${String(index+1).padStart(2,'0')}</span><span class="campaign-card-state"></span></div><div class="campaign-map"><img src="${artURL(m.id)}" alt="" loading="eager" draggable="false"></div><div class="campaign-card-caption"><small>${escape(m.subtitle)}</small><h2>${escape(m.id==='morgenwacht'?'Bastion Morgenwacht':m.title)}</h2><div class="campaign-card-facts"><span>${m.fields??m.cells?.length??37} SEKTOREN</span><span>3 HÖHEN</span></div></div></button>`).join('')}</div><div class="campaign-map-key">Missionen freischalten · Jederzeit erneut spielen</div><div class="campaign-briefing"><span class="campaign-briefing-label">DEIN PLAN</span><p></p></div></section>
      </div>
      <footer class="campaign-footer"><div class="campaign-save"><span class="campaign-save-dot"></span><p><strong></strong><small>Gespeichert werden abgeschlossene Missionen.</small></p></div><div class="campaign-actions"><button type="button" class="campaign-resume" hidden>Partie fortsetzen ${arrow}</button><button type="button" class="campaign-launch">Einsatz starten ${arrow}</button></div><p class="campaign-replace" hidden>Ein neuer Einsatz beendet deine laufende Partie.</p></footer>
    </div>`;
  document.body.append(dialog);
  const query=selector=>dialog.querySelector(selector),cards=[...dialog.querySelectorAll('.campaign-card')];
  const playing=()=>{const state=getState()||{};return !!state.running&&!state.finished;};
  function update(){
    const progress=store.read(),active=playing(),mission=missions.find(m=>m.id===selected);
    query('.campaign-progress').textContent=`${progress.completed.length} von ${missions.length} Einsätzen abgeschlossen`;
    query('.campaign-save strong').textContent=progress.persistent?'Fortschritt auf diesem Gerät':'Fortschritt für diese Sitzung';
    query('.campaign-save small').textContent=progress.persistent?'Gespeichert werden abgeschlossene Missionen.':'Browserspeicher nicht verfügbar. Lass diesen Tab geöffnet.';
    query('.campaign-briefing p').textContent=mission.tactic||mission.briefing;
    query('.campaign-hero-art').src=artURL(mission.id);
    query('#campaign-title').textContent=mission.title;
    query('.campaign-kicker').textContent=`OPERATION ${String(mission.index).padStart(2,'0')} / ${mission.subtitle}`;
    query('.campaign-lead').textContent=mission.briefing;
    query('.campaign-intro').dataset.mission=mission.id;
    const busy=!!getState()?.busy;
    query('.campaign-launch').innerHTML=`${busy?'Gelände wird vorbereitet …':active?'Neuen Einsatz starten':progress.completed.includes(selected)?'Einsatz wiederholen':'Einsatz starten'} ${arrow}`;
    query('.campaign-launch').disabled=busy;
    query('.campaign-launch').classList.toggle('secondary',active);
    query('.campaign-resume').hidden=!active;query('.campaign-dismiss').hidden=!active;query('.campaign-replace').hidden=!active;
    for(const card of cards){const id=card.dataset.mission,unlocked=store.unlocked(id),complete=progress.completed.includes(id),selectedCard=id===selected;
      card.disabled=!unlocked;card.setAttribute('aria-pressed',String(selectedCard));card.classList.toggle('selected',selectedCard);card.classList.toggle('locked',!unlocked);
      card.querySelector('.campaign-card-state').innerHTML=!unlocked?`${lock}<span>Nach Einsatz ${String(ids.indexOf(id)).padStart(2,'0')}</span>`:complete?'<span class="campaign-check">✓</span> Abgeschlossen':selectedCard?'<span class="campaign-ready-dot"></span> Ausgewählt':'Bereit';
      const title=missions.find(m=>m.id===id).title;card.setAttribute('aria-label',`${title}. ${!unlocked?'Gesperrt. Schließe zuerst den vorherigen Einsatz ab.':complete?'Abgeschlossen. Erneut spielbar.':'Bereit.'}`);
    }
  }
  function hide(){if(dialog.open)dialog.close();document.body.classList.remove('campaign-open');if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
  function resume(){if(!playing())return;hide();onResume?.();}
  function show(){if(dialog.open)return;previousFocus=document.activeElement;onOpen?.();update();dialog.showModal();document.body.classList.add('campaign-open');(playing()?query('.campaign-resume'):query('.campaign-launch')).focus({preventScroll:true});}
  cards.forEach(card=>card.addEventListener('click',()=>{selected=card.dataset.mission;update();}));
  query('.campaign-dismiss').addEventListener('click',resume);query('.campaign-resume').addEventListener('click',resume);
  query('.campaign-launch').addEventListener('click',()=>{if(!store.unlocked(selected)||getState()?.busy)return;store.select(selected);hide();onLaunch?.(selected);});
  dialog.addEventListener('cancel',event=>{event.preventDefault();resume();});
  update();
  return {show,hide,refresh:update,complete(id){const progress=store.complete(id);if(dialog.open)update();return progress;},getProgress:()=>store.read(),isUnlocked:id=>store.unlocked(id),get open(){return dialog.open;},destroy(){hide();dialog.remove();}};
}
