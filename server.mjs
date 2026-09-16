import http from 'http';import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const base=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.wav':'audio/wav','.csv':'text/plain'};
http.createServer((req,res)=>{if(req.url==='/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,build:'BOOT_FIX_V3'}))}let u=decodeURIComponent(req.url.split('?')[0]);if(u==='/')u='/index.html';let f=path.normalize(path.join(base,u));
if(!f.startsWith(base)){res.writeHead(403);return res.end('Forbidden')}
fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('Not found');return}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control',u==='/index.html'?'no-cache':'public,max-age=3600');res.end(d)})}).listen(process.env.PORT||10000,'0.0.0.0',()=>console.log('WorldRail ready'));
