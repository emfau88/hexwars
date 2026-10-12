// Real mouse or Chromium touch input; no direct command/state hooks.
export const nextFrame=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
export async function dragDriver(page,context,mobile){
  const cdp=mobile?await context.newCDPSession(page):null;
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
  return {
    async begin(p){if(mobile)await touch('touchStart',[{...p,id:1}]);else{await page.mouse.move(p.x,p.y);await page.mouse.down();}},
    async move(p){if(mobile)await touch('touchMove',[{...p,id:1}]);else await page.mouse.move(p.x,p.y,{steps:4});await nextFrame(page);},
    async end(){if(mobile)await touch('touchEnd',[]);else await page.mouse.up();await nextFrame(page);},
    async cancel(){if(mobile)await touch('touchCancel',[]);else{await page.keyboard.press('Escape');await page.mouse.up();}await nextFrame(page);},
    touch,
    async close(){await cdp?.detach();}
  };
}
export async function center(page,selector){const b=await page.locator(selector).boundingBox();if(!b)throw Error(`Missing input target ${selector}`);return {x:b.x+b.width/2,y:b.y+b.height/2};}
export async function dragOrder(page,driver,from,to,during){
  const a=await center(page,`[data-cell="${from}"]`);
  await driver.begin(a);await driver.move({x:a.x+10,y:a.y});
  await driver.move(await center(page,`[data-cell="${to}"]`));
  await during?.();await driver.end();
}
