import {Battle,chooseOrder} from './game.js';
import {ECONOMY_MODE,ECONOMY_MODES} from './economy.js';
import {reachability,orderPreview,fieldInfo,rateText} from './tactics.js';
import {Diorama} from './scene.js';
const ALLOW_QA = false;
const MANUAL_CLOCK = ALLOW_QA && new URLSearchParams(location.search).get('clock')==='manual';
const requestedEconomy=new URLSearchParams(location.search).get('economy');
const $=id=>document.getElementById(id),game=new Battle({economyMode:ECONOMY_MODES.includes(requestedEconomy)?requestedEconomy:ECONOMY_MODE});
const central=game.economyMode==='hq-centralized';
$('economy-mode').textContent=central?'Zentrale Produktion':'Lokale Produktion';
$('economy-briefing').textContent=central?'Nur dein HQ produziert. Verbundene Sektoren stärken den Nachschub; das verbundene Relais bringt +20 %. Felswände lassen sich nur über die beiden Rampen überwinden.':'Alle eigenen Sektoren produzieren. Relaisbesitz bringt +30 % Nachschub. Felswände lassen sich nur über die beiden Rampen überwinden.';
$('economy-help').textContent=central?'Nur das HQ erzeugt neue Truppen. Kontrollierte, begehbar verbundene Sektoren erhöhen seine Produktion. Das verbundene Relais bringt zusätzlich +20 %. Bei 99 Truppen pausiert das Wachstum; Verstärkungen gehen nicht verloren.':'Eigene Sektoren erzeugen Truppen. Relaisbesitz erhöht die gesamte Produktion um 30 %. Bei 99 Truppen pausiert das Wachstum.';
let scene,selected=null,pending=null,fraction=1,loaded=false,last=0,accumulator=0,lastUI=0,toastTimer,autoPaused=false,helpWasPaused=false;
// Reserve the actual command panel height, including wrapped text on phones.
// ResizeObserver then lets the camera fit its remaining visible canvas.
const fitHUD=()=>{if(scene?.drag)return;document.querySelector('main').style.setProperty('--battle-bottom',`${Math.ceil(innerHeight-document.querySelector('.command-panel').getBoundingClientRect().top+20)}px`);};
new ResizeObserver(fitHUD).observe(document.querySelector('.command-panel'));window.addEventListener('resize',()=>{scene?.cancelGesture();fitHUD();});fitHUD();
const time=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function toast(text,kind=''){$('toast').dataset.kind=kind;$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4200);}
function select(id,blocked){
  if(!loaded)return;
  if(blocked==='cliff'){toast('Felswand – Aufstieg benutzen','blocked');return;}
  if(!game.running||game.paused){if(game.paused)toast('Die Schlacht pausiert. Mit ▶ fortsetzen.');else if(!game.result)toast('Starte die Operation, um Befehle zu geben.');return;}
  const c=game.cell(id);
  if(!c){selected=null;pending=null;}
  else if(!selected){if(c.owner!=='orange'){toast('Wähle zuerst eine orange Garnison.');return;}selected=id;pending=null;}
  else if(id===selected){selected=null;pending=null;}
  else {
    const source=game.cell(selected);
    if(source.owner!=='orange'){selected=c.owner==='orange'?id:null;pending=null;}
    else if(!game.path(source,c)){toast(reachability(game,source,c)==='cliff'?'Felswand – Aufstieg benutzen':'Kein begehbarer Weg über eigenes Gebiet','blocked');scene.reject(c.id);pending=null;}
    else {pending=id;scene.hover(id);scene.invalid=null;if($('toast').dataset.kind==='blocked')$('toast').classList.remove('visible');}
  }
  scene.select(selected);updateUI();
}
function hover(id){if(scene&&!scene.drag)scene.hover(pending||id);}
function issueOrder(){
  const r=game.send(selected,pending,fraction);
  if(r.ok){toast(`${r.order.units} Truppen unterwegs.`);pending=null;scene.hover(null);}
  else {toast(r.reason,'blocked');scene.reject(pending);}
  updateUI();
}
function dragCommand(phase,id,reason){
  if(phase==='start'){selected=id;pending=null;scene.select(id);scene.hover(null);}
  else if(phase==='move'){pending=id;scene.hover(id);}
  else if(phase==='end'){
    pending=id;
    if(reason||!id||id===selected){toast(reason==='cliff'?'Felswand – Aufstieg benutzen':'Befehl abgebrochen.',reason==='cliff'?'blocked':'');pending=null;scene.hover(null);}
    else if(reachability(game,game.cell(selected),game.cell(id))==='cliff'){toast('Felswand – Aufstieg benutzen','blocked');scene.reject(id);pending=null;scene.hover(null);}
    else{issueOrder();pending=null;scene.hover(null);}
  }else{pending=null;scene.hover(null);}
  updateUI();
  // Keep the framing fixed while a finger is down; the contextual panel must
  // never move the destination. Resume normal responsive fitting after release.
  if(phase==='end'||phase==='cancel')fitHUD();
}
function updateUI(){
  $('timer').textContent=time(game.time);$('orange-strength').textContent=game.strength('orange');$('blue-strength').textContent=game.strength('blue');
  $('orange-territory').style.width=`${game.fields('orange')/37*100}%`;$('blue-territory').style.width=`${game.fields('blue')/37*100}%`;
  $('field-count').textContent=`${game.fields('orange')} : ${game.fields('blue')} SEKTOREN`;
  $('phase').textContent=game.result?'EINSATZ BEENDET':game.paused?'PAUSIERT':game.running?'IM EINSATZ':'BEREIT';
  $('pause').disabled=!game.running;$('pause').textContent=game.paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',game.paused?'Fortsetzen':'Pausieren');document.body.classList.toggle('paused',game.paused);
  const economy=game.economy('orange'),hq=game.cell(economy.hqId),full=hq?.units>=economy.cap;
  $('hq-production').textContent=`HQ +${rateText(full?0:economy.rate)}/s${full?' · voll':''}`;
  $('hq-production').title=`HQ-Produktion: +${rateText(economy.rate)}/s · ${economy.connectedFields} verbundene Felder · Relais +${Math.round(economy.relayBonus*100)} %${full?' · pausiert am 99er-Cap':''}`;
  $('hint').style.opacity=game.commands>3?.55:1;
  let source=game.cell(selected),target=game.cell(pending);
  if(source&&source.owner!=='orange'){selected=null;pending=null;source=null;target=null;scene.select(null);scene.hover(null);toast('Deine ausgewählte Stellung wurde erobert.');}
  const match=game.running||game.result?'active':'intro',hud=game.result?'result':!game.running?'intro':game.paused?'paused':source&&target?'command':source?'selection':'idle';
  if(document.body.dataset.match!==match)document.body.dataset.match=match;
  if(document.body.dataset.hud!==hud)document.body.dataset.hud=hud;
  if(scene){scene.pending=pending;scene.orderFraction=fraction;}
  $('command-options').hidden=!source||!game.running;
  if(game.result){$('command-label').textContent='EINSATZ BEENDET';$('command-title').textContent=game.result==='victory'?'Die Bastion ist gesichert.':'Das Hauptquartier ist gefallen.';$('command-detail').textContent='Ein neuer Anlauf beginnt mit derselben Ausgangslage.';$('primary').innerHTML='Erneut spielen <span>↻</span>';$('primary').disabled=false;}
  else if(!game.running){$('command-label').textContent='DEIN EINSATZ';$('command-title').textContent='Die Festung wartet.';$('command-detail').textContent='Wähle Orange. Sichere das Plateau. Erobere das blaue HQ.';$('primary').innerHTML=loaded?'Operation starten <span>→</span>':'Gelände laden <span>→</span>';$('primary').disabled=!loaded;}
  else if(game.paused){$('command-label').textContent='TAKTISCHE PAUSE';$('command-title').textContent='Die Schlacht ist angehalten.';$('command-detail').textContent='Nimm dir Zeit, das Gelände und die Front zu betrachten.';$('primary').innerHTML='Fortsetzen <span>▶</span>';$('primary').disabled=false;}
  else if(source&&target){
    const {path,amount,combat}=orderPreview(game,source,target,fraction);
    $('command-label').textContent=`${target.owner==='orange'?'VERSTÄRKUNG':'ANGRIFF'} · ${target.name} · HÖHE ${target.height}`;
    $('command-title').textContent=target.owner==='orange'?`${amount} Truppen → ${Math.floor(target.units)} eigene`:`${amount} Truppen → ${Math.ceil(target.units)} Verteidiger`;
    if(!path){$('command-detail').textContent=reachability(game,source,target)==='cliff'?'Felswand – Aufstieg benutzen':'Die Route wurde unterbrochen. Wähle ein neues Ziel.';}
    else if(!combat){$('command-detail').textContent=`${path.length-1} Feld${path.length>2?'er':''} über eigenes Gebiet · Eine Einheit bleibt zurück.`;}
    else{
      const bonuses=[];
      if(combat.defense>1)bonuses.push(combat.defense>1.2?'Bergauf: Verteidiger +30 %':'HQ: Verteidiger +20 %');
      if(combat.attack>1)bonuses.push('Bergab: Angriff +15 %');
      $('command-detail').textContent=`${bonuses.length?bonuses.join(' · '):'Kein Höhenbonus'} · Prognose: ${combat.win?'Vorteil':'Unterlegen'}\nStand jetzt · Ziel kann bis zur Ankunft verstärkt werden.`;
    }
    $('primary').innerHTML=scene?.drag?'Loslassen zum Senden':'Befehl geben <span>→</span>';$('primary').disabled=!path||amount<1;
  } else if(source){$('command-label').textContent=`${source.kind==='hq'?'HAUPTQUARTIER':source.kind==='relay'?'RELAIS':source.height===1?'RAMPE':source.height===2?'FELSPLATEAU':'GARNISON'} · HÖHE ${source.height}`;$('command-title').textContent=`${source.name} · ${Math.floor(source.units)} Truppen`;$('command-detail').textContent=fieldInfo(game,source)+(source.height>0?' · Gegen Angriffe von unten: +30 % Abwehr.':'');$('primary').innerHTML='Ziel wählen <span>◇</span>';$('primary').disabled=true;}
  else{$('command-label').textContent='DEIN BEFEHL';$('command-title').textContent='Wähle eine orange Garnison.';$('command-detail').textContent=central?'Verbundene Sektoren stärken das HQ. Verbundenes Relais: +20 %.':'Truppen wachsen auf allen Feldern. Relaisbesitz: +30 %.';$('primary').innerHTML='Garnison wählen <span>◇</span>';$('primary').disabled=true;}
}
function restart(){scene.cancelGesture();scene.clearEffects();game.reset();selected=null;pending=null;fraction=1;scene.select(null);scene.hover(null);scene.fit();$('half').setAttribute('aria-pressed','false');$('all').setAttribute('aria-pressed','true');$('result-dialog').close();game.start();toast('Neuer Einsatz. Beide Seiten beginnen mit frischen Truppen.');updateUI();}
function showResult(){
  scene.cancelGesture();
  $('result-label').textContent=game.result==='victory'?'OPERATION ERFOLGREICH':'OPERATION GESCHEITERT';$('result-title').textContent=game.result==='victory'?'Die Bastion gehört dir.':'Die Linie ist gebrochen.';
  $('result-copy').textContent=game.result==='victory'?'Das blaue Hauptquartier wurde erobert. Deine Truppen sichern die Festung.':'Die gegnerischen Truppen haben dein Hauptquartier eingenommen. Bündle beim nächsten Versuch früher deine Kräfte.';
  $('result-time').textContent=time(game.time);$('result-captures').textContent=game.captures;$('result-commands').textContent=game.commands;
  if($('help-dialog').open)$('help-dialog').close();$('result-dialog').showModal();updateUI();
}
function processEvents(){for(const e of game.drainEvents()){if(e.type==='capture'||e.type==='combat'||e.type==='reinforce')scene.effect(e);if(e.type==='capture'&&e.id==='0,0')toast(`${e.owner==='orange'?'Relais gesichert':'Blau kontrolliert das Relais'}. ${central?(game.economy(e.owner).relayConnected?'Verbunden · HQ-Nachschub +20 %.':'Abgeschnitten · noch kein HQ-Bonus.'):'Nachschub +30 %.'}`);if(e.type==='result')showResult();}}
$('primary').addEventListener('click',()=>{
  if(game.result){restart();return;}if(game.paused){game.paused=false;autoPaused=false;updateUI();return;}if(!game.running){game.start();toast('Ziehe von Orange zum Ziel. Loslassen sendet die Truppen.');updateUI();return;}
  if(selected&&pending)issueOrder();
});
$('half').addEventListener('click',()=>{fraction=.5;$('half').setAttribute('aria-pressed','true');$('all').setAttribute('aria-pressed','false');updateUI();});
$('all').addEventListener('click',()=>{fraction=1;$('half').setAttribute('aria-pressed','false');$('all').setAttribute('aria-pressed','true');updateUI();});
$('clear').addEventListener('click',()=>{selected=null;pending=null;scene.select(null);scene.hover(null);updateUI();});
function togglePause(){if(!game.running)return;scene.cancelGesture();game.paused=!game.paused;autoPaused=false;updateUI();}
$('pause').addEventListener('click',togglePause);
$('help').addEventListener('click',()=>{scene?.cancelGesture();helpWasPaused=game.paused;if(game.running)game.paused=true;$('help-dialog').showModal();updateUI();});
const closeHelp=()=>{$('help-dialog').close();};$('close-help').addEventListener('click',closeHelp);$('understood').addEventListener('click',closeHelp);
$('help-dialog').addEventListener('close',()=>{if(game.running&&!autoPaused)game.paused=helpWasPaused;updateUI();});
$('restart').addEventListener('click',restart);$('inspect').addEventListener('click',()=>$('result-dialog').close());
$('zoom-in').addEventListener('click',()=>scene?.zoomBy(1.15));$('zoom-out').addEventListener('click',()=>scene?.zoomBy(1/1.15));$('fit').addEventListener('click',()=>scene?.fit());
$('camera-view').addEventListener('click',()=>scene?.setView(scene.view==='tactical'?'diorama':'tactical'));
$('quality').addEventListener('click',()=>{if(!scene)return;const low=scene.quality==='high';scene.setQuality(low?'low':'high');$('quality').textContent=low?'LQ':'HQ';$('quality').setAttribute('aria-label',`Grafikqualität: ${low?'Reduziert':'Hoch'}`);toast(low?'Reduzierte Auflösung und Schattenqualität aktiviert.':'Hohe Grafikqualität aktiviert.');});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===document.body){e.preventDefault();togglePause();}if(e.key==='Escape'&&!$('help-dialog').open&&!$('result-dialog').open){scene?.cancelGesture();selected=null;pending=null;scene?.select(null);scene?.hover(null);updateUI();}});
window.addEventListener('blur',()=>scene?.cancelGesture());
document.addEventListener('visibilitychange',()=>{if(document.hidden)scene?.cancelGesture();if(document.hidden&&game.running&&!game.paused){game.paused=true;autoPaused=true;updateUI();}last=performance.now();accumulator=0;});
try {
  scene=new Diorama($('stage'),$('labels'),game,select,hover);
  scene.onDrag=dragCommand;
  scene.onFrameChange=({zoom,small})=>{const hint=$('camera-guidance');hint.hidden=!small&&zoom<=1.01;hint.querySelector('b').textContent=zoom>1.01?'Ausschnitt':'Übersicht';hint.querySelector('span').textContent=zoom>1.01?'Hintergrund ziehen':'+ für Details';};
  scene.onViewChange=view=>{$('camera-view').textContent=view==='tactical'?'Taktik':'Diorama';$('camera-view').setAttribute('aria-pressed',String(view==='diorama'));$('camera-view').setAttribute('aria-label',view==='tactical'?'Taktikansicht. Zur Dioramaansicht wechseln':'Dioramaansicht. Zur Taktikansicht wechseln');};
  scene.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();game.paused=true;toast('Grafikverbindung verloren. Bitte die Seite neu laden.');updateUI();});
  await scene.ready;loaded=true;$('loading').hidden=true;updateUI();
  const frame=now=>{const dt=last?Math.min((now-last)/1000,.2):0;last=now;if(!document.hidden){accumulator+=dt;while(accumulator>=.05){if(!MANUAL_CLOCK)game.update(.05);accumulator-=.05;}processEvents();if(now-lastUI>130){updateUI();lastUI=now;}scene.simulationRemainder=MANUAL_CLOCK?0:accumulator;scene.render(now);}requestAnimationFrame(frame);};requestAnimationFrame(frame);
  if(ALLOW_QA&&new URLSearchParams(location.search).has('qa'))window.__HEXFRONT3D__={
    snapshot:()=>game.snapshot(),point:id=>scene.screenCell(id),route:(a,b)=>game.path(game.cell(a),game.cell(b))?.map(c=>c.id),
    suggest:()=>chooseOrder(game,'orange'),
    advance:seconds=>{for(let t=0;t<Math.round(seconds*20)&&!game.result;t++)game.update(.05);processEvents();updateUI();scene.render(performance.now());return game.snapshot();},
    metrics:()=>({calls:scene.renderer.info.render.calls,triangles:scene.renderer.info.render.triangles,pixelRatio:scene.renderer.getPixelRatio(),quality:scene.quality}),
  };
} catch(error){console.error(error);$('loading').innerHTML='<strong>Die 3D-Ansicht konnte nicht geladen werden.</strong><small>Bitte nutze einen aktuellen Browser mit WebGL 2 und starte die Seite über npm run dev.</small>';$('loading').setAttribute('role','alert');}
