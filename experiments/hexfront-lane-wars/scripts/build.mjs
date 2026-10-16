import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
// Only copy this variant's self-contained runtime and documentation.
await fs.mkdir(dist,{recursive:true});
for(const name of ['README.md','factory-preview.html','factory-preview.js','art/factory-v1','index.html','m15.html','lab.html','review.html','m21-review.html','src','vendor','public','docs'])await fs.cp(new URL(name,root),new URL(name,dist),{recursive:true});
console.log('Standalone static build written to dist/ (no sibling experiments or CDN).');
