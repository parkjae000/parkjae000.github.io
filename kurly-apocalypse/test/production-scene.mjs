import {PRODUCTION_DEFS} from './production.mjs?v=td-ux-17';
import {short} from './progression.mjs?v=td-ux-17';
export class ProductionScene{
 constructor(art){this.art=art;}
 sprite(c,img,x,y,height){const width=img.width/img.height*height;c.drawImage(img,x-width/2,y-height,width,height);}
 glow(c,x,y,r,color,alpha=.65){c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
 draw(canvas,role,{time=0,active=false,progress=0,event=null,reduced=false}={}){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,art=this.art,index={army:0,air:1,navy:2}[role],im=art.productionFacilities,sw=im.width/3,sourceH=Math.min(im.height,sw*h/w),sy=(im.height-sourceH)*.30,t=reduced?0:time;
 c.clearRect(0,0,w,h);c.drawImage(im,index*sw,sy,sw,sourceH,0,0,w,h);c.save();const scale=Math.min(w/420,h/240);c.scale(scale,scale);c.translate((w/scale-420)/2,h/scale-240);const pulse=.7+Math.sin(t*3)*.2,phase=(t*(active?1:.25))%7;
 // The large animated foreman is decorative and does not occupy a research staff slot.
 const foreman={army:'ambient',air:'cs',navy:'chilled'}[role],frames=art.heroes[foreman],f=active&&!reduced?Math.floor(t*4)%frames.length:0,bob=Math.sin(t*3)*2;
 this.glow(c,64,191,48,PRODUCTION_DEFS[role].color,.12*pulse);this.sprite(c,frames[f],60,220+bob,112);
 if(role==='army'){
  for(let i=0;i<6;i++){const x=active?132+((phase/7*300+i*30)%300):151+i*34,y=174+(i%2)*30,step=active?Math.sin(t*15+i)*2:Math.sin(t*2+i)*.5;const frame=active&&!reduced?Math.floor(t*9+i)%4:0;c.fillStyle='#1b112f44';c.beginPath();c.ellipse(x,y+2,15,4,0,0,7);c.fill();this.sprite(c,art.armyHD||art.forceFrames.army[frame],x,y+step,54);}
 }else if(role==='air'){
  const fly=active?phase/7:0,x=active?185+fly*240:250,y=active?183-Math.sin(fly*Math.PI/2)*85:184+Math.sin(t*2);this.glow(c,x-27,y-21,27,'#58dcff',active?.65:.15);
  if(active)for(let i=0;i<5;i++){c.strokeStyle='#8deaff'+(i%2?'88':'bb');c.lineWidth=2;c.beginPath();c.moveTo(x-44-i*5,y-18+i*3);c.lineTo(x-63-i*8,y-18+i*3);c.stroke();}
  c.save();c.translate(x,y);c.rotate(active?-.10:0);this.sprite(c,art.forceFrames.air[Math.floor(t*8)%2],0,0,90);c.restore();
  if(active)for(let i=0;i<8;i++){const k=(t*1.7+i*.31)%1;c.fillStyle=i%2?'#ffe48a':'#a4efff';c.fillRect(170+Math.cos(i*2.4)*k*27,185-k*25,2,2);}
 }else{
  const x=active?200+phase/7*158:264,y=199+Math.sin(t*2.5)*3;c.save();c.strokeStyle='#b6efffa0';c.lineWidth=2;for(let i=0;i<5;i++){c.globalAlpha=(1-i/6)*.5;c.beginPath();c.ellipse(x-i*10-20,y-8,22+i*3,5+i,0,0,7);c.stroke();}c.restore();
  this.sprite(c,art.forceFrames.navy[Math.floor(t*4)%2],x,y,94);if(active){c.strokeStyle='#c1b5db';c.lineWidth=2;c.beginPath();c.moveTo(320,15);c.lineTo(320,61+Math.sin(t*1.5)*20);c.stroke();c.fillStyle='#ffcf6a';c.fillRect(314,61+Math.sin(t*1.5)*20,12,8);}
 }
 if(active){c.fillStyle='#181127aa';c.beginPath();c.roundRect(126,213,270,15,7);c.fill();c.fillStyle=PRODUCTION_DEFS[role].color;c.beginPath();c.roundRect(128,215,Math.max(1,266*progress),11,5);c.fill();}
 if(event){const age=time-event.at/1000;if(age>=0&&age<2.8){const k=age/2.8;c.save();c.globalAlpha=1-Math.max(0,(k-.5)*2);this.glow(c,245,139,95,'#ffe4a1',.35*(1-k));for(let i=0;i<14;i++){const a=i*2.399,x=245+Math.cos(a)*k*120,y=133+Math.sin(a)*k*65+k*k*25;c.fillStyle=i%2?'#ffda7c':'#b5f2ff';c.save();c.translate(x,y);c.rotate(t*3+i);c.fillRect(-3,-3,6,6);c.restore();}c.font='900 27px "Noto Sans CJK KR",sans-serif';c.textAlign='center';c.strokeStyle='#3b234f';c.lineWidth=5;c.strokeText('+'+short(event.count)+' 합류',250,90-k*22);c.fillStyle='#fff0b5';c.fillText('+'+short(event.count)+' 합류',250,90-k*22);c.restore();}}
 const shade=c.createLinearGradient(0,0,0,75);shade.addColorStop(0,'#18102c66');shade.addColorStop(1,'transparent');c.fillStyle=shade;c.fillRect(0,0,420,75);c.restore();
 }
}
