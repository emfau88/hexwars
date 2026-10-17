import {railAudio,bindRailSound} from './rail-audio.js';
import {BattleView} from './battle-view.js';
import {PRESENTATIONS,createPresentation} from './presentation.js';
import {UNITS} from './rules.js';
import {icon,robot} from './ui-icons.js';
const $=id=>document.getElementById(id);
for(const el of document.querySelectorAll('[data-icon]'))el.innerHTML=icon(el.dataset.icon);
for(const el of document.querySelectorAll('[data-unit]'))el.innerHTML=robot(el.dataset.unit);
$('presentation').innerHTML=PRESENTATIONS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
let battle=createPresentation(),playing=false,ready=false,view,visualTime=0,last=performance.now();
const names={drone:'Hover-Drohne',mech:'Mech',rail:'Fernkämpfer'};
function selection() {
  if(view)view.dirty=true;
  const u=view?.inspect();$('selection').hidden=!u;if(!u)return;
  $('selected-faction').textContent=`${u.owner==='orange'?'ORANGE':'BLAU'} · ${u.lane===0?'WESTWEG':'OSTWEG'}`;
  $('selected-name').textContent=names[u.type];
  $('selected-details').textContent=`${u.hp} / ${UNITS[u.type].hp} LP · Reichweite ${UNITS[u.type].range}. ${u.type==='mech'?'Originalmodell · animierte mechanische Gelenke.':u.type==='rail'?'Vorläufiges Modell · das finale GLB fehlt.':'Originalmodell · schwebend.'}`;
}
function updateHUD() {
  const time=Math.max(...battle.lanes.map(g=>g.time));$('battle-clock').textContent=`${Math.floor(time/60).toString().padStart(2,'0')}:${Math.floor(time%60).toString().padStart(2,'0')}`;
  const ended=battle.lanes.every(g=>g.result);if(ended)playing=false;
  $('battle-play').lastElementChild.textContent=ended?'Erneut ansehen':playing?'Gefechte pausieren':time?'Fortsetzen':'Gefechte starten';
  $('battle-play').firstElementChild.innerHTML=playing?'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14M17 5v14" stroke="currentColor" stroke-width="4"/></svg>':icon('play');
  $('battle-outcome').hidden=!ended;
  if(ended){const result=g=>g.result==='draw'?'Unentschieden':g.result==='orange'?'Orange gewinnt':'Blau gewinnt';$('battle-outcome').innerHTML=`West: ${result(battle.lanes[0])} · Ost: ${result(battle.lanes[1])}<small>Vorbereitete Gefechte beendet. Noch keine vollständige Partie.</small>`;}
  selection();
}
function reset() {playing=false;visualTime=0;battle=createPresentation($('presentation').value);view.reset();view.render(battle.lanes,0,0);updateHUD();}
function advance(seconds,draw=true) {
  for(const [lane,game] of battle.lanes.entries()){game.advance(seconds);for(const event of game.drainEvents())view.effect(event,lane);}
  visualTime+=seconds;view.render(battle.lanes,visualTime,seconds,draw);updateHUD();
}
function animate(now) {
  railAudio.setActive(ready&&(playing||(battle.lanes.every(g=>g.result)&&(view.effects.length||view.corpses.size))));
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(ready){if(playing)advance(dt);else view.render(battle.lanes,visualTime,battle.lanes.every(g=>g.result)&&(view.corpses.size||view.effects.length)?dt:0);}
  requestAnimationFrame(animate);
}
try {
  view=new BattleView($('battle-stage'),$('battle-labels'),selection);
  await view.ready;ready=true;$('loading').hidden=true;$('battle-play').disabled=false;$('battle-reset').disabled=false;reset();
  window.__LANE_WARS__=Object.freeze({snapshot:()=>battle.lanes.map(g=>g.snapshot()),summary:()=>battle.lanes.map(g=>g.summary()),diagnostics:()=>view.diagnostics(),get playing(){return playing;},get preset(){return battle.preset.id;}});
  // Browser QA takes the same advance/event/render path as visible playback.
  if(new URLSearchParams(location.search).has('qa'))window.__LANE_WARS_QA__=Object.freeze({advance:seconds=>{playing=false;const steps=Math.round(seconds/.05);for(let i=0;i<steps;i++)advance(.05,i===steps-1);},select:id=>{view.selected=id;selection();},reset});
  requestAnimationFrame(animate);
} catch(error) {console.error(error);$('loading').hidden=true;$('battle-error').hidden=false;$('battle-error').textContent=`Die 3D-Ansicht konnte nicht geladen werden: ${error.message}. Bitte WebGL und die lokalen Asset-Dateien prüfen. Das Kampflabor bleibt über lab.html erreichbar.`;}
bindRailSound($('sound-setting'));
$('battle-play').addEventListener('click',()=>{if(battle.lanes.every(g=>g.result))reset();playing=!playing;updateHUD();});
$('battle-reset').addEventListener('click',reset);$('presentation').addEventListener('change',()=>{if(ready)reset();});
$('camera-mode').addEventListener('click',()=>{const mode=view.mode==='tactical'?'diorama':'tactical';view.setCamera(mode);$('camera-mode').textContent=mode==='tactical'?'Taktik 70°':'Diorama 55°';});
$('camera-home').addEventListener('click',()=>view.home());$('zoom-in').addEventListener('click',()=>view.zoomBy(1.25));$('zoom-out').addEventListener('click',()=>view.zoomBy(.8));
$('close-selection').addEventListener('click',()=>{view.selected=null;selection();});$('focus-unit').addEventListener('click',()=>view.focusSelected());
$('model-closeup').addEventListener('click',()=>{const unit=battle.lanes[0].units.find(u=>u.type==='mech'&&u.owner==='orange')||battle.lanes[0].units[0];if(unit){view.selected=`0:${unit.id}`;view.setCamera('diorama');$('camera-mode').textContent='Diorama 55°';view.focusSelected();selection();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;if(ready)updateHUD();}last=performance.now();});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['SELECT','INPUT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();if(ready)$('battle-play').click();}if(e.code==='Escape'){view?.home();if(view)view.selected=null;selection();}});
