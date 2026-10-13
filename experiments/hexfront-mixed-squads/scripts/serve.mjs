import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const production=process.argv.includes('--production'),root=production?path.join(project,'dist'):path.dirname(project);
const port=Number(process.env.PORT||4176),host=process.env.HOST||'127.0.0.1';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.bin':'application/octet-stream','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/'){res.writeHead(302,{Location:'/hexfront-mixed-squads/'});res.end();return;}
    if(!['/hexfront-mixed-squads/','/hexfront-3d/'].some(prefix=>pathname.startsWith(prefix)))throw Error('Invalid variant');
    const name=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
    if(!name.startsWith(root+path.sep))throw Error('Invalid path');
    const data=await fs.readFile(name);res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(port,host,()=>console.log(`HEXFRONT Mixed Squads ${production?'production':'development'}: http://${host}:${port}/hexfront-mixed-squads/`));
