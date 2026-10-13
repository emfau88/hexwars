import {UNIT,troopText} from './units.js';
import {ARMY_LIMIT,QUEUE_LIMIT} from './economy.js';
export function createProductionUI(game,{refresh,beforeOpen,canResume}) {
  const $=id=>document.getElementById(id),dialog=$('production-dialog');let wasPaused=false,queueKey='';
  const message=text=>{$('production-message').textContent=text;};
  function open(){beforeOpen();wasPaused=game.paused;if(game.running)game.paused=true;message('');render();dialog.showModal();refresh();}
  for(const id of ['production-open','production-shortcut'])$(id).addEventListener('click',open);
  for(const id of ['production-close','production-done'])$(id).addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{if(game.running&&!wasPaused&&canResume())game.paused=false;refresh();});
  for(const type of ['drone','mech'])$('enqueue-'+type).addEventListener('click',()=>{const r=game.enqueue(type);message(r.ok?`${UNIT[type].name} eingereiht.`:r.reason);render();});
  $('repeat-production').addEventListener('click',()=>{game.toggleRepeat();render();});
  $('pause-production').addEventListener('click',()=>{game.toggleProduction();render();});
  $('production-cancel').addEventListener('click',()=>{game.cancelProduction();message('Aktueller Auftrag abgebrochen; Credits erstattet.');render();});
  $('rally-clear').addEventListener('click',()=>{game.factions.orange.rally=null;message('Neue Transporte bleiben am HQ. Laufende Transporte halten am nächsten eigenen Feld.');render();});
  function render() {
    const f=game.factions.orange,e=game.economy('orange'),active=f.active,spec=active?UNIT[active.type]:null,hq=game.cell(e.hqId),enabled=game.canManage('orange');
    $('production-credits').textContent=`${Math.floor(f.credits)} Credits`;
    $('production-income').textContent=`+${e.rate.toFixed(1).replace('.',',')}/s · ${game.strength('orange')}/${ARMY_LIMIT} Roboter`;
    for(const type of ['drone','mech'])$('enqueue-'+type).disabled=!enabled||f.queue.length+(active?1:0)>=QUEUE_LIMIT;
    const status=!enabled?'Starte zuerst einen Einsatz.':f.productionPaused?'Produktion pausiert':hq?.battle?'HQ im Gefecht · Produktion angehalten':game.strength('orange')>=ARMY_LIMIT?'Armeelimit erreicht · wartet auf Platz':active?`${spec.name} · ${Math.max(0,spec.seconds-active.elapsed).toFixed(1).replace('.',',')} s verbleiben`:f.queue.length?`Wartet auf ${UNIT[f.queue[0]].cost} Credits`:'Warteschlange leer';
    $('production-status').textContent=status;$('production-progress').value=active?active.elapsed/spec.seconds:0;
    $('production-cancel').disabled=!enabled||!active;
    const key=JSON.stringify([f.queue,enabled]);
    if(key!==queueKey){
      queueKey=key;$('production-queue').replaceChildren(...f.queue.map((type,index)=>{
        const button=document.createElement('button');button.textContent=`${index+1}. ${UNIT[type].name} ×`;button.disabled=!enabled;button.setAttribute('aria-label',`${UNIT[type].name}, Auftrag ${index+1} entfernen`);
        button.addEventListener('click',()=>{game.removeQueued(index);render();});return button;
      }));
    }
    $('queue-count').textContent=`${f.queue.length+(active?1:0)} / ${QUEUE_LIMIT}`;
    $('repeat-production').textContent=`Schleife: ${f.repeat?'an':'aus'}`;$('repeat-production').setAttribute('aria-pressed',String(f.repeat));$('repeat-production').disabled=!enabled;
    $('pause-production').textContent=f.productionPaused?'Produktion fortsetzen':'Produktion pausieren';$('pause-production').setAttribute('aria-pressed',String(f.productionPaused));$('pause-production').disabled=!enabled;
    const target=game.cell(f.rally),connected=target&&game.ownedPath(hq,target,'orange');
    $('rally-status').textContent=!target?'Keiner · Roboter bleiben am HQ':target.owner!=='orange'?'Sammelpunkt erobert · neues eigenes Feld wählen':`${target.name} (${target.id}) · ${connected?'verbunden':'Verbindung unterbrochen'}`;
    $('rally-clear').disabled=!enabled||!f.rally;
    $('production-shortcut').textContent=active?`${spec.name} ${Math.round(active.elapsed/spec.seconds*100)} % →`:'HQ-Produktion →';
    $('production-shortcut').title=`${status}${hq?' · '+troopText(hq.troops):''}`;
  }
  return {render,open};
}
