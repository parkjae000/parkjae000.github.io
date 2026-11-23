import {miningAttention,attackNotices,unreadAttacks,rankPlayers,battleNames,lastSeenLabel} from './attention.js?v=20261123-v201-alerts2';
import {loadSceneAssets,paintMiner} from './scene-assets.js?v=20261123-v201-alerts2';
import {chatNotification} from './social.js?v=20261123-v201-alerts2';
import {upgradeCost,researchMax,miningResearchEffect,combatResearchEffect,marchPower} from './balance.js?v=20261123-v201-alerts2';
import {FORMATIONS,TROOP_ROLES,buildFormation,formationFactors} from './formation.js?v=20261123-v201-alerts2';
import {HEALTH_KINDS,battleHealthMarkup,buildBattleEvents,paintBattle} from './battle-scene.js?v=20261123-v201-alerts2';
const RELEASE='20261123-v201-alerts2';
const API_BASE=/^(www\.)?jparkapps\.xyz$|^parkjae000\.github\.io$/.test(location.hostname)?'https://pgupfypoxhjawtonnzzk.supabase.co/functions/v1/kurly-apocalypse':location.hostname.endsWith('.supabase.co')?location.origin+'/functions/v1/kurly-apocalypse':'';
const TOKEN_KEY='ka_game_session_v1',ADMIN_KEY='ka_admin_session_v1';
const SUPPORT_ACCOUNT='3333170215737';
let warHero='',warFormation='balanced',marchContext='war',warehousePage='items',recruiting=false,recruitReady=null,researchGroup='center',shopGroup='equipment',adminState=null,popupPending=false;
const $=id=>document.getElementById(id);
const number=v=>new Intl.NumberFormat('ko-KR').format(Math.round(Number(v)||0));
const h=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const timeLeft=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return s>=3600?`${Math.floor(s/3600)}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`:`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const ago=ms=>{const t=new Date(ms);return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`};
let introTimers=[],warPlaybackSpeed=1,miningDragging=null,miningSettling=null,spawnedWorkerId=null,warPanelOpen=false,warScrollLeft=0;
let state=null,selectedTab='center',selectedWorker='w1',authMode='register',rankMode='total',warMode='raid',warTarget='',warCount=12,showOnboard=false,onboardStep=0,animation=null,animating=false, lastSnapshot=0,serverOffset=0,toastTimer=null,lastPageRendered='';
let introAdvanceBusy=false,guidePending=false,guideAccount='',guideStage='',guidePaintKey='';
let stateLoadSequence=0;
let recruitPool='normal',serverPage='chat';
let shopPurchasing=false;const shopDisclosure={normal:false,rare:false};
let socialHeartbeatAt=0,lastSocialAt=0,socialBusy=false,lastInteractionAt=Date.now(),lastAway=null,chatExpanded=false,chatForceBottom=false;
const presenceLabels={online:'접속 중',away:'자리비움',offline:'오프라인'};
function presenceDot(status='offline'){const safe=presenceLabels[status]?status:'offline';return `<i class="presence-dot ${safe}" role="img" aria-label="${presenceLabels[safe]}" title="${presenceLabels[safe]}"></i>`;}
function warReadKey(){return 'ka_war_read_v1:'+state.me.world+':'+state.me.id;}
function readWarKeys(){try{return JSON.parse(localStorage.getItem(warReadKey())||'[]');}catch{return [];}}
function currentAttackNotices(){return attackNotices(state.me.game,state.incomingAttacks||[]);}
function markAttackRead(mode){const keys=new Set(readWarKeys());for(const n of currentAttackNotices().filter(n=>n.mode===mode))keys.add(n.key);localStorage.setItem(warReadKey(),JSON.stringify([...keys].slice(-400)));syncAttention();}
function badgeMarkup(count,attribute='data-war-badge'){return `<b class="attention-badge" ${attribute} ${count?'':'hidden'}>${count>99?'99+':count||''}</b>`;}
function syncAttention(){if(!state)return;const mine=miningAttention(state.me.game),war=unreadAttacks(currentAttackNotices(),readWarKeys());
 document.querySelectorAll('[data-mine-badge]').forEach(b=>{b.hidden=!mine.count;b.textContent='!';b.title=mine.reason;});
 document.querySelectorAll('[data-war-badge]').forEach(b=>{b.hidden=!war.total;b.textContent=war.total>99?'99+':war.total;});
 for(const mode of ['raid','conquest'])document.querySelectorAll(`[data-attack-badge="${mode}"]`).forEach(b=>{b.hidden=!war[mode];b.textContent=war[mode]>99?'99+':war[mode];});
 const nav=document.querySelector('[data-tab="mine"]');if(nav)nav.setAttribute('aria-label',mine.count?'택배 채굴 · '+mine.reason:'택배 채굴');
 const wn=document.querySelector('[data-tab="war"]');if(wn)wn.setAttribute('aria-label',war.total?'출정 · 새 피격 알림 '+war.total+'개':'출정');
}
function defenseAlertsMarkup(mode){const all=currentAttackNotices().filter(n=>n.mode===mode).slice(0,4);return all.length?`<section class="defense-alerts"><h3>${mode==='raid'?'내 센터 피격 알림':'내 정복지 피격 알림'}</h3>${all.map(n=>`<article><strong>${h(n.title)}</strong><p>${h(n.body)}</p><small>${ago(n.at)}</small>${n.phase==='finished'?`<button class="btn btn-outline" data-replay="${h(n.battleId)}">전투 보기</button>`:''}</article>`).join('')}</section>`:'';}
function presenceInfo(v){const status=v.presence||'offline';return `<small class="presence-status">${presenceLabels[status]||'오프라인'}${status==='online'?'':' · '+h(lastSeenLabel(v.lastSeenAt,serverNow()))}</small>`;}
function battleLabels(){return battleNames(animation?.payload,state?.battles,state?.ranks);}
function syncChatViewport(){if(!state)return;const app=$('app'),active=selectedTab==='server'&&serverPage==='chat';app.classList.toggle('server-chat-open',active);document.body.classList.toggle('chat-screen',active);if(!active){app.classList.remove('chat-keyboard');return;}const vh=window.visualViewport?.height||innerHeight,keyboard=vh<innerHeight-120&&document.activeElement?.id==='chatInput';app.classList.toggle('chat-keyboard',keyboard);app.style.setProperty('--chat-vh',vh+'px');app.style.setProperty('--nav-h',($('app').querySelector('.navbar')?.getBoundingClientRect().height||70)+'px');}
window.addEventListener('resize',syncChatViewport);window.visualViewport?.addEventListener('resize',syncChatViewport);
function syncChatBadge(){
 if(!state)return;const key='ka_chat_read_v1:'+state.me.world+':'+state.me.id;
 const latest=chatNotification(state.chat||[],state.me.id,0).latest,saved=localStorage.getItem(key);let seen=saved===null?latest:Number(saved)||0;
 const list=document.querySelector('.chat-list'),atBottom=!list||list.scrollHeight-list.scrollTop-list.clientHeight<80;const visible=selectedTab==='server'&&serverPage==='chat'&&atBottom&&!document.hidden&&!chatComposing&&!showOnboard&&$('modalOverlay').classList.contains('hidden');
 if(visible)seen=Math.max(seen,latest);if(saved===null||visible)localStorage.setItem(key,String(seen));
 const unread=chatNotification(state.chat||[],state.me.id,seen).unread;
 document.querySelectorAll('[data-chat-badge]').forEach(b=>{b.hidden=!unread;b.textContent=unread>30?'30+':unread;});
 const nav=document.querySelector('[data-tab="server"]');if(nav)nav.setAttribute('aria-label',unread?`서버 · 새 채팅 ${unread}개`:'서버');
}
async function refreshSocial(){
 if(!state||socialBusy)return;socialBusy=true;const actor=state.me.id,away=document.hidden||!document.hasFocus()||Date.now()-lastInteractionAt>=120000;
 try{const out=await api('/api/social','POST',{away});if(state?.me.id!==actor)return;
  const current=chatNotification(state.chat||[],actor,0).latest,next=chatNotification(out.chat||[],actor,0).latest;if(next>=current)state.chat=out.chat;
  for(const p of out.presence||[]){const user=state.ranks.find(v=>v.id===p.id);if(user){user.presence=p.status;user.lastSeenAt=p.lastSeenAt||0;}}
  socialHeartbeatAt=Date.now();lastSocialAt=Date.now();lastAway=away;
  if(selectedTab==='server'&&!chatComposing)renderServer();syncChatBadge();
 }catch{}finally{socialBusy=false;}
}
for(const event of ['pointerdown','pointermove','keydown','touchstart'])document.addEventListener(event,()=>{lastInteractionAt=Date.now();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)lastInteractionAt=Date.now();refreshSocial();});
window.addEventListener('focus',()=>{lastInteractionAt=Date.now();refreshSocial();});
window.addEventListener('blur',()=>refreshSocial());
setInterval(()=>{const now=Date.now(),away=document.hidden||!document.hasFocus()||now-lastInteractionAt>=120000;if(state&&(away!==lastAway||now-socialHeartbeatAt>20000||(!document.hidden&&now-lastSocialAt>6500)))refreshSocial();},5000);

const SHOP_DETAILS={auto:{icon:'⚙️',image:'worker-cute',description:'아래쪽 자원부터 이동하며 자동 채굴합니다.'},bot:{icon:'🛠',image:'panel-workshop',description:'스탭 2 합류 · 연구 2개를 동시에 진행합니다.'},boost:{icon:'⚡',image:'ore-money',description:'10분 동안 채굴 속도 2배'},forklift:{icon:'🔒',image:'forklift-cute',description:'추후 업데이트 예정'}};
const UPGRADES=[{key:'wallReflect',name:'방벽 반사 피해',icon:'🛡',desc:'방벽이 받은 피해의 일부를 공격자에게 반사'},{key:'wallRepair',name:'방벽 자가 수리',icon:'🧱',desc:'첫 연구 시 시간당 최대 방벽 HP의 1% 수리'},{key:'troopCritChance',name:'사원 치명타 확률',icon:'🎯',desc:'단계당 치명타 확률 +2%p'},{key:'troopCritDmg',name:'사원 치명타 피해',icon:'💥',desc:'단계당 치명타 피해 +10%p'},{key:'troopLeech',name:'사원 피흡',icon:'💚',desc:'단계당 사원이 가한 피해의 1% 회복'},{key:'laborCost',name:'일용직 인건비 감소',icon:'👷',desc:'단계당 소환 비용 4% 감소 · 최대 36%'},{key:'lossDiscovery',name:'로스 발견',icon:'📦',desc:'박스·희귀 돈 획득량 단계당 +10%'},{key:'careerLevel',name:'경력 증가',icon:'🎓',desc:'기본 소환 레벨 +1 · 최대 Lv.6'},{key:'mergeLuck',name:'경력 확률',icon:'✨',desc:'합성 시 2레벨 상승 확률 단계당 +3%'},{key:'center',name:'센터 레벨',icon:'🏢',desc:'센터 체력 및 다른 연구 상한 증가'},{key:'mine',name:'채굴 효율',icon:'⛏️',desc:'일용직 채굴 속도 +8%'},{key:'troopAtk',name:'사원 공격력',icon:'⚔️',desc:'사원 공격 피해 +8%'},{key:'troopHp',name:'사원 체력',icon:'❤️',desc:'사원 최대 체력 +10%'},{key:'troopSpeed',name:'사원 공격속도',icon:'⚡',desc:'사원 공격속도 +3%'},{key:'capacity',name:'사원 수용 한도',icon:'👥',desc:'최대 사원 +8명'},{key:'wall',name:'방벽 내구도',icon:'🛡️',desc:'방벽 체력 +12%'},{key:'turretDmg',name:'포탑 공격력',icon:'🎯',desc:'포탑 공격 피해 +10%'},{key:'turretSpeed',name:'포탑 공격속도',icon:'💥',desc:'포탑 공격속도 +4%'}];
const storyCaptions=[{"speaker": "복슬이", "head": "“센터가 또 커졌네. 우리가 밤낮없이 옮긴 박스 덕분이지!”", "reply": "동료 사원", "body": "“새 창고에 새 설비까지… 그럼 이번엔 월급도 오르겠지?”"}, {"speaker": "동료 사원", "head": "“또 그대로야. 늘어난 이익은 윗사람들이 전부 챙겼대.”", "reply": "복슬이", "body": "“센터는 이렇게 커졌는데, 우리 월급만 그대로라고? 더는 못 참아!”"}, {"speaker": "복슬이", "head": "“이 센터, 우리가 접수한다! 오늘부터 반란이야!”", "reply": "사원들", "body": "“좋아! 남 좋은 일만 시키던 센터는 이제 끝이야!”"}, {"speaker": "사원들", "head": "“센터 점령 완료! 복슬이, 이제 네가 센터장이야!”", "reply": "복슬이 센터장", "body": "“좋아! 일용직은 박스를 캐고, 사원들은 전투를 준비해!”"}, {"speaker": "복슬이 센터장", "head": "“저쪽 창고에도 우리가 벌어 준 박스가 산더미네?”", "reply": "사원들", "body": "“다른 센터까지 전부 약탈하자! 진격하라!”"}];
async function api(endpoint,method='GET',body){const r=await fetch(API_BASE+endpoint,{method,credentials:API_BASE?'omit':'same-origin',headers:{...(body?{'Content-Type':'application/json'}:{}),...(localStorage.getItem(endpoint.startsWith('/api/admin/')?ADMIN_KEY:TOKEN_KEY)?{Authorization:'Bearer '+localStorage.getItem(endpoint.startsWith('/api/admin/')?ADMIN_KEY:TOKEN_KEY)}:{})},body:body?JSON.stringify(body):undefined});const v=await r.json().catch(()=>({error:'서버 응답을 읽지 못했어요.'}));if(!r.ok){const error=new Error(v.error||'요청에 실패했어요.');error.status=r.status;throw error;}if(v.adminToken)localStorage.setItem(ADMIN_KEY,v.adminToken);if(v.token)localStorage.setItem(TOKEN_KEY,v.token);if(endpoint==='/api/logout')localStorage.removeItem(TOKEN_KEY);return v;}
function toast(message,error=false){const el=$('toast');el.textContent=message;el.classList.toggle('error',error);el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800);}
async function loadState({silent=false,resumeBattle=true}={}){const loadId=++stateLoadSequence;try{const v=await api('/api/state');if(loadId!==stateLoadSequence)return null;state=v;lastSocialAt=Date.now();lastSnapshot=Date.now();serverOffset=v.serverTime-Date.now();$('auth').classList.add('hidden');$('app').classList.remove('hidden');if(!v.me.game.storySeen||!v.me.game.tutorialSeen){if(!showOnboard){showOnboard=true;onboardStep=v.me.game.onboarding?.page||0;showTutorial();}else if(v.me.game.onboarding?.stage==='intro'&&onboardStep!==v.me.game.onboarding.page){onboardStep=v.me.game.onboarding.page;renderTutorial();}}render();maybeEventPopup();if(!socialHeartbeatAt)refreshSocial();if(resumeBattle&&v.activeBattle&&!animation&&!showOnboard)playBattle(v.activeBattle,true);if(!$('modalOverlay').classList.contains('hidden')){if($('modalContent').querySelector('[data-mail-read]'))openMail();else if($('modalContent').querySelector('[data-explore-claim]'))openExplore();}return v;}catch(e){if(/로그인이 필요/.test(e.message)){$('auth').classList.remove('hidden');$('app').classList.add('hidden');}else if(!silent)toast(e.message,true);return null;}}
function serverNow(){return Date.now()+serverOffset;}
async function doAction(type,params={},{mineDrop=false}={}){
  const training=isTrainingActive();if(training&&guidePending)return null;if(training)guidePending=true;
  try{
    const priorWorkers=new Set((state?.me.game.workers||[]).map(w=>w.id));
    const out=await api('/api/action','POST',{...params,type,requestId:training?`training-${state.me.id}-${state.me.game.onboarding.stage}`:crypto.randomUUID()});
    if(out.message&&!out.battle&&!['mine/move','mine/dispatch'].includes(type))toast(out.message);
    if(mineDrop&&miningSettling)miningSettling.ready=true;
    await loadState({silent:true,resumeBattle:!out.battle});
    if(type==='worker/summon'){
      spawnedWorkerId=state?.me.game.workers.find(w=>!priorWorkers.has(w.id))?.id||null;
      if(selectedTab==='mine')renderMine();
      setTimeout(()=>spawnedWorkerId=null,750);
    }
    if(type==='mine/next-zone')showZoneTransition(state.me.game.mine.zone);
    if(out.battle)playBattle(out.battle);
    return out;
  }catch(e){toast(e.message,true);return null;}finally{if(training){guidePending=false;renderTraining();}}
}
function render(){if(!state)return;prepareTrainingLayout();const g=state.me.game;const power=state.me.power.total;$('serverLabel').textContent=`${state.me.world} · ${state.me.nickname}`;$('boxCount').textContent=number(g.boxes);$('cashCount').textContent=number(g.cash);$('powerCount').textContent=number(power);const unread=(g.mailbox||[]).filter(m=>!m.readAt).length;document.querySelectorAll('[data-mail-badge]').forEach(e=>{e.textContent=unread>99?'99+':unread;e.hidden=!unread;});
for(const t of ['center','mine','war','shop','server']){$(`tab${t[0].toUpperCase()+t.slice(1)}`).classList.toggle('hidden',t!==selectedTab)}document.querySelectorAll('.navitem').forEach(b=>b.classList.toggle('selected',b.dataset.tab===selectedTab));
$('app').classList.toggle('chat-expanded',chatExpanded&&selectedTab==='server');$('app').classList.toggle('immersive-mine',selectedTab==='mine');$('app').classList.toggle('immersive-war',selectedTab==='war');
syncChatBadge();syncAttention();syncChatViewport();if(selectedTab==='server'&&chatComposing)return;
if(selectedTab==='center')renderCenter();else if(selectedTab==='mine')renderMine();else if(selectedTab==='war')renderWar();else if(selectedTab==='shop')renderShop();else renderServer();syncAttention();renderTraining();}
function renderCenter(){const el=$('tabCenter'),g=state.me.game,p=state.me.power,stats=state.unitStats,bots=g.shop.bot?2:1,pending=(g.recruitQueue||[]).reduce((sum,j)=>sum+j.amount,0);
const active=UPGRADES.filter(u=>g.upgrades.some(j=>j.key===u.key));const rows=UPGRADES.filter(u=>({center:['center','wall','wallReflect','wallRepair','turretDmg','turretSpeed'],combat:['troopAtk','troopHp','troopSpeed','troopCritChance','troopCritDmg','troopLeech','capacity'],mine:['mine','laborCost','lossDiscovery','careerLevel','mergeLuck']}[researchGroup]||[]).includes(u.key)).map(u=>{const lv=g.levels[u.key],next=lv+1,job=g.upgrades.find(j=>j.key===u.key),mx=lv>=researchMax(u.key),locked=u.key!=='center'&&next>g.levels.center+1,c=upgradeCost(u.key,next),room=g.upgrades.length<bots;return `<div class="upgrade-item"><h4>${u.icon} ${u.name}<span class="tag">Lv.${lv}</span></h4><small>${u.desc}</small>${(miningResearchEffect(u.key,lv)||combatResearchEffect(u.key,lv))?`<div class="research-effect"><b>${(miningResearchEffect(u.key,lv)||combatResearchEffect(u.key,lv))}</b>${!mx?`<span>다음: ${(miningResearchEffect(u.key,next)||combatResearchEffect(u.key,next))}</span>`:''}</div>`:''}<div class="value">${job?'진행 중':mx?'최대 레벨':`${number(c.boxes)} 📦 · ${timeLeft(c.seconds*1000)}`}</div><button class="btn ${job?'btn-purple':'btn-outline'}" data-upgrade="${u.key}" ${mx||locked||!!job||!room||g.boxes<(c?.boxes||0)?'disabled':''}>${job?'업그레이드 중':mx?'최대 레벨':locked?'센터 레벨 필요':'강화 시작'}</button></div>`}).join('');
const jobs=Array.from({length:bots},(_,i)=>{const j=g.upgrades[i];return `<div class="slot"><h4>🛠 스탭 ${i+1}</h4>${j?`<small>${h(UPGRADES.find(v=>v.key===j.key)?.name||j.key)} Lv.${j.target}</small><div class="progress" style="margin:9px 0"><div class="bar" data-progress-start="${j.startAt}" data-progress-end="${j.endAt}" style="width:${Math.max(0,Math.min(100,100*(serverNow()-j.startAt)/(j.endAt-j.startAt)))}%"></div></div><strong class="counter" data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</strong>`:`<span class="good">대기 중 · 연구 가능</span>`}</div>`}).join('')+(bots===1?`<div class="slot"><h4>🔒 스탭 2</h4><small>상점에서 희귀 돈 3,600으로 영구 해금</small><button class="btn btn-outline" style="margin-top:8px" data-modal="shop">상점 열기</button></div>`:'');
el.innerHTML=`<div class="center-banner-v2"><span>우리의 센터</span><strong>Lv.${g.levels.center}</strong></div><div class="page-title"><div><h2>내 센터 <span class="goldtext">Lv.${g.levels.center}</span></h2></div><span class="pill">전투력 ${number(p.total)}</span></div>
<div class="center-utilities"><button class="btn btn-outline" data-workbook>📒 업무수첩 <b>${state.progression.quests.filter(q=>q.ready&&!q.claimed).length||''}</b></button><button class="btn btn-outline" data-inventory>📦 창고</button></div><div class="dashboard-columns"><div><div class="card card-center"><div class="card-head"><h3>📦 독립 물류센터</h3><span class="tag good">운영 중</span></div><div class="warehouse-stage illustrated-center"><div class="center-hero-shade"></div><span class="center-hero-title">독립 물류센터 <b>Lv.${g.levels.center}</b></span><span class="stage-caption">방벽 Lv.${g.levels.wall} · 포탑 Lv.${g.levels.turretDmg}</span></div><div class="gridstats" style="margin-top:11px"><div class="statbox"><small>센터 최대 HP</small><strong>${number(Math.ceil(stats.center))}</strong></div><div class="statbox"><small>방벽 HP</small><strong>${number(stats.wallCurrent??stats.wall)}<span class="wall-max">/ ${number(stats.wall)}</span></strong></div><div class="statbox"><small>포탑 공격력</small><strong>${number(stats.turretDamage)}</strong></div></div></div>
<div class="card card-army"><div class="card-head"><h3>👥 사원 증원 <small class="production-rate">1명 / 1분</small></h3><span class="pill">${g.troops} / ${stats.cap}명 · 생산 ${pending}명${reservedUi(g)?` · 외부·회복 ${reservedUi(g)}명`:""}</span></div><div class="gridstats"><div class="statbox"><small>공격력</small><strong>${number(stats.damage)}</strong></div><div class="statbox"><small>체력</small><strong>${number(stats.hp)}</strong></div><div class="statbox"><small>공격 속도</small><strong>${stats.interval.toFixed(2)}초</strong></div></div><div class="recruit-queue">${(g.recruitQueue||[]).length?(g.recruitQueue||[]).map((j,i)=>`<div class="recruit-job"><span>👷 ${j.amount}명 생산 ${i?'대기':'진행 중'}</span><b data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</b><div class="recruit-progress"><i data-progress-start="${j.startAt}" data-progress-end="${j.endAt}" style="width:${Math.max(0,Math.min(100,100*(serverNow()-j.startAt)/(j.endAt-j.startAt)))}%"></i></div></div>`).join(''):''}</div><div class="btnrow"><button data-recruit="1" class="btn btn-outline" ${g.boxes<45||g.troops+(reservedUi(g))+pending>=stats.cap?'disabled':''}>+1명 · 📦45</button><button data-recruit="5" class="btn btn-outline" ${g.boxes<225||g.troops+(reservedUi(g))+pending+5>stats.cap?'disabled':''}>+5명 · 📦225</button><button data-recruit="10" class="btn btn-outline" ${g.boxes<450||g.troops+(reservedUi(g))+pending+10>stats.cap?'disabled':''}>+10명 · 📦450</button></div><button class="btn btn-gold recruit-max" data-recruit-max ${g.boxes<45||g.troops+(reservedUi(g))+pending>=stats.cap||(g.recruitQueue||[]).length>=4?'disabled':''}>최대 생산 <span>${Math.max(0,Math.min(Math.floor(g.boxes/45),stats.cap-g.troops-(reservedUi(g))-pending))}명</span></button></div></div>
<div>${woundedMarkup(g)}<div class="card card-workshop"><div class="card-head"><h3>🛠️ 진행 중인 업그레이드</h3><span class="tag">${g.upgrades.length} / ${bots}건</span></div><div class="slots">${jobs}</div></div><div class="card card-research"><div class="card-head"><h3>📈 업그레이드 · 연구</h3><small class="muted">택배 박스 사용</small></div><div class="category-tabs">${[['center','🏢 센터'],['combat','⚔ 전투'],['mine','⛏ 채굴']].map(([id,name])=>`<button class="btn ${researchGroup===id?'btn-gold':'btn-outline'}" data-research-group="${id}">${name}</button>`).join('')}</div><div class="upgrade-grid">${rows}</div></div></div></div>`;renderTraining();}
function renderMine(){
  if(miningDragging||(miningSettling&&!miningSettling.ready))return;
  const el=$('tabMine'),g=state.me.game,m=g.mine,workers=g.workers;
  // Preserve the last visible position through refreshes, automation and drop confirmation.
  const previous=el.dataset.zone===String(m.zone)?new Map([...el.querySelectorAll('[data-worker]')].map(node=>{const r=node.getBoundingClientRect();return [node.dataset.worker,{x:r.left+r.width/2,y:r.top+r.height/2}];})):new Map();
  el.dataset.zone=String(m.zone);
  const chosen=workers.find(w=>w.id===selectedWorker)||workers[0];
  if(!workers.find(w=>w.id===selectedWorker))selectedWorker=chosen?.id;
  const gate=m.gate||{hp:3000,max:3000,done:false},gateReady=m.nodes.every(n=>n.done),gateRate=workers.filter(w=>w.target==='gate').reduce((sum,w)=>sum+workerTargetRate(w,g,'gate')*(g.forklift?.workerId===w.id&&(g.forklift.permanent||g.forklift.until>serverNow())?1.5:1),0);
  const boost=Math.max(0,g.shop.boostUntil-serverNow());
  const tile=(n,idx)=>{
    const active=workers.filter(w=>workerTargetRate(w,g,idx)>0),done=n.done;
    const damage=active.reduce((sum,w)=>sum+workerTargetRate(w,g,idx),0);
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
    <span class="worker-avatar"><canvas data-miner-motion="${h(w.id)}" width="180" height="180" aria-hidden="true"></canvas></span><span class="worker-level">Lv.${w.level}</span>
  </button>`;};
  el.innerHTML=`<div class="mine-map">
     <div class="mine-hud">
       <div class="mine-hud-stat"><b>👷 ${workers.length}/8</b><span>⚒ ${number(state.mineStats.rawDps)} DPS</span><span>📦 ${number(g.boxes)} · 💰 ${number(g.cash)}</span></div>
       <div class="mine-hud-actions">
        <span class="mine-sector">구역 ${m.zone+1}</span><button data-open-mail class="mine-icon mail-button" title="우편함">✉<b data-mail-badge ${!(g.mailbox||[]).some(m=>!m.readAt)?'hidden':''}>${(g.mailbox||[]).filter(m=>!m.readAt).length}</b></button>
        <button data-events class="mine-icon" title="이벤트">🎁</button><button data-notices class="mine-icon" title="공지사항" aria-label="공지사항">📣</button>
        <button class="mine-icon forklift-locked" data-forklift title="지게차 탑승"><img src="assets/forklift-cute.webp" alt="지게차"><b>${g.forklift?.permanent||g.forklift?.until>serverNow()?'✓':'🔒'}</b></button>
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
        <span>✦ +</span> Lv.${state.mineStats.summonLevel||1} 일용직 소환 <small>${state.mineStats.summonCost===0?'첫 일용직 무료':'📦 '+number(state.mineStats.summonCost)}</small>
       </button>
       
       ${workers.some(w=>w.parked)?'<span class="parked-note">대기 일용직은 통로가 열리면 배치됩니다.</span>':''}${boost>0?`<span class="mine-boost">⚡ ${timeLeft(boost)}</span>`:''}
     </div>
     ${gate.done?'<div class="zone-clear"><span>구역 돌파!</span><button class="btn btn-gold" data-next-zone>다음 구역으로 이동 ↑</button></div>':''}
   </div>`;
  const board=$('mineBoard'),bounds=board.getBoundingClientRect(),sx=bounds.width/board.offsetWidth||1,sy=bounds.height/board.offsetHeight||1;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)for(const node of el.querySelectorAll('[data-worker]')){
    const before=previous.get(node.dataset.worker);if(!before)continue;
    const r=node.getBoundingClientRect(),dx=(before.x-r.left-r.width/2)/sx,dy=(before.y-r.top-r.height/2)/sy;
    if(Math.hypot(dx,dy)<1)continue;
    node.animate([{transform:`translate(-50%,-50%) translate3d(${dx}px,${dy}px,0)`},{transform:'translate(-50%,-50%) translate3d(0,0,0)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
  }
  if(miningSettling)miningSettling.painted=true;
  renderTraining();
}
function warTargets(){
 if(warMode==='conquest')return (state.territories||[]).map(v=>({...v,disabled:v.mine||v.busy||v.shieldUntil>serverNow(),status:v.mine?'내 정복지':v.busy?'교전 중':v.shieldUntil>serverNow()?'정복 보호 중':v.ownerId?'점령 중':'중립지대'}));
 return state.ranks.filter(r=>r.id!==state.me.id).map(v=>({id:v.id,name:v.nickname,power:v.power,armyPower:v.armyPower,troops:v.troops,lootAvailable:v.lootAvailable||0,shieldUntil:v.shieldUntil,disabled:v.shielded,status:v.shielded?'보호 중':'유저 센터'}));
}
function renderWar(){
 const el=$('tabWar'),g=state.me.game;
 if(!animation){
  el.innerHTML=`<div class="expedition-hub prep-hub"><div class="expedition-heading"><div class="hub-tools"><button data-open-mail class="btn btn-outline" aria-label="우편함">✉</button><button data-events class="btn btn-outline" aria-label="이벤트">🎁</button><button data-notices class="btn btn-outline" aria-label="공지사항">📣</button></div><button data-open-war-log class="btn btn-outline expedition-log" aria-label="전투기록">📜 전투기록</button></div><div class="prep-space"></div><button data-heroes class="hero-hub-button"><img src="assets/hero-${g.defenseHero||'frozen'}.webp" alt=""><span>파트장<strong>목록 · 강화 · 편성</strong></span><b>❯</b></button><div class="hub-army">대기 사원 ${number(g.troops)}명 · 전투력 ${number(state.me.power.total)}</div><div class="expedition-modes"><button data-expedition="raid" class="expedition-mode raid"><img src="assets/mode-raid.webp" alt=""><strong>약탈전</strong>${badgeMarkup(0,'data-attack-badge="raid"')}</button><button data-expedition="conquest" class="expedition-mode conquest"><img src="assets/mode-conquest.webp" alt=""><strong>정복전</strong>${badgeMarkup(0,'data-attack-badge="conquest"')}</button><button data-explore class="expedition-mode explore"><img src="assets/mode-explore.webp" alt=""><strong>탐사전</strong></button></div>${g.exploration?`<button class="explore-return" data-explore>🧭 ${h(g.exploration.name)} · <b data-live-end="${g.exploration.endAt}">${g.exploration.endAt>serverNow()?timeLeft(g.exploration.endAt-serverNow()):'보상 수령'}</b></button>`:''}${state.income?.boxesPerHour?`<div class="territory-income"><b>정복지 ${g.captures.filter(x=>typeof x==='string').length}/${state.territoryCap}</b><span>시간당 📦 ${number(state.income.boxesPerHour)} · 💰 ${number(state.income.cashPerHour)}</span></div>`:''}</div>`;
  return;
 }
 const current=animation.current||animation.frames[0],inBattle=animation.phase!=='finished';
 el.innerHTML=`<div class="war-scene"><div class="war-topbar">${battleHealthMarkup('a',current,healthMaxima('a'),false,battleLabels().a)}${battleHealthMarkup('b',current,healthMaxima('b'),false,battleLabels().b)}</div><div id="warScroller" class="war-scroller open" aria-label="좌우로 움직여 보는 전장"><canvas id="warCanvas" width="1920" height="1080" aria-label="사원의 이동과 전투"></canvas></div><div class="war-camera"><button data-camera="own">내 센터</button><button data-camera="fight">교전</button><button data-camera="enemy">상대</button></div><div class="war-bottombar">${inBattle?`<div class="war-playback"><span id="battleHint">${current.t.toFixed(1)}초 · 공격 ${current.a.n}명 / 방어 ${current.b.n}명</span><button class="war-pill" data-speed="${warPlaybackSpeed===1?2:1}">${warPlaybackSpeed}배속</button><button class="war-pill" data-skip-battle>스킵 »</button>${animation.payload.pending?'<button class="war-pill retreat-button" data-retreat>후퇴</button>':''}</div>`:'<button class="btn btn-gold btn-wide" data-return-battle="war">출정 준비로 복귀</button>'}</div></div>`;
 const scroll=$('warScroller');if(scroll){scroll.scrollLeft=warScrollLeft;scroll.addEventListener('scroll',()=>warScrollLeft=scroll.scrollLeft,{passive:true});}drawBattle(current);
}
async function chooseExpedition(mode){
 if(animation?.payload.pending){toast('진행 중인 출정을 마무리해 주세요.',true);return;}
 warMode=mode;warTarget='';await loadState({silent:true});if(!state.activeBattle)openWarChooser();
}
function openWarChooser(){
 if(!state)return;marchContext='war';
 const g=state.me.game,targets=warTargets(),conquest=warMode==='conquest';
 if(!targets.some(v=>v.id===warTarget&&!v.disabled))warTarget=targets.find(v=>!v.disabled)?.id||'';
 const selected=targets.find(v=>v.id===warTarget);warCount=Math.max(1,Math.min(warCount,g.troops||1));
 showModal(`<div class="modal-header"><h2 class="modal-title">${conquest?'🚩 정복전':'⚔ 약탈전'}</h2><button data-close class="modal-close">닫기 ✕</button></div>${defenseAlertsMarkup(warMode)}<div class="enemies">${targets.map(v=>`<button class="enemy ${warTarget===v.id?'active':''}" data-war-target="${h(v.id)}" ${v.disabled?'disabled':''}><span>${conquest?'🏭':'🏢'}</span><div class="enemy-info"><div class="rank-title">${h(v.name)}</div><div class="sub">${conquest?`점령: ${h(v.ownerName)}${v.status==='중립지대'?'':' · '+h(v.status)}`:h(v.status)} · 방어 사원 ${number(v.troops)}명</div><div class="enemy-values"><b>방어 병력 전투력 ${number(v.armyPower??v.power)}</b>${conquest?`<b>시간당 📦 ${number(v.boxesPerHour)} · 💰 ${number(v.cashPerHour)}</b>`:`<b>약탈 가능 📦 ${number(v.lootAvailable)}</b>`}</div>${v.shieldUntil>serverNow()?`<small class="protection-clock">보호 <span data-live-end="${v.shieldUntil}">${timeLeft(v.shieldUntil-serverNow())}</span></small>`:''}</div><span class="enemy-status">${warTarget===v.id?'✓':''}</span></button>`).join('')||'<div class="mail-empty">같은 서버에 약탈할 상대 센터가 없습니다.</div>'}</div>${conquest?ownedTerritoriesMarkup():''}${heroPicker()}${troopPicker()}<button class="btn btn-gold btn-wide" style="margin-top:16px" data-start-battle ${!selected||selected.disabled||g.troops<1||!!g.pendingBattle||!warHero?'disabled':''}>${selected?h(selected.name)+' 출정':'상대를 선택하세요'}</button><p class="raid-limit">${conquest?'점령 성공 시 시간당 수입 · 점령 후 6시간 보호':'상대 보유 박스 최대 10% 약탈 · 피격 후 1시간 보호'}</p>`);markAttackRead(warMode);
}

function openWarLog(){
  const bs=state?.battles||[];
  showModal(`<div class="modal-header"><h2 class="modal-title">📜 최근 전투 기록</h2><button data-close class="modal-close">닫기 ✕</button></div>
    ${bs.slice(0,16).map(b=>`<div class="history-row"><div><strong>${h(b.defender_name)} · ${b.result==='win'?'승리':b.result==='lose'?'패배':'무승부'}</strong>
      <small>${ago(b.at)} · 📦 ${number(b.loot)} 획득</small></div><button class="btn btn-outline" data-replay="${b.id}">리플레이</button></div>`).join('')||'<p class="muted">아직 전투 기록이 없어요.</p>'}`);
}
function renderServer(){const el=$('tabServer'),g=state.me.game,users=rankPlayers(state.ranks,rankMode);const chat=state.chat.slice(-35);const oldList=document.querySelector('.chat-list'),oldTop=oldList?.scrollTop||0,nearBottom=!oldList||oldList.scrollHeight-oldList.scrollTop-oldList.clientHeight<80;const chatInput=$('chatInput'),prevInput=chatInput?.value||'',chatFocused=document.activeElement===chatInput,selection=chatFocused?[chatInput.selectionStart,chatInput.selectionEnd]:null;
el.dataset.serverPage=serverPage;el.innerHTML=`<div class="category-tabs server-tabs">${[['chat','채팅'],['rank','랭킹'],['news','전투 소식']].map(([id,label])=>`<button class="btn ${serverPage===id?'btn-gold':'btn-outline'}" data-server-page="${id}">${label}</button>`).join('')}</div><div class="page-title"><div><h2>우리 서버 🌐</h2></div><button class="btn btn-outline" data-invite>서버 초대 · ${h(state.me.world)}</button></div>
<div class="card card-chat"><div class="card-head"><h3>💬 서버 채팅</h3><button class="btn btn-outline" data-chat-expand>${chatExpanded?'작게 보기':'크게 보기'}</button></div><div class="chat-list" role="log" aria-label="서버 채팅 메시지">${chat.map(m=>`<article class="chat-row ${m.player_id===state.me.id?'mine':'other'}">${m.player_id===state.me.id?'':'<img class="chat-avatar" src="assets/worker-cute.webp" alt="">'}<div class="chat-message"><strong class="chat-name">${m.player_id===state.me.id?'나':h(m.nickname)}</strong><div class="chat-bubble">${h(m.body)}</div><time class="chat-time">${ago(m.created_at)}</time></div></article>`).join('')||'<div class="chat-empty"><img src="assets/worker-cute.webp" alt=""><p>센터장님들과 첫 인사를 나눠 보세요!</p></div>'}</div><button class="chat-latest btn btn-outline" data-chat-bottom hidden>최근 메시지 ↓</button><form id="chatForm" class="chat-compose"><textarea id="chatInput" rows="1" maxlength="300" placeholder="서버 채팅 작성" aria-label="서버 채팅 작성"></textarea><button class="btn btn-gold" type="submit">보내기</button></form></div>
<div class="card card-league"><div class="card-head"><h3>🏆 서버 랭킹</h3><span class="tag">${users.length}명 참가</span></div><div class="presence-legend"><span><i class="presence-dot online"></i>접속 중</span><span><i class="presence-dot away"></i>자리비움</span><span><i class="presence-dot offline"></i>오프라인</span></div><div class="switch-tabs"><button data-rank="total" class="${rankMode==='total'?'active':''}">전투력</button><button data-rank="mine" class="${rankMode==='mine'?'active':''}">채굴 구역</button></div>${users.map((v,i)=>`<div class="ranking-row"><span class="rank-no">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span><div class="meta"><strong>${presenceDot(v.presence)}${h(v.nickname)}${v.id===state.me.id?' (나)':''}</strong><small>승리 ${v.wins}회 · 사원 ${v.troops}명</small>${presenceInfo(v)}</div><span class="points">${rankMode==='mine'?'구역 ':''}${number(rankMode==='mine'?v.mineZone||1:v.power)}</span></div>`).join('')}</div>
<div class="card card-news"><div class="card-head"><h3>📜 최근 전쟁 소식</h3></div>${state.battles.slice(0,8).map(b=>`<div class="history-row"><div><strong>${h(b.defender_name)} 센터 ${b.result==='win'?'함락':'교전'}</strong><small>📦 ${number(b.loot)}개 약탈 · ${ago(b.at)}</small></div><button class="btn btn-outline" data-replay="${b.id}" style="font-size:11px;min-height:32px;padding:6px">보기</button></div>`).join('')||'<p class="muted">아직 전쟁 기록이 없어요.</p>'}</div>`;
const list=document.querySelector('.chat-list');if(list){list.scrollTop=nearBottom||chatForceBottom?list.scrollHeight:oldTop;list.addEventListener('scroll',()=>{if(!list.isConnected)return;const bottom=list.scrollHeight-list.scrollTop-list.clientHeight<80;const jump=document.querySelector('[data-chat-bottom]');if(jump)jump.hidden=bottom;syncChatBadge();},{passive:true});document.querySelector('[data-chat-bottom]').hidden=nearBottom||chatForceBottom;}chatForceBottom=false;const inp=$('chatInput');inp.value=prevInput;if(chatFocused){inp.focus({preventScroll:true});if(selection)inp.setSelectionRange(...selection);}syncChatBadge();syncChatViewport();}
function showModal(content){$('modalContent').removeAttribute('role');$('modalContent').removeAttribute('aria-modal');$('modalContent').removeAttribute('aria-label');$('modalContent').className='modal-content '+(content.includes('welcome-notice')?'modal-notice':content.includes('attendance-grid')?'modal-attendance':content.includes('warehouse-art')?'modal-storage':content.includes('workbook-intro')?'modal-workbook':content.includes('march-heroes')?'modal-war':content.includes('hero-roster')||content.includes('hero-detail')?'modal-heroes':content.includes('data-buy=')?'modal-shop':'modal-ledger');$('modalContent').innerHTML=content;$('modalOverlay').classList.remove('hidden');}
function closeModal(){$('modalOverlay').classList.add('hidden');}
// Only a player's dismissal of attendance opens the notice; internal modal changes do not.
function dismissModal(){const afterEvent=$('modalContent').classList.contains('modal-attendance');closeModal();if(afterEvent&&state&&!showOnboard&&!animation&&!recruiting)openNotice();syncChatBadge();}
function openNotice(){
 showModal(`${modalHead('📣 재팤의 환영 공지')}<article class="welcome-notice"><img class="notice-art" src="assets/notice-welcome.webp" alt="센터 앞에서 손을 흔들며 센터장님을 환영하는 복슬이"><div class="notice-letter"><span class="notice-from">개발자 재팤의 편지</span><h3>센터장님, 환영합니다!</h3><p>안녕하세요! 컬리 아포칼립스 개발자 <strong>재팤</strong>입니다.</p><p>함께 박스를 캐고 센터를 키워 주셔서 감사합니다. 주기적으로 즐거운 이벤트도 열 예정이니, 앞으로도 많은 사랑 부탁드려요!</p><section class="notice-support"><h4>과금 없이, 함께 만드는 게임</h4><p>이 게임에는 <strong>과금이 일체 없습니다.</strong><br>더 나은 게임과 새로운 콘텐츠 업데이트를 위한 자발적인 후원을 환영합니다.</p><div class="support-bank"><label for="supportAccount">카카오뱅크</label><input id="supportAccount" aria-label="카카오뱅크 후원 계좌번호" value="${SUPPORT_ACCOUNT}" readonly inputmode="numeric"><button class="btn btn-gold" data-copy-support>계좌번호 복사</button><span class="support-copy-status" role="status" aria-live="polite"></span></div><p class="support-optional">후원은 선택이에요. 즐겨 주시는 것만으로도 큰 힘이 됩니다.</p></section><p class="notice-signature">오늘도 즐거운 센터 생활 되세요!<br><strong>개발자 재팤 드림</strong></p><button class="btn btn-gold btn-wide" data-close>확인</button></div></article>`);
 $('modalContent').setAttribute('role','dialog');$('modalContent').setAttribute('aria-modal','true');$('modalContent').setAttribute('aria-label','재팤의 환영 공지');
 $('modalContent').scrollTop=0;$('modalContent').querySelector('[data-close]').focus({preventScroll:true});
}
async function copySupportAccount(button){
 let copied=false;try{await navigator.clipboard.writeText(SUPPORT_ACCOUNT);copied=true;}catch{
  const input=$('supportAccount');if(input){input.focus({preventScroll:true});input.select();input.setSelectionRange(0,input.value.length);try{copied=document.execCommand('copy');}catch{}}
 }
 if(!button.isConnected)return;button.textContent=copied?'복사 완료 ✓':'계좌번호 복사';
 const status=$('modalContent').querySelector('.support-copy-status');if(status)status.textContent=copied?'계좌번호가 복사되었습니다.':'계좌번호를 길게 눌러 복사해 주세요.';
}

function openShop(){closeModal();setTab('shop');}
function renderShop(){
 const g=state.me.game,el=$('tabShop');
 el.querySelectorAll('[data-pool-rates]').forEach(d=>shopDisclosure[d.dataset.poolRates]=d.open);
 const focusedPool=document.activeElement?.closest('[data-pool-rates]')?.dataset.poolRates;
 el.innerHTML=`<div class="shop-banner"><h3>센터 보급 상점</h3></div><div class="category-tabs">${[['equipment','⚙ 설비'],['supplies','📦 보급'],['recruit','✨ 파트장 모집']].map(([id,label])=>`<button class="btn ${shopGroup===id?'btn-gold':'btn-outline'}" data-shop-group="${id}">${label}</button>`).join('')}</div>${shopPurchasing?'<p class="purchase-pending" role="status">구매 처리 중…</p>':pendingShopPurchase()?'<button class="btn btn-gold btn-wide" data-purchase-retry>중단된 구매 결과 확인</button>':''}${shopGroup==='recruit'?recruitmentShopMarkup():''}<div class="shop-grid">${(state.shopItems||[]).filter(i=>(i.category||(i.id==='boost'?'supplies':'equipment'))===shopGroup).map(i=>{const d=SHOP_DETAILS[i.id]||{},art={normalTicket:'ticket-normal',rareTicket:'ticket-rare',researchAid:'research-voucher',healAid:'medical-kit'}[i.id]||i.image||d.image||'panel-shop',desc=i.id==='auto'?'이벤트 전용 · 추후 순위 보상 기간 이용권':i.eventOnly?'이벤트 한정 · 출석 7일차 이용권':d.description||({normalTicket:'일반 모집에 사용하는 입장권',rareTicket:'희귀 모집에 사용하는 입장권',researchAid:'진행 중인 연구 10분 단축',healAid:'회복 중인 사원 전원 즉시 복귀'}[i.id]||'');return `<div class="shop-card ${i.locked?'future-item':''}"><div class="shop-art ${i.id}"><img src="assets/${art}.webp" alt="${h(i.name)}"></div><div class="shop-info"><h3>${h(i.name)}</h3><p>${desc}</p><button class="btn btn-gold" data-buy="${i.id}" ${i.locked||i.owned||g.cash<i.price||shopPurchasing||pendingShopPurchase()?'disabled':''}>${i.owned?'영구 보유 중':i.eventOnly?'🔒 이벤트 전용':'💰 '+number(i.price)}</button></div></div>`}).join('')}</div><button class="btn btn-outline btn-wide" style="margin-top:18px" data-inventory>📦 내 창고</button>`;
 if(focusedPool)el.querySelector(`[data-pool-rates="${focusedPool}"] summary`)?.focus({preventScroll:true});
}

function openProfile(){if(!state)return;const g=state.me.game;showModal(`<div class="modal-header"><h2 class="modal-title">👤 센터장 정보</h2><button data-close class="modal-close">닫기 ✕</button></div><div class="statrow"><span>센터장</span><strong>${h(state.me.nickname)}</strong></div><div class="statrow"><span>서버 코드</span><strong>${h(state.me.world)}</strong></div><div class="statrow"><span>전투력</span><strong>${number(state.me.power.total)}</strong></div><div class="statrow"><span>도달 채굴 구역</span><strong>구역 ${number(g.mine.zone+1)}</strong></div><div class="statrow"><span>승리 / 패배</span><strong>${g.warWins}승 / ${g.warLosses}패</strong></div><button class="btn btn-outline btn-wide" style="margin-top:12px" data-guide>스토리·튜토리얼 다시 보기</button><button class="btn btn-outline btn-wide" style="margin-top:9px" data-logout>로그아웃</button><p class="section-note">PIN 번호는 복구되지 않아요. 다른 기기에서 로그인하려면 서버 코드·닉네임·PIN을 기억해 주세요.</p>`)}
function workerDps(w,g){return 5*Math.pow(2.4,w.level-1)*Math.pow(1.08,g.levels.mine-1)*(1+.03*g.captures.length)*(1+.02*(g.miningMastery||0));}
function openMail(){
 if(!state)return;const mails=state.me.game.mailbox||[],icons={territory:'🚩',upgrade:'🛠',recruit:'👥',battle:'⚔',defense:'🛡',zone:'🚪'};
 showModal(`<div class="modal-header"><h2 class="modal-title">✉ 우편함</h2><button class="modal-close" data-close>닫기 ✕</button></div><div class="mail-toolbar"><b>새 우편 ${mails.filter(m=>!m.readAt).length}</b><button class="btn btn-outline" data-mail-read ${mails.some(m=>!m.readAt)?'':'disabled'}>모두 읽음</button></div>${mails.map(m=>`<article class="mail-item ${m.readAt?'':'unread'}"><span>${icons[m.type]||'✉'}</span><div><h3>${h(m.title)}</h3><p>${h(m.body)}</p><time>${new Date(m.at).toLocaleString('ko-KR')}</time>${m.battleId?`<button class="btn btn-outline" data-replay="${h(m.battleId)}">전투 보기</button>`:''}</div></article>`).join('')||'<div class="mail-empty">아직 도착한 우편이 없습니다.</div>'}`);
}
function showBattleResult(p){
 const win=p.result==='win',draw=p.result==='draw',el=$('battleResult');
 el.innerHTML=`<div class="result-card ${win?'victory':'defeat'}"><div class="result-art"><img src="assets/${win?'result-win':draw||p.retreated?'result-draw':'result-loss'}.webp" alt="${win?'센터를 점령하고 환호하는 사원들':'다음 출정을 다짐하는 사원들'}"><h2>${p.retreated?'후퇴 완료':p.conquered?'정복 성공!':win?'약탈 성공!':draw?'무승부':'다시 일어서자'}</h2></div><div class="result-info"><h3>${h(p.defenderName)} · ${p.retreated?'생존 사원 복귀':win?'승리':draw?'무승부':'패배'}</h3><div class="result-stats"><span>${p.conquered?'정복지 확보':'약탈 박스'} <b>${p.conquered?'🚩':'📦 '+number(p.loot)}</b></span><span>귀환 / 손실 <b>${number(p.survivors??p.amount-p.lost)} / ${number(p.lost)}명</b></span></div><div class="btnrow"><button class="btn btn-gold" data-return-battle="center">센터로 복귀</button><button class="btn btn-outline" data-return-battle="war">출정 준비</button></div></div></div>`;
 el.classList.remove('hidden');
}
function returnFromBattle(tab){$('battleResult').classList.add('hidden');$('battleTransition').classList.add('hidden');animation=null;animating=false;warScrollLeft=0;setTab(tab);}
let zoneTimer;
function showZoneTransition(zone){
 const el=$('zoneTransition');clearTimeout(zoneTimer);
 el.innerHTML=`<div class="zone-scroll-track"><section class="zone-new"><h2>구역 ${zone+1}</h2><img class="arrival-gate" src="assets/warehouse-gate-open.webp" alt="방금 돌파한 창고 문"></section><section class="zone-old"><h2>구역 ${zone} 돌파!</h2><img src="assets/warehouse-gate-open.webp" alt=""></section></div>`;
 el.classList.remove('hidden');zoneTimer=setTimeout(()=>el.classList.add('hidden'),1900);
}
function openMerge(){const ws=state?.me.game.workers||[];const pairs=[];for(let i=0;i<ws.length;i++)for(let j=i+1;j<ws.length;j++)if(ws[i].level===ws[j].level&&ws[i].level<6)pairs.push([ws[i],ws[j]]);showModal(`<div class="modal-header"><h2 class="modal-title">🔀 일용직 합성</h2><button class="modal-close" data-close>닫기 ✕</button></div><p class="section-note">같은 레벨 일용직 두 명을 합쳐요. 경력 확률 연구 시 ${Math.round((state.mineStats.mergeChance||0)*100)}% 확률로 2레벨 상승합니다. 최대 Lv.6.</p>${pairs.length?pairs.map(([a,b])=>`<div class="shop-item"><span class="si">👷</span><div class="info"><strong>Lv.${a.level} + Lv.${b.level} → Lv.${a.level+1}</strong><small>공격이 아닌 채굴 속도 약 2.4배</small></div><button class="btn btn-gold" data-merge="${a.id}|${b.id}">합성</button></div>`).join(''):'<p class="muted">합성할 일용직 조합이 없어요. 같은 레벨 일용직을 추가로 소환해 주세요.</p>'}`);}
function clearIntroTimers(){introTimers.forEach(clearTimeout);introTimers=[];}
function showTutorial(){
  if(!state)return;
  clearIntroTimers();showOnboard=true;
  $('onboardOverlay').classList.remove('hidden');$('app').inert=true;closeModal();$('trainingCoach')?.classList.add('hidden');
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
  $('onboardNext').textContent=i===8?(isTrainingActive()?'운영 실습 시작':'게임 시작하기'):'다음';
  const mandatory=!state.me.game.storySeen||!state.me.game.tutorialSeen;
  $('onboardSkip').hidden=mandatory;
  $('onboardNext').disabled=mandatory&&!!state.me.game.onboarding&&(serverNow()<state.me.game.onboarding.readyAt||introAdvanceBusy);
  if(!isStory&&mandatory&&state.me.game.onboarding)introTimers.push(setTimeout(()=>{$('onboardNext').disabled=introAdvanceBusy;},Math.max(0,state.me.game.onboarding.readyAt-serverNow())));
  $('onboardSkip').textContent=isStory?'SKIP »':'건너뛰기';
  if(isStory){
    introTimers.push(setTimeout(()=>$('cinemaHead')?.classList.add('visible'),450));
    introTimers.push(setTimeout(()=>$('cinemaBody')?.classList.add('visible'),2900));
    introTimers.push(setTimeout(()=>{if(!showOnboard)return;if(document.hidden){renderTutorial();return;}advanceOnboarding();},7600));
  }
}
async function completeTutorial(){
 if(state.me.game.onboarding?.stage==='intro')return advanceOnboarding();
 const out=await doAction('onboard/done');if(!out)return;
 clearIntroTimers();showOnboard=false;$('onboardOverlay').classList.add('hidden');$('app').inert=false;renderTraining();maybeEventPopup();
}
async function advanceOnboarding(){
 if(introAdvanceBusy)return;
 if(state.me.game.onboarding?.stage!=='intro'){if(onboardStep>=8)return completeTutorial();onboardStep++;renderTutorial();return;}
 introAdvanceBusy=true;$('onboardNext').disabled=true;
 try{
  await api('/api/action','POST',{type:'onboard/advance',page:onboardStep,requestId:`intro-${state.me.id}-${onboardStep}`});
  const synced=await loadState({silent:true});if(!synced)throw new Error('안내 진행 상태를 다시 확인하고 있어요.');
  if(state.me.game.onboarding.stage!=='intro'){clearIntroTimers();showOnboard=false;$('onboardOverlay').classList.add('hidden');$('app').inert=false;render();}
 }catch(e){toast(e.message,true);await loadState({silent:true});if(state.me.game.onboarding?.stage==='intro')renderTutorial();}
 finally{introAdvanceBusy=false;if(showOnboard&&onboardStep>=5)$('onboardNext').disabled=serverNow()<(state.me.game.onboarding?.readyAt||0);}
}
function setTab(tab){if(!['center','mine','war','shop','server'].includes(tab))return;selectedTab=tab;if(tab!=='server')chatExpanded=false;render();window.scrollTo({top:0,behavior:'smooth'});}

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
for(const id of ['frozen','ambient','chilled','beauty','cs','returns']){const img=new Image();img.src='assets/hero-'+id+'.webp';visualAssets['hero-'+id]=img;}
Object.values(visualAssets).forEach(img=>img.onload=()=>{if($('warCanvas'))drawBattle(animation?.current||null);});
function healthMaxima(side){
 const first=animation?.frames?.[0],stats=animation?.payload?.[side==='a'?'attackerStats':'defenderStats'];
 return {C:stats?.center??first?.[side+'C']??state?.unitStats.center??1000,W:stats?.wall??first?.[side+'W']??state?.unitStats.wall??450,T:stats?.turret??first?.[side+'T']??state?.unitStats.turret??300};
}
function drawBattle(frame){
 const canvas=$('warCanvas');if(!canvas)return;
 paintBattle(canvas,frame,{assets:visualAssets,sprites:boksilSheets,phase:animation?.phase,events:animation?.events||[],ownStats:state?.unitStats,maxima:{a:healthMaxima('a'),b:healthMaxima('b')},labels:battleLabels()});
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
 const overlay=$('battleTransition');overlay.innerHTML=`<img class="charge-art" src="assets/chargeSpeech.webp" alt="복슬이 사원들의 출정"><div class="charge-names">${h(payload.attackerName||state.me.nickname)} <span>VS</span> ${h(payload.defenderName)}</div><button class="btn btn-gold charge-skip" data-skip-intro>전장으로</button>`;overlay.classList.remove('hidden');animation.introTimer=setTimeout(()=>beginBattle(),3200);
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
  const stamp=performance.now();if(current.lastPaint&&stamp-current.lastPaint<1000/30){requestAnimationFrame(run);return;}current.lastPaint=stamp;
  const seconds=Math.min(current.frames.at(-1).t,current.offset+(performance.now()-current.anchor)/1000*warPlaybackSpeed);
  let idx=0;while(idx<current.frames.length-1&&current.frames[idx+1].t<=seconds)idx++;
  const f=current.frames[idx],next=current.frames[Math.min(idx+1,current.frames.length-1)],alpha=next.t>f.t?Math.max(0,Math.min(1,(seconds-f.t)/(next.t-f.t))):0;
  current.current={...f,t:seconds,a:{...f.a,x:f.a.x+(next.a.x-f.a.x)*alpha},b:{...f.b,x:f.b.x+(next.b.x-f.b.x)*alpha}};drawBattle(current.current);
  const sc=$('warScroller');if(sc&&!current.manualCamera&&seconds>1.4){const front=current.current.a.n?current.current.a.x:current.current.b.x;sc.scrollLeft=Math.max(0,front*sc.scrollWidth-sc.clientWidth*.48);}
  const hint=$('battleHint');if(hint)hint.textContent=`${seconds.toFixed(1)}초 · 공격 ${current.current.a.n}명 / 방어 ${current.current.b.n}명`;
  if(seconds>=current.frames.at(-1).t)finishBattle();else requestAnimationFrame(run);
 };requestAnimationFrame(run);
}

async function replay(id){try{const v=await api('/api/battle/'+id);if(v.battle.released){toast('정복지 포기 기록입니다.');return;}closeModal();playBattle(v.battle);}catch(e){toast(e.message,true)}}
let suppressMineClickUntil=0;
function handleAction(e){if(Date.now()<suppressMineClickUntil&&e.target.closest('#tabMine'))return;const btn=e.target.closest('button');if(!btn)return;if(handleAdminButton(btn))return;if(!state)return;if(btn.dataset.trainingMerge!==undefined){const o=state.me.game.onboarding;if(o?.stage==='merge')doAction('worker/merge',{a:o.workerIds[0],b:o.workerIds[1]});return;}if(btn.dataset.trainingFinish!==undefined){doAction('training/finish').then(out=>{if(out){closeModal();maybeEventPopup();}});return;}if(handleV17Button(btn))return;
if(btn.dataset.returnBattle){returnFromBattle(btn.dataset.returnBattle);return}if(btn.dataset.openMail!==undefined){openMail();return}if(btn.dataset.mailRead!==undefined){doAction('mail/read').then(openMail);return}if(btn.dataset.recruitMax!==undefined){doAction('troops/recruit',{max:true});return}if(btn.dataset.gate!==undefined){const w=state.me.game.workers.find(v=>v.id===selectedWorker)||state.me.game.workers[0];if(w)doAction('mine/gate',{worker:w.id});else toast('일용직을 먼저 소환해 주세요.',true);return}if(btn.dataset.skipIntro!==undefined){beginBattle();return}if(btn.dataset.tab){if(miningDragging||miningSettling)return;setTab(btn.dataset.tab);return}if(btn.dataset.modal==='shop'){openShop();return}if(btn.dataset.close!==undefined){dismissModal();return}if(btn.dataset.guide!==undefined){closeModal();onboardStep=0;showTutorial();return}if(btn.dataset.logout!==undefined){api('/api/logout','POST',{}).then(()=>location.reload()).catch(err=>toast(err.message,true));return}
if(btn.dataset.upgrade){doAction('upgrade/start',{key:btn.dataset.upgrade});return}if(btn.dataset.recruit){doAction('troops/recruit',{amount:Number(btn.dataset.recruit)});return}if(btn.dataset.summon!==undefined){doAction('worker/summon');return}if(btn.dataset.worker){selectedWorker=btn.dataset.worker;renderMine();return}if(btn.dataset.openMerge!==undefined){openMerge();return}if(btn.dataset.merge){const [a,b]=btn.dataset.merge.split('|');closeModal();doAction('worker/merge',{a,b});return}
if(btn.dataset.tile!==undefined){const idx=Number(btn.dataset.tile),w=state.me.game.workers.find(v=>v.id===selectedWorker)||state.me.game.workers[0],n=state.me.game.mine.nodes[idx];if(!w){toast('일용직을 먼저 소환해 주세요.',true);return}if(n.done)doAction('mine/move',{worker:w.id,x:idx%5,y:Math.floor(idx/5)});else doAction('mine/dispatch',{worker:w.id,idx});return}
if(btn.dataset.start!==undefined){doAction('mine/move',{worker:selectedWorker,x:Number(btn.dataset.start),y:8});return}if(btn.dataset.nextZone!==undefined){doAction('mine/next-zone');return}
if(btn.dataset.invite!==undefined){shareServer();return}
if(btn.dataset.buy){purchaseShopItem(btn.dataset.buy);return}
if(btn.dataset.purchaseRetry!==undefined){purchaseShopItem();return}

if(btn.dataset.expedition){chooseExpedition(btn.dataset.expedition);return}if(btn.dataset.retreat!==undefined){finishBattle(true);return}if(btn.dataset.openWar!==undefined){openWarChooser();return}if(btn.dataset.openWarLog!==undefined){openWarLog();return}if(btn.dataset.warTarget){warTarget=btn.dataset.warTarget;openWarChooser();return}if(btn.dataset.startBattle!==undefined){closeModal();doAction('battle/start',{amount:warCount,target:warTarget,mode:warMode,hero:warHero,formation:warFormation});return}if(btn.dataset.camera){if(animation)animation.manualCamera=true;const sc=$('warScroller');if(sc)sc.scrollTo({left:btn.dataset.camera==='own'?0:btn.dataset.camera==='enemy'?sc.scrollWidth:(sc.scrollWidth-sc.clientWidth)/2,behavior:'smooth'});return}if(btn.dataset.speed){setBattleSpeed(Number(btn.dataset.speed));return}if(btn.dataset.skipBattle!==undefined){finishBattle();return}if(btn.dataset.replay){replay(btn.dataset.replay);return}if(btn.dataset.rank){rankMode=btn.dataset.rank;renderServer();return}
}
function paintMineDrag(d){
  if(miningDragging!==d)return;
  d.frame=0;
  d.sprite.style.transform=`translate(-50%,-50%) translate3d(${(d.clientX-d.x)/d.sx}px,${(d.clientY-d.y)/d.sy}px,0) scale(1.08)`;
  const drop=document.elementFromPoint(d.clientX,d.clientY)?.closest('.mine-worker,.mine-tile,[data-gate]');
  const next=drop!==d.sprite?drop:null;
  if(d.drop!==next){d.drop?.classList.remove('mine-drop');next?.classList.add('mine-drop');d.drop=next;}
}
async function settleMineDrop(type,params){
  miningSettling={ready:false};
  try{await doAction(type,params,{mineDrop:true});}
  finally{const painted=miningSettling?.painted;miningSettling=null;if(!painted&&selectedTab==='mine'&&!miningDragging)renderMine();}
}
function endMineDrag(e,cancelled=false){
  const d=miningDragging;
  if(!d||d.pointerId!==e.pointerId)return;
  cancelAnimationFrame(d.frame);d.clientX=e.clientX;d.clientY=e.clientY;paintMineDrag(d);
  const sprite=d.sprite,drop=!cancelled?document.elementFromPoint(e.clientX,e.clientY):null;
  const nearby=[...document.querySelectorAll('.mine-worker:not(.dragging)')].map(el=>{const r=el.getBoundingClientRect();return {el,d:Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2))};}).filter(v=>v.d<27).sort((a,b)=>a.d-b.d);
  const other=nearby[0]?.el||drop?.closest('.mine-worker'),tile=drop?.closest('.mine-tile'),gate=drop?.closest('[data-gate]');
  miningDragging=null;suppressMineClickUntil=Date.now()+400;d.drop?.classList.remove('mine-drop');
  sprite.classList.remove('dragging');sprite.classList.add('drop-pending');sprite.setAttribute('aria-busy','true');
  if(sprite.hasPointerCapture(e.pointerId))sprite.releasePointerCapture(e.pointerId);
  // Keep the worker at the pointer until the server confirms its real landing cell.
  if(cancelled||Math.hypot(e.clientX-d.x,e.clientY-d.y)<12){selectedWorker=d.id;renderMine();return;}
  if(other?.dataset.worker&&other.dataset.worker!==d.id){
    const a=state.me.game.workers.find(w=>w.id===d.id),b=state.me.game.workers.find(w=>w.id===other.dataset.worker);
    if(!a||!b||a.level!==b.level||a.level>=6){toast('같은 레벨의 일용직을 겹쳐 놓으면 합성할 수 있어요.',true);renderMine();return;}
    settleMineDrop('worker/merge',{a:a.id,b:b.id});return;
  }
  if(gate){settleMineDrop('mine/gate',{worker:d.id});return;}
  if(tile?.dataset.tile!==undefined){
    const idx=Number(tile.dataset.tile),node=state.me.game.mine.nodes[idx];
    if(node.done)settleMineDrop('mine/move',{worker:d.id,x:idx%5,y:Math.floor(idx/5)});
    else settleMineDrop('mine/dispatch',{worker:d.id,idx});
    return;
  }
  if(tile?.dataset.start!==undefined){settleMineDrop('mine/move',{worker:d.id,x:Number(tile.dataset.start),y:8});return;}
  toast('자원이나 빈 통로 위에 일용직을 내려놓아 주세요.');renderMine();
}
document.addEventListener('pointerdown',e=>{if(e.target.closest('#warScroller')&&animation)animation.manualCamera=true;
  const sprite=e.target.closest('.mine-worker');
  if(!sprite||selectedTab!=='mine'||e.button>0||!state||miningDragging||miningSettling)return;
  e.preventDefault();selectedWorker=sprite.dataset.worker;
  const r=sprite.getBoundingClientRect(),board=sprite.offsetParent,b=board.getBoundingClientRect(),sx=b.width/board.offsetWidth||1,sy=b.height/board.offsetHeight||1;
  sprite.getAnimations().forEach(a=>a.cancel());sprite.classList.remove('just-summoned');
  sprite.style.left=((r.left+r.width/2-b.left)/sx-board.clientLeft)+'px';
  sprite.style.top=((r.top+r.height/2-b.top)/sy-board.clientTop)+'px';
  document.querySelectorAll('.mine-worker.selected').forEach(n=>n.classList.remove('selected'));
  sprite.classList.add('selected','dragging');sprite.style.pointerEvents='none';
  miningDragging={id:selectedWorker,pointerId:e.pointerId,x:e.clientX,y:e.clientY,clientX:e.clientX,clientY:e.clientY,sprite,sx,sy,frame:0,drop:null};
  sprite.setPointerCapture(e.pointerId);paintMineDrag(miningDragging);
});
document.addEventListener('pointermove',e=>{
  const d=miningDragging;if(!d||d.pointerId!==e.pointerId)return;
  e.preventDefault();d.clientX=e.clientX;d.clientY=e.clientY;
  if(!d.frame)d.frame=requestAnimationFrame(()=>paintMineDrag(d));
},{passive:false});
document.addEventListener('pointerup',e=>endMineDrag(e));
document.addEventListener('pointercancel',e=>endMineDrag(e,true));
document.addEventListener('lostpointercapture',e=>endMineDrag(e,true));
window.addEventListener('blur',()=>{const d=miningDragging;if(d)endMineDrag({pointerId:d.pointerId,clientX:d.clientX,clientY:d.clientY},true);});
document.addEventListener('dragstart',e=>{if(e.target.closest('.mine-worker'))e.preventDefault();});
document.addEventListener('click',handleAction);
$('modalOverlay').addEventListener('click',e=>{if(e.target===$('modalOverlay'))dismissModal()});$('cashResource').addEventListener('click',openShop);$('boxResource').addEventListener('click',()=>setTab('mine'));$('guideBtn').addEventListener('click',()=>{onboardStep=0;showTutorial()});$('profileBtn').addEventListener('click',openProfile);$('mailBtn').addEventListener('click',openMail);
$('onboardNext').addEventListener('click',advanceOnboarding);$('onboardSkip').addEventListener('click',()=>{if(!state?.me.game.storySeen||!state?.me.game.tutorialSeen)return;if(onboardStep<5){onboardStep=5;renderTutorial();}else completeTutorial()});
document.addEventListener('input',e=>{if(e.target.id==='warSlider'){warCount=Number(e.target.value);updateMarchCounts();}});
document.addEventListener('submit',async e=>{if(e.target.id==='chatForm'){e.preventDefault();const input=$('chatInput'),message=input.value.trim();if(!message)return;try{await api('/api/chat','POST',{message,requestId:crypto.randomUUID()});input.value='';chatForceBottom=true;await loadState({silent:true});toast('채팅을 전송했어요.')}catch(err){toast(err.message,true)}return;}
if(e.target.id==='authForm'){e.preventDefault();const pin=$('pinField').value,nickname=$('nickField').value.trim(),world=$('worldField').value.trim().toUpperCase();const submit=$('authSubmit');submit.disabled=true;try{const master=authMode==='login'&&nickname.toLowerCase()==='master';await api(master?'/api/admin/login':'/api/'+authMode,'POST',{pin,nickname,world:master?'':world});if(master)await loadAdmin();else{localStorage.removeItem(ADMIN_KEY);await loadState();}}catch(err){toast(err.message,true)}finally{submit.disabled=false;}return;}});
$('signupTab').addEventListener('click',()=>{authMode='register';syncMasterForm();$('signupTab').classList.add('active');$('loginTab').classList.remove('active');$('authSubmit').textContent='혁명 시작하기 →';});$('loginTab').addEventListener('click',()=>{authMode='login';syncMasterForm();$('loginTab').classList.add('active');$('signupTab').classList.remove('active');$('authSubmit').textContent='기존 계정으로 로그인 →';});
setInterval(()=>{if(!state||document.hidden||showOnboard||(!$('modalOverlay').classList.contains('hidden')&&!$('modalContent').querySelector('[data-mail-read]'))||animating||miningDragging||miningSettling||recruiting)return;loadState({silent:true});},5000);

let timerRefreshAt=0,chatComposing=false;
document.addEventListener('compositionstart',e=>{if(e.target.id==='chatInput')chatComposing=true;});
document.addEventListener('compositionend',e=>{if(e.target.id==='chatInput')chatComposing=false;});
setInterval(()=>{
 if(!state||document.hidden||showOnboard)return;
 const now=serverNow(),g=state.me.game;let mineDue=false;
 document.querySelectorAll('[data-live-end]').forEach(el=>el.textContent=timeLeft(Number(el.dataset.liveEnd)-now));
 document.querySelectorAll('[data-progress-end]').forEach(el=>{const a=Number(el.dataset.progressStart),b=Number(el.dataset.progressEnd);el.style.width=Math.max(0,Math.min(100,100*(now-a)/Math.max(1,b-a)))+'%';});
 if(selectedTab==='mine'&&!miningDragging&&!miningSettling){
   document.querySelectorAll('.mine-tile[data-tile]').forEach(el=>{
     const idx=Number(el.dataset.tile),n=g.mine.nodes[idx];if(!n||n.done)return;
     const workers=g.workers.filter(w=>workerTargetRate(w,g,idx)>0),rate=workers.reduce((sum,w)=>sum+workerTargetRate(w,g,idx),0);
     const elapsed=Math.max(0,(now-state.serverTime)/1000),boosted=Math.max(0,Math.min(elapsed,(g.shop.boostUntil-state.serverTime)/1000)),hp=Math.max(0,n.hp-rate*(elapsed+boosted));
     if(rate>0&&hp<=0)mineDue=true;
     const bar=el.querySelector('.mine-ore-health i');if(bar)bar.style.width=(100*hp/n.max)+'%';
     const timer=el.querySelector('.mine-ore-timer');if(timer)timer.textContent=hp<=0?'수령 중':timeLeft(hp/(rate*(g.shop.boostUntil>now?2:1))*1000);
   });
   const gate=g.mine.gate,rate=g.workers.filter(w=>w.target==='gate').reduce((sum,w)=>sum+workerTargetRate(w,g,'gate')*(g.forklift?.workerId===w.id&&(g.forklift.permanent||g.forklift.until>serverNow())?1.5:1),0);
   if(gate&&!gate.done&&rate){
    const elapsed=Math.max(0,(now-state.serverTime)/1000),boosted=Math.max(0,Math.min(elapsed,(g.shop.boostUntil-state.serverTime)/1000)),hp=Math.max(0,gate.hp-rate*(elapsed+boosted));
    const bar=document.querySelector('[data-gate-bar]'),count=document.querySelector('[data-gate-count]'),timer=document.querySelector('[data-gate-timer]');
    if(bar)bar.style.width=100*hp/gate.max+'%';if(count)count.textContent=number(hp)+' / '+number(gate.max);if(timer)timer.textContent=timeLeft(hp/(rate*(g.shop.boostUntil>now?2:1))*1000);
    if(hp<=0)mineDue=true;
   }
 }
 const due=[...(g.recruitQueue||[]),...g.upgrades,...(g.wounded||[])].some(j=>j.endAt<=now)||(g.exploration&&!g.exploration.notified&&g.exploration.endAt<=now);
 if((due||mineDue)&&!miningDragging&&!miningSettling&&!animating&&now-timerRefreshAt>1200){timerRefreshAt=now;loadState({silent:true});}
},150);

if(localStorage.getItem(ADMIN_KEY))loadAdmin();else loadState({silent:true});

$('enterSignup').addEventListener('click',()=>{$('auth').classList.add('auth-open');$('signupTab').click();});
$('enterLogin').addEventListener('click',()=>{$('auth').classList.add('auth-open');$('loginTab').click();});
$('titleBack').addEventListener('click',()=>$('auth').classList.remove('auth-open'));

$('nickField').addEventListener('input',syncMasterForm);

function reservedUi(g){return (g.pendingBattle?.amount||0)+(g.exploration?.amount||0)+(g.wounded||[]).reduce((s,j)=>s+j.amount,0);}
function modalHead(title){return `<div class="modal-header"><h2 class="modal-title">${title}</h2><button class="modal-close" data-close>닫기 ✕</button></div>`;}
function rewardText(r){return Object.entries(r||{}).map(([k,v])=>({boxes:'📦 박스',cash:'💰 희귀 돈',normalTickets:'일반 모집권',rareTickets:'희귀 모집권',heroXp:'파트장 경험치',forkliftTickets:'지게차 7일 이용권'}[k]||k)+' '+number(v)).join(' · ');}
function woundedMarkup(g){return g.wounded?.length?`<div class="card"><div class="card-head"><h3>💚 사원 회복실</h3><button class="btn btn-outline" data-heal ${!g.inventory.healAid?'disabled':''}>치료권 사용</button></div>${g.wounded.map(j=>`<div class="statrow"><span>회복 중 ${j.amount}명</span><b data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</b></div>`).join('')}</div>`:'';}
function heroPicker(){
 const heroes=state.progression.heroes;if(!heroes.some(v=>v.id===warHero&&v.star&&!v.busy))warHero=heroes.find(v=>v.star&&!v.busy)?.id||'';
 return `<section class="march-heroes"><h3>출정 파트장</h3><div class="march-hero-grid">${heroes.map(v=>`<button class="march-hero-card ${v.id===warHero?'chosen':''} ${!v.star?'unowned':''}" data-march-hero="${v.id}" aria-pressed="${v.id===warHero}" ${!v.star||v.busy?'disabled':''}><img src="assets/hero-${v.id}.webp" alt=""><strong>${h(v.name)}</strong><small>${v.busy?'출정 중':v.star?'★'.repeat(v.star)+' · Lv.'+v.level:'미보유'}</small>${v.id===warHero?'<b class="chosen-check">✓</b>':''}</button>`).join('')}</div>${!heroes.some(v=>v.star)?'<button class="btn btn-gold btn-wide" data-workbook>업무수첩에서 첫 파트장 합류</button>':''}</section>`;
}

const rarityOf=id=>['cs','beauty','returns'].includes(id)?'rare':'normal';
const gradeName=grade=>grade==='rare'?'희귀':'일반';
function heroRosterMarkup(heroes){return ['normal','rare'].map(grade=>{const group=heroes.filter(v=>rarityOf(v.id)===grade);if(!group.length)return '';return `<h3 class="rarity-heading ${grade}">${gradeName(grade)} 파트장</h3><div class="hero-roster">${group.map(v=>`<button class="hero-card ${grade} ${v.star?'':'unowned'}" data-hero-detail="${v.id}"><img src="assets/hero-${v.id}.webp" alt="${h(v.name)}"><span class="rarity-badge ${grade}">${gradeName(grade)}</span><span class="hero-card-name">${h(v.name)}</span><b>${v.star?'★'.repeat(v.star)+' · Lv.'+v.level:'조각 '+v.shards+'/10'}</b><small>${v.busy?'출정 중':v.role}</small>${v.levelUpgrade?.enabled||v.starUpgrade?.enabled?'<span class="hero-ready">강화 가능</span>':''}</button>`).join('')}</div>`;}).join('');}
function openHeroes(){showModal(`${modalHead('⭐ 재고관리 파트장')}${heroRosterMarkup(state.progression.heroes)}${!state.me.game.quests.starter?'<button class="btn btn-gold btn-wide" data-claim-quest="starter">첫 파트장 확정 합류 · 냉동 파트장</button>':''}`);}
function openXpHeroes(grade='normal'){const inv=state.me.game.inventory,owned=state.progression.heroes.filter(v=>v.star&&rarityOf(v.id)===grade);showModal(`${modalHead('📘 경험치 교본 사용')}<div class="xp-intro"><h3>${gradeName(grade)} 교본 ${number(inv[grade+'HeroXp'])} XP</h3><p>${gradeName(grade)} 파트장의 레벨 강화에 사용합니다.</p></div>${owned.length?heroRosterMarkup(owned):'<p class="xp-intro">이 등급의 보유 파트장이 없습니다.</p>'}`);}
function heroGrowthMarkup(before,after){if(!before||!after)return '';return `<div class="hero-growth-stats">${[['hp','체력'],['damage','공격력']].map(([key,label])=>`<div><span>${label}</span><b>${number(before[key])} <em>→</em> ${number(after[key])}</b><strong>+${number(after[key]-before[key])}</strong></div>`).join('')}</div>`;}
function heroUpgradeCard(v,type){const preview=type==='level'?v.levelUpgrade:v.starUpgrade;if(!preview)return '';return `<section class="hero-upgrade-option"><h4>${type==='level'?'📘 레벨 강화':'🧩 성급 강화'} <span>${preview.after?(type==='level'?'Lv.'+(v.level+1):'★'.repeat(v.star+1)):'최대'}</span></h4>${heroGrowthMarkup(preview.before,preview.after)}<p>${!preview.after?'최대 강화에 도달했습니다.':type==='level'?`필요 ${number(preview.cost)} XP · 보유 ${number(preview.totalXp)} XP`:`전용 조각 ${number(v.shards)} / ${number(preview.cost)}개`}</p><button class="btn btn-gold btn-wide ${preview.enabled?'can-upgrade':''}" data-hero-action="${type}" data-id="${v.id}" ${preview.enabled?'':'disabled'}>${preview.enabled?(type==='level'?'레벨 강화':'성급 강화'):preview.reason.includes('최대')?'최대 도달':v.busy?'복귀 후 강화':type==='level'?'경험치 부족':'조각 부족'}</button>${preview.reason?`<p class="upgrade-reason" role="status">${h(preview.reason)}</p>`:''}</section>`;}
function openHero(id,change=null){const v=state.progression.heroes.find(v=>v.id===id),g=state.me.game;if(!v)return;showModal(`${modalHead(h(v.name))}${change?`<section class="hero-upgraded" role="status"><h3>✨ ${change.type==='level'?'레벨':'성급'} 강화 완료</h3>${heroGrowthMarkup(change.before,change.after)}</section>`:''}<div class="hero-detail"><img class="hero-portrait" src="assets/hero-${v.id}.webp" alt="${h(v.name)}"><div><span class="rarity-badge ${rarityOf(v.id)}">${gradeName(rarityOf(v.id))}</span><div class="hero-stars">${v.star?'★'.repeat(v.star):'미보유'}</div><h3>${v.role} · Lv.${v.level}</h3>${v.stats?`<div class="gridstats"><div class="statbox"><small>체력</small><strong>${number(v.stats.hp)}</strong></div><div class="statbox"><small>공격력</small><strong>${number(v.stats.damage)}</strong></div><div class="statbox"><small>공격 속도</small><strong>${v.stats.interval}초</strong></div></div>`:''}<h3>${h(v.skill)}</h3><p>${h(v.description)}</p><p>적과 교전 시 자동 발동 · 재사용 ${v.stats?.cooldown||12}초</p></div></div>${v.star?`<div class="hero-xp-wallet"><b><img class="book-inline" src="assets/book-${rarityOf(v.id)}.webp" alt=""> ${gradeName(rarityOf(v.id))} 교본 ${number(g.inventory[rarityOf(v.id)+'HeroXp'])} XP</b><span>전용 경험치 ${number(v.xp||0)} XP</span></div><p class="growth-help">레벨·성급 강화로 체력과 공격력이 올라갑니다. 공격 속도와 스킬 효과는 유지됩니다.</p><div class="hero-upgrade-options">${heroUpgradeCard(v,'level')}${heroUpgradeCard(v,'star')}</div><button class="btn btn-outline btn-wide" data-hero-action="defense" data-id="${id}" ${v.busy?'disabled':''}>${g.defenseHero===id?'✓ 센터 방어 편성 중':'센터 방어에 편성'}</button>`:`<div class="shard-progress">${puzzleMarkup(v.id)}<span>전용 조각 ${v.shards} / 10</span></div><button class="btn btn-gold btn-wide ${v.shards>=10?'can-upgrade':''}" data-hero-action="unlock" data-id="${id}" ${v.shards<10?'disabled':''}>조각 10개로 파트장 해금</button><p class="growth-help">완성본을 중복으로 획득하면 전용 조각 10개로 전환됩니다.</p>`}<button class="btn btn-outline btn-wide" style="margin-top:12px" data-heroes>파트장 목록</button>`);$('modalContent').scrollTop=0;}
function openRecruitment(pulls){closeModal();shopGroup='recruit';setTab('shop');if(pulls)showRecruitResults(pulls);}

function openExplore(){marchContext='explore';const g=state.me.game,j=g.exploration;warCount=Math.max(1,Math.min(warCount,g.troops||1));showModal(`${modalHead('🧭 탐사전')}${j?`<div class="explore-active"><img src="assets/hero-${j.heroId}.webp" alt="탐사 파트장"><h3>${h(j.name)}</h3><p>사원 ${j.amount}명 · ${h(FORMATIONS.find(f=>f.id===j.formation?.preset)?.name||'기본 편성')}</p><b data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</b><p>${rewardText(j.reward)}${j.shards?' · 편성 파트장 조각 '+j.shards:''}</p><button class="btn btn-gold btn-wide" data-explore-claim ${j.endAt>serverNow()?'disabled':''}>${j.endAt>serverNow()?'탐사 진행 중':'보상 수령 · 전원 귀환'}</button></div>`:`${heroPicker()}${troopPicker()}<p class="explore-limit">오늘 탐사 ${g.exploreDaily.count}/3 · 전원 귀환</p>${state.progression.explorations.map(m=>`<div class="mission-card"><h3>${h(m.name)}</h3><b>${timeLeft(m.seconds*1000)} · 최소 사원 ${m.minTroops}명</b><p>📦 ${m.boxes} · 경험치 ${m.xp} · 일반 모집권 ${m.ticket}${m.shards?' · 편성 파트장 조각 '+m.shards:''}</p><button class="btn btn-gold btn-wide" data-explore-start="${m.id}" data-min-troops="${m.minTroops}" ${!warHero||warCount<m.minTroops||g.troops<m.minTroops||g.exploreDaily.count>=3?'disabled':''}>탐사 출발</button></div>`).join('')}`}`);}

function openEvents(){const a=state.progression.attendance;showModal(`${modalHead('🎁 7일 출석')}<div class="attendance-title"><h3>7일 출석하고 지게차를 타자!</h3><p>누적 출석 · 빠진 날에도 기록이 유지돼요</p></div><div class="attendance-grid">${a.rewards.map((r,i)=>`<div class="attendance-day ${i===6?'last-day':''} ${i<a.claimed?'claimed':''}"><b>${i+1}일차</b>${i===6?'<img class="attendance-forklift" src="assets/forklift-cute.webp" alt="지게차 7일 이용권">':`<span>${i<a.claimed?'✓':'🎁'}</span>`}<small>${rewardText(r)}</small>${i===a.claimed?`<button data-attendance class="btn btn-gold" ${!a.claimable?'disabled':''}>${a.claimable?'받기':'내일 만나요'}</button>`:i<a.claimed?'<strong>수령 완료</strong>':''}</div>`).join('')}</div><p class="pool-disclosure">한국시간 자정 기준 하루 한 번 수령합니다. 지게차 이용권은 창고에 보관되며 사용한 순간부터 7일간 적용됩니다.</p>`);}

function inventoryMarkup(){return warehouseItemsMarkup();}

function openForklift(){const g=state.me.game,active=g.forklift.permanent||g.forklift.until>serverNow();showModal(`${modalHead('지게차 배치')}<div class="inventory-card"><img src="assets/forklift-cute.webp" alt="지게차"><p>${active?'일용직 1명에게 탑승시켜 주세요.':'7일 출석 이벤트에서 이용권을 획득할 수 있습니다.'}</p>${active?g.workers.filter(w=>!w.parked).map(w=>`<button class="btn btn-gold btn-wide" data-equip-forklift="${w.id}">Lv.${w.level} 일용직 ${g.forklift.workerId===w.id?'✓ 탑승 중':'탑승'}</button>`).join(''):''}${g.forklift.workerId?'<button class="btn btn-outline" data-equip-forklift="">내리기</button>':''}<button class="btn btn-outline btn-wide" data-inventory>이용권 확인</button></div>`);}
function maybeEventPopup(){if(!state||showOnboard||isTrainingActive()||(state.me.game.onboarding&&!state.me.game.onboarding.acknowledged)||animation||recruiting||popupPending||!$('modalOverlay').classList.contains('hidden'))return;const a=state.progression?.attendance,today=new Date(serverNow()+9*3600000).toISOString().slice(0,10);if(a?.claimable&&a.popupDay!==today){popupPending=true;a.popupDay=today;openEvents();api('/api/action','POST',{type:'event/popup',requestId:crypto.randomUUID()}).finally(()=>popupPending=false);}}
function handleV17Button(b){
 const d=b.dataset;
 if(d.notices!==undefined){openNotice();return true;}if(d.copySupport!==undefined){copySupportAccount(b);return true;}
 if(d.recruitReveal!==undefined){if(recruitReady)showRecruitResults(recruitReady.pulls);return true;}if(d.recruitClose!==undefined){$('recruitOverlay').classList.add('hidden');recruiting=false;recruitReady=null;if(selectedTab==='shop')renderShop();return true;}
 if(d.releaseArea){confirmReleaseArea(d.releaseArea);return true;}if(d.releaseCancel!==undefined){openWarChooser();return true;}if(d.releaseConfirm){b.disabled=true;doAction('territory/release',{areaId:d.releaseConfirm}).then(r=>{if(r)openWarChooser();else b.disabled=false;});return true;}if(d.chatExpand!==undefined){chatExpanded=!chatExpanded;render();return true;}if(d.chatBottom!==undefined){const list=document.querySelector('.chat-list');if(list)list.scrollTop=list.scrollHeight;syncChatBadge();return true;}if(d.recruitPool){recruitPool=d.recruitPool;renderShop();return true;}if(d.serverPage){serverPage=d.serverPage;chatExpanded=false;render();return true;}if(d.useXp!==undefined){openXpHeroes(d.useXp||'normal');return true;}if(d.events!==undefined){openEvents();return true;}if(d.workbook!==undefined){openWorkbook();return true;}if(d.warehousePage){openWarehouse(d.warehousePage);return true;}if(d.heroes!==undefined){openHeroes();return true;}if(d.heroDetail){openHero(d.heroDetail);return true;}if(d.recruitment!==undefined){openRecruitment();return true;}if(d.explore!==undefined){warCount=Math.max(1,Math.min(warCount,state.me.game.troops));openExplore();return true;}if(d.forklift!==undefined){openForklift();return true;}if(d.inventory!==undefined){openWarehouse();return true;}if(d.marchHero){warHero=d.marchHero;refreshMarch();return true;}if(d.formation){warFormation=d.formation;refreshMarch();return true;}if(d.marchFraction){warCount=Math.max(1,Math.floor(state.me.game.troops*Number(d.marchFraction)));refreshMarch();return true;}if(d.marchAdjust){warCount=Math.max(1,Math.min(state.me.game.troops||1,warCount+Number(d.marchAdjust)));refreshMarch();return true;}if(d.recruitRetry!==undefined){const pending=pendingRecruitment();if(pending)startRecruitment(pending.pool,pending.count);return true;}if(d.recruitRecent!==undefined){showRecruitResults(state.me.game.lastRecruitment?.pulls||[]);return true;}
 if(d.researchGroup){researchGroup=d.researchGroup;renderCenter();return true;}if(d.shopGroup){shopGroup=d.shopGroup;renderShop();return true;}
 let type,params={},after;
 if(d.attendance!==undefined){type='event/attendance';after=()=>{if(!$('modalOverlay').classList.contains('hidden')&&$('modalContent').classList.contains('modal-attendance'))openEvents();};}
 else if(d.claimQuest){type='quest/claim';params={quest:d.claimQuest};after=()=>d.claimQuest==='starter'?openHeroes():openWorkbook();}
 else if(d.heroAction){type='hero/'+d.heroAction;params={hero:d.id};after=r=>openHero(d.id,r.heroUpgrade);}
 else if(d.draw){startRecruitment(d.draw,Number(d.count));return true;}
 else if(d.exploreStart){type='explore/start';params={mission:d.exploreStart,hero:warHero,amount:warCount,formation:warFormation};after=openExplore;}
 else if(d.exploreClaim!==undefined){type='explore/claim';after=openExplore;}
 else if(d.activateForklift!==undefined){type='forklift/activate';after=()=>openWarehouse();}
 else if(d.equipForklift!==undefined){type='forklift/equip';params={worker:d.equipForklift};after=openForklift;}
 else if(d.researchAid){type='item/research';params={job:d.researchAid};after=()=>openWarehouse();}
 else if(d.heal!==undefined){type='item/heal';after=()=>openWarehouse();}
 if(type){b.disabled=true;doAction(type,params).then(r=>{if(r)after?.(r);else b.disabled=false;});return true;}return false;
}

function syncMasterForm(){const master=authMode==='login'&&$('nickField').value.trim().toLowerCase()==='master';$('worldField').required=!master;$('worldField').closest('form').classList.toggle('master-login',master);if(master)$('worldField').value='';}
async function loadAdmin(){try{adminState=await api('/api/admin/state');state=null;$('auth').classList.add('hidden');$('app').classList.add('hidden');$('adminApp').classList.remove('hidden');renderAdmin();}catch(e){localStorage.removeItem(ADMIN_KEY);$('adminApp').classList.add('hidden');$('auth').classList.remove('hidden');toast(e.message,true);}}
function renderAdmin(){const a=adminState;$('adminApp').innerHTML=`<div class="admin-header"><h2>센터 운영 관리</h2><button class="btn btn-outline" data-admin-logout>로그아웃</button></div><p>관리자 관찰 · 일반 유저 목록과 랭킹에 표시되지 않습니다.</p><div class="admin-layout"><div class="card"><h3>서버 목록</h3>${a.servers.map(s=>`<button class="btn ${s.world===a.world?'btn-gold':'btn-outline'} btn-wide" data-admin-world="${h(s.world)}">${h(s.world)} · ${s.players}명</button>`).join('')}</div><div class="card"><h3>${h(a.world||'서버를 선택하세요')}</h3>${a.world?`<div class="admin-users">${a.players.map(p=>`<div class="admin-user"><b>${h(p.nickname)}</b><span>${p.suspended?'정지 중':'이용 중'}</span><button class="btn btn-outline" data-admin-action="${p.suspended?'resume':'suspend'}" data-id="${p.id}">${p.suspended?'해제':'정지'}</button><button class="btn btn-outline" data-admin-confirm="deletePlayer" data-id="${p.id}" data-name="${h(p.nickname)}">계정 삭제</button></div>`).join('')}</div><button class="btn btn-danger btn-wide" data-admin-confirm="deleteWorld" data-name="${h(a.world)}">이 서버 전체 삭제</button>`:''}</div></div><div class="card"><h3>관리 이력</h3>${a.audit.map(j=>`<div class="statrow"><span>${h(j.world)} · ${h(j.action)}</span><small>${new Date(Number(j.at)).toLocaleString('ko-KR')}</small></div>`).join('')}</div>`;}
function handleAdminButton(b){const d=b.dataset;if(d.adminLogout!==undefined){api('/api/admin/logout','POST',{}).finally(()=>{localStorage.removeItem(ADMIN_KEY);location.reload();});return true;}if(d.adminWorld){api('/api/admin/select','POST',{world:d.adminWorld}).then(loadAdmin).catch(e=>toast(e.message,true));return true;}if(d.adminConfirm){showModal(`${modalHead(d.adminConfirm==='deleteWorld'?'서버 전체 삭제':'계정 삭제')}<p><strong>${h(d.name)}</strong> 삭제는 되돌릴 수 없습니다. 대상 이름을 정확히 입력해 주세요.</p><input id="adminConfirmText" autocomplete="off" aria-label="삭제 대상 이름 확인"><button class="btn btn-danger btn-wide" data-admin-action="${d.adminConfirm}" data-id="${d.id||''}">삭제 실행</button>`);return true;}if(d.adminAction){b.disabled=true;api('/api/admin/moderate','POST',{action:d.adminAction,world:adminState.world,target:d.id,confirm:$('adminConfirmText')?.value||''}).then(()=>{closeModal();loadAdmin();}).catch(e=>{toast(e.message,true);b.disabled=false;});return true;}if(adminState&&d.close!==undefined){closeModal();return true;}return false;}

function workerTargetRate(w,g,idx){
 if(w.parked||w.target===null)return 0;
 const forklift=g.forklift?.workerId===w.id&&(g.forklift.permanent||g.forklift.until>serverNow());
 if(!forklift||w.target==='gate')return w.target===idx?workerDps(w,g):0;
 const targets=g.mine.nodes.map((n,i)=>({n,i})).filter(({n,i})=>!n.done&&Math.abs(i%5-w.x)+Math.abs(Math.floor(i/5)-w.y)===1).map(v=>v.i);
 return targets.includes(idx)?workerDps(w,g)*1.5/targets.length:0;
}

function puzzleMarkup(id){return `<span class="puzzle-token"><img class="puzzle-piece" src="assets/puzzle-fragment.webp" alt="파트장 퍼즐 조각"><img class="puzzle-identity" src="assets/hero-${h(id)}.webp" alt=""></span>`;}
function troopPicker(){const available=state.me.game.troops;warCount=available?Math.max(1,Math.min(warCount,available)):0;return `<section class="march-troops"><div class="statrow"><h3>출정 사원</h3><strong id="warCountView">${warCount} / ${available}명</strong></div><div class="march-amount"><button class="btn btn-outline" data-march-adjust="-1" aria-label="출정 사원 1명 줄이기" ${!available?'disabled':''}>−</button><input id="warAmount" type="number" inputmode="numeric" aria-label="출정 사원 수" min="1" max="${available||1}" value="${warCount}" ${!available?'disabled':''}><button class="btn btn-outline" data-march-adjust="1" aria-label="출정 사원 1명 늘리기" ${!available?'disabled':''}>＋</button></div><input id="warSlider" aria-label="출정 인원 조절" type="range" min="1" max="${available||1}" value="${warCount||1}" ${!available?'disabled':''}><div class="march-fractions">${[[.25,'25%'],[.5,'50%'],[.75,'75%'],[1,'전체']].map(([value,label])=>`<button class="btn btn-outline" data-march-fraction="${value}" ${!available?'disabled':''}>${label}</button>`).join('')}</div>${marchPowerMarkup()}<h3>자동 편성</h3><div class="formation-grid">${FORMATIONS.map(f=>{const roster=buildFormation(warCount,f.id);return `<button class="formation-card ${warFormation===f.id?'chosen':''}" data-formation="${f.id}" aria-pressed="${warFormation===f.id}"><img src="assets/${f.image}.webp" alt=""><strong>${f.name}</strong><span class="formation-counts" data-formation-preview="${f.id}">${formationCountText(roster.roles)}</span>${warFormation===f.id?'<b class="chosen-check">✓</b>':''}</button>`;}).join('')}</div><p class="march-caption">선택한 출정 인원 안에서 병과별 인원을 자동 배분합니다.</p></section>`;}
function formationCountText(roles){return TROOP_ROLES.map(r=>`${r.name} ${number(roles[r.id]||0)}`).join(' · ');}
function selectedMarchPower(){const hero=state.progression.heroes.find(v=>v.id===warHero&&v.star&&!v.busy);return marchPower(state.unitStats,hero?.stats,warCount,formationFactors(buildFormation(warCount,warFormation)));}
function marchPowerMarkup(){const hero=state.progression.heroes.find(v=>v.id===warHero);return `<div class="march-power"><span>출정 병력 전투력</span><strong data-march-power>${number(selectedMarchPower())}</strong><small data-march-summary>${h(hero?.name||'파트장 선택 전')} · 사원 ${warCount}명</small></div>`;}
function ownedTerritoriesMarkup(){const owned=(state.territories||[]).filter(v=>v.mine);return `<section class="owned-territories"><h3>내 정복지 ${owned.length} / ${state.territoryCap}</h3>${owned.map(v=>`<div class="owned-area"><div><strong>${h(v.name)}</strong><small>시간당 📦 ${number(v.boxesPerHour)} · 💰 ${number(v.cashPerHour)}</small></div><button class="btn btn-outline" data-release-area="${v.id}" ${v.busy||state.me.game.pendingBattle?'disabled':''}>포기</button></div>`).join('')||'<p>보유한 정복지가 없습니다.</p>'}</section>`;}
function confirmReleaseArea(id){const v=state.territories.find(v=>v.id===id&&v.mine);if(!v)return;showModal(`${modalHead('정복지 포기')}<div class="release-confirm"><h3>${h(v.name)}</h3><p>포기하면 중립지대가 되고 이곳의 시간당 수입이 중단됩니다. 다시 보유하려면 정복전을 치러야 합니다.</p><button class="btn btn-danger btn-wide" data-release-confirm="${v.id}">정복지 포기하기</button><button class="btn btn-outline btn-wide" data-release-cancel>돌아가기</button></div>`);}
function refreshMarch(){const scroll=$('modalContent').scrollTop;if(marchContext==='explore')openExplore();else openWarChooser();$('modalContent').scrollTop=scroll;}
function updateMarchCounts(){const available=state?.me.game.troops||0;warCount=available?Math.max(1,Math.min(warCount,available)):0;document.querySelectorAll('[data-march-power]').forEach(el=>el.textContent=number(selectedMarchPower()));document.querySelectorAll('[data-march-summary]').forEach(el=>el.textContent=(state.progression.heroes.find(v=>v.id===warHero)?.name||'파트장 선택 전')+' · 사원 '+warCount+'명');if($('warCountView'))$('warCountView').textContent=warCount+' / '+available+'명';if($('warAmount'))$('warAmount').value=warCount;document.querySelectorAll('[data-formation-preview]').forEach(el=>el.textContent=formationCountText(buildFormation(warCount,el.dataset.formationPreview).roles));document.querySelectorAll('[data-explore-start]').forEach(el=>el.disabled=!warHero||warCount<Number(el.dataset.minTroops)||state.me.game.exploreDaily.count>=3);}
document.addEventListener('change',e=>{if(e.target.id==='warAmount'){const count=Number(e.target.value);if(Number.isSafeInteger(count)){warCount=count;refreshMarch();}}});
function openWorkbook(){showModal(`${modalHead('📒 센터장 업무수첩')}<div class="workbook-intro"><h3>센터장의 첫걸음</h3><span>${state.progression.quests.filter(q=>q.claimed).length} / ${state.progression.quests.length} 완료</span></div>${state.progression.quests.map(q=>`<div class="mission-card"><h3>${h(q.name)}</h3><p>${q.description||rewardText(q.reward)}</p><button class="btn btn-gold" data-claim-quest="${q.id}" ${!q.ready||q.claimed?'disabled':''}>${q.claimed?'수령 완료':q.ready?'보상 받기':'진행 중'}</button></div>`).join('')}`);}
function openWarehouse(page=warehousePage){warehousePage=page;showModal(`${modalHead('📦 내 창고')}<div class="warehouse-art" role="img" aria-label="센터 창고"></div><div class="category-tabs"><button class="btn ${page==='items'?'btn-gold':'btn-outline'}" data-warehouse-page="items">보급품</button><button class="btn ${page==='shards'?'btn-gold':'btn-outline'}" data-warehouse-page="shards">파트장 조각</button></div>${page==='shards'?`<div class="warehouse-shards">${state.progression.heroes.filter(v=>v.shards>0).map(v=>`<button class="warehouse-shard" data-hero-detail="${v.id}">${puzzleMarkup(v.id)}<strong>${h(v.name)}</strong><b>${number(v.shards)}조각</b></button>`).join('')||'<p class="empty-storage">보유한 파트장 조각이 없습니다.</p>'}</div>`:warehouseItemsMarkup()}`);}
function warehouseItemsMarkup(){const g=state.me.game,inv=g.inventory;return `<div class="warehouse-item-grid"><button class="stored-item" data-recruitment><img src="assets/ticket-normal.webp" alt="일반 모집권"><strong>일반 모집권</strong><b>${inv.normalTickets}장</b></button><button class="stored-item" data-recruitment><img src="assets/ticket-rare.webp" alt="희귀 모집권"><strong>희귀 모집권</strong><b>${inv.rareTickets}장</b></button>${['normal','rare'].map(grade=>`<button class="stored-item" data-use-xp="${grade}"><img src="assets/${'book-'+grade}.webp" alt="경험치 교본"><strong>${gradeName(grade)} 경험치 교본</strong><b>${number(inv[grade+'HeroXp'])} XP</b><small>${gradeName(grade)} 파트장 레벨 강화</small></button>`).join('')}</div><div class="inventory-card"><img src="assets/forklift-cute.webp" alt="지게차"><h3>지게차 7일 이용권 · ${inv.forkliftTickets}장</h3>${g.forklift.until>serverNow()?`<b>남은 시간 <span data-live-end="${g.forklift.until}">${timeLeft(g.forklift.until-serverNow())}</span></b>`:''}<button class="btn btn-gold btn-wide" data-activate-forklift ${!inv.forkliftTickets?'disabled':''}>이용권 사용 · 7일 시작</button></div><div class="inventory-card supply-card"><img src="assets/research-voucher.webp" alt="연구 단축권"><h3>연구 10분 단축권 · ${inv.researchAid}장</h3>${g.upgrades.map(j=>`<button class="btn btn-outline btn-wide" data-research-aid="${j.id}" ${!inv.researchAid?'disabled':''}>${h(UPGRADES.find(v=>v.key===j.key)?.name)} 단축</button>`).join('')||'<p>진행 중인 연구가 없습니다.</p>'}</div><div class="inventory-card supply-card"><img src="assets/medical-kit.webp" alt="사원 치료권"><h3>사원 치료권 · ${inv.healAid}장</h3><button class="btn btn-outline" data-heal ${!inv.healAid||!g.wounded.length?'disabled':''}>회복 중 사원 전원 치료</button></div>`;}
function recruitmentShopMarkup(){const g=state.me.game,pool=recruitPool,rare=pool==='rare',tickets=g.inventory[pool+'Tickets'];return `${pendingRecruitment()?'<button class="btn btn-gold btn-wide" data-recruit-retry>중단된 모집 결과 확인</button>':''}<div class="category-tabs recruit-tabs">${['normal','rare'].map(id=>`<button class="btn ${pool===id?'btn-gold':'btn-outline'}" data-recruit-pool="${id}">${gradeName(id)} 모집</button>`).join('')}</div><div class="recruitment-pools"><section class="illustrated-pool ${pool}"><div class="recruit-scene"><img src="assets/recruit-${pool}.webp" alt="${gradeName(pool)} 파트장 모집실"><h3>${gradeName(pool)} 파트장 모집</h3></div><div class="pool-controls"><div class="pool-ticket-count"><img src="assets/ticket-${pool}.webp" alt="모집권"><strong>${number(tickets)}장 보유</strong>${rare?`<span>희귀 확정 ${g.recruitPity}/30</span>`:''}</div><div class="btnrow"><button data-draw="${pool}" data-count="1" class="btn btn-gold" ${tickets<1||recruiting?'disabled':''}>1회 모집</button><button data-draw="${pool}" data-count="10" class="btn ${tickets>=10&&!recruiting?'btn-gold recruitment-ready':'btn-outline'}" ${tickets<10||recruiting?'disabled':''}>10회 모집</button></div><details class="pool-rates" data-pool-rates="${pool}" ${shopDisclosure[pool]?'open':''}><summary>모집 확률·보상 안내</summary>${rare?'<p>희귀 완성본 2% · 일반 완성본 1% · 희귀 조각 2개 20% · 일반 조각 2개 40% · 희귀 교본 40 XP 37%</p>':'<p>일반 완성본 1% · 일반 조각 1개 30% · 일반 교본 15 XP 69%</p>'}<p>같은 등급 내 파트장 등장 확률은 같습니다. 중복 완성본은 전용 조각 10개로 전환됩니다. 교본은 창고에 보관됩니다.</p>${rare?'<p>30회 이내 희귀 완성본 확정 · 희귀 완성본 획득 시 확정 횟수 초기화</p>':''}</details></div></section></div>${g.lastRecruitment?'<button class="btn btn-outline btn-wide" data-recruit-recent>최근 모집 결과 다시 보기</button>':''}<h3 class="ticket-shop-heading">모집권 구매</h3>`;}
function rewardCard(p,index=0){const def=state.progression.heroes.find(h=>h.id===p.hero),kind=p.kind||(p.shards?'shards':p.whole?'hero':'xp');let art,title,detail;
 if(kind==='shards'){art=puzzleMarkup(p.hero);title=p.duplicate?'중복 완성본 → 조각 10개':'파트장 조각';detail=(def?.name||'파트장')+' +'+p.shards+'조각';}
 else if(kind==='hero'){art=`<img class="recruit-reward-portrait" src="assets/hero-${p.hero}.webp" alt="${h(def?.name)}">`;title='새 파트장 합류!';detail=def?.name||'';}
 else {const grade=p.bookRarity||p.rarity||'normal';art=`<img class="recruit-reward-item" src="assets/book-${grade}.webp" alt="경험치 교본">`;title=gradeName(grade)+' 경험치 교본';detail='창고 보관 +'+p.xp+' XP';}
 return `<article class="recruit-reward ${kind}" style="--reward-delay:${index*.07}s">${art}<strong>${title}</strong><span>${h(detail)}</span></article>`;
}
async function startRecruitment(pool,count){
 if(recruiting||!state)return;recruiting=true;recruitReady=null;closeModal();const actor=state.me.id,key='ka_recruit_pending_'+actor;
 let pending;try{pending=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
 const request=pending||{pool,count,requestId:crypto.randomUUID()};sessionStorage.setItem(key,JSON.stringify(request));
 const el=$('recruitOverlay');el.className='recruit-overlay opening';el.innerHTML=`<div class="recruit-cinematic ${request.pool}"><img src="assets/recruit-${request.pool}.webp" alt="모집 연출"><div class="summon-rays"></div><div class="summon-sparkles">✦ ✧ ✦</div><div class="summon-caption"><h2>${request.pool==='rare'?'희귀':'일반'} 파트장 모집</h2><p id="summonStatus">새로운 동료를 기다리는 중…</p><button class="btn btn-gold" data-recruit-reveal disabled>모집 중…</button></div></div>`;
 const start=performance.now();
 try{const out=await api('/api/action','POST',{type:'hero/recruit',...request});sessionStorage.removeItem(key);await loadState({silent:true,resumeBattle:false});recruitReady=out;const delay=Math.max(0,1800-(performance.now()-start));setTimeout(()=>{if(recruitReady!==out)return;const b=el.querySelector('[data-recruit-reveal]');if(b){b.disabled=false;b.textContent='결과 확인';}if($('summonStatus'))$('summonStatus').textContent='모집이 완료되었습니다!';el.classList.add('ready');},delay);
 }catch(e){const uncertain=!e.status||e.status>=500;if(!uncertain)sessionStorage.removeItem(key);el.classList.add('hidden');recruiting=false;toast(e.message+(uncertain?' 중단된 모집 결과 확인을 눌러 다시 확인해 주세요.':''),true);renderShop();}
}
function showRecruitResults(pulls){if(!pulls?.length)return;recruiting=true;const el=$('recruitOverlay');el.className='recruit-overlay results';el.innerHTML=`<div class="recruit-results-panel"><h2>모집 결과</h2><div class="recruit-reward-grid ${pulls.length===1?'single':''}">${pulls.map(rewardCard).join('')}</div><button class="btn btn-gold btn-wide" data-recruit-close>확인</button></div>`;}

function pendingRecruitment(){try{return state?JSON.parse(sessionStorage.getItem('ka_recruit_pending_'+state.me.id)||'null'):null;}catch{return null;}}

function pendingShopPurchase(){try{return state?JSON.parse(sessionStorage.getItem('ka_shop_pending_'+state.me.id)||'null'):null;}catch{return null;}}
function shopArt(item){return {normalTicket:'ticket-normal',rareTicket:'ticket-rare',researchAid:'research-voucher',healAid:'medical-kit'}[item.id]||item.image||SHOP_DETAILS[item.id]?.image||'panel-shop';}
async function purchaseShopItem(itemId){
 if(!state||shopPurchasing)return;
 const key='ka_shop_pending_'+state.me.id,request=pendingShopPurchase()||{item:itemId,requestId:crypto.randomUUID()};
 const item=state.shopItems.find(i=>i.id===request.item);if(!item)return;
 sessionStorage.setItem(key,JSON.stringify(request));shopPurchasing=true;renderShop();
 try{
  const result=await api('/api/action','POST',{type:'shop/buy',...request});
  sessionStorage.removeItem(key);await loadState({silent:true,resumeBattle:false});
  closeModal();showModal(`${modalHead('구매 완료')}<div class="purchase-success" role="status"><div class="purchase-check">✓</div><img src="assets/${shopArt(item)}.webp" alt="${h(item.name)}"><h3>${h(item.name)}</h3><p>${item.permanent?'센터 설비에 적용되었습니다.':item.id==='boost'?'채굴 가속이 적용되었습니다.':'창고에 보관되었습니다.'}</p><b>💰 ${number(item.price)}</b><button class="btn btn-gold btn-wide" data-close>확인</button></div>`);
  return result;
 }catch(e){const uncertain=!e.status||e.status>=500;if(!uncertain)sessionStorage.removeItem(key);toast(e.message+(uncertain?' 중단된 구매 결과 확인을 눌러 다시 확인해 주세요.':''),true);}
 finally{shopPurchasing=false;renderShop();}
}
async function shareServer(){
 if(!state)return;const url=new URL('https://jparkapps.xyz/kurly-apocalypse/');url.searchParams.set('server',state.me.world);
 const text=`컬리 아포칼립스 · 서버 ${state.me.world}\n${url.href}`;
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);toast('서버 초대 링크를 복사했습니다.');}else throw new Error('clipboard');}
 catch{showModal(`${modalHead('서버 초대')}<p>친구에게 서버 코드와 아래 링크를 공유해 주세요.</p><strong>${h(state.me.world)}</strong><input class="invite-link" value="${h(url.href)}" readonly aria-label="서버 초대 링크"><button class="btn btn-gold btn-wide" data-copy-invite>링크 선택</button>`);}
}
const invitedServer=new URLSearchParams(location.search).get('server');
if(invitedServer&&/^[A-Za-z0-9_-]{2,20}$/.test(invitedServer))$('worldField').value=invitedServer.toUpperCase();
document.addEventListener('click',e=>{if(e.target.closest('[data-copy-invite]'))document.querySelector('.invite-link')?.select();});

function isTrainingActive(){const o=state?.me.game.onboarding;return !!o&&o.stage!=='done';}
function prepareTrainingLayout(){
 const o=state?.me.game.onboarding;if(!o)return;
 if(guideAccount!==state.me.id){guideAccount=state.me.id;guideStage='';if(o.stage!=='intro'&&o.stage!=='done')selectedTab=['summon','mine','summonSecond','merge'].includes(o.stage)?'mine':'center';}
 if(guideStage!==o.stage){if(o.stage==='summon')selectedTab='mine';if(o.stage==='upgrade')researchGroup='mine';guideStage=o.stage;}
}
function renderTraining(){
 const coach=$('trainingCoach');if(!coach)return;
 const cue=$('trainingNavCue');cue?.classList.add('hidden');coach.style.bottom='';
 document.querySelectorAll('.guide-target').forEach(el=>el.classList.remove('guide-target'));
 const o=state?.me.game.onboarding;
 document.body.classList.toggle('in-training',!!o&&o.stage!=='done'&&!showOnboard);
 if(!o||showOnboard||o.stage==='intro'){coach.classList.add('hidden');return;}
 if(o.stage==='done'){
  coach.classList.add('hidden');
  if(!o.acknowledged&&!$('modalContent').querySelector('[data-training-finish]'))showModal(`<div class="training-complete"><img src="assets/worker-cute.webp" alt="복슬이"><h2>운영 실습 완료!</h2><p>박스를 채굴하고, 일용직을 합성했어요.<br>이제 모은 박스로 사원과 센터를 키워 보세요!</p><div class="training-done-list"><span>✓ 채굴 · 합성 완료</span><span>✓ 사원 1명 생산 시작</span><span>✓ ${h(UPGRADES.find(u=>u.key===o.upgradeKey)?.name||'업그레이드')} 연구 시작</span></div><button class="btn btn-gold btn-wide" data-training-finish>센터 운영 시작</button></div>`);
  return;
 }
 const stages=['summon','mine','summonSecond','merge','recruit','upgrade'],n=stages.indexOf(o.stage)+1;
 const center=['recruit','upgrade'].includes(o.stage),page=center?'center':'mine';
 let title,body,selectors=[],extra='';
 if(selectedTab!==page){title=center?'채굴한 박스로 센터를 키워요':'택배 채굴로 이동해요';body=center?'화살표로 표시한 내 센터 버튼을 눌러 주세요.':'화살표로 표시한 택배 채굴 버튼을 눌러 주세요.';selectors=[`[data-tab="${page}"]`];}
 else if(o.stage==='summon'){title='첫 일용직을 불러요';body='일용직 소환 버튼을 누르세요. 첫 일용직은 무료예요.';selectors=['[data-summon]'];}
 else if(o.stage==='mine'){title=o.assigned?'첫 박스를 채굴하고 있어요':'빛나는 박스에 배치해요';body=o.assigned?'채굴이 끝나면 박스가 들어와요. 잠시 기다려 주세요.':'박스를 누르거나 일용직을 박스로 끌어 놓으세요.';selectors=['[data-tile="37"]'];if(!o.assigned)selectors.push(`[data-worker="${o.workerIds[0]}"]`);}
 else if(o.stage==='summonSecond'){title='박스 '+number(o.minedBoxes)+'개를 얻었어요!';body='일용직을 한 명 더 소환해 보세요. 이번에는 박스 80개를 사용해요.';selectors=['[data-summon]'];}
 else if(o.stage==='merge'){title='같은 레벨끼리 합성해요';body='두 일용직을 겹쳐 놓거나 아래 합성 버튼을 누르세요.';selectors=o.workerIds.map(id=>`[data-worker="${id}"]`);extra=`<button class="btn btn-gold" data-training-merge ${guidePending?'disabled':''}>일용직 합성</button>`;}
 else if(o.stage==='recruit'){title='사원 1명을 생산해요';body='박스 45개를 사용해 사원 1명 생산을 시작하세요. 합류까지 1분 걸려요.';selectors=['[data-recruit="1"]'];}
 else if(o.stage==='upgrade'){title='센터 성장을 시작해요';body='보유 박스로 가능한 빛나는 연구를 하나 시작하세요. 모은 박스는 성장에 쓰여요.';selectors=['#tabCenter [data-upgrade]:not(:disabled)'];}
 coach.className='training-coach '+(page==='mine'?'over-mine':'over-center');coach.innerHTML=`<img src="assets/worker-cute.webp" alt="복슬이의 안내"><div><span class="training-step">센터장 실습 ${n} / 6</span><h3>${title}</h3><p>${body}</p>${extra}</div>`;
 const targets=selectors.flatMap(sel=>[...document.querySelectorAll(sel)]);targets.forEach(el=>el.classList.add('guide-target'));
 const navTarget=targets.find(el=>el.matches('.navbar .navitem'));
 if(navTarget&&cue){
  coach.classList.add('to-navigation');
  requestAnimationFrame(()=>{
   if(!navTarget.isConnected||!navTarget.classList.contains('guide-target'))return;
   const r=navTarget.getBoundingClientRect(),center=r.left+r.width/2,left=Math.max(8,Math.min(innerWidth-76,center-34));
   cue.style.left=left+'px';cue.style.top=(r.top-38)+'px';cue.style.setProperty('--arrow-left',(center-left)+'px');cue.classList.remove('hidden');
   coach.style.bottom=(innerHeight-r.top+54)+'px';
  });
 }

 const key=state.me.id+':'+o.stage+':'+o.assigned+':'+selectedTab+':'+researchGroup;
 if(key!==guidePaintKey){guidePaintKey=key;const target=targets.find(el=>el.getClientRects().length);if(target&&!target.closest('.navbar')&&page==='center')requestAnimationFrame(()=>target.isConnected&&target.scrollIntoView({block:'center',behavior:'smooth'}));}
}
document.addEventListener('click',e=>{
 if(!isTrainingActive()||showOnboard||adminState)return;
 const btn=e.target.closest('button');if(!btn)return;
 const o=state.me.game.onboarding,stage=o.stage;
 const common='#profileBtn,[data-logout],[data-close]';
 const allowed={summon:'[data-tab="mine"],[data-summon]',mine:'[data-tab="mine"],[data-worker],[data-tile="37"]',summonSecond:'[data-tab="mine"],[data-summon]',merge:'[data-tab="mine"],[data-worker],[data-training-merge]',recruit:'[data-tab="center"],[data-recruit="1"]',upgrade:'[data-tab="center"],[data-research-group],[data-upgrade]'};
 if((guidePending&&!btn.matches(common))||!btn.matches(common+','+(allowed[stage]||'[data-no-training-action]'))){e.preventDefault();e.stopImmediatePropagation();if(!guidePending)toast('복슬이의 안내에 따라 빛나는 버튼을 눌러 주세요.');}
},true);

window.addEventListener('resize',()=>{if(state)renderTraining();});
window.visualViewport?.addEventListener('resize',()=>{if(state)renderTraining();});

document.addEventListener('keydown',e=>{if(e.target.id==='chatInput'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!chatComposing){e.preventDefault();e.target.form.requestSubmit();}});

function resourceify(root){if(!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('script,style,textarea,input,option,.story-dialogue')&&/📦|박스\s*\d|\d[\d,]*\s*박스/.test(n.textContent))nodes.push(n);}for(const node of nodes){const parts=node.textContent.split(/(📦|박스\s*[0-9][0-9,]*|[0-9][0-9,]*\s*박스)/g),frag=document.createDocumentFragment();for(const part of parts){if(/^(📦|박스\s*[0-9][0-9,]*|[0-9][0-9,]*\s*박스)$/.test(part)){const img=new Image();img.className='parcel-inline';img.alt='택배 상자';img.src='assets/parcel.webp';frag.append(img);const amount=part.match(/[0-9][0-9,]*/)?.[0];if(amount)frag.append(document.createTextNode(' '+amount));}else frag.append(document.createTextNode(part));}node.replaceWith(frag);}}
for(const name of ['renderCenter','renderMine','renderWar','renderShop','renderServer']){const fn={renderCenter,renderMine,renderWar,renderShop,renderServer}[name];const wrapped=(...args)=>{const value=fn(...args);resourceify($(name==='renderCenter'?'tabCenter':name==='renderMine'?'tabMine':name==='renderWar'?'tabWar':name==='renderShop'?'tabShop':'tabServer'));return value;};if(name==='renderCenter')renderCenter=wrapped;else if(name==='renderMine')renderMine=wrapped;else if(name==='renderWar')renderWar=wrapped;else if(name==='renderShop')renderShop=wrapped;else renderServer=wrapped;}
const originalShowModal=showModal;showModal=(content)=>{originalShowModal(content);resourceify($('modalContent'));};
let lastMinerPaint=0;function animateMiners(now){requestAnimationFrame(animateMiners);if(document.hidden||selectedTab!=='mine'||!state||now-lastMinerPaint<1000/30)return;lastMinerPaint=now;const g=state.me.game;for(const canvas of document.querySelectorAll('[data-miner-motion]')){const w=g.workers.find(v=>v.id===canvas.dataset.minerMotion);if(!w)continue;const forklift=g.forklift?.workerId===w.id&&(g.forklift.permanent||g.forklift.until>serverNow()),dragging=!!canvas.closest('.dragging,.mine-drag-ghost');paintMiner(canvas,w,{mining:!w.parked&&w.target!==null,forklift,dragging,t:now/1000});}}
loadSceneAssets().then(()=>{if($('warCanvas'))drawBattle(animation?.current);}).catch(()=>toast('장면 이미지를 불러오지 못했습니다. 새로고침해 주세요.',true));requestAnimationFrame(animateMiners);
