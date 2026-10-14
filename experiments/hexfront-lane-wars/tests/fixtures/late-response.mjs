import {Match} from '../../src/match.js';
export function lateResponse({initial='drone',enemy='mech',counter='rail',reacts=true,concentrate=false,budget=600}={}){
 const army=[{type:initial,lane:0},{type:initial,lane:1}],m=new Match({orange:army,blue:army});m.start();let nextSupply=225,visibleAtReaction=null;
 while(m.phase==='running'&&m.time<budget){
  m.advance(.05);m.drainEvents();
  if([1000,2000].includes(m.tick))for(const owner of ['orange','blue'])m.command(owner,'factory',{slot:m.tick===1000?2:3,type:initial,lane:m.tick===1000?0:1});
  if(m.tick===2800)for(const owner of ['orange','blue'])m.command(owner,'economy');
  if(m.tick===3600)for(let slot=0;slot<4;slot++)m.command('blue','factory',{slot,type:enemy,lane:slot%2});
  if(m.tick===4000){visibleAtReaction=m.observe('orange').enemyFactories;if(reacts)for(let slot=0;slot<4;slot++)m.command('orange','factory',{slot,type:counter,lane:concentrate?0:slot%2});}
  if(m.time>=nextSupply){const lane=Math.floor(nextSupply/20)%2;for(const owner of ['orange','blue'])m.command(owner,'supply',{type:owner==='blue'?enemy:reacts?counter:initial,lane:owner==='orange'&&reacts&&concentrate?0:lane});nextSupply+=20;}
 }
 return {initial,enemy,counter,reacts,concentrate,visibleAtReaction,...m.summary(),orders:m.orders};
}