const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'public'),port=process.env.PORT||3000;
http.createServer((req,res)=>{let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
p=path.join(root,p); if(!p.startsWith(root)){res.writeHead(403);return res.end()}
fs.readFile(p,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found')}
let ext=path.extname(p);let t={'.html':'text/html','.js':'application/javascript','.css':'text/css'}[ext]||'application/octet-stream';
res.writeHead(200,{'Content-Type':t,'Cache-Control':'no-cache'});res.end(d)})}).listen(port,()=>console.log('Indy Random Racer on '+port));