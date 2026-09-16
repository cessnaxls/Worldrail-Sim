import fs from 'fs';
fs.rmSync('dist',{recursive:true,force:true});
fs.mkdirSync('dist',{recursive:true});
fs.cpSync('public','dist',{recursive:true});
fs.copyFileSync('index.html','dist/index.html');

const candidates=[
 'node_modules/babylonjs/babylon.js',
 'node_modules/babylonjs/babylon.max.js'
];
const source=candidates.find(fs.existsSync);
if(!source) throw new Error('BabylonJS browser bundle was not installed');
fs.copyFileSync(source,'dist/babylon.js');
console.log('WorldRail build complete; Babylon bundle:',source);
