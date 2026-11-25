import {clamp,CATALOG} from './engine.mjs?v=td-ux-13';
const TAU=Math.PI*2;
const hash=n=>{const x=Math.sin(n*127.1+31.7)*43758.5453;return x-Math.floor(x);};
export class CombatVFX{
 constructor(renderer){this.r=renderer;this.c=renderer.c;this.art=renderer.art;}
 glow(x,y,r,color,alpha=1){this.r.burst(x,y,r,color,alpha);}
 image(im,x,y,w,h,rotation=0,alpha=1){const c=this.c;c.save();c.translate(x,y);c.rotate(rotation);c.globalAlpha*=alpha;c.drawImage(im,-w/2,-h/2,w,h);c.restore();}
 orb(kind,x,y,size,angle=0,alpha=1){const c=this.c,im=this.art[kind],h=size*im.height/im.width;c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);c.drawImage(im,-size*.80,-h*.5,size,h);c.restore();}
 bolt(a,b,time,seed=0,power=1,alpha=1){const c=this.c,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/Math.max(1,len),ny=dx/Math.max(1,len),phase=Math.floor(time*30);c.save();c.globalAlpha*=alpha;c.lineJoin='round';c.lineCap='round';c.beginPath();
  for(let i=0;i<=10;i++){const k=i/10,j=(hash(seed+i*11+phase*3)-.5)*Math.min(30,len*.22)*(i===0||i===10?0:1),x=a.x+dx*k+nx*j,y=a.y+dy*k+ny*j;i?c.lineTo(x,y):c.moveTo(x,y);}
  for(const [w,col]of [[17*power,'#8569ff35'],[7*power,'#b39dff'],[2.2*power,'#fffaff']]){c.strokeStyle=col;c.lineWidth=w;c.stroke();}
  c.strokeStyle='#a3dfff';c.lineWidth=1.2*power;
  for(let i=0;i<3;i++){const k=.25+i*.22,x=a.x+dx*k,y=a.y+dy*k,q=hash(seed+phase+i)*28-14;c.beginPath();c.moveTo(x,y);c.lineTo(x+nx*q+dx*.03,y+ny*q+dy*.03);c.lineTo(x+nx*q*1.7+dx*.08,y+ny*q*1.7+dy*.08);c.stroke();}
  c.restore();
 }
 shard(x,y,len,angle,color='#d4faff',width=4){const c=this.c;c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();c.moveTo(-width,0);c.lineTo(0,-len);c.lineTo(width,0);c.lineTo(0,5);c.closePath();c.fill();c.restore();}
 impact(e,age){const c=this.c,t=clamp(age,0,1.7),fade=Math.max(0,1-t/1.25),r=e.radius,color=CATALOG[e.type]?.color||'#ffd26d';
  if(e.type==='cannon'){
   const f=Math.max(0,1-age/.22);if(!f)return;c.save();c.globalAlpha=f;this.glow(e.x,e.y,22,'#ffb84f',.9);for(let i=0;i<7;i++){const ang=hash(e.id+i)*TAU,dist=(8+age*110)*hash(i+3);c.strokeStyle=i%2?'#fff8b6':'#ff9a44';c.lineWidth=i%2?1.3:2;c.beginPath();c.moveTo(e.x+Math.cos(ang)*dist,e.y+Math.sin(ang)*dist*.5);c.lineTo(e.x+Math.cos(ang)*(dist+11),e.y+Math.sin(ang)*(dist+11)*.5);c.stroke();}c.restore();return;
  }
  if(e.type==='tesla'||e.type==='cs'&&e.skill){
   const targets=e.targets.length?e.targets:[{x:e.x,y:e.y}];let prev=e.type==='cs'&&e.skill?{x:e.x-30,y:e.y-450}:{x:e.fromX,y:e.fromY};
   targets.forEach((p,i)=>{const hop=age-i*.024;if(hop<0)return;const alpha=Math.max(0,1-hop/.48);if(!alpha)return;this.bolt(prev,p,e.at+age,e.id*21+i,e.skill?1.5:1,alpha);this.image(this.art.fxElectric,p.x,p.y-10,e.skill?85:53,e.skill?85:53,hash(i)*TAU,alpha*.85);for(let j=0;j<2;j++){const q={x:p.x+(j?1:-1)*(15+hash(i+j)*16),y:p.y+hash(i+j+9)*15-8};this.bolt(p,q,e.at+age,e.id+i+j,.45,alpha);}
    prev=p;});return;
  }
  if(e.type==='laser'){
   const a={x:e.fromX,y:e.fromY},b=e.beamEnd||{x:e.x,y:e.y};if(age<.40){const alpha=Math.max(0,1-age/.4);c.save();c.globalAlpha=alpha;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);for(const [w,col]of [[24,'#5ddfff30'],[10,'#42cfff'],[3,'#efffff']]){c.lineWidth=w;c.strokeStyle=col;c.stroke();}c.restore();this.glow(b.x,b.y,50,'#5bdfff',alpha);for(const p of e.targets)this.glow(p.x,p.y,26,'#c6faff',alpha);}
   return;
  }
  if(e.type==='returns'&&e.skill){
   // Impact is timed to the model's damage, with a short white core then molten crater.
   if(age<.13){this.glow(e.x,e.y,70+age*450,'#fff0ad',1-age/.13);}
   if(age<1.15){const size=110+Math.sin(Math.min(1,age/.35)*Math.PI/2)*170;this.image(this.art.fxExplosion,e.x,e.y-36,size,size,0,Math.min(1,age*15+.4)*fade);}
   c.save();c.globalAlpha=Math.max(0,1-age/2)*.75;c.strokeStyle='#f79b42';c.lineWidth=5;c.beginPath();c.ellipse(e.x,e.y,r*(.25+Math.min(age/.55,1)),r*.50*(.25+Math.min(age/.55,1)),0,0,TAU);c.stroke();
   c.fillStyle='#392c3f88';c.beginPath();c.ellipse(e.x,e.y,56,26,0,0,TAU);c.fill();c.restore();
   for(let i=0;i<15;i++){const ang=i*2.399,dist=(15+age*120)*(hash(i+e.id)*.7+.3);c.save();c.globalAlpha=fade;c.translate(e.x+Math.cos(ang)*dist,e.y+Math.sin(ang)*dist*.5-age*65+age*age*45);c.rotate(i+age*5);c.fillStyle=i%3?'#6e4c50':'#ffc56a';c.fillRect(-4,-5,8+hash(i)*7,9);c.restore();}
   return;
  }
  if(e.type==='frozen'||e.type==='ice'||e.type==='chilled'){
   if(age<.5){c.save();c.globalAlpha=fade*.8;c.fillStyle='#c4f5ff44';c.beginPath();c.ellipse(e.x,e.y,r*Math.min(1,age*4+.1),r*.55*Math.min(1,age*4+.1),0,0,TAU);c.fill();c.restore();}
   for(let i=0;i<(e.skill?18:11);i++){const ang=i*2.399,dist=(12+age*(e.skill?125:85))*(.3+hash(i+e.id)*.7),x=e.x+Math.cos(ang)*dist,y=e.y+Math.sin(ang)*dist*.55-age*26;c.save();c.globalAlpha=fade;this.shard(x,y,8+hash(i)*15,ang+age*3,i%2?'#e7ffff':'#77ceff',2+hash(i)*3);c.restore();}
   if(e.skill&&e.type==='chilled')for(let i=0;i<7;i++){const growth=clamp((age-i*.035)*5,0,1),offset=(i-3)*27,x=e.x-Math.sin(e.angle)*offset,y=e.y+Math.cos(e.angle)*offset;this.image(this.art.fxCrystal,x,y-42*growth,55,90*growth,0,Math.min(1,fade*1.3));}
   return;
  }
  if(e.type==='ambient'||e.type==='returns'){
   if(age<.65){const size=(e.skill?150:75)*(1+age);this.image(this.art.fxExplosion,e.x,e.y-20,size,size,0,fade);this.glow(e.x,e.y,r*.75,'#ff9e38',fade*.4);}
   for(let i=0;i<11;i++){const ang=i*2.399,dist=age*(60+hash(i)*80);this.glow(e.x+Math.cos(ang)*dist,e.y+Math.sin(ang)*dist*.5-age*12,2+hash(i)*3,'#ffcb66',fade);}
   return;
  }
  if(e.type==='beauty'){
   const n=e.skill?25:12;for(let i=0;i<n;i++){const ang=i*2.399+age*(e.skill?8:4),rad=r*(e.skill?Math.max(.08,.9-age*.4):age*.8),x=e.x+Math.cos(ang)*rad*(.4+hash(i)*.6),y=e.y+Math.sin(ang)*rad*.55;c.save();c.translate(x,y);c.rotate(ang);c.globalAlpha=fade;c.fillStyle=i%3?'#ff9be0':'#fff2c4';c.beginPath();c.ellipse(0,0,e.skill?5:3,e.skill?12:7,0,0,TAU);c.fill();c.restore();}return;
  }
  if(e.type==='cs'){this.image(this.art.fxElectric,e.x,e.y-8,80*(1+t),80*(1+t),t,fade);}
 }
 projectile(e,time){const c=this.c,age=time-e.at,progress=clamp(age/e.delay,0,1),after=age-e.delay;
  if(after>=0){this.impact(e,after);return;}
  if(e.type==='returns'&&e.skill){
   // Deliberate ground shadow; the huge meteor enters from above the battlefield.
   const t=progress*progress,x=e.x-230*(1-t),y=e.y-570*(1-t);c.save();c.globalAlpha=.15+.30*progress;c.fillStyle='#5c293a';c.beginPath();c.ellipse(e.x,e.y,28+progress*45,14+progress*22,0,0,TAU);c.fill();c.restore();
   this.glow(x,y,70,'#ff9842',.3+progress*.4);const im=this.art.fxMeteor,size=150,h=size*im.height/im.width;c.save();c.translate(x,y);c.rotate(.38);c.drawImage(im,-size*.75,-h*.80,size,h);c.restore();
   for(let i=0;i<10;i++){const k=(progress*2+hash(i))%1;this.glow(x-45-k*90,y-85-k*160,2+hash(i)*5,'#ffc064',(1-k)*.7);}return;
  }
  if(e.skill&&e.type==='frozen'){this.glow(e.x,e.y,40+progress*90,'#a7f4ff',progress*.3);return;}
  if(e.skill&&e.type==='ambient'){for(let i=0;i<5;i++){const off=(i-2)*40;this.glow(e.x-Math.sin(e.angle)*off,e.y+Math.cos(e.angle)*off,25,'#ffb04b',progress*.4);}return;}
  if(e.type==='tesla'||e.type==='laser'||e.skill&&e.type==='cs'){this.glow(e.fromX,e.fromY,16+progress*19,e.type==='tesla'?'#b6a0ff':'#98f2ff',progress);return;}
  if(e.skill&&e.type==='chilled'){this.glow(e.x,e.y,progress*110,'#a2f1ff',progress*.3);return;}
  if(e.skill&&e.type==='beauty'){this.glow(e.x,e.y,20+progress*85,'#f48fe3',progress*.3);return;}
  const t=progress,x=e.fromX+(e.x-e.fromX)*t,y=e.fromY+(e.y-e.fromY)*t-Math.sin(t*Math.PI)*(e.type==='cannon'?0:60),angle=Math.atan2(e.y-e.fromY-60*Math.cos(t*Math.PI),e.x-e.fromX);
  if(e.type==='cannon'){
   c.save();for(let i=0;i<3;i++){const offset=(i-1)*4,px=x+Math.sin(angle)*offset,py=y-Math.cos(angle)*offset;c.beginPath();c.moveTo(px-Math.cos(angle)*35,py-Math.sin(angle)*35);c.lineTo(px,py);c.strokeStyle='#ffb748';c.lineWidth=3;c.stroke();c.strokeStyle='#fff4b8';c.lineWidth=1;c.stroke();}c.restore();return;
  }
  if(e.type==='ambient'){this.glow(x,y,34,'#ffae4c',.5);this.orb('fxFireball',x,y,83,angle);}
  else if(e.type==='frozen'||e.type==='ice'){this.orb('fxSnowball',x,y,e.type==='ice'?58:70,angle);for(let i=0;i<5;i++){const k=(time*4+i*.2)%1;c.fillStyle='#d6faff';c.globalAlpha=(1-k)*.8;c.beginPath();c.arc(x-Math.cos(angle)*k*40+(hash(i)-.5)*14,y-Math.sin(angle)*k*40+(hash(i+5)-.5)*14,1.5+k*2,0,TAU);c.fill();}c.globalAlpha=1;}
  else if(e.type==='chilled'){c.save();c.translate(x,y);c.rotate(angle+Math.PI/2);this.image(this.art.fxCrystal,0,0,25,60);c.restore();}
  else if(e.type==='returns'){this.orb('fxMeteor',x,y,65,angle-Math.PI/4);}
  else if(e.type==='cs'){this.image(this.art.fxElectric,x,y,48,48,time*3);this.glow(x,y,20,'#96eaff',.5);}
  else if(e.type==='beauty'){for(let i=0;i<5;i++){const ang=time*13+i*TAU/5;c.save();c.translate(x+Math.cos(ang)*12,y+Math.sin(ang)*8);c.rotate(ang);c.fillStyle=i%2?'#ff9adf':'#ffe5fc';c.beginPath();c.ellipse(0,0,4,10,0,0,TAU);c.fill();c.restore();}this.glow(x,y,19,'#ff8cde',.45);}
 }
 field(f,time,front=false){const c=this.c,age=time-f.at,fade=Math.min(1,age*4,(f.until-time)/.7),r=f.radius;c.save();c.globalAlpha=fade;
  if(!front){
   if(['frozen','chilled','ice'].includes(f.type)){c.fillStyle='#94e3ff3d';c.strokeStyle='#e0ffff66';c.lineWidth=1.5;c.beginPath();c.ellipse(f.x,f.y,r,r*.54,0,0,TAU);c.fill();c.stroke();for(let i=0;i<14;i++){const ang=i*2.399,dist=Math.sqrt(hash(i+f.x))*r,x=f.x+Math.cos(ang)*dist,y=f.y+Math.sin(ang)*dist*.5;c.strokeStyle='#cbf8ff60';c.beginPath();c.moveTo(x-8,y+2);c.lineTo(x+3,y-4);c.lineTo(x+10,y);c.stroke();}}
   if(f.type==='ambient'){const vx=-Math.sin(f.angle),vy=Math.cos(f.angle);c.strokeStyle='#f867354b';c.lineWidth=46;c.beginPath();c.moveTo(f.x-vx*r,f.y-vy*r);c.lineTo(f.x+vx*r,f.y+vy*r);c.stroke();}
   if(f.type==='beauty'){c.fillStyle='#2a12377a';c.beginPath();c.ellipse(f.x,f.y,r*.55,r*.28,0,0,TAU);c.fill();}
  }else{
   if(f.type==='frozen'){
    for(let i=0;i<5;i++){const k=(time*.6+i*.23)%1,ang=f.angle+Math.PI,x=f.x+Math.cos(ang)*(k-.5)*r*1.5-Math.sin(ang)*(i-2)*22,y=f.y+Math.sin(ang)*(k-.5)*r*1.5+Math.cos(ang)*(i-2)*22;this.image(this.art.fxBlizzard,x,y-23,125,80,ang, .48);}
    for(let i=0;i<48;i++){const k=(time*1.2+hash(i)*2)%1,across=(hash(i+5)-.5)*r*1.7,along=(.6-k)*r*2,x=f.x+Math.cos(f.angle)*along-Math.sin(f.angle)*across,y=f.y+Math.sin(f.angle)*along+Math.cos(f.angle)*across;c.fillStyle='#efffff';c.beginPath();c.arc(x,y-15,1+hash(i+7)*2,0,TAU);c.fill();if(i%3===0){c.strokeStyle='#ebffffb0';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-15);c.lineTo(x+Math.cos(f.angle)*22,y-15+Math.sin(f.angle)*22);c.stroke();}}
   }
   if(f.type==='chilled'||f.type==='ice'){const n=f.type==='chilled'?7:4;for(let i=0;i<n;i++){const off=(i-(n-1)/2)*25,x=f.x-Math.sin(f.angle)*off,y=f.y+Math.cos(f.angle)*off;this.image(this.art.fxCrystal,x,y-24,36+hash(i)*15,54+hash(i)*24,0,.85);}}
   if(f.type==='ambient'){
    const count=11;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*r*1.8/(count-1),x=f.x-Math.sin(f.angle)*off,y=f.y+Math.cos(f.angle)*off,hh=85+Math.sin(time*12+i*3)*13+hash(i)*35;this.image(this.art.fxFlame,x,y-hh*.40,50,hh,Math.sin(time*6+i)*.05,.90);}
    for(let i=0;i<18;i++){const k=(time*.9+hash(i))%1,off=(hash(i+4)-.5)*r*1.8,x=f.x-Math.sin(f.angle)*off+(hash(i+8)-.5)*k*22,y=f.y+Math.cos(f.angle)*off-k*150;this.glow(x,y,2+hash(i)*2,'#ffc15a',1-k);}
   }
   if(f.type==='beauty'){
    for(let i=0;i<4;i++){c.beginPath();for(let j=0;j<=35;j++){const k=j/35,ang=k*TAU*1.8+time*3+i*TAU/4,rad=r*k*.9,x=f.x+Math.cos(ang)*rad,y=f.y+Math.sin(ang)*rad*.5;j?c.lineTo(x,y):c.moveTo(x,y);}c.lineWidth=3;c.strokeStyle=i%2?'#ffa3e999':'#dc84ff66';c.stroke();}
    this.glow(f.x,f.y-10,40,'#ef9aff',.45);
   }
  }
  c.restore();
 }
}
