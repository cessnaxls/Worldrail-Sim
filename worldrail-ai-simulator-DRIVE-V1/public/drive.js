(() => {
const canvas=document.getElementById('driveCanvas'), ctx=canvas.getContext('2d');
const hud={speed:document.getElementById('dSpeed'),limit:document.getElementById('dLimit'),next:document.getElementById('dNext'),signal:document.getElementById('dSignal'),clock:document.getElementById('dClock'),power:document.getElementById('dPower')};
let running=false,last=0,s=0,v=0,throttle=0,brake=0,doors=false,camera=0,simTime=7*3600+58*60;
const route={length:6200, stations:[{s:0,n:'WorldRail Central'},{s:1450,n:'Market Street'},{s:3050,n:'Riverside'},{s:4620,n:'University'},{s:6100,n:'North Terminal'}], limits:[{s:0,v:25},{s:450,v:45},{s:1250,v:25},{s:1650,v:55},{s:2800,v:30},{s:3300,v:60},{s:4400,v:30},{s:4850,v:50},{s:5850,v:20}]};
let ai=[{s:1800,v:11},{s:3900,v:14},{s:5600,v:9}];
function resize(){let d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();canvas.width=Math.max(1,r.width*d);canvas.height=Math.max(1,r.height*d);ctx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resize); resize();
function limitAt(x){let z=route.limits[0].v;for(const a of route.limits)if(x>=a.s)z=a.v;return z}
function nextStation(){return route.stations.find(x=>x.s>s+20)||route.stations.at(-1)}
function signalState(){let ahead=ai.map(a=>a.s-s).filter(d=>d>0).sort((a,b)=>a-b)[0]??9999;return ahead<260?'RED':ahead<650?'YELLOW':'GREEN'}
function update(dt){if(!running)return; let sig=signalState(), lim=limitAt(s); let acc=throttle*.82-brake*1.45-.012*v; if(sig==='RED'&&ai.some(a=>a.s>s&&a.s-s<85)) acc-=2.2; v=Math.max(0,Math.min(31,v+acc*dt));s+=v*dt;if(s>route.length){s=route.length;v=0} ai.forEach(a=>{a.s+=a.v*dt;if(a.s>route.length+500)a.s=-800});simTime+=dt*4;hud.speed.textContent=Math.round(v*3.6);hud.limit.textContent=lim;hud.signal.textContent=sig;hud.signal.dataset.state=sig;let ns=nextStation();hud.next.textContent=ns.n+' '+Math.max(0,(ns.s-s)/1000).toFixed(1)+' km';let h=Math.floor(simTime/3600)%24,m=Math.floor(simTime/60)%60;hud.clock.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;hud.power.textContent=`P${Math.round(throttle*4)} / B${Math.round(brake*5)}`}
function project(x,y,z,w,h){let horizon=h*.38, scale=620/(z+120);return [w/2+x*scale,horizon+y*scale,scale]}
function draw(){let w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);let g=ctx.createLinearGradient(0,0,0,h*.55);g.addColorStop(0,'#86a8c7');g.addColorStop(1,'#d8d2bd');ctx.fillStyle=g;ctx.fillRect(0,0,w,h*.55);ctx.fillStyle='#687258';ctx.fillRect(0,h*.38,w,h*.62);
// distant city
for(let i=0;i<24;i++){let x=((i*173)%w)-30, bh=35+(i*31)%95;ctx.fillStyle=i%3?'#8b8a82':'#777a79';ctx.fillRect(x,h*.38-bh,42+(i%4)*15,bh)}
// perspective sleepers/ballast/rails, camera follows train
let sway=Math.sin(s/130)*18, curve=Math.sin(s/700)*50;ctx.save();ctx.translate(camera===2? -w*.18:0,0);
ctx.beginPath();ctx.moveTo(w*.18,h);ctx.lineTo(w*.46+curve*.08,h*.38);ctx.lineTo(w*.54+curve*.08,h*.38);ctx.lineTo(w*.82,h);ctx.closePath();ctx.fillStyle='#77736a';ctx.fill();
for(let z=80;z<1450;z+=42){let zz=z-(s%42);if(zz<30)continue;let [cx,cy,sc]=project(curve*Math.pow(zz/1450,1.4),0,zz,w,h);let ww=2.8*sc;ctx.strokeStyle='#4b3b2c';ctx.lineWidth=Math.max(1,.18*sc);ctx.beginPath();ctx.moveTo(cx-ww,cy);ctx.lineTo(cx+ww,cy);ctx.stroke()}
for(let side of [-.72,.72]){ctx.strokeStyle='#d3d4d1';ctx.lineWidth=4;ctx.beginPath();for(let z=50;z<1600;z+=30){let bend=Math.sin((s+z)/700)*50;let [x,y]=project(side+bend,0,z,w,h);if(z===50)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()}
// signals
for(let z=520-(s%1100);z<1500;z+=1100){if(z<80)continue;let [x,y,sc]=project(3.2+Math.sin((s+z)/700)*50,-2.4,z,w,h);ctx.strokeStyle='#222';ctx.lineWidth=Math.max(2,.08*sc);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+2.4*sc);ctx.stroke();ctx.fillStyle='#17191b';ctx.fillRect(x-.22*sc,y-.8*sc,.44*sc,.9*sc);let st=signalState();ctx.fillStyle=st==='RED'?'#ff2e2e':st==='YELLOW'?'#ffd43b':'#35e66b';ctx.beginPath();ctx.arc(x,y-.52*sc,.11*sc,0,7);ctx.fill()}
// AI trains
for(let a of ai){let z=a.s-s;if(z<70||z>1300)continue;let bend=Math.sin((s+z)/700)*50;let [x,y,sc]=project(bend,-1.1,z,w,h);ctx.fillStyle='#c2c5c3';ctx.fillRect(x-1.2*sc,y-1.3*sc,2.4*sc,1.5*sc);ctx.fillStyle='#15202a';ctx.fillRect(x-.9*sc,y-1.15*sc,1.8*sc,.55*sc);ctx.fillStyle='#297ac2';ctx.fillRect(x-1.2*sc,y-.48*sc,2.4*sc,.14*sc)}
ctx.restore();
// cab frame in cab camera
if(camera===0){ctx.fillStyle='#171a1dcc';ctx.fillRect(0,h*.82,w,h*.18);ctx.fillRect(0,0,w*.07,h);ctx.fillRect(w*.93,0,w*.07,h);ctx.strokeStyle='#202428';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(w*.07,h*.1);ctx.lineTo(w*.28,h*.82);ctx.moveTo(w*.93,h*.1);ctx.lineTo(w*.72,h*.82);ctx.stroke()}
requestAnimationFrame(draw)}
function setLever(kind,val){val=Math.max(0,Math.min(1,val));if(kind==='throttle'){throttle=val;if(val>.05)brake=0;document.getElementById('throttleFill').style.height=(val*100)+'%'}else{brake=val;if(val>.05)throttle=0;document.getElementById('brakeFill').style.height=(val*100)+'%'}}
function lever(el,kind){const f=e=>{e.preventDefault();let r=el.getBoundingClientRect(),y=(e.touches?e.touches[0].clientY:e.clientY);setLever(kind,1-(y-r.top)/r.height)};el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);f(e)});el.addEventListener('pointermove',e=>{if(e.buttons)f(e)});el.addEventListener('touchstart',f,{passive:false});el.addEventListener('touchmove',f,{passive:false})}
lever(document.getElementById('throttle'),'throttle');lever(document.getElementById('brake'),'brake');
document.getElementById('camBtn').onclick=()=>{camera=(camera+1)%3;document.getElementById('camBtn').textContent=['CAB','CHASE','TRACKSIDE'][camera]};document.getElementById('doorsBtn').onclick=e=>{if(v<.3){doors=!doors;e.target.classList.toggle('active',doors);try{new Audio('audio/door_chime.wav').play()}catch(_){}}};document.getElementById('hornBtn').onpointerdown=()=>{try{let a=new Audio('audio/horn.wav');a.volume=.55;a.play()}catch(_){}};
document.getElementById('emergencyBtn').onclick=()=>{throttle=0;brake=1;setLever('throttle',0);setLever('brake',1)};
window.WorldRailDrive={start(){document.getElementById('driveView').classList.add('open');running=true;last=performance.now();resize();requestAnimationFrame(function tick(t){let dt=Math.min(.05,(t-last)/1000);last=t;update(dt);if(running)requestAnimationFrame(tick)});draw()},stop(){running=false;document.getElementById('driveView').classList.remove('open')}};
})();
