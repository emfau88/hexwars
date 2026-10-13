import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import './build.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const preview=path.resolve(root,'preview'),built=path.join(root,'dist/hexfront-mixed-squads');
if(preview!==path.join(root,'preview')||!preview.startsWith(root+path.sep))throw Error('Unsafe preview directory');
await fs.rm(preview,{recursive:true,force:true});
await fs.cp(built,preview,{recursive:true});
// The committed preview reuses immutable sibling assets at the same Git SHA.
// It is one level deeper than the normal source/build entry, so adjust only
// those sibling references. No shared variant files are written.
const html=path.join(preview,'index.html');
await fs.writeFile(html,(await fs.readFile(html,'utf8')).replaceAll('../hexfront-3d/','../../hexfront-3d/'));
for(const name of await fs.readdir(path.join(preview,'src'))){
 if(!name.endsWith('.js'))continue;
 const file=path.join(preview,'src',name);
 await fs.writeFile(file,(await fs.readFile(file,'utf8')).replaceAll('../../hexfront-3d/','../../../hexfront-3d/'));
}
if((await fs.readFile(path.join(preview,'src/main.js'),'utf8')).includes('const ALLOW_QA = true;'))throw Error('Preview QA guard enabled');
console.log('Branch preview packaged with QA disabled: '+preview);
