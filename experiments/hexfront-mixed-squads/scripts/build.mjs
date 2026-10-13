import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist'),base=path.join(root,'../hexfront-3d');
if(out!==path.resolve(root,'dist')||!out.startsWith(root+path.sep))throw Error('Unsafe output directory');
await fs.rm(out,{recursive:true,force:true});
for(const [dir,names] of [[root,['index.html','src']],[base,['src','public','vendor']]])for(const name of names) {
  await fs.cp(path.join(dir,name),path.join(out,path.basename(dir),name),{recursive:true});
}
const main=path.join(out,'hexfront-mixed-squads/src/main.js');
const source=await fs.readFile(main,'utf8');if(!source.includes('const ALLOW_QA = true;'))throw Error('QA guard missing');
await fs.writeFile(main,source.replace('const ALLOW_QA = true;','const ALLOW_QA = false;'));
// The immutable original runtime is only copied for shared modules/assets.
// Disable its QA guard as well, and do not ship its old main entry point.
await fs.rm(path.join(out,'hexfront-3d/src/main.js'));
await fs.writeFile(path.join(out,'index.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./hexfront-mixed-squads/"><a href="./hexfront-mixed-squads/">HEXFRONT Mixed Squads öffnen</a>');
console.log(`Production build: ${out}. QA disabled; original source untouched.`);
