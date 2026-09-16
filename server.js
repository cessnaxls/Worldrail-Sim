import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
const app=express(), __dirname=path.dirname(fileURLToPath(import.meta.url));
const sources={
 train:'https://opengameart.org/sites/default/files/kenney_train-kit_0.zip',
 building:'https://opengameart.org/sites/default/files/kenney_building-kit.zip'
};
const cache=new Map();
app.get('/api/assets/:pack',async(req,res)=>{const url=sources[req.params.pack];if(!url)return res.status(404).send('Unknown pack');try{let b=cache.get(req.params.pack);if(!b){const r=await fetch(url,{headers:{'User-Agent':'WorldRail-Hmmsim/1.0'}});if(!r.ok)throw new Error('upstream '+r.status);b=Buffer.from(await r.arrayBuffer());cache.set(req.params.pack,b)}res.set({'Content-Type':'application/zip','Cache-Control':'public,max-age=86400'}).send(b)}catch(e){console.error(e);res.status(502).send('Asset source unavailable: '+e.message)}});
app.use(express.static(path.join(__dirname,'dist')));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'dist','index.html')));
app.listen(process.env.PORT||10000,'0.0.0.0',()=>console.log('WorldRail server ready'));
