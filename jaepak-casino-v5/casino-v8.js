/* JAEPARK CASINO V8 — physical roulette / genuine WebGL scene / CSS 3D cylinder slot reels.
 * Visual demo only. No real-money gaming. No certified RNG/return-to-player values.
 */
(function(){
'use strict';
const TAU=Math.PI*2, SECTOR=TAU/37, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=(v,m)=>((v%m)+m)%m, rand=()=>{let a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296};
const randIn=(a,b)=>a+(b-a)*rand();
const FMT=n=>Math.round(n).toLocaleString('ko-KR');
const E=(s)=>document.querySelector(s);
const oldRouletteRender=renderRoulette;
const oldRouletteSpin=spinRoulette;
const oldSlotGuide=gameGuide;
const oldSlotSwitch=switchSlot;

/* Small deterministic fixed-timestep movement model. Wheel/ball results are taken from the
   final ball/rotor relative angle. This is a gameplay physics approximation, not a certified
   rigid-body solver or a physical casino wheel. */
class RouletteDynamics {
 constructor(phase=0){
  this.t=0;this.wheel=phase;this.wheelW=randIn(-2.05,-1.85);
  this.ballA=randIn(-Math.PI,Math.PI);this.ballR=4.32;this.ballW=randIn(6.5,8.8);
  this.rV=0;this.h=.48;this.hV=0;this.hop=0;this.cooldown=0;
  this.bumpers=0;this.pocketHits=0;this.lastWedge=null;this.phase='outside';
  this.done=false;this.finalNum=null;this.finalIndex=null;this.initial={a:this.ballA,w:this.ballW};
 }
 get pocketIndex(){return Math.floor(wrap(this.ballA-this.wheel+Math.PI/2,TAU)/SECTOR)%37}
 get pocketNumber(){return EUROPE_WHEEL[this.pocketIndex]}
 step(dt){
  if(this.done)return;
  const prevR=this.ballR, prevA=this.ballA;
  this.t+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
  this.wheel+=this.wheelW*dt;
  this.wheelW*=Math.exp(-.055*dt);
  const t=this.t;
  if(t<3.2){ // outer rim: rolling friction and radial constraint
   this.phase='outer';this.ballW*=Math.exp(-.135*dt);
   this.rV+=(4.32-this.ballR)*13*dt-this.rV*5*dt;
  } else if(t<6.9){ // inward spiral, gravity competes with centripetal inertia
   this.phase='drop';this.ballW*=Math.exp(-.31*dt);
   const desired=4.32-clamp((t-3.2)/3.6,0,1)*1.05;
   this.rV+=(desired-this.ballR)*6.6*dt-this.rV*2.2*dt;
  } else { // enters rotating pockets / dividers
   this.phase='pocket';this.ballW+= (this.wheelW-this.ballW)*(t>10?2.45:.9)*dt;
   const desired=t<9.4?3.28:3.04;
   this.rV+=(desired-this.ballR)*10*dt-this.rV*3.9*dt;
  }
  this.ballA+=this.ballW*dt;
  this.ballR=clamp(this.ballR+this.rV*dt,2.98,4.37);
  if(t>=4.0 && t<8.15 && this.ballR<3.83 && this.ballR>3.42 && this.cooldown<=0){
   // eight metal deflectors attached to the stationary bowl. A ball crossing a
   // deflector receives outward normal impulse and tangential momentum loss.
   for(let i=0;i<8;i++){
    const a=i*TAU/8+.22;
    const delta=Math.atan2(Math.sin(this.ballA-a),Math.cos(this.ballA-a));
    const pd=Math.atan2(Math.sin(prevA-a),Math.cos(prevA-a));
    if(Math.abs(delta)<.18 || Math.sign(delta)!==Math.sign(pd) && Math.abs(delta)<.38){
     this.ballR=clamp(this.ballR+.045,2.98,4.37);
     this.rV=randIn(.34,.76);this.ballW*=randIn(.67,.89);this.ballW+=randIn(-.43,.43);
     this.hV=randIn(.28,.58);this.hop=Math.max(this.hop,.06);
     this.cooldown=.21;this.bumpers++;break;
    }
   }
  }
  if(this.ballR<=3.31 && t>6.8){
    const wedge=this.pocketIndex;
    if(this.lastWedge!==null && wedge!==this.lastWedge && this.cooldown<=0 && t<10.3){
      // pocket divider collisions are calculated in the rotating reference frame
      this.ballW=this.wheelW+(this.ballW-this.wheelW)*randIn(.47,.75);
      this.ballW+=randIn(-.19,.19);
      this.hV=randIn(.21,.46);this.rV+=randIn(.04,.19);
      this.pocketHits++;this.cooldown=.12;
    }
    this.lastWedge=wedge;
  }
  this.hV-=4.6*dt;
  this.hop=Math.max(0,this.hop+this.hV*dt);
  if(this.hop===0 && this.hV<0)this.hV=0;
  this.h=clamp(.18+Math.max(0,this.ballR-3.1)*.21+this.hop,.19,.62);
  // settle continuously into the sector in which the physical movement leaves the ball.
  if(t>11.0){
   const idx=this.pocketIndex;
   const center=this.wheel-Math.PI/2+(idx+.5)*SECTOR;
   const delta=Math.atan2(Math.sin(center-this.ballA),Math.cos(center-this.ballA));
   this.ballA+=delta*Math.min(1,2.6*dt);
   this.ballW=this.wheelW+(this.ballW-this.wheelW)*Math.exp(-4.4*dt);
  }
  if(t>13.2){
   this.done=true;this.finalIndex=this.pocketIndex;this.finalNum=EUROPE_WHEEL[this.finalIndex];
   this.ballR=3.04;this.rV=0;this.h=.19;
  }
 }
}

/* No dependency/CDN required: true WebGL meshes, perspective camera, shaded metal,
   real three-dimensional geometry for spinning wheel, pegs, ball, rim and spindle. */
const M4={
 id(){const o=new Float32Array(16);o[0]=o[5]=o[10]=o[15]=1;return o},
 mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o},
 tr(x=0,y=0,z=0){const m=this.id();m[12]=x;m[13]=y;m[14]=z;return m},
 scale(x=1,y=x,z=x){const m=this.id();m[0]=x;m[5]=y;m[10]=z;return m},
 ry(a){const m=this.id(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m},
 persp(fov,asp,n,f){const m=new Float32Array(16),z=1/Math.tan(fov/2);m[0]=z/asp;m[5]=z;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m},
 look(eye,target){let zz=[eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]],l=Math.hypot(...zz);zz=zz.map(x=>x/l);let xx=[zz[2],0,-zz[0]];l=Math.hypot(...xx);xx=xx.map(x=>x/l);const yy=[zz[1]*xx[2]-zz[2]*xx[1],zz[2]*xx[0]-zz[0]*xx[2],zz[0]*xx[1]-zz[1]*xx[0]];const m=this.id();m[0]=xx[0];m[1]=yy[0];m[2]=zz[0];m[4]=xx[1];m[5]=yy[1];m[6]=zz[1];m[8]=xx[2];m[9]=yy[2];m[10]=zz[2];m[12]=-(xx[0]*eye[0]+xx[1]*eye[1]+xx[2]*eye[2]);m[13]=-(yy[0]*eye[0]+yy[1]*eye[1]+yy[2]*eye[2]);m[14]=-(zz[0]*eye[0]+zz[1]*eye[1]+zz[2]*eye[2]);return m}
};
const GEO={
 disc(r=1,n=120){let vs=[],is=[];function p(x,y,z,nx,ny,nz,u,v){vs.push(x,y,z,nx,ny,nz,u,v)}p(0,0,0,0,1,0,.5,.5);for(let i=0;i<=n;i++){let a=i*TAU/n,x=Math.cos(a),z=Math.sin(a);p(x*r,0,z*r,0,1,0,.5+x*.5,.5+z*.5);if(i>=1)is.push(0,i,i+1)}return {vs,is}},
 ring(inner,outer,n=112,hin=0,hout=0){let vs=[],is=[];for(let i=0;i<=n;i++){let a=i*TAU/n,x=Math.cos(a),z=Math.sin(a);vs.push(inner*x,hin,inner*z,0,1,0,.5+x*inner/(2*outer),.5+z*inner/(2*outer),outer*x,hout,outer*z,0,1,0,.5+x*.5,.5+z*.5);if(i<n){let j=i*2;is.push(j,j+1,j+3,j,j+3,j+2)}}return {vs,is}},
 torus(R,r,ns=100,nt=12){let vs=[],is=[];for(let i=0;i<=ns;i++)for(let j=0;j<=nt;j++){let a=TAU*i/ns,b=TAU*j/nt,c=Math.cos(a),s=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);vs.push((R+r*cb)*c,r*sb,(R+r*cb)*s,cb*c,sb,cb*s,i/ns,j/nt)}for(let i=0;i<ns;i++)for(let j=0;j<nt;j++){let a=i*(nt+1)+j,b=a+nt+1;is.push(a,a+1,b+1,a,b+1,b)}return {vs,is}},
 sphere(r=1,lat=12,lon=18){let vs=[],is=[];for(let y=0;y<=lat;y++)for(let x=0;x<=lon;x++){let a=y*Math.PI/lat,b=x*TAU/lon,sy=Math.cos(a),sx=Math.sin(a)*Math.cos(b),sz=Math.sin(a)*Math.sin(b);vs.push(sx*r,sy*r,sz*r,sx,sy,sz,x/lon,y/lat)}for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){let i=y*(lon+1)+x;is.push(i,i+lon+1,i+1,i+1,i+lon+1,i+lon+2)}return {vs,is}},
 box(){const vs=[],is=[],data=[[[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]],[[1,0,0],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]],[[-1,0,0],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]],[[0,1,0],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]],[[0,-1,0],[[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1]]]];data.forEach(([n,corners])=>{const k=vs.length/8;corners.forEach((p,i)=>vs.push(...p,...n,i%2,(i>>1)));is.push(k,k+1,k+2,k,k+2,k+3)});return {vs,is}}
};
class RouletteGL {
 constructor(){
  this.canvas=document.createElement('canvas');this.canvas.className='v8-webgl';this.canvas.setAttribute('aria-label','회전 휠과 튕기는 공이 있는 3D 룰렛');this.gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'high-performance',premultipliedAlpha:false});
  if(!this.gl)throw Error('WebGL unavailable');const gl=this.gl;
  const vert=`attribute vec3 aP; attribute vec3 aN; attribute vec2 aUV; uniform mat4 uVP,uModel; varying vec3 vN,vP; varying vec2 vUV; void main(){vec4 w=uModel*vec4(aP,1.);vP=w.xyz;vN=mat3(uModel)*aN;vUV=aUV;gl_Position=uVP*w;}`;
  const frag=`precision mediump float;varying vec3 vN,vP;varying vec2 vUV; uniform vec4 uColor;uniform float uTextured,uMetal;uniform sampler2D uTex;void main(){vec3 n=normalize(vN),light=normalize(vec3(-.45,.85,.6)),view=normalize(vec3(0.,7.,9.)-vP);float nd=max(dot(n,light),0.0);float spec=pow(max(dot(reflect(-light,n),view),0.0),uMetal>0.5?46.0:18.0);float hemi=n.y*.16+.22;vec4 tex=texture2D(uTex,vUV);vec3 base=mix(uColor.rgb,tex.rgb*uColor.rgb,uTextured);vec3 c=base*(.45+.43*nd+hemi)+spec*mix(vec3(.28),vec3(.88,.70,.38),uMetal);c+=pow(max(dot(n,normalize(vec3(.65,.8,-.3))),0.0),16.0)*.13*uMetal;gl_FragColor=vec4(min(c,vec3(1.)),uColor.a);}`;
  const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
  this.pr=gl.createProgram();gl.attachShader(this.pr,shader(gl.VERTEX_SHADER,vert));gl.attachShader(this.pr,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(this.pr);if(!gl.getProgramParameter(this.pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.pr));
  gl.useProgram(this.pr);this.uni={};['uVP','uModel','uColor','uTextured','uMetal','uTex'].forEach(k=>this.uni[k]=gl.getUniformLocation(this.pr,k));this.att={p:gl.getAttribLocation(this.pr,'aP'),n:gl.getAttribLocation(this.pr,'aN'),uv:gl.getAttribLocation(this.pr,'aUV')};
  this.mesh={disc:this.make(GEO.disc(3.4)),under:this.make(GEO.disc(5.05)),rim:this.make(GEO.torus(4.67,.23)),outer:this.make(GEO.ring(3.4,4.60,128,.08,.42)),inner:this.make(GEO.torus(3.44,.08)),track:this.make(GEO.torus(4.35,.1)),peg:this.make(GEO.sphere(.12)),ball:this.make(GEO.sphere(.13,20,28)),spindle:this.make(GEO.sphere(.51,14,24)),cap:this.make(GEO.sphere(.2)),divider:this.make(GEO.box()),shadow:this.make(GEO.disc(.19)),led:this.make(GEO.torus(5.02,.055))};
  this.texture=this.makeTexture();gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  this.physics=new RouletteDynamics(randIn(-TAU,TAU));this.animating=false;this.playing=false;this.onFinish=null;this.last=0;this.acc=0;this.req=0;this.destroyed=false;
 }
 make(o){const gl=this.gl,v=gl.createBuffer(),i=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,v);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(o.vs),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(o.is),gl.STATIC_DRAW);return {v,i,count:o.is.length}}
 makeTexture(){const gl=this.gl;try{if(!rouletteStaticWheel)buildRouletteStatic()}catch(e){console.warn('wheel texture fallback',e)}const source=rouletteStaticWheel||document.createElement('canvas'),t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);if(source.width)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([140,85,35,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}
 attach(stage){if(this.destroyed)return;stage.appendChild(this.canvas);this.resize();this.draw();if(this.playing&&!this.animating)this.startLoop()}
 resize(){if(!this.canvas.parentElement)return;const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.75),w=Math.max(200,Math.round(rect.width*dpr)),h=Math.max(110,Math.round(rect.height*dpr));if(w===this.canvas.width && h===this.canvas.height)return;this.canvas.width=w;this.canvas.height=h;this.gl.viewport(0,0,w,h)}
 put(m,color,model,tex=false,metal=false){const gl=this.gl,u=this.uni,a=this.att;gl.bindBuffer(gl.ARRAY_BUFFER,m.v);gl.vertexAttribPointer(a.p,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(a.n,3,gl.FLOAT,false,32,12);gl.vertexAttribPointer(a.uv,2,gl.FLOAT,false,32,24);gl.enableVertexAttribArray(a.p);gl.enableVertexAttribArray(a.n);gl.enableVertexAttribArray(a.uv);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.i);gl.uniformMatrix4fv(u.uModel,false,model);gl.uniform4fv(u.uColor,color);gl.uniform1f(u.uTextured,tex?1:0);gl.uniform1f(u.uMetal,metal?1:0);gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0)}
 draw(){if(!this.canvas.isConnected)return;this.resize();const gl=this.gl;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.pr);const aspect=this.canvas.width/this.canvas.height;
  const cam=aspect<1.65?[0,8.9,9.0]:[0,7.6,9.7];let vp=M4.mul(M4.persp(aspect<1.65?.88:.78,aspect,.1,70),M4.look(cam,[0,0,0]));gl.uniformMatrix4fv(this.uni.uVP,false,vp);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uni.uTex,0);
  const tr=(x,y,z,sx=1,sy=sx,sz=sx)=>M4.mul(M4.tr(x,y,z),M4.scale(sx,sy,sz));
  this.put(this.mesh.under,[.12,.22,.165,1],tr(0,-.36,0),false,false);
  this.put(this.mesh.outer,[.27,.14,.075,1],M4.id(),false,true);
  this.put(this.mesh.rim,[.78,.49,.20,1],tr(0,.33,0),false,true);
  this.put(this.mesh.led,[.9,.65,.28,1],tr(0,.36,0),false,true);
  this.put(this.mesh.track,[.51,.37,.21,1],tr(0,.43,0),false,true);
  const rot=M4.ry(-this.physics.wheel);
  this.put(this.mesh.disc,[1,1,1,1],M4.mul(M4.tr(0,.09,0),rot),true,true);
  this.put(this.mesh.inner,[.95,.71,.32,1],M4.mul(M4.tr(0,.15,0),rot),false,true);
  this.put(this.mesh.spindle,[.78,.48,.20,1],M4.mul(M4.tr(0,.47,0),M4.scale(.62,1.45,.62)),false,true);
  this.put(this.mesh.cap,[1,.82,.33,1],tr(0,1.10,0),false,true);
  for(let k=0;k<8;k++){let a=k*TAU/8+.22;this.put(this.mesh.peg,[.91,.78,.53,1],tr(Math.cos(a)*3.71,.38,Math.sin(a)*3.71,.9,.5,.9),false,true)}
  // 37 genuine 3D rotor pocket dividers create a visible sense of moving depth.
  for(let k=0;k<37;k++){let a=k*SECTOR-Math.PI/2+this.physics.wheel,r=3.01;let model=M4.mul(M4.tr(Math.cos(a)*r,.23,Math.sin(a)*r),M4.mul(M4.ry(-a),M4.scale(.027,.07,.35)));this.put(this.mesh.divider,[.70,.49,.22,1],model,false,true)}
  const b=this.physics;this.put(this.mesh.shadow,[.0,.0,.0,.26],tr(Math.cos(b.ballA)*b.ballR,.11,Math.sin(b.ballA)*b.ballR),false,false);
  this.put(this.mesh.ball,[.96,.95,.83,1],tr(Math.cos(b.ballA)*b.ballR,b.h,Math.sin(b.ballA)*b.ballR),false,true);
 }
 loop=(now)=>{if(this.destroyed)return;if(!this.canvas.isConnected){this.animating=false;return;}const dt=this.last?clamp((now-this.last)/1000,0,.045):.016;this.last=now;if(this.playing){this.acc+=dt;let count=0;while(this.acc>=1/120 && count++<8){this.acc-=1/120;this.physics.step(1/120)}if(this.physics.done){this.playing=false;this.onFinish?.(this.physics.finalNum,this.physics);this.onFinish=null}}this.draw();if(!this.playing){this.animating=false;this.req=0;return;}this.req=requestAnimationFrame(this.loop)}
 startLoop(){if(this.animating)return;this.animating=true;this.last=0;this.req=requestAnimationFrame(this.loop)}
 spin(done){this.physics=new RouletteDynamics(this.physics.wheel);this.onFinish=done;this.playing=true;this.acc=0;this.last=0;this.startLoop()}
 release(){this.destroyed=true;cancelAnimationFrame(this.req);const gl=this.gl;Object.values(this.mesh).forEach(m=>{gl.deleteBuffer(m.v);gl.deleteBuffer(m.i)});gl.deleteTexture(this.texture);gl.deleteProgram(this.pr);this.canvas.remove()}
}
let glWheel=null;
function ensureWheel(){const stage=E('.r-wheel-stage');if(!stage)return;try{
 if(!glWheel||glWheel.destroyed)glWheel=new RouletteGL();glWheel.attach(stage);
 stage.querySelector('#realWheel')?.classList.add('v8-hidden-wheel');
 }catch(e){console.warn('3D roulette fallback',e);glWheel=null;E('.r-wheel-stage')?.classList.add('v8-canvas-fallback');}}
function showMoneyOnTable(gross,stake,kind,forSlot=false){
 const root=forSlot?E('.v8-slot-reels'):E('.r-scene');if(!root)return;
 root.querySelector('.v8-money-pop')?.remove();
 let profit=gross-stake;
 const el=document.createElement('div');el.className='v8-money-pop'+(gross?' won':' lost');el.innerHTML=`<div class="v8-pop-eyebrow">${gross?'✦ '+(gross>=stake*10?'MEGA WIN':gross>=stake*3?'BIG WIN':'WIN')+' ✦':'NO WIN'}</div><strong>${gross?'+'+FMT(gross):'0'} <small>칩 지급</small></strong><div class="v8-pop-meta">${gross?'순이익 '+(profit>=0?'+':'')+FMT(profit):'베팅 '+FMT(stake)+'칩'} · 총 지급 ${FMT(gross)}칩</div>`;
 root.appendChild(el);setTimeout(()=>el.isConnected&&el.classList.add('leave'),3800);setTimeout(()=>el.remove(),4200)
}
renderRoulette=function(){oldRouletteRender();const stage=E('.r-wheel-stage');if(stage){const prior=E('.r-scene .v8-spin-meta');prior?.remove();let hint=document.createElement('div');hint.className='v8-spin-meta';hint.textContent='LIVE 3D · ROULETTE';stage.appendChild(hint)}requestAnimationFrame(ensureWheel)};
spinRoulette=function(){
 if(rouletteRunning||!rouletteBets.length)return;
 const stake=rTotal();if(state.money<stake){alert('칩이 부족합니다.');return}
 if(!glWheel){ // only when browser disables WebGL; still use smooth nonteleporting dynamics
   return rouletteFallbackPhysical(stake);
 }
 changeMoney(-stake);rouletteRunning=true;rouletteResult='';
 const action=E('#action'),status=E('#wheelStatus');if(action){action.disabled=true;action.textContent='◉ 공이 회전 중...'}if(status)status.textContent='공이 림을 따라 회전 중 · 최종 포켓까지 관찰하세요';
 sound('spin');v8Audio.rimStart();
 const committed=rouletteBets.map(x=>({...x}));
 glWheel.spin((num,physics)=>{
  v8Audio.rimStop();if(status)status.textContent=`✦ 당첨 번호 ${num} · ${num===0?'초록':R_RED.has(num)?'빨강':'검정'}`;
  const pay=committed.reduce((a,b)=>a+(rWin(b.choice,num)?b.amt*rMultiplier(b.choice):0),0);
  changeMoney(pay);rouletteResult=`${num}번 · 지급 ${FMT(pay)}칩 · 순손익 ${pay-stake>=0?'+':''}${FMT(pay-stake)}칩`;
  rouletteRunning=false;rouletteBets=[];rouletteResult=rouletteResult;
  showMoneyOnTable(pay,stake,'roulette');
  const result=E('#result');if(result)result.textContent=rouletteResult;
  if(pay){sound('win');v8Audio.win(pay/stake);setTicker(state.name+'님이 룰렛에서 '+FMT(pay)+'칩 당첨!')}
  if(action){action.disabled=false;action.textContent='✦ 다시 베팅하기 ✦';action.onclick=()=>renderRoulette()}
  store();
 });
};
function rouletteFallbackPhysical(stake){
 changeMoney(-stake);rouletteRunning=true;const committed=rouletteBets.map(x=>({...x}));const dyn=new RouletteDynamics(rouletteAngle);let last=0,acc=0,lastPaint=0;
 const act=E('#action');if(act){act.disabled=true;act.textContent='◉ 룰렛 회전 중...'}
 function tick(t){let dt=last?clamp((t-last)/1000,0,.04):.016;last=t;acc+=dt;while(acc>1/120){dyn.step(1/120);acc-=1/120}rouletteAngle=dyn.wheel;rouletteBall=dyn.ballA;rouletteBallRad=dyn.ballR/4.32*248;if(t-lastPaint>55 || dyn.done){rDrawWheel(dyn.wheel,dyn.ballA,rouletteBallRad);lastPaint=t}if(!dyn.done){requestAnimationFrame(tick);return}
 const num=dyn.finalNum;let pay=committed.reduce((a,b)=>a+(rWin(b.choice,num)?b.amt*rMultiplier(b.choice):0),0);changeMoney(pay);rouletteRunning=false;rouletteBets=[];rouletteResult=`${num}번 · 지급 ${FMT(pay)}칩 · 순손익 ${pay-stake>=0?'+':''}${FMT(pay-stake)}칩`;showMoneyOnTable(pay,stake,'roulette');if(E('#result'))E('#result').textContent=rouletteResult;if(act){act.disabled=false;act.textContent='✦ 다시 베팅하기 ✦';act.onclick=()=>renderRoulette()}if(pay)v8Audio.win(pay/stake)
 }requestAnimationFrame(tick)
}

/* V8 audio: synthesized wheel rattle, impacts, sequential reel stops and win chords.
   Audio is user opt-in and will never autoplay without a gesture. */
const v8Audio={ctx:null,rumble:null, enabled(){return !!state.sound},get(){if(!this.enabled())return null;try{this.ctx||=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();return this.ctx}catch(e){return null}}, tone(freq=550,dur=.15,type='sine',vol=.035,delay=0){const c=this.get();if(!c)return;const o=c.createOscillator(),g=c.createGain(),n=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,n);g.gain.setValueAtTime(vol,n);g.gain.exponentialRampToValueAtTime(.0001,n+dur);o.connect(g);g.connect(c.destination);o.start(n);o.stop(n+dur+.02)},rimStart(){const c=this.get();if(!c)return;this.rimStop();const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=135;g.gain.value=.008;o.connect(g);g.connect(c.destination);o.start();this.rumble={o,g};},rimStop(){if(!this.rumble)return;try{let c=this.ctx,g=this.rumble.g;g.gain.setTargetAtTime(.0001,c.currentTime,.05);this.rumble.o.stop(c.currentTime+.3)}catch(e){}this.rumble=null},reelStop(i){this.tone(160+i*18,.13,'triangle',.055);this.tone(460-i*45,.08,'sine',.02,.05)},impact(){this.tone(340,.075,'square',.015);this.tone(190,.07,'triangle',.02,.03)},win(mul){[523,659,784,1046].forEach((f,i)=>this.tone(f,.28,'sine',.05,i*.09));if(mul>=5)[1318,1568].forEach((f,i)=>this.tone(f,.3,'sine',.04,.45+i*.1))},coin(){this.tone(730,.08,'triangle',.018)}};


/* Three distinct mechanical 3D slot machines. Faces are placed along a real CSS
   cylindrical surface. Rendered symbols, win lines and money are computed from
   the EXACT stop indices of those cylinders. */
const SLOT_STEPS=12,SLOT_DEG=360/SLOT_STEPS;
const SLOT_NAMES=['CRIMSON SEVEN','EMERALD FORTUNE','MIDNIGHT ROYALE'];
const PAY_MULT={seven:92,crown:38,diamond:24,bell:18,bar:14,star:12,cherry:11,clover:9};
const SLOT_WEIGHTS=[.105,.175,.145,.15,.095,.13,.11,.09];
function pickSymbol(){let x=rand();for(let i=0;i<SLOT_WEIGHTS.length;i++){x-=SLOT_WEIGHTS[i];if(x<=0)return i}return 7}
let slot3d=null,slot3dPr=null,slotFinishTimer=null;
function newSlotMachine(idx){
 const d=slotDefs[idx];return {idx,spins:0,reels:Array.from({length:d.cols},()=>({symbols:Array.from({length:SLOT_STEPS},pickSymbol),stop:Math.floor(rand()*SLOT_STEPS),angle:0}))};
}
function ensureSlotMachine(){if(!slot3d||slot3d.idx!==state.slotIndex)slot3d=newSlotMachine(state.slotIndex);}
function slotSymbol(reel,row){const delta=row===0?1:row===1?0:-1;return reel.symbols[wrap(reel.stop+delta,SLOT_STEPS)]}
function slotFace(sym,i){let id=icons[sym];return `<div class="v8-reel-face" style="--face:${i};"><img src="${asset(id)}" alt="${id}" draggable="false"></div>`}
function slot3DHTML(d){ensureSlotMachine();const rowClass=d.rows===1?'one-row':'three-row',colClass=d.cols===5?'five-col':'three-col';return `<div class="v8-slot-reels ${rowClass} ${colClass}" id="v8SlotReels" aria-label="3D 원통형 슬롯 릴">
 ${slot3d.reels.map((r,i)=>`<div class="v8-reel-window" data-reel="${i}"><div class="v8-reel-cylinder" id="v8Cylinder${i}" style="transform:rotateX(${-r.stop*SLOT_DEG}deg);">${r.symbols.map((s,j)=>slotFace(s,j)).join('')}</div><div class="v8-reel-shine"></div></div>`).join('')}
 <div class="v8-slot-prize" id="v8SlotPrize" aria-live="polite"></div><div class="v8-slot-coins" id="v8SlotCoins"></div>
 </div>`}
function refreshSlotText(){if(E('#v8BetAmount'))E('#v8BetAmount').textContent=FMT(state.chip)+'칩';if(E('#v8SlotStatus'))E('#v8SlotStatus').textContent=state.slotBusy?'릴 회전 중':'실제 사용 가능 여부는 서버 연결 후 반영';if(E('#v8AutoSpin'))E('#v8AutoSpin').textContent=state.autoLeft?'■ 오토스핀 중단':'▶ 오토스핀 10회'}
renderSlot=function(){
 const d=slotDefs[state.slotIndex],jp=state.jackpots[state.slotIndex];ensureSlotMachine();
 view(`<div class="slot v8-slot" data-v8-machine="${state.slotIndex}">
  ${stageHeading('✦ SLOT MACHINE ✦','slots')}
  <div class="v8-slot-switch">${slotDefs.map((x,i)=>`<button type="button" class="${state.slotIndex===i?'selected':''}" onclick="switchSlot(${i})" ${state.slotBusy?'disabled':''}>${['1×3','3×3','3×5'][i]}</button>`).join('')}</div>
  <div class="v8-cabinet" style="--cabinet-glow:${d.glow};--cabinet-dark:${d.color}">
   <div class="v8-bulbs" aria-hidden="true">${Array.from({length:19},()=>'<i></i>').join('')}</div>
   <div class="v8-slot-brand"><small>JAEPARK CASINO · CLASSIC</small><h2>${d.name}</h2></div>
   <div class="v8-jackpot-led">${['GRAND','MEGA','MINI'].map((n,i)=>`<div><span>${n}</span><b>${FMT(jp[i])}</b></div>`).join('')}</div>
   ${slot3DHTML(d)}
   <div class="v8-machine-foot"><small id="v8SlotStatus">실제 사용 가능 여부는 서버 연결 후 반영</small><button class="v8-spin-btn" id="spinBtn" onclick="spinSlot()" ${state.slotBusy?'disabled':''}>${state.slotBusy?'SPINNING…':'SPIN'}</button></div>
  </div>
  <div class="v8-slot-controls"><div class="v8-bet-row"><b>베팅</b><button onclick="adjustBet(-1)" ${state.slotBusy?'disabled':''} aria-label="베팅 감소">−</button><strong id="v8BetAmount">${FMT(state.chip)}칩</strong><button onclick="adjustBet(1)" ${state.slotBusy?'disabled':''} aria-label="베팅 증가">＋</button></div><div class="v8-bet-row"><button class="v8-utility" id="v8AutoSpin" onclick="toggleAuto()">${state.autoLeft?'■ 오토스핀 중단':'▶ 오토스핀 10회'}</button><button class="v8-utility" onclick="v8ToggleSound()">${state.sound?'🔊 효과음 켜짐':'🔇 효과음 꺼짐'}</button></div></div>
  <p class="v8-slot-disclosure">가상칩 데모 · 확률·잭팟은 인증된 카지노 게임이 아닙니다. 다중 사용자 점유는 서버 연결 전입니다.</p>
 </div>`);
};
function v8ToggleSound(){state.sound=!state.sound;if(!state.sound)v8Audio.rimStop();else v8Audio.get();renderSlot()}
switchSlot=function(i){if(state.slotBusy)return;state.slotIndex=i;state.reelImages=null;state.autoLeft=0;slot3d=newSlotMachine(i);renderSlot()};
toggleAuto=function(){if(state.autoLeft){state.autoLeft=0;refreshSlotText();return}if(state.slotBusy)return;state.autoLeft=10;spinSlot()};
function evaluateSlot(d,m){const rows=d.rows,cols=d.cols,lines=[];
 const at=(col,row)=>m[col][row];
 if(rows===1){lines.push([0,0,0].map((r,c)=>at(c,r)))}
 else {for(let row=0;row<3;row++)lines.push(Array.from({length:cols},(_,c)=>at(c,row)));
  lines.push(Array.from({length:cols},(_,c)=>at(c,Math.round(c*(2/(cols-1))))));lines.push(Array.from({length:cols},(_,c)=>at(c,2-Math.round(c*(2/(cols-1))))))}
 let payout=0,wins=[];
 lines.forEach((line,li)=>{const target=line[0];let matching=1;while(matching<line.length&&line[matching]===target)matching++;
  if(matching<3)return;
  const base=PAY_MULT[icons[target]];
  const fac=matching===3?1:matching===4?6:matching>=5?32:0;
  let multi=base*fac/(rows===1?1:(cols===3?12:22));
  payout+=multi;wins.push({li,multi,symbol:icons[target],matching});
 });
 return {multi:payout,wins};
}
function slotBetAmountChange(delta){if(state.slotBusy)return;const values=[1000,5000,10000,25000,50000,100000,250000,500000,1000000];const current=values.findIndex(v=>v>=state.chip);state.chip=values[clamp(current+delta,0,values.length-1)];refreshSlotText()}
adjustBet=function(delta){slotBetAmountChange(delta)};
spinSlot=function(){
 if(state.slotBusy)return;if(state.money<state.chip){state.autoLeft=0;alert('보유 칩이 부족합니다.');return}
 ensureSlotMachine();const bet=state.chip,d=slotDefs[state.slotIndex],machine=slot3d;
 state.slotBusy=true;changeMoney(-bet);state.autoLeft=Math.max(0,state.autoLeft-1);
 const spin=E('#spinBtn');if(spin){spin.disabled=true;spin.textContent='SPINNING…'}
 const status=E('#v8SlotStatus');if(status)status.textContent='릴이 회전하는 중';
 const winners=machine.reels.map(r=>Math.floor(rand()*SLOT_STEPS));
 v8Audio.rimStart();sound('spin');
 const anims=[];
 let finished=0;
 machine.reels.forEach((r,col)=>{
  const el=E('#v8Cylinder'+col);if(!el){finished++;return}
  const from=r.angle || -r.stop*SLOT_DEG;
  let to=-winners[col]*SLOT_DEG;
  while(to > from-1800)to-=360;
  const duration=2350+col*230;
  const anim=el.animate([{transform:`rotateX(${from}deg)`},{transform:`rotateX(${to}deg)`}],{duration,easing:'cubic-bezier(.12,.75,.16,1)',fill:'forwards'});
  anims.push(anim);
  anim.onfinish=()=>{
   el.style.transform=`rotateX(${to}deg)`;anim.cancel();r.stop=winners[col];r.angle=to;finished++;
   el.parentElement.classList.add('v8-reel-thump');setTimeout(()=>el.parentElement?.classList.remove('v8-reel-thump'),300);v8Audio.reelStop(col);
   if(finished===d.cols)reelsStopped()
  };
 });
 function reelsStopped(){v8Audio.rimStop();if(slot3d!==machine)return;
  machine.spins++;
  const matrix=machine.reels.map(r=>d.rows===1?[r.symbols[r.stop]]:[slotSymbol(r,0),slotSymbol(r,1),slotSymbol(r,2)]);
  const evald=evaluateSlot(d,matrix);
  let jp=state.jackpots[state.slotIndex];
  // independent jackpots belonging to THIS cabinet, incremented by wagers.
  jp[0]+=Math.floor(bet*.005);jp[1]+=Math.floor(bet*.003);jp[2]+=Math.floor(bet*.002);
  let jackpot=0,kind='';const center=matrix.map(c=>c[Math.floor(c.length/2)]);
  if(center.every(n=>n===0) && rand()<.001){jackpot=jp[0];kind='GRAND'}
  else if(center.slice(0,3).every(n=>n===0) && rand()<.004){jackpot=jp[1];kind='MEGA'}
  else if(rand()<.00015){jackpot=jp[2];kind='MINI'}
  if(jackpot){jp[{GRAND:0,MEGA:1,MINI:2}[kind]]=Math.floor(jp[{GRAND:0,MEGA:1,MINI:2}[kind]]*.35)}
  const payout=Math.round(bet*evald.multi)+jackpot;
  const jps=E('.v8-jackpot-led');if(jps)jps.querySelectorAll('b').forEach((el,i)=>el.textContent=FMT(jp[i]));
  if(payout>0){v8Audio.win(payout/bet);showSlotPrize(payout,bet,kind,evald.wins)}
  else finishSlotRound(0);
 }
};
function scatterCoins(count=20){const layer=E('#v8SlotCoins');if(!layer)return;layer.replaceChildren();for(let i=0;i<count;i++){const coin=document.createElement('i');coin.textContent='✦';coin.className='v8-gold-coin';coin.style.setProperty('--x',randIn(-165,165)+'px');coin.style.setProperty('--y',randIn(-160,100)+'px');coin.style.setProperty('--spin',(randIn(-2,2)*360)+'deg');coin.style.setProperty('--delay',randIn(0,.6)+'s');layer.appendChild(coin)}setTimeout(()=>{if(layer.isConnected)layer.replaceChildren()},3400)}
function showSlotPrize(gross,stake,jackpot,wins){
 const p=E('#v8SlotPrize');if(!p){finishSlotRound(gross);return}
 const mul=gross/stake,tier=jackpot?'🏆 '+jackpot+' JACKPOT':mul>=35?'EPIC WIN':mul>=15?'MEGA WIN':mul>=5?'BIG WIN':'WIN';
 p.classList.add('active');p.innerHTML=`<div class="v8-win-tier">${tier}</div><strong id="v8PrizeNumber">0</strong><small>칩 지급 · 순이익 ${gross-stake>=0?'+':''}${FMT(gross-stake)}</small><button id="v8PrizeSkip" onclick="finishSlotWin()">SKIP ›</button>`;
 scatterCoins(clamp(Math.floor(mul*2)+12,14,50));
 slot3dPr={gross,stake,start:performance.now(),settled:false};
 const animate=(t)=>{if(!slot3dPr||slot3dPr.settled)return;const f=clamp((t-slot3dPr.start)/Math.min(3600,1400+mul*45),0,1),x=1-Math.pow(1-f,2.5);
   const number=E('#v8PrizeNumber');if(number)number.textContent='+'+FMT(gross*x);
   if(f>=1){slot3dPr.finished=true;slotFinishTimer=setTimeout(finishSlotWin,650)}else requestAnimationFrame(animate)
 };requestAnimationFrame(animate);
 if(gross) setTicker(state.name+'님이 '+slotDefs[state.slotIndex].name+'에서 '+FMT(gross)+'칩 당첨!');
}
finishSlotWin=function(){if(!slot3dPr||slot3dPr.settled)return;slot3dPr.settled=true;clearTimeout(slotFinishTimer);const amt=slot3dPr.gross;slot3dPr=null;finishSlotRound(amt)};
function finishSlotRound(amount){
 if(amount)changeMoney(amount);
 state.slotBusy=false;store();
 const p=E('#v8SlotPrize');if(p){p.classList.remove('active');p.textContent=''}
 const spin=E('#spinBtn');if(spin){spin.disabled=false;spin.textContent='SPIN'}
 refreshSlotText();if(state.autoLeft)setTimeout(()=>{if(!state.slotBusy&&state.activeGame==='slots')spinSlot()},620);
}

/* Depth and win feedback for dealer card games. Their dealer artwork is still
   animated 2.5D, not an articulated 3D/motion-captured human. */
const oldBjStart=bjStart,oldBjHit=bjHit,oldBjStand=bjStand,oldBacDeal=dealBaccarat;
function v8DealerAction(){const img=E('.c-dealer img');if(!img)return;img.classList.remove('v8-deal-moving');void img.offsetWidth;img.classList.add('v8-deal-moving');setTimeout(()=>img.isConnected&&img.classList.remove('v8-deal-moving'),1250)}
// Base V7 has dealer animation; add subtle table-level chip / card feedback without
// changing betting rules while the multiplayer backend is still a demo.
bjStart=function(){oldBjStart();v8DealerAction();v8Audio.impact()};
bjHit=function(){oldBjHit();v8DealerAction();v8Audio.impact()};
bjStand=function(){oldBjStand();v8DealerAction();v8Audio.impact()};
dealBaccarat=function(){oldBacDeal();v8DealerAction();v8Audio.impact()};

/* Common sound control for roulette (slot already has its own control). */
const priorRenderRouletteV8=renderRoulette;
renderRoulette=function(){priorRenderRouletteV8();const head=E('.c-roulette .r-head');if(head && !head.querySelector('.v8-audio-toggle')){const b=document.createElement('button');b.type='button';b.className='v8-audio-toggle';b.textContent=state.sound?'🔊':'🔇';b.title='효과음 켜기/끄기';b.onclick=()=>{state.sound=!state.sound;renderRoulette()};head.appendChild(b)}};

/* Remove idle renderer as soon as the page leaves the game; no WebGL animation
   persists inside a hidden page, preventing battery drain and stale results. */
const v8Nav=nav;
let lastScene='';
const origRenderGame=renderGame;
renderGame=function(){origRenderGame();const current=state.activeGame;
 if(current!=='roulette'&&glWheel){glWheel.release();glWheel=null;v8Audio.rimStop()}
 lastScene=current;};


/* Accurate 6-deck shoe for single-player card tables; all cards dealt from the same
   shuffled pool until the shoe is exhausted. Baccarat uses the standard third-card
   tableau, and blackjack natural 21 returns 3:2 plus original stake. */
let v8Shoe=[];function v8TakeCard(){if(v8Shoe.length<42){v8Shoe=[];for(let d=0;d<6;d++)for(const suit of ['♠','♥','♦','♣'])for(let v=2;v<=14;v++)v8Shoe.push({v,s:suit});for(let i=v8Shoe.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[v8Shoe[i],v8Shoe[j]]=[v8Shoe[j],v8Shoe[i]]}}return v8Shoe.pop()}
const oldCardHtml=cardHtml;
cardHtml=function(c,back=false){if(!c)return '';const red=c.s==='♥'||c.s==='♦';return `<div class="card v8-card ${red?'redsuit':''} ${back?'v8-closed':''}"><div class="v8-card-core"><div class="v8-card-front"><b>${labelCard(c)}</b><span>${c.s}</span></div><div class="v8-card-reverse"><span>♛</span><small>JAEPARK</small></div></div></div>`};
function showCardMoney(gross,stake,label){const root=E('.c-cardgame .c-felt');if(!root)return;root.querySelector('.v8-card-money')?.remove();const el=document.createElement('div');el.className='v8-card-money';el.innerHTML=`<span>${gross?'✦ '+label+' ✦':'다음 판에 도전'}</span><strong>${gross?'+'+FMT(gross):'0'}칩</strong><small>순손익 ${gross-stake>=0?'+':''}${FMT(gross-stake)} · 총 지급 ${FMT(gross)}</small>`;root.appendChild(el);setTimeout(()=>el.remove(),2700)}
const v8BjOrig={start:bjStart,hit:bjHit,stand:bjStand};
bjStart=function(){if(state.money<state.chip)return alert('칩 부족');const stake=state.chip;changeMoney(-stake);
 bj={dealer:[v8TakeCard(),v8TakeCard()],player:[v8TakeCard(),v8TakeCard()],phase:'playing'};
 const playerNatural=valueHand(bj.player)===21,dealerNatural=valueHand(bj.dealer)===21;
 if(playerNatural||dealerNatural){bj.phase='over';let pay=playerNatural?(dealerNatural?stake:stake*2.5):0;if(pay)changeMoney(pay);renderBlackjack();showCardMoney(pay,stake,playerNatural&&!dealerNatural?'BLACKJACK':'RESULT');if(pay>stake)v8Audio.win(pay/stake)}else{renderBlackjack()};v8DealerAction();v8Audio.impact();
};
bjHit=function(){if(bj.phase!=='playing')return;const stake=state.chip;bj.player.push(v8TakeCard());if(valueHand(bj.player)>21){bj.phase='over';renderBlackjack();const result=E('#result');if(result)result.textContent='BUST · 총 지급 0칩';showCardMoney(0,stake,'BUST')}else{renderBlackjack()}v8DealerAction();v8Audio.impact()};
bjStand=function(){if(bj.phase!=='playing')return;const stake=state.chip;while(valueHand(bj.dealer)<17)bj.dealer.push(v8TakeCard());const p=valueHand(bj.player),d=valueHand(bj.dealer),dealerNatural=bj.dealer.length===2&&d===21;let pay=(!dealerNatural && (d>21||p>d))?stake*2:p===d?stake:0;bj.phase='over';if(pay)changeMoney(pay);renderBlackjack();const r=E('#result');if(r)r.textContent=`딜러 ${d}점 · 플레이어 ${p}점 | 총 지급 ${FMT(pay)}칩`;showCardMoney(pay,stake,pay>stake?'WIN':pay===stake?'PUSH':'NO WIN');if(pay>stake){setTicker(state.name+'님이 블랙잭 '+FMT(pay)+'칩 당첨!');v8Audio.win(pay/stake)}v8DealerAction()};
const baccaratPoint=c=>c.v===14?1:c.v>=10?0:c.v;
const baccaratScore=hand=>hand.reduce((n,c)=>n+baccaratPoint(c),0)%10;
let baccaratBusy=false;
dealBaccarat=function(){if(baccaratBusy||state.money<state.chip)return;const bet=state.chip,selection=state.selected;changeMoney(-bet);baccaratBusy=true;
 const player=[v8TakeCard(),v8TakeCard()],banker=[v8TakeCard(),v8TakeCard()];const p2=baccaratScore(player),b2=baccaratScore(banker);let pThird=null;
 if(p2<8&&b2<8){if(p2<=5){pThird=v8TakeCard();player.push(pThird)}const pt=pThird===null?null:baccaratPoint(pThird);
 const draws=pt===null?b2<=5:b2<=2||b2===3&&pt!==8||b2===4&&pt>=2&&pt<=7||b2===5&&pt>=4&&pt<=7||b2===6&&(pt===6||pt===7);
 if(draws)banker.push(v8TakeCard());}
 // Show initial hands first, then turn cards one by one as in a physical casino.
 bac={p:player.slice(0,2),b:banker.slice(0,2),result:'딜러가 카드를 배분하고 있습니다…'};renderBaccarat();v8DealerAction();v8Audio.impact();const action=E('.c-cardgame .gold-btn.full');if(action)action.disabled=true;
 setTimeout(()=>{bac.p=player;bac.b=banker;renderBaccarat();v8DealerAction();v8Audio.impact();},700);
 setTimeout(()=>{const p=baccaratScore(player),b=baccaratScore(banker),result=p===b?'타이':p>b?'플레이어':'뱅커';let pay=selection===result?bet*(result==='타이'?9:result==='뱅커'?1.95:2):result==='타이'?bet:0;pay=Math.round(pay);if(pay)changeMoney(pay);bac.result=`${result} ${p}:${b} · 총 지급 ${FMT(pay)}칩 · 순손익 ${FMT(pay-bet)}칩`;baccaratBusy=false;renderBaccarat();showCardMoney(pay,bet,pay>bet?'WIN':pay===bet?'PUSH':'NO WIN');if(pay>bet){setTicker(state.name+'님이 바카라에서 '+FMT(pay)+'칩 당첨!');v8Audio.win(pay/bet)}},1350);
};

/* Accessible audit/debug affordance: state display is not an assertion of casino certification. */
window.JaepakV8={get roulette(){return glWheel?.physics||null},get slots(){return slot3d},version:'V8 WEBGL + CYLINDRICAL REELS',testTier(mult=10){if(!E('#v8SlotReels')||state.slotBusy)return;state.slotBusy=true;showSlotPrize(state.chip*mult,state.chip,'',[])}};

if(state.league)render();
})();