(()=>{"use strict";
const C=document.getElementById("gl"),S=document.getElementById("status"),B=document.getElementById("boot"),E=document.getElementById("err"),FPS=document.getElementById("fps"),OBJ=document.getElementById("objects"),PLACE=document.getElementById("place");
let gl,prog,u={},buf={},W,H,scale=1.45,last=performance.now(),frames=0,fpt=last,yaw=0,pitch=-.12,px=0,pz=20,joyX=0,joyY=0,drag=null,world=[],visible=0;
function fail(s){E.style.display="block";E.textContent=s;S.textContent="Failed";console.error(s)}
try{gl=C.getContext("webgl2",{alpha:false,antialias:false,depth:true,powerPreference:"high-performance"})||C.getContext("webgl",{alpha:false,antialias:false,depth:true,powerPreference:"high-performance"});if(!gl)throw Error("This Safari session did not provide WebGL.");
const vs=`attribute vec3 aP;attribute vec3 aN;uniform mat4 uVP;uniform vec3 uT;uniform vec3 uS;uniform float uY;varying vec3 vN;varying vec3 vW;
void main(){float c=cos(uY),s=sin(uY);vec3 p=aP*uS;vec3 q=vec3(p.x*c-p.z*s,p.y,p.x*s+p.z*c)+uT;vec3 n=normalize(vec3(aN.x*c-aN.z*s,aN.y,aN.x*s+aN.z*c));vN=n;vW=q;gl_Position=uVP*vec4(q,1.);}`;
const fs=`precision mediump float;varying vec3 vN;varying vec3 vW;uniform vec3 uColor;uniform vec3 uCam;uniform float uFog;
void main(){vec3 sun=normalize(vec3(-.45,.82,.32));float nd=max(dot(normalize(vN),sun),0.);float hemi=.34+.28*max(vN.y,0.);float rim=pow(1.-max(dot(normalize(uCam-vW),normalize(vN)),0.),3.)*.08;vec3 col=uColor*(hemi+nd*.72)+rim;float d=distance(vW,uCam);float f=smoothstep(uFog*.55,uFog,d);vec3 fog=vec3(.55,.69,.77);col=mix(col,fog,f);col=col/(col+vec3(.32));col=pow(col,vec3(.92));gl_FragColor=vec4(col,1.);}`;
function shader(t,s){let q=gl.createShader(t);gl.shaderSource(q,s);gl.compileShader(q);if(!gl.getShaderParameter(q,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(q));return q}
prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vs));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);
["uVP","uT","uS","uY","uColor","uCam","uFog"].forEach(k=>u[k]=gl.getUniformLocation(prog,k));let aP=gl.getAttribLocation(prog,"aP"),aN=gl.getAttribLocation(prog,"aN");
function mesh(name,P,N,I){let b={n:I.length};b.p=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b.p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(P),gl.STATIC_DRAW);b.nm=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b.nm);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(N),gl.STATIC_DRAW);b.i=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(I),gl.STATIC_DRAW);buf[name]=b}
const CP=[-1,-1,-1,1,-1,-1,1,1,-1,-1,1,-1,-1,-1,1,1,-1,1,1,1,1,-1,1,1],CI=[0,1,2,0,2,3,5,4,7,5,7,6,4,0,3,4,3,7,1,5,6,1,6,2,3,2,6,3,6,7,4,5,1,4,1,0],CN=[];for(let i=0;i<8;i++){let x=CP[i*3],y=CP[i*3+1],z=CP[i*3+2],l=Math.hypot(x,y,z);CN.push(x/l,y/l,z/l)}mesh("cube",CP,CN,CI);
let P=[0,1,0],N=[0,1,0],I=[];for(let i=0;i<12;i++){let a=i/12*Math.PI*2;P.push(Math.cos(a),0,Math.sin(a));N.push(Math.cos(a)*.5,.5,Math.sin(a)*.5)}for(let i=0;i<12;i++)I.push(0,1+i,1+(i+1)%12);mesh("cone",P,N,I);
gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
function add(type,x,y,z,sx,sy,sz,c,yaw=0,tag=""){world.push({type,x,y,z,sx,sy,sz,c,yaw,tag})}
function rng(n){let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
// deterministic 7x7 streamed-feeling world: road, rail, town, forest, rocks, moving vehicles
for(let z=-7;z<=7;z++)for(let x=-7;x<=7;x++){let X=x*34,Z=z*34,r=rng(x*91+z*37);
 if(Math.abs(x)>1&&r>.28){for(let k=0;k<3;k++){let ox=(rng(r*900+k)*2-1)*14,oz=(rng(r*1700+k)*2-1)*14;add("cube",X+ox,2.2,Z+oz,1.0,2.2,1.0,[.27,.18,.10]);add("cone",X+ox,6,Z+oz,3.2,5.0,3.2,[.12+.08*rng(k+r),.32+.12*r,.12])}}
 if(r<.18&&Math.abs(x)>2){for(let k=0;k<2;k++){let ox=(rng(k+r*77)*2-1)*12,oz=(rng(k+r*99)*2-1)*12;add("cube",X+ox,1.1,Z+oz,2.2,1.1,1.8,[.34,.35,.34],r*3)}}
}
// road along Z, sidewalks/buildings
add("cube",0,-.15,0,5.5,.12,270,[.12,.13,.14]);add("cube",-7,.05,0,1,.16,270,[.45,.44,.41]);add("cube",7,.05,0,1,.16,270,[.45,.44,.41]);
for(let z=-220;z<=220;z+=24){for(let side of [-1,1]){let h=5+rng(z*side)*18,w=5+rng(z+3)*5;add("cube",side*(14+w/2),h/2,z,w/2,h/2,7,[.28+rng(z)*.25,.30+rng(z+4)*.18,.32+rng(z+9)*.14],0,"building")}}
// rail crossing east-west at z=55: ballast, sleepers, rails
add("cube",0,.05,55,260,.12,3.5,[.30,.27,.23]);for(let x=-245;x<=245;x+=3){add("cube",x,.22,55,1.1,.10,2.8,[.28,.18,.10])}for(let dz of [-1.15,1.15])add("cube",0,.42,55+dz,260,.08,.07,[.34,.36,.38]);
// cars and train
for(let i=0;i<10;i++)add("cube",i%2?2.6:-2.6,.65,-180+i*36,1.0,.55,2.0,[rng(i),.15+.5*rng(i+2),.2+.5*rng(i+5)],0,"car");
for(let i=0;i<5;i++)add("cube",-150-i*9,1.55,55,4.0,1.45,1.5,[.42,.46,.49],Math.PI/2,"train");
function resize(){W=innerWidth;H=innerHeight;C.width=Math.floor(W*devicePixelRatio/scale);C.height=Math.floor(H*devicePixelRatio/scale);gl.viewport(0,0,C.width,C.height)}addEventListener("resize",resize);resize();
function mat4Perspective(fov,asp,n,f){let t=1/Math.tan(fov/2),o=new Float32Array(16);o[0]=t/asp;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o}
function mul(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=a[k*4+r]*b[c*4+k];o[c*4+r]=v}return o}
function view(){let cp=Math.cos(pitch),sp=Math.sin(pitch),cy=Math.cos(yaw),sy=Math.sin(yaw),fx=sy*cp,fy=sp,fz=cy*cp,rx=cy,rz=-sy,ux=-sy*sp,uy=cp,uz=-cy*sp;let o=new Float32Array([rx,ux,-fx,0,0,uy,-fy,0,rz,uz,-fz,0,0,0,0,1]);o[12]=-(rx*px+rz*pz);o[13]=-(ux*px+uy*2+uz*pz);o[14]=fx*px+fy*2+fz*pz;return o}
function draw(o,vp){let b=buf[o.type];gl.bindBuffer(gl.ARRAY_BUFFER,b.p);gl.vertexAttribPointer(aP,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(aP);gl.bindBuffer(gl.ARRAY_BUFFER,b.nm);gl.vertexAttribPointer(aN,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(aN);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.i);gl.uniform3f(u.uT,o.x,o.y,o.z);gl.uniform3f(u.uS,o.sx,o.sy,o.sz);gl.uniform1f(u.uY,o.yaw);gl.uniform3fv(u.uColor,o.c);gl.drawElements(gl.TRIANGLES,b.n,gl.UNSIGNED_SHORT,0)}
let first=true;
function frame(now){let dt=Math.min(.035,(now-last)/1000);last=now;let fwd=-joyY*20*dt,strafe=joyX*14*dt;px+=Math.sin(yaw)*fwd+Math.cos(yaw)*strafe;pz+=Math.cos(yaw)*fwd-Math.sin(yaw)*strafe;
 // moving traffic
 for(let o of world){if(o.tag==="car"){o.z+=((o.x>0)?-1:1)*8*dt;if(o.z>245)o.z=-245;if(o.z<-245)o.z=245}else if(o.tag==="train"){o.x+=13*dt;if(o.x>270)o.x=-270}}
 gl.clearColor(.55,.69,.77,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);let vp=mul(mat4Perspective(1.02,C.width/C.height,.15,390),view());gl.uniformMatrix4fv(u.uVP,false,vp);gl.uniform3f(u.uCam,px,2,pz);gl.uniform1f(u.uFog,350);visible=0;
 for(let o of world){let d=(o.x-px)**2+(o.z-pz)**2;if(d<350*350){draw(o,vp);visible++}}
 OBJ.textContent=visible;PLACE.textContent=Math.abs(px)<45?"MAIN STREET":Math.abs(pz-55)<25?"RAIL DISTRICT":"WILDERNESS";
 frames++;if(now-fpt>900){let fps=frames*1000/(now-fpt);FPS.textContent=Math.round(fps);if(fps<27&&scale<2.3){scale+=.12;resize()}else if(fps>48&&scale>1.2){scale-=.06;resize()}frames=0;fpt=now}if(first){first=false;B.style.display="none"}requestAnimationFrame(frame)}
// joystick
const stick=document.getElementById("stick"),nub=document.getElementById("nub");function joy(e){let r=stick.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),l=Math.hypot(x,y),m=Math.min(42,l),nx=l?x/l:0,ny=l?y/l:0;joyX=nx*m/42;joyY=ny*m/42;nub.style.transform=`translate(${nx*m}px,${ny*m}px)`}
stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);joy(e)};stick.onpointermove=e=>{if(e.buttons)joy(e)};stick.onpointerup=stick.onpointercancel=()=>{joyX=joyY=0;nub.style.transform=""};
C.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY}};C.onpointermove=e=>{if(drag&&e.buttons){yaw-=(e.clientX-drag.x)*.004;pitch=Math.max(-.65,Math.min(.5,pitch-(e.clientY-drag.y)*.003));drag={x:e.clientX,y:e.clientY}}};C.onpointerup=C.onpointercancel=()=>drag=null;
requestAnimationFrame(frame);
}catch(e){fail("Native WebGL startup error: "+(e.message||e))}
})();