import {SIEGE_PADS,isSiegeScene} from './siege-geometry.mjs?v=td-ux-18';
import {CONQUEST_PADS} from './conquest-geometry.mjs?v=td-ux-18';
import {WORLD,CATALOG,PADS,ROUTE,clamp} from './engine.mjs?v=td-ux-18';
import {heroStats,towerStats} from './progression.mjs?v=td-ux-18';
const FONT='"Noto Sans CJK KR","Noto Sans KR",sans-serif';
export class RendererBase{
 constructor(canvas,art,{width=1280,height=800,pixelRatio=1}={}){this.canvas=canvas;this.c=canvas.getContext('2d');this.art=art;this.buttons=[];this.resize(width,height,pixelRatio);}
 resize(w,h,dpr=1){this.w=w;this.h=h;this.dpr=dpr;this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.c.setTransform(dpr,0,0,dpr,0,0);}
 rect(x,y,w,h,r=12){const c=this.c;c.beginPath();c.roundRect(x,y,w,h,r);}
 text(value,x,y,size=16,color='#fff0cf',align='left',weight=700){const c=this.c;c.font=`${weight} ${size}px ${FONT}`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(value,x,y);}
 panel(x,y,w,h,{gold=false,alpha=1,r=14}={}){const c=this.c;c.save();c.globalAlpha=alpha;const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,gold?'#ffe0a0':'#493a57');g.addColorStop(.45,gold?'#f7ba58':'#32293f');g.addColorStop(1,gold?'#bc7635':'#201b2e');c.fillStyle='#110f1d88';this.rect(x,y+4,w,h,r);c.fill();c.fillStyle=g;this.rect(x,y,w,h,r);c.fill();c.strokeStyle=gold?'#fff1bd':'#b28c69';c.lineWidth=gold?2:1.3;c.stroke();if(gold){c.strokeStyle='#9c5d32';c.lineWidth=1;this.rect(x+4,y+4,w-8,h-8,r-3);c.stroke();}c.restore();}
 button(id,label,x,y,w,h,{active=false,gold=false,data,disabled=false,small=false}={}){this.panel(x,y,w,h,{gold:gold||active,alpha:disabled?.48:1,r:Math.min(12,h/3)});this.text(label,x+w/2,y+h/2,small?14:16,gold||active?'#4a2b28':'#ffeac2','center',800);this.buttons.push({id,label,x,y,w,h,data,disabled});}
 sprite(image,x,y,w,h,alpha=1){if(!image)return;const c=this.c;c.save();c.globalAlpha=alpha;c.drawImage(image,x-w/2,y-h,w,h);c.restore();}
 pill(label,x,y,color='#68cbff',width=110){this.panel(x,y,width,28,{r:10});this.text(label,x+width/2,y+14,14,color,'center');}
 progress(x,y,w,h,fraction,color='#84e98b'){const c=this.c;this.rect(x,y,w,h,h/2);c.fillStyle='#1c172a';c.fill();const width=Math.max(0,w*clamp(fraction,0,1));if(width>0){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#e9ffcf');g.addColorStop(.42,color);g.addColorStop(1,color);c.fillStyle=g;this.rect(x+2,y+2,Math.max(1,width-4),h-4,(h-4)/2);c.fill();}c.strokeStyle='#d6b16c';c.lineWidth=1;c.stroke();}
 transform(session){const v=session.layout.stage,camera=session.camera;return {scale:camera.zoom,tx:v.x+v.w/2-camera.x*camera.zoom,ty:v.y+v.h/2-camera.y*camera.zoom};}
 toWorld(session,x,y){const t=this.transform(session);return {x:(x-t.tx)/t.scale,y:(y-t.ty)/t.scale};}
 toScreen(session,x,y){const t=this.transform(session);return {x:x*t.scale+t.tx,y:y*t.scale+t.ty};}
 draw(session){
  const c=this.c;session.setViewport(this.w,this.h);this.buttons=[];c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.w,this.h);c.fillStyle='#251e36';c.fillRect(0,0,this.w,this.h);this.drawWorld(session);this.drawHeader(session);this.drawFooter(session);this.drawMapControls(session);if(session.layout.side&&session.mode==='design')this.drawSide(session);if(session.showLog)this.drawLog(session);this.drawToast(session);if(session.resultAt!==null)this.drawResult(session);
 }
 drawWorld(s){
  const c=this.c,v=s.layout.stage,t=this.transform(s),b=s.battle,time=b?.time||s.elapsed;
  c.save();c.beginPath();c.rect(v.x,v.y,v.w,v.h);c.clip();c.fillStyle='#55475e';c.fillRect(v.x,v.y,v.w,v.h);c.translate(t.tx,t.ty);c.scale(t.scale,t.scale);c.drawImage(this.art.map,0,0,WORLD.w,WORLD.h);
  if(s.mode!=='battle'){c.strokeStyle='#a3ddff88';c.lineWidth=4;c.setLineDash([8,17]);c.lineDashOffset=-s.elapsed*18;c.beginPath();ROUTE.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.setLineDash([]);}
  if(s.mode==='design')for(const p of PADS){const occupied=s.editor.items.some(i=>i.pad===p.id);if(!occupied){c.fillStyle='#ffd57813';this.rect(p.x-31,p.y-29,62,53,9);c.fill();c.strokeStyle='#f8d681bb';c.lineWidth=2;c.setLineDash([8,6]);c.stroke();c.setLineDash([]);c.strokeStyle='#ffe9a1';c.lineWidth=3;c.beginPath();c.moveTo(p.x-8,p.y-3);c.lineTo(p.x+8,p.y-3);c.moveTo(p.x,p.y-11);c.lineTo(p.x,p.y+5);c.stroke();}}
  const selected=s.editor.items.find(p=>p.id===s.editor.selected);
  if(s.mode==='design'&&selected){const pad=PADS.find(p=>p.id===selected.pad),def=CATALOG[selected.type];c.fillStyle=def.color+'20';c.strokeStyle=def.color+'c0';c.lineWidth=3;c.setLineDash([8,6]);c.beginPath();c.arc(pad.x,pad.y,def.range,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);}
  this.drawHQ(s,115,520,false);this.drawHQ(s,1415,520,true);
  const defenders=s.mode==='battle'?b.defenders:s.activeItems.map(p=>({...p,...PADS.find(v=>v.id===p.pad)}));
  const entries=defenders.map(d=>({y:d.y,kind:'defender',d}));
  if(b){for(const u of b.units){if(u.s< -35||u.hp<=0&&time-u.deadAt>.55)continue;const p=b.position(u);const sx=p.x*t.scale+t.tx,sy=p.y*t.scale+t.ty;if(sx<v.x-45||sx>v.x+v.w+45||sy<v.y-60||sy>v.y+v.h+50)continue;entries.push({y:p.y,kind:'unit',u,p});}}
  entries.sort((a,b)=>a.y-b.y);
  for(const entry of entries){if(entry.kind==='defender')this.drawDefender(s,entry.d,time);else this.drawUnit(s,entry.u,entry.p,time);}
  if(b){for(const fx of b.effects)this.effect(fx,time);if(b.status==='victory')this.collapse(s);}
  c.restore();
  if(s.mode==='battle'&&b.time<2.4){this.panel(v.x+v.w/2-145,v.y+22,290,64,{gold:true});this.text('진격하라!',v.x+v.w/2,v.y+45,26,'#493025','center',900);this.text(b.total+'명 동시 출격',v.x+v.w/2,v.y+69,15,'#6d472d','center');}
  if(s.mode==='battle'){const skill=b.events.filter(e=>e.type==='skill'&&b.time-e.at<1.4).at(-1);if(skill){const width=s.layout.mobile?248:320,x=v.x+v.w/2-width/2,y=v.y+14;this.panel(x,y,width,48,{alpha:.92});const image=this.art.heroes[skill.hero][2];this.sprite(image,x+32,y+45,42,45);this.text(skill.message,x+62,y+25,s.layout.mobile?15:19,CATALOG[skill.hero].color);}}
 }
 drawHQ(s,x,y,enemy){const c=this.c,b=s.battle;const destroyed=enemy&&b?.status==='victory';const a=destroyed?clamp(1-(s.elapsed-s.resultAt)*.2,.33,1):1;
  c.save();if(enemy){c.translate(x,0);c.scale(-1,1);this.sprite(this.art.hq,0,y,270,222,a);}else this.sprite(this.art.hq,x,y,270,222,a);c.restore();
  const flagX=x+(enemy?43:-36),flagY=y-176;c.strokeStyle='#e1c28b';c.lineWidth=3;c.beginPath();c.moveTo(flagX,flagY+49);c.lineTo(flagX,flagY);c.stroke();c.fillStyle=enemy?'#dc5c71':'#4eaff2';c.beginPath();c.moveTo(flagX,flagY);c.lineTo(flagX+36,flagY+6);c.lineTo(flagX+30,flagY+25);c.lineTo(flagX,flagY+20);c.fill();
  const f=enemy&&b?b.centerHp/b.centerMax:1;this.panel(x-84,y+13,168,50,{r:9});this.text(enemy?'방어 본진':'공격 본진',x-72,y+28,16,enemy?'#ffb3c2':'#b5e5ff');this.text(Math.ceil(f*100)+'%',x+72,y+28,16,'#fff0d5','right');this.progress(x-72,y+40,144,12,f,enemy?'#ef8d85':'#7ed595');
 }
 drawDefender(s,d,time){const c=this.c,def=CATALOG[d.type],selected=s.mode==='design'&&s.editor.selected===d.id,age=s.battle?time-d.lastShot:10,active=age<.65;
  c.save();if(s.battle?.status==='victory')c.globalAlpha=.6;
  c.fillStyle='#1a152e55';c.beginPath();c.ellipse(d.x,d.y+8,52,14,0,0,Math.PI*2);c.fill();
  if(def.kind==='hero'){
   const g=c.createLinearGradient(0,d.y-20,0,d.y+15);g.addColorStop(0,'#e0c188');g.addColorStop(.3,'#716273');g.addColorStop(1,'#48384d');c.fillStyle=g;c.beginPath();c.ellipse(d.x,d.y,51,21,0,0,Math.PI*2);c.fill();c.strokeStyle=def.rarity==='희귀'?'#edabff':'#ebbd69';c.lineWidth=4;c.stroke();c.fillStyle=def.color+'50';c.beginPath();c.ellipse(d.x,d.y-5,42,13,0,0,Math.PI*2);c.fill();
   const frame=active?2+Math.floor(age*4)%2:Math.floor(time*1.8)%2===0?0:1,im=this.art.heroes[d.type][frame];const bob=Math.sin(time*3+d.x)*1.3;this.sprite(im,d.x,d.y-8-bob,im.width/im.height*105,105);
   if(active){c.strokeStyle=def.color;c.lineWidth=3;c.beginPath();c.ellipse(d.x,d.y-5,47+Math.sin(age*10)*5,17,0,0,Math.PI*2);c.stroke();}
  }else{const image=this.art[d.type],h=128+(d.type==='tesla'?15:0),w=image.width/image.height*h,recoil=age<.13?Math.sin(age/.13*Math.PI)*4:0;this.sprite(image,d.x+recoil,d.y+9,w,h);if(active){c.fillStyle=def.color;c.globalAlpha=.4*(1-age/.65);c.beginPath();c.arc(d.x-19,d.y-70,18*(1-age/.65),0,Math.PI*2);c.fill();c.globalAlpha=1;}}
  if(selected){c.strokeStyle='#fff1a2';c.lineWidth=4;this.rect(d.x-57,d.y-100,114,125,14);c.stroke();}
  if(s.mode!=='battle'){const label=def.kind==='hero'?def.name+' 파트장':def.name;this.panel(d.x-52,d.y+20,104,26,{r:8,alpha:.94});this.text(label,d.x,d.y+33,14,def.color,'center');}
  c.restore();
 }
 drawUnit(s,u,p,time){const c=this.c,alive=u.hp>0,age=time-u.deadAt;let alpha=alive?1:Math.max(0,1-age/.55);if(alpha<=0)return;
  const moving=!u.sieging&&alive,frame=moving?Math.floor(time*10+u.phase)%4:u.sieging?4+Math.floor(time*8+u.phase)%4:6;const image=this.art.troops[u.role][frame];let h=u.role==='shield'?22:20;const w=image.width/image.height*h,bob=moving?Math.sin(time*17+u.phase)*1.1:0;
  c.save();c.globalAlpha=alpha;if(!alive){c.translate(p.x,p.y);c.rotate(age*2);c.scale(1-age*.5,1-age*.5);this.sprite(image,0,0,w,h);c.restore();return;}
  c.fillStyle='#2a223b55';c.beginPath();c.ellipse(p.x,p.y+2,w*.38,3,0,0,Math.PI*2);c.fill();
  if(u.slowUntil>time){c.fillStyle='#7de4ff80';c.beginPath();c.ellipse(p.x,p.y+1,10,4,0,0,Math.PI*2);c.fill();}
  if(Math.cos(p.angle)<-.2){c.translate(p.x,p.y);c.scale(-1,1);this.sprite(image,0,-bob,w,h);}else this.sprite(image,p.x,p.y-bob,w,h);
  c.restore();
 }
 effect(e,time){const c=this.c,a=clamp((time-e.at)/e.duration,0,1),fade=1-a,color=CATALOG[e.type]?.color||'#ffd784';c.save();c.globalAlpha=fade;
  if(e.type==='cannon'){
   const p=clamp(a*2.6,0,1),x=e.fromX+(e.x-e.fromX)*p,y=e.fromY+(e.y-e.fromY)*p-Math.sin(p*Math.PI)*70;c.strokeStyle='#ffd26a';c.lineWidth=3;c.beginPath();c.moveTo(x-10,y-4);c.lineTo(x,y);c.stroke();c.fillStyle='#fff7b3';c.beginPath();c.arc(x,y,5,0,7);c.fill();if(p===1)this.burst(e.x,e.y,45*a,'#ffb64d',fade);
  }else if(e.type==='tesla'||e.type==='laser'||e.type==='cs'){
   const targets=e.type==='tesla'?e.targets:[{x:e.x,y:e.y}],points=[{x:e.fromX,y:e.fromY},...targets];
   for(let i=1;i<points.length;i++){const p=points[i-1],q=points[i];c.strokeStyle=color;c.lineWidth=e.type==='laser'?10:5;c.beginPath();c.moveTo(p.x,p.y);for(let j=1;j<=8;j++){const k=j/8,noise=e.type==='tesla'?Math.sin(j*14+Math.floor(time*25))*11:0;c.lineTo(p.x+(q.x-p.x)*k+noise,p.y+(q.y-p.y)*k+noise);}c.stroke();c.strokeStyle='#fff9f3';c.lineWidth=2;c.stroke();}
   this.burst(e.x,e.y,30+30*a,color,fade);
  }else if(e.type==='ice'||e.type==='frozen'){
   c.fillStyle='#9eeaff33';c.beginPath();c.ellipse(e.x,e.y,e.radius*(.7+a*.3),e.radius*.5,0,0,7);c.fill();c.strokeStyle='#b9f1ff';c.lineWidth=4;c.stroke();
   for(let i=0;i<12;i++){const ang=i*2.4,r=Math.sqrt(i/12)*e.radius,x=e.x+Math.cos(ang)*r,y=e.y+Math.sin(ang)*r*.6;c.fillStyle=i%2?'#c3fcff':'#67c7ff';c.beginPath();c.moveTo(x-5,y);c.lineTo(x,y-18-Math.sin(a*3)*23);c.lineTo(x+8,y+4);c.fill();}
  }else if(e.type==='beauty'){
   c.strokeStyle='#ffadf1';c.lineWidth=4;c.beginPath();c.ellipse(e.x,e.y,e.radius*(.4+a*.7),e.radius*.47,0,0,7);c.stroke();
   for(let i=0;i<19;i++){const ang=i*2.4+a*5,r=(.35+i/30)*e.radius,x=e.x+Math.cos(ang)*r,y=e.y+Math.sin(ang)*r*.6-a*16;c.fillStyle=i%3?'#ff9ee1':'#fff2bd';c.beginPath();c.ellipse(x,y,4,8,ang,0,7);c.fill();}
  }else if(e.type==='chilled'){this.burst(e.x,e.y,e.radius*.8,'#91f6c2',fade);for(let i=0;i<6;i++){const x=e.x+Math.sin(i*3)*60,y=e.y+Math.cos(i*3)*33-a*20;c.fillStyle='#c7ffcc';c.fillRect(x-2,y-8,4,16);c.fillRect(x-8,y-2,16,4);}}
  else if(e.type==='ambient'||e.type==='returns'){this.burst(e.x,e.y,e.radius*(.5+a*.6),'#ffc669',fade);for(let i=0;i<9;i++){const angle=i*.8;c.strokeStyle='#ffdf8a';c.lineWidth=4;c.beginPath();c.moveTo(e.x+Math.cos(angle)*20,e.y+Math.sin(angle)*10);c.lineTo(e.x+Math.cos(angle)*e.radius*a,e.y+Math.sin(angle)*e.radius*a*.5);c.stroke();}}
  else if(e.type==='siege'){c.strokeStyle='#ffe497';c.lineWidth=3;for(let i=0;i<7;i++){c.beginPath();c.moveTo(e.fromX-5-i*5,e.fromY+(i-3)*8);c.lineTo(e.x+Math.sin(i)*18,e.y+Math.cos(i)*23);c.stroke();}this.burst(e.x,e.y,36,'#ffd379',fade);}
  c.restore();
 }
 burst(x,y,r,color,alpha=1){const c=this.c;c.save();c.globalAlpha*=alpha;const gradient=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));gradient.addColorStop(0,'#fff9d8');gradient.addColorStop(.25,color);gradient.addColorStop(1,color+'00');c.fillStyle=gradient;c.beginPath();c.arc(x,y,r,0,7);c.fill();c.restore();}
 collapse(s){const c=this.c,age=s.elapsed-s.resultAt;this.burst(1390,430,Math.min(170,age*125),'#ffb957',Math.max(.1,1-age*.3));for(let i=0;i<18;i++){const a=i*2.399,r=(22+age*40)*(i%4+1)/3,x=1390+Math.cos(a)*r,y=440+Math.sin(a)*r*.6-age*17;c.fillStyle=i%3?'#70617088':'#f8b15b99';c.beginPath();c.arc(x,y,10+age*7,0,7);c.fill();}}
 drawHeader(s){const c=this.c,w=this.w,m=s.layout.mobile,h=s.layout.header;this.panel(0,-10,w,h+10,{r:0});c.fillStyle='#d6a958';c.fillRect(0,h-3,w,3);
  if(m){this.text('물류센터 침공전',16,25,22,'#ffe6ad');this.text(s.mode==='design'?'방어 설계':s.mode==='prepare'?'저장된 방어전장':'센터 침공 중',16,55,15,s.mode==='design'?'#9dddff':'#ffc989');this.pill('체험판',w-83,12,'#f8d990',68);
   if(s.mode==='battle'){this.text('잔존 '+s.battle.alive+' / '+s.battle.total,16,80,15,'#fff1d2');this.text('본진 '+Math.ceil(s.battle.centerHp/s.battle.centerMax*100)+'%',w-16,80,15,'#ffbdc6','right');}
   else this.text(s.mode==='design'?'타워 6기 · 파트장 4명까지':'내 센터에서 병력을 한 번에 출격해요',16,80,14,'#d6c9d5');
  }else{this.pill(s.mode==='design'?'방어 설계':s.mode==='prepare'?'공격 준비':'공격 진영',18,18,'#a6ddff',126);this.text('물류센터 침공전',w/2,30,27,'#ffe2a0','center',900);this.text('컬리 아포칼립스 · 전투 체험판',w/2,60,14,'#ddc7b6','center');if(s.mode==='battle'){this.text('잔존 병력 '+s.battle.alive+' / '+s.battle.total,w-24,26,18,'#fff0cf','right');this.text('방어 본진 '+Math.ceil(s.battle.centerHp/s.battle.centerMax*100)+'%',w-24,56,17,'#ffb5c3','right');}else this.text('타워와 파트장을 사전 배치하세요',w-24,40,16,'#e8cda5','right');}
 }
 card(s,type,x,y,w,h){const d=CATALOG[type],chosen=s.editor.tool===type,available=s.editor.items.some(p=>p.type===type),im=d.kind==='hero'?this.art.heroes[type][0]:this.art[type];this.panel(x,y,w,h,{gold:chosen,r:10});const ih=h-25,iw=Math.min(w-10,im.width/im.height*ih);this.sprite(im,x+w/2,y+h-23,iw,ih);this.text(d.name,x+w/2,y+h-11,14,chosen?'#52362c':d.color,'center',800);if(available){this.c.fillStyle=chosen?'#6e4e2f':'#e6c57f';this.c.beginPath();this.c.arc(x+w-9,y+9,3.5,0,7);this.c.fill();}this.buttons.push({id:'tool',label:d.name+' 선택',data:type,x,y,w,h});}
 drawFooter(s){const w=this.w,h=this.h,m=s.layout.mobile,y=h-s.layout.footer;this.panel(0,y,w,s.layout.footer+5,{r:0});this.c.fillStyle='#bc955d';this.c.fillRect(0,y,w,2);
  if(s.mode==='design'){
   if(m){this.button('category','타워',10,y+7,70,44,{active:s.category==='tower',data:'tower',small:true});this.button('category','파트장',88,y+7,82,44,{active:s.category==='hero',data:'hero',small:true});this.button('undo','되돌림',178,y+7,(w-198)/2,44,{small:true});this.button('remove','제거',188+(w-198)/2,y+7,(w-198)/2,44,{small:true,disabled:!s.editor.selected});
    const types=Object.keys(CATALOG).filter(k=>CATALOG[k].kind===s.category),cw=(w-20-(types.length-1)*5)/types.length;types.forEach((type,i)=>this.card(s,type,10+i*(cw+5),y+58,cw,64));
    this.button('save','배치 저장',10,h-59,w*.40-12,48,{gold:true});this.button('prepare','공격 준비',w*.40+5,h-59,w*.60-15,48,{gold:true});
   }else{const by=y+(w<1180?61:38);this.text('발판을 눌러 선택 · 빈 발판을 눌러 이동',22,y+(w<1180?22:27),w<1180?15:17,'#e9d6bb');if(w>=1180)this.text(s.editor.dirty?'아직 저장하지 않은 배치':'저장된 방어배치',22,y+58,15,s.editor.dirty?'#ffc475':'#97dfb9');this.button('undo','되돌리기',w-660,by,118,48);this.button('remove','선택 제거',w-532,by,116,48,{disabled:!s.editor.selected});this.button('save','배치 저장',w-404,by,166,48,{gold:true});this.button('prepare','공격 준비',w-226,by,204,48,{gold:true});}
   if(!s.layout.side&&!m){const types=Object.keys(CATALOG).filter(k=>CATALOG[k].kind===s.category);types.slice(0,4).forEach((type,i)=>this.card(s,type,20+i*90,y-100,80,85));this.button('category',s.category==='tower'?'파트장 보기':'타워 보기',390,y-72,124,44,{data:s.category==='tower'?'hero':'tower'});}
  }else if(s.mode==='prepare'){
   this.text('일괄 출격 병력',m?16:24,y+24,m?16:19,'#ead4af');const bw=m?(w-32-16)/3:116,by=y+45;[320,640,960].forEach((n,i)=>this.button('amount',n+'명',m?16+i*(bw+8):24+i*128,by,bw,44,{data:n,active:s.amount===n}));
   if(m){this.button('edit','방어 설계',16,h-61,w*.38-20,48);this.button('launch','진격하라!',w*.38+6,h-61,w*.62-22,48,{gold:true});}else{this.text('상대의 저장된 전장으로 진입합니다',445,y+34,17,'#e5cdb5');this.button('edit','방어 설계',w-415,y+38,155,48);this.button('launch','진격하라!',w-244,y+38,220,48,{gold:true});}
  }else{
   const b=s.battle;if(m){this.text('방어 본진',16,y+25,16,'#f3dbb9');this.text(Math.ceil(b.centerHp)+' / '+b.centerMax,w-16,y+25,15,'#ffbfca','right');this.progress(16,y+43,w-32,16,b.centerHp/b.centerMax,'#ec7e92');this.button('speed',s.speed+'배속',16,y+75,88,44,{active:s.speed===2});this.button('pause',s.paused?'계속':'일시정지',112,y+75,106,44);this.button('skip','스킵',226,y+75,w-242,44);this.button('follow',s.follow?'추적 켜짐':'추적 꺼짐',16,h-59,w*.48-20,44,{active:s.follow});this.button('log','전투 기록',w*.48+8,h-59,w*.52-24,44);}
   else{this.text('방어 본진',24,y+26,18,'#ffe5bc');this.progress(24,y+46,260,20,b.centerHp/b.centerMax,'#ee8298');this.text(Math.ceil(b.centerHp)+' / '+b.centerMax,24,y+86,15,'#ffccd3');this.text('경과 '+Math.floor(b.time)+'초 · 격파 '+b.kills+'명',320,y+50,18,'#e8d5bd');this.button('speed',s.speed+'배속',w-468,y+38,98,48,{active:s.speed===2});this.button('pause',s.paused?'계속':'일시정지',w-358,y+38,112,48);this.button('skip','스킵',w-234,y+38,92,48);this.button('log','기록',w-130,y+38,106,48);}
  }
 }
 drawSide(s){const w=this.w,h=this.h,x=w-s.layout.side,y=s.layout.header;this.panel(x,y,s.layout.side,h-y-s.layout.footer,{r:0});this.text('방어 설정',x+20,y+26,22,'#ffe3a4');this.text('타워 '+s.editor.items.filter(p=>CATALOG[p.type].kind==='tower').length+'/6 · 파트장 '+s.editor.items.filter(p=>CATALOG[p.type].kind==='hero').length+'/6',x+20,y+57,16,'#ddcfda');this.button('category','타워',x+16,y+83,116,42,{active:s.category==='tower',data:'tower'});this.button('category','파트장',x+144,y+83,120,42,{active:s.category==='hero',data:'hero'});const types=Object.keys(CATALOG).filter(k=>CATALOG[k].kind===s.category);types.forEach((type,i)=>this.card(s,type,x+16+(i%2)*128,y+140+Math.floor(i/2)*104,116,92));const picked=CATALOG[s.editor.tool],bottom=y+140+Math.ceil(types.length/2)*104;this.text(picked.name+' · '+picked.desc,x+18,bottom+17,16,picked.color);this.text('사거리 '+(picked.globalRange?'전역':Math.round((picked.kind==='hero'?heroStats(s.growth,s.editor.tool):towerStats(s.growth,s.editor.tool))?.range||picked.range)),x+18,bottom+47,15,'#dbced8');if(s.editor.selected)this.button('remove','선택한 배치 제거',x+16,bottom+72,248,44);}
 drawMapControls(s){const v=s.layout.stage,m=s.layout.mobile;const x=v.x+v.w-54;this.button('plus','+',x,v.y+15,44,44,{small:false});this.button('minus','−',x,v.y+65,44,44);this.button('fit',s.expanded?'화면 복귀':'전체보기',x-28,v.y+115,72,44,{small:true});
  const width=m?116:168,height=width*2/3,mapX=v.x+v.w-width-13,mapY=v.y+v.h-height-12,c=this.c;
  this.panel(mapX-3,mapY-3,width+6,height+6,{r:9,alpha:.95});c.save();this.rect(mapX,mapY,width,height,6);c.clip();c.drawImage(isSiegeScene(s)?(s.battle&&s.battle.siegeVersion!==11?this.art.siegeV10Map:this.art.siegeMap):s.battle?.objective==='conquest'||s.mode==='design'&&s.scope!=='home'?this.art.conquestMap:this.art.map,mapX,mapY,width,height);
  for(const d of s.activeItems){const p=(s.battle?.pads||(s.scope!=='home'?SIEGE_PADS:PADS)).find(v=>v.id===d.pad);c.fillStyle=CATALOG[d.type].color;c.beginPath();c.arc(mapX+p.x/WORLD.w*width,mapY+p.y/WORLD.h*height,2.2,0,7);c.fill();}
  if(s.battle){for(const u of s.battle.units){if(u.hp<=0||u.s<0)continue;const p=s.battle.position(u);c.fillStyle='#fff6bd';c.fillRect(mapX+p.x/WORLD.w*width,mapY+p.y/WORLD.h*height,1.2,1.2);}}
  const cam=s.camera,visibleW=v.w/cam.zoom,visibleH=v.h/cam.zoom;c.strokeStyle='#fff6cf';c.lineWidth=1.5;c.strokeRect(mapX+(cam.x-visibleW/2)/WORLD.w*width,mapY+(cam.y-visibleH/2)/WORLD.h*height,visibleW/WORLD.w*width,visibleH/WORLD.h*height);c.restore();this.minimap={x:mapX,y:mapY,w:width,h:height};
  if(s.mode!=='battle'){this.panel(v.x+12,v.y+v.h-43,m?184:300,30,{r:9,alpha:.9});this.text(m?'드래그로 전장 이동':'드래그로 전장 이동 · 휠로 확대',v.x+22,v.y+v.h-28,14,'#fff0cf');}
 }
 drawToast(s){if(!s.toast||s.toast.until<s.elapsed)return;const width=Math.min(this.w-30,410),y=s.layout.header+75;this.panel((this.w-width)/2,y,width,46,{gold:true,alpha:.96});this.text(s.toast.message,this.w/2,y+23,this.w<760?14:17,'#55352d','center');}
 drawLog(s){const width=Math.min(this.w-24,540),height=Math.min(this.h-180,340),x=(this.w-width)/2,y=s.layout.header+38;this.panel(x,y,width,height);this.text('전투 기록',x+20,y+28,22,'#ffe1a0');const logs=(s.battle?.events||[]).slice(-7);logs.forEach((e,i)=>this.text(Math.floor(e.at)+'초  '+e.message,x+20,y+72+i*31,this.w<760?14:16,'#ecdcce'));this.button('log','닫기',x+width-86,y+12,72,38,{small:true});}
 drawResult(s){const c=this.c,b=s.battle,m=s.layout.mobile;c.fillStyle='#120e27bd';c.fillRect(0,0,this.w,this.h);const w=Math.min(this.w-28,m?420:590),h=m?416:480,x=(this.w-w)/2,y=(this.h-h)/2;this.panel(x,y,w,h,{gold:true});c.save();this.rect(x+8,y+8,w-16,h-16,12);c.clip();const image=b.won?this.art.win:this.art.loss;c.drawImage(image,x+8,y+8,w-16,Math.min(h-16,w*.64));const g=c.createLinearGradient(0,y+h*.36,0,y+h*.65);g.addColorStop(0,'#30233700');g.addColorStop(1,'#302337');c.fillStyle=g;c.fillRect(x+8,y+h*.34,w-16,h*.66);c.restore();this.text(b.won?'침공 성공!':'방어 성공!',this.w/2,y+h*.49,m?32:38,'#ffe4a3','center',900);this.text(b.won?'상대 물류센터를 무너뜨렸어요':'공격 병력을 끝까지 막아냈어요',this.w/2,y+h*.60,m?15:18,'#f5dec5','center');this.text('잔존 '+b.alive+'명  ·  전투 '+Math.floor(b.time)+'초',this.w/2,y+h*.70,17,'#e3cbb5','center');this.button('again','다시 공격',x+18,y+h-71,(w-48)/2,50,{gold:true});this.button('edit','방어 설계',x+30+(w-48)/2,y+h-71,(w-48)/2,50);}
 hit(x,y){return [...this.buttons].reverse().find(b=>!b.disabled&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);}
}
