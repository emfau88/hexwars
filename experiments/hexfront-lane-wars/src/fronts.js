import {UNITS,LENGTH} from './rules.js';
// An observed contact boundary, not a count-based prediction of victory.
export function frontState(match,lane,previous=null){
 const units=match.lanes[lane].units,own=units.filter(u=>u.owner==='orange'),enemy=units.filter(u=>u.owner==='blue');
 const lead=own.length?Math.max(...own.map(u=>u.p)):0,opponent=enemy.length?Math.min(...enemy.map(u=>u.p)):LENGTH;
 const contact=own.length&&enemy.length?Math.min(...own.flatMap(a=>enemy.map(b=>Math.abs(a.p-b.p)))):null;
 const position=own.length&&enemy.length?(lead+opponent)/2:own.length?lead:enemy.length?opponent:LENGTH/2;
 const delta=previous&&match.time-previous.time>=4?position-previous.position:0;
 const risk=enemy.some(u=>u.p<=7),breakthrough=own.some(u=>u.p>=23);
 const incoming=match.transit.filter(u=>u.owner==='orange'&&u.lane===lane).length+own.filter(u=>u.moving&&u.p<position-2).length;
 const label=risk?'HQ bedroht':breakthrough?'Angriff am Gegner-HQ':contact!==null&&contact<5?(delta>.7?'Eigene Front rückt vor':delta<-.7?'Eigene Front weicht zurück':'Front im Gefecht'):own.length||enemy.length?'Truppen auf dem Weg':'Front noch offen';
 const next=match.players.orange.factories.reduce((n,f,i)=>{const c=match.players.orange.pending[i]||f;return n+(c?.lane===lane?UNITS[c.type].count:0);},0);
 return {lane,time:match.time,position:Math.max(0,Math.min(LENGTH,position)),delta,label,risk,incoming,next,contact};
}
