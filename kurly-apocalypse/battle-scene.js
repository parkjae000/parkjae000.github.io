export const HEALTH_KINDS=[['C','센터','🏢','center'],['W','방벽','🛡','wall'],['T','포탑','🎯','turret']];

export function battleHealthMarkup(side,frame,maxima,ready=false){
  return `<div class="battle-health-card ${side==='a'?'allied':'hostile'}"><strong>${side==='a'?'우리 센터':'상대 센터'}</strong>${HEALTH_KINDS.map(([key,label,icon,color])=>{
    const value=frame?.[side+key]??(side==='a'?maxima[key]:0),max=maxima[key]||1;
    return `<div class="health-row health-${color}" data-health-row="${side+key}"><div><span>${icon} ${label}</span><b data-health-number="${side+key}">${ready&&side==='b'?'선택 전':Math.ceil(value).toLocaleString('ko-KR')+' / '+Math.ceil(max).toLocaleString('ko-KR')}</b></div><i><em data-health-bar="${side+key}" style="width:${Math.max(0,Math.min(100,100*value/max))}%"></em></i></div>`;
  }).join('')}</div>`;
}

export function buildBattleEvents(frames){
  const events=[];
  for(let i=1;i<frames.length;i++){
    const before=frames[i-1],after=frames[i];
    for(const effect of after.effects||[])events.push({...effect,at:after.t});
    for(const skill of after.skills||[])events.push({type:'skill',side:skill.side,id:skill.id,at:after.t});
    for(const side of ['a','b']){
      for(const [key] of HEALTH_KINDS){const damage=before[side+key]-after[side+key];if(damage>0)events.push({type:'structure',side,key,at:after.t,damage});}
      const lost=before[side].n-after[side].n;
      for(let n=0;n<Math.min(6,lost);n++)events.push({type:'fall',side,at:after.t,index:n,x:before[side].x});
    }
  }
  return events;
}

export function paintBattle(canvas,frame,{assets,sprites,phase,events=[],ownStats,seconds=0}={}){
  const ctx=canvas.getContext('2d'),W=1600,H=560,scale=canvas.width/W;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(scale,0,0,scale,0,0);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const terrain=assets.terrain;
  if(terrain.complete&&terrain.naturalWidth)ctx.drawImage(terrain,0,0,W,H);
  else {ctx.fillStyle='#c8ddec';ctx.fillRect(0,0,W,H);}
  const t=frame?.t??seconds,playing=phase==='battle';
  const recent=events.filter(e=>t>=e.at&&t-e.at<.78);
  const structurePoint=(side,key)=>({x:side==='a'?{C:175,W:320,T:290}[key]:W-{C:175,W:320,T:290}[key],y:{C:376,W:419,T:334}[key]});
  function burst(px,py,age,size=1){
    const u=Math.max(0,Math.min(1,age/.72));ctx.save();ctx.globalAlpha=1-u;
    ctx.fillStyle='#fff5b2';ctx.beginPath();ctx.arc(px,py,Math.max(0,17*(1-u))*size,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#ee9442';ctx.lineWidth=4;ctx.beginPath();ctx.arc(px,py,(8+u*31)*size,0,Math.PI*2);ctx.stroke();
    for(let j=0;j<10;j++){const a=j*2.399;ctx.fillStyle=j%2?'#fff5ca':'#e99935';ctx.fillRect(px+Math.cos(a)*u*55*size,py+Math.sin(a)*u*40*size,5*size,5*size);}
    ctx.restore();
  }
  function base(side){
    const enemy=side==='b',img=enemy?assets.enemy:assets.own,bx=enemy?W-342:32;
    const hits=recent.filter(e=>e.side===side&&e.type==='structure');
    const shake=playing&&hits.some(e=>t-e.at<.24)?Math.sin(t*87)*3:0;
    ctx.save();ctx.translate(shake,0);
    if(img.complete&&img.naturalWidth){
      const flash=playing&&hits.some(e=>t-e.at<.14);
      ctx.filter=(enemy?'hue-rotate(315deg) saturate(.9) ':'')+(flash?'brightness(1.65)':'brightness(1.08)');
      if(enemy){ctx.translate(bx+310,0);ctx.scale(-1,1);ctx.drawImage(img,0,285,310,155);}else ctx.drawImage(img,bx,285,310,155);
    }
    ctx.restore();
    ctx.font='bold 21px system-ui';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#fff8df';ctx.fillStyle=enemy?'#8f4c59':'#405776';
    ctx.strokeText(enemy?'상대 센터':'우리 센터',bx+155,268);ctx.fillText(enemy?'상대 센터':'우리 센터',bx+155,268);
    if(frame){
      for(const key of ['W','T'])if(frame[side+key]<=0){const p=structurePoint(side,key);ctx.save();ctx.globalAlpha=.65;ctx.fillStyle='#6a6268';for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(p.x+i*8-12,p.y-15-i*8,11+i*3,0,Math.PI*2);ctx.fill();}ctx.restore();}
    }
  }
  base('a');if(frame)base('b');if(!frame)return;
  const an=frame.a.n,bn=frame.b.n,ax=frame.a.x*W,bx=frame.b.x*W;
  const aliveA=an>0||frame.a.h?.hp>0,aliveB=bn>0||frame.b.h?.hp>0;
  const melee=aliveA&&aliveB&&Math.abs(frame.b.x-frame.a.x)<.105;
  const attackA=playing&&aliveA&&(melee||frame.a.x>=.725),attackB=playing&&aliveB&&(melee||frame.b.x<=.275);
  function unit(px,py,side,index,attacking=false,fall=0){
    const roster=frame[side].roles,total=frame[side].n,sample=(index+.5)*total/Math.max(1,Math.min(total,28)),role=roster?(sample<roster.assault?'assault':sample<roster.assault+roster.support?'support':'engineer'):null;
    const own=side==='a',dir=own?1:-1,step=playing&&!attacking?Math.floor(t*7+index)%4:0;
    const swing=Math.sin(t*10+index*.8),lunge=attacking?Math.max(0,swing)*4:0;
    ctx.save();ctx.globalAlpha=1-fall;
    ctx.fillStyle='#605a6a3d';ctx.beginPath();ctx.ellipse(px+4,py+24,15,5,0,0,Math.PI*2);ctx.fill();
    ctx.translate(px+dir*lunge,py-18-fall*16);if(!own)ctx.scale(-1,1);if(fall)ctx.rotate(fall*1.1);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(own?sprites.own:sprites.enemy,step*24,0,24,24,-22,0,44,44);
    if(role){ctx.fillStyle={assault:'#e78c68',support:'#65bba0',engineer:'#dcac51'}[role];ctx.fillRect(-11,28,24,8);if(role==='support'){ctx.fillStyle='#8bd7b7';ctx.fillRect(10,17,13,22);ctx.fillStyle='#e4f4c7';ctx.fillRect(15,20,3,16);}if(role==='engineer'){ctx.fillStyle='#7b5c43';ctx.fillRect(15,13,4,21);ctx.fillStyle='#d9e4e8';ctx.fillRect(9,10,16,7);}}
    if(attacking){
      ctx.translate(8,24);ctx.rotate(-.9+swing*.95);
      ctx.strokeStyle='#5c4944';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(14,-22);ctx.stroke();
      ctx.strokeStyle='#f1f8fa';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(3,-20);ctx.lineTo(25,-16);ctx.stroke();
      ctx.strokeStyle='#d79632';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,29,-1.5,.2);ctx.stroke();
    }
    ctx.restore();
  }
  for(let i=0;i<Math.min(an,28);i++)unit(ax-(i%5)*22,432-Math.floor(i/5)*19,'a',i,attackA);
  for(let i=0;i<Math.min(bn,28);i++)unit(bx+(i%5)*22,432-Math.floor(i/5)*19,'b',i,attackB);
  const colors={frozen:'#63c8ff',ambient:'#eab74e',chilled:'#59d7a0',beauty:'#d293e6',cs:'#678fff',returns:'#f39c60'};
  const names={frozen:'급속냉각',ambient:'재고사수',chilled:'콜드체인',beauty:'하자적발',cs:'긴급지원',returns:'반품처리'};
  for(const side of ['a','b']){
    const hero=frame[side].h;if(!hero||hero.hp<=0)continue;
    const own=side==='a',px=(own?ax:bx)+(own?-58:58),py=460,dir=own?1:-1,col=colors[hero.id];
    ctx.save();ctx.translate(px,py-49);ctx.scale(dir,1);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(own?sprites.own:sprites.enemy,(playing?Math.floor(t*5)%4:0)*24,0,24,24,-34,-14,68,68);
    // Department jacket, scarf and distinct equipment on a larger pixel captain.
    ctx.fillStyle=col;ctx.fillRect(-23,30,42,15);ctx.fillRect(-28,19,16,8);ctx.fillRect(-31,25,8,18);
    ctx.fillStyle='#ffe57e';ctx.fillRect(-13,31,5,5);ctx.fillRect(7,31,5,5);
    const swing=playing?Math.sin(t*9)*5:0;ctx.translate(26,19+swing);
    if(hero.id==='ambient'){ctx.fillStyle=col;ctx.fillRect(-3,0,22,28);ctx.fillStyle='#fff4ba';ctx.fillRect(5,4,6,20);}
    else if(hero.id==='returns'){ctx.fillStyle='#775445';ctx.fillRect(-2,-5,5,32);ctx.fillStyle=col;ctx.fillRect(-11,-10,28,15);}
    else if(hero.id==='chilled'){ctx.fillStyle='#efffef';ctx.fillRect(-6,0,20,23);ctx.fillStyle=col;ctx.fillRect(2,4,5,14);ctx.fillRect(-2,8,13,5);}
    else {ctx.fillStyle='#48566c';ctx.fillRect(-3,3,24,9);ctx.fillStyle=col;ctx.fillRect(15,-1,13,15);}
    ctx.restore();
    ctx.fillStyle='#ffffff';ctx.fillRect(px-38,py+7,76,8);ctx.fillStyle=col;ctx.fillRect(px-37,py+8,74*hero.hp/hero.max,6);
    ctx.font='bold 15px system-ui';ctx.fillStyle='#554360';ctx.strokeStyle='#fff8e6';ctx.lineWidth=4;ctx.textAlign='center';ctx.strokeText('★ 파트장',px,py+34);ctx.fillText('★ 파트장',px,py+34);
    if(hero.activeUntil>t&&playing){
      ctx.save();ctx.strokeStyle=col;ctx.lineWidth=4;ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(px,py+2,57+Math.sin(t*6)*5,20,0,0,Math.PI*2);ctx.stroke();
      if(hero.id==='chilled'){ctx.font='bold 24px system-ui';ctx.fillStyle=col;ctx.fillText('+',(own?ax:bx),390-(t%1)*35);}
      if(hero.id==='frozen'){ctx.strokeStyle=col;ctx.lineWidth=4;for(let j=0;j<4;j++){const fx=(own?bx:ax)+Math.sin(j*4+t)*28,fy=400-j*17;ctx.beginPath();ctx.moveTo(fx-8,fy);ctx.lineTo(fx+8,fy);ctx.moveTo(fx,fy-8);ctx.lineTo(fx,fy+8);ctx.stroke();}}
      ctx.restore();
    }
  }
  const skill=events.filter(e=>e.type==='skill'&&t>=e.at&&t-e.at<1.8).at(-1);
  if(skill&&playing){
    const age=t-skill.at,side=skill.side,px=side==='a'?430:W-630;
    ctx.save();ctx.globalAlpha=Math.min(1,age*6,(1.8-age)*4);ctx.fillStyle='#fff6e8ee';ctx.strokeStyle=colors[skill.id];ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(px,80,200,78,15);ctx.fill();ctx.stroke();
    const img=assets['hero-'+skill.id];if(img?.complete&&img.naturalWidth)ctx.drawImage(img,px+5,85,68,68);
    ctx.font='bold 18px system-ui';ctx.textAlign='left';ctx.fillStyle='#67516c';ctx.fillText(names[skill.id],px+82,125);ctx.restore();
  }
  if(playing){
    if(melee){const cx=(ax+bx)/2;for(let i=0;i<3;i++)burst(cx+Math.sin(i*4+t*7)*21,405-i*15,((t+i*.21)% .65),.55);}
    for(const side of ['a','b']){
      const own=side==='a',n=own?aliveA:aliveB,enemyN=own?aliveB:aliveA,front=own?frame.a.x:frame.b.x;
      if(n&&((own&&front>=.725)||(!own&&front<=.275))){
        const target=own?'b':'a',key=frame[target+'W']>0?'W':frame[target+'T']>0?'T':'C',p=structurePoint(target,key);
        burst(p.x,p.y,(t+(own?0:.25))%.7,.85);
        ctx.strokeStyle='#fff2a6';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo((own?ax:bx),419);ctx.lineTo(p.x,p.y);ctx.stroke();
      }
      const firing=frame[side+'T']>0&&enemyN>0&&(own?frame.b.x<=.50:frame.a.x>=.50);
      if(firing){
        const p=structurePoint(side,'T'),to=own?bx:ax,u=(t+(own?0:.55))%1.2/1.2,v=Math.min(1,u*1.7),px=p.x+(to-p.x)*v,py=p.y+(415-p.y)*v-Math.sin(v*Math.PI)*48;
        ctx.strokeStyle=own?'#6ae4dc':'#f4a462';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(px-(to-p.x)*.025,py-2);ctx.lineTo(px,py);ctx.stroke();
        ctx.fillStyle='#fffbcb';ctx.beginPath();ctx.arc(px,py,7,0,Math.PI*2);ctx.fill();if(u<.2)burst(p.x,p.y,u,.5);if(u>.6)burst(to,415,(u-.6)*1.6,.75);
      }
    }
    for(const e of recent){const age=t-e.at;if(e.type==='structure'){const p=structurePoint(e.side,e.key);burst(p.x,p.y,age,1);ctx.font='bold 24px system-ui';ctx.fillStyle='#bb4a3e';ctx.strokeStyle='#fff7dc';ctx.lineWidth=4;ctx.strokeText('-'+Math.ceil(e.damage),p.x,p.y-24-age*35);ctx.fillText('-'+Math.ceil(e.damage),p.x,p.y-24-age*35);}else if(e.type==='fall'){const u=age/.78;unit(e.x*W+(e.side==='a'?-1:1)*e.index*21,432-(e.index%3)*16,e.side,e.index,false,u);if(age<.45)burst(e.x*W,432,age,.55);}}
  }
  for(const side of ['a','b']){
    const effects=recent.filter(e=>e.side===side&&['critical','reflect','leech'].includes(e.type));
    for(const [i,type] of ['critical','reflect','leech'].entries()){const effect=effects.filter(e=>e.type===type).at(-1);if(!effect||!playing)continue;const age=t-effect.at,px=side==='a'?ax-35:bx+35,py=300-i*29-age*18;ctx.save();ctx.globalAlpha=1-age/.9;ctx.font='bold 22px system-ui';ctx.textAlign='center';ctx.strokeStyle='#fff9ea';ctx.lineWidth=5;ctx.fillStyle=type==='leech'?'#278c66':type==='reflect'?'#9c65b8':'#d8772e';const label=type==='critical'?'치명타!':type==='reflect'?'반사 −'+Math.ceil(effect.amount):'흡혈 +'+Math.ceil(effect.amount);ctx.strokeText(label,px,py);ctx.fillText(label,px,py);ctx.restore();}
  }
  ctx.font='bold 21px system-ui';ctx.textAlign='center';ctx.fillStyle='#3d3b52';ctx.strokeStyle='#fff8df';ctx.lineWidth=6;
  for(const [px,n,label] of [[ax-48,an,'아군'],[bx+48,bn,'상대']])if(n){ctx.strokeText(label+' '+n+'명',px,350);ctx.fillText(label+' '+n+'명',px,350);}
}
