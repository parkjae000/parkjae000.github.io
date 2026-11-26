import {icon,fmt,duration,esc,unitPhase} from './ui.mjs?v=100';
import * as Rules from './economy.mjs';
import {advance as simulate,GUIDE,TASKS} from './game.mjs';
import {GameSession} from './session.mjs';
import {API,LIVE_HOSTS} from './config.mjs';
const E={...Rules};
const $=s=>document.querySelector(s),cv=$('#scene'),world=$('#world'),dialog=$('#dialog');
let ctx=cv.getContext('2d');
for(const [id,type] of Object.entries({coin:'gold',potion:'elixir',gem:'gem','hire-coin':'gold','crew-icon':'crew','settings':'settings'}))$('#'+id).innerHTML=icon(type);
$('#research-icon').innerHTML='<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="9" width="28" height="35" rx="3" fill="#7ca66f" stroke="#425a5e" stroke-width="2" transform="rotate(-9 18 26)"/><rect x="12" y="5" width="28" height="35" rx="3" fill="#68b5d1" stroke="#415a85" stroke-width="2" transform="rotate(8 26 22)"/><rect x="16" y="7" width="23" height="30" rx="2" fill="#e6f4f1"/><path d="M20 26h15M20 30h10" stroke="#88b6c8" stroke-width="2"/></svg>';
$('#wheel-icon').innerHTML='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="25" r="20" fill="#9e83bc" stroke="#ffe5a8" stroke-width="3"/><path d="M24 6v38M5 25h38M10 11l28 28M10 39l28-28" stroke="#fff0c0" stroke-width="2"/><path d="m24 2-5 9h10z" fill="#f1ba57" stroke="#a37a46"/><circle cx="24" cy="25" r="7" fill="#f4ca69" stroke="#ffe9aa" stroke-width="2"/></svg>';
$('#event-icon').innerHTML='<svg viewBox="0 0 48 40" aria-hidden="true"><path d="m7 17-5-8 13 1 3 5m21 10 7 7-13 1-4-5" fill="#d6629d" stroke="#9c467a" stroke-width="2"/><rect x="12" y="6" width="25" height="28" rx="9" fill="#e68fb7" stroke="#9c467a" stroke-width="2" transform="rotate(40 24 20)"/><path d="m18 8 17 15M14 15l17 15" stroke="#f7c1d3" stroke-width="5"/></svg>';
const atlas=new Image(),ground=new Image(),support=new Image();atlas.src='atlas.webp';ground.src='ground.webp';support.src='support.webp';await Promise.all([atlas.decode(),ground.decode(),support.decode()]);
const W=780,STEP=86,LEFT=89,FONT='"Noto Sans CJK KR",system-ui,sans-serif',reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const serverButtons=new WeakSet();
let modalRefreshAt=0;
let wheelSpinning=false,wheelResult=null,wheelRotation=0,campSeen=-1,shopReceipt=null,wheelContext=null;
let g,player=null,authMode='register',offlineShown=false,guideVersion='',chatMessages=[],chatAfter=0,H=1300,VH=1300,camera=0,selected=null,drag=null,frameAt=0,lastFrame=0,lastReal=Date.now(),hudAt=0,modalName=null,structureKey='',noticeTimer,delivery=null,particles=[],movers=new Map(),celebrations=new Map();
const terrain=document.createElement('canvas');
const scenery=document.createElement('canvas');
scenery.setAttribute('aria-hidden','true');
scenery.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
cv.before(scenery);
cv.style.position='relative';
const sceneryContext=scenery.getContext('2d',{alpha:false});
let sceneryView='';
let terrainKey='',guideMarker=null,lastSimulation=0;
let pendingBarrel=null,parcelFlight=null,selectedCharge=null,chargeGesture=null,chargeKey='';
const workerParcelPoint=()=>coord(6,g.camp.row+1.1);
const client=new GameSession({api:LIVE_HOSTS.includes(location.hostname)?API:'/api',onGame:acceptGame,onStatus:updateSave,onError:notice});
for(const [name,type,fields] of [['assign','assign',['worker','target']],['move','move',['worker','x','y']],['merge','merge',['a','b']],['recruit','recruit',[]],['upgrade','upgrade',['facility','count']],['activate','activate',['facility']],['collect','collect',['facility']],['research','research',['card']],['automate','automate',['facility']]]){E[name]=(_state,...args)=>{const payload=Object.fromEntries(fields.map((key,i)=>[key,args[i]]));const value=client.mutate(type,payload);return name==='collect'?value.result.amount:value.result;};}
E.nextMine=()=>client.mutate('next').game;
function updateSave(status){const el=$('#save-state');el.textContent=status==='saved'?'✓':status==='saving'?'↻':status==='offline'?'!':'…';el.dataset.status=status;el.title={saved:'서버 저장 완료',saving:'저장 중',offline:'연결을 복구하면 저장을 이어서 진행해요.'}[status]||'연결 확인 중';if(status==='signed-out')showWelcome();if(!g&&status==='offline'){$('#auth-loading').textContent='연결을 확인한 뒤 다시 시도해 주세요.';$('#retry-connection').hidden=false;}else $('#retry-connection').hidden=true;}
function showWelcome(){$('#app').hidden=true;$('#welcome').hidden=false;$('#auth-form').hidden=false;$('#auth-loading').hidden=true;if(dialog.open)dialog.close();g=null;}
function acceptGame(game,p){if(!game){showWelcome();return;}const first=!g,changed=g&&g.stage!==game.stage,previous=g?.camp.moves,guideDone=g?.guide.rewarded;if(!first&&game!==g&&game.rocks.some((rock,i)=>rock.done!==g.rocks[i]?.done))terrainKey='';
 g=game;player=p;if(first||changed){terrainKey='';parcelFlight=null;selectedCharge=null;chargeGesture=null;}$('#welcome').hidden=true;$('#app').hidden=false;lastReal=client.now();if(first||changed){selected=null;drag=null;delivery=null;movers.clear();structureKey='';campSeen=g.camp.moves;fit();focusCamp();}else if(previous!==g.camp.moves){campSeen=g.camp.moves;focusCamp();notice('개방 완료! 찻집과 대포가 앞으로 이동했어요.');}updateHUD(true);if(!first&&!guideDone&&g.guide.rewarded)notice('기초 안내 완료! 보석 10 · 연구 20을 받았어요.');if(first&&!offlineShown&&client.base&&client.now()-client.base.lastAt>60000)offlineShown=true;}
const coord=(x,y)=>({x:LEFT+(x+.5)*STEP,y:H-(g.rows+3.2)*STEP+y*STEP});
const visual=f=>f.id==='forge'?{x:178,y:coord(0,g.camp.row+2.55).y}:coord(f.visual.x,f.visual.y);
const cannonPoint=()=>({x:676,y:coord(0,g.camp.row+2.55).y});
const barrelPoint=()=>coord(6,g.camp.row);
const cameraMin=()=>g?Math.min(0,coord(0,g.camp.row+3.2).y-VH):0;
function focusCamp(){camera=Math.max(cameraMin(),Math.min(H-VH,coord(0,g.camp.row+3.2).y-VH));placeStructures();}
function fit(){if(!world.clientWidth||!world.clientHeight)return;const oldV=VH,oldH=H;VH=Math.round(world.clientHeight*W/world.clientWidth);H=Math.max(1260,VH,g?220+(g.rows+3.2)*STEP:1260);if(cv.width!==W)cv.width=W;if(cv.height!==VH)cv.height=VH;camera=Math.max(cameraMin(),Math.min(H-VH,camera+(H-oldH)+(oldV-VH)));placeStructures();}
new ResizeObserver(fit).observe(world);
function sprite(i,x,y,size=100,flip=false,alpha=1){const sheet=i>=16?support:atlas,cols=i>=16?2:4,n=i>=16?i-16:i,cell=sheet.width/cols;ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;if(flip)ctx.scale(-1,1);ctx.drawImage(sheet,(n%cols)*cell,Math.floor(n/cols)*cell,cell,cell,-size/2,-size*.82,size,size);ctx.restore();}
function art(i,cls=''){const n=i>=16?i-16:i,cols=i>=16?2:4;return `<span aria-hidden="true" class="item-art ${cls}" style="background-image:url('${i>=16?'support':'atlas'}.webp');background-size:${cols*100}% ${cols*100}%;background-position:${(n%cols)/(cols-1)*100}% ${Math.floor(n/cols)/(cols-1)*100}%"></span>`;}
function text(s,x,y,size=34,color='#fff8ec',stroke='#5b4a49'){ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${size}px ${FONT}`;if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=5;ctx.lineJoin='round';ctx.strokeText(s,x,y);}ctx.fillStyle=color;ctx.fillText(s,x,y);}
function rect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function notice(message){$('#notice').textContent=message;$('#notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').hidden=true,2400);}
function action(fn,message=null){try{settle();const result=fn();if(message)notice(message);return result;}catch(e){notice(e.message);return null;}}
function settle(){if(!g)return;const t=client.now();lastReal=t;const ids=new Set(g.friends.map(w=>w.id)),before={...g.ledger},hadSupply=g.barrel,parcelCount=g.workerBarrels?.length||0;simulate(g,t);if(!hadSupply&&g.barrel)flyParcel('supply');if((g.workerBarrels?.length||0)>parcelCount)flyParcel('worker');if(campSeen!==g.camp.moves){if(campSeen>=0){focusCamp();notice('개방 완료! 찻집·대포·소환 위치가 앞으로 이동했어요.');}campSeen=g.camp.moves;}for(const w of g.friends)if(!ids.has(w.id))launch(w.id);for(const f of g.facilities)if(g.ledger[f.id]>before[f.id]&&!reduced){const p=visual(f);particles.push({x:p.x,y:p.y-120,life:1.2,text:'+'+fmt(g.ledger[f.id]-before[f.id])});}}
function updateHUD(force=false){if(!g)return;$('#gold').textContent=fmt(g.gold);$('#elixir').textContent=fmt(g.elixir);$('#gems').textContent=fmt(g.gems);$('#scene-name').textContent='간식 동굴 '+g.stage;$('#crew-count').textContent=E.occupiedSlots(g)+'/'+E.CAPACITY;const level=E.hireLevel(g),a=E.appearance(level);$('#hire-level').textContent='LV.'+level;$('#hire-cost').textContent=fmt(E.hirePrice(g));$('#hire-portrait').style.backgroundPosition=(a.idle/3*100)+'% 0';$('#hire').disabled=E.occupiedSlots(g)>=E.CAPACITY||g.gold<E.hirePrice(g);$('#hire').setAttribute('aria-label',`Lv.${level} ${a.name} 채용 · ${fmt(E.hirePrice(g))} 골드`);$('#wheel-count').textContent=g.wheel.extra+'/5';$('#wheel-button').title=g.wheel.free?'추가 회전 '+g.wheel.extra+'/5':'무료 회전 가능';$('#event-clock').textContent=g.daily.claims.length+'/4';$('#scene').setAttribute('aria-label','작업장 · '+g.friends.map(w=>E.appearance(w.level).name+' Lv.'+w.level).join(', '));$('#work-status').textContent=`채굴 ${g.friends.filter(w=>w.target).length}/${g.friends.length} · 연속 ${g.auto?'ON':'OFF'}`;$('#work-status').setAttribute('aria-pressed',String(g.auto));updateStructures(force);updateCharges();updateSelection();updateGuide();refreshPanel(force);}
function updateStructures(force=false){const state=g.facilities.map(f=>{const q=E.quoteUpgrade(g,f);return [f.id,f.level,f.active,f.repaired,f.auto,!!f.ready,q.count,q.cost,g.friends.filter(w=>w.target===f.id).map(w=>w.id).join(',')].join(':');}).join('|')+';'+[...g.checkpoints,g.exit].map(t=>t.id+':'+t.done).join('|');if(state===structureKey){
 for(const b of document.querySelectorAll('[data-repair]')){const f=g.facilities.find(f=>f.id===b.dataset.repair),rate=g.friends.filter(w=>w.target===f.id).reduce((n,w)=>n+E.workerPower(g,w),0);if(rate&&!f.repaired)b.firstChild.nodeValue='복구 중 '+duration(f.hp/rate*1000);}
 return;
 }structureKey=state;
 $('#structures').innerHTML=g.facilities.map(f=>{const d=E.facilityDef(f.id),q=E.quoteUpgrade(g,f),bar=E.milestoneBar(f.level),preview=Math.min(1,(f.level+(q.count||0)-bar.previous)/(bar.next-bar.previous||1));if(!f.active){const workers=g.friends.filter(w=>w.target===f.id),dps=workers.reduce((sum,w)=>sum+E.workerPower(g,w),0);return `<div class="production" data-structure="${f.id}"><button class="repair-card ${f.repaired?'active-ready':''}" data-repair="${f.id}" aria-label="${d.name} ${f.repaired?'가동':'복구'}">${f.repaired?'가동하기':dps?'복구 중 '+duration(f.hp/dps*1000):'시설 복구'}<small>${d.name}</small></button></div>`;}
 return `<div class="production" data-structure="${f.id}"><span class="yield" title="${d.cycle}초마다 생산하는 골드">${icon('gold')}<b>${fmt(E.cycleYield(g,f))}</b></span><button id="upgrade-${f.id}" class="upgrade-card" data-upgrade="${f.id}" data-count="${q.count}" ${!q.count?'disabled':''} aria-label="${d.name} Lv.${f.level} · ${d.cycle}초마다 ${fmt(E.cycleYield(g,f))} 골드 · ${q.count?'+'+q.count+'레벨 강화 '+fmt(q.cost)+' 골드':'강화 골드 부족'}"><span class="upgrade-progress"><i class="preview-fill" style="width:${preview*100}%"></i><i class="current-fill" style="width:${bar.progress*100}%"></i><b>${f.level}</b></span><span class="upgrade-buy"><strong>${f.level>=200?'MAX':'+'+(q.count||1)}</strong><span>${icon('gold')}${f.level>=200?'최대':fmt(q.cost)}</span></span></button><span class="facility-label">${d.name} · ${d.cycle}초</span></div><button id="info-${f.id}" class="facility-info-hit" data-info="${f.id}" aria-label="${d.name} 생산 및 자동화 · ${f.auto?'자동 수령':f.ready?'생산 골드 수령 가능':'직접 수령'}"></button>`;}).join('')+[...g.checkpoints.filter(t=>!t.done),g.exit].map(t=>`<button class="gate-hit" data-gate="${t.id}" aria-label="${t.id==='exit'?(E.readyForNext(g)?'다음 구역으로':'출구 작업'):'중간 개방문 '+t.toSegment+' 작업'}"></button>`).join('');placeStructures();}
function placeStructures(){if(!g)return;const k=world.clientWidth/W;for(const node of document.querySelectorAll('[data-structure]')){const f=g.facilities.find(f=>f.id===node.dataset.structure),p=visual(f),width=f.id==='forge'?244:198;node.style.width=width*k+'px';node.style.left=((f.id==='forge'?429:p.x)-width/2)*k+'px';node.style.top=(f.id==='forge'?(p.y+28-camera)*k-node.offsetHeight:(p.y+2-camera)*k)+'px';}for(const node of document.querySelectorAll('[data-info]')){const f=g.facilities.find(f=>f.id===node.dataset.info),p=visual(f);node.style.left=(p.x-38)*k-22+'px';node.style.top=(p.y-63-camera)*k-22+'px';}for(const node of document.querySelectorAll('[data-gate]')){const t=[...g.checkpoints,g.exit].find(t=>t.id===node.dataset.gate),p=coord(t.x,t.y);node.style.left=p.x*k-40+'px';node.style.top=(p.y-40-camera)*k-22+'px';}}
function updateSelection(){const w=selected&&g.friends.find(w=>w.id===selected);if(!w){$('#selection').hidden=true;return;}const t=E.targets(g).find(t=>t.id===w.target);$('#selection-copy').textContent=`${E.appearance(w.level).name} Lv.${w.level} · ${fmt(E.workerPower(g,w))}/초 · ${t?'작업 '+duration(t.hp/g.friends.filter(a=>a.target===t.id).reduce((n,a)=>n+E.workerPower(g,a),0)*1000):'바위로 끌어 놓으세요'}`;$('#selection').hidden=false;}
function drawGround(){ctx.fillStyle='#b5a2b9';ctx.fillRect(0,Math.min(0,camera),W,H+Math.max(0,-camera));ctx.drawImage(ground,0,0,W,H);const ceiling=coord(3,-1).y-60;if(ceiling>0){rect(0,Math.min(0,camera),W,ceiling-Math.min(0,camera),0,'#bdadbb');for(let x=15;x<W;x+=145)sprite(14,x,ceiling+28,210);} ctx.strokeStyle='#936c5c16';ctx.lineWidth=1;for(let x=0;x<=7;x++){const p=LEFT+x*STEP;ctx.beginPath();ctx.moveTo(p,coord(0,-1).y);ctx.lineTo(p,H-90);ctx.stroke();}for(let y=coord(0,0).y-STEP/2;y<H-90;y+=STEP){ctx.beginPath();ctx.moveTo(LEFT,y);ctx.lineTo(W-LEFT,y);ctx.stroke();}}
function gate(t){if(t.done&&t.kind==='checkpoint')return;const p=coord(t.x,t.y);rect(LEFT,p.y-13,210,16,4,'#b98b66','#8b674f');rect(W-LEFT-210,p.y-13,210,16,4,'#b98b66','#8b674f');if(!t.done)sprite(13,p.x,p.y+18,157);rect(p.x-63,p.y-24,126,31,8,t.done?'#789465':'#80624f','#d8bb8e');text(t.id==='exit'?(E.readyForNext(g)?'다음 구역':'출구'):(t.done?'개방 완료':'개방 '+t.toSegment),p.x,p.y-8,23,'#fff1cb',null);}
function workbar(t,p){const dps=g.friends.filter(w=>w.target===t.id).reduce((n,w)=>n+E.workerPower(g,w),0);if(!dps&&t.hp===t.max)return;rect(p.x-29,p.y-72,58,8,3,'#8e7568');if(t.hp>0)rect(p.x-28,p.y-71,56*t.hp/t.max,6,2,'#c5d9a0');if(dps)text(duration(t.hp/dps*1000),p.x,p.y-89,22,'#fff8e8','#705c51');}
function drawFacility(f,time){const p=visual(f),d=E.facilityDef(f.id);sprite(d.art,p.x,p.y,f.id==='forge'?218:208,false,f.active?1:.64);if(!f.active){if(!f.repaired)workbar(f,p);return;}const at={x:p.x-38,y:p.y-63},progress=f.ready?1:f.progress/d.cycle;ctx.lineWidth=6;ctx.strokeStyle='#8c715777';ctx.beginPath();ctx.arc(at.x,at.y,23,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=f.ready?'#a8ce7b':'#f4ca62';ctx.beginPath();ctx.arc(at.x,at.y,23,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();if(f.ready){sprite(9,p.x-44,p.y-17,63);text('✓',at.x,at.y,28,'#efffd3','#6d964d');}else {text(f.auto?'✓':'↻',at.x,at.y,26,f.auto?'#d5edb9':'#a5d6e1','#6c7657');}}
function drawFriends(time,dt){for(const w of g.friends){if(drag?.active&&drag.id===w.id||delivery?.id===w.id&&time-delivery.at<650)continue;const p=coord(w.x,w.y),m=movers.get(w.id)||{...p},moving=Math.hypot(m.x-p.x,m.y-p.y)>2,k=Math.min(1,dt*12);m.x+=(p.x-m.x)*k;m.y+=(p.y-m.y)*k;movers.set(w.id,m);const t=w.target&&(g.rocks.find(t=>t.id===w.target)||g.facilities.find(t=>t.id===w.target)||g.checkpoints.find(t=>t.id===w.target)||(w.target==='exit'?g.exit:null)),look=E.appearance(w.level),phase=(time/1000+unitPhase(w.id))%.82,frame=t&&phase>.28&&phase<.63?look.hit:look.idle;
 if(selected===w.id){rect(p.x-STEP/2+4,p.y-STEP/2+4,STEP-8,STEP-8,10,'#c7e5cf80','#82a68a');}
 ctx.fillStyle='#80604527';ctx.beginPath();ctx.ellipse(m.x,m.y,24,8,0,0,7);ctx.fill();let bob=reduced?0:moving?Math.sin(time/70)*3:frame===look.hit?-2:0;if((celebrations.get(w.id)||0)>time&&!reduced)bob-=Math.abs(Math.sin(time/100))*12;sprite(frame,m.x,m.y+bob,118,(t?.port?t.visual.x:t?.x)<w.x);text(w.level,m.x,m.y+17,29,'#fff9e6','#8f7963');if(!t){rect(m.x-29,m.y-103,58,25,8,'#fff1c9','#ba9b72');text('대기',m.x,m.y-90,19,'#8a6646',null);}if(t&&frame===look.hit&&phase>.4&&phase<.6&&!reduced){const q=t.port?visual(t):coord(t.x,t.y);ctx.fillStyle='#ffe5aa';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(q.x-16+i*14,q.y-37,4,0,7);ctx.fill();}}}}
function drawTerrain() {
 const key=[g.stage,H,g.stats.rocks].join('/');
 if(terrainKey!==key){
  terrain.width=W;terrain.height=H;
  const screen=ctx;
  try {
   ctx=terrain.getContext('2d');drawGround();
   for(const rock of g.rocks){if(rock.done)continue;const p=coord(rock.x,rock.y);sprite(rock.type,p.x,p.y,103);text(rock.level,p.x,p.y-25,36);}
  } finally {ctx=screen;}
  terrainKey=key;sceneryView='';
 }
 const view=[key,camera,VH].join('/');
 if(view===sceneryView)return;
 sceneryView=view;
 if(scenery.width!==W)scenery.width=W;
 if(scenery.height!==VH)scenery.height=VH;
 if(camera<0){sceneryContext.fillStyle='#bdadbb';sceneryContext.fillRect(0,0,W,-camera+1);}
 const top=Math.max(0,Math.floor(camera)),height=Math.min(H-top,Math.ceil(camera+VH)-top);
 if(height>0)sceneryContext.drawImage(terrain,0,top,W,height,0,top-camera,W,height);
}
function flyParcel(kind){if(!reduced)parcelFlight={kind,at:performance.now()};}
function drawParcel(kind,p,label,time){
 let x=p.x,y=p.y;
 if(parcelFlight?.kind===kind){
  const q=Math.min(1,(time-parcelFlight.at)/380),start=cannonPoint();
  if(q<1){x=start.x+(x-start.x)*q;y=start.y+(y-start.y)*q-Math.sin(Math.PI*q)*120;}
 }
 sprite(9,x,y,76);
 rect(x-46,y-86,92,26,7,'#fff4c6','#caa773');text(label,x,y-73,19,'#775131',null);
}
function draw(time){requestAnimationFrame(draw);if(!g||document.hidden)return;frameAt=time;const dt=Math.min(.06,(time-lastFrame)/1000||.033);lastFrame=time;if(time-lastSimulation>=100){settle();lastSimulation=time;}if(time-hudAt>240){updateHUD();hudAt=time;}ctx.clearRect(0,0,W,VH);ctx.save();ctx.translate(0,-camera);drawTerrain();gate(g.exit);if(!g.exit.done)workbar(g.exit,coord(g.exit.x,g.exit.y));for(const checkpoint of g.checkpoints)gate(checkpoint);
 for(const r of g.rocks){if(r.done||r.hp>=r.max)continue;const p=coord(r.x,r.y);if(p.y>=camera-20&&p.y<=camera+VH+100)workbar(r,p);}
 for(const f of g.facilities)drawFacility(f,time);const cannon=cannonPoint(),shot=Math.max(delivery?.at??-1000,parcelFlight?.at??-1000),kick=time-shot<400?Math.sin((time-shot)/400*Math.PI)*9:0;sprite(12,cannon.x+kick,cannon.y,166);rect(cannon.x-38,cannon.y-143,76,26,8,'#fff1d0','#ad8b66');text('Lv.'+E.hireLevel(g),cannon.x,cannon.y-130,21,'#856340',null);
 if(g.barrel)drawParcel('supply',barrelPoint(),pendingBarrel?'여는 중':'보급',time);
 if(g.workerBarrels?.length)drawParcel('worker',workerParcelPoint(),'친구 ×'+g.workerBarrels.length,time);
 drawFriends(time,dt);drawGuide(time);
 if(chargeGesture?.aim){
  const aim=chargeGesture.aim,p=aim.target.port?visual(aim.target):coord(aim.target.x,aim.target.y);
  rect(p.x-60,p.y-110,120,30,8,'#7b614c');
  text(aim.remaining?'남음 '+fmt(aim.remaining):'즉시 완료',p.x,p.y-95,21,'#fff1bb',null);
 }
 if(drag?.active){
  scrollDragAtEdge(dt);
  const w=g.friends.find(w=>w.id===drag.id);
  if(w){
   const drop=dropAt(drag.point,w);
   if(drop){const p=drop.anchor;ctx.strokeStyle=drop.valid?'#79bf8a':'#cb8a7e';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(p.x,p.y,36,14,0,0,Math.PI*2);ctx.stroke();}
   sprite(E.appearance(w.level).idle,drag.point.x,drag.point.y+drag.grip,118);
  }
 }
 if(delivery){const q=(time-delivery.at)/650;if(q<1){const w=g.friends.find(w=>w.id===delivery.id);if(w){const p=coord(w.x,w.y);sprite(9,cannon.x+(p.x-cannon.x)*q,cannon.y+(p.y-cannon.y)*q-Math.sin(Math.PI*q)*180,61);}if(q<.5){ctx.fillStyle='#fff4e394';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(cannon.x-24-q*40,cannon.y-70-q*50-i*9,8+q*17,0,7);ctx.fill();}}}else if(q>1.5)delivery=null;}
 particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.y-=24*dt;ctx.globalAlpha=Math.max(0,p.life);text(p.text,p.x,p.y,25,'#fff0aa','#947147');}ctx.globalAlpha=1;ctx.restore();}
function launch(workerId){if(!reduced)delivery={id:workerId,at:performance.now()};}
function point(e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*VH/r.height+camera};}
function friendAt(p,exclude) {
 let best=null,score=Infinity;
 for(const w of g.friends){
  if(w.id===exclude)continue;
  const q=movers.get(w.id)||coord(w.x,w.y),dx=p.x-q.x,dy=p.y-(q.y-38);
  if(Math.abs(dx)>42||dy < -60||dy>62)continue;
  const d=dx*dx+dy*dy;if(d<score){score=d;best=w;}
 }
 return best;
}
function targetAt(p){return E.targets(g).filter(t=>!t.port).map(t=>({t,p:coord(t.x,t.y)})).filter(z=>Math.abs(z.p.x-p.x)<47&&p.y>z.p.y-81&&p.y<z.p.y+20).sort((a,b)=>Math.hypot(a.p.x-p.x,a.p.y-29-p.y)-Math.hypot(b.p.x-p.x,b.p.y-29-p.y))[0]?.t;}
function facilityAt(p){return g.facilities.find(f=>{const at=visual(f);return Math.abs(at.x-p.x)<90&&p.y>at.y-155&&p.y<at.y+25;});}
function dropAt(p,actor){
 const friend=friendAt(p,actor.id),rock=targetAt(p),facility=facilityAt(p);
 const x=Math.round((p.x-LEFT)/STEP-.5),y=Math.round((p.y-coord(0,0).y)/STEP);
 const target=rock||(!facility?.repaired&&facility);
 const spot=friend?'merge':target?'assign':'move';
 const key=[spot,friend?.id,target?.id,x,y,g.lastAt,actor.level].join('/');
 if(drag?.candidate?.key===key)return drag.candidate;
 let valid,anchor;
 if(friend){valid=friend.level===actor.level&&friend.level<40;anchor=coord(friend.x,friend.y);}
 else if(target){valid=!!E.destination(g,target,actor);anchor=target.port?visual(target):coord(target.x,target.y);}
 else{valid=E.freeTiles(g,actor).some(([cx,cy])=>cx===x&&cy===y);anchor=coord(x,y);}
 const candidate={key,spot,valid,anchor,friend,target,x,y};
 if(drag)drag.candidate=candidate;
 return candidate;
}
function scrollDragAtEdge(dt){
 const d=drag;if(!d?.active)return;
 const y=d.point.y-camera,edge=Math.min(80,VH*.1);
 const speed=y<edge?-Math.min(1,(edge-y)/edge):y>VH-edge?Math.min(1,(y-VH+edge)/edge):0;
 if(!speed)return;
 const next=Math.max(cameraMin(),Math.min(H-VH,camera+speed*STEP*9*dt));
 if(next!==camera){d.point.y+=next-camera;camera=next;placeStructures();}
}
function orderTarget(t){const chosen=g.friends.find(w=>w.id===selected),workers=chosen?[chosen]:g.friends.slice().sort((a,b)=>(!!a.target-!!b.target)||E.workerPower(g,b)-E.workerPower(g,a)),w=workers.find(w=>E.destination(g,t,w));if(w){const job=assignTo(w,t);if(job)movers.set(w.id,coord(job.x,job.y));}else notice('앞의 바위를 캐서 작업 자리를 열어 주세요.');}
function assignTo(w,t){return action(()=>{const assigned=E.assign(g,w.id,t.id);selected=null;$('#selection').hidden=true;return assigned;});}
cv.addEventListener('pointerdown',e=>{
 if(!g||drag||!e.isPrimary||e.button!==0)return;
 const p=point(e),w=friendAt(p);
 drag={pointer:e.pointerId,id:w?.id,point:p,grip:w?(movers.get(w.id)||coord(w.x,w.y)).y-p.y:0,startX:e.clientX,startY:e.clientY,lastY:e.clientY,active:false,panning:false};
 cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove',e=>{
 if(drag?.pointer!==e.pointerId)return;
 const d=drag;d.point=point(e);
 if(!d.active&&!d.panning&&Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<4)return;
 if(d.id)d.active=true;
 else{d.panning=true;camera=Math.max(cameraMin(),Math.min(H-VH,camera-(e.clientY-d.lastY)*W/world.clientWidth));placeStructures();}
 d.lastY=e.clientY;
});
cv.addEventListener('pointerup',e=>{
 if(drag?.pointer!==e.pointerId)return;
 const d=drag,p=point(e);drag=null;if(!g||d.panning)return;
 if(selectedCharge&&!d.active){const target=targetAt(p)||facilityAt(p);if(target){triggerCharge(target);return;}}
 const actor=g.friends.find(w=>w.id===d.id);
 if(d.active){
  if(!actor)return;
  const drop=dropAt(p,actor);
  if(drop.spot==='merge'){
   const result=action(()=>E.merge(g,actor.id,drop.friend.id));
   if(result){movers.set(result.id,coord(result.x,result.y));celebrations.set(result.id,performance.now()+650);}
  }else if(drop.spot==='assign'){
   if(assignTo(actor,drop.target))movers.set(actor.id,coord(actor.x,actor.y));
  }else if(action(()=>E.move(g,actor.id,drop.x,drop.y)))movers.set(actor.id,coord(actor.x,actor.y));
  return;
 }
 const hitParcel=at=>Math.abs(p.x-at.x)<42&&p.y>at.y-88&&p.y<at.y+15;
 if(g.workerBarrels?.length&&hitParcel(workerParcelPoint())){openWorkerParcel();return;}
 if(g.barrel&&hitParcel(barrelPoint())){openMystery();return;}
 const w=friendAt(p),t=targetAt(p),f=facilityAt(p);
 if(w){selected=w.id;updateSelection();return;}if(t){orderTarget(t);return;}if(f){if(!f.repaired&&selected){assignTo(g.friends.find(w=>w.id===selected),f);return;}if(f.ready){action(()=>E.collect(g,f.id),'생산 골드를 받았어요.');return;}openFacility(f);return;}if(p.y<cannonPoint().y&&p.y>cannonPoint().y-160&&p.x>590){panel('supply');return;}if(p.x>327&&p.x<453&&Math.abs(p.y-coord(3,-1).y)<50){if(E.readyForNext(g)){g=action(()=>E.nextMine(g))||g;lastReal=Date.now();campSeen=g.camp.moves;selected=null;movers.clear();structureKey='';fit();focusCamp();updateHUD(true);}else if(selected)assignTo(g.friends.find(w=>w.id===selected),g.exit);else notice('출구와 양쪽 시설을 개방하면 다음 구역으로 갈 수 있어요.');return;}selected=null;updateSelection();});
for(const event of ['pointercancel','lostpointercapture'])cv.addEventListener(event,e=>{if(drag?.pointer===e.pointerId)drag=null;});$('#clear-selection').onclick=()=>{selected=null;updateSelection();};
$('#hire').onclick=()=>{const w=action(()=>E.recruit(g));if(w)launch(w.id);};
function open(title,html,name='custom'){modalName=name;$('#dialog-title').textContent=title;$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();if(g?.guide.step===8&&name==='cards')requestAnimationFrame(()=>$('#dialog-content [data-card="tea"]')?.scrollIntoView({block:'center'}));if(g)updateGuide();}
function openFacility(f){const d=E.facilityDef(f.id),income=E.facilityRate(g,f),next={...f,level:Math.min(200,f.level+1)},cost=E.upgradePrice(g,f),delta=E.facilityRate(g,next)-income;open(d.name,`<div class="facts"><span>시설 레벨</span><strong>Lv.${f.level}</strong><span>한 번 생산하는 골드</span><strong>${fmt(E.cycleYield(g,f))}</strong><span>생산 주기</span><strong>${d.cycle}초</strong><span>초당 수입으로 환산</span><strong>${fmt(income)}/초</strong><span>다음 1레벨 투자 회수</span><strong>${duration(cost/Math.max(.001,delta)*1000)}</strong><span>자동 수령</span><strong>${f.auto?'켜짐':'직접 수령'}</strong></div><p>시설의 골드 강화와 카드 자동화 연구는 별개예요. 시설 위 숫자는 매 주기 받는 골드예요.</p><p id="facility-cycle" class="panel-intro"></p><div id="facility-collect">${f.ready?`<button class="dialog-button" data-collect="${f.id}">완료된 골드 ${fmt(f.ready)} 받기</button>`:''}</div>${!f.auto&&f.active?`<button class="dialog-button" data-automate="${f.id}" ${g.cards[f.id].level<d.required?'disabled':''}>자동 수령 켜기 · 카드 Lv.${g.cards[f.id].level}/${d.required}</button>`:''}<button class="dialog-button" data-panel="cards">카드 연구 보기</button>`,'facility:'+f.id);refreshPanel(true);}
const statFmt=n=>n<1e6?n.toLocaleString('ko-KR',{maximumFractionDigits:2}):fmt(n);
function cardTitle(id){return E.facilityDef(id)?E.facilityDef(id).name+' 매뉴얼':id==='pickaxe'?'숙련 작업':'채용 협약';}
function cardStats(id){const p=E.cardPreview(g,id);return `<div class="stat-change"><small>${p.label}</small><div><b>${statFmt(p.current)}</b><span>→</span><strong>${statFmt(p.next)}</strong><small>${p.unit}</small></div></div>`;}
function cardMarkup(id,shop=false){const c=g.cards[id],p=E.cardPreview(g,id),d=E.facilityDef(id),cost=p.cost,can=!p.max&&c.count>=cost.cards&&g.elixir>=cost.elixir;return `<article class="research-card" data-card="${id}"><div class="card-heading">${art(p.art)}<div><span class="rarity">${id==='pickaxe'||id==='discount'?'특별 연구':'생산 연구'}</span><h2>${cardTitle(id)}</h2><b>Lv.${c.level}${p.max?' · MAX':' → Lv.'+(c.level+1)}</b></div></div>${id==='tea'&&g.guide.step===8?'<p class="guide-inline">기초 안내 · 이 매뉴얼을 Lv.1로 연구하면 숲속 찻집의 자동 수령을 켤 수 있어요.</p>':''}${cardStats(id)}<div class="card-material"><span>보유 <b>${c.count}</b> / 다음 레벨 <b>${cost.cards}장</b></span><span>${c.count>=cost.cards?'카드 준비 완료':cost.cards-c.count+'장 더 필요'}</span></div><div class="material-bar"><i style="width:${Math.min(100,c.count/cost.cards*100)}%"></i></div>${d?.required?`<p class="auto-note">자동 수령 조건 Lv.${d.required} · ${c.level>=d.required?'연구 완료':d.required-c.level+'레벨 남음'}</p>`:''}${shop?`<button class="dialog-button gem-buy" data-buy="card-${id}" ${g.gems<12?'disabled':''}>${icon('gem')} 12 · 카드 3장 구매</button>`:`<button class="dialog-button research-buy" data-research="${id}" ${can?'':'disabled'}>${icon('elixir')} ${p.max?'최대 레벨':'연구 '+fmt(cost.elixir)}${!p.max&&g.elixir<cost.elixir?' · 연구 부족':''}</button>`}</article>`;}
function rewardArt(reward){if(reward.type==='gems')return icon('gem');if(reward.type==='elixir'||reward.type==='time')return art(17);if(reward.type==='cards')return art(18);return art(E.appearance(wheelContext?.level??E.hireLevel(g)+1).idle);}
function wheelMarkup(){const context=wheelContext||{level:E.hireLevel(g)+1,full:E.occupiedSlots(g)>=E.CAPACITY};const colors=['#a6d2be','#e8c5ab','#b9c5e0','#eddc9d','#bcd6a1','#d0b3d5','#a9d2d2','#e9bcaa'];let paths='';for(let i=0;i<8;i++){const a=(i*45-112.5)*Math.PI/180,b=(i*45-67.5)*Math.PI/180;paths+=`<path d="M160 160 L${160+151*Math.cos(a)} ${160+151*Math.sin(a)} A151 151 0 0 1 ${160+151*Math.cos(b)} ${160+151*Math.sin(b)}Z" fill="${colors[i]}" stroke="#fff2ce" stroke-width="2"/>`;}
 return `<div class="wheel-stage"><div class="wheel-pointer"></div><div id="wheel-rotor" class="wheel-rotor" style="transform:rotate(${wheelRotation}deg)"><svg viewBox="0 0 320 320" aria-hidden="true">${paths}</svg>${E.WHEEL_REWARDS.map((r,i)=>{const a=i*45*Math.PI/180,x=50+Math.sin(a)*32,y=50-Math.cos(a)*32;return `<span class="wheel-prize" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%) rotate(${i*45}deg)">${rewardArt(r)}<b>${r.type==='worker'?(context.full?'연구40':'Lv.'+context.level):r.type==='time'?'1분':r.amount+(r.type==='cards'?'장':'' )}</b></span>`;}).join('')}</div><div class="wheel-hub">✿</div></div>`;}
function panel(name){if(!g)return;settle();if(name==='menu'){open('내 모험 · '+player.nickname,`<div class="facts"><span>현재 구역</span><strong>${g.stage}구역</strong><span>누적 채굴</span><strong>${g.stats.rocks}개</strong><span>누적 합성</span><strong>${g.stats.merges}번</strong><span>진행 저장</span><strong>${client.status==='saved'?'저장 완료':client.status==='offline'?'연결 확인 중':'저장 중'}</strong></div><div class="menu-actions"><button data-panel="chat">친구들과 채팅</button><button data-panel="rankings">전체 랭킹</button><button data-panel="supply">보급·무료 배달</button><button data-panel="help">플레이 안내</button><button id="toggle-auto">연속 채굴 ${g.auto?'ON':'OFF'}</button>${g.guide.step<GUIDE.length?'<button id="resume-guide">튜토리얼 계속</button>':''}</div><button class="dialog-button" id="sync-game">저장 확인</button><button class="logout-button" id="logout">로그아웃</button><p class="account-note">닉네임과 PIN으로 다른 기기에서도 이어 할 수 있어요. 자리비움 중 생산·지정 작업은 최대 8시간 반영돼요.</p>`,name);}
 else if(name==='cards'){open('카드 연구',`<div class="wallet-line">${icon('elixir')} 연구 <b>${fmt(g.elixir)}</b><span>구역을 넘어 유지돼요</span></div><p class="panel-intro">골드는 시설 강화에, 카드와 연구는 영구 성장에 사용해요.</p>${Object.keys(g.cards).map(id=>cardMarkup(id)).join('')}`,name);}
 else if(name==='shop'){open('보급 상점',`<div class="wallet-line">${icon('gem')} 보석 <b>${g.gems}</b><span>게임 안의 보석만 사용</span></div>${shopReceipt?`<div class="shop-receipt" role="status">${art(9)}<b>${shopReceipt}</b></div>`:''}<article class="shop-feature">${art(9)}<div><span class="rarity">4시간마다 무료</span><h2>작은 보급 상자</h2><p>카드 3장 · 연구 15</p></div><button data-buy="free" ${g.elapsed<g.shop.freeAt?'disabled':''}>${g.elapsed<g.shop.freeAt?duration((g.shop.freeAt-g.elapsed)*1000):'무료 받기'}</button></article><h2 class="section-title">성장 보급</h2><div class="shop-grid"><article>${art(9)}<h3>든든한 보급 상자</h3><p>모든 카드 각 2장<br>총 10장 + 연구 60</p><button data-buy="chest" ${g.gems<35?'disabled':''}>${icon('gem')} 35</button></article><article>${art(17)}<h3>연구 주머니</h3><p>연구 포인트 80<br>카드 연구에 사용</p><button data-buy="research" ${g.gems<25?'disabled':''}>${icon('gem')} 25</button></article></div><article class="time-offer">${art(17)}<div><h3>5분 시간 단축</h3><p>생산·지정 작업 즉시 진행</p></div><button data-buy="time" ${g.gems<20?'disabled':''}>${icon('gem')} 20</button></article><h2 class="section-title">필요한 카드 선택</h2><p class="panel-intro">구매하면 카드만 추가돼요. 아래 효과는 다음 연구 레벨의 변화예요.</p>${Object.keys(g.cards).map(id=>cardMarkup(id,true)).join('')}<button class="dialog-button" data-panel="cards">모은 카드로 연구하기</button>`,name);}
 else if(name==='wheel'){open('행운 룰렛',`<p class="wheel-caption">간식 동굴의 작은 행운</p>${wheelMarkup()}<div id="wheel-result" role="status" class="wheel-result">${wheelSpinning?'두근두근…':wheelResult?'획득 · '+wheelResult.label:'오늘의 보상을 돌려 보세요'}</div><button class="dialog-button spin-main" id="spin-free" ${g.wheel.free||wheelSpinning?'disabled':''}>${g.wheel.free?'무료 회전 완료':'무료로 돌리기'}</button><button class="dialog-button" id="spin-extra" ${wheelSpinning||g.wheel.extra>=5||g.elapsed<g.wheel.nextAt?'disabled':''}>${g.wheel.extra>=5?'추가 회전 5회 완료':g.elapsed<g.wheel.nextAt?duration((g.wheel.nextAt-g.elapsed)*1000)+' 후 추가 회전':'추가 회전 · '+g.wheel.extra+'/5'}</button><p class="wheel-note">8칸의 확률은 각각 12.5%예요. 시간 보상은 즉시 적용돼요. 친구 정원이 가득 차면 연구 40으로 바뀌어요.</p><p class="wheel-note">매일 무료 1회 · 추가 회전은 2시간 간격, 하루 최대 5회예요. 자정(한국시간)에 다시 시작해요.</p>`,name);}
 else if(name==='events'){open('오늘의 업무',`<p class="panel-intro">매일 자정(한국시간)에 새 업무가 시작돼요.</p>${TASKS.map(t=>{const amount=g.daily[t.id]||0,claimed=g.daily.claims.includes(t.id);return `<article class="daily-card" data-task="${t.id}"><div><h2>${t.name}</h2><p>${Math.min(amount,t.goal)}/${t.goal} · 보석 ${t.gems} + 연구 ${t.elixir}</p><div class="material-bar"><i style="width:${Math.min(100,amount/t.goal*100)}%"></i></div></div><button data-daily="${t.id}" ${claimed||amount<t.goal?'disabled':''}>${claimed?'받음':'받기'}</button></article>`;}).join('')}`,name);}
 else if(name==='supply'){open('센터 보급',`<div class="supply-art">${art(12)}</div><p id="supply-status">무료 친구 배달: Lv.${E.hireLevel(g)} · ${duration((g.freeAt-g.elapsed)*1000)} 후<br>보급통: ${g.barrel?'지도에 도착했어요.':'다음 배달 준비 중'}</p><p>무료 친구 보급은 열기 전에도 정원 한 칸을 써요. 별사탕 폭죽은 같은 레벨 친구가 5분 동안 할 일을 즉시 처리해요. 같은 레벨 폭죽 둘을 합칠 수도 있어요.</p><p>개방문을 열면 기본 찻집·대포·소환 위치가 다음 공간으로 함께 이동해요. 보급 골드는 기본 찻집과 자동화 시설 수입에 비례해요.</p><button class="dialog-button" id="open-barrel" ${g.barrel?'':'disabled'}>도착한 보급 열기</button><button class="dialog-button" id="open-worker-parcel" ${g.workerBarrels?.length?'':'hidden'}>친구 보급 열기</button>`,name);}
 else if(name==='help'){open('플레이 안내','<p><b>친구를 바위로 끌어 놓으면 바로 채굴해요.</b><br>친구를 먼저 누르고 바위를 눌러도 돼요. 작업 시간과 체력 막대가 줄어들면 실제로 채굴 중이에요.</p><p>연속 채굴 ON이면 가까운 다음 바위를 이어서 캐요. 연속 채굴을 끄면 맡은 작업을 끝내고 다음 지시를 기다려요. 바위와 맞닿은 빈칸에 놓으면 그 자리에서 채굴해요. 주변에 바위가 없는 빈칸에서는 쉬어요.</p><p>빈 바닥을 위아래로 밀면 지도를 움직일 수 있어요. 화면 아래 기초 안내의 대상 보기로 필요한 곳을 찾아갈 수도 있어요.</p><p>1·4·7레벨 우사기, 2·5·8레벨 하치와레, 3·6·9레벨 치이카와가 반복돼요. 같은 레벨 둘을 합치면 더 강해져요.</p><p>초반 1~3구역에는 중간 개방문이 없어요. 4구역부터 두 공간, 12구역부터 세 공간으로 지도가 길어져요. 개방문을 열면 바로 뒤의 작은 공간으로 찻집과 대포가 전진해요.</p><p>기본 찻집은 자동 생산해요. 다른 시설은 길을 열어 복구한 다음 가동해야 해요. 골드 강화와 카드 자동화 연구는 별개예요.</p><p><b>진행은 계정에 자동 저장돼요.</b> 자리비움 동안 최대 8시간 생산과 지정 작업을 반영해요. 친구가 대기 중이면 새 채굴은 진행하지 않아요.</p><p>기초 안내는 화면 아래에서 따라 할 수 있어요. 접어 두었다면 내 모험 메뉴에서 다시 이어 볼 수 있어요.</p>',name);}
 else if(name==='chat'){open('친구들과 채팅','<p class="panel-intro">간식 동굴을 탐험하는 친구들과 이야기를 나눠요.</p><div id="chat-list" class="chat-list" aria-live="polite"></div><form id="chat-form" method="post"><label class="sr-only" for="chat-input">메시지</label><input id="chat-input" name="message" maxlength="200" placeholder="메시지 입력" autocomplete="off" required><button type="submit">보내기</button></form><p id="chat-error" role="status" class="panel-intro"></p>',name);loadChat();}
 else if(name==='rankings'){open('동굴 탐험 랭킹','<p class="panel-intro">도달 구역 → 누적 채굴 → 합성 횟수 순이에요.</p><div id="ranking-list" aria-live="polite">불러오는 중…</div>',name);loadRankings();}}
async function startSpin(extra){if(wheelSpinning)return;wheelSpinning=true;wheelResult=null;wheelContext={level:E.hireLevel(g)+1,full:E.occupiedSlots(g)>=E.CAPACITY};panel('wheel');try{const result=await client.confirm('wheel',{extra});if(modalName==='wheel'&&dialog.open){const rotor=$('#wheel-rotor'),start=wheelRotation;wheelRotation=start+1800+((360-result.index*45-start%360)%360);if(rotor){if(!reduced){rotor.style.transition='transform 3.8s cubic-bezier(.12,.7,.12,1)';requestAnimationFrame(()=>rotor.style.transform=`rotate(${wheelRotation}deg)`);await new Promise(resolve=>setTimeout(resolve,3900));}else rotor.style.transform=`rotate(${wheelRotation}deg)`;}}wheelResult=result;if(result.id)launch(result.id);if(modalName!=='wheel')notice('룰렛 획득 · '+result.label);}catch(e){notice(e.message);}finally{wheelSpinning=false;if(modalName==='wheel'&&dialog.open)panel('wheel');}}
$('#scene-toggle').onclick=()=>panel('menu');$('#close-dialog').onclick=()=>dialog.close();dialog.addEventListener('close',()=>modalName=null);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.panel){panel(b.dataset.panel);return;}if(b.dataset.upgrade){action(()=>E.upgrade(g,b.dataset.upgrade,Number(b.dataset.count)));return;}if(selectedCharge&&(b.dataset.gate||b.dataset.repair)){
 const id=b.dataset.gate||b.dataset.repair;
 const target=E.targets(g).find(t=>t.id===id);
 if(target){triggerCharge(target);return;}
 }if(b.dataset.gate){const t=[...g.checkpoints,g.exit].find(t=>t.id===b.dataset.gate);if(t.id==='exit'&&t.done&&!E.readyForNext(g)){notice('남은 생산시설을 복구하고 가동하면 다음 구역으로 갈 수 있어요.');return;}if(t.id==='exit'&&E.readyForNext(g)){action(()=>{g=E.nextMine(g);campSeen=g.camp.moves;lastReal=Date.now();selected=null;movers.clear();structureKey='';fit();focusCamp();});}else orderTarget(t);return;}if(b.dataset.repair){const f=g.facilities.find(f=>f.id===b.dataset.repair);if(f.repaired){action(()=>E.activate(g,f.id),'시설을 가동했어요!');}else if(selected){assignTo(g.friends.find(w=>w.id===selected),f);}else orderTarget(f);return;}if(b.dataset.info){const f=g.facilities.find(f=>f.id===b.dataset.info);if(f.ready)action(()=>E.collect(g,f.id),'생산 골드를 받았어요.');else openFacility(f);return;}if(b.dataset.research){const step=g.guide.step,r=action(()=>E.research(g,b.dataset.research));if(r){if(step===8&&g.guide.step>8){dialog.close();focusGuide();}else panel('cards');}return;}if(b.dataset.automate){const guided=g.guide.step===9,r=action(()=>E.automate(g,b.dataset.automate),guided?'기초 안내 완료! 보석 10 · 연구 20을 받았어요.':'자동 수령을 켰어요.');if(r)dialog.close();return;}if(b.dataset.collect){action(()=>E.collect(g,b.dataset.collect),'생산 골드를 받았어요.');dialog.close();return;}if(b.id==='toggle-auto'||b.id==='work-status'){action(()=>client.mutate('auto',{enabled:!g.auto}));updateHUD(true);if(modalName==='menu'&&dialog.open)panel('menu');return;}if(b.dataset.buy){serverAction(b,'buy',{offer:b.dataset.buy},r=>{shopReceipt=r.text;panel('shop');});return;}if(b.id==='open-worker-parcel'){openWorkerParcel();return;}if(b.id==='open-barrel'){openMystery();return;}if(b.id==='spin-free'||b.id==='spin-extra'){startSpin(b.id==='spin-extra');return;}});
requestAnimationFrame(draw);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&g){settle();updateHUD(true);client.sync();}});
function guideTarget(){if(!g||g.guide.paused||g.guide.step>=GUIDE.length)return null;const step=g.guide.step;if(step===0){for(const a of g.friends){const b=g.friends.find(w=>w.id!==a.id&&w.level===a.level);if(b)return {workers:[a,b]};}return {element:'#hire'};}if(step===2)return {element:'#upgrade-forge',object:g.facilities[0]};if(step===3)return {element:'#hire'};
 const open=new Set(E.freeTiles(g).map(p=>p.join(',')));for(const w of g.friends)open.add(w.x+','+w.y);
 const accessible=t=>(t.port?[t.port]:[[t.x,t.y+1],[t.x-1,t.y],[t.x+1,t.y],[t.x,t.y-1]]).some(p=>open.has(p.join(',')));
 const toward=(x,y)=>g.rocks.filter(r=>!r.done&&accessible(r)).sort((a,b)=>Math.abs(a.x-x)+Math.abs(a.y-y)-Math.abs(b.x-x)-Math.abs(b.y-y))[0];
 if(step===1){const rock=toward(3,g.camp.row-1);return rock?{object:rock}:null;}
 if(step===4){if(accessible(g.exit)||g.exit.done)return {object:g.exit,element:'[data-gate="exit"]'};return {object:toward(3,-1),blocked:'exit'};}
 if(step===7||step===9){const f=g.facilities.find(f=>f.id==='tea'),inside=step===7?'[data-collect="tea"]':'[data-automate="tea"]';return f?{object:f,element:dialog.open&&$(inside)?inside:'[data-info="tea"]'}:null;}if(step===8)return {element:modalName==='cards'?'[data-research="tea"]':'.cards-nav'};
 const f=g.facilities.find(f=>f.id!=='forge'&&!f.active);if(!f)return null;if(step===5&&!accessible(f))return {object:toward(...f.port),blocked:'repair'};return {object:f,element:`[data-repair="${f.id}"]`};}
function updateGuide(){if(!g)return;guideMarker=guideTarget();const enabled=!g.guide.paused&&g.guide.step<GUIDE.length;$('#guide').hidden=!enabled;for(const node of document.querySelectorAll('.guide-highlight'))node.classList.remove('guide-highlight');if(!enabled)return;const entry=GUIDE[g.guide.step];$('#guide-step').textContent=`기초 안내 ${g.guide.step+1}/${GUIDE.length}`;$('#guide-title').textContent=entry.title;const target=guideMarker;$('#guide-text').textContent=target?.blocked==='repair'?'먼저 표시된 바위를 눌러 시설까지 길을 열어요. 길이 이어지면 시설 복구를 눌러요.':target?.blocked==='exit'?'표시된 바위를 눌러 출구까지 길을 열어요. 빈 바닥을 위아래로 밀어 지도를 볼 수 있어요.':entry.text;if(target?.element)$(target.element)?.classList.add('guide-highlight');}
function drawGuide(time){const target=guideMarker;if(!target)return;const pulse=reduced?0:Math.sin(time/240)*3;ctx.save();ctx.strokeStyle='#ffe7a3';ctx.lineWidth=5;ctx.shadowColor='#b78a4e';ctx.shadowBlur=8;const objects=target.workers||(!target.element&&target.object?[target.object]:[]);for(const t of objects){const p=t.port||t.id==='forge'?visual(t):coord(t.x,t.y);ctx.beginPath();ctx.ellipse(p.x,p.y-35,47+pulse,50+pulse,0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
function focusGuide(){const target=guideTarget();if(!target)return;const object=target.object||target.workers?.[0];if(object){const p=object.port||object.id==='forge'?visual(object):coord(object.x,object.y);camera=Math.max(cameraMin(),Math.min(H-VH,p.y-VH*.48));placeStructures();}else if(target.element==='#hire')$('#hire').focus({preventScroll:true});else if(target.element==='.cards-nav')panel('cards');else if(target.element==='[data-research="tea"]')$('#dialog-content [data-card="tea"]')?.scrollIntoView({block:'center'});}
$('#guide-focus').onclick=focusGuide;$('#guide-pause').onclick=()=>action(()=>client.mutate('guide',{paused:true}));
function updateCharges(){
 const items=g.charges||[];
 if(!items.some(c=>c.id===selectedCharge))selectedCharge=null;
 const key=items.map(c=>c.id+':'+c.level).join(',')+'/'+selectedCharge;
 if(key===chargeKey)return;
 chargeKey=key;$('#charges').hidden=!items.length;
 $('#charge-items').innerHTML=items.map(c=>`<button data-charge="${esc(c.id)}" aria-label="별사탕 폭죽 레벨 ${c.level}" aria-pressed="${selectedCharge===c.id}">✦ ${c.level}</button>`).join('');
 $('#charge-tip').textContent=selectedCharge?'작업할 대상 또는 합칠 폭죽을 누르세요.':'바위로 끌어 놓거나 폭죽을 누르세요.';
}
function triggerCharge(target){
 const ok=action(()=>client.mutate('charge',{charge:selectedCharge,target:target.id}));
 if(ok){selectedCharge=null;updateCharges();const p=target.port?visual(target):coord(target.x,target.y);particles.push({x:p.x,y:p.y-40,life:1,text:'✦ −'+fmt(ok.result.damage)});}
}
function chooseCharge(id){
 if(selectedCharge&&id!==selectedCharge){
  if(action(()=>client.mutate('mergeCharges',{a:selectedCharge,b:id})))selectedCharge=null;
 }else selectedCharge=selectedCharge===id?null:id;
 updateCharges();
}
const chargeItems=$('#charge-items');
chargeItems.addEventListener('pointerdown',e=>{
 const button=e.target.closest('[data-charge]');if(!button||chargeGesture||!e.isPrimary)return;
 chargeGesture={id:button.dataset.charge,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};chargeItems.setPointerCapture(e.pointerId);
});
function chargeHit(e){
 const node=document.elementFromPoint(e.clientX,e.clientY);
 const overlay=node?.closest('[data-gate],[data-repair]');
 if(overlay)return E.targets(g).find(t=>t.id===(overlay.dataset.gate||overlay.dataset.repair));
 if(!world.contains(node))return null;
 const p=point(e);return targetAt(p)||facilityAt(p);
}
chargeItems.addEventListener('pointermove',e=>{
 const gesture=chargeGesture;if(gesture?.pointer!==e.pointerId)return;
 if(!gesture.moved&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<4)return;
 gesture.moved=true;const target=chargeHit(e),id=target?.id;
 if(id!==gesture.hover){gesture.hover=id;gesture.aim=id?E.chargePreview(g,gesture.id,id):null;}
});
chargeItems.addEventListener('pointerup',e=>{
 const gesture=chargeGesture;if(gesture?.pointer!==e.pointerId)return;
 chargeGesture=null;if(!gesture.moved){chooseCharge(gesture.id);return;}
 const other=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-charge]')?.dataset.charge;
 selectedCharge=gesture.id;
 if(other&&other!==selectedCharge)chooseCharge(other);
 else{const t=chargeHit(e);if(t)triggerCharge(t);else updateCharges();}
});
for(const name of ['pointercancel','lostpointercapture'])chargeItems.addEventListener(name,e=>{if(chargeGesture?.pointer===e.pointerId)chargeGesture=null;});
chargeItems.addEventListener('click',e=>{const b=e.target.closest('[data-charge]');if(!e.detail&&b)chooseCharge(b.dataset.charge);});
function openWorkerParcel(){
 const barrel=g.workerBarrels?.[0];if(!barrel)return;
 const value=action(()=>client.mutate('unpack',{barrel:barrel.id}));
 if(value){if(dialog.open)dialog.close();launch(value.result.id);}
}
async function openMystery(){
 if(!g?.barrel||pendingBarrel)return;
 pendingBarrel=g.barrel.id;refreshPanel(true);
 try{
  const reward=await client.confirm('barrel',{barrel:pendingBarrel});
  if(modalName==='supply'&&dialog.open)dialog.close();notice(reward.text);
  if(reward.id)launch(reward.id);
 }catch(err){notice(err.message);}
 finally{pendingBarrel=null;refreshPanel(true);}
}
async function serverAction(button,type,payload,success){if(button&&serverButtons.has(button))return null;if(button){serverButtons.add(button);button.disabled=true;}try{const result=await client.confirm(type,payload);success?.(result);return result;}catch(e){notice(e.message);return null;}finally{if(button)serverButtons.delete(button);if(button?.isConnected)button.disabled=false;refreshPanel(true);}}
async function loadChat(){try{const data=await client.request('/chat');if(modalName!=='chat'||!dialog.open)return;chatMessages=data.messages.slice(-60);chatAfter=chatMessages.reduce((id,m)=>Math.max(id,Number(m.id)),0);renderChat();}catch(e){if(modalName==='chat'&&$('#chat-error'))$('#chat-error').textContent=e.message;}}
function renderChat(){const list=$('#chat-list');if(!list)return;const nearBottom=list.scrollHeight-list.scrollTop-list.clientHeight<60;list.innerHTML=chatMessages.length?chatMessages.map(m=>`<article class="chat-message ${m.player_id===player.id?'mine':''}"><header><b>${esc(m.nickname)}</b><small>${Number(m.stage)}구역 · ${new Date(Number(m.created_at)).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'})}</small>${m.player_id!==player.id?`<button data-report="${Number(m.id)}" aria-label="${esc(m.nickname)}의 메시지 신고">신고</button>`:''}</header><p>${esc(m.body)}</p></article>`).join(''):'<p class="empty-state">아직 대화가 없어요.<br>첫 인사를 남겨 보세요.</p>';if(nearBottom)list.scrollTop=list.scrollHeight;}
async function loadRankings(){try{const data=await client.request('/rankings');if(modalName!=='rankings'||!$('#ranking-list'))return;const top=data.rows.filter(r=>Number(r.rank)<=3),others=data.rows.filter(r=>Number(r.rank)>3),mine=data.rows.find(r=>r.id===data.self);$('#ranking-list').innerHTML=`<div class="podium">${[2,1,3].map(rank=>{const r=top.find(r=>Number(r.rank)===rank);return r?`<article class="place place-${rank} ${r.id===data.self?'self':''}"><span class="trophy">${icon('rank')}</span><b title="${esc(r.nickname)}">${esc(r.nickname)}</b><small>${r.stage}구역</small><strong>${rank}</strong></article>`:'<span></span>';}).join('')}</div>${mine?`<p class="my-rank">내 순위 <b>${mine.rank}위</b> · 누적 채굴 ${fmt(mine.rocks)}개</p>`:''}<div class="rank-rows">${others.map(r=>`<article class="rank-row ${r.id===data.self?'self':''}"><strong>${r.rank}</strong><div><b>${esc(r.nickname)}</b><small>채굴 ${fmt(r.rocks)} · 합성 ${fmt(r.merges)}</small></div><span>${r.stage}구역</span></article>`).join('')}</div><p class="panel-intro">저장된 진행으로 순위를 매겨요.</p>`;}catch(e){if($('#ranking-list'))$('#ranking-list').textContent=e.message;}}
document.addEventListener('submit',async e=>{if(e.target.id!=='chat-form')return;e.preventDefault();const input=$('#chat-input'),message=input.value.trim(),button=e.target.querySelector('button');if(!message)return;button.disabled=true;const requestId=crypto.randomUUID();try{const data=await client.request('/chat',{method:'POST',body:{message,requestId}});input.value='';if(!chatMessages.some(m=>String(m.id)===String(data.message.id)))chatMessages.push(data.message);chatAfter=Math.max(chatAfter,Number(data.message.id));renderChat();$('#chat-error').textContent='';}catch(error){$('#chat-error').textContent=error.message;}finally{button.disabled=false;}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.id==='resume-guide'){action(()=>client.mutate('guide',{paused:false}));dialog.close();focusGuide();}else if(b.id==='sync-game'){b.disabled=true;client.flush().then(()=>client.sync()).then(()=>notice('서버 저장을 확인했어요.')).catch(error=>notice(error.message)).finally(()=>{b.disabled=false;});}else if(b.id==='logout'){b.disabled=true;client.logout().catch(error=>notice(error.message)).finally(()=>{b.disabled=false;});}else if(b.dataset.daily){serverAction(b,'daily',{id:b.dataset.daily},r=>{panel('events');notice(r.text);});}else if(b.dataset.report){b.disabled=true;client.request('/report',{method:'POST',body:{id:Number(b.dataset.report)}}).then(()=>{chatMessages=chatMessages.filter(m=>String(m.id)!==b.dataset.report);renderChat();notice('메시지를 신고했어요.');}).catch(error=>{notice(error.message);b.disabled=false;});}});
$('#chat-button').innerHTML=icon('chat');
for(const tab of document.querySelectorAll('[data-auth-mode]'))tab.onclick=()=>{authMode=tab.dataset.authMode;for(const node of document.querySelectorAll('[data-auth-mode]'))node.setAttribute('aria-pressed',String(node===tab));$('#auth-submit').textContent=authMode==='register'?'모험 시작하기':'이어서 플레이';$('#pin').autocomplete=authMode==='register'?'new-password':'current-password';$('#auth-error').hidden=true;};
$('#auth-submit').disabled=false;
$('#retry-connection').onclick=()=>client.connect();
$('#toggle-pin').onclick=()=>{const input=$('#pin'),visible=input.type==='password';input.type=visible?'text':'password';$('#toggle-pin').textContent=visible?'숨김':'보기';$('#toggle-pin').setAttribute('aria-label',visible?'PIN 숨김':'PIN 표시');};
$('#auth-form').onsubmit=async e=>{e.preventDefault();const b=$('#auth-submit');b.disabled=true;$('#auth-error').hidden=true;try{const data=await client.authenticate(authMode,$('#nickname').value,$('#pin').value);$('#pin').value='';chatMessages=[];chatAfter=0;if(data.offline?.seconds>90)notice(`자리비움 중 골드 +${fmt(data.offline.gold)} · 바위 ${data.offline.rocks}개 채굴`);}catch(error){$('#auth-error').textContent=error.message;$('#auth-error').hidden=false;}finally{b.disabled=false;}};
const poll=setInterval(()=>{if(!document.hidden&&g){client.sync();if(modalName==='rankings')loadRankings();}},10000);setInterval(()=>{if(!document.hidden&&g&&modalName==='chat')loadChat();},3000);window.addEventListener('online',()=>client.sync());window.addEventListener('pagehide',()=>client.persist());
if(client.token){$('#auth-form').hidden=true;$('#auth-loading').hidden=false;}await client.connect();

function refreshPanel(force=false){if(!dialog.open||!g)return;const time=Date.now();if(!force&&time-modalRefreshAt<900)return;modalRefreshAt=time;
 if(modalName==='cards'||modalName==='shop'){const wallet=$('.wallet-line>b');if(wallet)wallet.textContent=modalName==='cards'?fmt(g.elixir):g.gems;for(const node of document.querySelectorAll('.research-card[data-card]')){const id=node.dataset.card,c=g.cards[id],cost=E.researchCost(g,id),material=node.querySelector('.card-material');if(material){material.children[0].innerHTML=`보유 <b>${c.count}</b> / 다음 레벨 <b>${cost.cards}장</b>`;material.children[1].textContent=c.count>=cost.cards?'카드 준비 완료':cost.cards-c.count+'장 더 필요';}node.querySelector('.material-bar>i').style.width=Math.min(100,c.count/cost.cards*100)+'%';const b=node.querySelector('[data-research]');if(b){b.disabled=c.level>=20||c.count<cost.cards||g.elixir<cost.elixir;b.innerHTML=icon('elixir')+' '+(c.level>=20?'최대 레벨':'연구 '+fmt(cost.elixir))+(c.level<20&&g.elixir<cost.elixir?' · 연구 부족':'');}}
  for(const b of document.querySelectorAll('[data-buy]')){if(serverButtons.has(b))continue;const id=b.dataset.buy,price=id==='chest'?35:id==='research'?25:id==='time'?20:12;if(id==='free'){b.disabled=g.elapsed<g.shop.freeAt;b.textContent=b.disabled?duration((g.shop.freeAt-g.elapsed)*1000):'무료 받기';}else b.disabled=g.gems<price;}
 }else if(modalName.startsWith('facility:')){const f=g.facilities.find(f=>f.id===modalName.slice(9)),slot=$('#facility-collect'),cycle=$('#facility-cycle');if(f&&slot){if(f.ready&&!slot.querySelector('[data-collect]'))slot.innerHTML=`<button class="dialog-button" data-collect="${f.id}">완료된 골드 ${fmt(f.ready)} 받기</button>`;if(cycle)cycle.textContent=!f.active?'먼저 시설을 복구하고 가동해 주세요.':f.ready?'생산 완료! 골드를 받으면 다음 생산이 시작돼요.':`${f.auto?'자동 수령 중 · ':''}다음 생산까지 ${duration((E.facilityDef(f.id).cycle-f.progress)*1000)}`;}}else if(modalName==='events'){for(const node of document.querySelectorAll('[data-task]')){const t=TASKS.find(t=>t.id===node.dataset.task),amount=g.daily[t.id]||0,claimed=g.daily.claims.includes(t.id);node.querySelector('p').textContent=`${Math.min(amount,t.goal)}/${t.goal} · 보석 ${t.gems} + 연구 ${t.elixir}`;node.querySelector('.material-bar>i').style.width=Math.min(100,amount/t.goal*100)+'%';const b=node.querySelector('button');if(serverButtons.has(b))continue;b.disabled=claimed||amount<t.goal;b.textContent=claimed?'받음':'받기';}}
 else if(modalName==='wheel'&&!wheelSpinning){const free=$('#spin-free'),extra=$('#spin-extra');if(free){free.disabled=g.wheel.free;free.textContent=g.wheel.free?'무료 회전 완료':'무료로 돌리기';}if(extra){extra.disabled=g.wheel.extra>=5||g.elapsed<g.wheel.nextAt;extra.textContent=g.wheel.extra>=5?'추가 회전 5회 완료':g.elapsed<g.wheel.nextAt?duration((g.wheel.nextAt-g.elapsed)*1000)+' 후 추가 회전':'추가 회전 · '+g.wheel.extra+'/5';}}
 else if(modalName==='supply'){const status=$('#supply-status');if(status)status.innerHTML=`무료 친구 배달: Lv.${E.hireLevel(g)} · ${duration((g.freeAt-g.elapsed)*1000)} 후<br>보급통: ${g.barrel?'지도에 도착했어요.':'다음 배달 준비 중'}`;const b=$('#open-barrel');if(b)b.disabled=!g.barrel||!!pendingBarrel;const wb=$('#open-worker-parcel');if(wb){wb.hidden=!g.workerBarrels?.length;wb.textContent='친구 보급 열기 · '+(g.workerBarrels?.length||0)+'개';}}
}
