import {Match} from '../../src/match.js';
export function centralLate({initial='mech',enemy='rail',counter='drone',reacts=true,supply=false,unitSpecs=null,supplyAt=240,supplyType=null}={}){
 const m=new Match({mission:'central',unitSpecs,orange:[{type:initial,lane:0},{type:initial,lane:0}]});m.start();let decision=null;const actions=[];
 const order=(...args)=>{const r=m.command(...args);if(!r.ok)throw Error(JSON.stringify({time:m.time,args,result:r}));actions.push({time:m.time,args});};
 while(m.phase==='running'&&m.time<720){
  if(m.tick===800||m.tick===2000)for(const o of ['orange','blue'])order(o,'factory',{slot:m.tick===800?0:3,type:initial,lane:0});
  if(m.tick===2800)for(const o of ['orange','blue'])order(o,'economy');
  if(m.tick===3600)for(let i=0;i<4;i++)order('blue','factory',{slot:i,type:enemy,lane:0});
  if(m.tick===4000){decision=m.snapshot();if(reacts)for(let i=0;i<4;i++)order('orange','factory',{slot:i,type:Array.isArray(counter)?counter[i]:counter,lane:0});}
  if(supply&&m.tick===Math.round(supplyAt/.05))order('orange','supply',{type:supplyType||(Array.isArray(counter)?counter[0]:counter),lane:0});
  m.advance(.05);m.drainEvents();
 }
 return {...m.summary(),decision,actions};
}
