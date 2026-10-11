import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
await fs.mkdir(out,{recursive:true});
for(const name of ['index.html','src','public','vendor'])await fs.cp(path.join(root,name),path.join(out,name),{recursive:true});
const main=path.join(out,'src/main.js');await fs.writeFile(main,(await fs.readFile(main,'utf8')).replace('const ALLOW_QA = true;','const ALLOW_QA = false;'));
const files=[];async function scan(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await scan(p);else{const bytes=await fs.readFile(p);files.push({path:path.relative(out,p).replaceAll('\\','/'),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});if(e.name.endsWith('.gltf')){const model=JSON.parse(bytes);for(const ref of [...(model.buffers||[]),...(model.images||[])])if(ref.uri&&!ref.uri.startsWith('data:'))await fs.access(path.resolve(path.dirname(p),ref.uri));}}}}
await scan(out);console.log(`Production build verified: ${files.length} files, ${(files.reduce((n,f)=>n+f.bytes,0)/1024/1024).toFixed(2)} MiB. QA API disabled. Output: ${out}`);
