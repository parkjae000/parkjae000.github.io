import {HEROES} from './hero-design.js?v=20261124-v220-weekly-boss';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
const def=id=>HEROES.find(h=>h.id===id)||HEROES[0];
export const SKILL_DURATION=6,SKILL_COOLDOWN=12;
function text(c,s,x,y,n=17,color='#685547',align='center'){c.font='700 '+n+'px "Noto Sans CJK KR",sans-serif';c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);}
function line(c,x,y,r,color,w=2,a=1){c.save();c.globalAlpha=a;c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.ellipse(x,y,r,r*.35,0,0,TAU);c.stroke();c.restore();}
function star(c,x,y,r,color,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,d=i%2?r*.30:r;c.lineTo(Math.cos(a)*d,Math.sin(a)*d);}c.closePath();c.fill();c.restore();}
function shield(c,x,y,size,color,alpha=.55){c.save();c.globalAlpha=alpha;c.strokeStyle=color;c.fillStyle=color+'28';c.lineWidth=2;c.beginPath();c.moveTo(x-size*.5,y-size*.5);c.lineTo(x+size*.5,y-size*.5);c.lineTo(x+size*.44,y+size*.16);c.quadraticCurveTo(x,y+size*.7,x-size*.44,y+size*.16);c.closePath();c.fill();c.stroke();c.restore();}
function snow(c,x,y,r,alpha){c.save();c.globalAlpha=alpha;c.strokeStyle='#cff5ff';c.lineWidth=1.7;for(let i=0;i<3;i++){const a=i*Math.PI/3;c.beginPath();c.moveTo(x-Math.cos(a)*r,y-Math.sin(a)*r);c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.stroke();}c.restore();}
function plus(c,x,y,s,color,alpha){c.save();c.globalAlpha=alpha;c.fillStyle=color;c.fillRect(x-s*.18,y-s*.55,s*.36,s*1.1);c.fillRect(x-s*.55,y-s*.18,s*1.1,s*.36);c.restore();}
export function drawHeroActor(c,A,h,t,st){
 const d=def(h.id),skill=h.skill,moving=h.moving;
 const frame=skill.casting?(skill.age<.30?2:3):moving?(Math.floor(t*5)%2):h.attacking?(t%1.1<.32?2:3):0;
 const img=A.heroFrames[h.id][frame],height=104*(A.heroScale[h.id]||1),w=img.width*height/img.height,bob=moving?Math.abs(Math.sin(t*9))*3:Math.sin(t*2.4)*.9;
 c.save();c.fillStyle=h.side?'#a06b7728':'#679f952a';c.beginPath();c.ellipse(h.x,h.y,31,7,0,0,TAU);c.fill();
 c.strokeStyle=h.side?'#bb7886':'#73a69a';c.lineWidth=1.5;c.stroke();c.translate(h.x,h.y-bob);if(h.side)c.scale(-1,1);
 if(skill.casting){c.shadowColor=d.color;c.shadowBlur=d.rarity==='rare'?13:5;}
 c.drawImage(img,-w/2,-height,w,height);c.restore();
 text(c,d.short+' 파트장',h.x,h.y-(h.id==='returns'&&skill.casting?151:126),14,d.rarity==='rare'?'#9a6ba5':h.side?'#a36d7b':'#548c83');
 return frame;
}
function targets(units,side,friendly=false){const group=units.filter(u=>(u.side===side)===friendly);return group.filter((u,i)=>i%3===0).slice(0,4);}
export function drawHeroEffects(c,A,h,units,t,st,layer='front'){
 const s=h.skill;if(!s.active)return {particles:0,limit:0};const d=def(h.id),rare=d.rarity==='rare',age=s.age,power=clamp(age/.25)*clamp((6-age)/.65),dir=h.side?-1:1;
 const enemies=targets(units,h.side),allies=targets(units,h.side,true),foe=st.fronts[1-h.side],own=st.fronts[h.side];
 const targetX=s.target==='army'?foe:h.side?1280-(s.target==='wall'?971:s.target==='turret'?1014:1140):(s.target==='wall'?971:s.target==='turret'?1014:1140),targetY=s.target==='army'?500:515;
 c.save();c.globalAlpha=power*(h.side?.65:1);let count=0;
 if(layer==='back'){
  if(h.id==='frozen'){line(c,foe,535,48+Math.sin(t*2)*3,'#a9e5f0',1.6,.55);}
  if(h.id==='chilled'){line(c,own,553,54+Math.sin(t*2)*3,'#8fcfb6',1.8,.6);}
  if(h.id==='ambient'){for(const u of allies)line(c,u.x,u.y,19,'#c2d494',1.5,.6);}
  if(h.id==='cs'){for(let i=0;i<3;i++){const q=(age*.58+i*.33)%1;line(c,h.x+dir*36,596,24+q*150,i%2?'#85d6ee':'#f9d888',2.5,(1-q)*.8);}line(c,own,547,100,'#f3d280',2,.35);count=12;}
  if(h.id==='beauty'){line(c,targetX,targetY+40,82,'#c395d9',2.2,.6);for(let i=0;i<6;i++){const a=t*.7+i*TAU/6;star(c,targetX+Math.cos(a)*85,targetY+40+Math.sin(a)*28,5,'#d9b1ef',a);}count=6;}
  if(h.id==='returns'){const q=clamp((age-.38)/.85);if(age>.38&&age<1.6){for(let i=0;i<3;i++)line(c,targetX,targetY+25,25+q*135+i*8,i%2?'#ffd89d':'#efa25c',3,(1-q)*.9);count=18;}}
  c.restore();return {particles:count,limit:rare?48:16};
 }
 if(h.id==='frozen'){
  for(let i=0;i<10;i++){const q=(age*.42+i*.17)%1,x=foe-43+(i*29)%91,y=411+(i*43)%145-q*25;snow(c,x,y,4+i%3,.35+.5*(1-q));count++;}
  for(const u of enemies.slice(0,3))line(c,u.x,u.y-12,13,'#addef2',1,.6);
 }
 if(h.id==='chilled'){
  for(let i=0;i<8;i++){const q=(age*.8+i*.13)%1,x=own-52+(i*31)%115,y=550-q*115;plus(c,x,y,7+i%3,'#a6e4c7',1-q);count++;}
  if(Math.floor(age)%2===0)text(c,'+2% 회복',own,393-(age%1)*12,15,'#509d7a');
 }
 if(h.id==='ambient'){for(const u of allies.slice(0,4)){shield(c,u.x+dir*10,u.y-22,27,'#bad08c',.5+.2*Math.sin(age*4));count++;}shield(c,h.x+dir*34,h.y-39,45,'#b8cc83',.7);count++;}
 if(h.id==='cs'){
  for(const u of allies){shield(c,u.x,u.y-21,30,'#9cd9e9',.55);star(c,u.x,u.y-52,6,'#f3d280',t*.7);count+=2;}
  for(let i=0;i<18;i++){const q=(age*.6+i*.071)%1,x=h.x+dir*(40+q*150),y=540-Math.sin(q*Math.PI)*95+i%3*14;star(c,x,y,3+i%3,i%2?'#c9f3ff':'#ffe5a4',t+i);count++;}
  if(age<1.4){text(c,'공격 ↑  공속 ↑',own,385,17,'#659fb6');text(c,'보호막',own,409,15,'#b9974e');}
 }
 if(h.id==='beauty'){
  const list=enemies.slice(0,3);if(!list.length)list.push({x:targetX,y:targetY+20});
  for(const [i,u]of list.entries()){
   const p=.5+.18*i,q=clamp((age-p)/.45),x=u.x,y=u.y-24;
   c.strokeStyle='#c08bde';c.lineWidth=2;c.beginPath();c.arc(x,y,19+Math.sin(t*4+i)*2,0,TAU);c.stroke();
   star(c,x,y,12,'#ddbef1',Math.PI/4);count+=2;
   if(age>=p&&age<p+.55){const from=i?list[i-1]:{x:h.x+dir*35,y:h.y-65};c.strokeStyle='#f4ddff';c.lineWidth=3-q*2;c.beginPath();c.moveTo(from.x,from.y-(i?24:0));c.quadraticCurveTo((from.x+x)/2,Math.min(from.y,y)-50,x,y);c.stroke();for(let j=0;j<8;j++){const a=j*TAU/8;star(c,x+Math.cos(a)*(12+q*30),y+Math.sin(a)*(12+q*30),4*(1-q)+1,j%2?'#e9c6ff':'#fff0cf',a);}count+=8;}
  }
  for(let i=0;i<12;i++){const q=(age*.45+i*.14)%1,a=i*2.399;star(c,targetX+Math.cos(a)*(25+q*65),targetY-20+Math.sin(a)*55-q*22,3+i%3,'#cf9deb',t+i);count++;}
 }
 if(h.id==='returns'){
  if(age>.38&&age<1.65){const q=clamp((age-.38)/1.25);for(let i=0;i<24;i++){const a=i*2.399,r=(28+i%5*12)*q,x=targetX+Math.cos(a)*r,y=targetY-12+Math.sin(a)*r*.45-Math.sin(q*Math.PI)*(12+i%4*7);c.save();c.globalAlpha*=1-q;c.fillStyle=i%3===0?'#ffe6b2':i%2?'#e9a76a':'#b79880';c.translate(x,y);c.rotate(q*i);c.fillRect(-2,-3,4+i%3,6);c.restore();count++;}star(c,targetX,targetY-12,45*(1-q),'#ffdda5',q);count++;}
  if(s.target!=='army'){for(let i=0;i<8;i++){const a=t*2+i*TAU/8;star(c,targetX+Math.cos(a)*45,targetY-15+Math.sin(a)*28,3,'#ffd594',a);count++;}text(c,'공성 ×2.5',targetX,350,18,'#bd7d43');}
 }
 // The normal and rare effect budgets stay bounded independently of army size.
 c.restore();return {particles:count,limit:rare?48:16};
}
export function drawSkillBanner(c,h){
 if(!h?.skill.active)return;const d=def(h.id),rare=d.rarity==='rare';
 c.save();c.fillStyle=rare?'#fff6eaf2':'#f0faf3f2';c.strokeStyle=rare?'#d6b1dc':'#b9d6c9';c.lineWidth=1.5;c.beginPath();c.roundRect(380,126,520,63,16);c.fill();c.stroke();
 text(c,d.short+' · '+d.skill,640,151,19,rare?'#9870a9':'#5c8b83');text(c,d.summary,640,176,15,'#8c7c70');c.restore();
}
export function drawSkillCutIn(c,A,h){
 if(!h||!h.skill.casting)return;const d=def(h.id);if(d.rarity!=='rare')return;
 const age=h.skill.age,alpha=clamp(age/.15)*clamp((.95-age)/.20),x=418+(1-clamp(age/.22))*35,y=220;
 c.save();c.globalAlpha=alpha;c.shadowColor=d.color;c.shadowBlur=14;
 const g=c.createLinearGradient(x,y,x+444,y+98);g.addColorStop(0,'#fff9eb');g.addColorStop(.55,'#f7eafc');g.addColorStop(1,'#f0e4f6');
 c.fillStyle=g;c.strokeStyle='#d7b579';c.lineWidth=2;c.beginPath();c.moveTo(x+18,y);c.lineTo(x+444,y);c.lineTo(x+426,y+98);c.lineTo(x,y+98);c.closePath();c.fill();c.stroke();c.shadowBlur=0;
 c.save();c.beginPath();c.roundRect(x+18,y+7,84,84,15);c.clip();const im=A[d.art];if(!im?.width){c.restore();c.restore();return;}const k=Math.max(84/im.width,84/im.height);c.drawImage(im,x+18+(84-im.width*k)/2,y+7+(84-im.height*k)/2,im.width*k,im.height*k);c.restore();
 text(c,d.name,x+121,y+32,17,'#a48256','left');text(c,d.skill,x+121,y+74,31,'#88609c','left');
 for(let i=0;i<5;i++)star(c,x+360+i*11,y+22+(i%2)*18,4+(i%2)*2,i%2?'#c59cda':'#dfbc78',age+i);c.restore();
}
