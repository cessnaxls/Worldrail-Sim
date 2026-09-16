(() => {
const canvas=document.getElementById('driveCanvas');
let engine,scene,camera,running=false,speed=0,throttle=0,brake=0,pos=0,last=0,trainRoot=null,camMode=0;
let fpsEl=null,scale=1.65,frameAccum=0,frameCount=0,qualityClock=0;
const $=id=>document.getElementById(id);
const driveView=$('driveView'), throttleFill=$('throttleFill'), brakeFill=$('brakeFill'),
      hornBtn=$('hornBtn'), emergencyBtn=$('emergencyBtn'), doorsBtn=$('doorsBtn'), camBtn=$('camBtn');
const H={speed:$('dSpeed'),limit:$('dLimit'),next:$('dNext'),signal:$('dSignal'),clock:$('dClock'),power:$('dPower')};
const SEG=240, AHEAD=6, BEHIND=2; let segments=new Map();
function mat(name,color){let m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.specularColor=new BABYLON.Color3(.08,.08,.08);return m}
function mkScene(){
 if(!window.BABYLON){
   throw new Error('Babylon.js did not load. Check network/CDN access and reload.');
 }
 engine=new BABYLON.Engine(canvas,false,{preserveDrawingBuffer:false,stencil:false,antialias:false,powerPreference:'high-performance'},true);
 engine.setHardwareScalingLevel(scale); engine.doNotHandleContextLost=false;
 scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(.57,.71,.84,1);scene.autoClear=true;
 scene.fogMode=BABYLON.Scene.FOGMODE_LINEAR;scene.fogStart=150;scene.fogEnd=620;scene.fogColor=new BABYLON.Color3(.57,.71,.84);
 scene.skipPointerMovePicking=true;scene.constantlyUpdateMeshUnderPointer=false;
 new BABYLON.HemisphericLight('sky',new BABYLON.Vector3(0,1,0),scene).intensity=.92;
 let sun=new BABYLON.DirectionalLight('sun',new BABYLON.Vector3(-.35,-1,.25),scene);sun.intensity=.75;
 camera=new BABYLON.UniversalCamera('cab',new BABYLON.Vector3(0,2.75,0),scene);camera.minZ=.15;camera.maxZ=700;camera.fov=.92;
 // Reusable low-draw-call materials/textures.
 let gm=mat('grass','#607a45');gm.diffuseTexture=new BABYLON.Texture('assets/real3d/textures/grass.png',scene,false,false,BABYLON.Texture.BILINEAR_SAMPLINGMODE);gm.diffuseTexture.uScale=24;gm.diffuseTexture.vScale=24;
 let ballast=mat('ballast','#77736b');ballast.diffuseTexture=new BABYLON.Texture('assets/real3d/textures/ballast.png',scene,false,false,BABYLON.Texture.BILINEAR_SAMPLINGMODE);ballast.diffuseTexture.uScale=2;ballast.diffuseTexture.vScale=20;
 const rail=mat('rail','#686d70'), tie=mat('tie','#514435'), asphalt=mat('road','#444645'), concrete=mat('concrete','#858681'), brick=mat('brick','#815848'), leaf=mat('leaf','#416337'), trunk=mat('trunk','#574536');
 function seg(k){
   if(segments.has(k))return; let z0=k*SEG, root=new BABYLON.TransformNode('seg'+k,scene);segments.set(k,root);
   let g=BABYLON.MeshBuilder.CreateGround('g',{width:90,height:SEG},scene);g.position.z=z0+SEG/2;g.material=gm;g.parent=root;g.freezeWorldMatrix();
   let bed=BABYLON.MeshBuilder.CreateBox('bed',{width:4.4,height:.22,depth:SEG},scene);bed.position.set(0,.10,z0+SEG/2);bed.material=ballast;bed.parent=root;bed.freezeWorldMatrix();
   // Rails are continuous meshes: 2 draw calls per segment.
   for(const x of [-.7175,.7175]){let r=BABYLON.MeshBuilder.CreateBox('rail',{width:.075,height:.16,depth:SEG},scene);r.position.set(x,.32,z0+SEG/2);r.material=rail;r.parent=root;r.freezeWorldMatrix()}
   // Sleepers merged into one mesh per segment, not 400 separate draw calls.
   let ties=[];for(let z=1;z<SEG;z+=.72){let t=BABYLON.MeshBuilder.CreateBox('t',{width:2.55,height:.15,depth:.23},scene);t.position.set(0,.20,z0+z);ties.push(t)}
   let tm=BABYLON.Mesh.MergeMeshes(ties,true,true,undefined,false,true);tm.material=tie;tm.parent=root;tm.freezeWorldMatrix();
   // Roads + buildings: merged by material into a handful of meshes.
   let bs=[], rs=[];for(let j=0;j<12;j++){let side=j%2?1:-1,x=side*(9+(j%4)*6),zz=z0+12+j*18;let h=5+(j%5)*2.2;
      let b=BABYLON.MeshBuilder.CreateBox('b',{width:5+(j%3)*2,height:h,depth:6+(j%2)*2},scene);b.position.set(x,h/2,zz);bs.push(b);
      if(j%4===0){let rd=BABYLON.MeshBuilder.CreateBox('rd',{width:24,height:.035,depth:5},scene);rd.position.set(0,.13,zz+5);rs.push(rd)}
   }
   let bm=BABYLON.Mesh.MergeMeshes(bs,true,true);bm.material=(k%2?brick:concrete);bm.parent=root;bm.freezeWorldMatrix();
   if(rs.length){let rm=BABYLON.Mesh.MergeMeshes(rs,true,true);rm.material=asphalt;rm.parent=root;rm.freezeWorldMatrix()}
   // Trees use thin instances: one trunk mesh + one crown mesh for every tree in the segment.
   let tr=BABYLON.MeshBuilder.CreateCylinder('trunk',{height:3,diameter:.28,tessellation:7},scene);tr.material=trunk;tr.parent=root;tr.isVisible=false;
   let cr=BABYLON.MeshBuilder.CreateIcoSphere('crown',{radius:1.35,subdivisions:1},scene);cr.material=leaf;cr.parent=root;cr.isVisible=false;
   let mt=[],mc=[];for(let j=0;j<18;j++){let side=j%2?1:-1,x=side*(7+(j%6)*4),zz=z0+5+j*13;let m=BABYLON.Matrix.Translation(x,1.5,zz);mt.push(...m.toArray());let c=BABYLON.Matrix.Translation(x,3.7,zz);mc.push(...c.toArray())}
   tr.thinInstanceSetBuffer('matrix',new Float32Array(mt),16);cr.thinInstanceSetBuffer('matrix',new Float32Array(mc),16);tr.isVisible=true;cr.isVisible=true;
 }
 function stream(){let c=Math.floor(pos/SEG);for(let k=c-BEHIND;k<=c+AHEAD;k++)seg(k);for(const [k,r] of [...segments])if(k<c-BEHIND-1||k>c+AHEAD+1){r.getChildMeshes().forEach(m=>m.dispose());r.dispose();segments.delete(k)}}
 stream();
 // Train is only loaded for chase/exterior views; cab starts without rendering the whole car.
 BABYLON.SceneLoader.ImportMeshAsync('','assets/real3d/','WorldRail_WR20_Custom_Metro.glb',scene).then(r=>{trainRoot=new BABYLON.TransformNode('train',scene);r.meshes.forEach(m=>{if(m.parent==null)m.parent=trainRoot;m.setEnabled(false)});trainRoot.rotation.y=Math.PI/2});
 fpsEl=document.createElement('div');fpsEl.style.cssText='position:absolute;right:12px;top:58px;background:#0009;color:#bdf7c7;padding:5px 8px;border-radius:6px;font:12px monospace;z-index:20';fpsEl.textContent='FPS --';driveView.appendChild(fpsEl);
 scene.onAfterRenderObservable.addOnce(()=>{let b=document.getElementById('driveBoot');if(b)b.style.display='none'});
 return scene;
 }
 function setTrainVisible(v){if(!trainRoot)return;trainRoot.getChildMeshes().forEach(m=>m.setEnabled(v))}
 function lever(el,kind){const f=e=>{e.preventDefault();let r=el.getBoundingClientRect(),y=e.clientY??e.touches?.[0]?.clientY;let v=Math.max(0,Math.min(1,1-(y-r.top)/r.height));if(kind==='t'){throttle=v;if(v>.04)brake=0;throttleFill.style.height=v*100+'%'}else{brake=v;if(v>.04)throttle=0;brakeFill.style.height=v*100+'%'}};el.onpointerdown=e=>{el.setPointerCapture(e.pointerId);f(e)};el.onpointermove=e=>{if(e.buttons)f(e)}}
 lever(document.getElementById('throttle'),'t');lever(document.getElementById('brake'),'b');
 hornBtn.onpointerdown=()=>new Audio('audio/horn.wav').play().catch(()=>{}); emergencyBtn.onclick=()=>{throttle=0;brake=1;throttleFill.style.height='0%';brakeFill.style.height='100%'};
 doorsBtn.onclick=()=>{if(speed<.3)new Audio('audio/door_chime.wav').play().catch(()=>{})};
 camBtn.onclick=()=>{camMode=(camMode+1)%2;setTrainVisible(camMode===1);camBtn.textContent=camMode?'CHASE':'CAB'};
 function tick(){let now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;if(!running)return;
   let a=throttle*.85-brake*1.5-.012*speed;speed=Math.max(0,Math.min(30,speed+a*dt));pos+=speed*dt;stream();
   if(camMode===0){camera.position.set(0,2.72,pos+1);camera.setTarget(new BABYLON.Vector3(0,2.0,pos+85))}
   else{if(trainRoot)trainRoot.position.set(0,0,pos+8);camera.position.set(7,5.2,pos-15);camera.setTarget(new BABYLON.Vector3(0,1.8,pos+8))}
   H.speed.textContent=Math.round(speed*3.6);H.limit.textContent=pos%900>720?40:80;H.signal.textContent=pos%1250>1080?'YELLOW':'GREEN';H.next.textContent='Next station '+Math.max(0,((900-pos%900)/1000)).toFixed(1)+' km';H.power.textContent='P'+Math.round(throttle*4)+' / B'+Math.round(brake*5);
   frameCount++;frameAccum+=dt;qualityClock+=dt;if(frameAccum>=1){let fps=frameCount/frameAccum;fpsEl.textContent='FPS '+fps.toFixed(0)+'  '+(1/scale*100).toFixed(0)+'%';frameCount=0;frameAccum=0;
      // iPad dynamic resolution: target 30–40 FPS, favor 36 FPS center.
      if(qualityClock>2.5){if(fps<30&&scale<2.35){scale+=.12;engine.setHardwareScalingLevel(scale)}else if(fps>42&&scale>1.25){scale-=.08;engine.setHardwareScalingLevel(scale)}qualityClock=0}}
 }
 let loopStarted=false;
function showDriveError(err){
  console.error(err);
  let old=document.getElementById('driveError'); if(old) old.remove();
  let e=document.createElement('div');e.id='driveError';
  e.style.cssText='position:absolute;inset:70px 18px auto 18px;background:#181b20;color:white;border:1px solid #e35b5b;border-radius:10px;padding:14px;z-index:999;font:13px -apple-system,BlinkMacSystemFont,sans-serif;line-height:1.4';
  e.innerHTML='<b>3D renderer could not start</b><br>'+String(err&&err.message?err.message:err)+'<br><small>WorldRail now reports the error instead of leaving a black screen.</small>';
  driveView.appendChild(e);
}
window.WorldRailDrive={
 start(){
   driveView.classList.add('open');running=true;
   try{
     if(!scene)mkScene();
     last=performance.now();
     if(!loopStarted){engine.runRenderLoop(()=>{if(scene){tick();scene.render()}});loopStarted=true}
     setTimeout(()=>engine.resize(),60);
   }catch(err){running=false;showDriveError(err)}
 },
 stop(){running=false;driveView.classList.remove('open')}
};
 addEventListener('resize',()=>engine?.resize());
})();
