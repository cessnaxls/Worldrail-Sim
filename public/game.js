(()=>{"use strict";
const C=document.getElementById("game"),x=C.getContext("2d"),$=id=>document.getElementById(id);
let W=0,H=0,dpr=1,track=[],N=0,total=0,player,ai=[],running=false,last=0,gas=0,brake=0,steer=0,tilt=0,lapGoal=5,auto=true,startPlace=1,countdown=0,touchSteer=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a);
function resize(){dpr=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;C.width=W*dpr;C.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)}addEventListener("resize",resize);resize();
function makeTrack(type){
 let pts=type==="technical"?18:type==="fast"?10:14, base=rnd(620,1050), raw=[];
 for(let i=0;i<pts;i++){let a=i/pts*Math.PI*2, wob=type==="fast"?.13:type==="technical"?.32:.23;let r=base*(1+rnd(-wob,wob));raw.push({x:Math.cos(a)*r,z:Math.sin(a)*r,y:rnd(-18,18)})}
 // Chaikin smoothing creates a closed, driveable circuit.
 for(let q=0;q<3;q++){let o=[];for(let i=0;i<raw.length;i++){let a=raw[i],b=raw[(i+1)%raw.length];o.push({x:.75*a.x+.25*b.x,z:.75*a.z+.25*b.z,y:.75*a.y+.25*b.y},{x:.25*a.x+.75*b.x,z:.25*a.z+.75*b.z,y:.25*a.y+.75*b.y})}raw=o}
 track=[];total=0;
 for(let i=0;i<raw.length;i++){let a=raw[i],b=raw[(i+1)%raw.length],dx=b.x-a.x,dz=b.z-a.z,dy=b.y-a.y,len=Math.hypot(dx,dz,dy),steps=Math.max(2,Math.ceil(len/14));for(let j=0;j<steps;j++){let t=j/steps,p={x:a.x+dx*t,z:a.z+dz*t,y:a.y+dy*t,s:total};if(track.length){let p0=track[track.length-1];total+=Math.hypot(p.x-p0.x,p.z-p0.z,p.y-p0.y);p.s=total}track.push(p)}}
 N=track.length; let end=track[N-1],beg=track[0];total+=Math.hypot(end.x-beg.x,end.z-beg.z,end.y-beg.y);
}
function at(s){s=((s%total)+total)%total;let lo=0,hi=N-1;while(lo<hi){let m=(lo+hi+1)>>1;if(track[m].s<=s)lo=m;else hi=m-1}let a=track[lo],b=track[(lo+1)%N],span=(lo===N-1?total:a===b?1:track[lo+1].s)-a.s,t=span?((s-a.s)/span):0;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t}}
function tangent(s){let a=at(s-3),b=at(s+3),dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;return{x:dx/l,z:dz/l}}
async function motion(){if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){try{let r=await DeviceOrientationEvent.requestPermission();return r==="granted"}catch(e){return false}}return "DeviceOrientationEvent"in window}
addEventListener("deviceorientation",e=>{if(e.gamma!=null)tilt=clamp(e.gamma/28,-1,1)});
function bindHold(id,set){let b=$(id);b.addEventListener("pointerdown",e=>{e.preventDefault();b.setPointerCapture(e.pointerId);set(1)});["pointerup","pointercancel","lostpointercapture"].forEach(n=>b.addEventListener(n,()=>set(0)))}
bindHold("gas",v=>gas=v);bindHold("brake",v=>brake=v);
$("up").addEventListener("pointerdown",()=>{if(!auto)player.gear=clamp(player.gear+1,1,6)});$("down").addEventListener("pointerdown",()=>{if(!auto)player.gear=clamp(player.gear-1,1,6)});
C.addEventListener("pointermove",e=>{if(touchSteer&&running&&e.buttons)steer=clamp((e.clientX/W-.5)*2,-1,1)});C.addEventListener("pointerdown",e=>{if(touchSteer&&running)steer=clamp((e.clientX/W-.5)*2,-1,1)});C.addEventListener("pointerup",()=>{if(touchSteer)steer=0});
function carColor(i){return `hsl(${(i*47)%360} 72% ${i===-1?58:48}%)`}
function start(){
 auto=$("trans").value==="auto";lapGoal=+$("laps").value;touchSteer=$("steer").value==="touch";$("paddles").style.display=auto?"none":"flex";
 makeTrack($("tracktype").value);startPlace=1+Math.floor(Math.random()*30);
 player={s:0,lane:0,v:0,gear:1,lap:1,finished:false};
 ai=[];let grid=[];for(let i=0;i<30;i++)grid.push(i);let mySlot=startPlace-1;
 // 2-wide starting grid, 8m stagger.
 for(let slot=0;slot<30;slot++){if(slot===mySlot){player.s=total-20-Math.floor(slot/2)*9;player.lane=(slot%2?.95:-.95);continue}let i=ai.length;ai.push({s:total-20-Math.floor(slot/2)*9,lane:(slot%2?.95:-.95),v:0,target:rnd(60,78),skill:rnd(.94,1.06),lap:0,color:carColor(i)})}
 $("menu").style.display="none";running=true;countdown=3.8;last=performance.now();$("message").textContent="3";requestAnimationFrame(loop);
}
$("start").addEventListener("click",async()=>{if($("steer").value==="tilt"){let ok=await motion();if(!ok){$("steer").value="touch";touchSteer=true}}start()});
function update(dt){
 if(countdown>0){countdown-=dt;$("message").textContent=countdown>3?"3":countdown>2?"2":countdown>1?"1":countdown>0?"GO!":"";if(countdown<=0)setTimeout(()=>{$("message").textContent=""},600);return}
 steer=touchSteer?steer:tilt;
 let ratios=[0,3.0,2.15,1.65,1.34,1.12,0.96],rpm=player.v*ratios[player.gear]*115;
 if(auto){if(rpm>6900&&player.gear<6)player.gear++;if(rpm<3900&&player.gear>1)player.gear--}
 let accel=gas*(20/(1+player.v*.022))*(.78+player.gear*.055)-brake*32-.0075*player.v*player.v;
 player.v=clamp(player.v+accel*dt,0,92);
 // lateral control and grass drag
 player.lane+=steer*dt*(2.1+player.v*.035);player.lane*=Math.pow(.992,dt*60);
 if(Math.abs(player.lane)>5.4)player.v*=Math.pow(.975,dt*60);
 let old=player.s;player.s+=player.v*dt;if(player.s>=total){player.s-=total;player.lap++;if(player.lap>lapGoal)player.finished=true}
 for(let a of ai){let curve=curveAt(a.s),safe=clamp(1-Math.abs(curve)*7,.58,1);let target=a.target*a.skill*safe;if(a.v<target)a.v+=rnd(5,9)*dt;else a.v-=rnd(4,7)*dt;a.v=clamp(a.v,30,86);a.s+=a.v*dt;if(a.s>=total){a.s-=total;a.lap++}a.lane+=Math.sin(a.s*.008+a.skill*9)*.006}
 if(player.finished){running=false;$("message").textContent="FINISH";setTimeout(()=>{$("menu").style.display="flex";$("message").textContent=""},2200)}
}
function curveAt(s){let a=tangent(s-10),b=tangent(s+10);return a.x*b.z-a.z*b.x}
function rank(){let prog=(player.lap-1)*total+player.s,n=1;for(let a of ai){let ap=a.lap*total+a.s;if(ap>prog)n++}return clamp(n,1,30)}
function project(wx,wy,wz,cam,cs,sn){
 let dx=wx-cam.x,dz=wz-cam.z,dy=wy-cam.y,rx=dx*cs-dz*sn,rz=dx*sn+dz*cs;if(rz<1)return null;let f=Math.min(W,H)*1.05;return{x:W/2+rx/rz*f,y:H*.48-dy/rz*f,z:rz,sc:f/rz}}
function draw(){
 x.fillStyle="#78acd0";x.fillRect(0,0,W,H*.53);x.fillStyle="#507a3d";x.fillRect(0,H*.53,W,H*.47);
 let p=at(player.s),t=tangent(player.s),n={x:-t.z,z:t.x};let yaw=Math.atan2(t.x,t.z),cam={x:p.x+n.x*player.lane-t.x*8,y:p.y+2.0,z:p.z+n.z*player.lane-t.z*8},cs=Math.cos(yaw),sn=Math.sin(yaw);
 // road strips far-to-near
 let strips=[];for(let d=18;d<620;d+=10){let q=at(player.s+d),tt=tangent(player.s+d),nn={x:-tt.z,z:tt.x};let l=project(q.x+nn.x*6.5,q.y,q.z+nn.z*6.5,cam,cs,sn),r=project(q.x-nn.x*6.5,q.y,q.z-nn.z*6.5,cam,cs,sn);if(l&&r)strips.push({l,r,d})}
 for(let i=strips.length-2;i>=0;i--){let a=strips[i],b=strips[i+1];x.fillStyle=(i&1)?"#303236":"#34363a";x.beginPath();x.moveTo(a.l.x,a.l.y);x.lineTo(a.r.x,a.r.y);x.lineTo(b.r.x,b.r.y);x.lineTo(b.l.x,b.l.y);x.fill();
   x.strokeStyle=(i%4<2)?"#eee":"#d33";x.lineWidth=Math.max(1,a.l.sc*.25);x.beginPath();x.moveTo(a.l.x,a.l.y);x.lineTo(b.l.x,b.l.y);x.moveTo(a.r.x,a.r.y);x.lineTo(b.r.x,b.r.y);x.stroke()}
 // center dashed line
 x.strokeStyle="#eee9";x.lineWidth=2;for(let d=30;d<500;d+=40){let a=at(player.s+d),b=at(player.s+d+18),pa=project(a.x,a.y+.03,a.z,cam,cs,sn),pb=project(b.x,b.y+.03,b.z,cam,cs,sn);if(pa&&pb){x.beginPath();x.moveTo(pa.x,pa.y);x.lineTo(pb.x,pb.y);x.stroke()}}
 // cars, sorted depth
 let cars=[];for(let a of ai){let delta=((a.s-player.s+total)%total);if(delta<550||delta>total-60){if(delta>total-60)delta-=total;let q=at(a.s),tt=tangent(a.s),nn={x:-tt.z,z:tt.x},pp=project(q.x+nn.x*a.lane,q.y+.55,q.z+nn.z*a.lane,cam,cs,sn);if(pp&&pp.z>1)cars.push({p:pp,c:a.color})}}
 cars.sort((a,b)=>b.p.z-a.p.z);for(let c of cars){let w=clamp(c.p.sc*2.0,4,74),h=w*.42;x.fillStyle=c.c;x.fillRect(c.p.x-w/2,c.p.y-h,w,h);x.fillStyle="#111";x.fillRect(c.p.x-w*.33,c.p.y-h*.88,w*.66,h*.32);x.fillStyle="#050505";x.fillRect(c.p.x-w*.48,c.p.y-h*.05,w*.2,h*.18);x.fillRect(c.p.x+w*.28,c.p.y-h*.05,w*.2,h*.18)}
 // cockpit nose
 x.fillStyle="#c7cbd0";x.beginPath();x.moveTo(W*.44,H);x.lineTo(W*.48,H*.75);x.lineTo(W*.52,H*.75);x.lineTo(W*.56,H);x.fill();x.fillStyle="#16191d";x.fillRect(W*.485,H*.76,W*.03,H*.13);
 $("speed").textContent=Math.round(player.v*2.237);$("gear").textContent=player.gear;$("lap").textContent=Math.min(player.lap,lapGoal)+"/"+lapGoal;$("pos").textContent=rank();
}
function loop(now){if(!running)return;let dt=Math.min(.04,(now-last)/1000||.016);last=now;update(dt);draw();requestAnimationFrame(loop)}
})();