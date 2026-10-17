import {railAudio,bindRailSound} from './rail-audio.js';
import {Match} from './match.js';
import {CentralAI,CENTRAL_STRATEGIES,centralOpening} from './central-ai.js';
import {MatchAI} from './match-ai.js';
import {MatchView} from './match-view.js';
import {MISSIONS} from './missions.js';
import {readCampaign,writeCampaign,rememberMatch,unlocked} from './campaign.js';
import {frontState} from './fronts.js';
import {UNITS} from './rules.js';
import {robot} from './ui-icons.js';
const $=id=>document.getElementById(id),names={drone:'Drohne',mech:'Mech',rail:'Fernkämpfer'},short={drone:'D',mech:'M',rail:'F'};
const timeText=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
const laneName=lane=>lane===0?'West':'Ost';
const compactHUD=()=>matchMedia('(max-width:650px), (max-height:500px) and (max-width:1000px)').matches;
let deckOpen=false,hintOpen=false;
function setDeck(open){deckOpen=open;$('command-deck').classList.toggle('expanded',open);$('toggle-factories').setAttribute('aria-expanded',String(open));$('toggle-factories').querySelector('span').textContent=open?'Fabriken schließen':'Fabriken & Wirtschaft';$('toggle-factories').querySelector('b').textContent=open?'⌄':'⌃';}
function frameField(){if(!view)return;const compact=compactHUD();view.safeTop=compact?118:undefined;view.safeBottom=compact?(innerWidth>650?132:190):(match.mission.id==='central'?260:330);view.fitHalfWidth=compact?(match.mission.lanes===1?6.8:14.3):undefined;view.resize();}

let campaign=readCampaign(localStorage),match,view,ready=false,playing=false,inMenu=true,selected=0,last=performance.now(),hudClock=0,saveClock=0,noticeUntil=0,cardKey='',restartId=null,markerElements=[],frontHistory=[],frontReadings=[],supplyType=null,targetLane=null,drag=null,ignoreSupplyClick=false,endedSaved=false,loading=false;
function notify(message){$('notice').textContent=message;$('notice').hidden=false;noticeUntil=performance.now()+4500;}
function persist(){
 try{writeCampaign(localStorage,campaign);$('save-note').textContent='Fortschritt wird lokal in diesem Browser gespeichert.';}
 catch{$('save-note').textContent='Speichern ist in diesem Browser nicht möglich. Die Partie bleibt bis zum Schließen spielbar.';notify('Lokales Speichern nicht möglich. Bitte den Tab bis zum Missionsende offen lassen.');}
}
function save(){if(!match||match.phase==='setup')return;rememberMatch(campaign,match,match.controllers);persist();}
function flush(){for(const e of match.drainEvents())view?.matchEvent(e);}
function issue(action,data={}){
 const result=match.command('orange',action,data);
 if(!result.ok)notify(result.reason);
 else{flush();view?.renderMatch(match,0);save();updateHUD();markers();}
 return result.ok;
}
function setMenu(show){inMenu=show;if(show){playing=false;save();cancelSupply();setDeck(false);hintOpen=false;$('orders').hidden=true;updateMenu();}else last=performance.now();$('main-menu').hidden=!show;$('game-ui').hidden=show;updateHUD();}
function updateMenu(){
 const active=campaign.active&&campaign.saves[campaign.active]?.match.phase==='running';
 $('resume-game').hidden=!active;$('campaign-go').textContent=campaign.saves.central?.match.phase==='running'?'Zentrale Front fortsetzen':'Zentrale Front spielen';
 $('central-opponent').value=campaign.settings.centralStrategy||'cycle';
 for(let i=0;i<2;i++)$('start-type-'+i).value=campaign.settings.centralStart?.[i]||MISSIONS.central.start[i].type;
 $('level-list').innerHTML=Object.values(MISSIONS).map(m=>{
  const allowed=unlocked(campaign,m.id),saved=campaign.saves[m.id]?.match,running=saved?.phase==='running',completed=campaign.completed.includes(m.id);
  return `<div class="level-row"><button data-mission="${m.id}" ${allowed?'':'disabled'}><strong>${m.id==='central'?'HAUPTMODUS':'0'+m.number} · ${m.name}${completed?' ✓':''}</strong><small>${!allowed?'Sieg in Erste Front erforderlich':running?'Fortsetzen · '+timeText(saved.time):m.lanes+' Lane'+(m.lanes===1?'':'s')+' · '+m.target}</small></button>${allowed&&saved?'<button class="restart" data-restart="'+m.id+'">Neu</button>':''}</div>`;
 }).join('');
 $('camera-setting').value=campaign.settings.camera;$('motion-setting').checked=campaign.settings.motion;$('hints-setting').checked=campaign.settings.hints;
}
async function prepare(id,{fresh=false,start=false}={}){
 if(loading)return;loading=true;ready=false;playing=false;save();$('loading').hidden=false;cancelSupply();
 try{
  const saved=!fresh&&campaign.saves[id],mission=MISSIONS[id];
  const strategy=campaign.settings.centralStrategy&&campaign.settings.centralStrategy!=='cycle'?campaign.settings.centralStrategy:['siege','pressure','economy'][(campaign.centralRuns||0)%3];
  match=saved?Match.restore(saved.match):new Match({mission:id,...(id==='central'?{orange:(campaign.settings.centralStart||['mech','rail']).map(type=>({type,lane:0})),blue:centralOpening(strategy)}:{})});
  match.controllers=saved?saved.ai.map(a=>a.kind==='central'?CentralAI.restore(a):MatchAI.restore(a)):[id==='central'?new CentralAI('blue',{strategy}):new MatchAI('blue',mission.ai)];
  if(id==='central'&&!saved&&start){campaign.centralRuns=(campaign.centralRuns||0)+1;persist();}
  selected=mission.startSlots[0];setDeck(false);hintOpen=false;cardKey='';endedSaved=false;frontHistory=[];frontReadings=[];$('orders').hidden=true;$('selection').hidden=true;
  view?.dispose();const old=$('battle-stage'),stage=old.cloneNode(false);old.replaceWith(stage);$('battle-labels').replaceChildren();$('factory-labels').replaceChildren();$('building-leaders').replaceChildren();markerElements=[];
  view=new MatchView(stage,$('battle-labels'),inspect,selectFactory,mission);await view.ready;
  view.onLanePick=e=>{if(!supplyType)return false;sendSupply(view.laneAt(e.clientX,e.clientY));return true;};
  view.setCamera(campaign.settings.camera);view.reduced=!campaign.settings.motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  frameField();stage.addEventListener('click',onFieldClick,true);
  document.querySelector('.menu-caption span').textContent='0'+mission.number+' / '+mission.name.toUpperCase();document.querySelector('.menu-caption strong').innerHTML=mission.id==='central'?'Eine Front.<br>Deine Kriegsmaschinerie.':mission.lanes===1?'Ein Weg.<br>Deine erste Entscheidung.':'Zwei Wege.<br>Eine gemeinsame Front.';
  $('battlefield').dataset.mission=id;$('fronts').innerHTML=Array.from({length:mission.lanes},(_,lane)=>`<button class="ceramic front" data-lane="${lane}" aria-label="${mission.lanes===1?'Front':laneName(lane)}"><strong></strong><span></span><div class="front-track"><i></i></div><small></small></button>`).join('');
  ready=true;if(start&&match.phase==='setup'){match.start();flush();}view.renderMatch(match,0);updateHUD();markers();$('loading').hidden=true;loading=false;
  if(start){setMenu(false);playing=match.phase==='running';save();}updateHUD();
  if(saved?.match?.version===1&&id==='central')notify('Fabrikkampf aktualisiert. Für die neue HQ-Balance bitte eine neue Partie starten.');
 }catch(error){loading=false;console.error(error);$('loading').hidden=true;$('battle-error').hidden=false;$('battle-error').textContent='Die Mission konnte nicht geladen werden: '+error.message;}
}
async function openMission(id){
 if(!unlocked(campaign,id))return;
 if(match?.mission.id===id&&match.phase==='running'){setMenu(false);playing=true;updateHUD();return;}
 await prepare(id,{start:true});
}
function requestRestart(id){restartId=id;$('restart-confirm').hidden=false;$('confirm-restart').textContent=MISSIONS[id].name+' neu beginnen';}
function selectFactory(slot){
 if(inMenu||!ready||match.phase!=='running')return;setDeck(false);hintOpen=false;selected=slot;const p=match.players.orange,f=p.pending[slot]||p.factories[slot]||{type:'drone',lane:slot%match.laneCount};
 $('factory-type').value=f.type;$('factory-lane').value=f.lane;$('orders').hidden=false;$('selection').hidden=true;cancelSupply();updateEditor();
}
function updateEditor(){
 if(!match)return;const p=match.players.orange,actual=p.factories[selected],pending=p.pending[selected],type=$('factory-type').value,cost=!actual?match.rules.factoryCost:actual.type!==type?match.rules.refitCost:0,delta=cost-(pending?.paid||0);
 $('factory-number').textContent='FABRIK 0'+(selected+1);$('factory-title').textContent=actual?'Produktion anpassen':'Fabrik bauen';
 $('factory-status').textContent=actual?`${names[actual.type]} · ${match.unitSpecs[actual.type].count} Roboter alle ${match.rules.wave} s${match.laneCount===2?' · '+laneName(actual.lane):''}`:'Ein fester Bauplatz für zusätzliche automatische Produktion.';
 $('lane-field').hidden=match.laneCount===1;
 $('apply-factory').textContent=!actual?'Bau vormerken · '+cost+' Credits':actual.type!==type?'Umrüsten · '+cost+' Credits':'Einstellung übernehmen · kostenlos';
 $('apply-factory').disabled=match.phase!=='running'||match.credits('orange')<delta;
 $('cancel-order').hidden=!pending;$('cancel-order').textContent='Stornieren · '+(pending?.paid||0)+' Credits zurück';
 $('order-help').textContent=pending?`${names[pending.type]}${match.laneCount===2?' · '+laneName(pending.lane):''} aktiv in ${match.nextWave.toFixed(1)} s. Bis dahin änderbar oder stornierbar. ${delta<0?-delta+' Credits werden erstattet.':delta>0?delta+' zusätzliche Credits nötig.':''}`:'Aktiv ab der nächsten Welle. Vorhandene Roboter bleiben bestehen.';
}
function toggleLane(slot){
 const p=match.players.orange,f=p.pending[slot]||p.factories[slot];if(!f||match.laneCount!==2)return;
 if(issue('factory',{slot,type:f.type,lane:1-f.lane}))notify('Fabrik '+(slot+1)+': '+laneName(1-f.lane)+' ab nächster Welle · kostenlos.');
}
function inspect(){
 if(!view||!match||inMenu)return;const u=view.inspect();$('selection').hidden=!u;if(!u)return;setDeck(false);hintOpen=false;$('orders').hidden=true;
 $('selected-name').textContent=(u.owner==='orange'?'Deine ':'Gegnerische ')+names[u.type];$('selected-details').textContent=`${u.hp} / ${match.unitSpecs[u.type].hp} LP · Reichweite ${match.unitSpecs[u.type].range}${u.deployment?' · kampfbereit vor der Fabrik':u.departing?' · verlässt die Basis':''}`;
}
function hint(){
 if(match.mission.id==='central'){
  const ai=match.controllers.find(c=>c.owner==='blue'),plan=CENTRAL_STRATEGIES[ai?.strategy];
  if(match.time<30)return [plan?'Gegner: '+plan.name:'Zentrale Front',(plan?.description||'')+'. '+match.rules.wave+'-Sekunden-Wellen. Baue Produktion oder investiere in Einkommen.'];
  if(match.players.orange.pending.some(Boolean))return ['Die nächste Welle verändert die Front','Dein Auftrag wird in '+match.nextWave.toFixed(1)+' s aktiv. Bereits ausgerückte Roboter kämpfen weiter.'];
  return ['Produktion lesen, gezielt reagieren','Drohnen → Fernkämpfer → Mechs → Drohnen. Umrüstung: '+match.rules.refitCost+' Credits. Nachschub: '+match.rules.supplyCost+' Credits, '+match.rules.supplyCooldown+' s Abklingzeit.'];
 }
 if(match.mission.id==='first'){
  if(match.time<14)return ['Die erste Front','Deine Fabrik produziert alle 15 Sekunden. Die Drohnen fahren und kämpfen selbstständig.'];
  if(match.credits('orange')<100&&!match.players.orange.factories[1]&&!match.players.orange.pending[1])return ['Beobachte den Gegner','Drohnen schlagen Fernkämpfer. Mechs bremsen Drohnen. Fernkämpfer bekämpfen Mechs.'];
  if(!match.players.orange.factories[1]&&!match.players.orange.pending[1])return ['Verstärke die Produktion','100 Credits sind bereit. Baue auf Platz 02 eine zweite Fabrik.'];
  if(match.players.orange.pending.some(Boolean))return ['Auftrag angenommen','Die Vorschau wird mit der nächsten Welle aktiv. Bis dahin kannst du den Auftrag ändern oder stornieren.'];
  return ['Das Ziel ist sein HQ','Reagiere auf die blaue Produktion. Eine Umrüstung kostet 30 Credits; deine Roboter kämpfen weiter.'];
 }
 if(match.time<35)return ['Zwei Fronten, deine Entscheidung','Tippe den Richtungspfeil einer Fabrik an. Die nächste Welle folgt der neuen Route.'];
 if(supplyType)return ['Nachschub vom HQ','Tippe West oder Ost an – oder ziehe ein Robotersymbol direkt auf den Weg.'];
 return ['Behalte beide Wege im Blick','Die Frontanzeigen messen Position und Bewegung. Unterwegs zeigt deine anrückenden Verstärkungen.'];
}
function updateHUD(){
 if(!match)return;const p=match.players.orange,enemy=match.players.blue,ended=match.phase==='ended';
 $('mission-title').textContent=match.mission.name.toUpperCase();$('battle-clock').textContent=timeText(match.time);$('phase-label').textContent=ended?'BEENDET':playing?'WELLE '+match.wave:'PAUSE';
 for(const [id,player] of [['own',p],['enemy',enemy]]){$(id+'-hq').textContent=player.hq+' LP';$(id+'-health').max=match.rules.hqHP;$(id+'-health').value=player.hq;}
 $('credits').textContent=Math.floor(match.credits('orange'));$('income').textContent=ended?'Partie beendet':'+'+match.income('orange')+' Credits / s';$('wave-countdown').textContent=ended?'Keine weiteren Wellen':'Welle in '+match.nextWave.toFixed(1)+' s';
 $('match-play').textContent=compactHUD()?(playing?'Ⅱ':'▶'):(playing?'Pause':'Weiter');$('match-play').setAttribute('aria-label',playing?'Partie pausieren':'Partie fortsetzen');$('match-play').disabled=ended;
 $('economy').disabled=ended||p.economy||match.credits('orange')<match.rules.economyCost;
 $('economy').innerHTML=p.economy?'Wirtschaft ausgebaut <small>+'+match.income('orange')+' Credits/s</small>':'Wirtschaft · '+match.rules.economyCost+' <small>Einmalig +'+match.rules.economyIncome+' Credit/s</small>';
 $('supply-title').textContent='SOFORTNACHSCHUB · '+match.rules.supplyCost;
 const cool=Math.max(0,(p.supplyReady-match.tick)*.05);
 $('supply-status').textContent=ended?'Partie beendet':cool?'Bereit in '+cool.toFixed(1)+' s':match.credits('orange')<match.rules.supplyCost?'Noch '+Math.ceil(match.rules.supplyCost-match.credits('orange'))+' Credits nötig':match.laneCount===1?'Robotertyp antippen':'Ziehen oder Typ → Lane antippen';
 for(const b of $('supply-units').children){b.setAttribute('aria-disabled',String(ended||cool>0||match.credits('orange')<match.rules.supplyCost));b.classList.toggle('selected',b.dataset.type===supplyType);b.disabled=ended;}
 const key=JSON.stringify([p.factories,p.pending,ended,match.laneCount]);
 if(key!==cardKey){cardKey=key;$('factory-cards').innerHTML=p.factories.map((f,i)=>{
  const pending=p.pending[i],next=pending||f,info=f?(match.unitSpecs[f.type].count+' / Welle'+(match.laneCount===2?' · aktiv '+laneName(f.lane):'')):match.rules.factoryCost+' Credits';
  return `<article class="factory-card ${pending?'pending':''}" data-slot="${i}"><button class="factory-open" data-edit="${i}" ${ended?'disabled':''} aria-label="Fabrik ${i+1} bearbeiten"><span class="slot-no">0${i+1}</span>${next?robot(next.type):'<span class="empty">+</span>'}<span><strong>${f?names[f.type]:pending?names[pending.type]+' geplant':'Bauen'}</strong><small>${info}</small></span></button>${next&&match.laneCount===2?'<button class="route-button" data-route="'+i+'" '+(ended?'disabled':'')+' aria-label="Fabrik '+(i+1)+' Richtung wechseln">'+(next.lane===0?'← WEST':'OST →')+(pending?' · nächste Welle':'')+'</button>':''}<small class="factory-timer" data-timer="${i}"></small></article>`;
 }).join('');}
 for(const el of document.querySelectorAll('[data-timer]')){const i=Number(el.dataset.timer),f=p.factories[i],next=p.pending[i];el.textContent=ended?'Beendet':next?'Geplant: '+names[next.type]+' · '+match.nextWave.toFixed(1)+' s':f?'Produktion in '+match.nextWave.toFixed(1)+' s':'Fester Bauplatz';}
 $('factory-summary').textContent=p.factories.filter(Boolean).length+'/'+match.slotCount+(p.pending.some(Boolean)?' · Auftrag':'' );
 $('reserved').textContent=p.pending.some(Boolean)?p.pending.reduce((n,f)=>n+(f?.paid||0),0)+' Credits reserviert':'Automatisch alle '+match.rules.wave+' Sekunden';
 frontReadings=match.lanes.map((_,lane)=>{const h=frontHistory[lane]??=[];return frontState(match,lane,h.find(x=>match.time-x.time>=5));});
 for(const state of frontReadings){
  const history=frontHistory[state.lane];if(!history.length||match.time-history.at(-1).time>=1)history.push({time:match.time,position:state.position});while(history.length&&match.time-history[0].time>10)history.shift();
  const el=$('fronts').children[state.lane];if(!el)continue;el.classList.toggle('risk',state.risk);el.classList.toggle('target',state.lane===targetLane);
  el.querySelector('strong').textContent=match.laneCount===1?'FRONT':laneName(state.lane).toUpperCase();
  const brief={'Eigene Front rückt vor':'Vormarsch','Eigene Front weicht zurück':'Rückzug','Front im Gefecht':'Im Gefecht','Truppen auf dem Weg':'Unterwegs','Front noch offen':'Noch offen','Angriff am Gegner-HQ':'Am Gegner-HQ'};
  el.querySelector('span').textContent=ended?'Beendet':compactHUD()?(brief[state.label]||state.label):state.label;
  el.setAttribute('aria-label',(match.laneCount===1?'Front':laneName(state.lane))+': '+state.label+', '+state.incoming+' unterwegs, nächste Welle '+state.next);
  el.querySelector('i').style.left=(state.position/30*100)+'%';el.querySelector('small').textContent=ended?'':state.incoming+' unterwegs · nächste Welle '+state.next;
 }
 const [title,text]=hint();$('hint').hidden=ended||!campaign.settings.hints||!$('orders').hidden||(compactHUD()&&!hintOpen);$('toggle-hint').setAttribute('aria-expanded',String(!$('hint').hidden));$('hint').innerHTML='<strong>'+title+'</strong>'+text;
 $('match-result').hidden=!ended;if(ended){$('orders').hidden=true;$('selection').hidden=true;cancelSupply();$('result-title').textContent=match.result==='orange'?'Mission geschafft.':match.result==='blue'?'Dein HQ ist gefallen.':'Beide HQs sind gefallen.';
 $('result-details').textContent=match.mission.name+' · '+timeText(match.time)+' · '+match.wave+' Wellen. HQ: '+p.hq+' : '+enemy.hq+' LP.'+(match.result==='orange'&&match.mission.id==='first'?' Wiesenkrieg ist freigeschaltet.':'');
 $('result-next').textContent=match.result==='orange'&&match.mission.id==='first'?'Weiter zu Wiesenkrieg':'Mission erneut spielen';}
 if(compactHUD())$('hint').style.bottom=(innerHeight-document.querySelector('.command-deck').getBoundingClientRect().top+10)+'px';else $('hint').style.bottom='';
 updateEditor();updateSupplyFeedback();
}
function markers(){
 if(!ready||inMenu)return;const screens=view.factoryScreens(),own=screens.filter(f=>f.owner==='orange'),enemy=screens.filter(f=>f.owner==='blue');
 const allBottom=Math.max(...own.map(f=>f.bounds.bottom),...view.hqs.filter((_,i)=>i===0).map(h=>view.buildingBounds(h).bottom));
 const width=innerWidth,spacing=compactHUD()?Math.min(86,(width-24)/match.slotCount):108,center=width/2,top=allBottom+8;
 const data=[...own,...enemy],lines=[];
 for(let i=0;i<data.length;i++){
  const f=data[i],p=match.players[f.owner],actual=p.factories[f.slot],pending=f.owner==='orange'?p.pending[f.slot]:null,next=pending||actual;
  let el=markerElements[i];if(!el){el=document.createElement('div');$('factory-labels').append(el);markerElements[i]=el;}
  el.hidden=!next||(compactHUD()&&(deckOpen||!$('orders').hidden));el.className='building-marker '+f.owner+(!actual&&pending?' ghost':'');if(!next)continue;
  const x=center+(f.slot-(match.slotCount-1)/2)*spacing,y=f.owner==='orange'?top:Math.min(...enemy.map(b=>b.bounds.top))-22;
  el.style.left=x+'px';el.style.top=y+'px';
  const desc=f.owner==='blue'?'0'+(f.slot+1)+' · '+names[next.type]+(match.laneCount===2?' · '+laneName(next.lane):''):'0'+(f.slot+1)+' · '+(pending?names[pending.type]+' · '+Math.ceil(match.nextWave)+' s':names[actual.type]);
  const control=f.owner==='orange'?(actual&&match.laneCount===2?'<button data-route="'+f.slot+'" '+(match.phase==='ended'?'disabled':'')+' aria-label="Gebäude '+(f.slot+1)+' Richtung wechseln">'+(next.lane===0?'← WEST':'OST →')+(pending&&pending.lane!==actual.lane?'<small>aktuell '+laneName(actual.lane)+'</small>':'')+'</button>':pending?'<button class="marker-edit" data-edit="'+f.slot+'">Ändern / Storno'+(match.laneCount===2?' · '+laneName(next.lane):'')+'</button>':''):'';
  if(el.dataset.control!==control){el.innerHTML='<small></small>'+control;el.dataset.control=control;}if(!el.firstChild)el.innerHTML='<small></small>'+control;el.firstChild.textContent=desc;
  if(f.owner==='orange')lines.push('<path d="M '+f.x+' '+(f.bounds.bottom+1)+' L '+x+' '+(y-2)+'" stroke="#ebe3c9" stroke-width="1.5" opacity=".8" fill="none"/>');
 }
 $('building-leaders').innerHTML=lines.join('');
}
function setTarget(lane){if(targetLane===lane)return;targetLane=lane;view?.highlightLane(lane);updateSupplyFeedback();}
function cancelSupply(){supplyType=null;drag=null;setTarget(null);$('supply-targeting').hidden=true;}
function updateSupplyFeedback(){
 if(!match||!supplyType)return;$('supply-targeting').hidden=false;const cool=Math.max(0,(match.players.orange.supplyReady-match.tick)*.05),money=match.credits('orange');
 $('supply-targeting').querySelector('span').textContent=names[supplyType]+' · '+match.rules.supplyCost+' Credits · '+(cool?'noch '+cool.toFixed(1)+' s Abklingzeit':money<match.rules.supplyCost?'noch '+Math.ceil(match.rules.supplyCost-money)+' Credits nötig':targetLane===null?'Ziel-Lane wählen':laneName(targetLane)+' · loslassen / antippen');
 for(const el of $('fronts').children)el.classList.toggle('target',Number(el.dataset.lane)===targetLane);
}
function sendSupply(lane){if(!supplyType||lane===null)return false;const type=supplyType;if(issue('supply',{type,lane})){cancelSupply();notify(names[type]+'-Nachschub verlässt dein HQ.');return true;}return false;}
function targetAt(x,y){const el=document.elementFromPoint(x,y),front=el?.closest('[data-lane]');if(front)return Number(front.dataset.lane);if(el?.closest('.command-deck,.order-panel,.game-top,.building-marker,.menu-layer'))return null;return view.laneAt(x,y);}
function onFieldClick(e){if(!supplyType)return;e.stopImmediatePropagation();sendSupply(view.laneAt(e.clientX,e.clientY));}
function advance(seconds,draw=true){match.advance(seconds);flush();if(match.phase==='ended'){playing=false;if(!endedSaved){endedSaved=true;save();}}view.renderMatch(match,seconds,draw);}
function frame(now){
 railAudio.setActive(ready&&!inMenu&&(playing||(match.phase==='ended'&&(view.effects.length||view.corpses.size))));
 const dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;
 if(ready){if(playing&&!inMenu)advance(dt);else view.renderMatch(match,!inMenu&&match.phase==='ended'&&(view.corpses.size||view.effects.length)?dt:0);hudClock+=dt;saveClock+=dt;
  if(hudClock>=.1){updateHUD();markers();hudClock=0;}if(saveClock>=2){if(playing)save();saveClock=0;}}
 if(noticeUntil&&now>noticeUntil){$('notice').hidden=true;noticeUntil=0;}requestAnimationFrame(frame);
}
$('supply-units').innerHTML=Object.keys(names).map(type=>'<button data-type="'+type+'" aria-label="'+names[type]+' Sofortnachschub">'+robot(type)+'<small>'+names[type]+'</small></button>').join('');
$('supply-units').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-type]');if(!b||b.disabled||!ready)return;ignoreSupplyClick=false;setDeck(false);hintOpen=false;$('selection').hidden=true;$('orders').hidden=true;supplyType=b.dataset.type;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId);updateSupplyFeedback();});
$('supply-units').addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8)drag.moved=true;if(drag.moved)setTarget(targetAt(e.clientX,e.clientY));});
$('supply-units').addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(moved){ignoreSupplyClick=true;const lane=targetAt(e.clientX,e.clientY);if(lane===null)cancelSupply();else sendSupply(lane);}});
$('supply-units').addEventListener('pointercancel',cancelSupply);
$('supply-units').addEventListener('click',e=>{if(ignoreSupplyClick&&e.detail!==0){ignoreSupplyClick=false;return;}const b=e.target.closest('[data-type]');if(!b)return;supplyType=b.dataset.type;$('orders').hidden=true;if(match.laneCount===1)sendSupply(0);else updateSupplyFeedback();});
$('fronts').onclick=e=>{const b=e.target.closest('[data-lane]');if(!b)return;if(supplyType)sendSupply(Number(b.dataset.lane));else if(compactHUD()){const show=!b.classList.contains('detail');for(const front of $('fronts').children){front.classList.remove('detail');front.setAttribute('aria-expanded','false');}b.classList.toggle('detail',show);b.setAttribute('aria-expanded',String(show));}};
$('cancel-supply').onclick=cancelSupply;
$('toggle-factories').onclick=()=>{setDeck(!deckOpen);hintOpen=false;cancelSupply();$('orders').hidden=true;$('selection').hidden=true;updateHUD();markers();};
$('toggle-hint').onclick=()=>{hintOpen=!hintOpen;setDeck(false);updateHUD();markers();};
function factoryClick(e){const edit=e.target.closest('[data-edit]'),route=e.target.closest('[data-route]');if(route)toggleLane(Number(route.dataset.route));else if(edit)selectFactory(Number(edit.dataset.edit));}
$('factory-cards').onclick=factoryClick;$('factory-labels').onclick=factoryClick;
$('factory-type').onchange=updateEditor;$('factory-lane').onchange=updateEditor;
$('apply-factory').onclick=()=>{if(issue('factory',{slot:selected,type:$('factory-type').value,lane:match.laneCount===1?0:Number($('factory-lane').value)})){notify('Auftrag vorgemerkt · aktiv in '+match.nextWave.toFixed(1)+' s.');$('orders').hidden=true;}};
$('cancel-order').onclick=()=>{if(issue('cancel',{slot:selected})){notify('Auftrag storniert, Credits erstattet.');$('orders').hidden=true;}};
$('close-orders').onclick=()=>{$('orders').hidden=true;};
$('economy').onclick=()=>{if(issue('economy')){setDeck(false);notify('Wirtschaft ausgebaut: +'+match.income('orange')+' Credits/s.');}};
$('open-menu').onclick=()=>setMenu(true);$('result-menu').onclick=()=>setMenu(true);
$('campaign-go').onclick=()=>campaign.saves.central?.match.phase==='ended'?prepare('central',{fresh:true,start:true}):openMission('central');
$('central-opponent').onchange=()=>{campaign.settings.centralStrategy=$('central-opponent').value;persist();};
for(let i=0;i<2;i++)$('start-type-'+i).onchange=()=>{campaign.settings.centralStart=[0,1].map(n=>$('start-type-'+n).value);persist();};
$('resume-game').onclick=()=>openMission(campaign.active);
$('level-list').onclick=e=>{const level=e.target.closest('button[data-mission]'),restart=e.target.closest('[data-restart]');if(level)openMission(level.dataset.mission);if(restart)requestRestart(restart.dataset.restart);};
$('confirm-restart').onclick=async()=>{const id=restartId;$('restart-confirm').hidden=true;await prepare(id,{fresh:true,start:true});};
$('cancel-restart').onclick=()=>{$('restart-confirm').hidden=true;restartId=null;};
$('levels-toggle').onclick=()=>{$('level-list').hidden=!$('level-list').hidden;$('settings-panel').hidden=true;};
$('settings-toggle').onclick=()=>{$('settings-panel').hidden=!$('settings-panel').hidden;$('level-list').hidden=true;};
$('camera-setting').onchange=()=>{campaign.settings.camera=$('camera-setting').value;view?.setCamera(campaign.settings.camera);persist();};
$('motion-setting').onchange=()=>{campaign.settings.motion=$('motion-setting').checked;if(view)view.reduced=!campaign.settings.motion;persist();};
bindRailSound($('sound-setting'));
$('hints-setting').onchange=()=>{campaign.settings.hints=$('hints-setting').checked;persist();};
$('match-play').onclick=()=>{if(match.phase!=='running')return;playing=!playing;last=performance.now();save();updateHUD();};
$('result-next').onclick=async()=>{if(match.result==='orange'&&match.mission.id==='first')await openMission('meadow');else await prepare(match.mission.id,{fresh:true,start:true});};
$('camera-home').onclick=()=>view.home();$('zoom-in').onclick=()=>view.zoomBy(1.25);$('zoom-out').onclick=()=>view.zoomBy(.8);
$('close-selection').onclick=()=>{view.selected=null;$('selection').hidden=true;};$('focus-unit').onclick=()=>view.focusSelected();
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;save();}last=performance.now();});
window.addEventListener('pagehide',save);
window.addEventListener('resize',()=>{if(view){frameField();updateHUD();markers();}});
document.addEventListener('keydown',e=>{if(e.code==='Escape'){cancelSupply();$('orders').hidden=true;if(!inMenu)setMenu(true);}if(e.code==='Space'&&!inMenu&&!['SELECT','INPUT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();$('match-play').click();}});
updateMenu();await prepare(campaign.active&&MISSIONS[campaign.active]?campaign.active:'central');requestAnimationFrame(frame);
window.__LANE_MATCH__=Object.freeze({snapshot:()=>match.snapshot(),observe:()=>match.observe('orange'),summary:()=>match.summary(),diagnostics:()=>({...view.diagnostics(),audio:railAudio.inspect(),factories:view.factoryScreens(),laneTargets:view.laneScreens(),fronts:frontReadings}),get playing(){return playing;},campaign:()=>structuredClone(campaign)});
if(new URLSearchParams(location.search).has('qa'))window.__LANE_MATCH_QA__=Object.freeze({
 load:async id=>{await prepare(id,{fresh:true,start:true});playing=false;updateHUD();},
 advance:seconds=>{playing=false;for(const effect of view.effects)view.disposeEffect(effect);view.effects=[];match.advance(seconds);const events=match.drainEvents();for(const e of events)if(e.kind==='production')view.matchEvent(e);view.renderMatch(match,0,false);for(const e of events){const age=Math.max(0,match.time-(e.time??match.time));if(e.kind==='production'||age>.65)continue;const before=view.effects.length;view.matchEvent(e);for(const effect of view.effects.slice(before))effect.age=age;}view.dirty=true;view.renderMatch(match,0);if(match.phase==='ended'){endedSaved=true;save();}updateHUD();markers();},
 command:(owner,action,data)=>{const result=match.command(owner,action,data);flush();view.renderMatch(match,0);updateHUD();markers();return result;},
 automatePlayer:options=>{match.controllers=match.controllers.filter(c=>c.owner!=='orange');match.controllers.push(match.mission.id==='central'?new CentralAI('orange',options):new MatchAI('orange',options));},
 start:()=>{match.start();flush();updateHUD();},pause:()=>{playing=false;updateHUD();},save,menu:()=>setMenu(true)
});
