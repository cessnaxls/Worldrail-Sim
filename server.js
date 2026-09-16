import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
const app=express(), __dirname=path.dirname(fileURLToPath(import.meta.url));
const sources={
 train:['https://opengameart.org/sites/default/files/kenney_train-kit_0.zip'],
 building:['https://opengameart.org/sites/default/files/kenney_building-kit.zip']
};
const cache=new Map();
async function getPack(name){if(cache.has(name))return cache.get(name);let last;for(const url of sources[name]||[]){for(let attempt=0;attempt<3;attempt++){try{const c=new AbortController();const t=setTimeout(()=>c.abort(),30000);const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 WorldRail/1.1','Accept':'application/zip,*/*'},redirect:'follow',signal:c.signal});clearTimeout(t);if(!r.ok)throw new Error('upstream '+r.status);const b=Buffer.from(await r.arrayBuffer());if(b.length<1000)throw new Error('asset archive unexpectedly small');cache.set(name,b);return b}catch(e){last=e;await new Promise(r=>setTimeout(r,700*(attempt+1)))}}}throw last||new Error('asset source unavailable')}
app.get('/api/assets/:pack',async(req,res)=>{if(!sources[req.params.pack])return res.status(404).send('Unknown pack');try{const b=await getPack(req.params.pack);res.set({'Content-Type':'application/zip','Content-Length':String(b.length),'Cache-Control':'public,max-age=86400'}).send(b)}catch(e){console.error(req.params.pack,e);res.status(502).send('Asset source unavailable: '+e.message)}});
app.get('/api/assets-status',async(req,res)=>{const out={};for(const k of Object.keys(sources)){try{const b=await getPack(k);out[k]={ok:true,bytes:b.length}}catch(e){out[k]={ok:false,error:e.message}}}res.json(out)});
app.use(express.static(path.join(__dirname,'dist')));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'dist','index.html')));
app.listen(process.env.PORT||10000,'0.0.0.0',()=>console.log('WorldRail server ready'));
