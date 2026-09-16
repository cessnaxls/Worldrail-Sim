(()=>{"use strict";
const $=id=>document.getElementById(id),canvas=$("c");let engine,scene,cam,car,road=[],gas=0,brake=0,tilt=0,speed=0,heading=0,pos=new BABYLON.Vector3(0,.42,-105),last=performance.now(),frames=0,fpsT=last;
function fail(e){$("err").style.display="block";$("err").textContent="Renderer error: "+(e.message||e);$("bootText").textContent="Renderer failed";console.error(e)}
try{
 engine=new BABYLON.Engine(canvas,false,{preserveDrawingBuffer:false,stencil:false,antialias:false,disableWebGL2Support:false},true);
 engine.setHardwareScalingLevel(Math.max(1.2,Math.min(1.8,(devicePixelRatio||1)*.85)));
 scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(.50,.69,.82,1);scene.ambientColor=new BABYLON.Color3(.28,.28,.28);scene.fogMode=BABYLON.Scene.FOGMODE_LINEAR;scene.fogStart=150;scene.fogEnd=480;scene.fogColor=new BABYLON.Color3(.50,.69,.82);
 cam=new BABYLON.UniversalCamera("cam",new BABYLON.Vector3(0,3,-112),scene);cam.fov=.88;cam.minZ=.15;cam.maxZ=550;
 let hemi=new BABYLON.HemisphericLight("sky",new BABYLON.Vector3(0,1,0),scene);hemi.intensity=.62;let sun=new BABYLON.DirectionalLight("sun",new BABYLON.Vector3(-.35,-1,.25),scene);sun.position=new BABYLON.Vector3(50,90,-60);sun.intensity=1.35;
 const mat=(name,color,rough=.75,metal=0)=>{let m=new BABYLON.PBRMaterial(name,scene);m.albedoColor=BABYLON.Color3.FromHexString(color);m.roughness=rough;m.metallic=metal;return m};
 const asphalt=mat("asphalt","#26292d",.94,0),grass=mat("grass","#496f35",1,0),red=mat("red","#c3262e",.7,0),white=mat("white","#e8e7e2",.72,0),barrier=mat("barrier","#b8bdc2",.38,.72),carbon=mat("carbon","#111315",.35,.25),body=mat("body","#cf2b2e",.28,.45),rubber=mat("rubber","#08090a",.95,0),glass=mat("glass","#202c33",.2,.25);
 // broad ground
 let grd=BABYLON.MeshBuilder.CreateGround("infield",{width:900,height:900},scene);grd.material=grass;grd.position.y=-.12;
 // beautiful fixed test circuit: sweeping S into a banked-ish right, 12m wide.
 let center=[];for(let i=0;i<=120;i++){let z=-120+i*4.5,x=Math.sin(i*.055)*34+Math.sin(i*.115)*10,y=Math.sin(i*.032)*2.8;center.push(new BABYLON.Vector3(x,y,z))}
 function ribbon(name,offsetA,offsetB,material,yadd=0){
  let paths=[[],[]];for(let i=0;i<center.length;i++){let p=center[i],p0=center[Math.max(0,i-1)],p1=center[Math.min(center.length-1,i+1)],dx=p1.x-p0.x,dz=p1.z-p0.z,l=Math.hypot(dx,dz)||1,nx=-dz/l,nz=dx/l;paths[0].push(new BABYLON.Vector3(p.x+nx*offsetA,p.y+yadd,p.z+nz*offsetA));paths[1].push(new BABYLON.Vector3(p.x+nx*offsetB,p.y+yadd,p.z+nz*offsetB))}
  let m=BABYLON.MeshBuilder.CreateRibbon(name,{pathArray:paths,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);m.material=material;return m}
 ribbon("road",-6.2,6.2,asphalt,.01);ribbon("curbL",-7,-6.15,white,.025);ribbon("curbR",6.15,7,red,.025);
 // alternate curb panels
 for(let i=3;i<center.length-2;i+=5){let p=center[i],p0=center[i-1],p1=center[i+1],dx=p1.x-p0.x,dz=p1.z-p0.z,l=Math.hypot(dx,dz),nx=-dz/l,nz=dx/l;for(let s of [-1,1]){let b=BABYLON.MeshBuilder.CreateBox("curb",{width:1.0,height:.08,depth:3.2},scene);b.position=new BABYLON.Vector3(p.x+nx*s*6.55,p.y+.04,p.z+nz*s*6.55);b.rotation.y=Math.atan2(dx,dz);b.material=((i/5)&1)?red:white}}
 // guardrails + posts
 for(let i=3;i<center.length;i+=3){let p=center[i],p0=center[i-1],p1=center[Math.min(center.length-1,i+1)],dx=p1.x-p0.x,dz=p1.z-p0.z,l=Math.hypot(dx,dz),nx=-dz/l,nz=dx/l,ang=Math.atan2(dx,dz);for(let s of [-1,1]){let post=BABYLON.MeshBuilder.CreateBox("post",{width:.13,height:1.05,depth:.13},scene);post.position=new BABYLON.Vector3(p.x+nx*s*10,p.y+.4,p.z+nz*s*10);post.material=barrier;if(i%6===0){let rail=BABYLON.MeshBuilder.CreateBox("rail",{width:.18,height:.42,depth:13.5},scene);rail.position=new BABYLON.Vector3(p.x+nx*s*10,p.y+.68,p.z+nz*s*10);rail.rotation.y=ang;rail.material=barrier}}}
 // car root + detailed open wheel silhouette
 car=new BABYLON.TransformNode("car",scene);function box(n,w,h,d,y,z,ma){let m=BABYLON.MeshBuilder.CreateBox(n,{width:w,height:h,depth:d},scene);m.parent=car;m.position.set(0,y,z);m.material=ma;return m}
 box("floor",2.0,.12,4.7,.15,0,carbon);box("tub",1.18,.68,3.15,.55,.05,body);let nose=box("nose",.55,.34,2.6,.38,2.55,body);let cockpit=box("cockpit",.84,.46,1.05,.88,-.25,glass);box("rearwing",2.05,.12,.42,1.05,-2.25,carbon);box("frontwing",2.35,.10,.55,.23,3.55,carbon);
 for(let z of [-1.45,2.15])for(let sx of [-1,1]){let w=BABYLON.MeshBuilder.CreateCylinder("tire",{diameter:.72,height:.36,tessellation:18},scene);w.parent=car;w.rotation.z=Math.PI/2;w.position.set(sx*1.02,.43,z);w.material=rubber}
 // halo
 let halo=BABYLON.MeshBuilder.CreateTorus("halo",{diameter:1.0,thickness:.075,tessellation:24},scene);halo.parent=car;halo.rotation.x=Math.PI/2;halo.scaling.z=1.35;halo.position.set(0,1.12,-.15);halo.material=carbon;
 car.position.copyFrom(pos);
 scene.onAfterRenderObservable.addOnce(()=>{$("boot").style.display="none"});
 function hold(id,set){let b=$(id);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);set(1)};b.onpointerup=b.onpointercancel=()=>set(0)}hold("gas",v=>gas=v);hold("brake",v=>brake=v);
 addEventListener("deviceorientation",e=>{if(e.gamma!=null)tilt=Math.max(-1,Math.min(1,e.gamma/25))});
 $("motion").onclick=async()=>{try{if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){let r=await DeviceOrientationEvent.requestPermission();$("motion").textContent=r==="granted"?"TILT ENABLED":"TILT DENIED"}else $("motion").textContent="TILT ACTIVE"}catch(e){$("motion").textContent="TILT UNAVAILABLE"}};
 engine.runRenderLoop(()=>{let now=performance.now(),dt=Math.min(.035,(now-last)/1000);last=now;speed=Math.max(0,Math.min(78,speed+(gas*15-brake*30-.0032*speed*speed)*dt));heading+=tilt*(.34+speed*.007)*dt;pos.x+=Math.sin(heading)*speed*dt;pos.z+=Math.cos(heading)*speed*dt;car.position.copyFrom(pos);car.rotation.y=heading;
 let behind=new BABYLON.Vector3(-Math.sin(heading)*8,3.2,-Math.cos(heading)*8);cam.position=BABYLON.Vector3.Lerp(cam.position,pos.add(behind),.12);cam.setTarget(pos.add(new BABYLON.Vector3(Math.sin(heading)*18,1.0,Math.cos(heading)*18)));
 $("mph").textContent=Math.round(speed*2.237);let gear=Math.max(1,Math.min(6,Math.floor(speed/13)+1));$("gear").textContent=gear;$("steerRead").textContent="TILT "+Math.round(tilt*100)+"%";
 scene.render();frames++;if(now-fpsT>800){$("fps").textContent=Math.round(frames*1000/(now-fpsT))+" FPS";frames=0;fpsT=now}});
 addEventListener("resize",()=>engine.resize());
}catch(e){fail(e)}
})();