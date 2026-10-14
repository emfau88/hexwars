import fs from 'node:fs/promises';
import {lateResponse} from '../tests/fixtures/late-response.mjs';
const cases=[];
for(const [initial,enemy,counter] of [['drone','mech','rail'],['mech','rail','drone'],['rail','drone','mech']])for(const reacts of [false,true])cases.push(lateResponse({initial,enemy,counter,reacts}));
cases.push(lateResponse({initial:'mech',enemy:'rail',counter:'drone',reacts:true,concentrate:true}));
await fs.writeFile(new URL('../docs/m2-late-response.json',import.meta.url),JSON.stringify({description:'Scripted paired probes. Identical start; opponent changes at 180s, visible at 195s; response at 200s. Supply repeats from 225s only in these test drivers, never automatically for a human.',cases},null,2));
for(const {initial,enemy,counter,reacts,result,time,hq} of cases)console.log(JSON.stringify({initial,enemy,counter,reacts,result,time,hq}));