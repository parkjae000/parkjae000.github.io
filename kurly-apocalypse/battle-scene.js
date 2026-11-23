import {sceneAssets,loadSceneAssets} from './scene-assets.js?v=20261123-v212-research-news';
import {drawHeroActor,drawHeroEffects,drawSkillBanner,drawSkillCutIn} from './hero-motion.js?v=20261123-v212-research-news';
export const HEALTH_KINDS=[['C','센터','🏢','center'],['W','방벽','🛡','wall'],['T','포탑','🎯','turret']];

export function battleHealthMarkup(side,frame,maxima,ready=false,label=null){
  return `<div class="battle-health-card ${side==='a'?'allied':'hostile'}"><strong>${String(label||(side==='a'?'공격 센터':'방어 센터')).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</strong>${HEALTH_KINDS.map(([key,label,icon,color])=>{
    const value=frame?.[side+key]??(side==='a'?maxima[key]:0),max=maxima[key]||1;
    return `<div class="health-row health-${color}" data-health-row="${side+key}"><div><span>${icon} ${label}</span><b data-health-number="${side+key}">${ready&&side==='b'?'선택 전':Math.ceil(value).toLocaleString('ko-KR')+' / '+Math.ceil(max).toLocaleString('ko-KR')}</b></div><i><em data-health-bar="${side+key}" style="width:${Math.max(0,Math.min(100,100*value/max))}%"></em></i></div>`;
  }).join('')}</div>`;
}


const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const MAX_VISIBLE_TROOPS=24;
export function visibleTroops(frame){if(frame.a.ranks||frame.b.ranks)return ['a','b'].flatMap((side,si)=>{const f=frame[side],ranks=f.ranks;if(!ranks)return [];const live=['support','assault','engineer'].filter(k=>ranks[k].n>0),budget=12,counts=Object.fromEntries(live.map(k=>[k,1]));for(let i=live.length;i<Math.min(budget,f.n);i++){const k=live.filter(k=>counts[k]<ranks[k].n).sort((a,b)=>ranks[b].n/(counts[b]+1)-ranks[a].n/(counts[a]+1))[0];if(!k)break;counts[k]++;}return live.flatMap((k,rank)=>Array.from({length:counts[k]},(_,i)=>({id:rank*5+i,side:si,role:k,weapon:{support:'shield',assault:'spear',engineer:'ranged'}[k],x:ranks[k].x*1280+(si?1:-1)*(i%2)*8,y:415+i*43,seed:i*.17,combat:['clash','siege'].includes(ranks[k].phase),moving:['approach','advance'].includes(ranks[k].phase),attackAt:ranks[k].attackAt,targetX:ranks[k].targetX})));});return ['a','b'].flatMap((side,si)=>{const f=frame[side],n=Math.min(12,Math.max(0,f.n));return Array.from({length:n},(_,i)=>({id:i,side:si,seed:((i*97+si*43)%101)/101,x:f.x*1280+(si?1:-1)*(Math.floor(i/4)*25+10)+(i%2?6:-6),y:411+(i%4)*43,combat:f.phase==='clash'||f.phase==='siege'||(!f.phase&&f.engaged)}));});}
export function buildBattleEvents(frames){
 const events=[];for(let i=0;i<frames.length;i++){const after=frames[i],before=frames[i-1]||after;
 for(const effect of after.effects||[])events.push({...effect,at:effect.at??after.t});
 for(const skill of after.skills||[])events.push({...skill,type:'skill',at:skill.at??after.t});
 for(const shot of after.shots||[])events.push({...shot,type:'shot'});
 for(const side of ['a','b']){for(const [key]of HEALTH_KINDS){const damage=before[side+key]-after[side+key];if(damage>0)events.push({type:'structure',side,key,at:after.t,damage});if(before[side+key]>0&&after[side+key]<=0&&!events.some(e=>e.type==='destroy'&&e.side===side&&e.key===key))events.push({type:'destroy',side,key,at:after.t});}
 const lost=before[side].n-after[side].n;if(lost>0)events.push({type:'fall',side,at:after.t,x:before[side].x,count:Math.min(3,lost)});}}
 return events;
}
function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
function txt(c,s,x,y,size=18,color='#66504a',align='left',weight=700){c.font=`${weight} ${size}px "Noto Sans CJK KR", "Malgun Gothic",sans-serif`;c.textAlign=align;c.fillStyle=color;c.fillText(s,x,y);}
function sprite(c,img,x,y,h,{flip=false,a=1,angle=0}={}){const w=img.width*h/img.height;c.save();c.translate(x,y);c.rotate(angle);if(flip)c.scale(-1,1);c.globalAlpha=a;c.drawImage(img,-w/2,-h,w,h);c.restore();return w;}
function shadow(c,x,y,w=32,h=9,a=.18){c.save();c.fillStyle=`rgba(83,54,39,${a})`;c.beginPath();c.ellipse(x,y,w/2,h/2,0,0,TAU);c.fill();c.restore();}
function bar(c,x,y,w,h,p,color){round(c,x,y,w,h,h/2,'#765d5260');if(p>0)round(c,x,y,w*clamp(p),h,h/2,color);}
function burst(c,x,y,age,{color='#ffd268',size=1,count=8}={}){if(age<0||age>.55)return 0;const q=age/.55;c.save();c.globalAlpha=1-q;c.strokeStyle=color;c.lineWidth=2.5*size;c.beginPath();c.ellipse(x,y,(6+q*28)*size,(4+q*16)*size,0,0,TAU);c.stroke();for(let i=0;i<count;i++){const a=i*2.399,d=(15+i%3*11)*q*size;c.fillStyle=i%2?'#fff7d8':color;c.beginPath();c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d-18*q+20*q*q,Math.max(.5,(2.8-q)*size),0,TAU);c.fill();}c.restore();return count;}
function flame(c,A,x,y,h,t,opacity=1){c.save();c.globalAlpha=opacity;const frame=Math.floor(t*7)%3;sprite(c,A.damageFrames[frame],x,y,h,{a:.90});for(let i=0;i<5;i++){const q=(t*.8+i*.21)%1;c.fillStyle=`rgba(255,177,65,${(1-q)*.65})`;c.beginPath();c.arc(x+Math.sin(i*13+t)*14,y-q*h*.8,1.5+(i%2),0,TAU);c.fill();}c.restore();}
function debris(c,x,y,age,scale=1){if(age<0||age>1.25)return 0;const q=age/1.25;c.save();c.globalAlpha=1-q;for(let i=0;i<12;i++){const dir=i%2?-1:1,dx=dir*(10+i*5)*q,dy=-Math.sin(q*Math.PI)*(20+i%4*10)+q*15;c.fillStyle=i%3===0?'#e7b24e':i%2?'#b5aaa2':'#756e71';c.save();c.translate(x+dx*scale,y+dy*scale);c.rotate(q*(i-6));c.fillRect(-3*scale,-3*scale,(5+i%3)*scale,(4+i%4)*scale);c.restore();}for(let i=0;i<7;i++){c.fillStyle='#ddcdb7';c.beginPath();c.ellipse(x+(i-3)*13*q*scale,y-8-q*15,(10+q*20)*scale,(7+q*10)*scale,0,0,TAU);c.fill();}c.restore();return 19;}
function soldier(c,A,u,t,slow){if(u.weapon&&A.troopFrames?.[u.weapon]){const age=t-u.attackAt,frame=u.fall?7:age>=0&&age<.16?4:age>=.16&&age<.35?5:age>=.35&&age<.55?6:u.moving?1+Math.floor(t*7+u.seed*5)%3:0;shadow(c,u.x,u.y,31,7,.2);sprite(c,A.troopFrames[u.weapon][frame],u.x,u.y,64,{flip:!!u.side,a:u.alpha??1});return age>=0&&age<.55;}const phase=t*(slow?.8:1)*(1.25+u.seed*.2)+u.id*.19,attack=u.combat&&phase%1<.23,frame=u.fall?3:attack?2:Math.floor(phase*3)%2,bob=u.combat?Math.sin(phase*9)*.6:Math.abs(Math.sin(phase*10))*2.3;shadow(c,u.x,u.y,26,5,.18);sprite(c,A.fightersFrames[frame+u.side*4],u.x,u.y-bob,43,{flip:!!u.side,a:u.alpha??1,angle:u.fall?(u.side?1:-1)*.15:0});
 if(attack&&u.id%2===0){const dir=u.side?-1:1,tx=u.side?u.x-50:u.x+40;c.strokeStyle=u.side?'#f8ba85':'#ffe5a1';c.lineWidth=1.8;c.beginPath();c.moveTo(u.x+dir*19,u.y-19);c.lineTo(tx,u.y-19);c.stroke();}return attack;}


export function paintBattle(canvas,frame,{phase,events=[],maxima={}}={}){
 const c=canvas.getContext('2d'),scale=canvas.width/1280,A=sceneAssets(),t=frame?.t||0,playing=phase==='battle';
 c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.setTransform(scale,0,0,scale,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 if(!A){c.fillStyle='#eae8da';c.fillRect(0,0,1280,720);txt(c,'전장 준비 중…',640,360,25,'#796b59','center');loadSceneAssets().then(()=>{if(canvas.isConnected)paintBattle(canvas,frame,{phase,events,maxima});}).catch(()=>{});return;}
 c.drawImage(A.yard,0,0,1280,720);if(!frame)return;
 const recent=events.filter(e=>t>=e.at&&t-e.at<1.3),points=(side,key)=>({x:side==='b'?1280-{W:309,T:266,C:140}[key]:{W:309,T:266,C:140}[key],y:{W:517,T:440,C:448}[key]});
 for(const [si,side]of ['a','b'].entries()){
  let index=0;for(const [i,key]of ['W','T','C'].entries())if(frame[side+key]<=0)index=i+1;
  const destroyed=events.filter(e=>e.type==='destroy'&&e.side===side&&e.at<=t).at(-1),age=destroyed?t-destroyed.at:10;
  const x=si?1100:180,opts={flip:!!si};shadow(c,x,611,332,34,.18);
  const hit=recent.some(e=>e.type==='structure'&&e.side===side&&t-e.at<.14);
  c.save();if(hit){c.translate(Math.sin(t*71)*2,0);c.filter='brightness(1.13)';}
  if(index&&age<.55){const q=ease(age/.55);sprite(c,A.fortressFrames[index-1],x,630,360,{...opts,a:1-q});sprite(c,A.fortressFrames[index],x,630,360,{...opts,a:q});}else sprite(c,A.fortressFrames[index],x,630,360,opts);c.restore();
  for(const key of ['W','T','C']){const v=frame[side+key],max=maxima[side]?.[key]||v,p=points(side,key),h={W:94,T:107,C:136}[key];if(v>0&&v<=max*.5)flame(c,A,p.x,p.y,h,t,.9);const e=recent.find(e=>e.type==='destroy'&&e.side===side&&e.key===key);if(e){debris(c,p.x,p.y,t-e.at,key==='C'?1.35:1);flame(c,A,p.x,p.y,h*.7,t,clamp(1-(t-e.at)/1.25)*.7);}}
 }
 const units=visibleTroops(frame),st={fronts:[frame.a.x*1280,frame.b.x*1280]},heroes=[];
 for(const [si,side]of ['a','b'].entries()){const f=frame[side],h=f.h;if(!h||h.hp<=0)continue;const cast=events.filter(e=>e.type==='skill'&&e.side===side&&e.id===h.id&&e.at<=t).at(-1),age=cast?t-cast.at:-1,target={W:'wall',T:'turret',C:'center'}[f.target]||'army';heroes.push({id:h.id,side:si,x:clamp((h.x??(f.x+(si?.0664:-.0664)))*1280,80,1200),y:633,moving:['approach','advance'].includes(h.phase||f.phase),attacking:['clash','siege'].includes(h.phase||f.phase),skill:{age,active:playing&&h.activeUntil>t&&age>=0,casting:playing&&age>=0&&age<.95,target}});}
 for(const h of heroes)drawHeroEffects(c,A,h,units,t,st,'back');
 const entries=units.map(u=>({y:u.y,draw:()=>soldier(c,A,u,t,heroes.some(h=>h.side!==u.side&&h.id==='frozen'&&h.skill.active))}));
 for(const h of heroes)entries.push({y:h.y,draw:()=>drawHeroActor(c,A,h,t,st)});entries.sort((a,b)=>a.y-b.y);for(const e of entries)e.draw();
 for(const h of heroes){drawHeroEffects(c,A,h,units,t,st,'front');const hp=frame[h.side?'b':'a'].h;bar(c,h.x-31,638,62,5,hp.hp/hp.max,h.side?'#cf8997':'#7ab9a7');}
 if(playing){
  for(const e of recent.filter(e=>e.type==='weapon')){const age=t-e.at;if(age>.55)continue;const si=e.side==='b'?1:0,d=si?-1:1,actors=units.filter(u=>u.side===si&&u.role===e.role);for(const u of actors){const x=u.x+d*22,y=u.y-30,to=(e.to??u.targetX)*1280;if(e.weapon==='ranged'){if(age<.2){c.save();c.globalAlpha=1-age/.2;c.fillStyle='#ffb640';c.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?4:13;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fill();c.fillStyle='#fff9c9';c.beginPath();c.arc(x,y,4,0,TAU);c.fill();c.restore();}if(age<.25){const q=age/.25,px=mix(x,to,q);c.strokeStyle='#ffe8a5';c.lineWidth=2.5;c.beginPath();c.moveTo(px-d*20,y);c.lineTo(px,y);c.stroke();}c.save();c.globalAlpha=clamp(1-age/.5);c.fillStyle='#dbb467';c.fillRect(u.x-d*12-age*d*22,y-8-Math.sin(age*7)*12,4,2);c.restore();if(age>=.25)burst(c,to,y,age-.25,{size:.45,count:4});}
   if(e.weapon==='spear'&&age>.08&&age<.4){c.save();c.globalAlpha=Math.sin((age-.08)/.32*Math.PI)*.85;c.fillStyle='#fff0b4';c.beginPath();c.moveTo(x,y-5);c.lineTo(to,y);c.lineTo(x,y+5);c.fill();c.strokeStyle='#fffceb';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(to,y);c.stroke();c.restore();}
   if(e.weapon==='shield'&&age<.4){c.save();c.globalAlpha=1-age/.4;c.strokeStyle='#9ae5f1';c.lineWidth=3;c.beginPath();c.ellipse(x,y,10+age*12,22,0,-Math.PI/2,Math.PI/2);c.stroke();c.restore();}
  }}
  for(const e of recent.filter(e=>e.type==='rank-hit'&&e.role==='support')){const age=t-e.at;if(age<.35)burst(c,e.x*1280,428,age,{color:'#a6e5fa',size:.55,count:5});}
  if(!frame.a.ranks&&(frame.a.phase==='clash'||(!frame.a.phase&&Math.abs(frame.a.x-frame.b.x)<.1)))for(let i=0;i<4;i++)burst(c,640+Math.sin(t*2+i)*18,391+i*43,(t+i*.13)%.51,{size:.5,count:4});
  for(const e of recent){const age=t-e.at;if(e.type==='structure'){const p=points(e.side,e.key);burst(c,p.x,p.y-20,age,{size:.9,count:7});}if(e.type==='fall'){for(let i=0;i<e.count;i++){c.save();c.globalAlpha=clamp(1-age/.65);soldier(c,A,{side:e.side==='b'?1:0,id:i,x:e.x*1280+(i-1)*20,y:445+i*32,seed:0,fall:true,alpha:clamp(1-age/.65)},t,false);c.restore();}}}
  for(const sh of events){if(sh.type!=='shot')continue;const age=t-sh.at,duration=sh.impactAt-sh.at;if(age<0||age>duration+.55)continue;const from={x:sh.side==='a'?326:954,y:400},to={x:sh.to*1280,y:456};if(age<duration){const q=age/duration,x=mix(from.x,to.x,q),y=mix(from.y,to.y,q)-Math.sin(q*Math.PI)*50;c.strokeStyle='#fff3bc';c.lineWidth=3;c.beginPath();c.moveTo(x+(sh.side==='a'?-14:14),y-3);c.lineTo(x,y);c.stroke();c.fillStyle='#ffc265';c.beginPath();c.arc(x,y,4,0,TAU);c.fill();if(age<.13)burst(c,from.x,from.y,age,{size:.6,count:4});}else burst(c,to.x,to.y,age-duration,{size:.9,count:7});}
  for(const e of recent.filter(e=>['critical','reflect','leech'].includes(e.type))){if(t-e.at>.7)continue;const x=frame[e.side].x*1280,y=340-(t-e.at)*20,label=e.type==='critical'?'치명타!':e.type==='reflect'?'반사 −'+Math.ceil(e.amount):'흡혈 +'+Math.ceil(e.amount);txt(c,label,x,y,18,e.type==='leech'?'#3d9674':'#b17c49','center');}
 }
 for(const [si,side]of ['a','b'].entries()){const f=frame[side];round(c,si?950:32,40,298,48,14,'#fff8ecef',si?'#d7b0b6':'#b7cdc1');txt(c,(si?'방어 사원 ':'공격 사원 ')+f.n+'명',si?1099:181,71,23,si?'#a36d7b':'#548c83','center');}
 const active=heroes.filter(h=>h.skill.active).sort((a,b)=>a.skill.age-b.skill.age)[0];if(active){drawSkillBanner(c,active);drawSkillCutIn(c,A,active);}
}
