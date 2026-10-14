import fs from 'node:fs/promises';import {lateResponse} from '../tests/fixtures/late-response.mjs';
const cases=[];for(const [initial,enemy,counter] of [['drone','mech','rail'],['mech','rail','drone'],['rail','drone','mech']])for(const reacts of [false,true])cases.push(lateResponse({mission:'meadow',initial,enemy,counter,reacts,budget:720}));
cases.push(lateResponse({mission:'meadow',initial:'mech',enemy:'rail',counter:'drone',reacts:true,concentrate:true,budget:720}));
await fs.writeFile(new URL('../docs/m21-qa/late-response.json',import.meta.url),JSON.stringify({description:'Paired complete campaign matches: opponent orders at 180 s, visible at wave 195, player may respond at 200. Identical prior state. All purchases paid. Measurement cutoff 720 s, never a win.',cases},null,2));
for(const {initial,enemy,counter,reacts,concentrate,result,time,hq} of cases)console.log(JSON.stringify({initial,enemy,counter,reacts,concentrate,result,time,hq}));
