const http=require('http'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'public'),port=process.env.PORT||3000;
http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';
let f=u==='/vendor/babylon.js'?path.join(__dirname,'node_modules','babylonjs','babylon.js'):path.normalize(path.join(base,u));if(!f.startsWith(base)){res.writeHead(403);return res.end()}
fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('404')}
let t={'.html':'text/html','.js':'application/javascript','.css':'text/css'}[path.extname(f)]||'application/octet-stream';
res.writeHead(200,{'Content-Type':t,'Cache-Control':'no-cache'});res.end(d)})}).listen(port,()=>console.log('Racer slice '+port));