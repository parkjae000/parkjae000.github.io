import {HEALTH_KINDS,battleHealthMarkup,buildBattleEvents,paintBattle} from './battle-scene.js?v=20261122-expedition-2';
const RELEASE='20261122-expedition-2';
const API_BASE=/^(www\.)?jparkapps\.xyz$|^parkjae000\.github\.io$/.test(location.hostname)?'https://pgupfypoxhjawtonnzzk.supabase.co/functions/v1/kurly-apocalypse':location.hostname.endsWith('.supabase.co')?location.origin+'/functions/v1/kurly-apocalypse':'';
const TOKEN_KEY='ka_game_session_v1';
const $=id=>document.getElementById(id);
const number=v=>new Intl.NumberFormat('ko-KR').format(Math.round(Number(v)||0));
const h=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const timeLeft=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return s>=3600?`${Math.floor(s/3600)}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`:`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const ago=ms=>{const t=new Date(ms);return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`};
let introTimers=[],warPlaybackSpeed=1,miningDragging=null,spawnedWorkerId=null,warPanelOpen=false,warScrollLeft=0;
let state=null,selectedTab='center',selectedWorker='w1',authMode='register',rankMode='total',warMode='raid',warTarget='',warCount=12,showOnboard=false,onboardStep=0,animation=null,animating=false, lastSnapshot=0,serverOffset=0,toastTimer=null,lastPageRendered='';
const SHOP_DETAILS={auto:{icon:'⚙️',image:'worker-cute',description:'아래쪽 자원부터 이동하며 자동 채굴합니다.'},bot:{icon:'🛠',image:'panel-workshop',description:'스탭 2 합류 · 연구 2개를 동시에 진행합니다.'},boost:{icon:'⚡',image:'ore-money',description:'10분 동안 채굴 속도 2배'},forklift:{icon:'🔒',image:'forklift-cute',description:'추후 업데이트 예정'}};
const UPGRADES=[{key:'center',name:'센터 레벨',icon:'🏢',desc:'센터 체력 및 다른 연구 상한 증가'},{key:'mine',name:'채굴 효율',icon:'⛏️',desc:'일용직 채굴 속도 +8%'},{key:'troopAtk',name:'사원 공격력',icon:'⚔️',desc:'사원 공격 피해 +8%'},{key:'troopHp',name:'사원 체력',icon:'❤️',desc:'사원 최대 체력 +10%'},{key:'troopSpeed',name:'사원 공격속도',icon:'⚡',desc:'사원 공격속도 +3%'},{key:'capacity',name:'사원 수용 한도',icon:'👥',desc:'최대 사원 +8명'},{key:'wall',name:'방벽 내구도',icon:'🛡️',desc:'방벽 체력 +12%'},{key:'turretDmg',name:'포탑 공격력',icon:'🎯',desc:'포탑 공격 피해 +10%'},{key:'turretSpeed',name:'포탑 공격속도',icon:'💥',desc:'포탑 공격속도 +4%'}];
const CENTER_COST=[0,0,300,800,2000,5000,12000,27000,60000,135000,300000];
const CENTER_TIME=[0,0,30,180,720,1800,3600,7200,14400,28800,57600];
const BASE_COST=[0,0,140,290,590,1210,2470,5070,10390,21300,43670];
const BASE_TIME=[0,0,20,50,120,300,720,1800,4500,10800,25200];
const FACTOR={mine:1.2,troopAtk:1,troopHp:1,troopSpeed:1.2,capacity:1.15,wall:1,turretDmg:1.25,turretSpeed:1.4};
const storyCaptions=[{"speaker": "복슬이", "head": "“센터가 또 커졌네. 우리가 밤낮없이 옮긴 박스 덕분이지!”", "reply": "동료 사원", "body": "“새 창고에 새 설비까지… 그럼 이번엔 월급도 오르겠지?”"}, {"speaker": "동료 사원", "head": "“또 그대로야. 늘어난 이익은 윗사람들이 전부 챙겼대.”", "reply": "복슬이", "body": "“센터는 이렇게 커졌는데, 우리 월급만 그대로라고? 더는 못 참아!”"}, {"speaker": "복슬이", "head": "“이 센터, 우리가 접수한다! 오늘부터 반란이야!”", "reply": "사원들", "body": "“좋아! 남 좋은 일만 시키던 센터는 이제 끝이야!”"}, {"speaker": "사원들", "head": "“센터 점령 완료! 복슬이, 이제 네가 센터장이야!”", "reply": "복슬이 센터장", "body": "“좋아! 일용직은 박스를 캐고, 사원들은 전투를 준비해!”"}, {"speaker": "복슬이 센터장", "head": "“저쪽 창고에도 우리가 벌어 준 박스가 산더미네?”", "reply": "사원들", "body": "“다른 센터까지 전부 약탈하자! 진격하라!”"}];
async function api(endpoint,method='GET',body){const r=await fetch(API_BASE+endpoint,{method,credentials:API_BASE?'omit':'same-origin',headers:{...(body?{'Content-Type':'application/json'}:{}),...(localStorage.getItem(TOKEN_KEY)?{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}:{})},body:body?JSON.stringify(body):undefined});const v=await r.json().catch(()=>({error:'서버 응답을 읽지 못했어요.'}));if(!r.ok)throw new Error(v.error||'요청에 실패했어요.');if(v.token)localStorage.setItem(TOKEN_KEY,v.token);if(endpoint==='/api/logout')localStorage.removeItem(TOKEN_KEY);return v;}
function toast(message,error=false){const el=$('toast');el.textContent=message;el.classList.toggle('error',error);el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800);}
async function loadState({silent=false,resumeBattle=true}={}){try{const v=await api('/api/state');state=v;lastSnapshot=Date.now();serverOffset=v.serverTime-Date.now();$('auth').classList.add('hidden');$('app').classList.remove('hidden');if(!v.me.game.storySeen||!v.me.game.tutorialSeen){if(!showOnboard){showOnboard=true;onboardStep=0;showTutorial();}}render();if(resumeBattle&&v.activeBattle&&!animation&&!showOnboard)playBattle(v.activeBattle,true);if(!$('modalOverlay').classList.contains('hidden')&&$('modalContent').querySelector('[data-mail-read]'))openMail();return v;}catch(e){if(/로그인이 필요/.test(e.message)){$('auth').classList.remove('hidden');$('app').classList.add('hidden');}else if(!silent)toast(e.message,true);return null;}}
function serverNow(){return Date.now()+serverOffset;}
async function doAction(type,params={}){
  try{
    const priorWorkers=new Set((state?.me.game.workers||[]).map(w=>w.id));
    const out=await api('/api/action','POST',{...params,type,requestId:crypto.randomUUID()});
    if(out.message&&!out.battle)toast(out.message);
    await loadState({silent:true,resumeBattle:!out.battle});
    if(type==='worker/summon'){
      spawnedWorkerId=state?.me.game.workers.find(w=>!priorWorkers.has(w.id))?.id||null;
      if(selectedTab==='mine')renderMine();
      setTimeout(()=>spawnedWorkerId=null,750);
    }
    if(type==='mine/next-zone')showZoneTransition(state.me.game.mine.zone);
    if(out.battle)playBattle(out.battle);
    return out;
  }catch(e){toast(e.message,true);return null;}
}
function upgradeCost(key,level){return key==='center'?{boxes:CENTER_COST[level],seconds:CENTER_TIME[level]}:{boxes:Math.ceil(BASE_COST[level]*(FACTOR[key]||1)/10)*10,seconds:BASE_TIME[level]};}
function render(){if(!state)return;const g=state.me.game;const power=state.me.power.total;$('serverLabel').textContent=`${state.me.world} · ${state.me.nickname}`;$('boxCount').textContent=number(g.boxes);$('cashCount').textContent=number(g.cash);$('powerCount').textContent=number(power);const unread=(g.mailbox||[]).filter(m=>!m.readAt).length;document.querySelectorAll('[data-mail-badge]').forEach(e=>{e.textContent=unread>99?'99+':unread;e.hidden=!unread;});
for(const t of ['center','mine','war','shop','server']){$(`tab${t[0].toUpperCase()+t.slice(1)}`).classList.toggle('hidden',t!==selectedTab)}document.querySelectorAll('.navitem').forEach(b=>b.classList.toggle('selected',b.dataset.tab===selectedTab));
$('app').classList.toggle('immersive-mine',selectedTab==='mine');$('app').classList.toggle('immersive-war',selectedTab==='war');
if(selectedTab==='center')renderCenter();else if(selectedTab==='mine')renderMine();else if(selectedTab==='war')renderWar();else if(selectedTab==='shop')renderShop();else renderServer();}
function renderCenter(){const el=$('tabCenter'),g=state.me.game,p=state.me.power,stats=state.unitStats,bots=g.shop.bot?2:1,pending=(g.recruitQueue||[]).reduce((sum,j)=>sum+j.amount,0);
const active=UPGRADES.filter(u=>g.upgrades.some(j=>j.key===u.key));const rows=UPGRADES.map(u=>{const lv=g.levels[u.key],next=lv+1,job=g.upgrades.find(j=>j.key===u.key),mx=lv>=10,locked=u.key!=='center'&&next>g.levels.center+1,c=upgradeCost(u.key,next),room=g.upgrades.length<bots;return `<div class="upgrade-item"><h4>${u.icon} ${u.name}<span class="tag">Lv.${lv}</span></h4><small>${u.desc}</small><div class="value">${job?'진행 중':mx?'최대 레벨':`${number(c.boxes)} 📦 · ${timeLeft(c.seconds*1000)}`}</div><button class="btn ${job?'btn-purple':'btn-outline'}" data-upgrade="${u.key}" ${mx||locked||!!job||!room||g.boxes<(c?.boxes||0)?'disabled':''}>${job?'업그레이드 중':mx?'최대 레벨':locked?'센터 레벨 필요':'강화 시작'}</button></div>`}).join('');
const jobs=Array.from({length:bots},(_,i)=>{const j=g.upgrades[i];return `<div class="slot"><h4>🛠 스탭 ${i+1}</h4>${j?`<small>${h(UPGRADES.find(v=>v.key===j.key)?.name||j.key)} Lv.${j.target}</small><div class="progress" style="margin:9px 0"><div class="bar" data-progress-start="${j.startAt}" data-progress-end="${j.endAt}" style="width:${Math.max(0,Math.min(100,100*(serverNow()-j.startAt)/(j.endAt-j.startAt)))}%"></div></div><strong class="counter" data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</strong>`:`<span class="good">대기 중 · 연구 가능</span>`}</div>`}).join('')+(bots===1?`<div class="slot"><h4>🔒 스탭 2</h4><small>상점에서 희귀 돈 3,600으로 영구 해금</small><button class="btn btn-outline" style="margin-top:8px" data-modal="shop">상점 열기</button></div>`:'');
el.innerHTML=`<div class="page-title"><div><h2>내 센터 <span class="goldtext">Lv.${g.levels.center}</span></h2></div><span class="pill">전투력 ${number(p.total)}</span></div>
<div class="dashboard-columns"><div><div class="card card-center"><div class="card-head"><h3>📦 독립 물류센터</h3><span class="tag good">운영 중</span></div><div class="warehouse-stage illustrated-center"><div class="center-hero-shade"></div><span class="center-hero-title">독립 물류센터 <b>Lv.${g.levels.center}</b></span><span class="stage-caption">방벽 Lv.${g.levels.wall} · 포탑 Lv.${g.levels.turretDmg}</span></div><div class="gridstats" style="margin-top:11px"><div class="statbox"><small>센터 최대 HP</small><strong>${number(Math.ceil(stats.center))}</strong></div><div class="statbox"><small>방벽 HP</small><strong>${number(Math.ceil(stats.wall))}</strong></div><div class="statbox"><small>포탑 공격력</small><strong>${number(stats.turretDamage)}</strong></div></div></div>
<div class="card card-army"><div class="card-head"><h3>👥 사원 증원</h3><span class="pill">${g.troops} / ${stats.cap}명 · 생산 ${pending}명${g.pendingBattle?` · 출정 ${g.pendingBattle.amount}명`:""}</span></div><div class="gridstats"><div class="statbox"><small>공격력</small><strong>${number(stats.damage)}</strong></div><div class="statbox"><small>체력</small><strong>${number(stats.hp)}</strong></div><div class="statbox"><small>공격 속도</small><strong>${stats.interval.toFixed(2)}초</strong></div></div><div class="recruit-queue">${(g.recruitQueue||[]).length?(g.recruitQueue||[]).map((j,i)=>`<div class="recruit-job"><span>👷 ${j.amount}명 생산 ${i?'대기':'진행 중'}</span><b data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</b><div class="recruit-progress"><i data-progress-start="${j.startAt}" data-progress-end="${j.endAt}" style="width:${Math.max(0,Math.min(100,100*(serverNow()-j.startAt)/(j.endAt-j.startAt)))}%"></i></div></div>`).join(''):''}</div><div class="btnrow"><button data-recruit="1" class="btn btn-outline" ${g.boxes<45||g.troops+(g.pendingBattle?.amount||0)+pending>=stats.cap?'disabled':''}>+1명 · 📦45</button><button data-recruit="5" class="btn btn-outline" ${g.boxes<225||g.troops+(g.pendingBattle?.amount||0)+pending+5>stats.cap?'disabled':''}>+5명 · 📦225</button><button data-recruit="10" class="btn btn-outline" ${g.boxes<450||g.troops+(g.pendingBattle?.amount||0)+pending+10>stats.cap?'disabled':''}>+10명 · 📦450</button></div><button class="btn btn-gold recruit-max" data-recruit-max ${g.boxes<45||g.troops+(g.pendingBattle?.amount||0)+pending>=stats.cap||(g.recruitQueue||[]).length>=4?'disabled':''}>최대 생산 <span>${Math.max(0,Math.min(Math.floor(g.boxes/45),stats.cap-g.troops-(g.pendingBattle?.amount||0)-pending))}명</span></button></div></div>
<div><div class="card card-workshop"><div class="card-head"><h3>🛠️ 진행 중인 업그레이드</h3><span class="tag">${g.upgrades.length} / ${bots}건</span></div><div class="slots">${jobs}</div></div><div class="card card-research"><div class="card-head"><h3>📈 업그레이드 · 연구</h3><small class="muted">택배 박스 사용</small></div><div class="upgrade-grid">${rows}</div></div></div></div>`;}
function renderMine(){
  const el=$('tabMine'),g=state.me.game,m=g.mine,workers=g.workers;
  const chosen=workers.find(w=>w.id===selectedWorker)||workers[0];
  if(!workers.find(w=>w.id===selectedWorker))selectedWorker=chosen?.id;
  const gate=m.gate||{hp:3000,max:3000,done:false},gateReady=m.nodes.every(n=>n.done),gateRate=workers.filter(w=>w.target==='gate').reduce((sum,w)=>sum+workerDps(w,g),0);
  const boost=Math.max(0,g.shop.boostUntil-serverNow());
  const tile=(n,idx)=>{
    const active=workers.filter(w=>w.target===idx),done=n.done;
    const damage=active.reduce((sum,w)=>sum+workerDps(w,g),0);
    const remain=damage?timeLeft(n.hp/damage*1000):'';
    return `<button class="mine-tile ${done?'is-cleared':''} ${n.kind==='money'?'has-cash':''} ${active.length?'is-mining':''}"
      data-tile="${idx}" aria-label="${done?'빈 통로':`${n.kind==='box'?'택배 박스':'희귀 돈'} ${n.reward} · 일용직 드래그하여 채굴`}">
      ${!done?`<span class="mine-ore"><img src="assets/${n.kind==='money'?'ore-money':'ore-parcel'}.webp" alt="" draggable="false"></span>
        <span class="mine-ore-count">${number(n.reward)}</span>
        <span class="mine-ore-health"><i style="width:${Math.max(0,100*n.hp/n.max)}%"></i></span>
        ${active.length?`<span class="mine-sparks">✧</span><span class="mine-ore-timer">${remain}</span>`:''}`:''}
    </button>`;
  };
  const workerMarker=(w)=>{return `<button
    data-worker="${h(w.id)}"
    class="mine-worker ${w.id===selectedWorker?'selected':''} ${w.id===spawnedWorkerId?'just-summoned':''} ${w.target!==null?'mining-now':''}"
    style="left:${(w.x+.5)*20}%;top:${(w.y+.5)*100/9}%"
    aria-label="Lv.${w.level} 일용직, 드래그해서 채굴하거나 같은 등급 일용직에 놓아 합성">
    <span class="worker-avatar"><img src="assets/worker-cute.webp" alt="" draggable="false"></span><span class="worker-level">Lv.${w.level}</span>
  </button>`;};
  el.innerHTML=`<div class="mine-map">
     <div class="mine-hud">
       <div class="mine-hud-stat"><b>👷 ${workers.length}/8</b><span>⚒ ${number(state.mineStats.rawDps)} DPS</span><span>📦 ${number(g.boxes)} · 💰 ${number(g.cash)}</span></div>
       <div class="mine-hud-actions">
        <span class="mine-sector">구역 ${m.zone+1}</span><button data-open-mail class="mine-icon mail-button" title="우편함">✉<b data-mail-badge ${!(g.mailbox||[]).some(m=>!m.readAt)?'hidden':''}>${(g.mailbox||[]).filter(m=>!m.readAt).length}</b></button>
        <button data-modal="shop" class="mine-icon" title="상점">🛒</button>
        <button class="mine-icon forklift-locked" title="지게차 사원 · 준비 중" disabled><img src="assets/forklift-cute.webp" alt="지게차 사원 준비 중"><b>🔒</b></button>
       </div>
     </div>
     <div class="mineboard-new" id="mineBoard" aria-label="드래그 기반 택배 채굴 지도">
       <button data-gate class="mine-gate ${gateReady?'unlocked':''} ${gate.done?'broken':''} ${gateRate?'gate-hit':''}" aria-label="창고 문 ${gate.done?'파괴 완료':gateReady?'공격 가능':'자원 채굴 후 해금'}" ${!gateReady||gate.done?'disabled':''}>
       <img src="assets/warehouse-gate${gate.done?'-open':''}.webp" alt="" draggable="false"><span class="gate-title">${gate.done?'돌파 완료':!gateReady?'🔒 창고 문':'창고 문'}</span>
       ${!gate.done?`<span class="gate-hp"><i data-gate-bar style="width:${100*gate.hp/gate.max}%"></i></span><b data-gate-count>${number(gate.hp)} / ${number(gate.max)}</b>${gateRate?`<small data-gate-timer>${timeLeft(gate.hp/gateRate*1000)}</small>`:''}`:''}
       </button>${m.nodes.map(tile).join('')}
       ${Array.from({length:5},(_,x)=>`<button class="mine-tile start-lane ${x===2?'active-entry':'is-cleared'}" data-start="${x}" >${x===2?'<span>🚪</span>':''}</button>`).join('')}
       ${workers.filter(w=>!w.parked).map(workerMarker).join('')}
     </div>
     <div class="mine-bottom">
       <button class="mine-summon" data-summon ${g.boxes<state.mineStats.summonCost||workers.length>=8?'disabled':''}>
        <span>✦ +</span> 일용직 소환 <small>📦 ${number(state.mineStats.summonCost)}</small>
       </button>
       
       ${workers.some(w=>w.parked)?'<span class="parked-note">대기 일용직은 통로가 열리면 배치됩니다.</span>':''}${boost>0?`<span class="mine-boost">⚡ ${timeLeft(boost)}</span>`:''}
     </div>
     ${gate.done?'<div class="zone-clear"><span>구역 돌파!</span><button class="btn btn-gold" data-next-zone>다음 구역으로 이동 ↑</button></div>':''}
   </div>`;
}
function warTargets(){
 if(warMode==='conquest')return (state.territories||[]).map(v=>({...v,disabled:v.mine||v.busy||v.shieldUntil>serverNow(),status:v.mine?'내 정복지':v.busy?'교전 중':v.shieldUntil>serverNow()?'정복 보호 중':v.ownerId?'점령 중':'중립지대'}));
 return state.ranks.filter(r=>r.id!==state.me.id).map(v=>({id:v.id,name:v.nickname,power:v.power,troops:v.troops,lootAvailable:v.lootAvailable||0,shieldUntil:v.shieldUntil,disabled:v.shielded,status:v.shielded?'보호 중':'유저 센터'}));
}
function renderWar(){
 const el=$('tabWar'),g=state.me.game;
 if(!animation){
  el.innerHTML=`<div class="expedition-hub"><div class="expedition-heading"><h2>출정</h2><button data-open-mail class="btn btn-outline mail-button" aria-label="우편함">✉<b data-mail-badge ${!(g.mailbox||[]).some(m=>!m.readAt)?'hidden':''}>${(g.mailbox||[]).filter(m=>!m.readAt).length}</b></button></div><div class="expedition-home"><h3>${h(state.me.nickname)}의 센터</h3><img src="assets/fortress.webp" alt="출정을 준비하는 우리 센터"><span>대기 사원 ${number(g.troops)}명 · 전투력 ${number(state.me.power.total)}</span></div><div class="expedition-modes"><button data-expedition="raid" class="expedition-mode raid"><span>⚔</span><strong>약탈전</strong></button><button data-expedition="conquest" class="expedition-mode conquest"><span>🚩</span><strong>정복전</strong></button><button class="expedition-mode explore" disabled><span>🔒</span><strong>탐사전</strong><small>업데이트 예정</small></button></div>${state.income?.boxesPerHour?`<div class="territory-income"><b>정복지 수입</b><span>시간당 📦 ${number(state.income.boxesPerHour)} · 💰 ${number(state.income.cashPerHour)}</span></div>`:''}</div>`;
  return;
 }
 const current=animation.current||animation.frames[0],inBattle=animation.phase!=='finished';
 el.innerHTML=`<div class="war-scene"><div class="war-topbar">${battleHealthMarkup('a',current,healthMaxima('a'),false)}${battleHealthMarkup('b',current,healthMaxima('b'),false)}</div><div id="warScroller" class="war-scroller open" aria-label="좌우로 움직여 보는 전장"><canvas id="warCanvas" width="3200" height="1120" aria-label="사원의 이동과 전투"></canvas></div><div class="war-camera"><button data-camera="own">내 센터</button><button data-camera="fight">교전</button><button data-camera="enemy">상대</button></div><div class="war-bottombar">${inBattle?`<div class="war-playback"><span id="battleHint">${current.t.toFixed(1)}초 · 아군 ${current.a.n}명 / 상대 ${current.b.n}명</span><button class="war-pill" data-speed="${warPlaybackSpeed===1?2:1}">${warPlaybackSpeed}배속</button><button class="war-pill" data-skip-battle>스킵 »</button>${animation.payload.pending?'<button class="war-pill retreat-button" data-retreat>후퇴</button>':''}</div>`:'<button class="btn btn-gold btn-wide" data-return-battle="war">출정 준비로 복귀</button>'}</div></div>`;
 const scroll=$('warScroller');if(scroll){scroll.scrollLeft=warScrollLeft;scroll.addEventListener('scroll',()=>warScrollLeft=scroll.scrollLeft,{passive:true});}drawBattle(current);
}
async function chooseExpedition(mode){
 if(animation?.payload.pending){toast('진행 중인 출정을 마무리해 주세요.',true);return;}
 warMode=mode;warTarget='';await loadState({silent:true});if(!state.activeBattle)openWarChooser();
}
function openWarChooser(){
 if(!state)return;
 const g=state.me.game,targets=warTargets(),conquest=warMode==='conquest';
 if(!targets.some(v=>v.id===warTarget&&!v.disabled))warTarget=targets.find(v=>!v.disabled)?.id||'';
 const selected=targets.find(v=>v.id===warTarget);warCount=Math.max(1,Math.min(warCount,g.troops||1));
 showModal(`<div class="modal-header"><h2 class="modal-title">${conquest?'🚩 정복전':'⚔ 약탈전'}</h2><button data-close class="modal-close">닫기 ✕</button></div><div class="enemies">${targets.map(v=>`<button class="enemy ${warTarget===v.id?'active':''}" data-war-target="${h(v.id)}" ${v.disabled?'disabled':''}><span>${conquest?'🏭':'🏢'}</span><div class="enemy-info"><div class="rank-title">${h(v.name)}</div><div class="sub">${conquest?`점령: ${h(v.ownerName)}${v.status==='중립지대'?'':' · '+h(v.status)}`:h(v.status)} · 방어 사원 ${number(v.troops)}명</div><div class="enemy-values"><b>전투력 ${number(v.power)}</b>${conquest?`<b>시간당 📦 ${number(v.boxesPerHour)} · 💰 ${number(v.cashPerHour)}</b>`:`<b>약탈 가능 📦 ${number(v.lootAvailable)}</b>`}</div>${v.shieldUntil>serverNow()?`<small class="protection-clock">보호 <span data-live-end="${v.shieldUntil}">${timeLeft(v.shieldUntil-serverNow())}</span></small>`:''}</div><span class="enemy-status">${warTarget===v.id?'✓':''}</span></button>`).join('')||'<div class="mail-empty">같은 서버에 약탈할 상대 센터가 없습니다.</div>'}</div><div class="divider"></div><div class="statrow"><span>출정 사원 수</span><strong id="warCountView">${g.troops?warCount:0} / ${g.troops}명</strong></div><input id="warSlider" aria-label="출정 사원 선택" type="range" min="1" max="${Math.max(1,g.troops)}" value="${warCount}" ${g.troops<1?'disabled':''}><button class="btn btn-gold btn-wide" style="margin-top:16px" data-start-battle ${!selected||selected.disabled||g.troops<1||!!g.pendingBattle?'disabled':''}>${selected?h(selected.name)+' 출정':'상대를 선택하세요'}</button><p class="raid-limit">${conquest?'점령 성공 시 시간당 수입 · 점령 후 6시간 보호':'상대 보유 박스 최대 10% 약탈 · 피격 후 1시간 보호'}</p>`);
}

function openWarLog(){
  const bs=state?.battles||[];
  showModal(`<div class="modal-header"><h2 class="modal-title">📜 최근 전투 기록</h2><button data-close class="modal-close">닫기 ✕</button></div>
    ${bs.slice(0,16).map(b=>`<div class="history-row"><div><strong>${h(b.defender_name)} · ${b.result==='win'?'승리':b.result==='lose'?'패배':'무승부'}</strong>
      <small>${ago(b.at)} · 📦 ${number(b.loot)} 획득</small></div><button class="btn btn-outline" data-replay="${b.id}">리플레이</button></div>`).join('')||'<p class="muted">아직 전투 기록이 없어요.</p>'}`);
}
function renderServer(){const el=$('tabServer'),g=state.me.game,users=[...state.ranks].sort((a,b)=>rankMode==='total'?b.power-a.power:b.weekDelta-a.weekDelta);const chat=state.chat.slice(-30).reverse();const prevInput=document.activeElement?.id==='chatInput'?document.activeElement.value:null;
el.innerHTML=`<div class="page-title"><div><h2>우리 서버 🌐</h2></div><span class="pill">${h(state.me.world)} · ${state.server.players}/50</span></div>
<div class="card card-chat"><div class="card-head"><h3>💬 서버 채팅</h3></div><div class="chat-list">${chat.map(m=>`<div class="chat-msg"><strong>${h(m.nickname)}</strong><small>${ago(m.created_at)}</small><p>${h(m.body)}</p></div>`).join('')||'<p class="muted small">첫 번째 메시지를 남겨보세요!</p>'}</div><form id="chatForm" class="chat-compose"><input id="chatInput" maxlength="300" placeholder="서버 채팅 작성" autocomplete="off"><button class="btn btn-gold" type="submit">보내기</button></form></div>
<div class="card card-league"><div class="card-head"><h3>🏆 서버 랭킹</h3><span class="tag">${users.length}명 참가</span></div><div class="switch-tabs"><button data-rank="total" class="${rankMode==='total'?'active':''}">전투력</button><button data-rank="week" class="${rankMode==='week'?'active':''}">주간 성장</button></div>${users.map((v,i)=>`<div class="ranking-row"><span class="rank-no">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span><div class="meta"><strong>${h(v.nickname)}${v.id===state.me.id?' (나)':''}</strong><small>승리 ${v.wins}회 · 사원 ${v.troops}명</small></div><span class="points">${rankMode==='week'?'+':''}${number(rankMode==='week'?v.weekDelta:v.power)}</span></div>`).join('')}</div>
<div class="card card-news"><div class="card-head"><h3>📜 최근 전쟁 소식</h3></div>${state.battles.slice(0,8).map(b=>`<div class="history-row"><div><strong>${h(b.defender_name)} 센터 ${b.result==='win'?'함락':'교전'}</strong><small>📦 ${number(b.loot)}개 약탈 · ${ago(b.at)}</small></div><button class="btn btn-outline" data-replay="${b.id}" style="font-size:11px;min-height:32px;padding:6px">보기</button></div>`).join('')||'<p class="muted">아직 전쟁 기록이 없어요.</p>'}</div>`;
if(prevInput!==null){const inp=$('chatInput');inp.value=prevInput;inp.focus();inp.setSelectionRange(prevInput.length,prevInput.length);}}
function showModal(content){$('modalContent').className='modal-content '+(content.includes('data-buy=')?'modal-shop':content.includes('data-war-target=')?'modal-war':'modal-ledger');$('modalContent').innerHTML=content;$('modalOverlay').classList.remove('hidden');}
function closeModal(){$('modalOverlay').classList.add('hidden');}
function openShop(){closeModal();setTab('shop');}
function renderShop(){
 const g=state.me.game;
 $('tabShop').innerHTML=`<div class="page-title"><h2>상점</h2><span class="pill">💰 ${number(g.cash)}</span></div><div class="shop-banner"><h3>복슬이의 보급 창고</h3></div><div class="shop-grid">${(state.shopItems||[]).map(v=>{const d=SHOP_DETAILS[v.id]||{},waiting=!v.owned&&v.unlockAt>serverNow(),disabled=v.locked||v.owned||waiting||g.cash<v.price;return `<article class="shop-card ${v.locked?'future-item':''}"><div class="shop-art ${v.id}"><img src="assets/${d.image}.webp" alt="${h(v.name)}"></div><div class="shop-info"><h3>${h(v.name)}</h3><p>${d.description||''}</p>${waiting&&!v.locked?`<span class="shop-unlock">센터 개설 3일 후 구매 <b data-live-end="${v.unlockAt}">${timeLeft(v.unlockAt-serverNow())}</b></span>`:''}<button class="btn ${v.owned?'btn-green':'btn-gold'} btn-wide" data-buy="${v.id}" ${disabled?'disabled':''}>${v.locked?'🔒 준비 중':v.owned?'보유 중':`💰 ${number(v.price)}${v.permanent?' · 영구':''}`}</button></div></article>`}).join('')}</div>`;
}

function openProfile(){if(!state)return;const g=state.me.game;showModal(`<div class="modal-header"><h2 class="modal-title">👤 센터장 정보</h2><button data-close class="modal-close">닫기 ✕</button></div><div class="statrow"><span>센터장</span><strong>${h(state.me.nickname)}</strong></div><div class="statrow"><span>서버 코드</span><strong>${h(state.me.world)}</strong></div><div class="statrow"><span>전투력</span><strong>${number(state.me.power.total)}</strong></div><div class="statrow"><span>주간 성장</span><strong>+${number(state.me.weekDelta)}</strong></div><div class="statrow"><span>승리 / 패배</span><strong>${g.warWins}승 / ${g.warLosses}패</strong></div><button class="btn btn-outline btn-wide" style="margin-top:12px" data-guide>스토리·튜토리얼 다시 보기</button><button class="btn btn-outline btn-wide" style="margin-top:9px" data-logout>로그아웃</button><p class="section-note">PIN 번호는 복구되지 않아요. 다른 기기에서 로그인하려면 서버 코드·닉네임·PIN을 기억해 주세요.</p>`)}
function workerDps(w,g){return 5*Math.pow(2.4,w.level-1)*Math.pow(1.08,g.levels.mine-1)*(1+.03*g.captures.length);}
function openMail(){
 if(!state)return;const mails=state.me.game.mailbox||[],icons={territory:'🚩',upgrade:'🛠',recruit:'👥',battle:'⚔',defense:'🛡',zone:'🚪'};
 showModal(`<div class="modal-header"><h2 class="modal-title">✉ 우편함</h2><button class="modal-close" data-close>닫기 ✕</button></div><div class="mail-toolbar"><b>새 우편 ${mails.filter(m=>!m.readAt).length}</b><button class="btn btn-outline" data-mail-read ${mails.some(m=>!m.readAt)?'':'disabled'}>모두 읽음</button></div>${mails.map(m=>`<article class="mail-item ${m.readAt?'':'unread'}"><span>${icons[m.type]||'✉'}</span><div><h3>${h(m.title)}</h3><p>${h(m.body)}</p><time>${new Date(m.at).toLocaleString('ko-KR')}</time>${m.battleId?`<button class="btn btn-outline" data-replay="${h(m.battleId)}">전투 보기</button>`:''}</div></article>`).join('')||'<div class="mail-empty">아직 도착한 우편이 없습니다.</div>'}`);
}
function showBattleResult(p){
 const win=p.result==='win',draw=p.result==='draw',el=$('battleResult');
 el.innerHTML=`<div class="result-card ${win?'victory':'defeat'}"><div class="result-art"><img src="assets/${win?'battle-victory':'battle-defeat'}.webp" alt="${win?'센터를 점령하고 환호하는 사원들':'다음 출정을 다짐하는 사원들'}"><h2>${p.retreated?'후퇴 완료':p.conquered?'정복 성공!':win?'약탈 성공!':draw?'다음 기회를 노리자':'다시 일어서자'}</h2></div><div class="result-info"><h3>${h(p.defenderName)} · ${p.retreated?'생존 사원 복귀':win?'승리':draw?'무승부':'패배'}</h3><div class="result-stats"><span>${p.conquered?'정복지 확보':'약탈 박스'} <b>${p.conquered?'🚩':'📦 '+number(p.loot)}</b></span><span>귀환 / 손실 <b>${number(p.survivors??p.amount-p.lost)} / ${number(p.lost)}명</b></span></div><div class="btnrow"><button class="btn btn-gold" data-return-battle="center">센터로 복귀</button><button class="btn btn-outline" data-return-battle="war">출정 준비</button></div></div></div>`;
 el.classList.remove('hidden');
}
function returnFromBattle(tab){$('battleResult').classList.add('hidden');$('battleTransition').classList.add('hidden');animation=null;animating=false;warScrollLeft=0;setTab(tab);}
let zoneTimer;
function showZoneTransition(zone){
 const el=$('zoneTransition');clearTimeout(zoneTimer);
 el.innerHTML=`<div class="zone-scroll-track"><section class="zone-new"><h2>구역 ${zone+1}</h2><img class="arrival-gate" src="assets/warehouse-gate-open.webp" alt="방금 돌파한 창고 문"></section><section class="zone-old"><h2>구역 ${zone} 돌파!</h2><img src="assets/warehouse-gate-open.webp" alt=""></section></div>`;
 el.classList.remove('hidden');zoneTimer=setTimeout(()=>el.classList.add('hidden'),1900);
}
function openMerge(){const ws=state?.me.game.workers||[];const pairs=[];for(let i=0;i<ws.length;i++)for(let j=i+1;j<ws.length;j++)if(ws[i].level===ws[j].level&&ws[i].level<6)pairs.push([ws[i],ws[j]]);showModal(`<div class="modal-header"><h2 class="modal-title">🔀 일용직 합성</h2><button class="modal-close" data-close>닫기 ✕</button></div><p class="section-note">같은 레벨 일용직 두 명을 합쳐 다음 레벨로 올려요. 채굴 중인 일용직도 합성하면 작업이 멈춰요.</p>${pairs.length?pairs.map(([a,b])=>`<div class="shop-item"><span class="si">👷</span><div class="info"><strong>Lv.${a.level} + Lv.${b.level} → Lv.${a.level+1}</strong><small>공격이 아닌 채굴 속도 약 2.4배</small></div><button class="btn btn-gold" data-merge="${a.id}|${b.id}">합성</button></div>`).join(''):'<p class="muted">합성할 일용직 조합이 없어요. 같은 레벨 일용직을 추가로 소환해 주세요.</p>'}`);}
function clearIntroTimers(){introTimers.forEach(clearTimeout);introTimers=[];}
function showTutorial(){
  if(!state)return;
  clearIntroTimers();showOnboard=true;
  $('onboardOverlay').classList.remove('hidden');
  renderTutorial();
}
function guidePage(step){
 return `<div class="tutorial-page"><div class="tutorial-art"><img src="assets/tutorial-v16-${step+1}.webp" alt="${['택배 채굴로 사원과 센터를 키우는 게임 목표','일용직 배치와 합성','센터 강화와 연구','다른 센터로 출정'][step]}"></div></div>`;
}

function renderTutorial(){
  clearIntroTimers();
  const i=onboardStep,isStory=i<5,story=storyCaptions[i];
  $('onboardOverlay').classList.toggle('story-mode',isStory);
  $('onboardContent').innerHTML=isStory?
  `<div class="onboard-cinema">
    <img class="cinema-image" src="assets/story-full-${i+1}.webp" alt="웹툰 ${i+1}화 장면">
    <div class="cinema-vignette"></div>
    <div class="cinema-topline">박스의 반란 <span>${i+1} / 5</span></div>
    <div class="cinema-bubble bubble-head" id="cinemaHead"><small>${h(story.speaker)}</small>${h(story.head)}</div>
    <div class="cinema-bubble bubble-body" id="cinemaBody"><small>${h(story.reply)}</small>${h(story.body)}</div>
    <div class="cinema-progress">${Array.from({length:5},(_,k)=>`<span class="${k<=i?'current':''}"></span>`).join('')}</div>
  </div>`:
  guidePage(i-5);
  $('onboardCounter').textContent=isStory?`${i+1} / 5`:`${i-4} / 4`;
  $('onboardNext').hidden=isStory;
  $('onboardNext').textContent=i===8?'게임 시작하기 →':'다음 →';
  $('onboardSkip').textContent=isStory?'SKIP »':'건너뛰기';
  if(isStory){
    introTimers.push(setTimeout(()=>$('cinemaHead')?.classList.add('visible'),450));
    introTimers.push(setTimeout(()=>$('cinemaBody')?.classList.add('visible'),2900));
    introTimers.push(setTimeout(()=>{if(!showOnboard)return;onboardStep=Math.min(8,onboardStep+1);renderTutorial();},7600));
  }
}
async function completeTutorial(){clearIntroTimers();showOnboard=false;$('onboardOverlay').classList.add('hidden');await doAction('onboard/done');}
function setTab(tab){if(!['center','mine','war','shop','server'].includes(tab))return;selectedTab=tab;render();window.scrollTo({top:0,behavior:'smooth'});}

function makeBoksilSheet(enemy=false){
 const c=document.createElement('canvas');c.width=96;c.height=24;const x=c.getContext('2d');
 const rows=[
 '      DDDDDD      ','    DDYYYYYYDD    ','   DYYYYYYYYYYD   ','   DYYYGYYGYYYD   ','  DDYYYYYYYYYYDD  ',' DWWDDDDDDDDWWWD  ','DWWWWWWWWWWWWWWWD ','DWWWWKWWWWKWWWWWD ',' DWWWPWWWWPWWWWD  ','DWWWWWWMMWWWWWWWD ','DWWWDDWWWWWWWWWWD ',' DWWDDDDWWWWWWWD  ',' DWWDWWWWWWWWWDD  ','  DWWWWWWWWWWWD   ','   DDDCCCHCDDD    ','     DCCCCCD      ','     DCCCCCD      '];
 const palette={D:'#292b43',W:'#fff8e9',Y:enemy?'#e98973':'#ffd35a',G:'#fff3be',K:'#1d2434',P:'#f49bb1',M:'#a85b6f',C:enemy?'#b95c6d':'#528fb5',H:'#f7c16c'};
 for(let frame=0;frame<4;frame++){
   const ox=frame*24+3,bob=frame%2;
   rows.forEach((row,y)=>[...row].forEach((v,xx)=>{if(palette[v]){x.fillStyle=palette[v];x.fillRect(ox+xx,y+bob,1,1);}}));
   x.fillStyle=palette.D;x.fillRect(ox+5+(frame%2),18,3,3);x.fillRect(ox+10-(frame%2),18,3,3);
   x.fillStyle='#c3d5de';x.fillRect(ox+14,12+bob,5,2);x.fillStyle='#7893ab';x.fillRect(ox+18,10+bob,2,5);
 }
 return c;
}
const boksilSheets={own:makeBoksilSheet(),enemy:makeBoksilSheet(true)};

const visualAssets={terrain:new Image(),own:new Image(),enemy:new Image()};
visualAssets.terrain.src='assets/scene-war.webp';
visualAssets.own.src='assets/fortress.webp';
visualAssets.enemy.src='assets/fortress.webp';
Object.values(visualAssets).forEach(img=>img.onload=()=>{if($('warCanvas'))drawBattle(animation?.current||null);});
function healthMaxima(side){
 const first=animation?.frames?.[0];
 return {C:first?.[side+'C']??state?.unitStats.center??1000,W:first?.[side+'W']??state?.unitStats.wall??450,T:first?.[side+'T']??state?.unitStats.turret??300};
}
function drawBattle(frame){
 const canvas=$('warCanvas');if(!canvas)return;
 paintBattle(canvas,frame,{assets:visualAssets,sprites:boksilSheets,phase:animation?.phase,events:animation?.events||[],ownStats:state?.unitStats});
 if(!frame)return;
 for(const side of ['a','b'])for(const [key] of HEALTH_KINDS){
   const value=frame[side+key],max=healthMaxima(side)[key];
   const label=document.querySelector(`[data-health-number="${side+key}"]`),bar=document.querySelector(`[data-health-bar="${side+key}"]`),row=document.querySelector(`[data-health-row="${side+key}"]`);
   if(label)label.textContent=number(value)+' / '+number(max);if(bar)bar.style.width=Math.max(0,100*value/Math.max(1,max))+'%';
   const hit=animation?.phase==='battle'&&animation.events.some(e=>e.type==='structure'&&e.side===side&&e.key===key&&frame.t-e.at>=0&&frame.t-e.at<.35);row?.classList.toggle('taking-hit',!!hit);
 }
}
async function finishBattle(retreat=false){
 const current=animation;if(!current||['finished','settling'].includes(current.phase))return;
 const was=current.phase;current.phase='settling';
 try{
  if(current.payload.pending){
   const out=await api('/api/action','POST',{type:retreat?'battle/retreat':'battle/finish',battleId:current.payload.id,requestId:crypto.randomUUID()});
   current.payload=out.battle;current.frames=out.battle.frames;current.events=buildBattleEvents(current.frames);
   await loadState({silent:true,resumeBattle:false});
  }
  current.current=current.frames.at(-1)||current.current;current.phase='finished';animating=false;renderWar();showBattleResult(current.payload);
 }catch(e){current.phase=was;toast(e.message,true);if(was==='battle')runBattle(current);}
}
async function setBattleSpeed(speed){
 const current=animation;if(!current||current.phase!=='battle'||current.controlling)return;
 current.controlling=true;
 try{
  if(current.payload.pending){const out=await api('/api/action','POST',{type:'battle/control',battleId:current.payload.id,speed,requestId:crypto.randomUUID()});current.offset=out.elapsed;}
  else current.offset+=(performance.now()-current.anchor)/1000*warPlaybackSpeed;
  current.anchor=performance.now();warPlaybackSpeed=speed;const btn=document.querySelector('[data-speed]');if(btn){btn.textContent=speed+'배속';btn.dataset.speed=String(speed===1?2:1);}
 }catch(e){toast(e.message,true);}finally{current.controlling=false;}
}
function playBattle(payload,resuming=false){
 if(!payload?.frames?.length){toast('전투 기록이 비어 있어요.',true);return;}
 if(animation?.introTimer)clearTimeout(animation.introTimer);$('battleResult').classList.add('hidden');
 selectedTab='war';warScrollLeft=0;warPlaybackSpeed=payload.pending?payload.speed||1:1;animating=true;
 animation={frames:payload.frames,events:buildBattleEvents(payload.frames),current:payload.frames[0],offset:payload.pending?payload.elapsed||0:0,anchor:0,phase:'intro',payload};render();
 if(resuming){beginBattle();return;}
 const overlay=$('battleTransition');overlay.innerHTML=`<img class="charge-art" src="assets/battle-charge.webp" alt="복슬이 사원들의 출정"><div class="charge-names">${h(payload.attackerName||state.me.nickname)} <span>VS</span> ${h(payload.defenderName)}</div><div class="charge-speech"><small>복슬이 센터장</small><b>다들 준비됐지?<br>진격하라!</b></div><button class="btn btn-gold charge-skip" data-skip-intro>전장으로</button>`;overlay.classList.remove('hidden');animation.introTimer=setTimeout(()=>beginBattle(),3200);
}
async function beginBattle(){
 const current=animation;if(!current||current.phase!=='intro'||current.controlling)return;
 clearTimeout(current.introTimer);current.controlling=true;
 try{
  if(current.payload.pending){const out=await api('/api/action','POST',{type:'battle/control',battleId:current.payload.id,begin:true,requestId:crypto.randomUUID()});current.offset=out.elapsed;warPlaybackSpeed=out.speed;}
  $('battleTransition').classList.add('hidden');current.phase='battle';current.anchor=performance.now();current.manualCamera=false;renderWar();runBattle(current);
 }catch(e){$('battleTransition').classList.add('hidden');toast(e.message,true);finishBattle();}finally{current.controlling=false;}
}
function runBattle(current){
 const run=()=>{
  if(animation!==current||!animating||current.phase!=='battle')return;
  const seconds=Math.min(current.frames.at(-1).t,current.offset+(performance.now()-current.anchor)/1000*warPlaybackSpeed);
  let idx=0;while(idx<current.frames.length-1&&current.frames[idx+1].t<=seconds)idx++;
  const f=current.frames[idx],next=current.frames[Math.min(idx+1,current.frames.length-1)],alpha=next.t>f.t?Math.max(0,Math.min(1,(seconds-f.t)/(next.t-f.t))):0;
  current.current={...f,t:seconds,a:{...f.a,x:f.a.x+(next.a.x-f.a.x)*alpha},b:{...f.b,x:f.b.x+(next.b.x-f.b.x)*alpha}};drawBattle(current.current);
  const sc=$('warScroller');if(sc&&!current.manualCamera&&seconds>1.4){const front=current.current.a.n?current.current.a.x:current.current.b.x;sc.scrollLeft=Math.max(0,front*sc.scrollWidth-sc.clientWidth*.48);}
  const hint=$('battleHint');if(hint)hint.textContent=`${seconds.toFixed(1)}초 · 아군 ${current.current.a.n}명 / 상대 ${current.current.b.n}명`;
  if(seconds>=current.frames.at(-1).t)finishBattle();else requestAnimationFrame(run);
 };requestAnimationFrame(run);
}

async function replay(id){try{const v=await api('/api/battle/'+id);closeModal();playBattle(v.battle);}catch(e){toast(e.message,true)}}
let suppressMineClickUntil=0;
function handleAction(e){if(Date.now()<suppressMineClickUntil&&e.target.closest('#tabMine'))return;const btn=e.target.closest('button');if(!btn||!state)return;
if(btn.dataset.returnBattle){returnFromBattle(btn.dataset.returnBattle);return}if(btn.dataset.openMail!==undefined){openMail();return}if(btn.dataset.mailRead!==undefined){doAction('mail/read').then(openMail);return}if(btn.dataset.recruitMax!==undefined){doAction('troops/recruit',{max:true});return}if(btn.dataset.gate!==undefined){const w=state.me.game.workers.find(v=>v.id===selectedWorker)||state.me.game.workers[0];if(w)doAction('mine/gate',{worker:w.id});else toast('일용직을 먼저 소환해 주세요.',true);return}if(btn.dataset.skipIntro!==undefined){beginBattle();return}if(btn.dataset.tab){if(miningDragging)return;setTab(btn.dataset.tab);return}if(btn.dataset.modal==='shop'){openShop();return}if(btn.dataset.close!==undefined){closeModal();return}if(btn.dataset.guide!==undefined){closeModal();onboardStep=0;showTutorial();return}if(btn.dataset.logout!==undefined){api('/api/logout','POST',{}).then(()=>location.reload()).catch(err=>toast(err.message,true));return}
if(btn.dataset.upgrade){doAction('upgrade/start',{key:btn.dataset.upgrade});return}if(btn.dataset.recruit){doAction('troops/recruit',{amount:Number(btn.dataset.recruit)});return}if(btn.dataset.summon!==undefined){doAction('worker/summon');return}if(btn.dataset.worker){selectedWorker=btn.dataset.worker;renderMine();return}if(btn.dataset.openMerge!==undefined){openMerge();return}if(btn.dataset.merge){const [a,b]=btn.dataset.merge.split('|');closeModal();doAction('worker/merge',{a,b});return}
if(btn.dataset.tile!==undefined){const idx=Number(btn.dataset.tile),w=state.me.game.workers.find(v=>v.id===selectedWorker)||state.me.game.workers[0],n=state.me.game.mine.nodes[idx];if(!w){toast('일용직을 먼저 소환해 주세요.',true);return}if(n.done)doAction('mine/move',{worker:w.id,x:idx%5,y:Math.floor(idx/5)});else doAction('mine/dispatch',{worker:w.id,idx});return}
if(btn.dataset.start!==undefined){doAction('mine/move',{worker:selectedWorker,x:Number(btn.dataset.start),y:8});return}if(btn.dataset.nextZone!==undefined){doAction('mine/next-zone');return}
if(btn.dataset.buy){const item=btn.dataset.buy;closeModal();doAction('shop/buy',{item});return}

if(btn.dataset.expedition){chooseExpedition(btn.dataset.expedition);return}if(btn.dataset.retreat!==undefined){finishBattle(true);return}if(btn.dataset.openWar!==undefined){openWarChooser();return}if(btn.dataset.openWarLog!==undefined){openWarLog();return}if(btn.dataset.warTarget){warTarget=btn.dataset.warTarget;openWarChooser();return}if(btn.dataset.startBattle!==undefined){closeModal();doAction('battle/start',{amount:warCount,target:warTarget,mode:warMode});return}if(btn.dataset.camera){if(animation)animation.manualCamera=true;const sc=$('warScroller');if(sc)sc.scrollTo({left:btn.dataset.camera==='own'?0:btn.dataset.camera==='enemy'?sc.scrollWidth:(sc.scrollWidth-sc.clientWidth)/2,behavior:'smooth'});return}if(btn.dataset.speed){setBattleSpeed(Number(btn.dataset.speed));return}if(btn.dataset.skipBattle!==undefined){finishBattle();return}if(btn.dataset.replay){replay(btn.dataset.replay);return}if(btn.dataset.rank){rankMode=btn.dataset.rank;renderServer();return}
}
function endMineDrag(e,cancelled=false){
  const dragging=miningDragging;
  if(!dragging||dragging.pointerId!==e.pointerId)return;
  const sprite=document.querySelector('.mine-worker.dragging');
  const drop=!cancelled?document.elementFromPoint(e.clientX,e.clientY):null;
  const nearby=[...document.querySelectorAll('.mine-worker:not(.dragging)')].map(el=>{const r=el.getBoundingClientRect();return {el,d:Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2))};}).filter(v=>v.d<27).sort((a,b)=>a.d-b.d);const other=nearby[0]?.el||drop?.closest('.mine-worker'),tile=drop?.closest('.mine-tile'),gate=drop?.closest('[data-gate]');
  sprite?.classList.remove('dragging');
  if(sprite){sprite.style.transform='';sprite.style.pointerEvents='';}
  document.querySelectorAll('.mine-drop').forEach(x=>x.classList.remove('mine-drop'));
  miningDragging=null;suppressMineClickUntil=Date.now()+400;
  if(cancelled){renderMine();return;}
  if(Math.hypot(e.clientX-dragging.x,e.clientY-dragging.y)<12){
    selectedWorker=dragging.id;renderMine();return;
  }
  if(other?.dataset.worker && other.dataset.worker!==dragging.id){
    const a=state.me.game.workers.find(w=>w.id===dragging.id),b=state.me.game.workers.find(w=>w.id===other.dataset.worker);
    if(!a||!b||a.level!==b.level||a.level>=6){toast('같은 레벨의 일용직을 겹쳐 놓으면 합성할 수 있어요.',true);return;}
    doAction('worker/merge',{a:a.id,b:b.id});return;
  }
  if(gate){doAction('mine/gate',{worker:dragging.id});return;}
  if(tile?.dataset.tile!==undefined){
    const idx=Number(tile.dataset.tile),node=state.me.game.mine.nodes[idx];
    if(node.done)doAction('mine/move',{worker:dragging.id,x:idx%5,y:Math.floor(idx/5)});
    else doAction('mine/dispatch',{worker:dragging.id,idx});
    return;
  }
  if(tile?.dataset.start!==undefined){
    doAction('mine/move',{worker:dragging.id,x:Number(tile.dataset.start),y:8});return;
  }
  toast('자원이나 빈 통로 위에 일용직을 내려놓아 주세요.');
}
document.addEventListener('pointerdown',e=>{if(e.target.closest('#warScroller')&&animation)animation.manualCamera=true;
  const sprite=e.target.closest('.mine-worker');
  if(!sprite||selectedTab!=='mine'||e.button>0||!state)return;
  e.preventDefault();
  selectedWorker=sprite.dataset.worker;
  miningDragging={id:selectedWorker,pointerId:e.pointerId,x:e.clientX,y:e.clientY};
  sprite.setPointerCapture(e.pointerId);
  sprite.classList.add('dragging');
  sprite.style.pointerEvents='none';
});
document.addEventListener('pointermove',e=>{
  const d=miningDragging;if(!d||d.pointerId!==e.pointerId)return;
  e.preventDefault();
  const sprite=document.querySelector('.mine-worker.dragging');
  if(sprite)sprite.style.transform=`translate(calc(-50% + ${e.clientX-d.x}px),calc(-50% + ${e.clientY-d.y}px)) scale(1.16)`;
  document.querySelectorAll('.mine-drop').forEach(v=>v.classList.remove('mine-drop'));
  const drop=document.elementFromPoint(e.clientX,e.clientY)?.closest('.mine-worker,.mine-tile');
  if(drop&&drop!==sprite)drop.classList.add('mine-drop');
},{passive:false});
document.addEventListener('pointerup',e=>endMineDrag(e));
document.addEventListener('pointercancel',e=>endMineDrag(e,true));
document.addEventListener('click',handleAction);
$('modalOverlay').addEventListener('click',e=>{if(e.target===$('modalOverlay'))closeModal()});$('cashResource').addEventListener('click',openShop);$('boxResource').addEventListener('click',()=>setTab('mine'));$('guideBtn').addEventListener('click',()=>{onboardStep=0;showTutorial()});$('profileBtn').addEventListener('click',openProfile);$('mailBtn').addEventListener('click',openMail);
$('onboardNext').addEventListener('click',()=>{if(onboardStep>=8)completeTutorial();else{onboardStep++;renderTutorial()}});$('onboardSkip').addEventListener('click',()=>{if(onboardStep<5){onboardStep=5;renderTutorial();}else completeTutorial()});
document.addEventListener('input',e=>{if(e.target.id==='warSlider'){warCount=Number(e.target.value);if($('warCountView'))$('warCountView').textContent=warCount+' / '+(state?.me.game.troops||0)+'명';}});
document.addEventListener('submit',async e=>{if(e.target.id==='chatForm'){e.preventDefault();const input=$('chatInput'),message=input.value.trim();if(!message)return;try{await api('/api/chat','POST',{message,requestId:crypto.randomUUID()});input.value='';await loadState({silent:true});toast('채팅을 전송했어요.')}catch(err){toast(err.message,true)}return;}
if(e.target.id==='authForm'){e.preventDefault();const pin=$('pinField').value,nickname=$('nickField').value.trim(),world=$('worldField').value.trim().toUpperCase();const submit=$('authSubmit');submit.disabled=true;try{await api('/api/'+authMode,'POST',{pin,nickname,world});await loadState();}catch(err){toast(err.message,true)}finally{submit.disabled=false;}return;}});
$('signupTab').addEventListener('click',()=>{authMode='register';$('signupTab').classList.add('active');$('loginTab').classList.remove('active');$('authSubmit').textContent='혁명 시작하기 →';});$('loginTab').addEventListener('click',()=>{authMode='login';$('loginTab').classList.add('active');$('signupTab').classList.remove('active');$('authSubmit').textContent='기존 계정으로 로그인 →';});
setInterval(()=>{if(!state||document.hidden||showOnboard||(!$('modalOverlay').classList.contains('hidden')&&!$('modalContent').querySelector('[data-mail-read]'))||animating||miningDragging)return;loadState({silent:true});},5000);

let timerRefreshAt=0;
setInterval(()=>{
 if(!state||document.hidden||showOnboard)return;
 const now=serverNow(),g=state.me.game;let mineDue=false;
 document.querySelectorAll('[data-live-end]').forEach(el=>el.textContent=timeLeft(Number(el.dataset.liveEnd)-now));
 document.querySelectorAll('[data-progress-end]').forEach(el=>{const a=Number(el.dataset.progressStart),b=Number(el.dataset.progressEnd);el.style.width=Math.max(0,Math.min(100,100*(now-a)/Math.max(1,b-a)))+'%';});
 if(selectedTab==='mine'&&!miningDragging){
   document.querySelectorAll('.mine-tile[data-tile]').forEach(el=>{
     const idx=Number(el.dataset.tile),n=g.mine.nodes[idx];if(!n||n.done)return;
     const workers=g.workers.filter(w=>w.target===idx),rate=workers.reduce((sum,w)=>sum+workerDps(w,g),0);
     const elapsed=Math.max(0,(now-state.serverTime)/1000),boosted=Math.max(0,Math.min(elapsed,(g.shop.boostUntil-state.serverTime)/1000)),hp=Math.max(0,n.hp-rate*(elapsed+boosted));
     if(rate>0&&hp<=0)mineDue=true;
     const bar=el.querySelector('.mine-ore-health i');if(bar)bar.style.width=(100*hp/n.max)+'%';
     const timer=el.querySelector('.mine-ore-timer');if(timer)timer.textContent=hp<=0?'수령 중':timeLeft(hp/(rate*(g.shop.boostUntil>now?2:1))*1000);
   });
   const gate=g.mine.gate,rate=g.workers.filter(w=>w.target==='gate').reduce((sum,w)=>sum+workerDps(w,g),0);
   if(gate&&!gate.done&&rate){
    const elapsed=Math.max(0,(now-state.serverTime)/1000),boosted=Math.max(0,Math.min(elapsed,(g.shop.boostUntil-state.serverTime)/1000)),hp=Math.max(0,gate.hp-rate*(elapsed+boosted));
    const bar=document.querySelector('[data-gate-bar]'),count=document.querySelector('[data-gate-count]'),timer=document.querySelector('[data-gate-timer]');
    if(bar)bar.style.width=100*hp/gate.max+'%';if(count)count.textContent=number(hp)+' / '+number(gate.max);if(timer)timer.textContent=timeLeft(hp/(rate*(g.shop.boostUntil>now?2:1))*1000);
    if(hp<=0)mineDue=true;
   }
 }
 const due=[...(g.recruitQueue||[]),...g.upgrades].some(j=>j.endAt<=now);
 if((due||mineDue)&&!miningDragging&&!animating&&now-timerRefreshAt>1200){timerRefreshAt=now;loadState({silent:true});}
},150);

loadState({silent:true});

$('enterSignup').addEventListener('click',()=>{$('auth').classList.add('auth-open');$('signupTab').click();});
$('enterLogin').addEventListener('click',()=>{$('auth').classList.add('auth-open');$('loginTab').click();});
$('titleBack').addEventListener('click',()=>$('auth').classList.remove('auth-open'));
