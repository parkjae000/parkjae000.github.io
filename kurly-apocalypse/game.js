const RELEASE='20261121-immersive-6';
const API_BASE=/^(www\.)?jparkapps\.xyz$|^parkjae000\.github\.io$/.test(location.hostname)?'https://pgupfypoxhjawtonnzzk.supabase.co/functions/v1/kurly-apocalypse':location.hostname.endsWith('.supabase.co')?location.origin+'/functions/v1/kurly-apocalypse':'';
const TOKEN_KEY='ka_game_session_v1';
const $=id=>document.getElementById(id);
const number=v=>new Intl.NumberFormat('ko-KR').format(Math.round(Number(v)||0));
const h=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const timeLeft=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return s>=3600?`${Math.floor(s/3600)}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`:`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const ago=ms=>{const t=new Date(ms);return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`};
let introTimers=[],warPlaybackSpeed=1,miningDragging=null,spawnedWorkerId=null,warPanelOpen=false,warScrollLeft=0;
let state=null,selectedTab='center',selectedWorker='w1',authMode='register',rankMode='total',warTarget='npc-1',warCount=12,bombMode=false,showOnboard=false,onboardStep=0,animation=null,animating=false, lastSnapshot=0,serverOffset=0,toastTimer=null,lastPageRendered='';
const STORE=[{id:'auto',name:'자동 채굴 모듈',icon:'🤖',price:140,description:'작업 완료 후 다음 박스를 자동 선택해요.',permanent:true},{id:'bot',name:'업그레이드 봇 2호',icon:'🛠️',price:600,description:'센터 연구를 동시에 2개까지 진행해요.',permanent:true},{id:'bomb',name:'택배 폭탄',icon:'💥',price:35,description:'선택한 인접 택배 최대 3칸에 큰 피해를 줘요.'},{id:'boost',name:'채굴 2배 가속권',icon:'⚡',price:65,description:'채굴 속도 2배 · 10분 동안 적용돼요.'}];
const UPGRADES=[{key:'center',name:'센터 레벨',icon:'🏢',desc:'센터 체력 및 다른 연구 상한 증가'},{key:'mine',name:'채굴 효율',icon:'⛏️',desc:'작업자 채굴 속도 +8%'},{key:'troopAtk',name:'노조원 공격력',icon:'⚔️',desc:'병력 공격 피해 +8%'},{key:'troopHp',name:'노조원 체력',icon:'❤️',desc:'병력 최대 체력 +10%'},{key:'troopSpeed',name:'노조원 공격속도',icon:'⚡',desc:'병력 공격속도 +3%'},{key:'capacity',name:'병력 수용 한도',icon:'👥',desc:'최대 병력 +8명'},{key:'wall',name:'방벽 내구도',icon:'🛡️',desc:'방벽 체력 +12%'},{key:'turretDmg',name:'포탑 공격력',icon:'🎯',desc:'포탑 공격 피해 +10%'},{key:'turretSpeed',name:'포탑 공격속도',icon:'💥',desc:'포탑 공격속도 +4%'}];
const CENTER_COST=[0,0,300,800,2000,5000,12000,27000,60000,135000,300000];
const CENTER_TIME=[0,0,30,180,720,1800,3600,7200,14400,28800,57600];
const BASE_COST=[0,0,140,290,590,1210,2470,5070,10390,21300,43670];
const BASE_TIME=[0,0,20,50,120,300,720,1800,4500,10800,25200];
const FACTOR={mine:1.2,troopAtk:1,troopHp:1,troopSpeed:1.2,capacity:1.15,wall:1,turretDmg:1.25,turretSpeed:1.4};
const storyCaptions=[
 {head:'1. 넘치는 박스, 제자리인 월급',body:'물류 제국은 날마다 커졌다. 하지만 현장의 복슬 직원들은 지쳐만 갔다.'},
 {head:'2. 분노가 쌓이기 시작했다',body:'낮아진 급여 명세서를 본 직원들은 더 이상 참을 수 없었다.'},
 {head:'3. 박스의 반란',body:'“우리가 직접 센터를 운영하자!” 직원들은 힘을 모아 독립을 선언했다.'},
 {head:'4. 첫 물류센터 확보',body:'택배 박스를 모아 방벽을 만들고 포탑을 세웠다. 독립 센터의 시대가 시작됐다.'},
 {head:'5. 이제 센터 간 전쟁이다!',body:'채굴하고, 연구하고, 노조원을 모집하자. 우리 서버의 최강 물류센터를 목표로!'}
];
async function api(endpoint,method='GET',body){const r=await fetch(API_BASE+endpoint,{method,credentials:API_BASE?'omit':'same-origin',headers:{...(body?{'Content-Type':'application/json'}:{}),...(localStorage.getItem(TOKEN_KEY)?{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}:{})},body:body?JSON.stringify(body):undefined});const v=await r.json().catch(()=>({error:'서버 응답을 읽지 못했어요.'}));if(!r.ok)throw new Error(v.error||'요청에 실패했어요.');if(v.token)localStorage.setItem(TOKEN_KEY,v.token);if(endpoint==='/api/logout')localStorage.removeItem(TOKEN_KEY);return v;}
function toast(message,error=false){const el=$('toast');el.textContent=message;el.classList.toggle('error',error);el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800);}
async function loadState({silent=false}={}){try{const v=await api('/api/state');state=v;lastSnapshot=Date.now();serverOffset=v.serverTime-Date.now();$('auth').classList.add('hidden');$('app').classList.remove('hidden');if(!v.me.game.storySeen||!v.me.game.tutorialSeen){if(!showOnboard){showOnboard=true;onboardStep=0;showTutorial();}}render();return v;}catch(e){if(/로그인이 필요/.test(e.message)){$('auth').classList.remove('hidden');$('app').classList.add('hidden');}else if(!silent)toast(e.message,true);return null;}}
function serverNow(){return Date.now()+serverOffset;}
async function doAction(type,params={}){
  try{
    const priorWorkers=new Set((state?.me.game.workers||[]).map(w=>w.id));
    const out=await api('/api/action','POST',{...params,type,requestId:crypto.randomUUID()});
    if(out.message&&!out.battle)toast(out.message);
    await loadState({silent:true});
    if(type==='worker/summon'){
      spawnedWorkerId=state?.me.game.workers.find(w=>!priorWorkers.has(w.id))?.id||null;
      if(selectedTab==='mine')renderMine();
      setTimeout(()=>spawnedWorkerId=null,750);
    }
    if(out.battle)playBattle(out.battle);
    return out;
  }catch(e){toast(e.message,true);return null;}
}
function upgradeCost(key,level){return key==='center'?{boxes:CENTER_COST[level],seconds:CENTER_TIME[level]}:{boxes:Math.ceil(BASE_COST[level]*(FACTOR[key]||1)/10)*10,seconds:BASE_TIME[level]};}
function render(){if(!state)return;const g=state.me.game;const power=state.me.power.total;$('serverLabel').textContent=`${state.me.world} · ${state.me.nickname}`;$('boxCount').textContent=number(g.boxes);$('cashCount').textContent=number(g.cash);$('powerCount').textContent=number(power);
for(const t of ['center','mine','war','server']){$(`tab${t[0].toUpperCase()+t.slice(1)}`).classList.toggle('hidden',t!==selectedTab)}document.querySelectorAll('.navitem').forEach(b=>b.classList.toggle('selected',b.dataset.tab===selectedTab));
$('app').classList.toggle('immersive-mine',selectedTab==='mine');$('app').classList.toggle('immersive-war',selectedTab==='war');
if(selectedTab==='center')renderCenter();else if(selectedTab==='mine')renderMine();else if(selectedTab==='war')renderWar();else renderServer();}
function renderCenter(){const el=$('tabCenter'),g=state.me.game,p=state.me.power,stats=state.unitStats,bots=g.shop.bot?2:1,pending=(g.recruitQueue||[]).reduce((sum,j)=>sum+j.amount,0);
const active=UPGRADES.filter(u=>g.upgrades.some(j=>j.key===u.key));const rows=UPGRADES.map(u=>{const lv=g.levels[u.key],next=lv+1,job=g.upgrades.find(j=>j.key===u.key),mx=lv>=10,locked=u.key!=='center'&&next>g.levels.center+1,c=upgradeCost(u.key,next),room=g.upgrades.length<bots;return `<div class="upgrade-item"><h4>${u.icon} ${u.name}<span class="tag">Lv.${lv}</span></h4><small>${u.desc}</small><div class="value">${mx?'최대 레벨':`${number(c.boxes)} 📦 · ${timeLeft(c.seconds*1000)}`}</div><button class="btn ${job?'btn-purple':'btn-outline'}" data-upgrade="${u.key}" ${mx||locked||!!job||!room||g.boxes<(c?.boxes||0)?'disabled':''}>${job?'연구 중 · '+timeLeft(job.endAt-serverNow()):mx?'최대 레벨':locked?'센터 레벨 필요':'강화 시작'}</button></div>`}).join('');
const jobs=Array.from({length:bots},(_,i)=>{const j=g.upgrades[i];return `<div class="slot"><h4>🤖 업그레이드 봇 ${i+1}호</h4>${j?`<small>${h(UPGRADES.find(v=>v.key===j.key)?.name||j.key)} Lv.${j.target}</small><div class="progress" style="margin:9px 0"><div class="bar" data-progress-start="${j.startAt}" data-progress-end="${j.endAt}" style="width:${Math.max(0,Math.min(100,100*(serverNow()-j.startAt)/(j.endAt-j.startAt)))}%"></div></div><strong class="counter" data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</strong>`:`<span class="good">대기 중 · 연구 가능</span>`}</div>`}).join('')+(bots===1?`<div class="slot"><h4>🔒 업그레이드 봇 2호</h4><small>상점에서 희귀 돈 600으로 영구 해금</small><button class="btn btn-outline" style="margin-top:8px" data-modal="shop">상점 열기</button></div>`:'');
el.innerHTML=`<div class="page-title"><div><h2>내 센터 <span class="goldtext">Lv.${g.levels.center}</span></h2><p>채굴한 박스로 성장, 방어, 군사력을 키우세요.</p></div><span class="pill">세력력 ${number(p.total)}</span></div>
<div class="dashboard-columns"><div><div class="card"><div class="card-head"><h3>📦 독립 물류센터</h3><span class="tag good">운영 중</span></div><div class="warehouse-stage illustrated-center"><div class="center-hero-shade"></div><span class="center-hero-title">독립 물류센터 <b>Lv.${g.levels.center}</b></span><span class="stage-caption">방벽 Lv.${g.levels.wall} · 포탑 Lv.${g.levels.turretDmg}</span></div><div class="gridstats" style="margin-top:11px"><div class="statbox"><small>센터 최대 HP</small><strong>${number(stats.center)}</strong></div><div class="statbox"><small>방벽 HP</small><strong>${number(stats.wall)}</strong></div><div class="statbox"><small>포탑 공격력</small><strong>${number(stats.turretDamage)}</strong></div></div></div>
<div class="card"><div class="card-head"><h3>👥 노조원 병력</h3><span class="pill">${g.troops} / ${stats.cap}명 · 생산 ${pending}명</span></div><p class="muted small">병력은 박스를 소모한 뒤 인원별 생산 시간이 지나면 합류해요. 게임 밖에서도 시간이 흘러갑니다.</p><div class="gridstats"><div class="statbox"><small>공격력</small><strong>${number(stats.damage)}</strong></div><div class="statbox"><small>체력</small><strong>${number(stats.hp)}</strong></div><div class="statbox"><small>공격 간격</small><strong>${stats.interval.toFixed(2)}초</strong></div></div><div class="recruit-queue">${(g.recruitQueue||[]).length?(g.recruitQueue||[]).map((j,i)=>`<div class="recruit-job"><span>👷 ${j.amount}명 생산 ${i?'대기':'진행 중'}</span><b data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</b><div class="recruit-progress"><i data-progress-start="${j.startAt}" data-progress-end="${j.endAt}" style="width:${Math.max(0,Math.min(100,100*(serverNow()-j.startAt)/(j.endAt-j.startAt)))}%"></i></div></div>`).join(''):'<span class="muted small">현재 생산 대기 중인 병력이 없어요.</span>'}</div><div class="btnrow"><button data-recruit="1" class="btn btn-outline" ${g.boxes<45||g.troops+pending>=stats.cap?'disabled':''}>+1명 · 📦45</button><button data-recruit="5" class="btn btn-outline" ${g.boxes<225||g.troops+pending+5>stats.cap?'disabled':''}>+5명 · 📦225</button><button data-recruit="10" class="btn btn-outline" ${g.boxes<450||g.troops+pending+10>stats.cap?'disabled':''}>+10명 · 📦450</button></div></div></div>
<div><div class="card"><div class="card-head"><h3>🛠️ 진행 중인 업그레이드</h3><span class="tag">${g.upgrades.length} / ${bots}건</span></div><div class="slots">${jobs}</div><p class="section-note">연구는 서버 시간에 따라 완료돼요. 게임을 꺼도 시간이 흘러갑니다.</p></div><div class="card"><div class="card-head"><h3>📈 업그레이드 · 연구</h3><small class="muted">택배 박스 사용</small></div><div class="upgrade-grid">${rows}</div></div></div></div>`;}
function renderMine(){
  const el=$('tabMine'),g=state.me.game,m=g.mine,workers=g.workers;
  const chosen=workers.find(w=>w.id===selectedWorker)||workers[0];
  if(!workers.find(w=>w.id===selectedWorker))selectedWorker=chosen?.id;
  const topOpen=m.nodes.slice(0,5).some(n=>n.done);
  const boost=Math.max(0,g.shop.boostUntil-serverNow());
  const tile=(n,idx)=>{
    const active=workers.filter(w=>w.target===idx),done=n.done;
    const damage=active.reduce((sum,w)=>sum+5*Math.pow(2.4,w.level-1)*Math.pow(1.08,g.levels.mine-1)*(1+.03*g.captures.length),0);
    const remain=damage?timeLeft(n.hp/damage*1000):'';
    return `<button class="mine-tile ${done?'is-cleared':''} ${n.kind==='money'?'has-cash':''} ${active.length?'is-mining':''}"
      data-tile="${idx}" aria-label="${done?'빈 통로':`${n.kind==='box'?'택배 박스':'희귀 돈'} ${n.reward} · 작업자 드래그하여 채굴`}">
      ${!done?`<span class="mine-ore">${n.kind==='money'?'💰':'📦'}</span>
        <span class="mine-ore-count">${number(n.reward)}</span>
        <span class="mine-ore-health"><i style="width:${Math.max(0,100*n.hp/n.max)}%"></i></span>
        ${active.length?`<span class="mine-sparks">✧</span><span class="mine-ore-timer">${remain}</span>`:''}`:''}
    </button>`;
  };
  const workerMarker=(w)=>{const roommates=workers.filter(v=>v.x===w.x&&v.y===w.y),slot=roommates.findIndex(v=>v.id===w.id);const delta=(slot-(roommates.length-1)/2)*22;return `<button
    data-worker="${h(w.id)}"
    class="mine-worker ${w.id===selectedWorker?'selected':''} ${w.id===spawnedWorkerId?'just-summoned':''} ${w.target!==null?'mining-now':''}"
    style="left:${(w.x+.5)*20}%;top:${(w.y+.5)*100/9}%;margin-left:${Math.max(-65,Math.min(65,delta))}px;margin-top:${(slot%2)*9}px"
    aria-label="Lv.${w.level} 작업자, 드래그해서 채굴하거나 같은 등급 작업자에 놓아 합성">
    <span class="worker-avatar" style="background-image:url('${boksilSheets.own.toDataURL()}')"></span><span class="worker-level">Lv.${w.level}</span>
  </button>`;};
  el.innerHTML=`<div class="mine-map">
     <div class="mine-hud">
       <div class="mine-hud-stat"><b>👷 ${workers.length}/8</b><span>⚒ ${number(state.mineStats.rawDps)} DPS</span><span>📦 ${number(g.boxes)} · 💰 ${number(g.cash)}</span></div>
       <div class="mine-hud-actions">
        <span class="mine-sector">구역 ${m.zone+1}</span>
        <button data-modal="shop" class="mine-icon" title="상점">🛒</button>
        <button data-toggle-bomb class="mine-icon ${bombMode?'activated':''}" title="택배 폭탄" ${g.shop.bombs<1?'disabled':''}>💥<small>${g.shop.bombs}</small></button>
       </div>
     </div>
     <div class="mineboard-new" id="mineBoard" aria-label="드래그 기반 택배 채굴 지도">
       ${m.nodes.map(tile).join('')}
       ${Array.from({length:5},(_,x)=>`<button class="mine-tile start-lane ${x===2?'active-entry':'is-cleared'}" data-start="${x}" ${x!==2?'disabled':''}>${x===2?'<span>🚪</span>':''}</button>`).join('')}
       ${workers.map(workerMarker).join('')}
     </div>
     <div class="mine-tip">작업자를 자원으로 끌어 놓으면 채굴 · 같은 레벨 작업자끼리 겹치면 합성</div>
     <div class="mine-bottom">
       <button class="mine-summon" data-summon ${g.boxes<state.mineStats.summonCost||workers.length>=8?'disabled':''}>
        <span>👷 +</span> 작업자 소환 <small>📦 ${number(state.mineStats.summonCost)}</small>
       </button>
       ${topOpen?'<button class="mine-next" data-next-zone>다음 구역 ↑</button>':''}
       ${boost>0?`<span class="mine-boost">⚡ ${timeLeft(boost)}</span>`:''}
     </div>
   </div>`;
}
function warTargets(){
  const g=state.me.game,others=state.ranks.filter(r=>r.id!==state.me.id);
  return [
    {id:'npc-1',name:'서부 분류 센터',subtitle:g.captures.includes(1)?'점령 완료 · 채굴 +3%':'튜토리얼 NPC · 방어 병력 4명',disabled:g.captures.includes(1)},
    {id:'npc-2',name:'동부 허브 센터',subtitle:g.captures.includes(2)?'점령 완료 · 채굴 +3%':g.levels.center<4?'센터 Lv.4 해금':'방어 병력 28명',disabled:g.captures.includes(2)||g.levels.center<4},
    ...others.map(v=>({id:v.id,name:v.nickname,subtitle:`세력력 ${number(v.power)} · 노조원 ${v.troops}명`,disabled:v.shielded}))
  ];
}
function renderWar(){
  const el=$('tabWar'),g=state.me.game,finished=animation?.phase==='finished',inBattle=!!animation&&(animation.phase==='battle'||animation.phase==='intro');
  const initial=animation?.frames?.[0],current=animation?.current||initial;
  el.innerHTML=`<div class="war-scene">
    <div class="war-topbar">
      <div class="war-mini-badge own"><b>🛡 내 센터</b><span id="ownBattleHP">${number(current?.aC??state.unitStats.center)} HP</span></div>
      <div class="war-mini-badge opponent"><b>⚔ 상대 센터</b><span id="enemyBattleHP">${inBattle||finished?number(current?.bC??initial?.bC):'탐색 전'}</span></div>
    </div>
    <div id="warScroller" class="war-scroller ${inBattle||finished?'open':'closed'}" aria-label="좌우로 움직여 보는 파노라마 전장">
      <canvas id="warCanvas" width="1600" height="560" aria-label="양 진영과 병력이 이동하고 교전하는 횡스크롤 전쟁 장면"></canvas>
    </div>
    <div class="war-camera ${inBattle||finished?'':'hidden'}"><button data-camera="own">내 센터</button><button data-camera="fight">교전</button><button data-camera="enemy">상대</button></div><div class="war-bottombar">
      ${inBattle?`<div class="war-playback">
        <span id="battleHint">⏱ ${current?.t||0}초 · 아군 ${current?.a?.n||0}명 / 적군 ${current?.b?.n||0}명</span>
        <button class="war-pill" data-speed="${warPlaybackSpeed===1?2:1}">${warPlaybackSpeed}배속</button>
        <button class="war-pill" data-skip-battle>SKIP »</button>
      </div>`:finished?`<div class="war-finished">
        <strong>${animation.payload.result==='win'?'🏆 전투 승리':animation.payload.result==='lose'?'💔 전투 패배':'🤝 무승부'}</strong>
        <span>획득 📦 ${number(animation.payload.loot)} · 손실 ${animation.payload.lost}명</span>
        <button class="btn btn-gold" data-open-war>다른 센터 공격</button>
      </div>`:`<div class="war-ready">
        <div><strong>우리 물류센터를 지켜라</strong><small>상대를 선택하면 전장이 오른쪽으로 확장돼요</small></div>
        <button class="btn btn-gold" data-open-war>⚔️ 전투 시작</button>
      </div>`}
      ${!inBattle?'<button class="war-history-btn" data-open-war-log>📜 전투 기록</button>':''}
    </div>
    <span class="war-scroll-tip ${inBattle?'hidden':''}">${inBattle||finished?'↔ 손가락으로 좌우 스크롤':'적 센터를 공격하여 전장을 펼쳐 보세요'}</span>
  </div>`;
  const scroll=$('warScroller');
  if(scroll){scroll.scrollLeft=warScrollLeft;scroll.addEventListener('scroll',()=>warScrollLeft=scroll.scrollLeft,{passive:true});}
  drawBattle(inBattle||finished?current:null);
}
function openWarChooser(){
  if(!state)return;
  const g=state.me.game,targets=warTargets();
  if(!targets.some(v=>v.id===warTarget&&!v.disabled))warTarget=targets.find(v=>!v.disabled)?.id||'npc-1';
  const selected=targets.find(v=>v.id===warTarget);
  warCount=Math.max(1,Math.min(warCount,g.troops||1));
  showModal(`<div class="modal-header"><h2 class="modal-title">⚔️ 공격할 센터 선택</h2><button data-close class="modal-close">닫기 ✕</button></div>
    <div class="enemies">${targets.map(v=>`<button class="enemy ${warTarget===v.id?'active':''}" data-war-target="${h(v.id)}" ${v.disabled?'disabled':''}>
      <span>🏭</span><div style="flex:1"><div class="rank-title">${h(v.name)}</div><div class="sub">${h(v.subtitle)}</div></div><span class="enemy-status">${v.disabled?'보호·완료':warTarget===v.id?'선택됨':'선택'}</span>
    </button>`).join('')}</div>
    <div class="divider"></div>
    <div class="statrow"><span>출정 노조원 수</span><strong id="warCountView">${g.troops?warCount:0} / ${g.troops}명</strong></div>
    <input id="warSlider" aria-label="출정 병력 선택" type="range" min="1" max="${Math.max(1,g.troops)}" value="${warCount}" ${g.troops<1?'disabled':''}>
    <div class="btnrow" style="margin-top:14px"><button class="btn btn-gold btn-wide" data-start-battle ${!selected||selected.disabled||g.troops<1?'disabled':''}>⚔️ ${selected?h(selected.name):'상대'} 공격하기</button></div>
    <p class="section-note">전투 결과는 서버에서 판정하며, 전투 장면은 1배속·2배속으로 보거나 건너뛸 수 있어요.</p>`);
}
function openWarLog(){
  const bs=state?.battles||[];
  showModal(`<div class="modal-header"><h2 class="modal-title">📜 최근 전투 기록</h2><button data-close class="modal-close">닫기 ✕</button></div>
    ${bs.slice(0,16).map(b=>`<div class="history-row"><div><strong>${h(b.defender_name)} · ${b.result==='win'?'승리':b.result==='lose'?'패배':'무승부'}</strong>
      <small>${ago(b.at)} · 📦 ${number(b.loot)} 획득</small></div><button class="btn btn-outline" data-replay="${b.id}">리플레이</button></div>`).join('')||'<p class="muted">아직 전투 기록이 없어요.</p>'}`);
}
function renderServer(){const el=$('tabServer'),g=state.me.game,users=[...state.ranks].sort((a,b)=>rankMode==='total'?b.power-a.power:b.weekDelta-a.weekDelta);const chat=state.chat.slice(-30).reverse();const prevInput=document.activeElement?.id==='chatInput'?document.activeElement.value:null;
el.innerHTML=`<div class="page-title"><div><h2>우리 서버 🌐</h2><p>같은 서버 코드로 가입한 동료들과만 연결돼요.</p></div><span class="pill">${h(state.me.world)} · ${state.server.players}/50</span></div>
<div class="card"><div class="card-head"><h3>💬 서버 채팅</h3><span class="tag">최근 대화가 위에 표시돼요</span></div><div class="chat-list">${chat.map(m=>`<div class="chat-msg"><strong>${h(m.nickname)}</strong><small>${ago(m.created_at)}</small><p>${h(m.body)}</p></div>`).join('')||'<p class="muted small">첫 번째 메시지를 남겨보세요!</p>'}</div><form id="chatForm" class="chat-compose"><input id="chatInput" maxlength="300" placeholder="서버 채팅 작성" autocomplete="off"><button class="btn btn-gold" type="submit">보내기</button></form></div>
<div class="card"><div class="card-head"><h3>🏆 서버 랭킹</h3><span class="tag">${users.length}명 참가</span></div><div class="switch-tabs"><button data-rank="total" class="${rankMode==='total'?'active':''}">종합 세력력</button><button data-rank="week" class="${rankMode==='week'?'active':''}">주간 성장</button></div>${users.map((v,i)=>`<div class="ranking-row"><span class="rank-no">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span><div class="meta"><strong>${h(v.nickname)}${v.id===state.me.id?' (나)':''}</strong><small>승리 ${v.wins}회 · 병력 ${v.troops}명</small></div><span class="points">${rankMode==='week'?'+':''}${number(rankMode==='week'?v.weekDelta:v.power)}</span></div>`).join('')}<p class="section-note">종합 세력력: 채굴 25% · 방어 30% · 군사 35% · 점령 10%. 매주 월요일 한국시간 00시부터 성장 점수를 새로 계산해요.</p></div>
<div class="card"><div class="card-head"><h3>📜 최근 전쟁 소식</h3></div>${state.battles.slice(0,8).map(b=>`<div class="history-row"><div><strong>${h(b.defender_name)} 센터 ${b.result==='win'?'함락':'교전'}</strong><small>📦 ${number(b.loot)}개 약탈 · ${ago(b.at)}</small></div><button class="btn btn-outline" data-replay="${b.id}" style="font-size:11px;min-height:32px;padding:6px">보기</button></div>`).join('')||'<p class="muted">아직 전쟁 기록이 없어요.</p>'}</div>`;
if(prevInput!==null){const inp=$('chatInput');inp.value=prevInput;inp.focus();inp.setSelectionRange(prevInput.length,prevInput.length);}}
function showModal(content){$('modalContent').innerHTML=content;$('modalOverlay').classList.remove('hidden');}
function closeModal(){$('modalOverlay').classList.add('hidden');}
function openShop(){if(!state)return;const g=state.me.game;showModal(`<div class="modal-header"><h2 class="modal-title">💰 희귀 돈 상점</h2><button class="modal-close" data-close>닫기 ✕</button></div><div class="statrow"><span>사용 가능</span><strong class="goldtext">💵 ${number(g.cash)}원</strong></div><p class="section-note">희귀 돈은 채굴 자원 중 약 10%에서 등장하며, 상점 상품에만 사용해요.</p>${STORE.map(v=>{const owned=v.permanent&&g.shop[v.id];return `<div class="shop-item"><span class="si">${v.icon}</span><div class="info"><strong>${v.name}</strong><small>${v.description}</small></div><button class="btn ${owned?'btn-green':'btn-gold'}" data-buy="${v.id}" ${owned||g.cash<v.price?'disabled':''}>${owned?'보유':`${v.price}원`}</button></div>`}).join('')}<p class="section-note">소모품은 여러 번 구매 가능해요. 폭탄을 보유했다면 채굴 화면에서 사용할 수 있어요.</p>`);}
function openProfile(){if(!state)return;const g=state.me.game;showModal(`<div class="modal-header"><h2 class="modal-title">👤 플레이어 정보</h2><button data-close class="modal-close">닫기 ✕</button></div><div class="statrow"><span>닉네임</span><strong>${h(state.me.nickname)}</strong></div><div class="statrow"><span>서버 코드</span><strong>${h(state.me.world)}</strong></div><div class="statrow"><span>종합 세력력</span><strong>${number(state.me.power.total)}</strong></div><div class="statrow"><span>주간 성장</span><strong>+${number(state.me.weekDelta)}</strong></div><div class="statrow"><span>승리 / 패배</span><strong>${g.warWins}승 / ${g.warLosses}패</strong></div><button class="btn btn-outline btn-wide" style="margin-top:12px" data-guide>스토리·튜토리얼 다시 보기</button><button class="btn btn-outline btn-wide" style="margin-top:9px" data-logout>로그아웃</button><p class="section-note">PIN 번호는 복구되지 않아요. 다른 기기에서 로그인하려면 서버 코드·닉네임·PIN을 기억해 주세요.</p>`)}
function openMerge(){const ws=state?.me.game.workers||[];const pairs=[];for(let i=0;i<ws.length;i++)for(let j=i+1;j<ws.length;j++)if(ws[i].level===ws[j].level&&ws[i].level<6)pairs.push([ws[i],ws[j]]);showModal(`<div class="modal-header"><h2 class="modal-title">🔀 작업자 합성</h2><button class="modal-close" data-close>닫기 ✕</button></div><p class="section-note">같은 레벨 작업자 두 명을 합쳐 다음 레벨로 올려요. 채굴 중인 작업자도 합성하면 작업이 멈춰요.</p>${pairs.length?pairs.map(([a,b])=>`<div class="shop-item"><span class="si">👷</span><div class="info"><strong>Lv.${a.level} + Lv.${b.level} → Lv.${a.level+1}</strong><small>공격이 아닌 채굴 속도 약 2.4배</small></div><button class="btn btn-gold" data-merge="${a.id}|${b.id}">합성</button></div>`).join(''):'<p class="muted">합성할 작업자 조합이 없어요. 같은 레벨 작업자를 추가로 소환해 주세요.</p>'}`);}
function clearIntroTimers(){introTimers.forEach(clearTimeout);introTimers=[];}
function showTutorial(){
  if(!state)return;
  clearIntroTimers();showOnboard=true;
  $('onboardOverlay').classList.remove('hidden');
  renderTutorial();
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
    <div class="cinema-bubble bubble-head" id="cinemaHead">${h(story.head)}</div>
    <div class="cinema-bubble bubble-body" id="cinemaBody">${h(story.body)}</div>
    <div class="cinema-progress">${Array.from({length:5},(_,k)=>`<span class="${k<=i?'current':''}"></span>`).join('')}</div>
  </div>`:
  `<div class="onboard-page tutorial-page"><div class="eyebrow" style="text-align:center;padding:10px">🎮 게임 조작법 ${i-4} / 4</div><div class="onboard-panel"><img src="assets/tutorial-${i-4}.webp" alt="튜토리얼 ${i-4}"></div></div>`;
  $('onboardCounter').textContent=isStory?`${i+1} / 5`:`${i-4} / 4`;
  $('onboardNext').hidden=isStory;
  $('onboardNext').textContent=i===8?'게임 시작하기 →':'다음 →';
  $('onboardSkip').textContent=isStory?'SKIP »':'건너뛰기';
  if(isStory){
    introTimers.push(setTimeout(()=>$('cinemaHead')?.classList.add('visible'),450));
    introTimers.push(setTimeout(()=>$('cinemaBody')?.classList.add('visible'),2250));
    introTimers.push(setTimeout(()=>{if(!showOnboard)return;onboardStep=Math.min(8,onboardStep+1);renderTutorial();},5800));
  }
}
async function completeTutorial(){clearIntroTimers();showOnboard=false;$('onboardOverlay').classList.add('hidden');await doAction('onboard/done');}
function setTab(tab){if(!['center','mine','war','server'].includes(tab))return;selectedTab=tab;render();window.scrollTo({top:0,behavior:'smooth'});}

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
function drawBattle(frame){
  const c=$('warCanvas');if(!c)return;
  const x=c.getContext('2d'),W=c.width,H=c.height;
  x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);
  if(visualAssets.terrain.complete&&visualAssets.terrain.naturalWidth)x.drawImage(visualAssets.terrain,0,0,W,H);
  else {const gd=x.createLinearGradient(0,0,0,H);gd.addColorStop(0,'#557aa7');gd.addColorStop(.6,'#ab9e8d');gd.addColorStop(.6,'#716a69');gd.addColorStop(1,'#323846');x.fillStyle=gd;x.fillRect(0,0,W,H);}
  x.translate(0,-55);
  function drawBase(img,bx,isEnemy,centerHP,maxHP,wall,turret){
    if(img.complete&&img.naturalWidth){
      if(isEnemy){x.save();x.filter='hue-rotate(305deg) saturate(.85)';x.translate(bx+370,0);x.scale(-1,1);x.drawImage(img,0,365,250,125);x.restore();}
      else x.drawImage(img,bx,365,250,125);
    } else {
      x.fillStyle=isEnemy?'#7c4255':'#376d8e';x.fillRect(bx+36,285,300,198);
      x.fillStyle='#b7bec7';x.fillRect(bx+310,338,43,115);
      x.fillStyle='#e8b86d';x.fillRect(bx+124,420,90,60);
    }
    const color=isEnemy?'#ff7c87':'#73e4de',hx=bx+(isEnemy?120:10);
    x.fillStyle='#0d1727ce';x.fillRect(hx,324,238,22);
    x.fillStyle=color;x.fillRect(hx+4,329,Math.max(0,230*centerHP/Math.max(1,maxHP)),12);
    x.fillStyle='#f8f0dc';x.font='bold 16px system-ui';
    x.fillText(isEnemy?'적 센터':'내 센터',hx+4,312);
    if(wall<=0||turret<=0){x.strokeStyle='#ff887b';x.lineWidth=3;x.beginPath();x.moveTo(bx+290,361);x.lineTo(bx+337,423);x.moveTo(bx+337,361);x.lineTo(bx+290,423);x.stroke();}
  }
  const aMax=animation?.aMax||state?.unitStats?.center||1000,bMax=animation?.bMax||1000;
  drawBase(visualAssets.own,28,false,frame?.aC??aMax,aMax,frame?.aW??450,frame?.aT??300);
  if(frame)drawBase(visualAssets.enemy,W-400,true,frame.bC,bMax,frame.bW,frame.bT);
  if(!frame)return;
  if($('ownBattleHP'))$('ownBattleHP').textContent=number(frame.aC)+' HP';
  if($('enemyBattleHP'))$('enemyBattleHP').textContent=number(frame.bC)+' HP';
  const an=frame.a?.n||0,bn=frame.b?.n||0,ax=(frame.a?.x||.13)*W,bx=(frame.b?.x||.87)*W;
  function unit(px,py,blue,index){
    const step=Math.floor((frame.t||0)*7+index)%4;
    x.save();x.imageSmoothingEnabled=false;
    x.fillStyle='#17132566';x.beginPath();x.ellipse(px+10,py+24,13,4,0,0,Math.PI*2);x.fill();
    if(!blue){x.translate(px+23,py-16);x.scale(-1,1);}else x.translate(px-10,py-16);
    x.drawImage(blue?boksilSheets.own:boksilSheets.enemy,step*24,0,24,24,0,0,42,42);x.restore();
  }
  for(let i=0;i<Math.min(an,27);i++)unit(ax-9-(i%5)*20,454-Math.floor(i/5)*17,true,i);
  for(let i=0;i<Math.min(bn,27);i++)unit(bx+5+(i%5)*20,454-Math.floor(i/5)*17,false,i);
  if(an&&bn&&bx-ax<.12){
    const cx=(ax+bx)/2+Math.sin((frame.t||0)*8)*10;
    for(let i=0;i<9;i++){
      x.strokeStyle=i%2?'#ffe899':'#ff8e60';x.lineWidth=i%3+1;x.beginPath();
      const theta=i*2.399+(frame.t||0)*.4;
      x.moveTo(cx,430);x.lineTo(cx+Math.cos(theta)*(14+i*3),430+Math.sin(theta)*(14+i*3));x.stroke();
    }
  }

  function shot(from,to,t,blue){
    const u=((t%1.2)+1.2)%1.2/1.2,px=from+(to-from)*Math.min(1,u*1.6),py=366+(440-366)*Math.min(1,u*1.6)-Math.sin(Math.min(1,u*1.6)*Math.PI)*46;
    x.strokeStyle=blue?'#9af8ef':'#ffc693';x.lineWidth=3;x.beginPath();x.moveTo(px-(to-from)*.025,py);x.lineTo(px,py);x.stroke();
    x.fillStyle='#fff4bb';x.beginPath();x.arc(px,py,5,0,Math.PI*2);x.fill();
    if(u<.15){x.fillStyle='#fff1a4';x.beginPath();x.arc(from,366,10*(1-u/.15),0,Math.PI*2);x.fill();}
    if(u>.63){const v=(u-.63)/.37;x.strokeStyle=`rgba(255,205,116,${1-v})`;x.lineWidth=3;x.beginPath();x.arc(to,440,8+28*v,0,Math.PI*2);x.stroke();
      for(let j=0;j<7;j++){const a=j*2.4;x.fillStyle=j%2?'#ffd982':'#ff9164';x.fillRect(to+Math.cos(a)*v*32,440+Math.sin(a)*v*25,4,4);}}
  }
  if(animation?.phase==='battle'){
    if(frame.aT>0&&bn&&frame.b.x<=.50)shot(233,bx,frame.t,true);
    if(frame.bT>0&&an&&frame.a.x>=.50)shot(W-233,ax,frame.t+.6,false);
    if(an&&frame.a.x>=.725||bn&&frame.b.x<=.275){const hit=an&&frame.a.x>=.725?W-335:335;x.fillStyle='#ffe299';for(let i=0;i<8;i++){const v=(frame.t*2+i*.17)%1;x.fillRect(hit+Math.cos(i)*v*30,422+Math.sin(i)*v*35,3,5);}}
  }
  function structureBar(px,py,value,max,color){x.fillStyle='#152033dd';x.fillRect(px,py,150,13);x.fillStyle=color;x.fillRect(px+2,py+2,146*Math.max(0,Math.min(1,value/max)),9);}
  structureBar(90,492,frame.aW,animation?.frames[0].aW||450,'#91bde5');structureBar(1360,492,frame.bW,animation?.frames[0].bW||450,'#f3a9a0');
  structureBar(90,512,frame.aT,animation?.frames[0].aT||300,'#f2cc70');structureBar(1360,512,frame.bT,animation?.frames[0].bT||300,'#f2cc70');

  x.textAlign='center';x.fillStyle='#fff3cb';x.font='bold 15px system-ui';
  if(an)x.fillText(`아군 ${an}`,ax-28,394);
  if(bn)x.fillText(`적군 ${bn}`,bx+28,394);
  x.textAlign='left';
}
function finishBattle(){
  if(!animation||animation.phase==='finished')return;
  animation.current=animation.frames.at(-1)||animation.current;
  animation.phase='finished';animating=false;
  const p=animation.payload;
  renderWar();
  toast(`${p.result==='win'?'🏆 승리':p.result==='lose'?'💔 패배':'🤝 무승부'} · 📦 ${number(p.loot)} 획득 · 병력 ${p.lost}명 손실`);
}
function setBattleSpeed(speed){
  if(!animation||animation.phase!=='battle')return;
  const now=performance.now();
  animation.offset+=(now-animation.anchor)/1000*warPlaybackSpeed;
  animation.anchor=now;warPlaybackSpeed=speed;
  const label=$('battleHint');if(label)label.textContent=`▶ ${speed}배속`;
  const btn=document.querySelector('[data-speed]');
  if(btn){btn.textContent=speed+'배속';btn.dataset.speed=String(speed===1?2:1);}
}
function playBattle(payload){
  if(!payload?.frames?.length){toast('전투 기록이 비어 있어요.',true);return;}
  selectedTab='war';warScrollLeft=0;warPlaybackSpeed=1;animating=true;
  animation={frames:payload.frames,current:payload.frames[0],aMax:payload.frames[0].aC||1000,bMax:payload.frames[0].bC||1000,
    offset:0,anchor:0,phase:'intro',payload};
  render();
  const overlay=$('battleTransition');overlay?.classList.remove('hidden');
  setTimeout(()=>{
    if(!animation||animation.payload!==payload)return;
    overlay?.classList.add('hidden');
    animation.phase='battle';animation.anchor=performance.now();animation.manualCamera=false;
    renderWar();
    const run=()=>{
      if(!animation||!animating||animation.phase!=='battle')return;
      const seconds=animation.offset+(performance.now()-animation.anchor)/1000*warPlaybackSpeed;
      let idx=0;while(idx<animation.frames.length-1&&animation.frames[idx+1].t<=seconds)idx++;
      const f=animation.frames[idx],next=animation.frames[Math.min(idx+1,animation.frames.length-1)];
      const alpha=next.t>f.t?Math.max(0,Math.min(1,(seconds-f.t)/(next.t-f.t))):0;
      animation.current={...f,t:seconds,a:{...f.a,x:f.a.x+(next.a.x-f.a.x)*alpha},b:{...f.b,x:f.b.x+(next.b.x-f.b.x)*alpha}};drawBattle(animation.current);
      const sc=$('warScroller');if(sc&&!animation.manualCamera&&seconds>2){const front=animation.current.a.n?animation.current.a.x:animation.current.b.x;sc.scrollLeft=Math.max(0,front*sc.scrollWidth-sc.clientWidth*.48);}
      const hint=$('battleHint');if(hint)hint.textContent=`⏱ ${seconds.toFixed(1)}초 · 아군 ${animation.current.a.n}명 / 적군 ${animation.current.b.n}명`;
      if(seconds>=animation.frames.at(-1).t)finishBattle();
      else requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  },1000);
}
async function replay(id){try{const v=await api('/api/battle/'+id);closeModal();playBattle(v.battle);}catch(e){toast(e.message,true)}}
let suppressMineClickUntil=0;
function handleAction(e){if(Date.now()<suppressMineClickUntil&&e.target.closest('#tabMine'))return;const btn=e.target.closest('button');if(!btn||!state)return;
if(btn.dataset.tab){if(miningDragging)return;setTab(btn.dataset.tab);return}if(btn.dataset.modal==='shop'){openShop();return}if(btn.dataset.close!==undefined){closeModal();return}if(btn.dataset.guide!==undefined){closeModal();onboardStep=0;showTutorial();return}if(btn.dataset.logout!==undefined){api('/api/logout','POST',{}).then(()=>location.reload()).catch(err=>toast(err.message,true));return}
if(btn.dataset.upgrade){doAction('upgrade/start',{key:btn.dataset.upgrade});return}if(btn.dataset.recruit){doAction('troops/recruit',{amount:Number(btn.dataset.recruit)});return}if(btn.dataset.summon!==undefined){doAction('worker/summon');return}if(btn.dataset.worker){selectedWorker=btn.dataset.worker;renderMine();return}if(btn.dataset.openMerge!==undefined){openMerge();return}if(btn.dataset.merge){const [a,b]=btn.dataset.merge.split('|');closeModal();doAction('worker/merge',{a,b});return}
if(btn.dataset.toggleBomb!==undefined){bombMode=!bombMode;renderMine();return}if(btn.dataset.tile!==undefined){const idx=Number(btn.dataset.tile),w=state.me.game.workers.find(v=>v.id===selectedWorker)||state.me.game.workers[0],n=state.me.game.mine.nodes[idx];if(bombMode&&!n.done){bombMode=false;doAction('shop/bomb',{idx});return}if(n.done)doAction('mine/move',{worker:w.id,x:idx%5,y:Math.floor(idx/5)});else doAction('mine/dispatch',{worker:w.id,idx});return}
if(btn.dataset.start!==undefined){doAction('mine/move',{worker:selectedWorker,x:Number(btn.dataset.start),y:8});return}if(btn.dataset.nextZone!==undefined){doAction('mine/next-zone');return}
if(btn.dataset.buy){const item=btn.dataset.buy;closeModal();doAction('shop/buy',{item});return}
if(btn.dataset.bomb!==undefined){const idx=Number(btn.dataset.bomb);closeModal();doAction('shop/bomb',{idx});return}
if(btn.dataset.openWar!==undefined){openWarChooser();return}if(btn.dataset.openWarLog!==undefined){openWarLog();return}if(btn.dataset.warTarget){warTarget=btn.dataset.warTarget;openWarChooser();return}if(btn.dataset.startBattle!==undefined){closeModal();doAction('battle/start',{amount:warCount,target:warTarget});return}if(btn.dataset.camera){if(animation)animation.manualCamera=true;const sc=$('warScroller');if(sc)sc.scrollTo({left:btn.dataset.camera==='own'?0:btn.dataset.camera==='enemy'?sc.scrollWidth:(sc.scrollWidth-sc.clientWidth)/2,behavior:'smooth'});return}if(btn.dataset.speed){setBattleSpeed(Number(btn.dataset.speed));return}if(btn.dataset.skipBattle!==undefined){finishBattle();return}if(btn.dataset.replay){replay(btn.dataset.replay);return}if(btn.dataset.rank){rankMode=btn.dataset.rank;renderServer();return}
}
function endMineDrag(e,cancelled=false){
  const dragging=miningDragging;
  if(!dragging||dragging.pointerId!==e.pointerId)return;
  const sprite=document.querySelector('.mine-worker.dragging');
  const drop=!cancelled?document.elementFromPoint(e.clientX,e.clientY):null;
  const nearby=[...document.querySelectorAll('.mine-worker:not(.dragging)')].map(el=>{const r=el.getBoundingClientRect();return {el,d:Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2))};}).filter(v=>v.d<27).sort((a,b)=>a.d-b.d);const other=nearby[0]?.el||drop?.closest('.mine-worker'),tile=drop?.closest('.mine-tile');
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
    if(!a||!b||a.level!==b.level||a.level>=6){toast('같은 레벨의 작업자를 겹쳐 놓으면 합성할 수 있어요.',true);return;}
    doAction('worker/merge',{a:a.id,b:b.id});return;
  }
  if(tile?.dataset.tile!==undefined){
    const idx=Number(tile.dataset.tile),node=state.me.game.mine.nodes[idx];
    if(node.done)doAction('mine/move',{worker:dragging.id,x:idx%5,y:Math.floor(idx/5)});
    else if(bombMode){bombMode=false;doAction('shop/bomb',{idx});}
    else doAction('mine/dispatch',{worker:dragging.id,idx});
    return;
  }
  if(tile?.dataset.start!==undefined && Number(tile.dataset.start)===2){
    doAction('mine/move',{worker:dragging.id,x:2,y:8});return;
  }
  toast('자원이나 빈 통로 위에 작업자를 내려놓아 주세요.');
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
$('modalOverlay').addEventListener('click',e=>{if(e.target===$('modalOverlay'))closeModal()});$('cashResource').addEventListener('click',openShop);$('boxResource').addEventListener('click',()=>setTab('mine'));$('guideBtn').addEventListener('click',()=>{onboardStep=0;showTutorial()});$('profileBtn').addEventListener('click',openProfile);
$('onboardNext').addEventListener('click',()=>{if(onboardStep>=8)completeTutorial();else{onboardStep++;renderTutorial()}});$('onboardSkip').addEventListener('click',()=>{if(onboardStep<5){onboardStep=5;renderTutorial();}else completeTutorial()});
document.addEventListener('input',e=>{if(e.target.id==='warSlider'){warCount=Number(e.target.value);if($('warCountView'))$('warCountView').textContent=warCount+' / '+(state?.me.game.troops||0)+'명';}});
document.addEventListener('submit',async e=>{if(e.target.id==='chatForm'){e.preventDefault();const input=$('chatInput'),message=input.value.trim();if(!message)return;try{await api('/api/chat','POST',{message,requestId:crypto.randomUUID()});input.value='';await loadState({silent:true});toast('채팅을 전송했어요.')}catch(err){toast(err.message,true)}return;}
if(e.target.id==='authForm'){e.preventDefault();const pin=$('pinField').value,nickname=$('nickField').value.trim(),world=$('worldField').value.trim().toUpperCase();const submit=$('authSubmit');submit.disabled=true;try{await api('/api/'+authMode,'POST',{pin,nickname,world});await loadState();}catch(err){toast(err.message,true)}finally{submit.disabled=false;}return;}});
$('signupTab').addEventListener('click',()=>{authMode='register';$('signupTab').classList.add('active');$('loginTab').classList.remove('active');$('authSubmit').textContent='혁명 시작하기 →';});$('loginTab').addEventListener('click',()=>{authMode='login';$('loginTab').classList.add('active');$('signupTab').classList.remove('active');$('authSubmit').textContent='기존 계정으로 로그인 →';});
setInterval(()=>{if(!state||document.hidden||showOnboard||!$('modalOverlay').classList.contains('hidden')||animating||miningDragging)return;loadState({silent:true});},5000);

let timerRefreshAt=0;
setInterval(()=>{
 if(!state||document.hidden||showOnboard)return;
 const now=serverNow(),g=state.me.game;
 document.querySelectorAll('[data-live-end]').forEach(el=>el.textContent=timeLeft(Number(el.dataset.liveEnd)-now));
 document.querySelectorAll('[data-progress-end]').forEach(el=>{const a=Number(el.dataset.progressStart),b=Number(el.dataset.progressEnd);el.style.width=Math.max(0,Math.min(100,100*(now-a)/Math.max(1,b-a)))+'%';});
 if(selectedTab==='mine'&&!miningDragging){
   document.querySelectorAll('.mine-tile[data-tile]').forEach(el=>{
     const idx=Number(el.dataset.tile),n=g.mine.nodes[idx];if(!n||n.done)return;
     const workers=g.workers.filter(w=>w.target===idx),rate=workers.reduce((sum,w)=>sum+5*Math.pow(2.4,w.level-1)*Math.pow(1.08,g.levels.mine-1)*(1+.03*g.captures.length),0);
     const elapsed=Math.max(0,(now-state.serverTime)/1000),boosted=Math.max(0,Math.min(elapsed,(g.shop.boostUntil-state.serverTime)/1000)),hp=Math.max(0,n.hp-rate*(elapsed+boosted));
     const bar=el.querySelector('.mine-ore-health i');if(bar)bar.style.width=(100*hp/n.max)+'%';
     const timer=el.querySelector('.mine-ore-timer');if(timer)timer.textContent=hp<=0?'수령 중':timeLeft(hp/(rate*(g.shop.boostUntil>now?2:1))*1000);
   });
 }
 const due=[...(g.recruitQueue||[]),...g.upgrades].some(j=>j.endAt<=now);
 if(due&&!miningDragging&&!animating&&now-timerRefreshAt>1200){timerRefreshAt=now;loadState({silent:true});}
},150);

loadState({silent:true});

$('enterSignup').addEventListener('click',()=>{$('auth').classList.add('auth-open');$('signupTab').click();});
$('enterLogin').addEventListener('click',()=>{$('auth').classList.add('auth-open');$('loginTab').click();});
$('titleBack').addEventListener('click',()=>$('auth').classList.remove('auth-open'));