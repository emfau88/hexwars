import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=process.argv.includes('--production')?path.join(project,'dist'):project;
const port=Number(process.env.PORT||4174),host=process.env.HOST||'127.0.0.1';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.gltf':'model/gltf+json','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
  try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),name=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
    if(!name.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    const data=await fs.readFile(name);res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,host,()=>console.log(`HEXFRONT 3D ${process.argv.includes('--production')?'production':'development'}: http://${host}:${port}`));
