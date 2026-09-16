
(() => {
const canvas=document.getElementById('driveCanvas');
let engine,scene,trainRoot,camera,running=false,speed=0,throttle=0,brake=0,pos=0,last=0;
const H={speed:dSpeed,limit:dLimit,next:dNext,signal:dSignal,clock:dClock,power:dPower};
function mkScene(){
 engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:false,antialias:true},true);
 engine.setHardwareScalingLevel(Math.max(1,Math.min(2,window.devicePixelRatio||1)));
 scene=new BABYLON.Scene(engine); scene.clearColor=new BABYLON.Color4(.56,.70,.82,1);
 scene.fogMode=BABYLON.Scene.FOGMODE_LINEAR;scene.fogStart=180;scene.fogEnd=900;scene.fogColor=new BABYLON.Color3(.56,.70,.82);
 const sun=new BABYLON.DirectionalLight("sun",new BABYLON.Vector3(-.4,-1,.25),scene);sun.intensity=2.0;
 new BABYLON.HemisphericLight("sky",new BABYLON.Vector3(0,1,0),scene).intensity=.65;
 camera=new BABYLON.UniversalCamera("cab",new BABYLON.Vector3(0,3.0,-1),scene);camera.minZ=.05;camera.maxZ=1600;camera.fov=.95;
 // textured ground
 let ground=BABYLON.MeshBuilder.CreateGround("ground",{width:1000,height:4000},scene);
 let gm=new BABYLON.StandardMaterial("groundmat",scene);gm.diffuseTexture=new BABYLON.Texture("assets/real3d/textures/grass.png",scene);gm.diffuseTexture.uScale=80;gm.diffuseTexture.vScale=320;ground.material=gm;
 // Load actual hero track, train and full 520-object GLB library.
 BABYLON.SceneLoader.ImportMeshAsync("","assets/real3d/","WorldRail_realistic_50m_track.glb",scene).then(r=>{
   const root=new BABYLON.TransformNode("trackRoot",scene);r.meshes.forEach(m=>{if(m.parent==null)m.parent=root});root.position.z=25;
   for(let k=1;k<28;k++){let c=root.clone("track_"+k);c.position.z=25+k*50;}
 });
 BABYLON.SceneLoader.ImportMeshAsync("","assets/real3d/","WorldRail_WR20_Custom_Metro.glb",scene).then(r=>{
   trainRoot=new BABYLON.TransformNode("playerTrain",scene);r.meshes.forEach(m=>{if(m.parent==null)m.parent=trainRoot});trainRoot.rotation.y=Math.PI/2;trainRoot.position=new BABYLON.Vector3(0,0,-8);
 });
 // Library is genuinely loaded into graphics engine; selected assets are enabled/positioned as scenery.
 BABYLON.SceneLoader.ImportMeshAsync("","assets/real3d/","worldrail_520_assets.glb",scene).then(r=>{
   let roots=r.meshes.filter(m=>m.name && /^A\d{3}_/.test(m.name));
   // Library source meshes are hidden; clone representative modeled meshes into corridor.
   r.meshes.forEach(m=>m.setEnabled(false));
   const usable=r.meshes.filter(m=>m.getTotalVertices && m.getTotalVertices()>0);
   for(let k=0;k<150;k++){
     let src=usable[(k*37)%usable.length]; let c=src.clone("scenery_"+k); if(!c)continue;
     c.setEnabled(true); c.parent=null; c.position=new BABYLON.Vector3((k%2?1:-1)*(8+(k%5)*3),0,18+k*9); c.rotation.y=(k%7)*.15;
   }
   console.log("WorldRail 520-object GLB loaded:",r.meshes.length,"meshes");
 });
 return scene;
}
function lever(el,kind){const f=e=>{e.preventDefault();let r=el.getBoundingClientRect(),y=e.clientY??e.touches?.[0]?.clientY;let v=Math.max(0,Math.min(1,1-(y-r.top)/r.height));if(kind==="t"){throttle=v;if(v>.04)brake=0;throttleFill.style.height=v*100+"%"}else{brake=v;if(v>.04)throttle=0;brakeFill.style.height=v*100+"%"}};el.onpointerdown=e=>{el.setPointerCapture(e.pointerId);f(e)};el.onpointermove=e=>{if(e.buttons)f(e)}}
lever(document.getElementById("throttle"),"t");lever(document.getElementById("brake"),"b");
hornBtn.onpointerdown=()=>new Audio("audio/horn.wav").play().catch(()=>{});
emergencyBtn.onclick=()=>{throttle=0;brake=1;throttleFill.style.height="0%";brakeFill.style.height="100%"};
doorsBtn.onclick=()=>{if(speed<.3)new Audio("audio/door_chime.wav").play().catch(()=>{})};
camBtn.onclick=()=>{camera.position.y=camera.position.y<4?7:3;camBtn.textContent=camera.position.y>4?"CHASE":"CAB"};
window.WorldRailDrive={
 start(){driveView.classList.add("open");running=true;if(!scene)mkScene();last=performance.now();
   engine.runRenderLoop(()=>{let now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
     if(running){let a=throttle*.85-brake*1.5-.012*speed;speed=Math.max(0,Math.min(30,speed+a*dt));pos+=speed*dt;
       camera.position.z=pos; camera.position.x=Math.sin(pos/430)*1.5;camera.setTarget(new BABYLON.Vector3(camera.position.x,2.0,pos+80));
       H.speed.textContent=Math.round(speed*3.6);H.limit.textContent=pos%900>720?40:80;H.signal.textContent=pos%1250>1080?"YELLOW":"GREEN";H.next.textContent="Next station "+Math.max(0,((900-pos%900)/1000)).toFixed(1)+" km";H.power.textContent="P"+Math.round(throttle*4)+" / B"+Math.round(brake*5);
     } scene.render();}); setTimeout(()=>engine.resize(),50);
 },
 stop(){running=false;driveView.classList.remove("open")}
};
addEventListener("resize",()=>engine?.resize());
})();
