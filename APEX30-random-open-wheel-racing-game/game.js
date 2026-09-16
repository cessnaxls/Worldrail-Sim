(()=>{
const C=document.getElementById('game'),X=C.getContext('2d',{alpha:false});let W,H,D=1;
const $=id=>document.getElementById(id);let running=false,last=0,gas=0,brake=0,steer=0,speed=0,gear=1,playerS=0,lap=1,cam=0,track=[],cars=[],trackLen=0,manual=false,tilt=false;
function resize(){D=Math.min(1.5,devicePixelRatio||1);W=innerWidth;H=innerHeight;C.width=W*D;C.height=H*D;C.style.width=W+'px';C.style.height=H+'px';X.setTransform(D,0,0,D,0,0)}addEventListener('resize',resize);resize();
function rnd(a,b){return a+Math.random()*(b-a)}
function gen(){
 let n=Math.floor(rnd(26,45)),rx=rnd(520,920),ry=rnd(360,720),pts=[];
 for(let i=0;i<n;i++){let a=i/n*Math.PI*2,r=1+rnd(-.22,.22),x=Math.cos(a)*rx*r,y=Math.sin(a)*ry*r,z=10*Math.sin(a*rnd(1.5,3.5)+rnd(0,6))+rnd(-4,4);pts.push({x,y,z})}
 // Chaikin smoothing twice -> plausible flowing open-wheel circuit
 for(let q=0;q<3;q++){let z=[];for(let i=0;i<pts.length;i++){let a=pts[i],b=pts[(i+1)%pts.length];z.push({x:.75*a.x+.25*b.x,y:.75*a.y+.25*b.y,z:.75*a.z+.25*b.z},{x:.25*a.x+.75*b.x,y:.25*a.y+.75*b.y,z:.25*a.z+.75*b.z})}pts=z}
 track=[];trackLen=0;
 for(let i=0;i<pts.length;i++){let a=pts[i],b=pts[(i+1)%pts.length],d=Math.hypot(b.x-a.x,b.y-a.y);let steps=Math.max(2,Math.ceil(d/12));for(let k=0;k<steps;k++){let t=k/steps,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,s:trackLen};if(track.length){let v=track[track.length-1];trackLen+=Math.hypot(p.x-v.x,p.y-v.y)}p.s=trackLen;track.push(p)}}
 cars=[];let start=Math.floor(rnd(1,31));for(let i=0;i<30;i++)cars.push({s:((i-start)*9+trackLen)%trackLen,v:rnd(48,61),lane:(i%2?1:-1)*2.1,col:`hsl(${(i*47)%360} 70% 52%)`,me:i===start-1});playerS=cars.find(c=>c.me).s;speed=0;gear=1;lap=1;$('pos').textContent='P'+start;$('lap').textContent='1/5';
}
function sample(s){s=(s%trackLen+trackLen)%trackLen;let lo=0,hi=track.length-1;while(lo<hi){let m=(lo+hi+1)>>1;if(track[m].s<=s)lo=m;else hi=m-1}let a=track[lo],b=track[(lo+1)%track.length],ds=((b.s-a.s+trackLen)%trackLen)||1,t=((s-a.s+trackLen)%trackLen)/ds;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t}}
function pedal(el,set){let f=e=>{e.preventDefault();let r=el.getBoundingClientRect(),y=e.clientY??e.touches?.[0]?.clientY,v=Math.max(0,Math.min(1,1-(y-r.top)/r.height));set(v);el.querySelector('i').style.height=v*100+'%'};el.onpointerdown=e=>{el.setPointerCapture(e.pointerId);f(e)};el.onpointermove=e=>{if(e.buttons)f(e)};el.onpointerup=()=>{set(0);el.querySelector('i').style.height='0%'}}
pedal($('gas'),v=>gas=v);pedal($('brake'),v=>brake=v);
$('up').onclick=()=>{if(manual)gear=Math.min(6,gear+1)};$('down').onclick=()=>{if(manual)gear=Math.max(1,gear-1)};$('cam').onclick=()=>cam=(cam+1)%2;
async function motion(){if(!tilt)return;if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){try{if(await DeviceOrientationEvent.requestPermission()!=='granted')throw 0}catch(e){tilt=false;show('Tilt unavailable — drag horizontally on the track to steer')}}if(tilt)addEventListener('deviceorientation',e=>{let g=e.gamma||0;steer=Math.max(-1,Math.min(1,g/28))})}
let drag=false,lastx=0;C.onpointerdown=e=>{drag=true;lastx=e.clientX};C.onpointermove=e=>{if(drag&&!tilt){steer=Math.max(-1,Math.min(1,(e.clientX-lastx)/90));lastx=e.clientX}};C.onpointerup=()=>{drag=false;if(!tilt)steer=0};
function show(t){let m=$('msg');m.textContent=t;m.style.display='block';setTimeout(()=>m.style.display='none',2500)}
function update(dt){
 let mph=speed*2.237;if(!manual){gear=Math.max(1,Math.min(6,Math.floor(mph/36)+1))}
 let accel=gas*(10.2-0.11*speed)-brake*18-.0065*speed*speed;speed=Math.max(0,Math.min(92,speed+accel*dt));
 let old=playerS;playerS=(playerS+speed*dt)%trackLen;if(playerS<old&&speed>10){lap++;$('lap').textContent=Math.min(lap,5)+'/5';if(lap>5){running=false;show('FINISH')}}
 let me=cars.find(c=>c.me);me.s=playerS;me.v=speed;
 // AI target speed varies by upcoming curvature, small personality differences
 cars.forEach((c,i)=>{if(c.me)return;let p0=sample(c.s),p1=sample(c.s+45),p2=sample(c.s+90),a1=Math.atan2(p1.y-p0.y,p1.x-p0.x),a2=Math.atan2(p2.y-p1.y,p2.x-p1.x),cur=Math.abs(Math.atan2(Math.sin(a2-a1),Math.cos(a2-a1)));let tv=Math.max(28,68-cur*55)+(i%7-3)*.7;c.v+=(tv-c.v)*dt*.55;c.s=(c.s+c.v*dt)%trackLen});
 let sorted=[...cars].sort((a,b)=>b.s-a.s),pos=sorted.findIndex(c=>c.me)+1;$('pos').textContent='P'+pos;$('spd').textContent=Math.round(speed*2.237);$('gear').textContent=gear;
}
function render(){
 X.fillStyle='#7fa5c2';X.fillRect(0,0,W,H);let me=sample(playerS),ahead=sample(playerS+30),ang=Math.atan2(ahead.y-me.y,ahead.x-me.x),scale=cam?0.18:0.32,cx=W/2,cy=H*.58;
 X.save();X.translate(cx,cy);X.rotate(-ang-Math.PI/2);X.scale(scale,scale);X.translate(-me.x,-me.y);
 // grass
 X.fillStyle='#557746';X.fillRect(me.x-W/scale,me.y-H/scale,W*2/scale,H*2/scale);
 // road polyline
 X.lineJoin='round';X.lineCap='round';X.strokeStyle='#25282b';X.lineWidth=46;X.beginPath();let started=false;for(let p of track){let ds=Math.abs(p.s-playerS);ds=Math.min(ds,trackLen-ds);if(ds<900){if(!started){X.moveTo(p.x,p.y);started=true}else X.lineTo(p.x,p.y)}}X.stroke();
 X.strokeStyle='#e8e8df';X.lineWidth=2;X.stroke();
 // cars
 cars.forEach(c=>{let p=sample(c.s),q=sample(c.s+3),a=Math.atan2(q.y-p.y,q.x-p.x);X.save();X.translate(p.x,p.y);X.rotate(a);X.fillStyle=c.me?'#f4f4f4':c.col;X.fillRect(-2.5,-1,5,2);X.fillStyle='#111';X.fillRect(-1.8,-1.35,.7,.35);X.fillRect(1.2,-1.35,.7,.35);X.fillRect(-1.8,1,.7,.35);X.fillRect(1.2,1,.7,.35);X.restore()});X.restore();
 // elevation horizon cue
 X.fillStyle='#ffffff22';X.fillRect(0,H*.2,W,2);
}
let frames=0,ft=0;function loop(t){if(!running)return;let dt=Math.min(.04,(t-last)/1000||.016);last=t;update(dt);render();frames++;ft+=dt;if(ft>1){$('fps').textContent=Math.round(frames/ft);frames=0;ft=0}requestAnimationFrame(loop)}
$('startBtn').onclick=async()=>{manual=$('trans').value==='manual';tilt=$('tilt').value==='yes';gen();$('start').style.display='none';await motion();running=true;last=performance.now();requestAnimationFrame(loop)};
})();