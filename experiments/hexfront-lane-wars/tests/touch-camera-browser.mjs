import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium} from '@playwright/test';
const base=process.env.MATCH_URL||'http://127.0.0.1:4181/',out=process.env.TOUCH_QA_OUTPUT||'docs/mobile-touch/';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium'}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await context.newPage(),cdp=await context.newCDPSession(p),errors=[],checks=[],layouts=[];
p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
const diag=()=>p.evaluate(()=>__LANE_MATCH__.diagnostics()),state=()=>p.evaluate(()=>__LANE_MATCH__.snapshot());
async function touch(type,points){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:5,radiusY:5,force:1}))});}
async function pinch(from,to,cancel=false){await touch('touchStart',from);for(let i=1;i<=8;i++){const k=i/8;await touch('touchMove',from.map(([id,x,y],j)=>[id,x+(to[j][1]-x)*k,y+(to[j][2]-y)*k]));}await touch(cancel?'touchCancel':'touchEnd',[]);await p.waitForTimeout(120);}
try{
 await p.goto(base+'index.html?qa=1',{timeout:120000});const gate=p.getByText('Open the page',{exact:true});if(await gate.count())await gate.click();await p.waitForFunction(()=>window.__LANE_MATCH_QA__,null,{timeout:120000});
 await p.evaluate(async()=>{await __LANE_MATCH_QA__.load('central');__LANE_MATCH_QA__.advance(80);});
 assert.equal(await p.locator('#fronts').isVisible(),false);assert.equal(await p.locator('#mobile-supply #supply-units').count(),1);
 const before=await state(),start=await diag(),cx=160,cy=380;
 await pinch([[1,cx-35,cy],[2,cx+35,cy]],[[1,cx-70,cy],[2,cx+70,cy]]);const zoomed=await diag();assert.ok(Math.abs(zoomed.zoom-2)<.03,JSON.stringify(zoomed.zoom));
 const anchor=start.laneTargets[0],end=zoomed.laneTargets[0];assert.ok(Math.hypot(end.x-(cx+2*(anchor.x-cx)),end.y-(cy+2*(anchor.y-cy)))<2,'Pinch anchor '+JSON.stringify({anchor,end,zoom:zoomed.zoom,scale:start.scale,newScale:zoomed.scale,cx,cy}));
 assert.deepEqual(await state(),before);assert.equal(await p.locator('#orders').isVisible(),false);assert.equal(await p.locator('#selection').isVisible(),false);await p.screenshot({path:out+'pinch-390x844.png'});
 await pinch([[1,70,380],[2,250,380]],[[1,130,380],[2,190,380]]);assert.equal((await diag()).zoom,1);
 await pinch([[1,150,380],[2,170,380]],[[1,60,380],[2,260,380]]);assert.equal((await diag()).zoom,3.2);
 // Lift one finger and continue panning with the other: no jump or accidental tap.
 await touch('touchStart',[[1,120,380],[2,200,380]]);await touch('touchMove',[[1,110,380],[2,210,380]]);await touch('touchEnd',[[1,110,380]]);await touch('touchMove',[[1,130,400]]);await touch('touchEnd',[]);assert.equal(await p.locator('#orders').isVisible(),false);assert.deepEqual(await state(),before);
 await pinch([[1,80,380],[2,240,380]],[[1,120,380],[2,200,380]],true);await pinch([[1,80,380],[2,240,380]],[[1,120,380],[2,200,380]]);assert.ok((await diag()).zoom<2);assert.deepEqual(await state(),before);
 checks.push('Real browser touch events: midpoint-anchored pinch in/out, 1–3.2 limits, one-finger continuation, cancellation recovery, no selection or simulation mutation');
 // Pending reinforcement cannot be dispatched by a two-finger camera gesture.
 await p.evaluate(async()=>{await __LANE_MATCH_QA__.load('meadow');__LANE_MATCH_QA__.advance(80);});await p.locator('#supply-units [data-type="mech"]').tap();const queued=await state();await pinch([[1,125,380],[2,205,380]],[[1,100,380],[2,230,380]]);assert.deepEqual(await state(),queued);await p.locator('[data-supply-lane="1"]').tap();assert.equal((await p.evaluate(()=>__LANE_MATCH__.observe())).supplyCooldown,15);checks.push('Two-lane supply remains available with explicit West/East buttons; pinch never dispatches selected supply');
 for(const [width,height] of [[390,844],[320,568],[360,640],[412,915],[844,390],[1440,960]]){
  await p.setViewportSize({width,height});await p.evaluate(async()=>{await __LANE_MATCH_QA__.load('central');__LANE_MATCH_QA__.advance(80);});if(await p.locator('#hint').isVisible())await p.locator('#close-hint').click();await p.waitForTimeout(150);
  const mobile=width<=760||(width<=1000&&height<=500);assert.equal(await p.locator('#fronts').isVisible(),!mobile);assert.equal(await p.locator('#mobile-supply #supply-units').count(),mobile?1:0);
  const layout=await p.evaluate(()=>{const rect=e=>e.getBoundingClientRect(),deck=rect(document.querySelector('#command-deck')),header=rect(document.querySelector('.game-top')),supply=rect(document.querySelector('.supply-tray'));const buttons=[...document.querySelectorAll('.factory-open,#supply-units button,#economy')].filter(b=>b.getClientRects().length).map(b=>{const r=rect(b);return {text:b.textContent,...r.toJSON(),hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});return {width:innerWidth,height:innerHeight,deckHeight:deck.height,clearFraction:(deck.top-header.bottom)/innerHeight,supply:supply.toJSON(),overflow:document.documentElement.scrollWidth>innerWidth,buttons};});
  layouts.push(layout);assert.equal(layout.overflow,false);assert.ok(layout.buttons.every(b=>b.width>=44&&b.height>=44&&b.hit&&b.left>=0&&b.right<=width&&b.top>=0&&b.bottom<=height),JSON.stringify(layout));
  if(mobile){assert.ok(layout.supply.right<=width&&layout.supply.top>70&&layout.supply.bottom<height-layout.deckHeight);assert.ok(layout.deckHeight<90);}
  await p.screenshot({path:out+'central-'+width+'x'+height+'.png'});
  await p.locator('#factory-cards [data-edit="0"]').click();await p.locator('#factory-type').selectOption('drone');await p.locator('#apply-factory').click();assert.equal((await p.evaluate(()=>__LANE_MATCH__.observe())).pending[0].type,'drone');
  await p.locator('#factory-cards [data-edit="0"]').click();await p.locator('#cancel-order').click();await p.locator('#economy').click();assert.equal(await p.locator('#economy').isVisible(),false);await p.locator('#supply-units [data-type="rail"]').click();assert.equal((await p.evaluate(()=>__LANE_MATCH__.observe())).supplyCooldown,30);
 }
 checks.push('Six sizes including portrait and landscape: visible touch-sized sidebar controls, build/cancel/economy/supply, desktop layout restored on resize');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'results.json',JSON.stringify({base,checks,layouts,errors},null,2));console.log(JSON.stringify({checks,layouts:layouts.map(({buttons,...r})=>r),errors},null,2));
}finally{await browser.close();}
