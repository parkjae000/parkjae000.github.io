import {icon,fmt,duration,esc,unitPhase} from './ui.mjs?v=127';
import {placementBoard,resolvePlacement} from './placement.mjs?v=129';
import * as Rules from './economy.mjs';
import {advance as simulate,TASKS} from './game.mjs';
import {guidePage} from './guide.mjs?v=130';
import {watchRelease} from './release.mjs?v=124';
import {GameSession} from './session.mjs';
import {API,LIVE_HOSTS} from './config.mjs';
const E={...Rules};
const $=s=>document.querySelector(s),cv=$('#scene'),world=$('#world'),dialog=$('#dialog');
let ctx=cv.getContext('2d');
for(const [id,type] of Object.entries({coin:'gold',potion:'elixir',gem:'gem','hire-coin':'gold','crew-icon':'crew','settings':'settings','rank-button':'rank'}))$('#'+id).innerHTML=icon(type);
$('#research-icon').innerHTML='<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="9" width="28" height="35" rx="3" fill="#7ca66f" stroke="#425a5e" stroke-width="2" transform="rotate(-9 18 26)"/><rect x="12" y="5" width="28" height="35" rx="3" fill="#68b5d1" stroke="#415a85" stroke-width="2" transform="rotate(8 26 22)"/><rect x="16" y="7" width="23" height="30" rx="2" fill="#e6f4f1"/><path d="M20 26h15M20 30h10" stroke="#88b6c8" stroke-width="2"/></svg>';
$('#wheel-icon').innerHTML='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="25" r="20" fill="#9e83bc" stroke="#ffe5a8" stroke-width="3"/><path d="M24 6v38M5 25h38M10 11l28 28M10 39l28-28" stroke="#fff0c0" stroke-width="2"/><path d="m24 2-5 9h10z" fill="#f1ba57" stroke="#a37a46"/><circle cx="24" cy="25" r="7" fill="#f4ca69" stroke="#ffe9aa" stroke-width="2"/></svg>';
$('#event-icon').innerHTML='<svg viewBox="0 0 48 40" aria-hidden="true"><path d="m7 17-5-8 13 1 3 5m21 10 7 7-13 1-4-5" fill="#d6629d" stroke="#9c467a" stroke-width="2"/><rect x="12" y="6" width="25" height="28" rx="9" fill="#e68fb7" stroke="#9c467a" stroke-width="2" transform="rotate(40 24 20)"/><path d="m18 8 17 15M14 15l17 15" stroke="#f7c1d3" stroke-width="5"/></svg>';
const atlas=new Image(),ground=new Image(),support=new Image();atlas.src='atlas.webp';ground.src='ground.webp';support.src='support.webp';await Promise.all([atlas.decode(),ground.decode(),support.decode()]);
const W=780,STEP=86,LEFT=89,FONT='"Noto Sans CJK KR",system-ui,sans-serif',reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const serverButtons=new WeakSet();
let modalRefreshAt=0;
let wheelSpinning=false,wheelResult=null,wheelRotation=0,campSeen=-1,shopReceipt=null,wheelContext=null;
let g,player=null,authMode='register',offlineShown=false,H=1300,VH=1300,camera=0,selected=null,drag=null,frameAt=0,lastFrame=0,lastReal=Date.now(),hudAt=0,modalName=null,structureKey='',delivery=null,particles=[],movers=new Map(),celebrations=new Map();
let chatOwner=null,chatMessages=[],chatAfter=null,chatRead=null,chatRequest=null,chatAlertTimer;
const terrain=document.createElement('canvas');
const scenery=document.createElement('canvas');
scenery.setAttribute('aria-hidden','true');
scenery.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
cv.before(scenery);
cv.style.position='relative';
const sceneryContext=scenery.getContext('2d',{alpha:false});
let sceneryView='';
let terrainKey='',lastSimulation=0;
let pendingBarrel=null,parcelFlight=null,selectedCharge=null,chargeGesture=null,itemStage=null;

const client=new GameSession({api:LIVE_HOSTS.includes(location.hostname)?API:'/api',onGame:acceptGame,onStatus:updateSave,onError:notice});
for(const [name,type,fields] of [['assign','assign',['worker','target','stand']],['move','move',['worker','x','y']],['merge','merge',['a','b']],['recruit','recruit',[]],['upgrade','upgrade',['facility','count']],['activate','activate',['facility']],['collect','collect',['facility']],['research','research',['card']],['automate','automate',['facility']]]){E[name]=(_state,...args)=>{const payload=Object.fromEntries(fields.map((key,i)=>[key,args[i]]));const value=client.mutate(type,payload);return name==='collect'?value.result.amount:value.result;};}
E.nextMine=()=>client.mutate('next').game;
function updateSave(status){const el=$('#save-state');el.textContent=status==='saved'?'✓':status==='saving'?'↻':status==='offline'?'!':'…';el.dataset.status=status;el.title={saved:'서버 저장 완료',saving:'저장 중',offline:'연결을 복구하면 저장을 이어서 진행해요.'}[status]||'연결 확인 중';if(status==='signed-out')showWelcome();if(!g&&status==='offline'){$('#auth-loading').textContent='연결을 확인한 뒤 다시 시도해 주세요.';$('#retry-connection').hidden=false;}else $('#retry-connection').hidden=true;}
function showWelcome(){$('#app').hidden=true;$('#welcome').hidden=false;$('#auth-form').hidden=false;$('#auth-loading').hidden=true;if(dialog.open)dialog.close();g=null;resetChat(null);}
function acceptGame(game,p){if(!game){showWelcome();return;}const first=!g,changed=g&&g.stage!==game.stage,previous=g?.camp.moves;if(!first&&game!==g&&game.rocks.some((rock,i)=>rock.done!==g.rocks[i]?.done))terrainKey='';
 g=game;player=p;if(p?.id!==chatOwner){resetChat(p?.id);if(p?.id)loadChat();}if(first||changed){itemStage=null;$('#board-items').replaceChildren();terrainKey='';parcelFlight=null;selectedCharge=null;chargeGesture=null;}$('#welcome').hidden=true;$('#app').hidden=false;lastReal=client.now();if(first||changed){selected=null;drag=null;delivery=null;movers.clear();structureKey='';$('#structures').replaceChildren();$('#production-clocks').replaceChildren();campSeen=g.camp.moves;fit();focusCamp();}else if(previous!==g.camp.moves){campSeen=g.camp.moves;focusCamp();notice('개방 완료! 찻집과 대포가 앞으로 이동했어요.');}updateHUD(true);
 if(first&&!offlineShown&&client.base&&client.now()-client.base.lastAt>60000)offlineShown=true;}
const coord=(x,y)=>({x:LEFT+(x+.5)*STEP,y:H-(g.rows+3.2)*STEP+y*STEP});
function facilityBounds(f){
 const points=f.footprint, xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const start=coord(Math.min(...xs),Math.min(...ys)),end=coord(Math.max(...xs),Math.max(...ys));
 return {left:start.x-STEP/2,top:start.y-STEP/2,width:end.x-start.x+STEP,height:end.y-start.y+STEP};
}
function visual(f){
 if(f.id==='forge')return {x:178,y:coord(0,g.camp.row+2.55).y};
 const b=facilityBounds(f);
 return {x:b.left+b.width/2,y:b.top+124};
}
const cannonPoint=()=>({x:676,y:coord(0,g.camp.row+2.55).y});

const cameraMin=()=>g?Math.min(0,coord(0,g.camp.row+3.2).y-VH):0;
function focusCamp(){camera=Math.max(cameraMin(),Math.min(H-VH,coord(0,g.camp.row+3.2).y-VH));placeStructures();}
function fit(){if(!world.clientWidth||!world.clientHeight)return;const oldV=VH,oldH=H;VH=Math.round(world.clientHeight*W/world.clientWidth);H=Math.max(1260,VH,g?220+(g.rows+3.2)*STEP:1260);if(cv.width!==W)cv.width=W;if(cv.height!==VH)cv.height=VH;camera=Math.max(cameraMin(),Math.min(H-VH,camera+(H-oldH)+(oldV-VH)));placeStructures();}
new ResizeObserver(fit).observe(world);
function sprite(i,x,y,size=100,flip=false,alpha=1){const sheet=i>=16?support:atlas,cols=i>=16?2:4,n=i>=16?i-16:i,cell=sheet.width/cols;ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;if(flip)ctx.scale(-1,1);ctx.drawImage(sheet,(n%cols)*cell,Math.floor(n/cols)*cell,cell,cell,-size/2,-size*.82,size,size);ctx.restore();}
function art(i,cls=''){const n=i>=16?i-16:i,cols=i>=16?2:4;return `<span aria-hidden="true" class="item-art ${cls}" style="background-image:url('${i>=16?'support':'atlas'}.webp');background-size:${cols*100}% ${cols*100}%;background-position:${(n%cols)/(cols-1)*100}% ${Math.floor(n/cols)/(cols-1)*100}%"></span>`;}
function text(s,x,y,size=34,color='#fff8ec',stroke='#5b4a49'){ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${size}px ${FONT}`;if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=5;ctx.lineJoin='round';ctx.strokeText(s,x,y);}ctx.fillStyle=color;ctx.fillText(s,x,y);}
function rect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function notice(message){$('#notice').textContent=message;}
function action(fn,message=null){try{settle();const result=fn();if(message)notice(message);return result;}catch(e){notice(e.message);return null;}}
function settle(){if(!g)return;const t=client.now();lastReal=t;const ids=new Set(g.friends.map(w=>w.id)),before={...g.ledger};simulate(g,t);if(campSeen!==g.camp.moves){if(campSeen>=0){focusCamp();notice('개방 완료! 찻집·대포·소환 위치가 앞으로 이동했어요.');}campSeen=g.camp.moves;}for(const w of g.friends)if(!ids.has(w.id))launch(w.id);for(const f of g.facilities)if(g.ledger[f.id]>before[f.id])showPayout(f.id,g.ledger[f.id]-before[f.id]);}
function updateHUD(force=false){if(!g)return;$('#gold').textContent=fmt(g.gold);$('#elixir').textContent=fmt(g.elixir);$('#gems').textContent=fmt(g.gems);$('#scene-name').textContent='간식 동굴 '+g.stage;$('#crew-count').textContent=E.occupiedSlots(g)+'/'+E.capacity(g);const level=E.hireLevel(g),a=E.appearance(level);$('#hire-level').textContent='LV.'+level;const hires=g.hires%E.hiresPerLevel;$('#hire-meter').style.setProperty('--paid',hires/E.hiresPerLevel*100+'%');$('#hire-meter').textContent=level<40?hires+'/'+E.hiresPerLevel:'MAX';$('#hire-cost').textContent=E.occupiedSlots(g)>=E.capacity(g)?'정원 가득':fmt(E.hirePrice(g));$('#hire-portrait').style.backgroundPosition=(a.idle/3*100)+'% 0';$('#hire').disabled=E.occupiedSlots(g)>=E.capacity(g)||g.gold<E.hirePrice(g)||!E.deliverySpot(g);$('#hire-coin').hidden=E.occupiedSlots(g)>=E.capacity(g);$('#hire').setAttribute('aria-label',E.occupiedSlots(g)>=E.capacity(g)?'친구 정원 가득':`Lv.${level} ${a.name} 채용 · ${fmt(E.hirePrice(g))} 골드`);$('#wheel-count').textContent=g.wheel.extra+'/5';$('#wheel-button').title=g.wheel.free?'추가 회전 '+g.wheel.extra+'/5':'무료 회전 가능';$('#event-clock').textContent=g.daily.claims.length+'/4';$('#scene').setAttribute('aria-label','작업장 · '+g.friends.map(w=>E.appearance(w.level).name+' Lv.'+w.level).join(', '));$('#work-count').textContent=`작업 중 ${g.friends.filter(w=>w.target).length}/${g.friends.length}`;updateStructures(force);updateProductionClocks();updateBoardItems();updateSelection();refreshPanel(force);}
let accessGame=null,accessSignature='',accessTiles;
function showPayout(id,amount){
 const clock=document.getElementById('info-'+id);
 if(!clock||!amount)return;
 clock.querySelector('.gold-payout')?.remove();
 const gain=document.createElement('span');
 gain.className='gold-payout';gain.setAttribute('aria-hidden','true');
 gain.textContent='+'+fmt(amount)+' G';clock.append(gain);
 gain.addEventListener('animationend',()=>gain.remove(),{once:true});
}
function collectFacility(f){
 const amount=action(()=>E.collect(g,f.id),'생산 골드를 받았어요.');
 if(amount)showPayout(f.id,amount);
}
function syncClockButtons(){
 const layer=$('#production-clocks');
 for(const f of g.facilities.filter(f=>f.active)){
  if(document.getElementById('info-'+f.id))continue;
  const clock=document.createElement('button');
  clock.id='info-'+f.id;clock.dataset.info=f.id;clock.className='facility-clock';
  clock.innerHTML='<span class="clock-face"><i aria-hidden="true"></i><b></b></span>';
  layer.append(clock);
 }
}
function updateProductionClocks(){
 for(const b of document.querySelectorAll('[data-info]')){
  const f=g.facilities.find(f=>f.id===b.dataset.info),cycle=E.facilityCycle(g,f);
  const percent=f.ready?100:Math.floor(Math.min(1,f.progress/cycle)*100);
  b.style.setProperty('--cycle',percent+'%');
  const state=f.ready?'ready':f.auto?'automatic':'manual';
  if(b.dataset.mode!==state){
   b.dataset.mode=state;b.className='facility-clock '+state;
   const def=E.facilityDef(f.id);
   b.querySelector('i').textContent=f.ready?def.product:f.auto?'자동':'생산';
   b.setAttribute('aria-label',def.name+' · '+(f.ready?fmt(f.ready)+'골드 받기':f.auto?'자동 수령 중 · 생산 정보':'직접 수령 · 생산 정보'));
  }
  const label=f.ready?'받기':duration((cycle-f.progress)*1000);
  const clock=b.querySelector('b');if(clock.textContent!==label)clock.textContent=label;
 }
}
function updateStructures(force=false){const signature=[g.stage,g.stats.rocks,g.camp.moves,...g.checkpoints.map(t=>t.done)].join('/');
 if(accessGame!==g||accessSignature!==signature){accessGame=g;accessSignature=signature;accessTiles=E.openTiles(g);}
 const reachable=f=>E.facilityApproaches(f).some(p=>accessTiles.has(p.join(',')));
 const state=g.facilities.map(f=>{const q=E.quoteUpgrade(g,f);return [f.id,f.level,f.active,f.repaired,!f.port||reachable(f),f.auto,E.cycleYield(g,f),!!f.ready,q.count,q.cost,g.friends.filter(w=>w.target===f.id).map(w=>w.id).join(',')].join(':');}).join('|')+';'+[...g.checkpoints,g.exit].map(t=>t.id+':'+t.done).join('|');if(state===structureKey){
 for(const b of document.querySelectorAll('[data-repair]')){const f=g.facilities.find(f=>f.id===b.dataset.repair),rate=g.friends.filter(w=>w.target===f.id).reduce((n,w)=>n+E.workerPower(g,w),0);if(rate&&!f.repaired)b.firstChild.nodeValue='채굴 중 '+duration(f.hp/rate*1000);}
 return;
 }structureKey=state;
 $('#structures').innerHTML=g.facilities.map(f=>{const d=E.facilityDef(f.id),q=E.quoteUpgrade(g,f),bar=E.milestoneBar(f),preview=Math.min(1,(f.level+(q.count||0)-bar.previous)/(bar.next-bar.previous||1));if(!f.active){const accessible=reachable(f),workers=g.friends.filter(w=>w.target===f.id),dps=workers.reduce((sum,w)=>sum+E.workerPower(g,w),0);return `<div class="production" data-structure="${f.id}"><button class="repair-card ${accessible?'active-ready':''}" data-repair="${f.id}" ${accessible?'':'disabled'} aria-label="${d.name} 시설 채굴">${dps?'채굴 중 '+duration(f.hp/dps*1000):accessible?'시설 채굴':'옆길을 열어요'}<small>${d.name}</small></button></div>`;}
 return `<div class="production" data-structure="${f.id}"><span class="yield" title="${statFmt(E.facilityCycle(g,f))}초 생산량 · 현재 → 표시된 강화 후">${icon('gold')}<b>${fmt(E.cycleYield(g,f))}${q.count?' → '+fmt(E.cycleYield(g,{...f,level:f.level+q.count})):''}</b></span><button id="upgrade-${f.id}" class="upgrade-card" data-upgrade="${f.id}" data-count="${q.count}" ${!q.count?'disabled':''} aria-label="${d.name} Lv.${f.level} · ${statFmt(E.facilityCycle(g,f))}초마다 ${fmt(E.cycleYield(g,f))} 골드 · ${q.count?'+'+q.count+'레벨 강화 '+fmt(q.cost)+' 골드':'강화 골드 부족'}"><span class="upgrade-progress"><i class="preview-fill" style="width:${preview*100}%"></i><i class="current-fill" style="width:${bar.progress*100}%"></i><b>${f.level>=E.maxFacilityLevel(f.id)?'MAX':'Lv.'+f.level+' / '+bar.next}</b></span><span class="upgrade-buy"><strong>${f.level>=E.maxFacilityLevel(f.id)?'MAX':'+'+(q.count||1)}</strong><span>${icon('gold')}${f.level>=E.maxFacilityLevel(f.id)?'최대':fmt(q.cost)}</span></span></button><button class="facility-label" data-details="${f.id}" aria-label="${d.name} 생산 정보와 자동 수령 설정">${f.auto?d.name:'자동 수령 설정'} ›</button></div>`;}).join('')+[...g.checkpoints.filter(t=>!t.done),g.exit].map(t=>`<button class="gate-hit ${t.id==='exit'&&t.done?'exit-next':''}" data-gate="${t.id}" aria-label="${t.id==='exit'?(E.readyForNext(g)?'다음 구역으로':'출구 작업 · 앞줄 세 칸'):'중간 개방문 '+t.toSegment+' 작업 · 앞줄 세 칸'}">${t.id==='exit'&&t.done?'다음 구역으로 ›':''}</button>`).join('');syncClockButtons();placeStructures();}
function placeStructures(){
 if(!g)return;
 positionLoot();
 const k=world.clientWidth/W;
 for(const node of document.querySelectorAll('[data-structure]')){
  const f=g.facilities.find(f=>f.id===node.dataset.structure),p=visual(f);
  if(f.id==='forge'){
   const cells=E.forgePanelCells,center=coord((cells.left+cells.right)/2,g.camp.row+cells.bottom+.5);
   const width=((cells.right-cells.left+1)*STEP-8)*k,height=((cells.bottom-cells.top+1)*STEP-8)*k;
   node.style.width=width+'px';
   const scale=Math.min(1,height/node.offsetHeight,width/Math.max(node.scrollWidth,1));
   node.style.transform='scale('+scale+')';
   node.style.left=center.x*k-width/2+'px';
   node.style.top=(center.y-4-camera)*k-node.offsetHeight+'px';
  }else{
   const lot=facilityBounds(f),width=lot.width-8;
   node.style.width=width*k+'px';node.style.left=(p.x-width/2)*k+'px';
   node.style.top=(lot.top+lot.height-7-camera)*k-node.offsetHeight+'px';
  }
 }
 for(const node of document.querySelectorAll('[data-info]')){
  const f=g.facilities.find(f=>f.id===node.dataset.info),p=visual(f);
  node.style.left=p.x*k+'px';
  const top=f.footprint.length?facilityBounds(f).top:p.y-171;node.style.top=(top-camera)*k+'px';
  node.style.width=Math.max(62,Math.min(96,(2*STEP-6)*k))+'px';
 }
 for(const node of document.querySelectorAll('[data-gate]')){
  const t=[...g.checkpoints,g.exit].find(t=>t.id===node.dataset.gate),p=coord(t.x,t.y);
  if(!t.done)node.style.width=E.EXIT_APPROACH.length*STEP*k+'px';
  node.style.left=p.x*k-node.offsetWidth/2+'px';
  node.style.top=(p.y-(t.done?10:40)-camera)*k-node.offsetHeight/2+'px';
 }
}
function updateSelection(){
 const w=selected&&g.friends.find(worker=>worker.id===selected),cancel=$('#clear-selection');
 $('#work-count').hidden=!!w;
 cancel.hidden=!w;
 if(!w)return;
 const label=E.appearance(w.level).name+' Lv.'+w.level;
 cancel.textContent=label+' ×';
 const target=w.target&&E.targets(g).find(t=>t.id===w.target);
 const power=target?g.friends.filter(friend=>friend.target===target.id).reduce((n,friend)=>n+E.workerPower(g,friend),0):0;
 const detail=label+' · '+fmt(E.workerPower(g,w))+'/초'+(power?' · 남은 시간 '+duration(target.hp/power*1000):' · 대기');
 cancel.title=detail;cancel.setAttribute('aria-label',detail+' · 선택 해제');
}
function drawGround(){ctx.fillStyle='#b5a2b9';ctx.fillRect(0,Math.min(0,camera),W,H+Math.max(0,-camera));ctx.drawImage(ground,0,0,W,H);const ceiling=coord(3,-1).y-60;if(ceiling>0){rect(0,Math.min(0,camera),W,ceiling-Math.min(0,camera),0,'#bdadbb');for(let x=15;x<W;x+=145)sprite(14,x,ceiling+28,210);} ctx.strokeStyle='#936c5c16';ctx.lineWidth=1;for(let x=0;x<=7;x++){const p=LEFT+x*STEP;ctx.beginPath();ctx.moveTo(p,coord(0,-1).y);ctx.lineTo(p,H-90);ctx.stroke();}for(let y=coord(0,0).y-STEP/2;y<H-90;y+=STEP){ctx.beginPath();ctx.moveTo(LEFT,y);ctx.lineTo(W-LEFT,y);ctx.stroke();}}
function gate(t){
 const p=coord(t.x,t.y),exit=t.id==='exit',half=E.EXIT_APPROACH.length*STEP/2;
 rect(LEFT,p.y-13,p.x-LEFT-half,16,4,'#b98b66','#8b674f');
 rect(p.x+half,p.y-13,W-LEFT-p.x-half,16,4,'#b98b66','#8b674f');
 if(t.done)return;
 {
  rect(p.x-half+2,p.y-24,half*2-4,23,4,'#c79d74','#8b674f');
  for(const [dx] of E.EXIT_APPROACH){
   if(!dx)continue;
   const post=p.x+dx*STEP;
   rect(post-7,p.y-32,14,41,4,'#ac805d','#795b46');
   rect(post-3,p.y-26,6,6,2,'#f6d091');
  }
 }
 sprite(13,p.x,p.y+18,157);
 rect(p.x-63,p.y-24,126,31,8,'#80624f','#d8bb8e');
 text(exit?'출구':'개방 '+t.toSegment,p.x,p.y-8,23,'#fff1cb',null);
}
function workbar(t,p){const dps=g.friends.filter(w=>w.target===t.id).reduce((n,w)=>n+E.workerPower(g,w),0);if(!dps&&t.hp===t.max)return;rect(p.x-29,p.y-72,58,8,3,'#8e7568');if(t.hp>0)rect(p.x-28,p.y-71,56*t.hp/t.max,6,2,'#c5d9a0');if(dps)text(duration(t.hp/dps*1000),p.x,p.y-89,22,'#fff8e8','#705c51');}
function drawFacility(f,time){
 const p=visual(f),d=E.facilityDef(f.id);
 sprite(d.art,p.x,p.y,f.id==='forge'?218:148,false,f.active?1:.88);
 if(!f.active&&!f.repaired)workbar(f,p);
 if(d.tier>2)text(d.product,p.x+42,p.y-31,27,'#fff8eb',null);
}
function drawFriends(time,dt){for(const w of g.friends){if(drag?.active&&drag.id===w.id||delivery?.id===w.id&&time-delivery.at<650)continue;const p=coord(w.x,w.y),m=movers.get(w.id)||{...p},moving=Math.hypot(m.x-p.x,m.y-p.y)>2,k=Math.min(1,dt*12);m.x+=(p.x-m.x)*k;m.y+=(p.y-m.y)*k;movers.set(w.id,m);const t=w.target&&(g.rocks.find(t=>t.id===w.target)||g.facilities.find(t=>t.id===w.target)||g.checkpoints.find(t=>t.id===w.target)||(w.target==='exit'?g.exit:null)),look=E.appearance(w.level),phase=(time/1000+unitPhase(w.id))%.82,frame=t&&phase>.28&&phase<.63?look.hit:look.idle;
 if(selected===w.id){rect(p.x-STEP/2+4,p.y-STEP/2+4,STEP-8,STEP-8,10,'#c7e5cf80','#82a68a');}
 ctx.fillStyle='#80604527';ctx.beginPath();ctx.ellipse(m.x,m.y,24,8,0,0,7);ctx.fill();let bob=reduced?0:moving?Math.sin(time/70)*3:frame===look.hit?-2:0;if((celebrations.get(w.id)||0)>time&&!reduced)bob-=Math.abs(Math.sin(time/100))*12;sprite(frame,m.x,m.y+bob,118,(t?.port?t.visual.x:t?.x)<w.x);text(w.level,m.x,m.y+17,29,'#fff9e6','#8f7963');if(!t){rect(m.x-29,m.y-103,58,25,8,'#fff1c9','#ba9b72');text('대기',m.x,m.y-90,19,'#8a6646',null);}if(t&&frame===look.hit&&phase>.4&&phase<.6&&!reduced){const q=t.port?visual(t):coord(t.x,t.y);ctx.fillStyle='#ffe5aa';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(q.x-16+i*14,q.y-37,4,0,7);ctx.fill();}}}}
function drawFacilityBase(f){
 const b=facilityBounds(f),x=b.left+2,y=b.top+2,w=b.width-4,h=b.height-4;
 rect(x,y+1,w,h-1,10,'#8a7569','#715e53');
 rect(x+4,y+3,w-8,h-10,8,'#bd9774','#886751');
 for(let i=0;i<Math.ceil((h-14)/24);i++){
  const py=y+7+i*24,ph=Math.min(22,y+h-8-py);
  if(ph>0)rect(x+8,py,w-16,ph,3,i%2?'#d5b18b':'#dfbe99');
 }
 // The station fills exactly its blocked cells. Dress the yard on older, taller lots too.
 for(let bottom=y+h-22;bottom>y+185;bottom-=STEP){
  sprite(14,x+30,bottom,52,true);sprite(14,x+w-28,bottom-5,44);
 }
 for(const px of [x+8,x+w-15])for(const py of [y+7,y+h-19]){
  rect(px,py,8,11,3,'#a27b59','#785a42');rect(px+2,py+1,4,3,1,'#f0d0a0');
 }
}
function drawTerrain() {
 const overscan=STEP*4,band=Math.floor(Math.max(0,camera)/overscan)*overscan;
 const start=Math.max(0,band-overscan),end=Math.min(H,band+VH+overscan*2);
 const key=[g.stage,H,VH,start,end,g.stats.rocks,g.camp.moves].join('/');
 if(terrainKey!==key){
  terrain.width=W;terrain.height=Math.max(1,Math.ceil(end-start));
  const screen=ctx;
  try {
   ctx=terrain.getContext('2d');ctx.save();ctx.translate(0,-start);drawGround();
   // The staging floor behind each door is revealed only when the camp advances.
   for(const gate of g.checkpoints){
    if(gate.done)continue;
    const top=coord(0,gate.y-3).y-STEP/2,bottom=coord(0,gate.y).y-STEP/2;
    if(bottom<start||top>end)continue;
    ctx.fillStyle='#b4a0ae';ctx.fillRect(LEFT,top,STEP*7,bottom-top);
    for(let row=1;row<=3;row++)for(let x=0;x<E.COLS;x++){
     const p=coord(x,gate.y-row);sprite(14,p.x,p.y+8,99);
    }
   }
   for(const f of g.facilities)if(f.footprint.length)drawFacilityBase(f);
   for(const [x,y] of g.bedrock||[]){
    const p=coord(x,y);if(p.y<start-24||p.y>end+105)continue;
    sprite(14,p.x,p.y+5,100);
   }
   for(const rock of g.rocks){if(rock.done)continue;const p=coord(rock.x,rock.y);if(p.y<start-24||p.y>end+105)continue;sprite(rock.type,p.x,p.y,103);text(rock.level,p.x,p.y-25,36);}
   ctx.restore();
  }finally{ctx=screen;}
  terrainKey=key;sceneryView='';
 }
 const view=key+'/'+camera;if(view===sceneryView)return;sceneryView=view;
 if(scenery.width!==W)scenery.width=W;if(scenery.height!==VH)scenery.height=VH;
 sceneryContext.fillStyle='#bdadbb';sceneryContext.fillRect(0,0,W,VH);
 sceneryContext.drawImage(terrain,0,start-camera);
}
function draw(time){requestAnimationFrame(draw);if(!g||document.hidden)return;frameAt=time;const dt=Math.min(.06,(time-lastFrame)/1000||.033);lastFrame=time;if(time-lastSimulation>=100){settle();lastSimulation=time;}if(time-hudAt>240){updateHUD();hudAt=time;}ctx.clearRect(0,0,W,VH);ctx.save();ctx.translate(0,-camera);drawTerrain();gate(g.exit);if(!g.exit.done)workbar(g.exit,coord(g.exit.x,g.exit.y));for(const checkpoint of g.checkpoints){gate(checkpoint);if(!checkpoint.done)workbar(checkpoint,coord(checkpoint.x,checkpoint.y));}
 for(const r of g.rocks){if(r.done||r.hp>=r.max)continue;const p=coord(r.x,r.y);if(p.y>=camera-20&&p.y<=camera+VH+100)workbar(r,p);}
 for(const f of g.facilities)drawFacility(f,time);const cannon=cannonPoint(),shot=Math.max(delivery?.at??-1000,parcelFlight?.at??-1000),kick=time-shot<400?Math.sin((time-shot)/400*Math.PI)*9:0;sprite(12,cannon.x+kick,cannon.y,166);rect(cannon.x-38,cannon.y+2,76,24,8,'#fff1d0','#ad8b66');text('Lv.'+E.cannonLevel(g),cannon.x,cannon.y+14,20,'#856340',null);
 drawFriends(time,dt);
 if(chargeGesture?.aim){
  const aim=chargeGesture.aim,p=aim.target.port?visual(aim.target):coord(aim.target.x,aim.target.y);
  rect(p.x-60,p.y-110,120,30,8,'#7b614c');
  text(aim.remaining?'남음 '+fmt(aim.remaining):'즉시 완료',p.x,p.y-95,21,'#fff1bb',null);
 }
 if(drag?.active){
  scrollDragAtEdge(dt);
  const w=g.friends.find(w=>w.id===drag.id);
  if(w){
   const drop=dropAt(drag.point,w,drag);
   const anchor=drop?coord(drop.x,drop.y):{x:drag.point.x,y:drag.point.y+drag.grip};
   ctx.strokeStyle=drop?'#479c68':'#cb8a7e';ctx.fillStyle=drop?'#c7f5b88c':'#ffdcc941';ctx.lineWidth=5;
   ctx.beginPath();ctx.ellipse(anchor.x,anchor.y,36,14,0,0,Math.PI*2);ctx.fill();ctx.stroke();
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
function targetAt(p){return E.targets(g).filter(t=>!t.port).map(t=>({t,p:coord(t.x,t.y)})).filter(z=>Math.abs(z.p.x-p.x)<(E.isWideGate(z.t)?E.EXIT_APPROACH.length*STEP/2:47)&&p.y>z.p.y-81&&p.y<z.p.y+20).sort((a,b)=>Math.hypot(a.p.x-p.x,a.p.y-29-p.y)-Math.hypot(b.p.x-p.x,b.p.y-29-p.y))[0]?.t;}
function facilityAt(p){return g.facilities.find(f=>{if(f.footprint.length){const b=facilityBounds(f);return p.x>=b.left&&p.x<b.left+b.width&&p.y>=b.top&&p.y<b.top+b.height;}
 const at=visual(f);return Math.abs(at.x-p.x)<90&&p.y>at.y-155&&p.y<at.y+25;});}
function dropAt(p,actor,gesture){
 const signature=[g.stats.rocks,g.camp.moves,g.exit.done,...g.facilities.map(f=>f.repaired),...[...g.friends,...E.boardItems(g)].map(w=>w.id+','+w.x+','+w.y)].join('/');
 if(gesture.game!==g||gesture.layout!==signature){
  gesture.board=placementBoard(g,actor);gesture.game=g;gesture.layout=signature;
 }
 const origin=coord(0,0),touch={x:(p.x-origin.x)/STEP,y:(p.y-origin.y)/STEP};
 return resolvePlacement(gesture.board,actor,touch,gesture.grip/STEP,friendAt(p,actor.id));
}
function scrollDragAtEdge(dt){
 const d=drag;if(!d?.active)return;
 const y=d.point.y-camera,edge=Math.min(80,VH*.1);
 const speed=y<edge?-Math.min(1,(edge-y)/edge):y>VH-edge?Math.min(1,(y-VH+edge)/edge):0;
 if(!speed)return;
 const next=Math.max(cameraMin(),Math.min(H-VH,camera+speed*STEP*9*dt));
 if(next!==camera){d.point.y+=next-camera;camera=next;placeStructures();}
}
function orderTarget(t){
 const chosen=g.friends.find(w=>w.id===selected);
 const workers=chosen?[chosen]:g.friends.filter(w=>(t.id!=='exit'&&!t.port)||w.target!==t.id)
  .sort((a,b)=>(!!a.target-!!b.target)||E.workerPower(g,b)-E.workerPower(g,a));
 const w=workers.find(w=>E.destination(g,t,w));
 if(w){
  const job=assignTo(w,t);
  if(job)movers.set(w.id,coord(job.x,job.y));
 }else if(t.id==='exit'){
  notice('출구 앞줄에 연결된 빈 작업 칸이 필요해요.');
 }else notice('앞의 바위를 캐서 작업 자리를 열어 주세요.');
}
function assignTo(w,t,stand){return action(()=>{const assigned=E.assign(g,w.id,t.id,stand);selected=null;updateSelection();return assigned;});}
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
  const drop=dropAt(p,actor,d);
  if(!drop)return;
  if(drop.spot==='merge'){
   const result=action(()=>E.merge(g,actor.id,drop.friend.id));
   if(result){movers.set(result.id,coord(result.x,result.y));celebrations.set(result.id,performance.now()+650);}
  }else if(drop.spot==='assign'){
   const job=assignTo(actor,drop.target,{x:drop.x,y:drop.y});
   if(job)movers.set(actor.id,coord(job.x,job.y));
  }else{
   const moved=action(()=>E.move(g,actor.id,drop.x,drop.y));
   if(moved)movers.set(actor.id,coord(moved.x,moved.y));
  }
  return;
 }
 const w=friendAt(p),t=targetAt(p),f=facilityAt(p);
 if(w){selected=w.id;updateSelection();return;}if(t&&!f?.footprint.length){orderTarget(t);return;}if(f){if(!f.repaired){orderTarget(f);return;}if(f.ready){collectFacility(f);return;}openFacility(f);return;}if((g.bedrock||[]).some(([x,y])=>{const q=coord(x,y);return Math.abs(q.x-p.x)<STEP/2&&p.y>q.y-65&&p.y<q.y+15;})){notice('고정 암벽이에요. 옆의 숫자 바위를 캐서 길을 내세요.');return;}if(p.y<cannonPoint().y&&p.y>cannonPoint().y-160&&p.x>590){panel('supply');return;}selected=null;updateSelection();});
for(const event of ['pointercancel','lostpointercapture'])cv.addEventListener(event,e=>{if(drag?.pointer===e.pointerId)drag=null;});$('#clear-selection').onclick=()=>{selected=null;updateSelection();};
$('#hire').onclick=()=>{const w=action(()=>E.recruit(g));if(w)launch(w.id);};
function open(title,html,name='custom'){modalName=name;$('#dialog-title').textContent=title;$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();}
function showGuide(index){
 open('그림으로 보는 게임 설명',guidePage(index),'help');
 $('#dialog-content').scrollTop=0;
}
function showDeparture(){
 const next=g.stage+1;
 open(next+'구역으로 떠날까?',`<div class="departure-gold"><p>떠나면 사라지는 골드 <b id="departure-balance">${Math.floor(g.gold).toLocaleString('ko-KR')}</b></p><p>${next}구역 시작 골드 <b>${E.startingGold(next).toLocaleString('ko-KR')}</b></p></div><p><b>골드는 이 동굴에서만 쓰는 돈이야.</b> 떠나면 지금 가진 골드는 전부 사라져. 새 동굴에서는 위에 적힌 시작 골드로 친구와 가게를 다시 키워.</p><p>보석·연구 포인트·카드와 카드 레벨은 그대로 가져가. 남은 상자를 더 캐고 싶으면 여기에 있어도 돼.</p><div class="departure-actions"><button id="stay-here" autofocus>계속 채굴</button><button data-leave-stage="${g.stage}">${next}구역으로 이동</button></div>`,'departure');
}
function openFacility(f){
 const d=E.facilityDef(f.id),cycle=E.facilityCycle(g,f),income=E.facilityRate(g,f),bar=E.milestoneBar(f),max=f.level>=E.maxFacilityLevel(f.id);
 const req=E.automation(g,f.id),current=g.cards[req.card]?.level||0;
 const next={...f,level:f.level+1},delta=max?0:E.facilityRate(g,next)-income;
 const unlock=f.id==='forge'?'<p><b>기본 찻집은 처음부터 자동 수령 중이에요.</b> 시간이 차면 골드가 바로 지갑에 들어와요.</p>':
  f.auto?'<p><b>자동 수령 중</b> · 이 동굴에 있는 동안 골드가 지갑에 바로 들어와요.</p>':
  `<section class="auto-steps"><h2>자동 수령 켜는 법</h2><p>① 아래 카드에서 <b>${E.cardName(req.card)}</b>을 Lv.${req.level}까지 연구해요. 지금은 Lv.${current}예요.</p><p>② 조건을 채우고 <b>자동 수령 켜기</b>를 한 번 눌러요. 그때부터 말풍선을 누를 필요가 없어요.</p>${current<req.level?`<button class="dialog-button" data-study-card="${req.card}">필요한 카드 연구하기</button>`:`<button class="dialog-button" data-automate="${f.id}">자동 수령 켜기</button>`}</section>`;
 open(d.name,`${unlock}<div class="facts"><span>시설 레벨</span><strong>Lv.${f.level}</strong><span>한 번 생산하는 골드</span><strong>${fmt(E.cycleYield(g,f))}</strong><span>한 번 걸리는 시간</span><strong>${statFmt(cycle)}초</strong><span>바로 받을 때 초당 수입</span><strong>${statFmt(income)}골드</strong><span>다음 생산 보너스</span><strong>${max?'최대':'Lv.'+bar.next+' · ×'+fmt(bar.bonus)}</strong>${delta>0?`<span>다음 1레벨 투자 회수</span><strong>${duration(E.upgradePrice(g,f)/delta*1000)}</strong>`:''}<span>수령 방법</span><strong>${f.auto?'자동':'완료 말풍선 누르기'}</strong></div><p id="facility-cycle" class="panel-intro"></p><div id="facility-collect"></div><button class="dialog-button" data-panel="cards">카드 연구 보기</button>`,'facility:'+f.id);refreshPanel(true);
}
const statFmt=n=>n<1e6?n.toLocaleString('ko-KR',{maximumFractionDigits:2}):fmt(n);
function cardMarkup(id,shop=false){
 const c=g.cards[id],p=E.cardPreview(g,id),d=E.facilityDef(id),cost=p.cost,can=c.count>=cost.cards&&g.elixir>=cost.elixir;
 const stats=`<div class="stat-change"><small>${p.label}</small><div><b>${statFmt(p.current)}</b>${p.max?'':`<span>→</span><strong>${statFmt(p.next)}</strong>`}<small>${p.unit}</small></div></div>`;
 const materials=p.max?'':`<div class="card-material"><span>보유 <b>${c.count}</b> / 다음 레벨 <b>${cost.cards}장</b></span><span>${c.count>=cost.cards?'카드 준비 완료':cost.cards-c.count+'장 더 필요'}</span></div><div class="material-bar"><i style="width:${Math.min(100,c.count/cost.cards*100)}%"></i></div>`;
 const shaft=g.facilities.find(f=>f.id!=='forge'&&E.automation(g,f.id).card===id),req=shaft?E.automation(g,shaft.id):null;
 const automate=req?`<p class="auto-note">이번 구역 · ${E.facilityDef(shaft.id).name} 자동 수령에 Lv.${req.level} 필요 · 현재 Lv.${c.level}</p>${shaft.auto?'<p class="auto-note">자동 수령 중</p>':shaft.active&&c.level>=req.level?`<button class="dialog-button" data-automate="${shaft.id}">자동 수령 켜기</button>`:''}`:'';
 const buy=shop&&!p.max?`<button class="dialog-button gem-buy" data-buy="card-${id}" ${g.gems<12?'disabled':''}>${icon('gem')} 12 · 카드 3장 구매</button>`:'';
 const study=p.max?'':`<button class="dialog-button research-buy" data-research="${id}" ${can?'':'disabled'}>${icon('elixir')} 연구 ${fmt(cost.elixir)}</button>`;
 return `<article class="research-card" data-card="${id}" data-card-level="${c.level}"><div class="card-heading">${art(p.art)}<div><span class="rarity">${id.startsWith('manager-')?'숙련 생산 연구':d?'생산 연구':'특별 연구'}</span><h2>${E.cardName(id)}</h2><b>Lv.${c.level}${p.max?' · 연구 완료':' → Lv.'+(c.level+1)}</b></div></div>${stats}${materials}${automate}${buy}${study}</article>`;
}
function rewardArt(reward){if(reward.type==='gems')return icon('gem');if(reward.type==='elixir'||reward.type==='time')return art(17);if(reward.type==='cards')return art(18);return art(E.appearance(wheelContext?.level??E.hireLevel(g)+1).idle);}
function wheelMarkup(){const context=wheelContext||{level:E.hireLevel(g)+1,full:E.occupiedSlots(g)>=E.capacity(g)};const colors=['#a6d2be','#e8c5ab','#b9c5e0','#eddc9d','#bcd6a1','#d0b3d5','#a9d2d2','#e9bcaa'];let paths='';for(let i=0;i<8;i++){const a=(i*45-112.5)*Math.PI/180,b=(i*45-67.5)*Math.PI/180;paths+=`<path d="M160 160 L${160+151*Math.cos(a)} ${160+151*Math.sin(a)} A151 151 0 0 1 ${160+151*Math.cos(b)} ${160+151*Math.sin(b)}Z" fill="${colors[i]}" stroke="#fff2ce" stroke-width="2"/>`;}
 return `<div class="wheel-stage"><div class="wheel-pointer"></div><div id="wheel-rotor" class="wheel-rotor" style="transform:rotate(${wheelRotation}deg)"><svg viewBox="0 0 320 320" aria-hidden="true">${paths}</svg>${E.WHEEL_REWARDS.map((r,i)=>{const a=i*45*Math.PI/180,x=50+Math.sin(a)*32,y=50-Math.cos(a)*32;return `<span class="wheel-prize" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%) rotate(${i*45}deg)">${r.type==='worker'&&context.full?art(17):rewardArt(r)}<b>${r.type==='worker'?(context.full?'연구40':'Lv.'+context.level):r.type==='time'?'1분':r.amount+(r.type==='cards'?'장':'' )}</b></span>`;}).join('')}</div><div class="wheel-hub">✿</div></div>`;}
function deliveryStatus(){
 const timer=!E.deliverySpot(g)?'빈 바닥이 생길 때까지 '+duration((g.freeAt-g.elapsed)*1000)+'에서 멈춤':duration((g.freeAt-g.elapsed)*1000)+' 후';
 return `무료 친구 Lv.${E.cannonLevel(g)} · ${timer}<br>일반 보급통 · ${g.barrel?'지도에 도착':'배달 준비 중'}`;
}
function crewPanel(){
 const c=E.crewInfo(g),parcels=g.workerBarrels?.length||0;
 const explanation=parcels&&c.full&&c.pair?'상자는 바닥에서 기다려요. 친구 둘을 합쳐 자리를 만들고 열어 주세요.':c.pair?'같은 레벨 친구 둘을 합치면 한 칸이 비어요.':c.stranded?'지금은 합칠 짝이 없어요. 다음 일반 보급통을 열면 가장 낮은 친구에게 짝이 도착해 그 자리에서 합쳐져요.':c.partner?'다음 일반 보급통에 Lv.'+c.partner.level+' 친구의 합성 짝이 들어 있어요.':'같은 레벨 둘을 겹치면 한 단계 높은 친구가 돼요.';
 const cards=g.cards.capacity;
 return `<div class="facts"><span>사용 중인 정원</span><strong>${E.occupiedSlots(g)} / ${E.capacity(g)}칸</strong><span>지도 위 친구</span><strong>${g.friends.length}명</strong><span>미개봉 친구 보급</span><strong>${parcels}개</strong></div><p>${explanation}</p>${parcels?'<button class="dialog-button" id="open-worker-parcel">친구 보급 열기 · '+parcels+'개</button>':''}${c.pair?'<button class="dialog-button" data-crew-merge="'+c.pair.level+'">Lv.'+c.pair.level+' 친구 둘 합치기</button>':''}${g.barrel&&(c.stranded||c.partner)?'<button class="dialog-button" id="open-barrel">합성 짝 보급 열기</button>':''}<p id="supply-status">${deliveryStatus()}</p>${cards?.level<4?'<button class="dialog-button" data-panel="cards">정원 확장 카드 보기</button>':''}`;
}
function panel(name){if(!g)return;settle();if(name==='menu'){open('내 모험 · '+player.nickname,`<div class="facts"><span>현재 구역</span><strong>${g.stage}구역</strong><span>누적 채굴</span><strong>${g.stats.rocks}개</strong><span>누적 합성</span><strong>${g.stats.merges}번</strong><span>진행 저장</span><strong>${client.status==='saved'?'저장 완료':client.status==='offline'?'연결 확인 중':'저장 중'}</strong></div><div class="menu-actions"><button data-panel="chat">친구들과 채팅</button><button data-panel="rankings">전체 랭킹</button><button data-panel="supply">보급·무료 배달</button><button data-panel="help">플레이 안내</button></div><button class="dialog-button" id="sync-game">저장 확인</button><button class="logout-button" id="logout">로그아웃</button><p class="account-note">닉네임과 PIN으로 다른 기기에서도 이어 할 수 있어요. 자리비움 중 생산·지정 작업은 최대 8시간 반영돼요.</p>`,name);}
 else if(name==='cards'){open('카드 연구',`<div class="wallet-line">${icon('elixir')} 연구 <b>${fmt(g.elixir)}</b><span>구역을 넘어 유지돼요</span></div><p class="panel-intro">골드는 시설 강화에, 카드와 연구는 영구 성장에 사용해요.</p>${Object.keys(g.cards).map(id=>cardMarkup(id)).join('')}`,name);}
 else if(name==='shop'){open('보급 상점',`<div class="wallet-line">${icon('gem')} 보석 <b>${g.gems}</b><span>게임 안의 보석만 사용</span></div>${shopReceipt?`<div class="shop-receipt" role="status">${art(9)}<b>${shopReceipt}</b></div>`:''}<article class="shop-feature">${art(9)}<div><span class="rarity">4시간마다 무료</span><h2>작은 보급 상자</h2><p>카드 3장 · 연구 15</p></div><button data-buy="free" ${g.elapsed<g.shop.freeAt?'disabled':''}>${g.elapsed<g.shop.freeAt?duration((g.shop.freeAt-g.elapsed)*1000):'무료 받기'}</button></article><h2 class="section-title">성장 보급</h2><div class="shop-grid"><article>${art(9)}<h3>든든한 보급 상자</h3><p>모든 카드 각 2장<br>총 ${2*Object.keys(g.cards).length}장 + 연구 60</p><button data-buy="chest" ${g.gems<35?'disabled':''}>${icon('gem')} 35</button></article><article>${art(17)}<h3>연구 주머니</h3><p>연구 포인트 80<br>카드 연구에 사용</p><button data-buy="research" ${g.gems<25?'disabled':''}>${icon('gem')} 25</button></article></div><article class="time-offer">${art(17)}<div><h3>5분 시간 단축</h3><p>생산·지정 작업 즉시 진행</p></div><button data-buy="time" ${g.gems<20?'disabled':''}>${icon('gem')} 20</button></article><h2 class="section-title">필요한 카드 선택</h2><p class="panel-intro">카드가 모자라면 보석으로 사고, 카드와 연구 포인트가 모이면 여기서 바로 연구해요. 가게의 골드 강화는 지도에서 해요.</p>${Object.keys(g.cards).map(id=>cardMarkup(id,true)).join('')}<button class="dialog-button" data-panel="cards">모은 카드로 연구하기</button>`,name);}
 else if(name==='wheel'){open('행운 룰렛',`<p class="wheel-caption">간식 동굴의 작은 행운</p>${wheelMarkup()}<div id="wheel-result" role="status" class="wheel-result">${wheelSpinning?'두근두근…':wheelResult?'획득 · '+wheelResult.label:'오늘의 보상을 돌려 보세요'}</div><button class="dialog-button spin-main" id="spin-free" ${g.wheel.free||wheelSpinning?'disabled':''}>${g.wheel.free?'무료 회전 완료':'무료로 돌리기'}</button><button class="dialog-button" id="spin-extra" ${wheelSpinning||g.wheel.extra>=5||g.elapsed<g.wheel.nextAt?'disabled':''}>${g.wheel.extra>=5?'추가 회전 5회 완료':g.elapsed<g.wheel.nextAt?duration((g.wheel.nextAt-g.elapsed)*1000)+' 후 추가 회전':'추가 회전 · '+g.wheel.extra+'/5'}</button><p class="wheel-note">8칸의 확률은 각각 12.5%예요. 시간 보상은 즉시 적용돼요. 친구 정원이 가득 차면 연구 40으로 바뀌어요.</p><p class="wheel-note">매일 무료 1회 · 추가 회전은 2시간 간격, 하루 최대 5회예요. 자정(한국시간)에 다시 시작해요.</p>`,name);}
 else if(name==='events'){open('오늘의 업무',`<p class="panel-intro">매일 자정(한국시간)에 새 업무가 시작돼요.</p>${TASKS.map(t=>{const amount=g.daily[t.id]||0,claimed=g.daily.claims.includes(t.id);return `<article class="daily-card" data-task="${t.id}"><div><h2>${t.name}</h2><p>${Math.min(amount,t.goal)}/${t.goal} · 보석 ${t.gems} + 연구 ${t.elixir}</p><div class="material-bar"><i style="width:${Math.min(100,amount/t.goal*100)}%"></i></div></div><button data-daily="${t.id}" ${claimed||amount<t.goal?'disabled':''}>${claimed?'받음':'받기'}</button></article>`;}).join('')}`,name);}
 else if(name==='crew'){open('친구 정원',crewPanel(),name);}
 else if(name==='supply'){open('센터 보급',`<div class="supply-art">${art(12)}</div><p id="supply-status">${deliveryStatus()}</p><p>무료 친구 상자는 바닥 한 칸에 도착해요. 열어서 친구가 나올 때만 친구 수가 늘어요. 빈 바닥이 없으면 남은 배송 시간이 멈추고, 칸이 비면 이어져요. 별사탕 폭죽은 같은 레벨 친구가 5분 동안 할 일을 즉시 처리해요. 시설에 쓰려면 먼저 친구가 옆에서 그 시설을 캐고 있어야 해요. 지도에서 같은 레벨 폭죽 둘을 겹치면 한 단계 올라요. 빈 바닥으로 끌면 폭죽을 옮길 수 있어요.</p><p>개방문을 열면 기본 찻집·대포·소환 위치가 다음 공간으로 함께 이동해요. 보급 골드는 기본 찻집과 자동화 시설 수입에 비례해요.</p><button class="dialog-button" id="open-barrel" ${g.barrel?'':'disabled'}>도착한 보급 열기</button><button class="dialog-button" id="open-worker-parcel" ${g.workerBarrels?.length?'':'hidden'}>친구 보급 열기</button>`,name);}
 else if(name==='help'){showGuide(0);}
 else if(name==='chat'){open('친구들과 채팅','<p class="panel-intro">간식 동굴을 탐험하는 친구들과 이야기를 나눠요.</p><div id="chat-list" class="chat-list" aria-live="polite"></div><form id="chat-form" method="post"><label class="sr-only" for="chat-input">메시지</label><input id="chat-input" name="message" maxlength="200" placeholder="메시지 입력" autocomplete="off" required><button type="submit">보내기</button></form><p id="chat-error" role="status" class="panel-intro"></p>',name);markChatRead();renderChat();loadChat();}
 else if(name==='rankings'){open('동굴 탐험 랭킹','<p class="panel-intro">도달 구역 → 누적 채굴 → 합성 횟수 순이에요.</p><div id="ranking-list" aria-live="polite">불러오는 중…</div>',name);loadRankings();}}
async function startSpin(extra){if(wheelSpinning)return;wheelSpinning=true;wheelResult=null;wheelContext={level:E.hireLevel(g)+1,full:E.occupiedSlots(g)>=E.capacity(g)};panel('wheel');try{const result=await client.confirm('wheel',{extra});if(modalName==='wheel'&&dialog.open){const rotor=$('#wheel-rotor'),start=wheelRotation;wheelRotation=start+1800+((360-result.index*45-start%360)%360);if(rotor){if(!reduced){rotor.style.transition='transform 3.8s cubic-bezier(.12,.7,.12,1)';requestAnimationFrame(()=>rotor.style.transform=`rotate(${wheelRotation}deg)`);await new Promise(resolve=>setTimeout(resolve,3900));}else rotor.style.transform=`rotate(${wheelRotation}deg)`;}}wheelResult=result;if(result.id)launch(result.id);if(modalName!=='wheel')notice('룰렛 획득 · '+result.label);}catch(e){notice(e.message);}finally{wheelSpinning=false;if(modalName==='wheel'&&dialog.open)panel('wheel');}}
$('#scene-toggle').onclick=()=>panel('menu');$('#close-dialog').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{
 modalName=null;
});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.panel){panel(b.dataset.panel);return;}
 if(b.hasAttribute('data-guide-page')){showGuide(Number(b.dataset.guidePage));$('#dialog-content [aria-pressed="true"]')?.focus({preventScroll:true});return;}
 if(b.dataset.details){openFacility(g.facilities.find(f=>f.id===b.dataset.details));return;}
 if(b.dataset.studyCard){panel('cards');const card=document.querySelector('[data-card="'+b.dataset.studyCard+'"]');card?.scrollIntoView({block:'start'});return;}
 if(b.id==='stay-here'){dialog.close();return;}
 if(b.dataset.leaveStage){if(Number(b.dataset.leaveStage)===g.stage&&g.exit.done)action(()=>E.nextMine(g));dialog.close();return;}
 if(b.dataset.crewMerge){
 const pair=g.friends.filter(w=>w.level===Number(b.dataset.crewMerge)).sort((a,b)=>Number(!!a.target)-Number(!!b.target));
 if(pair.length>=2&&action(()=>E.merge(g,pair[0].id,pair.at(-1).id))){dialog.close();notice('친구를 합쳐 한 칸이 비었어요.');}return;
 }if(b.dataset.upgrade){action(()=>E.upgrade(g,b.dataset.upgrade,Number(b.dataset.count)));return;}if(selectedCharge&&(b.dataset.gate||b.dataset.repair)){
 const id=b.dataset.gate||b.dataset.repair;
 const target=E.targets(g).find(t=>t.id===id);
 if(target){triggerCharge(target);return;}
 }if(b.dataset.gate){const t=[...g.checkpoints,g.exit].find(t=>t.id===b.dataset.gate);if(t.id==='exit'&&t.done){showDeparture();}else orderTarget(t);return;}if(b.dataset.repair){const f=g.facilities.find(f=>f.id===b.dataset.repair);if(f.repaired){action(()=>E.activate(g,f.id),'시설을 가동했어요!');}else if(selected){assignTo(g.friends.find(w=>w.id===selected),f);}else orderTarget(f);return;}if(b.dataset.info){const f=g.facilities.find(f=>f.id===b.dataset.info);if(f.ready)collectFacility(f);else openFacility(f);return;}if(b.dataset.research){const name=modalName,offset=$('#dialog-content').scrollTop;if(action(()=>E.research(g,b.dataset.research))){panel(name);$('#dialog-content').scrollTop=offset;}return;}if(b.dataset.automate){const r=action(()=>E.automate(g,b.dataset.automate),'자동 수령을 켰어요.');if(r)dialog.close();return;}if(b.dataset.collect){collectFacility(g.facilities.find(f=>f.id===b.dataset.collect));dialog.close();return;}if(b.dataset.buy){serverAction(b,'buy',{offer:b.dataset.buy},r=>{shopReceipt=r.text;if(modalName==='shop'&&dialog.open){const offset=$('#dialog-content').scrollTop;panel('shop');$('#dialog-content').scrollTop=offset;}notice(r.text);});return;}if(b.id==='open-worker-parcel'){openWorkerParcel();return;}if(b.id==='open-barrel'){openMystery();return;}if(b.id==='spin-free'||b.id==='spin-extra'){startSpin(b.id==='spin-extra');return;}});
requestAnimationFrame(draw);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&g){settle();updateHUD(true);client.sync();loadChat();}});
const lootLayer=$('#board-items');
function positionLoot(){
 const scale=world.clientWidth/W;
 for(const node of lootLayer.children){
  const at=coord(Number(node.dataset.col),Number(node.dataset.row));
  node.style.left=at.x*scale+'px';node.style.top=(at.y-camera)*scale+'px';
  node.style.width=STEP*.94*scale+'px';node.style.height=STEP*.96*scale+'px';
 }
}
function updateBoardItems(){
 const items=E.boardItems(g).filter(o=>Number.isInteger(o.x));
 if(!items.some(item=>item.id===selectedCharge))selectedCharge=null;
 const first=itemStage!==g.stage;itemStage=g.stage;
 const old=new Map(Array.from(lootLayer.children,node=>[node.dataset.item,node]));
 for(const item of items){
  let node=old.get(item.id);
  const charge=g.charges?.some(c=>c.id===item.id),kind=charge?'charge':g.barrel?.id===item.id?'supply':'worker';
  const fresh=!node;
  if(fresh){
   node=document.createElement('button');node.className='board-loot '+kind;node.dataset.item=item.id;node.dataset.kind=kind;
   node.innerHTML='<span class="loot-body"><i aria-hidden="true"></i><b></b></span>';
   lootLayer.append(node);
  }
  old.delete(item.id);
  const label=kind==='supply'?'보급':kind==='worker'?'친구 '+item.level:'Lv.'+item.level;
  const name=kind==='charge'?'별사탕 폭죽 '+label:label+' 상자 열기';
  if(node.getAttribute('aria-label')!==name){node.setAttribute('aria-label',name);node.querySelector('b').textContent=label;}
  if(charge)node.setAttribute('aria-pressed',String(selectedCharge===item.id));
  if(node.dataset.level&&node.dataset.level!==String(item.level)&&charge&&!reduced){
   node.firstChild.animate([{transform:'scale(.85)'},{transform:'scale(1.34)',filter:'brightness(1.45)'},{transform:'scale(1)'}],{duration:450});
  }
  node.dataset.level=String(item.level);node.dataset.col=item.x;node.dataset.row=item.y;
  if(fresh&&!first&&!reduced){
   const from=cannonPoint(),to=coord(item.x,item.y),scale=world.clientWidth/W,dx=(from.x-to.x)*scale,dy=(from.y-to.y)*scale;
   node.firstChild.animate([{transform:'translate('+dx+'px,'+dy+'px) scale(.6)'},{transform:'translate('+dx*.5+'px,'+(dy*.5-45)+'px) scale(1.05)'},{transform:'none'}],{duration:400});
   parcelFlight={at:performance.now()};
  }
 }
 for(const node of old.values())node.remove();
 positionLoot();
}
function triggerCharge(target){
 const ok=action(()=>client.mutate('charge',{charge:selectedCharge,target:target.id}));
 if(ok){selectedCharge=null;updateBoardItems();const p=target.port?visual(target):coord(target.x,target.y);particles.push({x:p.x,y:p.y-40,life:1,text:'✦ −'+fmt(ok.result.damage)});}
}
function chooseCharge(id){
 if(selectedCharge&&id!==selectedCharge){
  if(action(()=>client.mutate('mergeCharges',{a:selectedCharge,b:id})))selectedCharge=null;
 }else selectedCharge=selectedCharge===id?null:id;
 updateBoardItems();
}
lootLayer.addEventListener('pointerdown',e=>{
 const node=e.target.closest('[data-kind="charge"]');
 if(!node||chargeGesture||!e.isPrimary||e.button!==0)return;
 chargeGesture={id:node.dataset.item,node,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
 node.setPointerCapture(e.pointerId);
});
function chargeHit(e){
 const p=point(e);
 const nodes=document.elementsFromPoint(e.clientX,e.clientY);
 const other=nodes.map(n=>n.closest('[data-kind="charge"]')).find(n=>n&&n.dataset.item!==chargeGesture?.id);
 if(other)return {other:other.dataset.item};
 if(!nodes.includes(world))return {};
 const overlay=nodes.map(n=>n.closest('[data-gate],[data-repair]')).find(Boolean);
 const target=overlay?E.targets(g).find(t=>t.id===(overlay.dataset.gate||overlay.dataset.repair)):targetAt(p)||facilityAt(p);
 return {target,p};
}
lootLayer.addEventListener('pointermove',e=>{
 const gesture=chargeGesture;if(gesture?.pointer!==e.pointerId)return;
 const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
 if(!gesture.moved&&Math.hypot(dx,dy)<4)return;
 gesture.moved=true;gesture.node.classList.add('lifted');
 gesture.node.firstChild.style.translate=dx+'px '+dy+'px';
 const {target}=chargeHit(e);
 if(target?.id!==gesture.hover){gesture.hover=target?.id;gesture.aim=target&&E.chargePreview(g,gesture.id,target.id);}
});
function endChargeGesture(){
 if(chargeGesture){chargeGesture.node.classList.remove('lifted');chargeGesture.node.firstChild.style.translate='';chargeGesture=null;}
}
lootLayer.addEventListener('pointerup',e=>{
 const gesture=chargeGesture;if(gesture?.pointer!==e.pointerId)return;
 const hit=gesture.moved?chargeHit(e):null;endChargeGesture();
 if(!hit){chooseCharge(gesture.id);return;}
 selectedCharge=gesture.id;
 if(hit.other){chooseCharge(hit.other);return;}
 if(hit.target&&E.chargePreview(g,gesture.id,hit.target.id)){triggerCharge(hit.target);return;}
 if(hit.p){
  const origin=coord(0,0),x=Math.round((hit.p.x-origin.x)/STEP),y=Math.round((hit.p.y-origin.y)/STEP);
  const charge=g.charges.find(c=>c.id===gesture.id);
  if(charge&&E.lootTiles(g,charge).some(([cx,cy])=>cx===x&&cy===y))action(()=>client.mutate('moveCharge',{charge:gesture.id,x,y}));
 }
 selectedCharge=null;updateBoardItems();
});
for(const event of ['pointercancel','lostpointercapture'])lootLayer.addEventListener(event,e=>{if(chargeGesture?.pointer===e.pointerId)endChargeGesture();});
lootLayer.addEventListener('click',e=>{
 const button=e.target.closest('[data-item]');if(!button)return;
 if(button.dataset.kind==='charge'){if(!e.detail)chooseCharge(button.dataset.item);}
 else if(button.dataset.kind==='worker')openWorkerParcel(button.dataset.item);
 else openMystery();
});
function openWorkerParcel(id){
 const barrel=id?g.workerBarrels?.find(b=>b.id===id):g.workerBarrels?.[0];if(!barrel)return;
 if(E.occupiedSlots(g)>=E.capacity(g)){panel('crew');return;}
 const value=action(()=>client.mutate('unpack',{barrel:barrel.id}));
 if(value){if(dialog.open)dialog.close();launch(value.result.id);}
}
async function openMystery(){
 if(!g?.barrel||pendingBarrel)return;
 pendingBarrel=g.barrel.id;refreshPanel(true);
 try{
  const reward=await client.confirm('barrel',{barrel:pendingBarrel});
  if((modalName==='supply'||modalName==='crew')&&dialog.open)dialog.close();notice(reward.text);
  if(reward.type==='worker'&&reward.id)launch(reward.id);
 }catch(err){notice(err.message);}
 finally{pendingBarrel=null;refreshPanel(true);}
}
async function serverAction(button,type,payload,success){if(button&&serverButtons.has(button))return null;if(button){serverButtons.add(button);button.disabled=true;}try{const result=await client.confirm(type,payload);success?.(result);return result;}catch(e){notice(e.message);return null;}finally{if(button)serverButtons.delete(button);if(button?.isConnected)button.disabled=false;refreshPanel(true);}}
function resetChat(owner){
 chatOwner=owner||null;chatRequest=null;chatAfter=null;chatRead=null;chatMessages=[];
 if(owner)try{const saved=localStorage.getItem('cave-chat-read:'+owner);if(saved!==null)chatRead=Number(saved)||0;}catch{}
 clearTimeout(chatAlertTimer);$('#chat-alert').hidden=true;showChatCount(0);
}
function showChatCount(count){
 const badge=$('#chat-badge');badge.textContent=count>=60?'60+':String(count);badge.hidden=!count;
 $('#chat-button').setAttribute('aria-label',count?'친구들과 채팅 · 안 읽은 메시지 '+badge.textContent+'개':'친구들과 채팅');
}
function markChatRead(){
 if(chatAfter!==null){
  chatRead=Math.max(chatRead||0,chatAfter);
  try{localStorage.setItem('cave-chat-read:'+chatOwner,String(chatRead));}catch{}
 }
 showChatCount(0);$('#chat-alert').hidden=true;
}
async function loadChat(){
 if(!chatOwner||chatRequest||document.hidden)return;
 const owner=chatOwner,request={};chatRequest=request;
 try{
  const initial=chatAfter===null,after=chatAfter||0,openChat=dialog.open&&modalName==='chat';
  const data=await client.request(openChat||initial?'/chat':'/chat?after='+after);
  if(chatRequest!==request||owner!==chatOwner)return;
  const batch=data.messages;
  if(initial||openChat){
   const pendingOwn=chatMessages.filter(m=>m.player_id===owner&&Number(m.id)>Math.max(after,...batch.map(m=>Number(m.id))));
   chatMessages=batch.concat(pendingOwn);
  }else if(batch.length){
   const messages=new Map(chatMessages.map(m=>[Number(m.id),m]));
   for(const m of batch)messages.set(Number(m.id),m);
   chatMessages=[...messages.values()].sort((a,b)=>a.id-b.id).slice(-60);
  }
  chatAfter=Math.max(after,...batch.map(m=>Number(m.id)));
  if(chatRead===null)markChatRead();
  if(!document.hidden&&modalName==='chat'&&dialog.open){markChatRead();renderChat();return;}
  const unread=chatMessages.filter(m=>m.player_id!==owner&&Number(m.id)>chatRead);
  showChatCount(unread.length);
  const newest=unread.at(-1);
  if(!initial&&!document.hidden&&newest&&Number(newest.id)>after){
   const alert=$('#chat-alert');alert.textContent=newest.nickname+' · '+newest.body;alert.hidden=false;
   clearTimeout(chatAlertTimer);chatAlertTimer=setTimeout(()=>alert.hidden=true,3600);
  }
 }catch(e){if(owner===chatOwner&&$('#chat-error'))$('#chat-error').textContent=e.message;}
 finally{if(chatRequest===request)chatRequest=null;}
}
function renderChat(){const list=$('#chat-list');if(!list)return;const nearBottom=list.scrollHeight-list.scrollTop-list.clientHeight<60;list.innerHTML=chatMessages.length?chatMessages.map(m=>`<article class="chat-message ${m.player_id===player.id?'mine':''}"><header><b>${esc(m.nickname)}</b><small>${Number(m.stage)}구역 · ${new Date(Number(m.created_at)).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'})}</small>${m.player_id!==player.id?`<button data-report="${Number(m.id)}" aria-label="${esc(m.nickname)}의 메시지 신고">신고</button>`:''}</header><p>${esc(m.body)}</p></article>`).join(''):'<p class="empty-state">아직 대화가 없어요.<br>첫 인사를 남겨 보세요.</p>';if(nearBottom)list.scrollTop=list.scrollHeight;}
async function loadRankings(){try{const data=await client.request('/rankings');if(modalName!=='rankings'||!$('#ranking-list'))return;const top=data.rows.filter(r=>Number(r.rank)<=3),others=data.rows.filter(r=>Number(r.rank)>3),mine=data.rows.find(r=>r.id===data.self);$('#ranking-list').innerHTML=`<div class="podium">${[2,1,3].map(rank=>{const r=top.find(r=>Number(r.rank)===rank);return r?`<article class="place place-${rank} ${r.id===data.self?'self':''}"><span class="trophy">${icon('rank')}</span><b title="${esc(r.nickname)}">${esc(r.nickname)}</b><small>${r.stage}구역</small><strong>${rank}</strong></article>`:'<span></span>';}).join('')}</div>${mine?`<p class="my-rank">내 순위 <b>${mine.rank}위</b> · 누적 채굴 ${fmt(mine.rocks)}개</p>`:''}<div class="rank-rows">${others.map(r=>`<article class="rank-row ${r.id===data.self?'self':''}"><strong>${r.rank}</strong><div><b>${esc(r.nickname)}</b><small>채굴 ${fmt(r.rocks)} · 합성 ${fmt(r.merges)}</small></div><span>${r.stage}구역</span></article>`).join('')}</div><p class="panel-intro">저장된 진행으로 순위를 매겨요.</p>`;}catch(e){if($('#ranking-list'))$('#ranking-list').textContent=e.message;}}
document.addEventListener('submit',async e=>{if(e.target.id!=='chat-form')return;e.preventDefault();const input=$('#chat-input'),message=input.value.trim(),button=e.target.querySelector('button');if(!message)return;button.disabled=true;const requestId=crypto.randomUUID(),owner=chatOwner;try{const data=await client.request('/chat',{method:'POST',body:{message,requestId}});if(owner!==chatOwner)return;input.value='';if(!chatMessages.some(m=>String(m.id)===String(data.message.id)))chatMessages.push(data.message);renderChat();if($('#chat-error'))$('#chat-error').textContent='';}catch(error){if($('#chat-error'))$('#chat-error').textContent=error.message;}finally{button.disabled=false;}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.id==='sync-game'){b.disabled=true;client.flush().then(()=>client.sync()).then(()=>notice('서버 저장을 확인했어요.')).catch(error=>notice(error.message)).finally(()=>{b.disabled=false;});}else if(b.id==='logout'){b.disabled=true;client.logout().catch(error=>notice(error.message)).finally(()=>{b.disabled=false;});}else if(b.dataset.daily){serverAction(b,'daily',{id:b.dataset.daily},r=>{panel('events');notice(r.text);});}else if(b.dataset.report){b.disabled=true;client.request('/report',{method:'POST',body:{id:Number(b.dataset.report)}}).then(()=>{chatMessages=chatMessages.filter(m=>String(m.id)!==b.dataset.report);renderChat();notice('메시지를 신고했어요.');}).catch(error=>{notice(error.message);b.disabled=false;});}});
$('#chat-button').innerHTML=icon('chat')+'<span id="chat-badge" hidden></span>';
for(const tab of document.querySelectorAll('[data-auth-mode]'))tab.onclick=()=>{authMode=tab.dataset.authMode;for(const node of document.querySelectorAll('[data-auth-mode]'))node.setAttribute('aria-pressed',String(node===tab));$('#auth-submit').textContent=authMode==='register'?'모험 시작하기':'이어서 플레이';$('#pin').autocomplete=authMode==='register'?'new-password':'current-password';$('#auth-error').hidden=true;};
$('#auth-submit').disabled=false;
$('#retry-connection').onclick=()=>client.connect();
$('#toggle-pin').onclick=()=>{const input=$('#pin'),visible=input.type==='password';input.type=visible?'text':'password';$('#toggle-pin').textContent=visible?'숨김':'보기';$('#toggle-pin').setAttribute('aria-label',visible?'PIN 숨김':'PIN 표시');};
$('#auth-form').onsubmit=async e=>{e.preventDefault();const b=$('#auth-submit');b.disabled=true;$('#auth-error').hidden=true;try{const data=await client.authenticate(authMode,$('#nickname').value,$('#pin').value);$('#pin').value='';if(data.offline?.seconds>90)notice(`자리비움 중 골드 +${fmt(data.offline.gold)} · 바위 ${data.offline.rocks}개 채굴`);}catch(error){$('#auth-error').textContent=error.message;$('#auth-error').hidden=false;}finally{b.disabled=false;}};
const poll=setInterval(()=>{if(!document.hidden&&g){client.sync();if(modalName==='rankings')loadRankings();}},10000);setInterval(()=>{if(!document.hidden&&g)loadChat();},4000);window.addEventListener('online',()=>client.sync());window.addEventListener('pagehide',()=>client.persist());
watchRelease({version:Number(new URL(import.meta.url).searchParams.get('v')),save:()=>client.flush()});
if(client.token){$('#auth-form').hidden=true;$('#auth-loading').hidden=false;}await client.connect();

function refreshPanel(force=false){if(!dialog.open||!g)return;const time=Date.now();if(!force&&time-modalRefreshAt<900)return;modalRefreshAt=time;
 if(modalName==='departure'){const amount=$('#departure-balance');if(amount)amount.textContent=Math.floor(g.gold).toLocaleString('ko-KR');return;}
 if(modalName==='cards'||modalName==='shop'){const wallet=$('.wallet-line>b');if(wallet)wallet.textContent=modalName==='cards'?fmt(g.elixir):g.gems;for(const node of document.querySelectorAll('.research-card[data-card]')){const id=node.dataset.card,c=g.cards[id];
 if(Number(node.dataset.cardLevel)!==c.level){node.outerHTML=cardMarkup(id,modalName==='shop');continue;}
 const cost=E.researchCost(g,id),material=node.querySelector('.card-material');if(material){material.children[0].innerHTML=`보유 <b>${c.count}</b> / 다음 레벨 <b>${cost.cards}장</b>`;material.children[1].textContent=c.count>=cost.cards?'카드 준비 완료':cost.cards-c.count+'장 더 필요';}const bar=node.querySelector('.material-bar>i');if(bar)bar.style.width=Math.min(100,c.count/cost.cards*100)+'%';const b=node.querySelector('[data-research]');if(b){b.disabled=c.level>=E.maxCardLevel(id)||c.count<cost.cards||g.elixir<cost.elixir;b.innerHTML=icon('elixir')+' '+(c.level>=E.maxCardLevel(id)?'최대 레벨':'연구 '+fmt(cost.elixir))+(c.level<20&&g.elixir<cost.elixir?' · 연구 부족':'');}}
  for(const b of document.querySelectorAll('[data-buy]')){if(serverButtons.has(b))continue;const id=b.dataset.buy,price=id==='chest'?35:id==='research'?25:id==='time'?20:12;if(id==='free'){b.disabled=g.elapsed<g.shop.freeAt;b.textContent=b.disabled?duration((g.shop.freeAt-g.elapsed)*1000):'무료 받기';}else b.disabled=g.gems<price||(id.startsWith('card-')&&g.cards[id.slice(5)].level>=E.maxCardLevel(id.slice(5)));}
 }else if(modalName.startsWith('facility:')){const f=g.facilities.find(f=>f.id===modalName.slice(9)),slot=$('#facility-collect'),cycle=$('#facility-cycle');if(f&&slot){if(f.ready&&!slot.querySelector('[data-collect]'))slot.innerHTML=`<button class="dialog-button" data-collect="${f.id}">완료된 골드 ${fmt(f.ready)} 받기</button>`;if(cycle)cycle.textContent=!f.active?'가게와 맞닿은 칸에 친구를 놓고 가게를 캐 주세요.':f.ready?'생산 완료! 골드를 받으면 다음 생산이 시작돼요.':`${f.auto?'자동 수령 중 · ':''}다음 생산까지 ${duration((E.facilityCycle(g,f)-f.progress)*1000)}`;}}else if(modalName==='events'){for(const node of document.querySelectorAll('[data-task]')){const t=TASKS.find(t=>t.id===node.dataset.task),amount=g.daily[t.id]||0,claimed=g.daily.claims.includes(t.id);node.querySelector('p').textContent=`${Math.min(amount,t.goal)}/${t.goal} · 보석 ${t.gems} + 연구 ${t.elixir}`;node.querySelector('.material-bar>i').style.width=Math.min(100,amount/t.goal*100)+'%';const b=node.querySelector('button');if(serverButtons.has(b))continue;b.disabled=claimed||amount<t.goal;b.textContent=claimed?'받음':'받기';}}
 else if(modalName==='wheel'&&!wheelSpinning){const free=$('#spin-free'),extra=$('#spin-extra');if(free){free.disabled=g.wheel.free;free.textContent=g.wheel.free?'무료 회전 완료':'무료로 돌리기';}if(extra){extra.disabled=g.wheel.extra>=5||g.elapsed<g.wheel.nextAt;extra.textContent=g.wheel.extra>=5?'추가 회전 5회 완료':g.elapsed<g.wheel.nextAt?duration((g.wheel.nextAt-g.elapsed)*1000)+' 후 추가 회전':'추가 회전 · '+g.wheel.extra+'/5';}}
 else if(modalName==='crew'){
  const key=[...g.friends.map(w=>w.id+':'+w.level),g.workerBarrels?.length,E.capacity(g),g.barrel?.id].join('/');
  const body=$('#dialog-content');if(body.dataset.crew!==key){body.innerHTML=crewPanel();body.dataset.crew=key;}
  const status=$('#supply-status');if(status)status.innerHTML=deliveryStatus();
 }else if(modalName==='supply'){const status=$('#supply-status');if(status)status.innerHTML=`${deliveryStatus()}`;const b=$('#open-barrel');if(b)b.disabled=!g.barrel||!!pendingBarrel;const wb=$('#open-worker-parcel');if(wb){wb.hidden=!g.workerBarrels?.length;wb.textContent='친구 보급 열기 · '+(g.workerBarrels?.length||0)+'개';}}
}
