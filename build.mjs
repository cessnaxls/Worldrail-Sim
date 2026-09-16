import fs from 'fs';
fs.rmSync('dist',{recursive:true,force:true});
fs.mkdirSync('dist/vendor',{recursive:true});
let html=fs.readFileSync('index.html','utf8')
 .replaceAll('/node_modules/leaflet/dist/leaflet.css','vendor/leaflet.css')
 .replaceAll('/node_modules/leaflet/dist/leaflet.js','vendor/leaflet.js')
 .replaceAll('/node_modules/jszip/dist/jszip.min.js','vendor/jszip.min.js');
fs.writeFileSync('dist/index.html',html);
fs.cpSync('public','dist',{recursive:true});
fs.copyFileSync('node_modules/leaflet/dist/leaflet.css','dist/vendor/leaflet.css');
fs.copyFileSync('node_modules/leaflet/dist/leaflet.js','dist/vendor/leaflet.js');
fs.cpSync('node_modules/leaflet/dist/images','dist/vendor/images',{recursive:true});
fs.copyFileSync('node_modules/jszip/dist/jszip.min.js','dist/vendor/jszip.min.js');
