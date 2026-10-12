// Generated, production-only copy for an isolated GitHub-backed preview.
// Publish this directory from a commit URL; never change the main Pages workflow.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import './build.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'dist'),output=path.join(root,'preview');
if(output!==path.resolve(root,'preview')||!output.startsWith(root+path.sep))throw Error('Unsafe preview output path');
const main=await fs.readFile(path.join(source,'src/main.js'),'utf8');
if(!main.includes('const ALLOW_QA = false;')||main.includes('const ALLOW_QA = true;'))throw Error('Preview must disable diagnostics');
await fs.rm(output,{recursive:true,force:true});
await fs.cp(source,output,{recursive:true});
console.log(`Static production preview prepared: ${output}`);
