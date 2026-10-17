import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'chromium'}),page=await browser.newPage();
try{
 await page.goto('http://127.0.0.1:4181/railgun-preview.html');
 await fs.mkdir('public/ui',{recursive:true});
 for(const [type,file] of [['drone','hoverbot'],['mech','mech'],['rail','railgun-animated/railgun']]){
  const png=await page.evaluate(async({file,type})=>{
   const T=await import('./vendor/three.module.min.js'),{GLTFLoader}=await import('./vendor/loaders/GLTFLoader.js'),{suppliedMaterial}=await import('./src/team-material.js');
   const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(168,168);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
   const scene=new T.Scene(),root=(await new GLTFLoader().loadAsync('./public/models/'+file+'.glb')).scene;scene.add(root);
   root.traverse(o=>{if(o.isMesh&&type!=='rail')o.material=suppliedMaterial(o.material,'orange');});
   scene.add(new T.HemisphereLight(0xf0f5ff,0x8d8876,1.8));const key=new T.DirectionalLight(0xffeedb,3.3);key.position.set(-3,6,-4);scene.add(key);const fill=new T.DirectionalLight(0xcde3ff,1.2);fill.position.set(4,2,1);scene.add(fill);
   const box=new T.Box3().setFromObject(root),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());root.position.sub(center);root.updateMatrixWorld(true);
   const camera=new T.OrthographicCamera(-1,1,1,-1,.01,1000),d=size.length();camera.position.set(-.7*d,.5*d,-d);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
   const pts=[];const world=new T.Box3().setFromObject(root);for(const x of [world.min.x,world.max.x])for(const y of [world.min.y,world.max.y])for(const z of [world.min.z,world.max.z])pts.push(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
   const extent=Math.max(...pts.map(p=>Math.abs(p.x)),...pts.map(p=>Math.abs(p.y)))*1.07;Object.assign(camera,{left:-extent,right:extent,top:extent,bottom:-extent});camera.updateProjectionMatrix();renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');renderer.dispose();return url.split(',')[1];
  },{file,type});
  await fs.writeFile('public/ui/'+type+'.png',Buffer.from(png,'base64'));
 }
}finally{await browser.close();}
console.log('Three HUD portraits rendered from the existing GLBs.');
