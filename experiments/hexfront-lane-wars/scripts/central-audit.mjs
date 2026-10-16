import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Match} from '../src/match.js';
import {CentralAI,centralOpening} from '../src/central-ai.js';
import {CENTRAL_UNITS} from '../src/central-rules.js';
import {centralLate} from '../tests/fixtures/central-late.mjs';
import {UNITS} from '../src/rules.js';
export function run({a='pressure',b='siege',reactive=true,rules={},unitSpecs,limit=720,policy=null,orange=null,blue=null,aiOptions={},enemyOptions={}}={}){
 const m=new Match({mission:'central',orange:orange||centralOpening(a),blue:blue||centralOpening(b),rules,unitSpecs});
 m.controllers=[new CentralAI('orange',{strategy:a,reactive,...aiOptions}),new CentralAI('blue',{strategy:b,...enemyOptions})];m.start();
 const checkpoints=[];let still=0,longestStill=0,lastHQ=m.rules.hqHP*2,lastContact=15,oldest=0,old60=0,hqQuiet=0,maxHQQuiet=0;
 while(m.phase==='running'&&m.time<limit){
  policy?.(m);m.advance(1);m.drainEvents();
  const u=m.lanes[0].units,o=u.filter(x=>x.owner==='orange'),b=u.filter(x=>x.owner==='blue');
  const contact=o.length&&b.length?(Math.max(...o.map(x=>x.p))+Math.min(...b.map(x=>x.p)))/2:null;
  const hq=m.players.orange.hq+m.players.blue.hq;
  hqQuiet=m.time>120&&hq===lastHQ?hqQuiet+1:0;maxHQQuiet=Math.max(maxHQQuiet,hqQuiet);
  still=contact!==null&&Math.abs(contact-lastContact)<.3&&hq===lastHQ?still+1:0;
  longestStill=Math.max(longestStill,still);lastContact=contact??15;lastHQ=hq;
  oldest=Math.max(oldest,...u.map(x=>m.time-x.spawnTime));old60=Math.max(old60,u.filter(x=>m.time-x.spawnTime>60).length);
  if(m.tick%1200===0)checkpoints.push({time:m.time,hq:[m.players.orange.hq,m.players.blue.hq],units:u.length,front:contact,oldest:Math.max(0,...u.map(x=>m.time-x.spawnTime)),credits:[m.credits('orange'),m.credits('blue')]});
 }
 return {a,b,reactive,...m.summary(),longestStill,oldest,old60,maxHQQuiet,checkpoints,orders:m.orders};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const matches=[];
 for(const a of ['pressure','siege','economy'])for(const b of ['pressure','siege','economy'])if(a!==b)for(const reactive of [false,true])matches.push(run({a,b,reactive}));
 const controls=[];
 const legacy=Object.fromEntries(Object.entries(CENTRAL_UNITS).map(([id,s])=>[id,{...s,...UNITS[id]}]));
 for(const [label,opts] of [['legacy-combat-wave-hq',{rules:{wave:15,hqHP:1200,hqDamage:8,hqInterval:.8},unitSpecs:legacy}],['wave-25',{rules:{wave:25}}],['wave-15',{rules:{wave:15}}],['hq-10-dps',{rules:{hqDamage:8,hqInterval:.8}}],['mech-120hp',{unitSpecs:{...CENTRAL_UNITS,mech:{...CENTRAL_UNITS.mech,hp:120}}}],['rail-2.4s',{unitSpecs:{...CENTRAL_UNITS,rail:{...CENTRAL_UNITS.rail,interval:2.4}}}]]){
  for(const [a,b] of [['pressure','siege'],['pressure','economy'],['siege','economy']])controls.push({label,...run({a,b,...opts})});
 }
 const economics=[];
 for(const a of ['pressure','siege','economy'])for(const b of ['pressure','siege','economy'])for(const economyFirst of [false,true])economics.push({economyFirst,...run({a,b,aiOptions:{economyFirst}})});
 const late=[];
 for(const [initial,enemy,counter] of [['drone','mech','rail'],['mech','rail','drone'],['rail','drone','mech']])for(const reacts of [false,true])late.push({initial,enemy,counter,reacts,...centralLate({initial,enemy,counter,reacts})});
 const deliberate=[
  {initial:'mech',enemy:'rail',counter:'drone',supply:true,supplyAt:210,supplyType:'drone'},
  {initial:'drone',enemy:'mech',counter:'rail',supply:true,supplyAt:210,supplyType:'mech'}
 ].map(options=>({...options,...centralLate(options)}));
 const report={deliberate,generated:new Date().toISOString(),note:'Deterministic scripted probes, not human win rates. 720 s is a measurement cutoff, never an in-game end.',matches,controls,economics,late};
 const out=process.env.CENTRAL_AUDIT_OUTPUT||'docs/central-qa';await fs.mkdir(out,{recursive:true});await fs.writeFile(out+'/audit.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({matches:matches.map(({a,b,reactive,result,time,hq,maxHQQuiet})=>({a,b,reactive,result,time,hq,maxHQQuiet})),late:late.map(({initial,reacts,result,time,hq})=>({initial,reacts,result,time,hq})),economics:economics.map(({a,b,economyFirst,result,time})=>({a,b,economyFirst,result,time}))},null,2));
}
