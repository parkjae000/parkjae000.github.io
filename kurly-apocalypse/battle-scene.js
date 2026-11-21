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
  const melee=an>0&&bn>0&&Math.abs(frame.b.x-frame.a.x)<.105;
  const attackA=playing&&an>0&&(melee||frame.a.x>=.725),attackB=playing&&bn>0&&(melee||frame.b.x<=.275);
  function unit(px,py,side,index,attacking=false,fall=0){
    const own=side==='a',dir=own?1:-1,step=playing&&!attacking?Math.floor(t*7+index)%4:0;
    const swing=Math.sin(t*10+index*.8),lunge=attacking?Math.max(0,swing)*4:0;
    ctx.save();ctx.globalAlpha=1-fall;
    ctx.fillStyle='#605a6a3d';ctx.beginPath();ctx.ellipse(px+4,py+24,15,5,0,0,Math.PI*2);ctx.fill();
    ctx.translate(px+dir*lunge,py-18-fall*16);if(!own)ctx.scale(-1,1);if(fall)ctx.rotate(fall*1.1);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(own?sprites.own:sprites.enemy,step*24,0,24,24,-22,0,44,44);
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
  if(playing){
    if(melee){const cx=(ax+bx)/2;for(let i=0;i<3;i++)burst(cx+Math.sin(i*4+t*7)*21,405-i*15,((t+i*.21)% .65),.55);}
    for(const side of ['a','b']){
      const own=side==='a',n=own?an:bn,enemyN=own?bn:an,front=own?frame.a.x:frame.b.x;
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
    for(const e of recent){const age=t-e.at;if(e.type==='structure'){const p=structurePoint(e.side,e.key);burst(p.x,p.y,age,1);ctx.font='bold 24px system-ui';ctx.fillStyle='#bb4a3e';ctx.strokeStyle='#fff7dc';ctx.lineWidth=4;ctx.strokeText('-'+Math.ceil(e.damage),p.x,p.y-24-age*35);ctx.fillText('-'+Math.ceil(e.damage),p.x,p.y-24-age*35);}else{const u=age/.78;unit(e.x*W+(e.side==='a'?-1:1)*e.index*21,432-(e.index%3)*16,e.side,e.index,false,u);if(age<.45)burst(e.x*W,432,age,.55);}}
  }
  ctx.font='bold 21px system-ui';ctx.textAlign='center';ctx.fillStyle='#3d3b52';ctx.strokeStyle='#fff8df';ctx.lineWidth=6;
  for(const [px,n,label] of [[ax-48,an,'아군'],[bx+48,bn,'상대']])if(n){ctx.strokeText(label+' '+n+'명',px,350);ctx.fillText(label+' '+n+'명',px,350);}
}
