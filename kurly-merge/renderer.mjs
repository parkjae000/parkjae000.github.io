import {COLS,targets,workerDamage,facilityRate} from './engine.mjs';
import {fmt,facilityName} from './ui.mjs';
import atlas from './assets/scene-atlas.js';
const TAU=Math.PI*2,FONT='"Noto Sans CJK KR", "Apple SD Gothic Neo", sans-serif';
const propNames=['pile-parcel','pile-frozen','pile-produce','facility-packing','facility-cold','delivery-cannon','warehouse-gate','supply-chest','dynamite','worker-motion','forklift-motion','warehouse-backdrop','fighters','ambientMotion','chilledMotion','csMotion','beautyMotion','returnsMotion'];
export async function loadArt(){return Object.fromEntries(await Promise.all(propNames.map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve([name,im]);im.onerror=()=>reject(Error('이미지 로드 실패: '+name));im.src='assets/'+name+'.webp';}))));}
export function createRenderer(canvas,art,getState,onInput){
 const c=canvas.getContext('2d',{alpha:false}),cache=document.createElement('canvas'),cc=cache.getContext('2d'),W=700,stepX=83,stepY=74,left=(W-COLS*stepX)/2;
 let H=1200,frameAt=0,baseKey='',raf,lastData=null,drag=null,selectedHit=null,particles=[],movers=new Map(),celebrations=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pos=(x,y)=>({x:left+(x+.5)*stepX,y:H-105-y*stepY});
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};};
 const cell=p=>({x:Math.round((p.x-left)/stepX-.5),y:Math.round((H-105-p.y)/stepY)});
 function label(ctx,s,x,y,size=24,color='#785b8b',stroke=null){ctx.font=`800 ${size}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=5;ctx.strokeText(s,x,y);}ctx.fillStyle=color;ctx.fillText(s,x,y);}
 function rr(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
 function image(ctx,name,x,y,width,height=null,anchor=.93){const im=art[name];if(!im)return;const h=height??width*im.height/im.width;ctx.drawImage(im,x-width/2,y-h*anchor,width,h);}
 function shadow(ctx,x,y,w=27){ctx.fillStyle='#67476b26';ctx.beginPath();ctx.ellipse(x,y,w,w*.27,0,0,TAU);ctx.fill();}
 function pileName(t){return t.kind==='frozen'?'pile-frozen':t.kind==='produce'?'pile-produce':t.kind==='chest'||t.kind==='key'?'supply-chest':t.kind==='gate'||t.kind==='exit'?'warehouse-gate':'pile-parcel';}
 function renderBase(g,b){
  cc.imageSmoothingEnabled=true;cc.imageSmoothingQuality='high';cc.fillStyle='#e8d9e7';cc.fillRect(0,0,W,H);cc.drawImage(art['warehouse-backdrop'],0,0,W,H);cc.fillStyle=b.event?'#ffe19d16':['#b688d200','#6cbaef18','#97d4ac18'][Math.floor((b.stage-1)/5)%3];cc.fillRect(0,0,W,H);
  const open=new Set(b.cells.filter(t=>t.done).map(t=>`${t.x},${t.y}`));
  for(let y=0;y<b.rows;y++)for(let x=0;x<COLS;x++){
   const p=pos(x,y);if(b.walls.includes(y)&&x!==(b.cells.find(z=>z.kind==='gate'&&z.y===y)?.x??3)){rr(cc,p.x-stepX/2,p.y-20,stepX,30,3,'#b8a2c2','#cbbad3');rr(cc,p.x-stepX/2,p.y-28,stepX,20,3,'#ddcce5','#f0e5f2');continue;}
   if(y<3||open.has(`${x},${y}`)){cc.fillStyle=y<3?'#fff6df33':'#fff9ef40';cc.beginPath();cc.moveTo(p.x-38,p.y-15);cc.lineTo(p.x,p.y-34);cc.lineTo(p.x+38,p.y-15);cc.lineTo(p.x,p.y+4);cc.closePath();cc.fill();}
  }
  const items=[...b.cells.filter(t=>!t.done),...b.facilities].sort((a,z)=>z.y-a.y||a.x-z.x);
  for(const t of items){const p=pos(t.x,t.y),isFacility='active'in t,width=isFacility?112:t.kind==='gate'||t.kind==='exit'?123:92;shadow(cc,p.x,p.y,33);
   if(isFacility){if(!t.active&&!t.repaired)cc.globalAlpha=.65;image(cc,t.kind==='cold'?'facility-cold':'facility-packing',p.x,p.y,width);cc.globalAlpha=1;
    if(!t.active){rr(cc,p.x-42,p.y-54,84,26,9,t.repaired?'#e9fcdf':'#fff5d6','#fff');label(cc,t.repaired?'가동':'복구',p.x,p.y-40,20,'#9d7950');}
    else {rr(cc,p.x-43,p.y+1,86,27,10,'#fff8e8','#fff');label(cc,'Lv.'+t.level,p.x,p.y+15,21,'#9b7448');}
   }else {image(cc,pileName(t),p.x,p.y,width);if(t.kind==='gate'||t.kind==='exit'){rr(cc,p.x-53,p.y-99,106,29,10,'#7f5b9a','#cfaddf');label(cc,t.kind==='exit'?'출구':'차단문',p.x,p.y-84,19,'#ffebbb');}else{const color=t.kind==='frozen'?'#8ac4df':t.kind==='produce'?'#94ae67':t.kind==='key'?'#c49b46':'#b8a0c5';rr(cc,p.x-21,p.y-14,42,29,10,color,'#fff7e2');label(cc,t.kind==='key'?'⚿':String(t.tier||1),p.x,p.y+1,22,'#fffdf1');}}
  }
  // Entrance staging bay and delivery cannon are part of the game world.
  const cp=pos(5.6,0);image(cc,'delivery-cannon',cp.x,cp.y+12,108);
 }
 function sprite(ctx,w,p,t,working,dragging=false,celebrate=false){
  const im=art['worker-motion'],q=(t*(1+Math.min(8,w.level-1)*.035))%1.15;
  let f=celebrate?[6,7,6][Math.floor(t*7)%3]:dragging?[1,2][Math.floor(t*6)%2]:working?q<.18?0:q<.36?3:q<.50?4:q<.68?5:0:0;
  const size=145,sc=im.width/4,sh=im.height/2,bob=working||dragging?Math.abs(Math.sin(t*8))*2:Math.sin(t*2.3+w.level)*1.2;
  shadow(ctx,p.x,p.y,25);ctx.save();ctx.translate(p.x,p.y-bob);if(w.level>=5){ctx.shadowColor=['#ddc25f','#ae88dd','#84d5c0'][Math.floor(w.level/5)%3];ctx.shadowBlur=11;}
  ctx.drawImage(im,(f%4)*sc,Math.floor(f/4)*sh,sc,sh,-size*.5,-size*.835,size,size);ctx.restore();
  const color=['#9278ab','#9c81ba','#81b8bb','#69a6d0','#c09952','#a775bd'][Math.min(5,Math.floor((w.level-1)/3))];rr(ctx,p.x-23,p.y-9,46,30,12,color,'#fff3e0');label(ctx,String(w.level),p.x,p.y+6,24,'#fff');
  if(working&&f===5){const a=t*20;ctx.strokeStyle='#fff5c1';ctx.lineWidth=3;for(let i=0;i<3;i++){const x=p.x+30+Math.cos(a+i)*9,y=p.y-65+Math.sin(a+i)*8;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();}}
 }
 function hero(g,t,b){
  if(b.event||!g.foremanPos)return;const p=pos(g.foremanPos.x,g.foremanPos.y),id=g.foreman,key=id==='frozen'?'fighters':id+'Motion',im=art[key];if(!im)return;
  const casting=g.heroUntil>g.serverAt+(Date.now()-lastData.at),frame=casting?Math.floor(t*6)%4:Math.floor(t*1.3)%2;
  let r=id==='frozen'?atlas.fighters[[8,11,9,10][frame]]:atlas[key]?.[frame];if(!r)return;
  const h=138,w=r.w*h/r.h;
  c.save();c.globalAlpha=.30;c.strokeStyle=({ambient:'#8fc475',frozen:'#74bcdd',chilled:'#79cab7',beauty:'#ba8cda',cs:'#6db1d1',returns:'#e6ae63'})[id];c.lineWidth=3;c.setLineDash([7,8]);c.beginPath();c.ellipse(p.x,p.y+1,stepX*1.6,stepY*1.15,0,0,TAU);c.stroke();c.restore();shadow(c,p.x,p.y,31);c.drawImage(im,r.x,r.y,r.w,r.h,p.x-w/2,p.y-h,w,h);rr(c,p.x-31,p.y-10,62,26,10,'#f3db94','#fff5ca');label(c,'파트장',p.x,p.y+3,18,'#a47734');
  if(casting){c.save();c.globalAlpha=.4+.2*Math.sin(t*4);c.strokeStyle='#ffe9a3';c.lineWidth=4;c.beginPath();c.ellipse(p.x,p.y,48+Math.sin(t*5)*5,19,0,0,TAU);c.stroke();c.restore();}
 }
 function paint(time){
  raf=requestAnimationFrame(paint);if(document.hidden||time-frameAt<33)return;frameAt=time;
  const state=getState();if(!state?.g||!state.b)return;const {g,b}=state;
  const wantedH=(b.rows+2)*stepY+90;if(H!==wantedH||canvas.width!==W){H=wantedH;canvas.width=W;canvas.height=H;cache.width=W;cache.height=H;baseKey='';}
  if(lastData?.g!==g){const old=lastData?.b;
   if(old&&old.stage===b.stage){for(const w of b.workers){const o=old.workers.find(z=>z.id===w.id);if(o&&w.level>o.level)celebrations.set(w.id,time+1100);}for(const z of b.cells.filter(z=>z.done&&!old.cells.find(o=>o.id===z.id)?.done)){const p=pos(z.x,z.y);for(let i=0;i<9;i++)particles.push({x:p.x,y:p.y-35,vx:(i%3-1)*35,vy:-40-i*7,life:1.3,color:i%2?'#f9d77f':'#c598d9'});}}
   lastData={g,b,at:state.receivedAt||Date.now()};
  }
  const key=[b.stage,b.event?.id,b.cells.filter(z=>z.done).length,...b.facilities.map(f=>`${f.level}${f.active}${f.repaired}`)].join(':');if(baseKey!==key){renderBase(g,b);baseKey=key;}
  c.drawImage(cache,0,0);const t=time/1000,serverNow=g.serverAt+(Date.now()-lastData.at);
  const liveTargets=targets(b),dps=new Map();for(const w of b.workers){if(w.target){const target=liveTargets.find(z=>z.id===w.target);if(target)dps.set(w.target,(dps.get(w.target)||0)+workerDamage(g,b,w,target,serverNow));}}
  for(const z of liveTargets){if(z.hp>=z.max&&!dps.has(z.id)&&state.selectedTarget!==z.id)continue;const p=pos(z.x,z.y),hp=Math.max(0,z.hp-(dps.get(z.id)||0)*Math.max(0,serverNow-g.serverAt)/1000);rr(c,p.x-34,p.y-100,68,9,4,'#725d7d77');if(hp>0)rr(c,p.x-33,p.y-99,66*hp/z.max,7,3,z.kind==='gate'?'#f0cd77':'#b8de9c');if(state.selectedTarget===z.id){c.strokeStyle='#fff5b6';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y-8,41,16,0,0,TAU);c.stroke();}}
  for(const f of b.facilities){if(f.active){const p=pos(f.x,f.y);c.fillStyle='#ffe7a0';for(let j=0;j<3;j++){c.globalAlpha=.35+.35*Math.sin(t*4+j*2);c.beginPath();c.arc(p.x-20+j*16,p.y-33,3,0,TAU);c.fill();}c.globalAlpha=1;}if(f.ready>0){const p=pos(f.x,f.y);rr(c,p.x-37,p.y-119-Math.sin(t*2)*3,74,32,10,'#ffe095','#fff2bc');label(c,'+'+fmt(f.ready),p.x,p.y-103-Math.sin(t*2)*3,20,'#8c642d');}if(f.repaired&&!f.active){const p=pos(f.x,f.y);rr(c,p.x-42,p.y-115,84,32,9,'#b8e4a3','#f4ffdb');label(c,'가동하기',p.x,p.y-99,18,'#548248');}}
  hero(g,t,b);
  const workers=b.workers.map(w=>{const pred=state.predictions?.get(w.id);return pred?{...w,...pred}:w;}).sort((a,z)=>z.y-a.y);
  const grouped=new Map();for(const w of workers){const key=w.x+','+w.y,list=grouped.get(key)||[];list.push(w.id);grouped.set(key,list);}
  for(const w of workers){if(drag?.dragging&&drag.id===w.id)continue;let p=pos(w.x,w.y);const group=grouped.get(w.x+','+w.y),i=group.indexOf(w.id);if(group.length>1){p.x+=(i-(group.length-1)/2)*25;p.y+=(i%2)*9;}
   let m=movers.get(w.id);if(!m)m={x:p.x,y:p.y};const moving=Math.hypot(m.x-p.x,m.y-p.y)>2;m.x+=(p.x-m.x)*.25;m.y+=(p.y-m.y)*.25;movers.set(w.id,m);
   if(state.selectedWorker===w.id){c.strokeStyle='#ffeaaa';c.lineWidth=4;c.beginPath();c.ellipse(m.x,m.y,34,15,0,0,TAU);c.stroke();}
   sprite(c,w,m,t,!!w.target,moving,(celebrations.get(w.id)||0)>time);
  }
  if(b.barrel){const p=pos(5.6,1.35),bob=Math.sin(t*3)*4;shadow(c,p.x,p.y,29);image(c,'supply-chest',p.x,p.y-bob,83);rr(c,p.x-29,p.y-89-bob,58,27,10,'#fff0b1','#fff');label(c,'보급!',p.x,p.y-75-bob,20,'#9d7739');}
  if(drag?.dragging){const w=b.workers.find(z=>z.id===drag.id);if(w){const q=cell(drag.point),p=pos(q.x,q.y);c.save();c.fillStyle='#fff7b13d';c.strokeStyle='#fff1ab';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,37,16,0,0,TAU);c.fill();c.stroke();c.restore();sprite(c,w,{x:drag.point.x,y:drag.point.y+25},t,false,true);}}
  if(!reduced){particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=.033;p.x+=p.vx*.033;p.y+=p.vy*.033;p.vy+=55*.033;c.globalAlpha=Math.max(0,p.life/1.3);c.fillStyle=p.color;c.save();c.translate(p.x,p.y);c.rotate(p.life*4);c.fillRect(-4,-4,8,8);c.restore();}c.globalAlpha=1;}
 }
 function hitObject(p,b){return [...b.cells.filter(z=>!z.done),...b.facilities].map(z=>({z,p:pos(z.x,z.y)})).filter(({p:v})=>Math.abs(p.x-v.x)<47&&p.y<v.y+10&&p.y>v.y-105).sort((a,z)=>Math.hypot(p.x-a.p.x,p.y-a.p.y+44)-Math.hypot(p.x-z.p.x,p.y-z.p.y+44))[0]?.z;}
 function hitWorker(p,b){return b.workers.map(w=>{let v=pos(w.x,w.y);const group=b.workers.filter(z=>z.x===w.x&&z.y===w.y),i=group.findIndex(z=>z.id===w.id);v.x+=(i-(group.length-1)/2)*25;return {w,p:v,d:Math.hypot(p.x-v.x,(p.y-(v.y-39))*.75)};}).filter(z=>z.d<42).sort((a,z)=>a.d-z.d)[0]?.w;}
 canvas.addEventListener('pointerdown',e=>{const state=getState();if(!state?.b)return;const p=point(e),w=hitWorker(p,state.b);drag={id:w?.id,point:p,start:p,clientY:e.clientY,lastY:e.clientY,scroll:canvas.parentElement.scrollTop,dragging:false,panning:false};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e),delta=Math.hypot(p.x-drag.start.x,p.y-drag.start.y);if(drag.id){if(delta>10)drag.dragging=true;drag.point=p;}else if(Math.abs(e.clientY-drag.clientY)>5||drag.panning){drag.panning=true;canvas.parentElement.scrollTop-=e.clientY-drag.lastY;}drag.lastY=e.clientY;});
 canvas.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;const state=getState(),p=point(e),tile=cell(p);if(d.panning)return;if(d.dragging){const other=hitWorker(p,state.b);const target=hitObject(p,state.b);const destination=other&&other.id!==d.id?{x:other.x,y:other.y}:target?{x:target.x,y:target.y}:tile;onInput({type:'drop',id:d.id,...destination,mergeTarget:other?.id!==d.id?other?.id:null});return;}
  const w=hitWorker(p,state.b);if(w){onInput({type:'worker',id:w.id});return;}
  const cp=pos(5.6,1.35);if(state.b.barrel&&Math.hypot(p.x-cp.x,p.y-(cp.y-40))<60){onInput({type:'barrel'});return;}
  const f=state.b.facilities.find(f=>Math.hypot(p.x-pos(f.x,f.y).x,p.y-(pos(f.x,f.y).y-35))<60);if(f){onInput({type:'facility',id:f.id});return;}
  const target=hitObject(p,state.b);onInput({type:target?'target':'tile',id:target?.id,...(target?{x:target.x,y:target.y}:tile)});
 });
 canvas.addEventListener('pointercancel',()=>{drag=null;});
 raf=requestAnimationFrame(paint);
 return {stop:()=>cancelAnimationFrame(raf),reset:()=>{baseKey='';movers.clear();},scrollTo:(y,behavior='smooth')=>{const p=pos(3,y),el=canvas.parentElement;el.scrollTo({top:p.y-el.clientHeight*.65,behavior});},resize:()=>{baseKey='';},setReduced:v=>{reduced=v;}};
}
