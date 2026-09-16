const express=require('express');const app=express();app.use(express.static('public'));app.get('/health',(q,s)=>s.json({ok:true}));app.listen(process.env.PORT||3000,'0.0.0.0');
