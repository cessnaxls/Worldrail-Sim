(()=>{"use strict";
const cv=document.getElementById("game"),g=cv.getContext("2d",{alpha:false}),$=id=>document.getElementById(id);
let W,H,D=1,path=[],L=0,player=null,bots=[],running=false,last=0,throttle=0,brake=0,tilt=0,touch=0,useTouch=false,auto=true,laps=5,count=0,gridPos=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a);
function resize(){D=Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;cv.width=W*D;cv.height=H*D;g.setTransform(D,0,0,D,0,0)}addEventListener("resize",resize);resize();
function generate(kind){
 const n=kind==="technical"?22:kind==="fast"?12:16,R=kind==="technical"?620:kind==="fast"?920:780,w=kind==="technical"?.34:kind==="fast"?.12:.22;let p=[];
 for(let i=0;i<n;i++){let a=i/n*Math.PI*2,r=R*(1+rand(-w,w));p.push({x:Math.sin(a)*r,z:Math.cos(a)*r,y:rand(-14,14)})}
 for(let q=0;q<4;q++){let o=[];for(let i=0;i<p.length;i++){let a=p[i],b=p[(i+1)%p.length];o.push(mix(a,b,.25),mix(a,b,.75))}p=o}
 path=[];L=0;for(let i=0;i<p.length;i++){let a=p[i],b=p[(i+1)%p.length],len=Math.hypot(b.x-a.x,b.z-a.z,b.y-a.y),steps=Math.max(3,Math.ceil(len/9));for(let j=0;j<steps;j++){let t=j/steps,k=mix(a,b,t);if(path.length)L+=dist(path[path.length-1],k);k.s=L;path.push(k)}}L+=dist(path[path.length-1],path[0]);
}
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t}),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function sample(s){s=(s%L+L)%L;let lo=0,hi=path.length-1;while(lo<hi){let m=(lo+hi+1)>>1;if(path[m].s<=s)lo=m;else hi=m-1}let a=path[lo],b=path[(lo+1)%path.length],end=lo===path.length-1?L:path[lo+1].s,t=(s-a.s)/Math.max(.001,end-a.s);return mix(a,b,t)}
function tan(s){let a=sample(s-4),b=sample(s+4),l=Math.hypot(b.x-a.x,b.z-a.z)||1;return{x:(b.x-a.x)/l,z:(b.z-a.z)/l}}
function curvature(s){let a=tan(s-14),b=tan(s+14);return Math.abs(a.x*b.z-a.z*b.x)}
function side(s){let t=tan(s);return{x:-t.z,z:t.x}}
function setup(){
 gridPos=1+Math.floor(Math.random()*30);let slot=gridPos-1;player={s:L-35-Math.floor(slot/2)*10,lane:slot%2?1.35:-1.35,v:0,gear:1,lap:0};
 bots=[];for(let q=0;q<30;q++){if(q===slot)continue;bots.push({s:L-35-Math.floor(q/2)*10,lane:q%2?1.35:-1.35,v:0,lap:0,skill:rand(.91,1.08),base:rand(69,78),hue:Math.floor(rand(0,360))})}
}
async function askMotion(){if(typeof DeviceOrientationEvent==="undefined")return false;if(typeof DeviceOrientationEvent.requestPermission==="function"){try{return await DeviceOrientationEvent.requestPermission()==="granted"}catch(e){return false}}return true}
addEventListener("deviceorientation",e=>{if(e.gamma!=null)tilt=clamp(e.gamma/24,-1,1)});
function hold(id,fn){let b=$(id);b.addEventListener("pointerdown",e=>{e.preventDefault();b.setPointerCapture(e.pointerId);fn(1)});["pointerup","pointercancel","lostpointercapture"].forEach(k=>b.addEventListener(k,()=>fn(0)))}hold("gas",v=>throttle=v);hold("brake",v=>brake=v);
$("up").addEventListener("pointerdown",()=>{if(player&&!auto)player.gear=clamp(player.gear+1,1,6)});$("down").addEventListener("pointerdown",()=>{if(player&&!auto)player.gear=clamp(player.gear-1,1,6)});
cv.addEventListener("pointerdown",e=>{if(useTouch)touch=e.clientX<W/2?-1:1});cv.addEventListener("pointermove",e=>{if(useTouch&&e.buttons)touch=e.clientX<W/2?-1:1});cv.addEventListener("pointerup",()=>touch=0);
$("start").addEventListener("click",async()=>{useTouch=$("steering").value==="touch";if(!useTouch&&!await askMotion()){useTouch=true;$("steering").value="touch"}auto=$("trans").value==="auto";laps=+$("laps").value;$("paddles").style.display=auto?"none":"flex";generate($("type").value);setup();$("menu").style.display="none";running=true;count=3.6;last=performance.now();requestAnimationFrame(frame)});
function update(dt){
 if(count>0){count-=dt;$("centerMsg").textContent=count>3?"3":count>2?"2":count>1?"1":count>0?"GO":"";return}$("centerMsg").textContent="";
 let steer=useTouch?touch:tilt,ratio=[0,3.05,2.18,1.67,1.36,1.13,.97][player.gear],rpm=player.v*ratio*112;if(auto){if(rpm>6900&&player.gear<6)player.gear++;else if(rpm<3900&&player.gear>1)player.gear--}
 let engine=throttle*(17.5/(1+player.v*.014)),drag=.0022*player.v*player.v;player.v=clamp(player.v+(engine-brake*31-drag)*dt,0,94);player.lane+=steer*(1.8+player.v*.032)*dt;player.lane*=Math.pow(.998,dt*60);if(Math.abs(player.lane)>6.2)player.v*=Math.pow(.96,dt*60);
 player.s+=player.v*dt;if(player.s>=L){player.s-=L;player.lap++;if(player.lap>=laps){running=false;$("centerMsg").textContent="FINISH";setTimeout(()=>{$("menu").style.display="flex";$("centerMsg").textContent=""},1800)}}
 for(let b of bots){let target=b.base*b.skill*clamp(1-curvature(b.s)*2.8,.55,1);b.v+=clamp(target-b.v,-9,7)*dt;b.s+=b.v*dt;if(b.s>=L){b.s-=L;b.lap++}b.lane+=Math.sin(b.s*.006+b.skill*17)*.004}
}
function proj(q,cam,cs,sn){let dx=q.x-cam.x,dz=q.z-cam.z,dy=q.y-cam.y,rx=dx*cs-dz*sn,rz=dx*sn+dz*cs;if(rz<.7)return null;let f=Math.min(W,H)*1.16;return{x:W/2+rx/rz*f,y:H*.49-dy/rz*f,z:rz,k:f/rz}}
function render(){
 // sky gradient and grass
 let sky=g.createLinearGradient(0,0,0,H*.58);sky.addColorStop(0,"#4c83ad");sky.addColorStop(1,"#b8d1df");g.fillStyle=sky;g.fillRect(0,0,W,H*.58);g.fillStyle="#3c672f";g.fillRect(0,H*.58,W,H*.42);
 let pp=sample(player.s),tt=tan(player.s),ss=side(player.s),yaw=Math.atan2(tt.x,tt.z),cs=Math.cos(yaw),sn=Math.sin(yaw),cam={x:pp.x+ss.x*player.lane-tt.x*6,y:pp.y+1.55,z:pp.z+ss.z*player.lane-tt.z*6};
 let rows=[];for(let d=12;d<=650;d+=7){let q=sample(player.s+d),n=side(player.s+d),w=7.2,l=proj({x:q.x+n.x*w,y:q.y,z:q.z+n.z*w},cam,cs,sn),r=proj({x:q.x-n.x*w,y:q.y,z:q.z-n.z*w},cam,cs,sn);if(l&&r)rows.push({l,r,d})}
 // verge + asphalt + curbing, far to near
 for(let i=rows.length-2;i>=0;i--){let a=rows[i],b=rows[i+1];g.fillStyle="#2c2e31";poly(a.l,a.r,b.r,b.l);let edge=Math.max(1,a.l.k*.14);g.strokeStyle=((Math.floor(a.d/9)&1)?"#f4f4f4":"#d32929");g.lineWidth=edge;line(a.l,b.l);line(a.r,b.r)}
 // racing center markers
 for(let d=25;d<520;d+=42){let a=sample(player.s+d),b=sample(player.s+d+17),pa=proj(a,cam,cs,sn),pb=proj(b,cam,cs,sn);if(pa&&pb){g.strokeStyle="#ffffff55";g.lineWidth=Math.max(1,pa.k*.035);line(pa,pb)}}
 // roadside posts give depth
 for(let d=35;d<520;d+=35){let q=sample(player.s+d),n=side(player.s+d);for(let sidev of [-1,1]){let p=proj({x:q.x+n.x*sidev*10,y:q.y+1,z:q.z+n.z*sidev*10},cam,cs,sn);if(p){g.fillStyle="#e7e7e7";g.fillRect(p.x-p.k*.06,p.y-p.k*.7,Math.max(1,p.k*.12),p.k*.7)}}}
 let cars=[];for(let b of bots){let ds=(b.s-player.s+L)%L;if(ds> L-70)ds-=L;if(ds>-20&&ds<600){let q=sample(b.s),n=side(b.s),p=proj({x:q.x+n.x*b.lane,y:q.y+.42,z:q.z+n.z*b.lane},cam,cs,sn);if(p)cars.push({p,h:b.hue})}}cars.sort((a,b)=>b.p.z-a.p.z);for(let c of cars)drawCar(c.p,c.h);
 // nose / front wheels
 let base=H*.93;g.fillStyle="#121417";g.beginPath();g.ellipse(W*.34,base,Math.min(70,W*.09),Math.min(28,H*.035),0,0,Math.PI*2);g.ellipse(W*.66,base,Math.min(70,W*.09),Math.min(28,H*.035),0,0,Math.PI*2);g.fill();g.fillStyle="#d5d8db";g.beginPath();g.moveTo(W*.43,H);g.lineTo(W*.485,H*.73);g.lineTo(W*.515,H*.73);g.lineTo(W*.57,H);g.fill();
 $("speed").textContent=Math.round(player.v*2.237);$("gear").textContent=player.gear;$("lap").textContent=Math.min(player.lap+1,laps)+"/"+laps;$("position").textContent=rank()+"/30";
}
function poly(...p){g.beginPath();g.moveTo(p[0].x,p[0].y);for(let i=1;i<p.length;i++)g.lineTo(p[i].x,p[i].y);g.closePath();g.fill()}function line(a,b){g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}
function drawCar(p,h){let w=clamp(p.k*1.9,4,95),hh=w*.33;g.fillStyle=`hsl(${h} 72% 48%)`;g.fillRect(p.x-w*.44,p.y-hh,w*.88,hh*.5);g.fillRect(p.x-w*.19,p.y-hh*1.4,w*.38,hh*1.15);g.fillStyle="#111";g.fillRect(p.x-w*.34,p.y-hh*1.18,w*.68,hh*.25);g.fillRect(p.x-w*.5,p.y-hh*.18,w*.2,hh*.42);g.fillRect(p.x+w*.3,p.y-hh*.18,w*.2,hh*.42)}
function rank(){let me=player.lap*L+player.s,n=1;for(let b of bots)if(b.lap*L+b.s>me)n++;return n}
function frame(t){if(!running)return;let dt=Math.min(.035,(t-last)/1000||.016);last=t;update(dt);render();requestAnimationFrame(frame)}
})();