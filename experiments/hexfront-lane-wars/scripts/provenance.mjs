import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),files=[];
async function walk(relative){for(const entry of await fs.readdir(new URL(relative,root),{withFileTypes:true})){const file=`${relative}${entry.name}`;if(entry.isDirectory())await walk(file+'/');else {const bytes=await fs.readFile(new URL(file,root));files.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}
for(const directory of ['public/','vendor/','docs/reference/'])await walk(directory);
await fs.writeFile(new URL('docs/asset-manifest.json',root),JSON.stringify({date:'2026-10-14',reference:'HEXFRONT Mixed Squads / HEXFRONT 3D, existing local files at f187bc3; notices retained',files},null,2));
console.log(`Recorded ${files.length} local asset/reference files.`);
