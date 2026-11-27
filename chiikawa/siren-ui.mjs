import {createSiren,stepSiren,directionCode,TICK_MS,MAX_TICKS,ROW,WIDTH} from './siren.mjs';
import {icon,esc} from './ui.mjs?v=127';
const powers={time:{icon:'◷',name:'+5초',color:'#e8bb68'},size:{icon:'↔',name:'파도 확대',color:'#ab8fe0'},boost:{icon:'»',name:'돌진',color:'#e8917b'},blast:{icon:'♪',name:'노래 폭발',color:'#83c4ac'}};
export class SirenStage{
 constructor({run,now,confirm,cardName,onNext}){
  Object.assign(this,{run,now,confirm,cardName,onNext});this.keys=new Set();this.vector={x:0,y:0};this.inputs='';this.sent=false;this.destroyed=false;
  this.key='siren-route:'+run.id;this.changes=[];
  try{const data=JSON.parse(localStorage.getItem(this.key)||'{}');if(data.id===run.id&&typeof data.inputs==='string')this.inputs=data.inputs.slice(0,MAX_TICKS);}catch{}
  this.sim=createSiren(run.seed,run.stage);
  try{for(const code of this.inputs){if(this.sim.finished)break;stepSiren(this.sim,code);}}catch{this.inputs='';this.sim=createSiren(run.seed,run.stage);}
  this.changes=[{tick:this.inputs.length,code:'A'}];
  this.root=document.createElement('section');this.root.id='siren-screen';this.root.setAttribute('aria-label','세이렌의 보물 바다');
  this.root.innerHTML=`<div class="siren-play"><canvas aria-label="조이스틱으로 세이렌을 움직여 보물을 모으세요"></canvas><header class="siren-hud"><div><span>동굴 사이의 작은 모험</span><h1>세이렌의 보물 바다</h1></div><strong class="siren-time" role="timer">30.0<small>초</small></strong></header><div class="siren-scores"><span>${icon('elixir')}<b data-score="elixir">0</b></span><span>${icon('gem')}<b data-score="gems">0</b></span><span>${icon('cards')}<b data-score="cards">0</b>장</span></div><div class="siren-active" aria-live="polite"></div><div class="siren-tip">위로 헤엄치며 보물을 쓸어 담아요</div><div class="siren-controls"><div class="siren-stick" role="application" aria-label="세이렌 이동 조이스틱" tabindex="0"><span class="stick-cross">✦</span><i></i></div><p>손가락으로 조이스틱을 움직여요<br><span>PC에서는 방향키 · WASD</span></p></div><div class="siren-result" hidden></div></div>`;
  document.body.append(this.root);this.canvas=this.root.querySelector('canvas');this.ctx=this.canvas.getContext('2d');this.play=this.root.firstChild;
  this.siren=new Image();this.siren.src='siren.webp';this.ocean=new Image();this.ocean.src='siren-ocean.webp';this.atlas=new Image();this.atlas.src='atlas.webp';
  this.siren.onload=this.ocean.onload=this.atlas.onload=()=>this.render();
  this.stick=this.root.querySelector('.siren-stick');this.knob=this.stick.querySelector('i');
  this.stick.addEventListener('pointerdown',e=>{if(this.pointer!==undefined)return;this.pointer=e.pointerId;this.stick.focus({preventScroll:true});this.stick.setPointerCapture(e.pointerId);this.moveStick(e);e.preventDefault();});
  this.stick.addEventListener('pointermove',e=>{if(e.pointerId===this.pointer)this.moveStick(e);});
  const release=e=>{if(e.pointerId!==this.pointer)return;this.pointer=undefined;this.vector={x:0,y:0};this.knob.style.transform='translate(-50%,-50%)';this.recordInput();};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])this.stick.addEventListener(event,release);
  this.onKey=e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key))return;e.preventDefault();if(e.type==='keydown')this.keys.add(e.key.toLowerCase());else this.keys.delete(e.key.toLowerCase());this.recordInput();};
  this.onBlur=()=>{this.keys.clear();this.vector={x:0,y:0};this.knob.style.transform='translate(-50%,-50%)';this.recordInput();this.persist();};
  addEventListener('keydown',this.onKey);addEventListener('keyup',this.onKey);addEventListener('blur',this.onBlur);
  this.onHide=()=>{if(document.hidden)this.onBlur();};document.addEventListener('visibilitychange',this.onHide);
  this.onUnload=()=>this.persist();addEventListener('pagehide',this.onUnload);
  this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(this.play);this.fit();
  if(run.status==='finished')this.result(run.result);else this.loop();
 }
 fit(){const r=this.play.getBoundingClientRect();if(!r.width||!r.height)return;this.height=WIDTH*r.height/r.width;this.canvas.width=WIDTH;this.canvas.height=Math.ceil(this.height);this.render();}
 moveStick(e){const r=this.stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,n=Math.max(1,Math.hypot(dx,dy)/42);this.vector={x:dx/n/42,y:-dy/n/42};this.knob.style.transform=`translate(calc(-50% + ${dx/n}px),calc(-50% + ${dy/n}px))`;this.recordInput();}
 input(){if(document.hidden)return 'A';let {x,y}=this.vector;if(this.keys.size){x=Number(this.keys.has('arrowright')||this.keys.has('d'))-Number(this.keys.has('arrowleft')||this.keys.has('a'));y=Number(this.keys.has('arrowup')||this.keys.has('w'))-Number(this.keys.has('arrowdown')||this.keys.has('s'));}return directionCode(x,y);}
 recordInput(){const tick=Math.max(this.inputs.length,Math.floor((this.now()-this.run.startedAt)/TICK_MS));this.changes.push({tick,code:this.input()});}
 persist(){try{localStorage.setItem(this.key,JSON.stringify({id:this.run.id,inputs:this.inputs}));}catch{}}
 loop(){
  if(this.destroyed||this.sent)return;
  const desired=Math.min(MAX_TICKS,Math.max(0,Math.floor((this.now()-this.run.startedAt)/TICK_MS)));
  const gap=desired-this.inputs.length;
  for(let i=0;i<gap&&!this.sim.finished;i++){while(this.changes.length>1&&this.changes[1].tick<=this.inputs.length)this.changes.shift();const c=this.changes[0].code;stepSiren(this.sim,c);this.inputs+=c;}
  if(this.inputs.length-(this.savedAt||0)>=10){this.savedAt=this.inputs.length;this.persist();}
  this.render();this.updateHUD();
  if(this.sim.finished){this.sent=true;this.persist();this.submit();return;}
  this.raf=requestAnimationFrame(()=>this.loop());
 }
 updateHUD(){
  const s=this.sim;this.root.querySelector('.siren-time').innerHTML=`${s.remaining.toFixed(1)}<small>초</small>`;
  this.root.querySelector('.siren-time').classList.toggle('running-out',s.remaining<5);
  for(const id of ['elixir','gems','cards'])this.root.querySelector('[data-score="'+id+'"]').textContent=s[id];
  const status=[s.elapsed<s.sizeUntil?'파도 확대 '+Math.ceil(s.sizeUntil-s.elapsed)+'초':'',s.elapsed<s.boostUntil?'돌진 '+Math.ceil(s.boostUntil-s.elapsed)+'초':''].filter(Boolean).join(' · ');
  if(this.root.querySelector('.siren-active').textContent!==status)this.root.querySelector('.siren-active').textContent=status;
  this.root.querySelector('.siren-tip').hidden=s.elapsed>5;
 }
 async submit(){
  this.root.querySelector('.siren-controls').hidden=true;
  const panel=this.root.querySelector('.siren-result');panel.hidden=false;panel.innerHTML='<div class="siren-result-card"><h2>모험 완료!</h2><p role="status">모은 보물을 담고 있어요…</p></div>';
  try{const result=await this.confirm('sirenFinish',{runId:this.run.id,inputs:this.inputs});if(!this.destroyed)this.result(result);}
  catch(err){if(this.destroyed)return;panel.innerHTML=`<div class="siren-result-card"><h2>보상을 보관 중이에요</h2><p>${esc(err.message)}</p><button class="siren-retry">다시 정산하기</button></div>`;panel.querySelector('button').onclick=()=>this.submit();}
 }
 result(r){
  cancelAnimationFrame(this.raf);this.sim.remaining=0;this.sim.elixir=r.elixir;this.sim.gems=r.gems;this.sim.cards=r.cards.reduce((n,c)=>n+c.amount,0);this.updateHUD();this.root.querySelector('.siren-controls').hidden=true;this.root.querySelector('.siren-tip').hidden=true;
  const panel=this.root.querySelector('.siren-result');panel.hidden=false;
  panel.innerHTML=`<div class="siren-result-card"><img src="siren.webp" class="siren-result-art" alt="보물을 모은 세이렌"><span class="siren-result-eyebrow">보물 ${r.collected}개를 모았어요</span><h2>멋진 바다 모험이었어!</h2><div class="siren-total"><span>${icon('elixir')}연구<strong>+${r.elixir}</strong></span><span>${icon('gem')}보석<strong>+${r.gems}</strong></span><span>${icon('cards')}카드<strong>+${r.cards.reduce((n,c)=>n+c.amount,0)}장</strong></span></div>${r.cards.length?`<details><summary>획득한 카드 보기</summary>${r.cards.map(c=>`<p>${esc(this.cardName(c.id))}<b>+${c.amount}장</b></p>`).join('')}</details>`:''}<p class="siren-kept">보상은 저장됐어요. 다음 동굴에도 그대로 가져가요.</p><button class="siren-next">${this.run.stage+1}번 동굴로 이동</button></div>`;
  panel.querySelector('.siren-next').onclick=()=>this.onNext();
  try{localStorage.removeItem(this.key);}catch{}
 }
 tileSprite(index,x,y,size,alpha=1){if(!this.atlas.complete||!this.atlas.naturalWidth)return;const c=this.atlas.width/4;this.ctx.save();this.ctx.globalAlpha=alpha;this.ctx.drawImage(this.atlas,index%4*c,Math.floor(index/4)*c,c,c,x-size/2,y-size*.65,size,size);this.ctx.restore();}
 render(){
  if(!this.height)return;const c=this.ctx,s=this.sim,h=this.height,center=h*.38,offset=s.y-center;
  c.clearRect(0,0,WIDTH,h);
  const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#48b6bf');bg.addColorStop(.5,'#a1e0ce');bg.addColorStop(1,'#dbefd5');c.fillStyle=bg;c.fillRect(0,0,WIDTH,h);
  if(this.ocean.complete&&this.ocean.naturalWidth)c.drawImage(this.ocean,0,-40+Math.sin(s.y/500)*12,WIDTH,h+80);
  c.save();c.strokeStyle='#fff7cf40';c.lineWidth=4;
  for(let j=0;j<13;j++){const y=(j*123+s.y*.5)%h;c.beginPath();for(let x=35;x<WIDTH;x+=16){const py=y+Math.sin(x/65+j+s.elapsed*.7)*9;if(x===35)c.moveTo(x,py);else c.lineTo(x,py);}c.stroke();}
  for(let j=0;j<22;j++){const x=30+(j*137)%660,y=((j*97+s.y*.35+s.elapsed*12)%h+h)%h;c.strokeStyle='#f2ffff7a';c.lineWidth=2;c.beginPath();c.arc(x,y,3+j%4,0,Math.PI*2);c.stroke();}c.restore();
  const a=Math.max(0,Math.floor((offset-120-250)/ROW)),b=Math.min(s.rows.length-1,Math.ceil((offset+h+120-250)/ROW));
  for(let row=a;row<=b;row++)for(const o of s.rows[row]){
   if(o.done)continue;const y=h-(o.y-offset),bob=Math.sin(s.elapsed*2+o.phase)*3,p=powers[o.type];
   if(p){c.save();c.shadowColor=p.color;c.shadowBlur=17;c.fillStyle='#fff7db';c.strokeStyle=p.color;c.lineWidth=5;c.beginPath();c.roundRect(o.x-29,y-30,58,58,17);c.fill();c.stroke();c.shadowBlur=0;c.fillStyle='#684e66';c.font='900 38px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(p.icon,o.x,y-2);c.font='800 18px system-ui';c.lineWidth=4;c.strokeStyle='#fff9e4';c.strokeText(p.name,o.x,y+43);c.fillText(p.name,o.x,y+43);c.restore();}
   else{
    const index={snack:8,gem:7,card:18,chest:9,shell:6}[o.type];
    if(o.type==='card'){
     c.save();c.translate(o.x,y+bob);c.rotate(Math.sin(o.phase)*.1);c.fillStyle='#78a1ca';c.strokeStyle='#f3f3ce';c.lineWidth=4;c.beginPath();c.roundRect(-21,-29,42,52,6);c.fill();c.stroke();c.fillStyle='#f3e9c8';c.font='bold 27px system-ui';c.textAlign='center';c.fillText('✦',0,8);c.restore();
    }else this.tileSprite(index,o.x,y+bob,o.type==='chest'?80:74,.98);
    if(o.hp<o.max){c.fillStyle='#476d6970';c.fillRect(o.x-23,y+28,46,5);c.fillStyle='#fff5c4';c.fillRect(o.x-23,y+28,46*(1-o.hp/o.max),5);}
   }
  }
  const py=h-center,large=s.elapsed<s.sizeUntil,boost=s.elapsed<s.boostUntil,scale=large?1.65:1,radius=large?116:73;
  c.save();c.translate(s.x,py);
  const wave=c.createRadialGradient(0,-25,8,0,-25,radius);wave.addColorStop(0,'#f2ffff14');wave.addColorStop(.8,'#e7ffff70');wave.addColorStop(1,'#f7ffde00');c.fillStyle=wave;c.beginPath();c.ellipse(0,-25,radius,radius*.85,0,0,Math.PI*2);c.fill();
  for(let i=0;i<3;i++){c.strokeStyle=boost?'#fff0a5a0':'#ffffff9a';c.lineWidth=3+i;c.beginPath();c.ellipse(0,12+i*12+Math.sin(s.elapsed*6)*3,(46+i*8)*scale,14+i*4,0,0,Math.PI);c.stroke();}
  if(s.elapsed<s.flashUntil){c.strokeStyle='#fff4b8';c.lineWidth=8;c.beginPath();c.arc(0,0,40+(1-(s.flashUntil-s.elapsed)/.5)*220,0,Math.PI*2);c.stroke();}
  const tilt=this.vector.x*.14+Math.sin(s.elapsed*(boost?13:7))*.07;c.rotate(tilt);
  if(this.siren.complete&&this.siren.naturalWidth){const width=116*scale,height=width*this.siren.height/this.siren.width;c.drawImage(this.siren,-width/2,-height/2,width,height);}
  c.restore();
  for(const e of s.events){const age=s.elapsed-e.at,y=h-(e.y-offset)-age*45;c.save();c.globalAlpha=Math.max(0,1-age/.85);c.textAlign='center';c.font='900 '+(powers[e.type]?30:23)+'px system-ui';c.lineWidth=5;c.strokeStyle='#426e69';c.strokeText(e.text,e.x,y-34);c.fillStyle=powers[e.type]?'#fff0a9':'#fffdf0';c.fillText(e.text,e.x,y-34);c.restore();}
 }
 destroy(){this.destroyed=true;cancelAnimationFrame(this.raf);this.resize.disconnect();removeEventListener('keydown',this.onKey);removeEventListener('keyup',this.onKey);removeEventListener('blur',this.onBlur);removeEventListener('pagehide',this.onUnload);document.removeEventListener('visibilitychange',this.onHide);this.root.remove();}
}
