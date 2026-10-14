import {Match,MATCH_RULES} from './match.js';
import {MatchAI,startingFactories} from './match-ai.js';
import {MatchView} from './match-view.js';
import {UNITS} from './rules.js';
import {icon,robot} from './ui-icons.js';
const $=id=>document.getElementById(id),names={drone:'Drohne',mech:'Mech',rail:'Fernkämpfer'},laneName=['Westweg','Ostweg'];
for(const e of document.querySelectorAll('[data-icon]'))e.innerHTML=icon(e.dataset.icon);
let match,view,ready=false,playing=false,selected=0,last=performance.now(),hudClock=0,noticeUntil=0,lastCards='',factoryMarkers=[];
$('factory-cards').innerHTML=Array.from({length:4},(_,i)=>`<button class="factory-card" id="factory-${i}" data-slot="${i}" aria-label="Fabrik ${i+1} bearbeiten"><span class="slot">0${i+1}</span><span class="unit-art"></span><span class="factory-copy"><strong></strong><small></small></span><span class="factory-state"></span><i class="factory-progress"></i></button>`).join('');
const enemyButton=document.createElement('button');enemyButton.id='enemy-factories-toggle';enemyButton.textContent='Gegnerfabriken';enemyButton.className='enemy-factories-toggle ceramic';document.querySelector('.field-caption').append(enemyButton);
const enemyPanel=document.createElement('aside');enemyPanel.id='enemy-factories';enemyPanel.className='ceramic enemy-factories';enemyPanel.hidden=true;enemyPanel.setAttribute('aria-label','Sichtbare gegnerische Fabriken');document.querySelector('main').append(enemyPanel);
enemyButton.onclick=()=>{enemyPanel.hidden=!enemyPanel.hidden;};
const timeText=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
function notify(text){$('notice').textContent=text;$('notice').hidden=false;noticeUntil=performance.now()+4200;}
function issue(action,data={}){const result=match.command('orange',action,data);if(!result.ok)notify(result.reason);else{for(const e of match.drainEvents())view?.matchEvent(e);updateHUD();}return result.ok;}
function selectFactory(slot){
 if(match.phase==='ended')return;selected=slot;$('orders').hidden=false;$('selection').hidden=true;
 const p=match.players.orange,f=p.pending[slot]||p.factories[slot]||{type:'drone',lane:slot%2};
 $('factory-type').value=f.type;$('factory-lane').value=f.lane;updateEditor();updateHUD();
}
function updateEditor(){
 if(!match)return;const p=match.players.orange,actual=p.factories[selected],pending=p.pending[selected],setup=match.phase==='setup';
 $('factory-number').textContent=`FABRIK 0${selected+1}`;$('factory-title').textContent=setup?'Startfabrik':actual?'Produktion anpassen':'Neue Fabrik bauen';
 $('factory-status').textContent=actual?`Aktiv: ${UNITS[actual.type].count} ${UNITS[actual.type].count===1?names[actual.type]:UNITS[actual.type].plural} → ${laneName[actual.lane]}. Alle 15 Sekunden.`:'Dieser feste Bauplatz ist noch frei.';
 const type=$('factory-type').value,lane=Number($('factory-lane').value),cost=setup?0:!actual?MATCH_RULES.factoryCost:actual.type!==type?MATCH_RULES.refitCost:0;
 const delta=cost-(pending?.paid||0),same=actual&&actual.type===type&&actual.lane===lane;
 $('apply-factory').textContent=setup?'Startfabrik übernehmen':same&&pending?'Auftrag zurücknehmen':!actual?`Bau vormerken · ${cost} Credits`:actual.type!==type?`Umrüsten · ${cost} Credits`:'Lane-Wechsel vormerken · kostenlos';
 $('apply-factory').disabled=!ready||match.phase==='ended'||setup&&selected>1||!setup&&match.credits('orange')<delta;
 $('cancel-order').hidden=!pending;$('cancel-order').textContent=`Stornieren · ${pending?.paid||0} Credits zurück`;
 $('order-help').textContent=setup?(selected<2?'Änderungen sind vor Spielbeginn kostenlos. Zwei Startfabriken kosten zusammen 200 Credits.':'Die beiden freien Plätze kannst du während der Partie bebauen.'):pending?`Vorgemerkt: ${names[pending.type]} → ${laneName[pending.lane]}. ${pending.paid} Credits reserviert. Anpassung jetzt: ${delta>0?delta+' zusätzlich':delta<0?-delta+' zurück':'keine weiteren Kosten'}.`:'Wird mit der nächsten Welle aktiv. Vorhandene Roboter bleiben bestehen. Bis dahin korrigierbar und erstattbar.';
}
function inspect(){
 if(match.phase==='ended'){$('selection').hidden=true;return;}const u=view?.inspect();$('selection').hidden=!u;if(!u)return;
 $('orders').hidden=true;$('selected-faction').textContent=`${u.owner==='orange'?'ORANGE':'BLAU'} · ${laneName[u.lane]}`;$('selected-name').textContent=names[u.type];
 $('selected-details').textContent=`${u.hp} / ${UNITS[u.type].hp} LP · Reichweite ${UNITS[u.type].range}${u.departing?' · Ausfahrt zur Lane':''}`;
}
function updateHUD(){
 if(!match)return;const p=match.players.orange,enemy=match.players.blue,setup=match.phase==='setup',ended=match.phase==='ended';
 $('credits').textContent=Math.floor(match.credits('orange'));$('income').textContent=ended?'beendet':`+${match.income('orange')} /s`;
 $('own-hq').innerHTML=`${p.hq} <em>LP</em>`;$('enemy-hq').innerHTML=`${enemy.hq} <em>LP</em>`;$('own-health').value=p.hq;$('enemy-health').value=enemy.hq;
 $('battle-clock').textContent=timeText(match.time);$('phase-label').textContent=setup?'AUFBAU':ended?'PARTIE BEENDET':playing?'PARTIE LÄUFT':'PAUSE';
 $('wave-label').textContent=setup?'Zwei Startfabriken wählen':`Welle ${match.wave}`;$('wave-countdown').textContent=setup?'Startfabriken: 200 Credits':ended?'Partie beendet':`Nächste Welle in ${match.nextWave.toFixed(1)} s`;
 $('match-play').disabled=!ready||ended;$('match-play').textContent=setup?'Partie starten':ended?'Partie beendet':playing?'Pause':'Fortsetzen';
 $('economy').disabled=!ready||setup||ended||p.economy||match.credits('orange')<MATCH_RULES.economyCost;
 $('economy').innerHTML=ended?'Wirtschaft beendet <small>Keine weiteren Einnahmen</small>':p.economy?'Wirtschaft ausgebaut <small>+3 Credits/s · Ausbau aktiv</small>':'Wirtschaft ausbauen · 80 <small>Dauerhaft +1 Credit/s · einmalig</small>';
 const cool=Math.max(0,(p.supplyReady-match.tick)*.05);
 $('open-supply').disabled=setup||ended;$('open-supply').textContent=ended?'Nachschub beendet':cool?`Nachschub bereit in ${cool.toFixed(1)} s`:'Sofortnachschub · 60';
 $('send-supply').disabled=!ready||setup||ended||cool>0||match.credits('orange')<60;
 $('supply-status').textContent=cool?`Noch ${cool.toFixed(1)} Sekunden Abklingzeit.`:'15 Sekunden Abklingzeit ab Einsatz. Keine automatische Wiederholung.';
 $('setup-note').hidden=!setup;
 const key=JSON.stringify([p.factories,p.pending,selected,match.phase]);
 if(key!==lastCards){lastCards=key;for(let i=0;i<4;i++){const card=$('factory-'+i),f=p.factories[i],next=p.pending[i];card.disabled=ended;card.classList.toggle('selected',i===selected);card.classList.toggle('pending',!!next);card.querySelector('.unit-art').innerHTML=f?robot(f.type):'<span class="empty-slot">+</span>';card.querySelector('strong').textContent=f?names[f.type]:'Freier Platz';card.querySelector('.factory-copy small').textContent=f?`${UNITS[f.type].count} / Welle · ${laneName[f.lane]}`:'Bauen · 100 Credits';card.querySelector('.factory-state').textContent=ended?'Partie beendet':next?`→ ${names[next.type]} · ${laneName[next.lane]} · ${next.paid} reserviert`:f?(setup?'Startbereit':'Produktion aktiv'):'Fester Bauplatz';}}
 for(let i=0;i<4;i++)$('factory-'+i).querySelector('.factory-progress').style.width=`${setup||ended||!p.factories[i]?0:(1-match.nextWave/15)*100}%`;
 const counts=[0,1].map(lane=>p.factories.reduce((sum,f,i)=>{const next=p.pending[i]||f;return sum+(next?.lane===lane?UNITS[next.type].count:0);},0));
 $('west-preview').textContent=ended?'':`Nächste eigene Welle: ${counts[0]} Roboter`;$('east-preview').textContent=ended?'':`Nächste eigene Welle: ${counts[1]} Roboter`;
 $('next-production').textContent=setup?'Erste Welle bei Spielbeginn':ended?'Keine weiteren Wellen':`West ${counts[0]} · Ost ${counts[1]} · in ${match.nextWave.toFixed(1)} s`;
 const reserved=p.pending.reduce((n,f)=>n+(f?.paid||0),0);$('reserved').textContent=reserved?`${reserved} Credits reserviert`:'';
 const enemyText='<strong>Gegnerfabriken · sichtbar</strong>'+enemy.factories.map((f,i)=>`<p>0${i+1} · ${f?`${names[f.type]} → ${laneName[f.lane]}`:'Freier Platz'}</p>`).join('')+'<small>Vorgemerkte gegnerische Aufträge sind verborgen.</small>';
 if(enemyPanel.innerHTML!==enemyText)enemyPanel.innerHTML=enemyText;
 $('match-result').hidden=!ended;
 if(ended){$('orders').hidden=true;$('supply-panel').hidden=true;$('selection').hidden=true;$('result-title').textContent=match.result==='draw'?'Unentschieden':match.result==='orange'?'Dein Angriff hat gesiegt.':'Dein HQ wurde zerstört.';$('result-details').textContent=`${timeText(match.time)} · ${match.wave} Wellen · ${p.metrics.produced} eigene Roboter. HQ: ${p.hq} : ${enemy.hq} LP.`;}
 updateEditor();
}
function prepare(){
 playing=false;match=new Match({blue:startingFactories($('ai-profile').value)});match.controllers=[new MatchAI('blue',{profile:$('ai-profile').value})];selected=0;lastCards='';
 view?.reset();if(view?.factoryBuildings)for(const f of Object.values(view.factoryBuildings))f.lastProduction=-10;
 $('supply-panel').hidden=true;view?.renderMatch(match,0);selectFactory(0);updateHUD();
}
function advance(dt,draw=true){
 match.advance(dt);for(const e of match.drainEvents())view.matchEvent(e);if(match.phase==='ended')playing=false;view.renderMatch(match,dt,draw);
}
function markers(){
 if(!view?.batches)return;const screens=view.factoryScreens();
 for(let i=0;i<screens.length;i++){const f=screens[i],data=match.players[f.owner].factories[f.slot];let el=factoryMarkers[i];if(!el){el=document.createElement('span');el.className='building-label '+f.owner;$('factory-labels').append(el);factoryMarkers[i]=el;}el.hidden=!data;el.textContent=data?`0${f.slot+1} · ${{drone:'D',mech:'M',rail:'F'}[data.type]} · ${data.lane===0?'W':'O'}`:'';el.style.left=f.x+'px';el.style.top=f.y+'px';}
}
function frame(now){
 const dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;
 if(ready){if(playing)advance(dt);else view.renderMatch(match,0);markers();hudClock+=dt;if(hudClock>.1){updateHUD();hudClock=0;}if(view.selected)inspect();}
 if(noticeUntil&&now>noticeUntil){$('notice').hidden=true;noticeUntil=0;}
 requestAnimationFrame(frame);
}
prepare();
try{
 view=new MatchView($('battle-stage'),$('battle-labels'),inspect,selectFactory);await view.ready;ready=true;$('loading').hidden=true;view.renderMatch(match,0);updateHUD();requestAnimationFrame(frame);
 window.__LANE_MATCH__=Object.freeze({snapshot:()=>match.snapshot(),observe:()=>match.observe('orange'),summary:()=>match.summary(),diagnostics:()=>({...view.diagnostics(),factories:view.factoryScreens()}),get playing(){return playing;}});
 if(new URLSearchParams(location.search).has('qa'))window.__LANE_MATCH_QA__=Object.freeze({
   advance:seconds=>{playing=false;for(let i=0;i<Math.round(seconds/.05)&&match.phase==='running';i++)advance(.05,i===Math.round(seconds/.05)-1);view.dirty=true;view.renderMatch(match,0);updateHUD();},
   command:(owner,action,data)=>{const result=match.command(owner,action,data);for(const e of match.drainEvents())view.matchEvent(e);updateHUD();return result;},
   automatePlayer:options=>{match.controllers=match.controllers.filter(c=>c.owner!=='orange');match.controllers.push(new MatchAI('orange',options));},
   start:()=>{match.start();for(const e of match.drainEvents())view.matchEvent(e);updateHUD();},
   reset:()=>prepare()
 });
}catch(error){console.error(error);$('loading').hidden=true;$('battle-error').hidden=false;$('battle-error').textContent=`Die 3D-Ansicht konnte nicht geladen werden: ${error.message}. Das separate Kampflabor bleibt unter lab.html erreichbar.`;}
$('match-play').onclick=()=>{if(!ready||match.phase==='ended')return;if(match.phase==='setup'){match.start();for(const e of match.drainEvents())view.matchEvent(e);$('orders').hidden=true;}playing=!playing;last=performance.now();updateHUD();};
$('new-match').onclick=prepare;
$('ai-profile').onchange=()=>{if(match.phase!=='setup')return;match.players.blue.factories=[...startingFactories($('ai-profile').value),null,null];match.controllers=[new MatchAI('blue',{profile:$('ai-profile').value})];view.dirty=true;};
for(let i=0;i<4;i++)$('factory-'+i).onclick=()=>selectFactory(i);
$('factory-type').onchange=updateEditor;$('factory-lane').onchange=updateEditor;
$('apply-factory').onclick=()=>{if(issue(match.phase==='setup'?'configure':'factory',{slot:selected,type:$('factory-type').value,lane:Number($('factory-lane').value)})){notify(match.phase==='setup'?'Startfabrik übernommen.':'Auftrag für die nächste Welle vorgemerkt.');view.dirty=true;updateEditor();}};
$('cancel-order').onclick=()=>{issue('cancel',{slot:selected});selectFactory(selected);notify('Auftrag storniert und Credits erstattet.');};
$('close-orders').onclick=()=>{$('orders').hidden=true;};$('economy').onclick=()=>{if(issue('economy'))notify('Wirtschaft ausgebaut: dauerhaft +3 Credits/s.');};
$('open-supply').onclick=()=>{$('supply-panel').hidden=!$('supply-panel').hidden;};$('close-supply').onclick=()=>{$('supply-panel').hidden=true;};
$('send-supply').onclick=()=>{if(issue('supply',{type:$('supply-type').value,lane:Number($('supply-lane').value)}))notify('Nachschub verlässt das HQ.');};
$('camera-mode').onclick=()=>{const mode=view.mode==='tactical'?'diorama':'tactical';view.setCamera(mode);$('camera-mode').textContent=mode==='tactical'?'Taktik 70°':'Diorama 55°';};$('camera-home').onclick=()=>view.home();$('zoom-in').onclick=()=>view.zoomBy(1.25);$('zoom-out').onclick=()=>view.zoomBy(.8);
$('close-selection').onclick=()=>{view.selected=null;inspect();};$('focus-unit').onclick=()=>view.focusSelected();
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){playing=false;updateHUD();}last=performance.now();});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['SELECT','INPUT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();$('match-play').click();}if(e.code==='Escape'){view?.home();$('orders').hidden=true;$('supply-panel').hidden=true;enemyPanel.hidden=true;}});