import {MiningInputQueue,previewMiningInput,mergeMiningDelta} from './mining-input.mjs?v=20261125-v246-smooth-input';
import {gameRequestURL,fetchGame} from './game-network.mjs?v=20261125-v246-smooth-input';
import {PATCH_ID,EVENT_ENDS_AT} from './patch-policy.mjs?v=20261125-v246-smooth-input';
import {mountPatchUpdate} from './patch-update.js?v=20261125-v246-smooth-input';
import {BOOST_PASSES,RESEARCH_PASSES,FORKLIFT_PASSES} from './pass-catalog.mjs?v=20261125-v246-smooth-input';
import {recruitQuote,recruitQuantityMarkup,summarizeRecruitPulls} from './recruit-quantity.mjs?v=20261125-v246-smooth-input';
const recruitUseCounts={normal:1,rare:1};let updateNoticeController=null;
import {expeditionHomeMarkup} from './expedition-home.js?v=20261125-v246-smooth-input';
import {mountCombatPatch} from './combat-patch.js?v=20261125-v246-smooth-input';
let patchNoticeController=null,tdWarOpen=false;
import {combatPower as tdCombatPower} from './test/combat-power.mjs?v=td-ux-20';
import {gameAPI,isTDWorld,tdTab,mergeTDState,tdAction} from './td-routing.js?v=20261125-v246-smooth-input';
import {mountTimedPasses,timedPassLauncher} from './timed-passes.js?v=20261125-v246-smooth-input';
import {mountCommunity,AUTO_MINING_NOTE} from './community.js?v=20261125-v229-review-dismiss';
import {mountBossEvent} from './boss-event.js?v=20261125-v246-smooth-input';
let bossEventController=null;
import {unlockReadyHeroes,unseenUnlockHeroes} from './hero-ready.js?v=20261124-v227-worker-floor';
import {mountDeveloperTicker} from './developer-notice.js?v=20261124-v227-worker-floor';
import {startUpdateMonitor} from './client-update.js?v=20261124-v227-worker-floor';
import {patchMiningMarkup,miningMultiplier,miningHp,miningSeconds,miningLanding,previewMiningDrop,miningTargetRate,miningRates} from './mining-ui.js?v=20261125-v246-smooth-input';
import {chatResume,visibleChatRead,chatViewport} from './chat-view.js?v=20261124-v227-worker-floor';
import {miningAttention,attackNotices,unreadAttacks,rankPlayers,battleNames,eventReadyCount,attendanceReadyCount} from './attention.js?v=20261124-v227-worker-floor';
import {loadSceneAssets,paintMiner} from './scene-assets.js?v=20261124-v227-worker-floor';
import {chatNotification} from './social.js?v=20261124-v227-worker-floor';
import {WORKER_MAX_LEVEL,SUMMON_MAX_LEVEL,researchLimitKind,researchLimitLabel,workerBaseDps,workerMiningDps,canMergeWorkers,CLASS_TRAINING,researchCenterRequired,CLASS_RESEARCH,classResearchEffect,upgradeCost,researchMax,miningResearchEffect,combatResearchEffect,marchPower} from './balance.js?v=20261125-v246-smooth-input';
import {FORMATIONS,TROOP_ROLES,buildFormation,formationFactors,HERO_RANGE} from './formation.js?v=20261124-v227-worker-floor';
import {HEALTH_KINDS,battleHealthMarkup,buildBattleEvents,paintBattle} from './battle-scene.js?v=20261124-v227-worker-floor';
const RELEASE='20261125-v246-smooth-input';
for(const link of document.querySelectorAll('link[rel="stylesheet"]')){const url=new URL(link.getAttribute('href'),document.baseURI);if(url.origin===location.origin&&url.searchParams.get('v')!==RELEASE){url.searchParams.set('v',RELEASE);link.href=url.href;}}
startUpdateMonitor(RELEASE);
const API_BASE=/^(www\.)?jparkapps\.xyz$|^parkjae000\.github\.io$/.test(location.hostname)?'https://pgupfypoxhjawtonnzzk.supabase.co/functions/v1/kurly-apocalypse':location.hostname.endsWith('.supabase.co')?location.origin+'/functions/v1/kurly-apocalypse':'';
const TOKEN_KEY='ka_game_session_v1',ADMIN_KEY='ka_admin_session_v1';
let sessionWorld=localStorage.getItem('ka_game_world_v1')||'';let requestedWorld=String(new URL(location.href).searchParams.get('server')||'').toUpperCase();
const SUPPORT_ACCOUNT='3333170215737';
let warHero='',warFormation='balanced',marchContext='war',warehousePage='items',recruiting=false,recruitReady=null,combatGroup='ranged',raidRulesOpen=false,researchGroup='center',shopGroup='equipment',eventsPage='attendance',adminState=null,popupPending=false;
const $=id=>document.getElementById(id);
const number=v=>new Intl.NumberFormat('ko-KR').format(Math.round(Number(v)||0));
const h=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const timeLeft=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return s>=3600?`${Math.floor(s/3600)}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`:`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const ago=ms=>{const t=new Date(ms);return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`};
let introTimers=[],warPlaybackSpeed=1,miningDragging=null,miningSettling=null,miningForecast=null,spawnedWorkerId=null,warPanelOpen=false,warScrollLeft=0;
let state=null,selectedTab='center',selectedWorker='w1',authMode='register',rankMode='total',warMode='raid',conquestFilter='all',warTarget='',warCount=12,showOnboard=false,onboardStep=0,animation=null,animating=false, lastSnapshot=0,serverOffset=0,toastTimer=null,lastPageRendered='';
let introAdvanceBusy=false,guidePending=false,guideAccount='',guideStage='',guidePaintKey='';
let stateLoadSequence=0,miningActionsPending=0;let tdController=null,tdMounting=null,tdShownTab='',tdDestination=null;

let recruitPool='normal',serverPage='chat',pendingRaidRequest=null;
let shopPurchasing=false;const shopDisclosure={normal:false,rare:false};
let socialHeartbeatAt=0,lastSocialAt=0,socialBusy=false,chatExpanded=false,chatForceBottom=false;
let chatResumePending=true,chatPaintKey='',chatOwner='',chatDraft='',chatBaselineHeight=innerHeight,chatScrollFrame=0;
function syncEventBadge(){if(!state)return;const count=eventReadyCount(state.progression,serverNow());document.querySelectorAll('[data-events]').forEach(button=>{let badge=button.querySelector('[data-event-badge]');if(!badge){badge=document.createElement('b');badge.className='attention-badge';badge.dataset.eventBadge='';button.append(badge);}badge.hidden=!count;badge.textContent=count?'!':'';button.setAttribute('aria-label',count?'이벤트 · 수령 가능한 보상 있음':'이벤트');});}
function myShieldUntil(){if(!state)return 0;const g=state.me.game;return Math.max(Number(state.me.shieldUntil)||0,Number(g.shieldUntil)||0,g.newbieShieldBroken?0:(Number(state.me.createdAt)||0)+12*3600000);}
function centerProtectionMarkup(){const until=myShieldUntil();return until>serverNow()?`<div class="center-protection"><span>🛡️ 내 센터 보호 중</span><b data-live-end="${until}">${timeLeft(until-serverNow())}</b></div>`:'';}
function shieldStorageMarkup(){const g=state.me.game,items=state.shopItems.filter(i=>i.hours&&i.id.startsWith('shield')),busy=!!g.incomingRaid||!!g.pendingBattle;return `<section class="shield-storage"><h3>센터 보호 쉴드</h3>${centerProtectionMarkup()}<div class="shield-inventory">${items.map(i=>`<div class="inventory-card">${shopVisual(i)}<h4>${h(i.name)}</h4><b>${number(g.inventory[i.id])}장</b><button class="btn btn-gold" data-use-shield="${i.id}" ${busy||!g.inventory[i.id]?'disabled':''}>${busy?'교전·출정 후 사용':'사용 · '+i.hours+'시간 보호'}</button></div>`).join('')}</div><p class="supply-notice">사용한 순간부터 센터 약탈을 막습니다. 남은 보호 시간에 추가되며 정복지는 보호하지 않습니다. 다른 센터 약탈에 출정하면 남은 센터 보호가 해제됩니다.</p></section>`;}
function requestBattleStart(){const request={amount:warCount,target:warTarget,mode:warMode,hero:warHero,formation:warFormation};if(warMode==='raid'&&!warTarget.startsWith('npc-')&&myShieldUntil()>serverNow()){showShieldBreakWarning(request);return;}closeModal();doAction('battle/start',request);}
function showShieldBreakWarning(request){pendingRaidRequest={...request};const until=myShieldUntil(),target=state.ranks.find(v=>v.id===request.target)?.nickname||'상대 센터';showModal(`${modalHead('센터 보호 쉴드 해제 경고')}<div class="shield-warning"><span aria-hidden="true">🛡️</span><h3>약탈을 시작하면 내 보호가 해제돼요</h3><p><strong>${h(target)}</strong>에 출정하면 내 센터의 남은 보호 쉴드가 즉시 사라집니다.<br>상대도 내 센터를 약탈할 수 있게 됩니다.</p>${until>serverNow()?`<p>현재 남은 보호 <b data-live-end="${until}">${timeLeft(until-serverNow())}</b></p>`:''}<p>취소하거나 출정에 실패하면 보호는 유지됩니다.</p><div class="btnrow"><button class="btn btn-outline" data-raid-cancel>취소 · 보호 유지</button><button class="btn btn-gold" data-raid-confirm>보호 해제 후 약탈</button></div></div>`);}
function warReadKey(){return 'ka_war_read_v1:'+state.me.world+':'+state.me.id;}
function readWarKeys(){try{return JSON.parse(localStorage.getItem(warReadKey())||'[]');}catch{return [];}}
function currentAttackNotices(){return attackNotices(state.me.game,state.incomingAttacks||[]);}
function markAttackRead(mode){const keys=new Set(readWarKeys());for(const n of currentAttackNotices().filter(n=>n.mode===mode))keys.add(n.key);localStorage.setItem(warReadKey(),JSON.stringify([...keys].slice(-400)));syncAttention();}
function badgeMarkup(count,attribute='data-war-badge'){return `<b class="attention-badge" ${attribute} ${count?'':'hidden'}>${count>99?'99+':count||''}</b>`;}
function syncAttention(){if(!state)return;syncEventBadge();const mine=miningAttention(state.me.game),war=unreadAttacks(currentAttackNotices(),readWarKeys());
 document.querySelectorAll('[data-mine-badge]').forEach(b=>{b.hidden=!mine.count;b.textContent='!';b.title=mine.reason;});
 document.querySelectorAll('[data-war-badge]').forEach(b=>{b.hidden=!war.total;b.textContent=war.total>99?'99+':war.total;});
 for(const mode of ['raid','conquest'])document.querySelectorAll(`[data-attack-badge="${mode}"]`).forEach(b=>{b.hidden=!war[mode];b.textContent=war[mode]>99?'99+':war[mode];});
 const nav=document.querySelector('[data-tab="mine"]');if(nav)nav.setAttribute('aria-label',mine.count?'택배 채굴 · '+mine.reason:'택배 채굴');
 const wn=document.querySelector('[data-tab="war"]');if(wn)wn.setAttribute('aria-label',war.total?'출정 · 새 피격 알림 '+war.total+'개':'출정');
}
function defenseAlertsMarkup(mode){const all=currentAttackNotices().filter(n=>n.mode===mode).slice(0,4);return all.length?`<section class="defense-alerts"><h3>${mode==='raid'?'내 센터 피격 알림':'내 정복지 피격 알림'}</h3>${all.map(n=>`<article><strong>${h(n.title)}</strong><p>${h(n.body)}</p><small>${ago(n.at)}</small>${n.phase==='finished'?`<button class="btn btn-outline" data-replay="${h(n.battleId)}">전투 보기</button>`:''}</article>`).join('')}</section>`:'';}
function battleLabels(){return battleNames(animation?.payload,state?.battles,state?.ranks);}
function chatReadKey(){return 'ka_chat_read_v1:'+state.me.world+':'+state.me.id;}
function chatPositionKey(){return 'ka_chat_position_v1:'+state.me.world+':'+state.me.id;}
function savedChatPosition(){try{return JSON.parse(localStorage.getItem(chatPositionKey())||'null');}catch{return null;}}
function chatPosition(){const list=document.querySelector('.chat-list');if(!list?.clientHeight||$('tabServer').dataset.serverPage!=='chat')return null;const box=list.getBoundingClientRect(),row=[...list.querySelectorAll('[data-chat-id]')].find(r=>r.getBoundingClientRect().bottom>box.top+1);return row?{id:Number(row.dataset.chatId),offset:row.getBoundingClientRect().top-box.top,atBottom:list.scrollHeight-list.scrollTop-list.clientHeight<4}:null;}
function rememberChatPosition(){if(!state||selectedTab!=='server'||serverPage!=='chat'||chatOwner!==state.me.world+':'+state.me.id)return;const position=chatPosition();if(position)localStorage.setItem(chatPositionKey(),JSON.stringify(position));chatDraft=$('chatInput')?.value||'';}
function restoreChatPosition(list,plan){if(plan.kind==='bottom'){list.scrollTop=list.scrollHeight;return;}const row=list.querySelector(`[data-chat-id="${plan.id}"]`);if(!row)return;const marker=plan.kind==='unread'?list.querySelector(`[data-chat-unread="${plan.id}"]`):null,target=marker||row;list.scrollTop+=target.getBoundingClientRect().top-list.getBoundingClientRect().top-(plan.kind==='anchor'?plan.offset:12);}
function syncChatViewport(){if(!state)return;const app=$('app'),active=selectedTab==='server'&&serverPage==='chat';app.classList.toggle('server-chat-open',active);document.body.classList.toggle('chat-screen',active);if(!active){app.classList.remove('chat-keyboard');return;}const focused=document.activeElement?.id==='chatInput';if(!focused)chatBaselineHeight=Math.max(innerHeight,window.visualViewport?.height||0);const box=chatViewport(window.visualViewport,innerHeight,chatBaselineHeight,focused),position=chatPosition(),changed=app.style.getPropertyValue('--chat-vh')!==box.height+'px'||app.classList.contains('chat-keyboard')!==box.keyboard;app.classList.toggle('chat-keyboard',box.keyboard);app.style.setProperty('--chat-vh',box.height+'px');app.style.setProperty('--chat-top',box.top+'px');const nav=app.querySelector('.navbar')?.getBoundingClientRect().height;if(nav)app.style.setProperty('--nav-h',nav+'px');if(changed&&position&&!chatResumePending){const list=document.querySelector('.chat-list');restoreChatPosition(list,position.atBottom?{kind:'bottom'}:{kind:'anchor',...position});} }
window.addEventListener('resize',syncChatViewport);window.visualViewport?.addEventListener('resize',syncChatViewport);window.visualViewport?.addEventListener('scroll',syncChatViewport);
document.addEventListener('focusin',e=>{if(e.target.id==='chatInput'){syncChatViewport();requestAnimationFrame(syncChatViewport);}});
document.addEventListener('focusout',e=>{if(e.target.id==='chatInput')requestAnimationFrame(syncChatViewport);});
function paintChat(list){
 const messages=state.chat.slice(-35),owner=state.me.world+':'+state.me.id;if(chatOwner!==owner){chatOwner=owner;chatDraft='';chatPaintKey='';chatResumePending=true;if($('chatInput'))$('chatInput').value='';}
 const key=messages.map(m=>m.id).join(','),position=chatResumePending?savedChatPosition():chatPosition(),lastRead=Number(localStorage.getItem(chatReadKey()))||0;
 if(key!==chatPaintKey||!list.dataset.painted||chatResumePending){const firstUnread=lastRead>0?messages.find(m=>Number(m.id)>lastRead):null;list.innerHTML=messages.map(m=>`${firstUnread===m?'<div class="chat-unread" data-chat-unread="'+Number(m.id)+'">여기부터 새 메시지</div>':''}<article data-chat-id="${Number(m.id)}" class="chat-row ${m.player_id===state.me.id?'mine':'other'}">${m.player_id===state.me.id?'':'<img class="chat-avatar" src="assets/worker-cute.webp" alt="" width="34" height="34">'}<div class="chat-message"><strong class="chat-name">${m.player_id===state.me.id?'나':h(m.nickname)}</strong><div class="chat-bubble">${h(m.body)}</div><time class="chat-time">${ago(m.created_at)}</time></div></article>`).join('')||'<div class="chat-empty"><img src="assets/worker-cute.webp" alt=""><p>센터장님들과 첫 인사를 나눠 보세요!</p></div>';list.dataset.painted='true';chatPaintKey=key;restoreChatPosition(list,chatResume(messages,{position,lastRead,resume:chatResumePending,forceBottom:chatForceBottom}));}
 else if(chatForceBottom)restoreChatPosition(list,{kind:'bottom'});
 chatForceBottom=false;chatResumePending=false;const expand=document.querySelector('[data-chat-expand]');expand.textContent=chatExpanded?'작게 보기':'크게 보기';expand.setAttribute('aria-expanded',String(chatExpanded));syncChatBadge();rememberChatPosition();
}
function syncChatBadge(){
 if(!state)return;const key=chatReadKey();
 const latest=chatNotification(state.chat||[],state.me.id,0).latest,saved=localStorage.getItem(key);let seen=saved===null?latest:Number(saved)||0;
 const list=document.querySelector('.chat-list'),visible=selectedTab==='server'&&serverPage==='chat'&&chatOwner===state.me.world+':'+state.me.id&&list?.clientHeight&&!chatResumePending&&!document.hidden&&!showOnboard&&$('modalOverlay').classList.contains('hidden');
 if(visible){const box=list.getBoundingClientRect();seen=Math.max(seen,visibleChatRead([...list.querySelectorAll('[data-chat-id]')].map(row=>({id:row.dataset.chatId,bottom:row.getBoundingClientRect().bottom})),box));}if(saved===null||visible)localStorage.setItem(key,String(seen));
 const unread=chatNotification(state.chat||[],state.me.id,seen).unread;
 document.querySelectorAll('[data-chat-badge]').forEach(b=>{b.hidden=!unread;b.textContent=unread>30?'30+':unread;});
 const nav=document.querySelector('[data-tab="server"]');if(nav)nav.setAttribute('aria-label',unread?`서버 · 새 채팅 ${unread}개`:'서버');
 const jump=document.querySelector('[data-chat-bottom]');if(jump&&list?.clientHeight){const bottom=list.scrollHeight-list.scrollTop-list.clientHeight<4;jump.hidden=bottom;jump.textContent=unread?`새 메시지 ${unread>30?'30+':unread}개`:'최근 메시지';}
}
async function refreshSocial(){
 if(!state||socialBusy||document.hidden)return;socialBusy=true;const actor=state.me.id;
 try{const out=await api('/api/social','POST',{});if(state?.me.id!==actor)return;
  const current=chatNotification(state.chat||[],actor,0).latest,next=chatNotification(out.chat||[],actor,0).latest;if(next>=current)state.chat=out.chat;
  syncDeveloperNotice(out.developerNotice);socialHeartbeatAt=Date.now();lastSocialAt=Date.now();
  if(selectedTab==='server'&&!document.hidden&&!chatComposing)renderServer();syncChatBadge();
 }catch{}finally{socialBusy=false;}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){rememberChatPosition();chatResumePending=true;}refreshSocial();});
window.addEventListener('pagehide',rememberChatPosition);
window.addEventListener('focus',()=>refreshSocial());
setInterval(()=>{const now=Date.now();if(state&&!document.hidden&&(now-socialHeartbeatAt>20000||now-lastSocialAt>6500))refreshSocial();},5000);

let noticeSnapshot=null,noticeActor='',noticeSaving=false;
const updateNoticeTicker=mountDeveloperTicker($('developerTicker'),()=>{if(state)syncChatViewport();});
function syncDeveloperNotice(value){if(!value)return;if(noticeActor!==state?.me.id){noticeActor=state?.me.id;noticeSnapshot=null;}if(noticeSnapshot&&value.revision<noticeSnapshot.revision)value=noticeSnapshot;noticeSnapshot=value;if(state)state.developerNotice=value;updateNoticeTicker(value);const button=document.querySelector('[data-manage-notice]');if(button)button.hidden=!value.canManage;}
async function openDeveloperNotice(){
 try{const out=await api('/api/developer-notice');syncDeveloperNotice(out.developerNotice);const n=out.developerNotice;if(!n.canManage){toast('개발자 공지 관리 권한이 없습니다.',true);return;}
 showModal(`${modalHead('개발자 공지 관리')}<form id="developerNoticeForm" class="notice-editor" data-revision="${n.revision}"><span class="notice-editor-status ${n.enabled?'on':''}">${n.enabled?'전광판 표시 중':'전광판 꺼짐'}</span><p>모든 서버에 ‘개발자 공지’로 표시됩니다. 전광판을 꺼도 내용은 보관됩니다.</p><label for="developerNoticeMessage">공지 내용</label><textarea id="developerNoticeMessage" maxlength="600" placeholder="센터장님들에게 전할 내용을 입력하세요.">${h(n.message)}</textarea><div class="notice-count" id="developerNoticeCount">${[...n.message].length} / 300자</div><label class="notice-switch"><input id="developerNoticeEnabled" type="checkbox" ${n.enabled?'checked':''}>전광판 켜기</label><p class="notice-save-status" id="developerNoticeStatus" role="status"></p><button class="btn btn-gold btn-wide" type="submit">저장하기</button></form>`);
 }catch(e){toast(e.message,true);}
}
async function saveDeveloperNotice(form){
 if(noticeSaving)return;noticeSaving=true;const button=form.querySelector('[type="submit"]'),status=$('developerNoticeStatus');button.disabled=true;status.textContent='저장 중…';
 try{const out=await api('/api/developer-notice','POST',{message:$('developerNoticeMessage').value,enabled:$('developerNoticeEnabled').checked,revision:Number(form.dataset.revision)});syncDeveloperNotice(out.developerNotice);if(form.isConnected)dismissModal();toast(out.developerNotice.enabled?'개발자 공지를 표시합니다.':'전광판을 껐어요. 공지 내용은 보관됩니다.');}
 catch(e){if(status.isConnected)status.textContent=e.message;else toast(e.message,true);}finally{noticeSaving=false;if(button.isConnected)button.disabled=false;}
}
const classStatsOpen={ranged:false,spear:false,shield:false};try{const saved=JSON.parse(localStorage.getItem('ka_class_stats_open_v1')||'{}');for(const key of Object.keys(classStatsOpen))classStatsOpen[key]=saved[key]===true;}catch{}
const CLASS_VIEW={ranged:{id:'engineer',name:'원거리',weapon:'ranged',icon:'🔫',reach:'최장 사거리 · 총'},spear:{id:'assault',name:'근접',weapon:'spear',icon:'🔱',reach:'중간 사거리 · 창'},shield:{id:'support',name:'방패병',weapon:'shield',icon:'🛡',reach:'짧은 사거리 · 방패'}};
const decimal=(v,n=1)=>Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:n,minimumFractionDigits:0});
function classStatsMarkup(group='ranged'){const def=CLASS_VIEW[group]||CLASS_VIEW.ranged,c=state.unitStats.classes[def.id],crit=c.critChance??state.unitStats.critChance??0,cd=c.critDamage??state.unitStats.critDamage??1.5,leech=c.lifeSteal??state.unitStats.lifeSteal??0;return `<section class="class-stat-card"><div class="class-stat-head"><span class="formation-sprites"><i class="${def.weapon}"></i></span><div><h3>${def.icon} ${def.name} 능력치</h3><p>현재 연구를 반영한 사원 1명 기준</p></div></div><dl class="unit-stat-grid">${[['공격력',decimal(c.damage)],['체력',decimal(c.hp)],['공격 간격',decimal(c.interval,2)+'초'],['기대 초당 피해',decimal(c.damage/c.interval*(1+crit*(cd-1)))],['치명타 확률',decimal(crit*100)+'%'],['치명타 피해',decimal(cd*100)+'%'],['피해 회복',decimal(leech*100)+'%'],['받는 피해 감소',decimal((c.reduction||0)*100)+'%']].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><p class="class-stat-range">${def.reach} · 전투 중 파트장 스킬 효과는 별도 적용</p></section>`;}
function classStatsDisclosure(group){const v=CLASS_VIEW[group],open=classStatsOpen[group];return `<details class="class-stats-disclosure" data-class-stats="${group}" ${open?'open':''}><summary data-stats-label>${v.icon} ${v.name} 능력치 ${open?'접기':'펼치기'}</summary>${classStatsMarkup(group)}</details>`;}
function openUnitStats(group='ranged'){showModal(`${modalHead('병과별 능력치')}<div class="category-tabs class-research-tabs">${Object.entries(CLASS_VIEW).map(([key,v])=>`<button class="btn ${group===key?'btn-gold':'btn-outline'}" data-unit-stats="${key}">${v.icon} ${v.name}</button>`).join('')}</div>${classStatsMarkup(group)}`);}
function openPowerDetails(){if(isTDWorld(state)){const p=state.td.power||tdCombatPower(state.td);showModal(`${modalHead('전투력')}<section class="power-explanation td-power-explanation"><h3>총 전투력 <b>${number(p.total)}</b></h3><div class="td-power-sum"><span>공격력 <strong>${number(p.attack)}</strong></span><b>＋</b><span>방어력 <strong>${number(p.defense)}</strong></span></div><h3>⚔ 공격력 · 병력 ${number(p.count)}명</h3><p>대기·출정 중인 병력의 인원과 강화 능력치를 반영해요. 생산 중·부상 병력은 제외해요.</p><div class="td-power-branches">${p.branches.map(b=>`<div><img src="test/assets/${b.id==='army'?'army-hd-v2.webp':b.id==='air'?'air-0.webp':'navy-0.webp'}" alt=""><b>${b.name} Lv.${b.level}</b><small>${number(b.count)}명</small><strong>${number(b.power)}</strong></div>`).join('')}</div><h3>🛡 방어력 · 내 센터 저장 배치</h3><p>배치된 포탑·파트장의 피해, 연사, 범위 타격 인원, 사거리, 상성과 스킬을 반영해요. 미배치 시설·파트장과 방벽·센터 체력은 이 점수에 포함되지 않아요.</p><details class="td-power-defenses"><summary>배치별 방어력 · 포탑 ${p.defenses.filter(d=>d.kind==='tower').length}기 · 파트장 ${p.defenses.filter(d=>d.kind==='hero').length}명</summary><dl class="power-components">${p.defenses.map(d=>`<div><dt>${h(d.name)} Lv.${d.level}${d.star?' · ★'+d.star:''}</dt><dd>${number(d.power)}</dd></div>`).join('')||'<p>배치된 방어 시설이 없어요.</p>'}</dl></details><details><summary>계산 기준 보기</summary><p>병력 1명 = 체력 × 0.18 + 초당 공성 피해 × 8 + 이동 속도 × 0.1. 병과별 인원을 곱해 합산해요.</p><p>방어 = (기본 범위 초당 피해 + 스킬 평균 범위 초당 피해) × 8 × 사거리 계수 × 제어 계수 × 육해공 평균 상성. 범위 피해는 명중 인원 한도를 반영해요.</p><p>정복지 방어력은 해당 배치와 대기 병력의 포탑 보너스로 별도 계산해요. 전투력은 비교 점수이며 배치와 상성에 따라 전투 결과는 달라져요.</p></details><button class="btn btn-purple btn-wide" data-td-power-matrix>육·해·공 상성표 보기</button></section>`);return;}const p=state.me.power,g=state.me.game;showModal(`${modalHead('전투력 계산 안내')}<section class="power-explanation"><h3>내 센터 종합 전투력 <b>${number(p.total)}</b></h3><p>시설과 병과 연구의 전투 성장을 점수로 표시합니다. 두 항목의 성장 점수를 더합니다. 채굴과 점령은 전투력에 포함하지 않습니다.</p><dl class="power-components">${[['시설',p.defense,'센터 35% + 방벽 25% + 포탑 공격력 25% + 포탑 속도 15%'],['병과 연구',p.army,'세 병과의 공격력 30% + 체력 30% + 공격속도 20% + 수용 한도 20%']].map(([name,value,desc])=>`<div><dt>${name}<small>${desc}</small></dt><dd>${number(value)}</dd></div>`).join('')}</dl><details><summary>성장률 계산 보기</summary><p>Lv.1 → Lv.10의 기존 성장 점수는 유지하고, Lv.11 이후에도 연구 단계에 따라 점수가 더해집니다. 병과는 보존된 이전 강화 효과와 세 병과의 평균 성장 단계를 반영합니다.</p></details><h3>출정 병력 전투력은 별도로 계산해요</h3><p>실제로 투입하는 사원의 능력치와 파트장 능력치를 더합니다. 주둔 사원은 다른 출정 인원에 포함되지 않습니다.</p><details><summary>출정 전투력 계산 보기</summary><p>사원 1명 점수 = (효과 체력 × 0.18 + 기대 초당 피해 × 8) × (1 + 피해 회복률 × 0.5)</p><p>효과 체력 = 체력 ÷ (1 − 피해 감소율)<br>기대 초당 피해 = 공격력 ÷ 공격 간격 × [1 + 치명타 확률 × (치명타 피해 배율 − 1)]</p><p>병과별 인원만큼 곱해 더하고, 파트장의 체력 × 0.18 + 초당 피해 × 8을 더한 뒤 반올림합니다. 치명타·회복·피해 감소 연구는 이 점수에 반영됩니다.</p></details><p>사거리·전열·파트장 스킬에 따라 전투 결과는 달라질 수 있습니다.</p><button class="btn btn-outline btn-wide" data-unit-stats="ranged">병과별 현재 능력치 보기</button></section>`);}
function battleReportMarkup(b){const mode=b.mode==='conquest'?'정복전':b.mode==='npc'?'거점전':'약탈전',success=b.success??(b.result==='win'&&!b.retreated),a=b.remaining?.attacker||{},d=b.remaining?.defender||{},left=x=>x.percent!==null&&x.percent!==undefined?x.percent+'%':x.initial===0?'병력 없음':'기록 없음',counts=x=>x.initial===null||x.initial===undefined?'투입 인원 미기록':x.remaining===null||x.remaining===undefined?`투입 ${number(x.initial)}명 · 잔존 미기록`:`${number(x.remaining)} / ${number(x.initial)}명`,power=v=>v===null||v===undefined?'기록 없음':number(v);return `<article class="battle-report ${success?'attack-success':'attack-failure'}"><header><span class="battle-mode">${mode}</span><strong class="report-result">공격 ${success?'성공':'실패'}${b.retreated?' · 후퇴':b.result==='draw'?' · 무승부':''}</strong><small>${ago(b.at)}</small></header><h3>${h(b.attackerName||'이름 미기록')} <span>→</span> ${h(b.defenderName||b.defender_name||'이름 미기록')}</h3>${b.areaName?`<p class="report-area">${h(b.areaName)}</p>`:''}<div class="report-matchup"><div><small>공격 투입 전투력</small><b>${power(b.attackerPower)}</b></div><span>VS</span><div><small>방어 투입 전투력</small><b>${power(b.defenderPower)}</b></div></div><div class="report-matchup report-survivors"><div><small>공격 잔존 병력</small><strong>${left(a)}</strong><small>${counts(a)}</small></div><span>VS</span><div><small>방어 잔존 병력</small><strong>${left(d)}</strong><small>${counts(d)}</small></div></div><footer><small>${b.mode==='conquest'?'정복지 공격':`📦 ${number(b.loot)}개 획득`}${b.powerSource==='reconstructed'?' · 이전 기록: 저장 능력치로 전투력 계산':b.powerSource==='unknown'?' · 일부 능력치 미기록':''}</small><button class="btn btn-outline" data-replay="${h(b.id)}">보기</button></footer></article>`;}

const SHOP_DETAILS={auto:{icon:'⚙️',image:'worker-cute',description:'아래쪽 자원부터 이동하며 자동 채굴합니다.'},bot:{icon:'🛠',image:'panel-workshop',description:'기본 2명 + 추가 1명 · 연구 3개를 동시에 진행합니다.'},boost:{icon:'⚡',image:'ore-money',description:'10분 동안 채굴 속도 2배'},forklift:{icon:'🔒',image:'forklift-cute',description:'추후 업데이트 예정'}};
const UPGRADES=[...CLASS_TRAINING,{key:'wallReflect',name:'방벽 반사 피해',icon:'🛡',desc:'방벽이 받은 피해의 일부를 공격자에게 반사'},{key:'wallRepair',name:'방벽 자가 수리',icon:'🧱',desc:'첫 연구 시 시간당 최대 방벽 HP의 1% 수리'},{key:'troopCritChance',name:'사원 치명타 확률',icon:'🎯',desc:'단계당 치명타 확률 +2%p'},{key:'troopCritDmg',name:'사원 치명타 피해',icon:'💥',desc:'단계당 치명타 피해 +10%p'},{key:'troopLeech',name:'사원 피흡',icon:'💚',desc:'단계당 사원이 가한 피해의 1% 회복'},{key:'laborCost',name:'일용직 인건비 감소',icon:'👷',desc:'단계당 소환 비용 4% 감소'},{key:'lossDiscovery',name:'로스 발견',icon:'📦',desc:'박스·희귀 돈 획득량 단계당 +10%'},{key:'careerLevel',name:'경력 증가',icon:'🎓',desc:`기본 소환 최대 Lv.${SUMMON_MAX_LEVEL} · 합성 최대 Lv.${WORKER_MAX_LEVEL}`},{key:'mergeLuck',name:'경력 확률',icon:'✨',desc:'합성 시 2레벨 상승 확률 단계당 +3%'},{key:'center',name:'센터 레벨',icon:'🏢',desc:'센터 체력 및 다른 연구 상한 증가'},{key:'mine',name:'채굴 효율',icon:'⛏️',desc:'단계당 일용직 채굴 속도 +20% · 이전 강화에도 적용'},{key:'troopAtk',name:'사원 공격력',icon:'⚔️',desc:'사원 공격 피해 +8%'},{key:'troopHp',name:'사원 체력',icon:'❤️',desc:'사원 최대 체력 +10%'},{key:'troopSpeed',name:'사원 공격속도',icon:'⚡',desc:'사원 공격속도 +3%'},{key:'capacity',name:'사원 수용 한도',icon:'👥',desc:'최대 사원 +8명'},{key:'wall',name:'방벽 내구도',icon:'🛡️',desc:'방벽 체력 +12%'},{key:'turretDmg',name:'포탑 공격력',icon:'🎯',desc:'포탑 공격 피해 +10%'},{key:'turretSpeed',name:'포탑 공격속도',icon:'💥',desc:'포탑 공격속도 +4%'}];
const storyCaptions=[{"speaker": "복슬이", "head": "“센터가 또 커졌네. 우리가 밤낮없이 옮긴 박스 덕분이지!”", "reply": "동료 사원", "body": "“새 창고에 새 설비까지… 그럼 이번엔 월급도 오르겠지?”"}, {"speaker": "동료 사원", "head": "“또 그대로야. 늘어난 이익은 윗사람들이 전부 챙겼대.”", "reply": "복슬이", "body": "“센터는 이렇게 커졌는데, 우리 월급만 그대로라고? 더는 못 참아!”"}, {"speaker": "복슬이", "head": "“이 센터, 우리가 접수한다! 오늘부터 반란이야!”", "reply": "사원들", "body": "“좋아! 남 좋은 일만 시키던 센터는 이제 끝이야!”"}, {"speaker": "사원들", "head": "“센터 점령 완료! 복슬이, 이제 네가 센터장이야!”", "reply": "복슬이 센터장", "body": "“좋아! 일용직은 박스를 캐고, 사원들은 전투를 준비해!”"}, {"speaker": "복슬이 센터장", "head": "“저쪽 창고에도 우리가 벌어 준 박스가 산더미네?”", "reply": "사원들", "body": "“다른 센터까지 전부 약탈하자! 진격하라!”"}];
async function api(endpoint,method='GET',body){const base=gameAPI(API_BASE,endpoint,{body,sessionWorld,requestedWorld}),url=gameRequestURL(base,endpoint);const r=await fetchGame(url,{method,credentials:base?'omit':'same-origin',headers:{...(body?{'Content-Type':'application/json'}:{}),...(localStorage.getItem(endpoint.startsWith('/api/admin/')?ADMIN_KEY:TOKEN_KEY)?{Authorization:'Bearer '+localStorage.getItem(endpoint.startsWith('/api/admin/')?ADMIN_KEY:TOKEN_KEY)}:{})},body:body?JSON.stringify(body):undefined});const v=await r.json().catch(()=>({error:'서버 응답을 읽지 못했어요.'}));if(!r.ok){const error=new Error(v.error||'요청에 실패했어요.');error.status=r.status;error.code=v.code;throw error;}if(v.adminToken)localStorage.setItem(ADMIN_KEY,v.adminToken);if(v.token){localStorage.setItem(TOKEN_KEY,v.token);if(body?.world){sessionWorld=String(body.world).toUpperCase();requestedWorld='';localStorage.setItem('ka_game_world_v1',sessionWorld);}}if(endpoint==='/api/logout'){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem('ka_game_world_v1');sessionWorld='';tdController?.destroy();tdController=null;tdMounting=null;tdShownTab='';}return v;}
function applyTDToShell(td){if(!mergeTDState(state,td))return;$('boxCount').textContent=number(state.me.game.boxes);$('cashCount').textContent=number(state.me.game.cash);$('powerCount').textContent=number((td.power||tdCombatPower(td)).total);}
async function ensureTDController(host){
 if(tdController&&tdController.session.latest.me.id!==state?.me.id){tdController.destroy();tdController=null;tdMounting=null;tdShownTab='';}
 if(tdController)return tdController;if(tdMounting)return tdMounting;const actor=state.me.id;host.innerHTML='<div class="td-mount-loading"><span>병력과 전장을 불러오고 있어요…</span></div>';
 tdMounting=(async()=>{try{const {mountIntegratedTD}=await import('./test/integrated.mjs?v=td-ux-21');if(state?.me.id!==actor)return null;host.innerHTML='';const controller=await mountIntegratedTD({host,td:state.td,token:localStorage.getItem(TOKEN_KEY),api,onState:applyTDToShell,onNavigate:navigateTD});if(state?.me.id!==actor){controller.destroy();return null;}tdController=controller;return controller;}catch(error){host.innerHTML='<div class="td-mount-loading">'+h(error.message)+'</div>';toast(error.message,true);throw error;}finally{tdMounting=null;}})();return tdMounting;
}
async function renderTDTab(){if(selectedTab==='war'&&!tdWarOpen&&!state?.td?.campaign.pending&&!tdDestination){render();return;}const tab=selectedTab,host=$('tab'+tab[0].toUpperCase()+tab.slice(1));host.classList.add('td-mount');host.querySelector('.td-illustrated-home')?.remove();const controller=await ensureTDController(host);if(!controller)return;if(!isTDWorld(state)||!tdTab(selectedTab)){controller.hide();return;}const currentHost=$('tab'+selectedTab[0].toUpperCase()+selectedTab.slice(1));controller.update(state.td);if(tdShownTab!==selectedTab){tdShownTab=selectedTab;controller.show(currentHost,selectedTab==='center'?'production':selectedTab==='shop'?'shop':controller.session.campaign.pending?'battle':'expedition');}if(tdDestination){const d=tdDestination;tdDestination=null;if(d.editor)controller.edit(d.scope||'home');else{controller.open(d.page,d.category);if(d.item){controller.ui.selected=d.item;controller.ui.detail=true;controller.ui.render(false);}}}}
function navigateTD(target,options={}){closeModal();if(target==='war-home'){tdDestination=null;tdWarOpen=false;tdController?.hide();tdShownTab='';render();return;}if(target==='recruit'){recruitPool=options.pool==='rare'?'rare':'normal';openRecruitment();return;}if(target==='explore'){openExplore();return;}if(target==='mine'||target==='center'||target==='shop'){setTab(target);return;}if(target==='defense'){tdDestination={editor:true,scope:options.scope||'home'};setTab('war');renderTDTab();}}
function openTDPanel(page,category='tower',item=null){closeModal();tdDestination={page,category,item};setTab('war');renderTDTab();}
async function openTDMiningResearch(){showModal(modalHead('채굴 연구')+'<div class="td-modal-host" style="height:min(72dvh,720px);min-height:420px"></div>');const host=$('modalContent').querySelector('.td-modal-host'),controller=await ensureTDController(host);if(!host.isConnected||!controller)return;tdShownTab='mine-modal';controller.show(host,'management','mine');}

function toast(message,error=false){const el=$('toast');el.textContent=message;el.classList.toggle('error',error);el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800);}
const miningInput=new MiningInputQueue({read:()=>state?{game:state.me.game,at:state.serverTime,actor:state.me.id}:null,clock:serverNow,send:async item=>{if(item.actor!==state?.me.id||item.zone!==state.me.game.mine.zone)throw Error('채굴 구역이 바뀌었어요.');return doAction(item.type,item.params,{queued:true,throwErrors:true,requestId:item.requestId});},publish:forecast=>{miningForecast=forecast;if(state&&selectedTab==='mine'&&!miningDragging)renderMine();},failed:async error=>{toast(error.message||'조작을 저장하지 못했어요. 다시 시도해 주세요.',true);await loadState({silent:true,resumeBattle:false});}});
let summonPending=false;
async function loadState({silent=false,resumeBattle=true}={}){const loadId=++stateLoadSequence;try{const v=await api('/api/state');if(loadId!==stateLoadSequence)return null;if(v.me?.world){sessionWorld=v.me.world;localStorage.setItem('ka_game_world_v1',sessionWorld);}if(v.me?.world==='TEST'&&!v.td)return loadState({silent,resumeBattle});const changedActor=state?.me.id!==v.me.id||state?.me.game.mine.zone!==v.me.game.mine.zone;state=v;if(changedActor)miningInput.reset();else miningInput.refresh();lastSocialAt=Date.now();lastSnapshot=Date.now();serverOffset=v.serverTime-Date.now();$('auth').classList.add('hidden');$('app').classList.remove('hidden');if(!v.me.game.storySeen||!v.me.game.tutorialSeen){if(!showOnboard){showOnboard=true;onboardStep=v.me.game.onboarding?.page||0;showTutorial();}else if(v.me.game.onboarding?.stage==='intro'&&onboardStep!==v.me.game.onboarding.page){onboardStep=v.me.game.onboarding.page;renderTutorial();}}render();maybeEventPopup();if(!socialHeartbeatAt)refreshSocial();if(resumeBattle&&v.activeBattle&&!animation&&!showOnboard)playBattle(v.activeBattle,true);if(!$('modalOverlay').classList.contains('hidden')){if($('modalContent').querySelector('[data-mail-read]'))openMail();else if($('modalContent').querySelector('[data-explore-claim]'))openExplore();}return v;}catch(e){if(e.code==='test_world_only'){state=null;$('auth').classList.remove('hidden');$('auth').classList.add('auth-open');$('app').classList.add('hidden');$('worldField').value='TEST';$('loginTab').click();return null;}if(/로그인이 필요/.test(e.message)){$('auth').classList.remove('hidden');$('app').classList.add('hidden');}else if(!silent)toast(e.message,true);return null;}}
function serverNow(){return Date.now()+serverOffset;}
function miningView(){return miningForecast&&miningForecast.actor===state?.me.id&&miningForecast.zone===state.me.game.mine.zone?miningForecast.game:state?.me.game;}
function miningViewTime(){return miningForecast?.at??state.serverTime;}
function applyMiningUpdate(out){
 const update=out?.miningUpdate;
 if(!update||!state||update.me?.id!==state.me.id||!Number.isFinite(update.serverTime)||update.serverTime<state.serverTime)return false;
 ++stateLoadSequence;state={...state,...update};mergeMiningDelta(state,out.tdDelta);lastSnapshot=Date.now();serverOffset=update.serverTime-Date.now();
 if(miningInput.busy)miningInput.refresh();else miningForecast=null;
 if(selectedTab==='mine'&&!isTrainingActive()){for(const [id,value]of [['boxCount',state.me.game.boxes],['cashCount',state.me.game.cash],['powerCount',state.me.power.total]])$(id).textContent=number(value);if(!miningInput.busy)renderMine();syncAttention();}else render();maybeEventPopup();return true;
}
let statePolling=false;
async function pollState(){if(statePolling||miningActionsPending)return;statePolling=true;try{await loadState({silent:true});}finally{statePolling=false;}}
async function doAction(type,params={},{mineDrop=false,queued=false,throwErrors=false,requestId=null}={}){
 if(isTDWorld(state)){const mapped=tdAction(type,params);type=mapped.type;params=mapped.params;}
  const training=isTrainingActive();if(training&&guidePending)return null;if(!training&&!queued&&['mine/move','mine/dispatch','mine/gate','worker/merge'].includes(type))return settleMineDrop(type,params);if(!queued&&!training&&miningInput.busy)await miningInput.flush();if(type==='worker/summon'){if(summonPending)return null;summonPending=true;if(selectedTab==='mine')renderMine();}if(training)guidePending=true;
  const quick=['mine/move','mine/dispatch','mine/assign','mine/gate','worker/summon','worker/merge','item/boost'].includes(type),actor=state?.me.id;
  if(quick){miningActionsPending++;++stateLoadSequence;}
  try{
    const priorWorkers=new Set((state?.me.game.workers||[]).map(w=>w.id));
    const out=await api('/api/action','POST',{...params,type,...(quick?{miningSync:true}:{}),requestId:requestId||(training?`training-${state.me.id}-${state.me.game.onboarding.stage}`:crypto.randomUUID())});
    if(state?.me.id!==actor)return null;if(out.td){if(tdController?.active)tdController.update(out.td);applyTDToShell(out.td);}
    if(out.message&&!out.battle&&!quick&&!['td/upgrade','td/speed'].includes(type)&&!out.message.includes('서버에 적용'))toast(out.message);
    if(mineDrop&&miningSettling)miningSettling.ready=true;
    if(!applyMiningUpdate(out))await loadState({silent:true,resumeBattle:!out.battle});
    if(type==='worker/summon'){
      spawnedWorkerId=state?.me.game.workers.find(w=>!priorWorkers.has(w.id))?.id||null;
      const spawned=[...document.querySelectorAll('[data-worker]')].find(el=>el.dataset.worker===spawnedWorkerId);spawned?.classList.add('just-summoned');
      setTimeout(()=>{spawnedWorkerId=null;spawned?.classList.remove('just-summoned');},750);
    }
    if(type==='mine/next-zone')showZoneTransition(state.me.game.mine.zone);
    if(type==='worker/merge'){
      const node=[...document.querySelectorAll('[data-worker]')].find(el=>el.dataset.worker===params.a);node?.classList.add('just-merged');
      setTimeout(()=>node?.classList.remove('just-merged'),500);
    }
    if(out.battle)playBattle(out.battle);
    return out;
  }catch(e){if(type==='battle/start'&&e.code==='shield_confirmation'){await loadState({silent:true,resumeBattle:false});showShieldBreakWarning(params);}else if(throwErrors)throw e;else toast(e.message,true);return null;}finally{if(type==='worker/summon'){summonPending=false;const button=document.querySelector('[data-summon]');if(button){button.disabled=state.me.game.boxes<state.mineStats.summonCost;button.querySelector('[data-summon-label]')?.replaceChildren(document.createTextNode('일용직 소환'));}}if(quick)miningActionsPending--;if(training){guidePending=false;renderTraining();}}
}
function render(){if(!state)return;const tdActive=isTDWorld(state)&&tdTab(selectedTab)&&(selectedTab!=='war'||tdWarOpen||!!state.td.campaign.pending||!!tdDestination);$('app').classList.toggle('td-test-world',isTDWorld(state));$('app').classList.toggle('td-integrated',tdActive);$('boxResource').disabled=isTDWorld(state);$('cashResource').disabled=isTDWorld(state);const centerLabel=document.querySelector('[data-tab="center"] small');if(centerLabel)centerLabel.textContent=isTDWorld(state)?'병력 관리':'내 센터';if(!tdActive&&tdShownTab!=='mine-modal'){tdController?.hide();tdShownTab='';}syncDeveloperNotice(state.developerNotice);prepareTrainingLayout();const g=state.me.game;const power=state.me.power.total;$('serverLabel').textContent=`${state.me.world} · ${state.me.nickname}`;$('boxCount').textContent=number(g.boxes);$('cashCount').textContent=number(g.cash);$('powerCount').textContent=number(isTDWorld(state)?(state.td.power||tdCombatPower(state.td)).total:power);const powerBox=$('powerCount').closest('button');powerBox.querySelector('small').textContent='전투력';powerBox.setAttribute('aria-label',isTDWorld(state)?'공격력과 방어력 계산 보기':'전투력 계산 방법 보기');const unread=(g.mailbox||[]).filter(m=>!m.readAt).length;document.querySelectorAll('[data-mail-badge]').forEach(e=>{e.textContent=unread>99?'99+':unread;e.hidden=!unread;});
for(const t of ['center','mine','war','shop','event','server']){$(`tab${t[0].toUpperCase()+t.slice(1)}`).classList.toggle('hidden',t!==selectedTab)}document.querySelectorAll('.navitem').forEach(b=>b.classList.toggle('selected',b.dataset.tab===selectedTab));
$('app').classList.toggle('immersive-event',selectedTab==='event');if(selectedTab==='event')bossEventController??=mountBossEvent({api,getState:()=>state,toast});bossEventController?.setVisible(selectedTab==='event');
$('app').classList.toggle('chat-expanded',chatExpanded&&selectedTab==='server');$('app').classList.toggle('immersive-mine',selectedTab==='mine');$('app').classList.toggle('immersive-war',selectedTab==='war'&&!tdActive);
syncChatBadge();syncAttention();syncChatViewport();if(selectedTab==='server'&&chatComposing)return;
if(tdActive){renderTDTab().catch(()=>{});}else if(selectedTab==='center')renderCenter();else if(selectedTab==='mine')renderMine();else if(selectedTab==='war')renderWar();else if(selectedTab==='shop')renderShop();else if(selectedTab!=='event')renderServer();syncAttention();renderTraining();}
function developmentCoverageMarkup(kind){
 const coverage=state?.developmentCoverage?.[kind];if(!coverage)return '';
 const text=kind==='research'?`연구 비용·시간·효과 데이터: Lv.${coverage.preparedLevel}까지 준비. 경력 증가 연구는 시스템 상한 Lv.${coverage.summonMax}. 일반 연구는 준비 범위에 도달하면 추가 연구 준비 중으로 안내합니다.`:`직원 합성·채굴 수치: Lv.1~${coverage.preparedWorkerLevel} 준비 및 검증. 현재 시스템 합성 상한 Lv.${coverage.workerMax}. 기본 소환 상한 Lv.${SUMMON_MAX_LEVEL}.`;
 return `<details class="development-coverage" data-development-coverage="${kind}"><summary>개발자 · ${kind==='research'?'연구':'채굴'} 데이터 Lv.${kind==='research'?coverage.preparedLevel:coverage.preparedWorkerLevel}까지 준비</summary><p>${h(text)}</p></details>`;
}
function renderCenter(){const el=$('tabCenter'),g=state.me.game,p=state.me.power,stats=state.unitStats,bots=g.shop.bot?3:2,pending=(g.recruitQueue||[]).reduce((sum,j)=>sum+j.amount,0);
const active=UPGRADES.filter(u=>g.upgrades.some(j=>j.key===u.key));const rows=UPGRADES.filter(u=>({center:['center','capacity','wall','wallReflect','wallRepair','turretDmg','turretSpeed'],combat:CLASS_TRAINING.filter(v=>v.group===combatGroup).map(v=>v.key),mine:['mine','laborCost','lossDiscovery','careerLevel','mergeLuck']}[researchGroup]||[]).includes(u.key)).map(u=>{const lv=g.levels[u.key]||1,next=lv+1,job=g.upgrades.find(j=>j.key===u.key),mx=lv>=researchMax(u.key),locked=(CLASS_RESEARCH.includes(u.key)&&g.levels.center<researchCenterRequired(u.key))||(u.key!=='center'&&next>g.levels.center+1),c=upgradeCost(u.key,next),room=g.upgrades.length<bots;return `<div class="upgrade-item"><h4>${u.icon} ${u.name}<span class="tag">Lv.${lv}${researchLimitKind(u.key)==='system'?` / ${researchMax(u.key)}`:''}</span></h4><small>${u.desc}</small>${(miningResearchEffect(u.key,lv)||combatResearchEffect(u.key,lv)||classResearchEffect(u.key,lv))?`<div class="research-effect"><b>${(miningResearchEffect(u.key,lv)||combatResearchEffect(u.key,lv)||classResearchEffect(u.key,lv))}</b>${!mx?`<span>다음: ${(miningResearchEffect(u.key,next)||combatResearchEffect(u.key,next)||classResearchEffect(u.key,next))}</span>`:''}</div>`:''}<div class="value">${job?'진행 중':mx?researchLimitLabel(u.key):`${number(c.boxes)} 📦 · ${timeLeft(c.seconds*1000)}`}</div><button class="btn ${job?'btn-purple':'btn-outline'}" data-upgrade="${u.key}" ${mx||locked||!!job||!room||g.boxes<(c?.boxes||0)?'disabled':''}>${job?'업그레이드 중':mx?researchLimitLabel(u.key):locked?'센터 레벨 필요':'강화 시작'}</button></div>`}).join('');
const jobs=Array.from({length:bots},(_,i)=>{const j=g.upgrades[i];return `<div class="slot"><h4>🛠 스탭 ${i+1}</h4>${j?`<small>${h(UPGRADES.find(v=>v.key===j.key)?.name||j.key)} Lv.${j.target}</small><div class="progress" style="margin:9px 0"><div class="bar" data-progress-start="${j.startAt}" data-progress-end="${j.endAt}" style="width:${Math.max(0,Math.min(100,100*(serverNow()-j.startAt)/(j.endAt-j.startAt)))}%"></div></div><strong class="counter" data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</strong>`:`<span class="good">대기 중 · 연구 가능</span>`}</div>`}).join('')+(bots===2?`<div class="slot"><h4>🔒 스태프 3</h4><small>상점에서 희귀 돈 3,600으로 영구 해금</small><button class="btn btn-outline" style="margin-top:8px" data-modal="shop">상점 열기</button></div>`:'');
el.innerHTML=`<div class="center-banner-v2"><span>우리의 센터</span><strong>Lv.${g.levels.center}</strong></div>${centerProtectionMarkup()}<div class="page-title"><div><h2>내 센터 <span class="goldtext">Lv.${g.levels.center}</span></h2></div><span class="pill">전투력 ${number(p.total)}</span></div>
<div class="center-utilities"><button class="btn btn-outline" data-inventory>📦 창고</button></div><div class="dashboard-columns"><div><div class="card card-center"><div class="card-head"><h3>📦 독립 물류센터</h3><span class="tag good">운영 중</span></div><div class="warehouse-stage illustrated-center"><div class="center-hero-shade"></div><span class="center-hero-title">독립 물류센터 <b>Lv.${g.levels.center}</b></span><span class="stage-caption">방벽 Lv.${g.levels.wall} · 포탑 Lv.${g.levels.turretDmg}</span></div><div class="gridstats" style="margin-top:11px"><div class="statbox"><small>센터 최대 HP</small><strong>${number(Math.ceil(stats.center))}</strong></div><div class="statbox"><small>방벽 HP</small><strong>${number(stats.wallCurrent??stats.wall)}<span class="wall-max">/ ${number(stats.wall)}</span></strong></div><div class="statbox"><small>포탑 공격력</small><strong>${number(stats.turretDamage)}</strong></div></div></div>
<div class="card card-army"><div class="card-head"><h3>👥 사원 증원 <small class="production-rate">1명 / 1분</small></h3><span class="pill">${g.troops} / ${stats.cap}명 · 생산 ${pending}명${reservedUi(g)?` · 외부·회복 ${reservedUi(g)}명`:""}</span></div><button class="btn btn-outline btn-wide unit-stats-open" data-unit-stats="ranged">🔫 원거리 · 🔱 근접 · 🛡 방패병 능력치 보기</button><div class="recruit-queue">${(g.recruitQueue||[]).length?(g.recruitQueue||[]).map((j,i)=>`<div class="recruit-job"><span>👷 ${j.amount}명 생산 ${i?'대기':'진행 중'}</span><b data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</b><div class="recruit-progress"><i data-progress-start="${j.startAt}" data-progress-end="${j.endAt}" style="width:${Math.max(0,Math.min(100,100*(serverNow()-j.startAt)/(j.endAt-j.startAt)))}%"></i></div></div>`).join(''):''}</div><div class="btnrow"><button data-recruit="1" class="btn btn-outline" ${g.boxes<45||g.troops+(reservedUi(g))+pending>=stats.cap?'disabled':''}>+1명 · 📦45</button><button data-recruit="5" class="btn btn-outline" ${g.boxes<225||g.troops+(reservedUi(g))+pending+5>stats.cap?'disabled':''}>+5명 · 📦225</button><button data-recruit="10" class="btn btn-outline" ${g.boxes<450||g.troops+(reservedUi(g))+pending+10>stats.cap?'disabled':''}>+10명 · 📦450</button></div><button class="btn btn-gold recruit-max" data-recruit-max ${g.boxes<45||g.troops+(reservedUi(g))+pending>=stats.cap||(g.recruitQueue||[]).length>=4?'disabled':''}>최대 생산 <span>${Math.max(0,Math.min(Math.floor(g.boxes/45),stats.cap-g.troops-(reservedUi(g))-pending))}명</span></button></div></div>
<div>${woundedMarkup(g)}<div class="card card-workshop"><div class="card-head"><h3>🛠️ 진행 중인 업그레이드</h3><span class="tag">${g.upgrades.length} / ${bots}건</span></div><div class="slots">${jobs}</div></div><div class="card card-research"><div class="card-head"><h3>📈 업그레이드 · 연구</h3><small class="muted">택배 박스 사용</small></div>${developmentCoverageMarkup('research')}<div class="category-tabs">${[['center','🏢 센터'],['combat','⚔ 전투'],['mine','⛏ 채굴']].map(([id,name])=>`<button class="btn ${researchGroup===id?'btn-gold':'btn-outline'}" data-research-group="${id}">${name}</button>`).join('')}</div>${researchGroup==='combat'?`<div class="category-tabs class-research-tabs">${[['ranged','🔫 원거리'],['spear','🔱 근접'],['shield','🛡 방패병']].map(([id,name])=>`<button class="btn ${combatGroup===id?'btn-gold':'btn-outline'}" data-combat-group="${id}">${name}</button>`).join('')}</div><p class="march-caption">연구는 선택한 병과에만 적용됩니다. 이전 공통 강화 효과는 현재 능력치에 보존됩니다. 특화 연구는 센터 Lv.3부터 가능합니다.</p>`:''}${researchGroup==='combat'?classStatsDisclosure(combatGroup):''}<div class="upgrade-grid">${rows}</div></div></div></div>`;renderTraining();}
function layoutMine(){
 const map=$('tabMine')?.querySelector('.mine-map'),board=map?.querySelector('.mineboard-new');if(!board||selectedTab!=='mine'||miningDragging)return;
 if(innerWidth<900){for(const key of ['width','top','transform','--miner-cell'])board.style.removeProperty(key);return;}
 const rect=map.getBoundingClientRect(),hud=map.querySelector('.mine-hud').getBoundingClientRect(),summon=map.querySelector('.mine-bottom').getBoundingClientRect();
 // Reserve the gate above the grid, and the worker sprites below its final row.
 const top=hud.bottom-rect.top+60,bottom=innerWidth>=900?rect.height-40:summon.top-rect.top-30,available=Math.max(90,bottom-top),width=Math.max(50,Math.min(440,rect.width-28,available*5/9)),height=width*9/5;
 board.style.width=width+'px';board.style.top=(top+Math.max(0,(available-height)/2))+'px';board.style.transform='translateX(-50%)';board.style.setProperty('--miner-cell',width/5+'px');
}
window.addEventListener('resize',layoutMine);
function renderMine(){
  if(miningDragging||(miningSettling&&!miningSettling.ready))return;
  const el=$('tabMine'),g=miningView(),m=g.mine,workers=g.workers,rateTable=miningRates(g,serverNow());
  // Preserve the last visible position through refreshes, automation and drop confirmation.
  const zoneChanged=el.dataset.zone!==String(m.zone),previous=!zoneChanged?new Map([...el.querySelectorAll('[data-worker]')].map(node=>{const r=node.getBoundingClientRect();return [node.dataset.worker,{x:r.left+r.width/2,y:r.top+r.height/2}];})):new Map();
  el.dataset.zone=String(m.zone);
  const chosen=workers.find(w=>w.id===selectedWorker)||workers[0];
  if(!workers.find(w=>w.id===selectedWorker))selectedWorker=chosen?.id;
  const gate=m.gate||{hp:3000,max:3000,done:false},gateReady=m.nodes.every(n=>n.done),gateRate=rateTable.gate;
  const boost=Math.max(0,g.shop.boostUntil-serverNow());
  const tile=(n,idx)=>{
    const active=rateTable.workers[idx],done=n.done;
    const damage=rateTable.rates[idx];
    const remain=damage?timeLeft(miningSeconds(n.hp,damage,serverNow(),g.shop.boostUntil)*1000):'';
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
    class="mine-worker ${w.id===selectedWorker?'selected':''} ${w.id===spawnedWorkerId?'just-summoned':''} ${w.pendingMerge?'merge-pending':''} ${w.target!==null?'mining-now':''} ${w.level>=WORKER_MAX_LEVEL?'worker-max':w.level>=7?'worker-veteran':''}"
    style="left:${(w.x+.5)*20}%;top:${(w.y+.5)*100/9}%"
    aria-label="Lv.${w.level} 일용직, 최대 Lv.${WORKER_MAX_LEVEL}${w.level>=WORKER_MAX_LEVEL?' 도달, 추가 합성 불가':', 드래그해서 채굴하거나 같은 레벨 일용직과 합성'}">
    <span class="worker-avatar"><canvas data-miner-motion="${h(w.id)}" width="180" height="180" aria-hidden="true"></canvas></span><span class="worker-level">${w.pendingMerge?'합성 중':'Lv.'+w.level+(w.level>=WORKER_MAX_LEVEL?' MAX':'')}</span>
  </button>`;};
  const markup=`<div class="mine-map">
     <div class="mine-hud">
       <div class="mine-hud-stat"><b>👷 ${number(workers.length)}명</b><span data-mining-dps>⚒ ${number(state.mineStats.rawDps*miningMultiplier(g,serverNow()))} DPS${boost>0?' · 2배':''}</span><span>📦 ${number(g.boxes)} · 💰 ${number(g.cash)}</span><button class="mine-level-guide" data-open-merge>합성 · ${workers.some(w=>w.parked)?'대기 '+number(workers.filter(w=>w.parked).length)+'명':'최대 Lv.'+WORKER_MAX_LEVEL}</button>${developmentCoverageMarkup('mining')}</div>
       <div class="mine-hud-actions">
        <span class="mine-sector">구역 ${m.zone+1}</span><button data-open-mail class="mine-icon mail-button" title="우편함">✉<b data-mail-badge ${!(g.mailbox||[]).some(m=>!m.readAt)?'hidden':''}>${(g.mailbox||[]).filter(m=>!m.readAt).length}</b></button>
        <button data-events class="mine-icon" title="이벤트">🎁</button><button data-notices class="mine-icon" title="공지사항" aria-label="공지사항">📣</button>
        ${timedPassLauncher(g,serverNow())}
       </div>
     </div>
     <div class="mineboard-new" id="mineBoard" aria-label="드래그 기반 택배 채굴 지도">
       <button data-gate class="mine-gate ${gateReady?'unlocked':''} ${gate.done?'broken':''} ${gateRate?'gate-hit':''}" aria-label="창고 문 ${gate.done?'파괴 완료':gateReady?'공격 가능':'자원 채굴 후 해금'}" ${!gateReady||gate.done?'disabled':''}>
       <img src="assets/warehouse-gate${gate.done?'-open':''}.webp" alt="" draggable="false"><span class="gate-title">${gate.done?'돌파 완료':!gateReady?'🔒 창고 문':'창고 문'}</span>
       ${!gate.done?`<span class="gate-hp"><i data-gate-bar style="width:${100*gate.hp/gate.max}%"></i></span><b data-gate-count>${number(gate.hp)} / ${number(gate.max)}</b>${gateRate?`<small data-gate-timer>${timeLeft(miningSeconds(gate.hp,gateRate,serverNow(),g.shop.boostUntil)*1000)}</small>`:''}`:''}
       </button>${m.nodes.map(tile).join('')}
       ${Array.from({length:5},(_,x)=>`<button class="mine-tile start-lane ${x===2?'active-entry':'is-cleared'}" data-start="${x}" >${x===2?'<span>🚪</span>':''}</button>`).join('')}
       ${workers.filter(w=>!w.parked).map(workerMarker).join('')}
     </div>
     <div class="mine-bottom">
       <button class="mine-summon" data-summon ${summonPending||g.boxes<state.mineStats.summonCost?'disabled':''}>
        <span>✦ +</span> Lv.${state.mineStats.summonLevel||1} <b data-summon-label>${summonPending?'소환 중…':'일용직 소환'}</b> <small>${state.mineStats.summonCost===0?'첫 일용직 무료':'📦 '+number(state.mineStats.summonCost)}</small>
       </button>
       
       ${boost>0?`<span class="mine-boost">⚡ ${timeLeft(boost)}</span>`:''}
     </div>
     ${gate.done?'<div class="zone-clear"><span>구역 돌파!</span><button class="btn btn-gold" data-next-zone>다음 구역으로 이동 ↑</button></div>':''}
   </div>`;
  patchMiningMarkup(el,markup,{reset:zoneChanged});layoutMine();const disclosure=el.querySelector('[data-development-coverage]');if(disclosure)disclosure.ontoggle=layoutMine;
  const board=$('mineBoard'),bounds=board.getBoundingClientRect(),sx=bounds.width/board.offsetWidth||1,sy=bounds.height/board.offsetHeight||1;
  const movements=[];if(!matchMedia('(prefers-reduced-motion: reduce)').matches)for(const node of el.querySelectorAll('[data-worker]')){
    const before=previous.get(node.dataset.worker);if(!before)continue;
    const r=node.getBoundingClientRect(),dx=(before.x-r.left-r.width/2)/sx,dy=(before.y-r.top-r.height/2)/sy;
    if(Math.hypot(dx,dy)<1)continue;
    movements.push({node,dx,dy});
  }
  for(const {node,dx,dy}of movements)node.animate([{transform:`translate(-50%,-50%) translate3d(${dx}px,${dy}px,0)`},{transform:'translate(-50%,-50%) translate3d(0,0,0)'}],{duration:200,easing:'cubic-bezier(.2,.8,.2,1)'});
  if(miningSettling)miningSettling.painted=true;
  renderTraining();
}
function warTargets(){
 if(warMode==='conquest')return (state.territories||[]).map(v=>({...v,disabled:v.mine||v.busy||v.shieldUntil>serverNow(),status:v.mine?'내 정복지':v.busy?'교전 중':v.shieldUntil>serverNow()?'정복 보호 중':v.ownerId?'점령 중':'중립지대'}));
 return state.ranks.filter(r=>r.id!==state.me.id).map(v=>({id:v.id,name:v.nickname,power:v.power,armyPower:v.armyPower,troops:v.troops,lootAvailable:v.lootAvailable||0,shieldUntil:v.shieldUntil,disabled:v.shielded,status:v.shielded?'보호 중':'유저 센터'}));
}
const EXPEDITION_INFO={
 raid:{summary:'다른 센터를 공격해 박스를 가져와요.',details:'다른 유저의 센터를 공격해 박스를 약탈합니다. 상대가 보유한 박스의 최대 20%를 가져올 수 있습니다.'},
 conquest:{summary:'거점을 점령해 시간당 보상을 받아요.',details:'거점을 보유하면 박스·희귀 돈·파트장 조각·교본을 시간당 받습니다. 생존 사원은 주둔하며, 보상은 오프라인에도 누적됩니다.'},
 explore:{summary:'사원을 보내 시간 경과 후 보상을 받아요.',details:'파트장과 사원을 보내 박스·경험치·모집권 등을 얻습니다. 정해진 시간이 지난 뒤 보상을 받으면 사원 전원이 귀환합니다.'}
};
function expeditionIntro(mode){return `<p class="expedition-intro">${EXPEDITION_INFO[mode].details}</p>`;}
function renderWar(){
 if(isTDWorld(state)){const el=$('tabWar');el.classList.remove('td-mount');el.innerHTML=expeditionHomeMarkup(state);return;}
 const el=$('tabWar'),g=state.me.game;
 if(!animation){
  el.innerHTML=`<div class="expedition-hub prep-hub"><div class="expedition-heading"><div class="hub-tools"><button data-open-mail class="btn btn-outline" aria-label="우편함">✉</button><button data-events class="btn btn-outline" aria-label="이벤트">🎁</button><button data-notices class="btn btn-outline" aria-label="공지사항">📣</button></div><button data-open-war-log class="btn btn-outline expedition-log" aria-label="전투기록">📜 전투기록</button></div><div class="raid-rules"><button class="btn btn-outline" data-raid-rules aria-expanded="${raidRulesOpen}" aria-controls="raidRules">🛡 약탈·보호 규칙 ${raidRulesOpen?'접기':'보기'}</button><div id="raidRules" ${raidRulesOpen?'':'hidden'}><p><b>센터 완전 함락: 6시간 보호</b><br>센터 HP가 0이 되면 자동 적용됩니다.</p><p><b>방어 성공: 새 보호 없음</b><br>공격을 막거나 상대가 후퇴하면 새 보호는 생기지 않습니다.</p><p><b>박스 손실은 최대 20%</b><br>센터가 받은 피해 비율에 따라 정산합니다. 희귀 돈·교본·보유 상품은 빼앗기지 않습니다.</p><p>남은 보호가 더 길면 유지됩니다. 보호는 내 센터에만 적용되며 정복지는 별도입니다. 보호 중 다른 센터 약탈에 출정하면 경고 후 내 보호가 해제됩니다.</p><p>약탈 출정은 하루 5회, 같은 센터는 하루 2회까지 가능합니다. 신규 센터는 12시간 보호됩니다.</p><p>정복 후 별도의 전투 보호는 생기지 않으며, 다른 센터가 즉시 도전할 수 있습니다. 정복 후 생존 사원은 주둔 병력이 되어 다른 출정에 사용할 수 없습니다. 주둔 파트장은 약탈·탐사에 계속 사용할 수 있습니다.</p><p>병력은 방패병 → 근접 → 원거리 순서로 피해를 받으며 파트장은 뒤에서 싸웁니다. 원거리 파트장은 총 사거리, 근접 파트장은 창 사거리에서 공격합니다.</p></div></div><div class="prep-space"></div><button data-heroes class="hero-hub-button"><img src="assets/hero-${g.defenseHero||'frozen'}.webp" alt=""><span>파트장<strong>목록 · 강화 · 편성</strong></span><b>❯</b></button><div class="hub-army">대기 사원 ${number(g.troops)}명 · 정복지 주둔 ${number(stationedUi(g))}명 · 전투력 ${number(state.me.power.total)}</div><div class="expedition-modes"><button data-expedition="raid" class="expedition-mode raid"><img src="assets/mode-raid.webp" alt=""><strong>약탈전</strong><span class="mode-description">${EXPEDITION_INFO.raid.summary}</span>${badgeMarkup(0,'data-attack-badge="raid"')}</button><button data-expedition="conquest" class="expedition-mode conquest"><img src="assets/mode-conquest.webp" alt=""><strong>정복전</strong><span class="mode-description">${EXPEDITION_INFO.conquest.summary}</span>${badgeMarkup(0,'data-attack-badge="conquest"')}</button><button data-explore class="expedition-mode explore"><img src="assets/mode-explore.webp" alt=""><strong>탐사전</strong><span class="mode-description">${EXPEDITION_INFO.explore.summary}</span></button></div>${g.exploration?`<button class="explore-return" data-explore>🧭 ${h(g.exploration.name)} · <b data-live-end="${g.exploration.endAt}">${g.exploration.endAt>serverNow()?timeLeft(g.exploration.endAt-serverNow()):'보상 수령'}</b></button>`:''}${g.captures.some(x=>typeof x==='string')?`<div class="territory-income"><b>정복지 ${g.captures.filter(x=>typeof x==='string').length}/${state.territoryCap}</b><span>시간당 ${h(territoryRewardText(state.income))}</span></div>`:''}</div>`;
  return;
 }
 const current=animation.current||animation.frames[0],inBattle=animation.phase!=='finished';
 el.innerHTML=`<div class="war-scene"><div class="war-topbar">${battleHealthMarkup('a',current,healthMaxima('a'),false,battleLabels().a)}${battleHealthMarkup('b',current,healthMaxima('b'),false,battleLabels().b)}</div><div id="warScroller" class="war-scroller open" aria-label="좌우로 움직여 보는 전장"><canvas id="warCanvas" width="1920" height="1080" aria-label="사원의 이동과 전투"></canvas></div><div class="war-camera"><button data-camera="own">내 센터</button><button data-camera="fight">교전</button><button data-camera="enemy">상대</button></div><div class="war-bottombar">${inBattle?`<div class="war-playback"><span id="battleHint">${current.t.toFixed(1)}초 · 공격 ${current.a.n}명 / 방어 ${current.b.n}명</span><button class="war-pill" data-speed="${warPlaybackSpeed===1?2:1}">${warPlaybackSpeed}배속</button><button class="war-pill" data-skip-battle>스킵 »</button>${animation.payload.pending?'<button class="war-pill retreat-button" data-retreat>후퇴</button>':''}</div>`:'<button class="btn btn-gold btn-wide" data-return-battle="war">출정 준비로 복귀</button>'}</div></div>`;
 const scroll=$('warScroller');if(scroll){scroll.scrollLeft=warScrollLeft;scroll.addEventListener('scroll',()=>warScrollLeft=scroll.scrollLeft,{passive:true});}drawBattle(current);
}
async function chooseExpedition(mode){
 if(animation?.payload.pending){toast('진행 중인 출정을 마무리해 주세요.',true);return;}
 warMode=mode;conquestFilter='all';warTarget='';await loadState({silent:true});if(!state.activeBattle)openWarChooser();
}
function openWarChooser(){
 if(!state)return;marchContext='war';
 const g=state.me.game,conquest=warMode==='conquest',targets=warTargets().filter(v=>!conquest||conquestFilter==='all'||territoryRewardKind(v)===conquestFilter);
 if(!targets.some(v=>v.id===warTarget&&!v.disabled))warTarget=targets.find(v=>!v.disabled)?.id||'';
 const selected=targets.find(v=>v.id===warTarget);warCount=Math.max(1,Math.min(warCount,g.troops||1));
 showModal(`<div class="modal-header"><h2 class="modal-title">${conquest?'🚩 정복전':'⚔ 약탈전'}</h2><button data-close class="modal-close">닫기 ✕</button></div>${expeditionIntro(warMode)}${defenseAlertsMarkup(warMode)}${conquest?`<div class="category-tabs conquest-filters" aria-label="정복지 보상 종류">${[['all','전체'],['resources','자원'],['shards','조각'],['books','교본']].map(([id,label])=>`<button class="btn ${conquestFilter===id?'btn-gold':'btn-outline'}" data-conquest-filter="${id}" aria-pressed="${conquestFilter===id}">${label}</button>`).join('')}</div><p class="conquest-open-count">${state.territories.length}곳 개방 · 정복지 한도 ${state.territoryCap}곳</p>`:''}<div class="enemies">${targets.map(v=>`<button class="enemy ${warTarget===v.id?'active':''}" data-war-target="${h(v.id)}" ${v.disabled?'disabled':''}><span>${conquest?(territoryRewardKind(v)==='shards'?'🧩':territoryRewardKind(v)==='books'?'📚':'🏭'):'🏢'}</span><div class="enemy-info"><div class="rank-title">${h(v.name)}</div><div class="sub">${conquest?`점령: ${h(v.ownerName)}${v.status==='중립지대'?'':' · '+h(v.status)}`:h(v.status)} · ${conquest&&v.ownerId?'주둔':'방어'} 사원 ${number(v.troops)}명${conquest&&v.heroId?' · '+h(state.progression.heroes.find(x=>x.id===v.heroId)?.name||'파트장'):''}</div><div class="enemy-values"><b>방어 병력 전투력 ${number(v.armyPower??v.power)}</b>${conquest?`<b>시간당 ${h(territoryRewardText(v))}</b>`:`<b>약탈 가능 📦 ${number(v.lootAvailable)}</b>`}</div>${v.shieldUntil>serverNow()?`<small class="protection-clock">보호 <span data-live-end="${v.shieldUntil}">${timeLeft(v.shieldUntil-serverNow())}</span></small>`:''}</div><span class="enemy-status">${warTarget===v.id?'✓':''}</span></button>`).join('')||'<div class="mail-empty">같은 서버에 약탈할 상대 센터가 없습니다.</div>'}</div>${conquest?ownedTerritoriesMarkup():''}${heroPicker()}${troopPicker()}<button class="btn btn-gold btn-wide" style="margin-top:16px" data-start-battle ${!selected||selected.disabled||g.troops<1||!!g.pendingBattle||!warHero?'disabled':''}>${selected?h(selected.name)+' 출정':'상대를 선택하세요'}</button><p class="raid-limit">${conquest?'승리 후 생존 사원 전원 주둔 · 점령 후 자동 보호 없음':'상대 박스 최대 20% 약탈 · 완전 함락 6시간 / 방어 성공 새 보호 없음'}</p>`);markAttackRead(warMode);
}

function openWarLog(){
  const bs=state?.battles||[];
  showModal(`<div class="modal-header"><h2 class="modal-title">📜 최근 전투 기록</h2><button data-close class="modal-close">닫기 ✕</button></div>
    ${bs.slice(0,16).map(b=>`<div class="history-row"><div><strong>${h(b.defender_name)} · ${b.result==='win'?'승리':b.result==='lose'?'패배':'무승부'}</strong>
      <small>${ago(b.at)} · 📦 ${number(b.loot)} 획득</small></div><button class="btn btn-outline" data-replay="${b.id}">리플레이</button></div>`).join('')||'<p class="muted">아직 전투 기록이 없어요.</p>'}`);
}
function renderServer(){const el=$('tabServer'),g=state.me.game,users=rankPlayers(state.ranks,rankMode),oldList=el.querySelector('.chat-list');
if(serverPage==='chat'&&el.dataset.serverPage==='chat'&&oldList?.dataset.painted){syncChatViewport();paintChat(oldList);return;}
const prevInput=$('chatInput')?.value||chatDraft;
el.dataset.serverPage=serverPage;el.innerHTML=`<div class="category-tabs server-tabs">${[['chat','채팅'],['rank','랭킹'],['news','전투 소식']].map(([id,label])=>`<button class="btn ${serverPage===id?'btn-gold':'btn-outline'}" data-server-page="${id}">${label}</button>`).join('')}</div><div class="page-title"><div><h2>우리 서버 🌐</h2></div><div class="server-actions"><button class="btn btn-outline" data-invite>서버 초대 · ${h(state.me.world)}</button><button class="btn btn-outline" data-community-review>리뷰 보내기</button>${state.developerNotice?.canManage?'<button class="btn btn-gold" data-community-manage>개발자 우편국 '+(state.community?.reviewCount?'('+state.community.reviewCount+')':'')+'</button><button class="btn btn-outline" data-manage-notice aria-label="개발자 공지 관리">공지 관리</button>':''}</div></div>
<div class="card card-chat"><div class="card-head"><h3>💬 서버 채팅</h3><button class="btn btn-outline" data-chat-expand>${chatExpanded?'작게 보기':'크게 보기'}</button></div><div class="chat-list" role="log" tabindex="0" aria-label="서버 채팅 메시지"></div><button class="chat-latest btn btn-outline" data-chat-bottom hidden>최근 메시지 ↓</button><form id="chatForm" class="chat-compose"><textarea id="chatInput" rows="1" maxlength="300" placeholder="서버 채팅 작성" aria-label="서버 채팅 작성"></textarea><button class="btn btn-gold" type="submit">보내기</button></form></div>
<div class="card card-league"><div class="card-head"><h3>🏆 서버 랭킹</h3><span class="tag">${users.length}명 참가</span></div><div class="switch-tabs"><button data-rank="total" class="${rankMode==='total'?'active':''}">전투력</button><button data-rank="mine" class="${rankMode==='mine'?'active':''}">채굴 구역</button></div>${users.map((v,i)=>`<div class="ranking-row"><span class="rank-no">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span><div class="meta"><strong>${h(v.nickname)}${v.id===state.me.id?' (나)':''}</strong><small>${isTDWorld(state)?'공격 '+number(v.attackPower||0)+' · 방어 '+number(v.defensePower||0):'승리 '+v.wins+'회 · 사원 '+v.troops+'명'}</small></div><span class="points">${rankMode==='mine'?'구역 ':''}${number(rankMode==='mine'?v.mineZone||1:v.power)}</span></div>`).join('')}</div>
<div class="card card-news"><div class="card-head"><h3>📜 최근 전쟁 소식</h3></div><p class="report-perspective">공격자 기준 결과 · 양쪽 출정 사원 기준 잔존 비율</p>${state.battles.slice(0,8).map(battleReportMarkup).join('')||'<p class="muted">아직 전쟁 기록이 없어요.</p>'}</div>`;
const list=el.querySelector('.chat-list'),inp=$('chatInput');inp.value=prevInput;
list.addEventListener('scroll',()=>{if(!list.isConnected||chatScrollFrame)return;chatScrollFrame=requestAnimationFrame(()=>{chatScrollFrame=0;syncChatBadge();rememberChatPosition();});},{passive:true});
syncChatViewport();if(serverPage==='chat'){paintChat(list);}else syncChatBadge();}
function showModal(content){$('modalContent').removeAttribute('role');$('modalContent').removeAttribute('aria-modal');$('modalContent').removeAttribute('aria-label');$('modalContent').className='modal-content '+(content.includes('welcome-notice')?'modal-notice':content.includes('attendance-grid')?'modal-attendance':content.includes('warehouse-art')?'modal-storage':content.includes('workbook-intro')?'modal-workbook':content.includes('march-heroes')?'modal-war':content.includes('hero-roster')||content.includes('hero-detail')?'modal-heroes':content.includes('data-buy=')?'modal-shop':'modal-ledger');$('modalContent').innerHTML=content;$('modalOverlay').classList.remove('hidden');}
function closeModal(){$('modalOverlay').classList.add('hidden');}
// Only a player's dismissal of attendance opens the notice; internal modal changes do not.
function dismissModal(){const afterEvent=$('modalContent').classList.contains('modal-attendance');closeModal();if(afterEvent&&state&&!showOnboard&&!animation&&!recruiting)openNotice();syncChatBadge();}
function openNotice(){
 showModal(`${modalHead('📣 재팤의 환영 공지')}<article class="welcome-notice"><img class="notice-art" src="assets/notice-welcome.webp" alt="센터 앞에서 손을 흔들며 센터장님을 환영하는 복슬이"><div class="notice-letter"><span class="notice-from">개발자 재팤의 편지</span><h3>센터장님, 환영합니다!</h3><p>안녕하세요! 컬리 아포칼립스 개발자 <strong>재팤</strong>입니다.</p><p>함께 박스를 캐고 센터를 키워 주셔서 감사합니다. 주기적으로 즐거운 이벤트도 열 예정이니, 앞으로도 많은 사랑 부탁드려요!</p><section class="notice-support"><h4>과금 없이, 함께 만드는 게임</h4><p>이 게임에는 <strong>과금이 일체 없습니다.</strong><br>더 나은 게임과 새로운 콘텐츠 업데이트를 위한 자발적인 후원을 환영합니다.</p><div class="support-bank"><label for="supportAccount">카카오뱅크</label><input id="supportAccount" aria-label="카카오뱅크 후원 계좌번호" value="${SUPPORT_ACCOUNT}" readonly inputmode="numeric"><button class="btn btn-gold" data-copy-support>계좌번호 복사</button><span class="support-copy-status" role="status" aria-live="polite"></span></div><p class="support-optional">후원은 선택이에요. 후원 시 게임 닉네임으로 입금해 주세요. 확인 후 자동채굴 2시간권을 선물로 보내드립니다.</p></section><p class="notice-signature">오늘도 즐거운 센터 생활 되세요!<br><strong>개발자 재팤 드림</strong></p><button class="btn btn-gold btn-wide" data-close>확인</button></div></article>`);
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
 if(isTDWorld(state)){renderTDTab().catch(()=>{});return;}
 const g=state.me.game,el=$('tabShop');
 el.querySelectorAll('[data-pool-rates]').forEach(d=>shopDisclosure[d.dataset.poolRates]=d.open);
 const focusedPool=document.activeElement?.closest('[data-pool-rates]')?.dataset.poolRates;
 el.innerHTML=`<div class="shop-banner"><h3>센터 보급 상점</h3></div><div class="category-tabs">${[['equipment','⚙ 설비'],['supplies','📦 보급'],['recruit','✨ 파트장 모집']].map(([id,label])=>`<button class="btn ${shopGroup===id?'btn-gold':'btn-outline'}" data-shop-group="${id}">${label}</button>`).join('')}</div>${shopPurchasing?'<p class="purchase-pending" role="status">구매 처리 중…</p>':pendingShopPurchase()?'<button class="btn btn-gold btn-wide" data-purchase-retry>중단된 구매 결과 확인</button>':''}${shopGroup==='recruit'?recruitmentShopMarkup():''}<div class="shop-grid">${(state.shopItems||[]).filter(i=>(i.category||(i.id==='boost'?'supplies':'equipment'))===shopGroup).map(i=>{const d=SHOP_DETAILS[i.id]||{},art={normalTicket:'ticket-normal',rareTicket:'ticket-rare',researchAid:'research-voucher',healAid:'medical-kit'}[i.id]||i.image||d.image||'panel-shop',desc=i.id==='auto'?'자동채굴 중에도 직원 합성과 구역 이동은 직접 진행해야 합니다.':i.eventOnly?'이벤트 한정 · 출석 7일차 이용권':i.description||d.description||({normalTicket:'일반 모집에 사용하는 입장권',rareTicket:'희귀 모집에 사용하는 입장권',researchAid:'진행 중인 연구 10분 단축',healAid:'회복 중인 사원 전원 즉시 복귀'}[i.id]||'');return `<div class="shop-card ${i.locked?'future-item':''}"><div class="shop-art ${i.id}">${shopVisual(i,art)}</div><div class="shop-info"><h3>${h(i.name)}</h3><p>${desc}</p><button class="btn btn-gold" data-buy="${i.id}" ${i.locked||i.owned||g[i.currency==='boxes'?'boxes':'cash']<i.price||shopPurchasing||pendingShopPurchase()?'disabled':''}>${i.owned?'영구 보유 중':i.eventOnly?'🔒 이벤트 전용':(i.currency==='boxes'?'📦 ':'💰 ')+number(i.price)}</button></div></div>`}).join('')}</div><button class="btn btn-outline btn-wide" style="margin-top:18px" data-inventory>📦 내 창고</button>`;
 if(focusedPool)el.querySelector(`[data-pool-rates="${focusedPool}"] summary`)?.focus({preventScroll:true});
}

function openProfile(){if(!state)return;const g=state.me.game;showModal(`<div class="modal-header"><h2 class="modal-title">👤 센터장 정보</h2><button data-close class="modal-close">닫기 ✕</button></div><div class="statrow"><span>게임 버전</span><strong>v2.2.4</strong></div><div class="statrow"><span>센터장</span><strong>${h(state.me.nickname)}</strong></div><div class="statrow"><span>서버 코드</span><strong>${h(state.me.world)}</strong></div><div class="statrow"><span>전투력</span><strong>${number(state.me.power.total)}</strong></div><div class="statrow"><span>도달 채굴 구역</span><strong>구역 ${number(g.mine.zone+1)}</strong></div><div class="statrow"><span>승리 / 패배</span><strong>${g.warWins}승 / ${g.warLosses}패</strong></div><button class="btn btn-outline btn-wide" style="margin-top:12px" data-guide>스토리·튜토리얼 다시 보기</button><button class="btn btn-outline btn-wide" style="margin-top:9px" data-logout>로그아웃</button><p class="section-note">PIN 번호는 복구되지 않아요. 다른 기기에서 로그인하려면 서버 코드·닉네임·PIN을 기억해 주세요.</p>`)}
function workerDps(w,g){return workerMiningDps(w,g)}
function openMail(){
 if(!state)return;const mails=state.me.game.mailbox||[],icons={territory:'🚩',upgrade:'🛠',recruit:'👥',battle:'⚔',defense:'🛡',zone:'🚪'};
 showModal(`<div class="modal-header"><h2 class="modal-title">✉ 우편함</h2><button class="modal-close" data-close>닫기 ✕</button></div><div class="mail-toolbar"><b>새 우편 ${mails.filter(m=>!m.readAt).length}</b><button class="btn btn-outline" data-mail-read ${mails.some(m=>!m.readAt)?'':'disabled'}>모두 읽음</button></div>${mails.map(m=>`<article class="mail-item ${m.readAt?'':'unread'}"><span>${icons[m.type]||'✉'}</span><div><h3>${h(m.title)}</h3><p>${h(m.body)}</p><time>${new Date(m.at).toLocaleString('ko-KR')}</time>${m.battleId?`<button class="btn btn-outline" data-replay="${h(m.battleId)}">전투 보기</button>`:''}</div></article>`).join('')||'<div class="mail-empty">아직 도착한 우편이 없습니다.</div>'}`);
}
function showBattleResult(p){
 const win=p.result==='win',draw=p.result==='draw',el=$('battleResult');
 el.innerHTML=`<div class="result-card ${win?'victory':'defeat'}"><div class="result-art"><img src="assets/${win?'result-win':draw||p.retreated?'result-draw':'result-loss'}.webp" alt="${win?'센터를 점령하고 환호하는 사원들':'다음 출정을 다짐하는 사원들'}"><h2>${p.retreated?'후퇴 완료':p.conquered?'정복 성공!':win?'약탈 성공!':draw?'무승부':'다시 일어서자'}</h2></div><div class="result-info"><h3>${h(p.defenderName)} · ${p.retreated?'생존 사원 복귀':win?'승리':draw?'무승부':'패배'}</h3><div class="result-stats"><span>${p.conquered?'정복지 확보':'약탈 박스'} <b>${p.conquered?'🚩':'📦 '+number(p.loot)}</b></span><span>${p.garrisonVersion===1?'주둔 / 손실':'귀환 / 손실'} <b>${number(p.survivors??p.amount-p.lost)} / ${number(p.lost)}명</b></span></div><div class="btnrow"><button class="btn btn-gold" data-return-battle="center">센터로 복귀</button><button class="btn btn-outline" data-return-battle="war">출정 준비</button></div></div></div>`;
 el.classList.remove('hidden');
}
function returnFromBattle(tab){$('battleResult').classList.add('hidden');$('battleTransition').classList.add('hidden');animation=null;animating=false;warScrollLeft=0;setTab(tab);}
let zoneTimer;
function showZoneTransition(zone){
 const el=$('zoneTransition');clearTimeout(zoneTimer);
 el.innerHTML=`<div class="zone-scroll-track"><section class="zone-new"><h2>구역 ${zone+1}</h2><img class="arrival-gate" src="assets/warehouse-gate-open.webp" alt="방금 돌파한 창고 문"></section><section class="zone-old"><h2>구역 ${zone} 돌파!</h2><img src="assets/warehouse-gate-open.webp" alt=""></section></div>`;
 el.classList.remove('hidden');zoneTimer=setTimeout(()=>el.classList.add('hidden'),1900);
}
function openMerge(){
 const g=miningView(),ws=(g.workers||[]).filter(w=>!w.pendingMerge),pairs=[],byLevel=new Map();
 // One available pair per level keeps the list usable with unlimited ownership.
 for(const w of ws){const group=byLevel.get(w.level)||[];if(group.length<2)group.push(w);byLevel.set(w.level,group);}
 for(const [a,b] of byLevel.values())if(canMergeWorkers(a,b))pairs.push([a,b]);
 pairs.sort((a,b)=>a[0].level-b[0].level);
 showModal(`<div class="modal-header"><h2 class="modal-title">🔀 일용직 합성 · 최대 Lv.${WORKER_MAX_LEVEL}</h2><button class="modal-close" data-close>닫기 ✕</button></div>
 <p class="section-note">같은 레벨 2명을 합쳐 1레벨 올려요. 한 명의 채굴 속도는 이전 레벨의 2.4배로, 두 명의 합계보다 20% 빨라져요.</p>
 <p class="section-note">경력 확률 연구: ${Math.round((state.mineStats.mergeChance||0)*100)}% 확률로 2레벨 상승 · Lv.${WORKER_MAX_LEVEL}을 넘지 않아요. 최대 레벨 직원은 채굴에 계속 사용할 수 있어요.</p>
 <div class="miner-progression-note"><b>기본 소환 Lv.${state.mineStats.summonLevel||1} / 최대 Lv.${SUMMON_MAX_LEVEL}</b><p>경력 증가 연구는 소환 시작 레벨을 올려요. 보유 일용직도 기본 소환 레벨보다 낮으면 무료로 올라가요. 합성으로 최대 Lv.${WORKER_MAX_LEVEL}까지 성장해요.</p><p>보유 인원 제한 없이 소환할 수 있어요. 자리가 없으면 대기하며, 대기 일용직도 여기서 합성할 수 있어요. 통로가 열리면 자동 배치되고 다음 구역에서도 모두 유지돼요.</p></div>
 ${pairs.length?pairs.map(([a,b])=>`<div class="shop-item"><span class="si">👷</span><div class="info"><strong>Lv.${a.level} + Lv.${b.level} → Lv.${a.level+1}</strong><small>채굴 속도 합계 ${number(workerDps({...a,parked:false},g)*2)} → ${number(workerDps({...a,parked:false,level:a.level+1},g))} DPS</small></div><button class="btn btn-gold" data-merge="${a.id}|${b.id}">합성</button></div>`).join(''):`<p class="muted">${ws.some(w=>w.level>=WORKER_MAX_LEVEL)?`Lv.${WORKER_MAX_LEVEL} MAX 직원은 추가로 합성할 수 없어요. 그 아래 같은 레벨 2명이 필요해요.`:'합성하려면 같은 레벨 일용직 2명이 필요해요.'}</p>`}
 <details class="miner-level-table"><summary>레벨별 기본 채굴 속도 보기 · Lv.1~${WORKER_MAX_LEVEL}</summary><p>연구·숙련도·정복지·부스트·지게차 효과 적용 전 수치예요.</p><table><thead><tr><th>직원 레벨</th><th>기본 채굴 속도</th></tr></thead><tbody>${Array.from({length:WORKER_MAX_LEVEL},(_,i)=>`<tr><th>Lv.${i+1}${i+1===WORKER_MAX_LEVEL?' MAX':''}</th><td>${new Intl.NumberFormat('ko-KR',{maximumFractionDigits:1}).format(workerBaseDps(i+1))} DPS</td></tr>`).join('')}</tbody></table></details>`);
}
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
function setTab(tab){if(!['center','mine','war','shop','event','server'].includes(tab))return;rememberChatPosition();if(selectedTab!==tab||isTDWorld(state)&&tdTab(tab)){tdController?.hide();tdShownTab='';chatResumePending=true;}if(tab==='war')tdWarOpen=!!tdDestination||!!state?.td?.campaign.pending;selectedTab=tab;if(tab!=='server')chatExpanded=false;render();if(tab!=='server'||serverPage!=='chat')window.scrollTo({top:0,behavior:'smooth'});}

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
   if(label)label.textContent=number(value)+' / '+number(Math.ceil(max));if(bar)bar.style.width=Math.max(0,Math.min(100,100*value/Math.max(1,max)))+'%';
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
  const interpolateSide=side=>{const a=f[side],b=next[side],out={...a,x:a.x+(b.x-a.x)*alpha};if(a.ranks)out.ranks=Object.fromEntries(Object.entries(a.ranks).map(([k,r])=>[k,{...r,x:r.x+((b.ranks?.[k]?.x??r.x)-r.x)*alpha}]));if(a.h&&Number.isFinite(a.h.x))out.h={...a.h,x:a.h.x+((b.h?.x??a.h.x)-a.h.x)*alpha};return out;};current.current={...f,t:seconds,a:interpolateSide('a'),b:interpolateSide('b')};drawBattle(current.current);
  const sc=$('warScroller');if(sc&&!current.manualCamera&&seconds>1.4){const front=current.current.a.n?current.current.a.x:current.current.b.x;sc.scrollLeft=Math.max(0,front*sc.scrollWidth-sc.clientWidth*.48);}
  const hint=$('battleHint');if(hint)hint.textContent=`${seconds.toFixed(1)}초 · 공격 ${current.current.a.n}명 / 방어 ${current.current.b.n}명`;
  if(seconds>=current.frames.at(-1).t)finishBattle();else requestAnimationFrame(run);
 };requestAnimationFrame(run);
}

async function replay(id){try{const v=await api('/api/battle/'+id);if(v.battle.released){toast('정복지 포기 기록입니다.');return;}closeModal();if(isTDWorld(state)&&v.battle.engineVersion?.startsWith('td-')&&v.battle.snapshot){if(state.td.campaign.pending){toast('현재 출정이 끝난 뒤 기록을 볼 수 있어요.');return;}tdDestination={page:'history'};setTab('war');await renderTDTab();const c=tdController;c.session.campaign.history=[v.battle,...c.session.campaign.history.filter(r=>r.id!==v.battle.id)];if(c.session.playReplay(v.battle.id))c.ui.close();return;}playBattle(v.battle);}catch(e){toast(e.message,true)}}
let suppressMineClickUntil=0;
function handleAction(e){if(Date.now()<suppressMineClickUntil&&e.target.closest('#tabMine'))return;const btn=e.target.closest('button');if(!btn)return;if(handleAdminButton(btn))return;if(!state)return;if(btn.dataset.trainingMerge!==undefined){const o=state.me.game.onboarding;if(o?.stage==='merge')doAction('worker/merge',{a:o.workerIds[0],b:o.workerIds[1]});return;}if(btn.dataset.trainingFinish!==undefined){doAction('training/finish').then(out=>{if(out){closeModal();maybeEventPopup();}});return;}if(handleV17Button(btn))return;
if(btn.dataset.returnBattle){returnFromBattle(btn.dataset.returnBattle);return}if(btn.dataset.openMail!==undefined){openMail();return}if(btn.dataset.mailRead!==undefined){doAction('mail/read').then(openMail);return}if(btn.dataset.recruitMax!==undefined){doAction('troops/recruit',{max:true});return}if(btn.dataset.gate!==undefined){const w=state.me.game.workers.find(v=>v.id===selectedWorker)||state.me.game.workers[0];if(w)doAction('mine/gate',{worker:w.id});else toast('일용직을 먼저 소환해 주세요.',true);return}if(btn.dataset.skipIntro!==undefined){beginBattle();return}if(btn.dataset.tab){if(miningDragging)return;setTab(btn.dataset.tab);return}if(btn.dataset.modal==='shop'){openShop();return}if(btn.dataset.close!==undefined){dismissModal();return}if(btn.dataset.guide!==undefined){closeModal();onboardStep=0;showTutorial();return}if(btn.dataset.logout!==undefined){api('/api/logout','POST',{}).then(()=>location.reload()).catch(err=>toast(err.message,true));return}
if(btn.dataset.upgrade){doAction('upgrade/start',{key:btn.dataset.upgrade});return}if(btn.dataset.recruit){doAction('troops/recruit',{amount:Number(btn.dataset.recruit)});return}if(btn.dataset.summon!==undefined){doAction('worker/summon');return}if(btn.dataset.worker){selectedWorker=btn.dataset.worker;renderMine();return}if(btn.dataset.openMerge!==undefined){openMerge();return}if(btn.dataset.merge){const [a,b]=btn.dataset.merge.split('|');closeModal();doAction('worker/merge',{a,b});return}
if(btn.dataset.tile!==undefined){const idx=Number(btn.dataset.tile),w=state.me.game.workers.find(v=>v.id===selectedWorker)||state.me.game.workers[0],n=state.me.game.mine.nodes[idx];if(!w){toast('일용직을 먼저 소환해 주세요.',true);return}if(n.done)doAction('mine/move',{worker:w.id,x:idx%5,y:Math.floor(idx/5)});else doAction('mine/dispatch',{worker:w.id,idx});return}
if(btn.dataset.start!==undefined){doAction('mine/move',{worker:selectedWorker,x:Number(btn.dataset.start),y:8});return}if(btn.dataset.nextZone!==undefined){doAction('mine/next-zone');return}
if(btn.dataset.invite!==undefined){shareServer();return}
if(btn.dataset.buy){if(['normalTicket','rareTicket'].includes(btn.dataset.buy))openTicketPurchase(btn.dataset.buy);else purchaseShopItem(btn.dataset.buy);return}
if(btn.dataset.purchaseRetry!==undefined){purchaseShopItem();return}

if(btn.dataset.conquestFilter){conquestFilter=['all','resources','shards','books'].includes(btn.dataset.conquestFilter)?btn.dataset.conquestFilter:'all';openWarChooser();return}if(btn.dataset.expedition){chooseExpedition(btn.dataset.expedition);return}if(btn.dataset.retreat!==undefined){finishBattle(true);return}if(btn.dataset.openWar!==undefined){openWarChooser();return}if(btn.dataset.openWarLog!==undefined){openWarLog();return}if(btn.dataset.warTarget){warTarget=btn.dataset.warTarget;openWarChooser();return}if(btn.dataset.startBattle!==undefined){requestBattleStart();return}if(btn.dataset.camera){if(animation)animation.manualCamera=true;const sc=$('warScroller');if(sc)sc.scrollTo({left:btn.dataset.camera==='own'?0:btn.dataset.camera==='enemy'?sc.scrollWidth:(sc.scrollWidth-sc.clientWidth)/2,behavior:'smooth'});return}if(btn.dataset.speed){setBattleSpeed(Number(btn.dataset.speed));return}if(btn.dataset.skipBattle!==undefined){finishBattle();return}if(btn.dataset.replay){replay(btn.dataset.replay);return}if(btn.dataset.rank){rankMode=btn.dataset.rank;renderServer();return}
}
function paintMineDrag(d){
  if(miningDragging!==d)return;
  d.frame=0;
  const drop=document.elementFromPoint(d.clientX,d.clientY)?.closest('.mine-worker,.mine-tile,[data-gate]');
  const next=drop!==d.sprite?drop:null;
  d.sprite.style.transform=`translate(-50%,-50%) translate3d(${(d.clientX-d.x)/d.sx}px,${(d.clientY-d.y)/d.sy}px,0) scale(1.08)`;
  if(d.drop!==next){d.drop?.classList.remove('mine-drop');next?.classList.add('mine-drop');d.drop=next;}
}
async function settleMineDrop(type,params){
 const view=miningView();if(miningInput.items.length>=miningInput.max){toast('조작을 저장 중이에요. 잠시 후 다시 시도해 주세요.',true);renderMine();return null;}
 if(!previewMiningInput(view,type,params,miningViewTime(),serverNow())){toast(view.workers.some(w=>[params.a,params.b].includes(w.id)&&w.pendingMerge)?'합성 결과를 확인 중이에요. 다른 일꾼은 계속 조작할 수 있어요.':'이 위치로 배치하거나 합성할 수 없어요.',true);renderMine();return null;}
 return miningInput.enqueue(type,params);
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
    const a=miningView().workers.find(w=>w.id===d.id),b=miningView().workers.find(w=>w.id===other.dataset.worker);
    if(!canMergeWorkers(a,b)){toast(a?.level>=WORKER_MAX_LEVEL?`최대 Lv.${WORKER_MAX_LEVEL} 직원은 추가 합성할 수 없어요.`:'같은 레벨의 일용직을 겹쳐 놓으면 합성할 수 있어요.',true);renderMine();return;}
    settleMineDrop('worker/merge',{a:a.id,b:b.id});return;
  }
  if(gate){settleMineDrop('mine/gate',{worker:d.id});return;}
  if(tile?.dataset.tile!==undefined){
    const idx=Number(tile.dataset.tile),node=miningView().mine.nodes[idx];
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
document.addEventListener('toggle',e=>{const d=e.target;if(!d?.matches?.('details[data-class-stats]')||!d.isConnected)return;const key=d.dataset.classStats;if(!CLASS_VIEW[key])return;classStatsOpen[key]=d.open;const label=d.querySelector('[data-stats-label]');if(label)label.textContent=CLASS_VIEW[key].icon+' '+CLASS_VIEW[key].name+' 능력치 '+(d.open?'접기':'펼치기');try{localStorage.setItem('ka_class_stats_open_v1',JSON.stringify(classStatsOpen));}catch{}},true);
$('modalOverlay').addEventListener('click',e=>{if(e.target===$('modalOverlay'))dismissModal()});$('cashResource').addEventListener('click',openShop);$('boxResource').addEventListener('click',()=>setTab('mine'));$('guideBtn').addEventListener('click',()=>{onboardStep=0;showTutorial()});$('profileBtn').addEventListener('click',openProfile);$('mailBtn').addEventListener('click',openMail);
$('onboardNext').addEventListener('click',advanceOnboarding);$('onboardSkip').addEventListener('click',()=>{if(!state?.me.game.storySeen||!state?.me.game.tutorialSeen)return;if(onboardStep<5){onboardStep=5;renderTutorial();}else completeTutorial()});
document.addEventListener('input',e=>{if(e.target.id==='ticketQuantity')updateTicketTotal();if(e.target.id==='developerNoticeMessage'){$('developerNoticeCount').textContent=[...e.target.value].length+' / 300자';}if(e.target.id==='warSlider'){warCount=Number(e.target.value);updateMarchCounts();}});
document.addEventListener('submit',async e=>{if(e.target.id==='ticketPurchaseForm'){e.preventDefault();const form=e.target,q=Number($('ticketQuantity').value);if(!Number.isSafeInteger(q)||q<1||q>1000)return;await purchaseShopItem(form.dataset.item,q);if(form.isConnected)updateTicketTotal();return;}if(e.target.id==='developerNoticeForm'){e.preventDefault();await saveDeveloperNotice(e.target);return;}if(e.target.id==='chatForm'){e.preventDefault();const input=$('chatInput'),message=input.value.trim();if(!message)return;try{await api('/api/chat','POST',{message,requestId:crypto.randomUUID()});input.value='';chatDraft='';chatForceBottom=true;await loadState({silent:true});toast('채팅을 전송했어요.')}catch(err){toast(err.message,true)}return;}
if(e.target.id==='authForm'){e.preventDefault();const pin=$('pinField').value,nickname=$('nickField').value.trim(),world=$('worldField').value.trim().toUpperCase();const submit=$('authSubmit');submit.disabled=true;try{const master=authMode==='login'&&nickname.toLowerCase()==='master';await api(master?'/api/admin/login':'/api/'+authMode,'POST',{pin,nickname,world:master?'':world});if(master)await loadAdmin();else{localStorage.removeItem(ADMIN_KEY);await loadState();}}catch(err){toast(err.message,true)}finally{submit.disabled=false;}return;}});
$('signupTab').addEventListener('click',()=>{authMode='register';syncMasterForm();$('signupTab').classList.add('active');$('loginTab').classList.remove('active');$('authSubmit').textContent='혁명 시작하기 →';});$('loginTab').addEventListener('click',()=>{authMode='login';syncMasterForm();$('loginTab').classList.add('active');$('signupTab').classList.remove('active');$('authSubmit').textContent='기존 계정으로 로그인 →';});
setInterval(()=>{if(!state||document.hidden||showOnboard||(isTDWorld(state)&&tdController?.active&&tdTab(selectedTab))||(!$('modalOverlay').classList.contains('hidden')&&!$('modalContent').querySelector('[data-mail-read]'))||animating||miningDragging||miningSettling||miningActionsPending||recruiting)return;pollState();},5000);

let timerRefreshAt=0,chatComposing=false;
document.addEventListener('compositionstart',e=>{if(e.target.id==='chatInput')chatComposing=true;});
document.addEventListener('compositionend',e=>{if(e.target.id==='chatInput'){chatComposing=false;if(selectedTab==='server'&&serverPage==='chat')renderServer();}});
setInterval(()=>{
 if(!state||document.hidden||showOnboard)return;
 const now=serverNow(),g=state.me.game;syncEventBadge();let mineDue=false;
 document.querySelectorAll('[data-live-end]').forEach(el=>{const text=timeLeft(Number(el.dataset.liveEnd)-now);if(el.textContent!==text)el.textContent=text;});
 document.querySelectorAll('[data-progress-end]').forEach(el=>{const a=Number(el.dataset.progressStart),b=Number(el.dataset.progressEnd);el.style.width=Math.max(0,Math.min(100,100*(now-a)/Math.max(1,b-a)))+'%';});
 if(selectedTab==='mine'&&!miningDragging&&(!miningSettling||miningSettling.ready)){
   const mining=miningView(),projectionAt=miningViewTime(),rates=miningRates(mining,now);
   const dps=document.querySelector('[data-mining-dps]'),dpsText='⚒ '+number(state.mineStats.rawDps*miningMultiplier(g,now))+' DPS'+(miningMultiplier(g,now)>1?' · 2배':'');if(dps&&dps.textContent!==dpsText)dps.textContent=dpsText;
   document.querySelectorAll('.mine-tile[data-tile]').forEach(el=>{
     const idx=Number(el.dataset.tile),n=mining.mine.nodes[idx];if(!n||n.done)return;
     const rate=rates.rates[idx];
     const hp=miningHp(n.hp,rate,projectionAt,now,g.shop.boostUntil);
     if(rate>0&&hp<=0)mineDue=true;
     const bar=el.querySelector('.mine-ore-health i');const width=(100*hp/n.max).toFixed(2)+'%';if(bar&&bar.style.width!==width)bar.style.width=width;
     const timer=el.querySelector('.mine-ore-timer');if(timer)timer.textContent=hp<=0?'수령 중':timeLeft(miningSeconds(hp,rate,now,g.shop.boostUntil)*1000);
   });
   const gate=mining.mine.gate,rate=rates.gate;
   if(gate&&!gate.done&&rate){
    const hp=miningHp(gate.hp,rate,projectionAt,now,g.shop.boostUntil);
    const bar=document.querySelector('[data-gate-bar]'),count=document.querySelector('[data-gate-count]'),timer=document.querySelector('[data-gate-timer]');
    if(bar)bar.style.width=100*hp/gate.max+'%';if(count)count.textContent=number(hp)+' / '+number(gate.max);if(timer)timer.textContent=timeLeft(miningSeconds(hp,rate,now,g.shop.boostUntil)*1000);
    if(hp<=0)mineDue=true;
   }
 }
 const due=[...(g.recruitQueue||[]),...g.upgrades,...(g.wounded||[])].some(j=>j.endAt<=now)||(g.exploration&&!g.exploration.notified&&g.exploration.endAt<=now);
 if((due||mineDue)&&!miningDragging&&!miningSettling&&!miningActionsPending&&!animating&&now-timerRefreshAt>1200){timerRefreshAt=now;pollState();}
},150);

const timedPassController=mountTimedPasses({api,getState:()=>state,clock:serverNow,reload:out=>applyMiningUpdate(out)?Promise.resolve(state):loadState({silent:true,resumeBattle:false}),showModal,closeModal,head:modalHead,toast});
patchNoticeController=mountCombatPatch({getState:()=>state,showModal,closeModal,head:modalHead,api,available:()=>!!state&&!showOnboard&&!animation&&!recruiting&&!popupPending&&$('modalOverlay').classList.contains('hidden')});
updateNoticeController=mountPatchUpdate({getState:()=>state,showModal,closeModal,head:modalHead,api,clock:serverNow,available:()=>!!state&&!showOnboard&&!animation&&!recruiting&&!popupPending&&$('modalOverlay').classList.contains('hidden')});
const communityController=mountCommunity({api,autoReview:()=>!isTDWorld(state),getState:()=>state,reload:()=>loadState({silent:true,resumeBattle:false}),showModal,closeModal,head:modalHead,escape:h,toast,openSupport:openNotice,available:()=>!!state&&!showOnboard&&!isTrainingActive()&&!animation&&!animating&&!recruiting&&!popupPending&&selectedTab!=='event'&&$('modalOverlay').classList.contains('hidden')});
if(localStorage.getItem(ADMIN_KEY)&&requestedWorld!=='TEST')loadAdmin();else loadState({silent:true});

$('enterSignup').addEventListener('click',()=>{$('auth').classList.add('auth-open');$('signupTab').click();});
$('enterLogin').addEventListener('click',()=>{$('auth').classList.add('auth-open');$('loginTab').click();});
$('titleBack').addEventListener('click',()=>$('auth').classList.remove('auth-open'));

$('nickField').addEventListener('input',syncMasterForm);

function stationedUi(g){return Object.values(g.garrisons||{}).reduce((s,j)=>s+(j.amount||0),0);}
function reservedUi(g){return stationedUi(g)+(g.pendingBattle?.amount||0)+(g.exploration?.amount||0)+(g.wounded||[]).reduce((s,j)=>s+j.amount,0);}
function modalHead(title){return `<div class="modal-header"><h2 class="modal-title">${title}</h2><button class="modal-close" data-close>닫기 ✕</button></div>`;}
function territoryRewardKind(v){return Object.keys(v.shardsPerHour||{}).length?'shards':v.normalHeroXpPerHour||v.rareHeroXpPerHour?'books':'resources';}
function territoryRewardText(v){const parts=[];if(v.boxesPerHour)parts.push('📦 '+number(v.boxesPerHour));if(v.cashPerHour)parts.push('💰 '+number(v.cashPerHour));if(v.normalHeroXpPerHour)parts.push('📘 일반 교본 '+number(v.normalHeroXpPerHour)+' XP');if(v.rareHeroXpPerHour)parts.push('📕 희귀 교본 '+number(v.rareHeroXpPerHour)+' XP');for(const [id,rate] of Object.entries(v.shardsPerHour||{})){const name=state.progression.heroes.find(h=>h.id===id)?.name||'일반 파트장';parts.push('🧩 '+name.replace(' 파트장','')+' 조각 '+number(rate)+'개');}return parts.join(' · ');}
function rewardText(r){return Object.entries(r||{}).map(([k,v])=>({boxes:'📦 박스',cash:'💰 희귀 돈',normalTickets:'일반 모집권',rareTickets:'희귀 모집권',heroXp:'편성 등급 교본 XP',normalHeroXp:'일반 교본 XP',rareHeroXp:'희귀 교본 XP',forkliftTickets:'지게차 7일 이용권',forkliftDayTickets:'지게차 1일 이용권'}[k]||k)+' '+number(v)).join(' · ');}
function woundedMarkup(g){return g.wounded?.length?`<div class="card"><div class="card-head"><h3>💚 사원 회복실</h3><button class="btn btn-outline" data-heal ${!g.inventory.healAid?'disabled':''}>치료권 사용</button></div>${g.wounded.map(j=>`<div class="statrow"><span>회복 중 ${j.amount}명</span><b data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</b></div>`).join('')}</div>`:'';}
function heroPicker(){
 const heroes=state.progression.heroes;if(!heroes.some(v=>v.id===warHero&&v.star&&!v.busy))warHero=heroes.find(v=>v.star&&!v.busy)?.id||'';
 return `<section class="march-heroes"><h3>출정 파트장</h3><div class="march-hero-grid">${heroes.map(v=>`<button class="march-hero-card ${v.id===warHero?'chosen':''} ${!v.star?'unowned':''}" data-march-hero="${v.id}" aria-pressed="${v.id===warHero}" ${!v.star||v.busy?'disabled':''}><img src="assets/hero-${v.id}.webp" alt=""><strong>${h(v.name)}</strong><span class="hero-range">${HERO_RANGE(v.id)>.2?'🔫 원거리':'🔱 근접'}</span><small>${v.busy?'출정 중':v.star?'★'.repeat(v.star)+' · Lv.'+v.level:'미보유'}</small>${v.id===warHero?'<b class="chosen-check">✓</b>':''}</button>`).join('')}</div>${!heroes.some(v=>v.star)?'<button class="btn btn-gold btn-wide" data-workbook>이벤트 · 업무수첩에서 첫 파트장 합류</button>':''}</section>`;
}

const rarityOf=id=>['cs','beauty','returns'].includes(id)?'rare':'normal';
const gradeName=grade=>grade==='rare'?'희귀':'일반';
function markUnlockSeen(heroes){if(!state)return;const key='ka_unlock_seen_'+state.me.id;let seen=[];try{const old=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(old))seen=old;}catch{}try{localStorage.setItem(key,JSON.stringify([...new Set([...seen,...heroes.map(v=>v.id)])]));}catch{}}
function unlockReadyMarkup(heroes){return heroes.length?`<section class="unlock-ready-panel"><h3>파트장 해금 가능!</h3><p>전용 조각 10개가 모였어요. 파트장을 선택해 해금할 수 있어요.</p><div class="unlock-ready-grid">${heroes.map(v=>`<button class="unlock-ready-card ${rarityOf(v.id)}" data-ready-hero="${v.id}"><img src="assets/hero-${v.id}.webp" alt="${h(v.name)}"><strong>${h(v.name)}</strong><b>해금 가능</b><span>전용 조각 ${number(v.shards)} / 10</span></button>`).join('')}</div></section>`:'';}
function maybeUnlockPopup(){if(!state||document.hidden||showOnboard||isTrainingActive()||animation||recruiting||popupPending||!$('modalOverlay').classList.contains('hidden'))return;let seen=[];try{const value=JSON.parse(localStorage.getItem('ka_unlock_seen_'+state.me.id)||'[]');if(Array.isArray(value))seen=value;}catch{}const ready=unseenUnlockHeroes(state.progression.heroes,seen);if(!ready.length)return;markUnlockSeen(ready);showModal(`${modalHead('✨ 새로운 동료가 기다려요')}${unlockReadyMarkup(ready)}<button class="btn btn-outline btn-wide" data-close>나중에</button>`);}
setInterval(maybeUnlockPopup,1500);
function heroRosterMarkup(heroes){return ['normal','rare'].map(grade=>{const group=heroes.filter(v=>rarityOf(v.id)===grade);if(!group.length)return '';return `<h3 class="rarity-heading ${grade}">${gradeName(grade)} 파트장</h3><div class="hero-roster">${group.map(v=>`<button class="hero-card ${grade} ${v.star?'':'unowned'} ${!v.star&&v.shards>=10?'unlock-ready':''}" data-hero-detail="${v.id}"><img src="assets/hero-${v.id}.webp" alt="${h(v.name)}"><span class="rarity-badge ${grade}">${gradeName(grade)}</span><span class="hero-card-name">${h(v.name)}</span><b>${v.star?'★'.repeat(v.star)+' · Lv.'+v.level:'조각 '+v.shards+'/10'}</b><small>${v.busy?'출정 중':v.role+' · '+(HERO_RANGE(v.id)>.2?'원거리':'근접')}</small>${!v.star&&v.shards>=10?'<span class="hero-ready">해금 가능</span>':v.levelUpgrade?.enabled||v.starUpgrade?.enabled?'<span class="hero-ready">강화 가능</span>':''}</button>`).join('')}</div>`;}).join('');}
function openHeroes(){if(isTDWorld(state)){openTDPanel('management','hero');return;}if(isTDWorld(state)){openTDPanel('management','hero');return;}showModal(`${modalHead('⭐ 재고관리 파트장')}${heroRosterMarkup(state.progression.heroes)}${!state.me.game.quests.starter?'<button class="btn btn-gold btn-wide" data-claim-quest="starter">첫 파트장 확정 합류 · 냉동 파트장</button>':''}`);}
function openXpHeroes(grade='normal'){const inv=state.me.game.inventory,owned=state.progression.heroes.filter(v=>v.star&&rarityOf(v.id)===grade);showModal(`${modalHead('📘 경험치 교본 사용')}<div class="xp-intro"><h3>${gradeName(grade)} 교본 ${number(inv[grade+'HeroXp'])} XP</h3><p>${gradeName(grade)} 파트장의 레벨 강화에 사용합니다.</p></div>${owned.length?heroRosterMarkup(owned):'<p class="xp-intro">이 등급의 보유 파트장이 없습니다.</p>'}`);}
function heroGrowthMarkup(before,after){if(!before||!after)return '';return `<div class="hero-growth-stats">${[['hp','체력'],['damage','공격력']].map(([key,label])=>`<div><span>${label}</span><b>${number(before[key])} <em>→</em> ${number(after[key])}</b><strong>+${number(after[key]-before[key])}</strong></div>`).join('')}</div>`;}
function heroUpgradeCard(v,type){const preview=type==='level'?v.levelUpgrade:v.starUpgrade;if(!preview)return '';return `<section class="hero-upgrade-option"><h4>${type==='level'?'📘 레벨 강화':'🧩 성급 강화'} <span>${preview.after?(type==='level'?'Lv.'+(v.level+1):'★'.repeat(v.star+1)):'최대'}</span></h4>${heroGrowthMarkup(preview.before,preview.after)}<p>${!preview.after?'최대 강화에 도달했습니다.':type==='level'?`필요 ${number(preview.cost)} XP · 보유 ${number(preview.totalXp)} XP`:`전용 조각 ${number(v.shards)} / ${number(preview.cost)}개`}</p><button class="btn btn-gold btn-wide ${preview.enabled?'can-upgrade':''}" data-hero-action="${type}" data-id="${v.id}" ${preview.enabled?'':'disabled'}>${preview.enabled?(type==='level'?'레벨 강화':'성급 강화'):preview.reason.includes('최대')?'최대 도달':v.busy?'복귀 후 강화':type==='level'?'경험치 부족':'조각 부족'}</button>${preview.reason?`<p class="upgrade-reason" role="status">${h(preview.reason)}</p>`:''}</section>`;}
function openHero(id,change=null){if(isTDWorld(state)){openTDPanel('management','hero',id);return;}const v=state.progression.heroes.find(v=>v.id===id),g=state.me.game;if(!v)return;showModal(`${modalHead(h(v.name))}${change?`<section class="hero-upgraded" role="status"><h3>✨ ${change.type==='level'?'레벨':'성급'} 강화 완료</h3>${heroGrowthMarkup(change.before,change.after)}</section>`:''}<div class="hero-detail"><img class="hero-portrait" src="assets/hero-${v.id}.webp" alt="${h(v.name)}"><div><span class="rarity-badge ${rarityOf(v.id)}">${gradeName(rarityOf(v.id))}</span><div class="hero-stars">${v.star?'★'.repeat(v.star):'미보유'}</div><h3>${v.role} · Lv.${v.level} / ${state.progression.heroLimits?.level||50}</h3><p class="growth-help">파트장 최대 Lv.${state.progression.heroLimits?.level||50} · 성급 최대 ${state.progression.heroLimits?.stars||5}성</p><p class="hero-range">${HERO_RANGE(v.id)>.2?'🔫 원거리 · 총병과 같은 사거리':'🔱 근접 · 창병과 같은 사거리'}</p>${v.stats?`<div class="gridstats"><div class="statbox"><small>체력</small><strong>${number(v.stats.hp)}</strong></div><div class="statbox"><small>공격력</small><strong>${number(v.stats.damage)}</strong></div><div class="statbox"><small>공격 속도</small><strong>${v.stats.interval}초</strong></div></div>`:''}<h3>${h(v.skill)}</h3><p>${h(v.description)}</p><p>적과 교전 시 자동 발동 · 재사용 ${v.stats?.cooldown||12}초</p></div></div>${v.star?`<div class="hero-xp-wallet"><b><img class="book-inline" src="assets/book-${rarityOf(v.id)}.webp" alt=""> ${gradeName(rarityOf(v.id))} 교본 ${number(g.inventory[rarityOf(v.id)+'HeroXp'])} XP</b><span>전용 경험치 ${number(v.xp||0)} XP</span></div><p class="growth-help">레벨·성급 강화로 체력과 공격력이 올라갑니다. 공격 속도와 스킬 효과는 유지됩니다.</p><div class="hero-upgrade-options">${heroUpgradeCard(v,'level')}${heroUpgradeCard(v,'star')}</div><button class="btn btn-outline btn-wide" data-hero-action="defense" data-id="${id}" ${v.busy?'disabled':''}>${g.defenseHero===id?'✓ 센터 방어 편성 중':'센터 방어에 편성'}</button>`:`<div class="shard-progress">${puzzleMarkup(v.id)}<span>전용 조각 ${v.shards} / 10${v.shards>=10?' · 해금 가능':''}</span></div><button class="btn btn-gold btn-wide ${v.shards>=10?'can-upgrade':''}" data-hero-action="unlock" data-id="${id}" ${v.shards<10?'disabled':''}>조각 10개로 파트장 해금</button><p class="growth-help">완성본을 중복으로 획득하면 전용 조각 10개로 전환됩니다.</p>`}<button class="btn btn-outline btn-wide" style="margin-top:12px" data-heroes>파트장 목록</button>`);$('modalContent').scrollTop=0;}
function openRecruitment(pulls){if(isTDWorld(state)){showModal(modalHead('파트장 모집')+recruitmentShopMarkup().split('<h3 class="ticket-shop-heading">')[0]);if(pulls)showRecruitResults(pulls);return;}closeModal();shopGroup='recruit';setTab('shop');if(pulls)showRecruitResults(pulls);}

function openExplore(){if(isTDWorld(state)){closeModal();setTab('war');return;}marchContext='explore';const g=state.me.game,j=g.exploration,limit=state.progression.exploreDailyLimit??5;warCount=Math.max(1,Math.min(warCount,g.troops||1));showModal(`${modalHead('🧭 탐사전')}${expeditionIntro('explore')}${j?`<div class="explore-active"><img src="assets/hero-${j.heroId}.webp" alt="탐사 파트장"><h3>${h(j.name)}</h3><p>사원 ${j.amount}명 · ${h(FORMATIONS.find(f=>f.id===j.formation?.preset)?.name||'기본 편성')}</p><b data-live-end="${j.endAt}">${timeLeft(j.endAt-serverNow())}</b><p>${rewardText(j.reward)}${j.shards?' · 편성 파트장 조각 '+j.shards:''}</p><button class="btn btn-gold btn-wide" data-explore-claim ${j.endAt>serverNow()?'disabled':''}>${j.endAt>serverNow()?'탐사 진행 중':'보상 수령 · 전원 귀환'}</button></div>`:`${heroPicker()}${troopPicker()}<p class="explore-limit">오늘 탐사 ${g.exploreDaily.count}/${limit} · 전원 귀환</p><p class="supply-notice">교본은 편성 파트장의 등급에 맞춰, 조각은 편성한 파트장의 전용 조각으로 지급됩니다.</p>${state.progression.explorations.map(m=>`<div class="mission-card"><h3>${h(m.name)}</h3><b>${timeLeft(m.seconds*1000)} · 최소 사원 ${m.minTroops}명</b><p>📦 박스 ${number(m.boxes)} · 편성 등급 교본 ${m.xp} XP · 일반 모집권 ${m.ticket}장${m.rareTicket?' · 희귀 모집권 '+m.rareTicket+'장':''}${m.shards?' · 편성 파트장 조각 '+m.shards+'개':''}</p><button class="btn btn-gold btn-wide" data-explore-start="${m.id}" data-min-troops="${m.minTroops}" ${!warHero||warCount<m.minTroops||g.troops<m.minTroops||g.exploreDaily.count>=limit?'disabled':''}>탐사 출발</button></div>`).join('')}`}`);}

function attendanceMarkup(){const a={...state.progression.attendance,claimable:attendanceReadyCount(state.progression,serverNow())>0};return `<div class="attendance-title"><h3>7일 출석하고 지게차를 타자!</h3><p>누적 출석 · 빠진 날에도 기록이 유지돼요</p></div><div class="attendance-grid">${a.rewards.map((r,i)=>`<div class="attendance-day ${i===6?'last-day':''} ${i<a.claimed?'claimed':''}"><b>${i+1}일차</b>${i===6?'<img class="attendance-forklift" src="assets/forklift-cute.webp" alt="지게차 7일 이용권">':`<span>${i<a.claimed?'✓':'🎁'}</span>`}<small>${rewardText(r)}</small>${i===a.claimed?`<button data-attendance class="btn btn-gold" ${!a.claimable?'disabled':''}>${a.claimable?'받기':'내일 만나요'}</button>`:i<a.claimed?'<strong>수령 완료</strong>':''}</div>`).join('')}</div><p class="pool-disclosure">한국시간 자정 기준 하루 한 번 수령합니다. 지게차 이용권은 창고에 보관되며 사용한 순간부터 7일간 적용됩니다.</p>`;}
function openEvents(page=eventsPage){eventsPage=page==='workbook'?'workbook':'attendance';const q=state.progression.quests.filter(v=>v.ready&&!v.claimed).length,a=attendanceReadyCount(state.progression,serverNow());showModal(`${modalHead('🎁 이벤트')}<div class="category-tabs event-tabs"><button class="btn ${eventsPage==='attendance'?'btn-gold':'btn-outline'}" data-events-page="attendance">7일 출석${a?' · '+a:''}</button><button class="btn ${eventsPage==='workbook'?'btn-gold':'btn-outline'}" data-events-page="workbook">업무수첩${q?' · '+q:''}</button></div>${eventsPage==='workbook'?workbookMarkup():attendanceMarkup()}`);}


function inventoryMarkup(){return warehouseItemsMarkup();}

function openForklift(){const g=state.me.game,active=g.forklift.permanent||g.forklift.until>serverNow();showModal(`${modalHead('지게차 배치')}<div class="inventory-card"><img src="assets/forklift-cute.webp" alt="지게차"><p>${active?'일용직 1명에게 탑승시켜 주세요.':'보유한 지게차 이용권을 사용해 주세요. 7일권은 출석 보상으로 받을 수 있어요.'}</p>${active?g.workers.filter(w=>!w.parked).map(w=>`<button class="btn btn-gold btn-wide" data-equip-forklift="${w.id}">Lv.${w.level} 일용직 ${g.forklift.workerId===w.id?'✓ 탑승 중':'탑승'}</button>`).join(''):''}${g.forklift.workerId?'<button class="btn btn-outline" data-equip-forklift="">내리기</button>':''}<button class="btn btn-outline btn-wide" data-inventory>이용권 확인</button></div>`);}
function maybeEventPopup(){if(updateNoticeController?.maybe())return;if(!state?.me.game.patchRewards?.[PATCH_ID]&&patchNoticeController?.maybe())return;if(!state||showOnboard||isTrainingActive()||(state.me.game.onboarding&&!state.me.game.onboarding.acknowledged)||animation||recruiting||popupPending||!$('modalOverlay').classList.contains('hidden'))return;const a=state.progression?.attendance,today=new Date(serverNow()+9*3600000).toISOString().slice(0,10);if(a?.claimable&&a.popupDay!==today){popupPending=true;a.popupDay=today;openEvents('attendance');api('/api/action','POST',{type:'event/popup',requestId:crypto.randomUUID()}).finally(()=>popupPending=false);}}
function handleV17Button(b){
 const d=b.dataset;
 if(d.ticketStep||d.ticketCount){const form=$('ticketPurchaseForm');if(!form)return true;const item=state.shopItems.find(v=>v.id===form.dataset.item),input=$('ticketQuantity'),max=Math.min(1000,Math.floor(state.me.game.boxes/item.price));input.value=d.ticketCount?(d.ticketCount==='max'?Math.max(1,max):Number(d.ticketCount)):Math.max(1,Math.min(1000,(Number(input.value)||1)+Number(d.ticketStep)));updateTicketTotal();return true;}
 if(d.raidCancel!==undefined){pendingRaidRequest=null;openWarChooser();return true;}if(d.raidConfirm!==undefined){const request=pendingRaidRequest;if(request){pendingRaidRequest=null;closeModal();doAction('battle/start',{...request,confirmShieldBreak:true});}return true;}if(d.notices!==undefined){openNotice();return true;}if(d.copySupport!==undefined){copySupportAccount(b);return true;}
 if(d.readyHero){$('recruitOverlay').classList.add('hidden');recruiting=false;recruitReady=null;openHero(d.readyHero);return true;}if(d.recruitReveal!==undefined){if(recruitReady)showRecruitResults(recruitReady.pulls);return true;}if(d.recruitClose!==undefined){$('recruitOverlay').classList.add('hidden');recruiting=false;recruitReady=null;if(selectedTab==='shop')renderShop();maybeUnlockPopup();return true;}
 if(d.releaseArea){confirmReleaseArea(d.releaseArea);return true;}if(d.releaseCancel!==undefined){openWarChooser();return true;}if(d.releaseConfirm){b.disabled=true;doAction('territory/release',{areaId:d.releaseConfirm}).then(r=>{if(r)openWarChooser();else b.disabled=false;});return true;}if(d.chatExpand!==undefined){rememberChatPosition();const position=chatPosition();chatExpanded=!chatExpanded;render();const list=document.querySelector('.chat-list');if(position&&list)restoreChatPosition(list,position.atBottom?{kind:'bottom'}:{kind:'anchor',...position});syncChatBadge();rememberChatPosition();return true;}if(d.chatBottom!==undefined){const list=document.querySelector('.chat-list'),seen=Number(localStorage.getItem(chatReadKey()))||0,unread=state.chat.find(m=>Number(m.id)>seen&&m.player_id!==state.me.id);if(list)restoreChatPosition(list,unread?{kind:'unread',id:Number(unread.id)}:{kind:'bottom'});syncChatBadge();rememberChatPosition();return true;}if(d.recruitPool){recruitPool=d.recruitPool;if(isTDWorld(state))openRecruitment();else renderShop();return true;}if(d.serverPage){rememberChatPosition();chatResumePending=true;serverPage=d.serverPage;chatExpanded=false;render();return true;}if(d.useXp!==undefined){openXpHeroes(d.useXp||'normal');return true;}if(d.eventsPage){openEvents(d.eventsPage);return true;}if(d.events!==undefined){openEvents();return true;}if(d.workbook!==undefined){openWorkbook();return true;}if(d.warehousePage){openWarehouse(d.warehousePage);return true;}if(d.heroes!==undefined){openHeroes();return true;}if(d.heroDetail){openHero(d.heroDetail);return true;}if(d.recruitment!==undefined){openRecruitment();return true;}if(d.explore!==undefined){warCount=Math.max(1,Math.min(warCount,state.me.game.troops));openExplore();return true;}if(d.forklift!==undefined){openForklift();return true;}if(d.inventory!==undefined){openWarehouse();return true;}if(d.marchHero){warHero=d.marchHero;refreshMarch();return true;}if(d.formation){warFormation=d.formation;refreshMarch();return true;}if(d.marchFraction){warCount=Math.max(1,Math.floor(state.me.game.troops*Number(d.marchFraction)));refreshMarch();return true;}if(d.marchAdjust){warCount=Math.max(1,Math.min(state.me.game.troops||1,warCount+Number(d.marchAdjust)));refreshMarch();return true;}if(d.recruitRetry!==undefined){const pending=pendingRecruitment();if(pending)startRecruitment(pending.pool,pending.count);return true;}if(d.recruitRecent!==undefined){showRecruitResults(state.me.game.lastRecruitment?.pulls||[]);return true;}
 if(d.manageNotice!==undefined){openDeveloperNotice();return true;}if(d.tdPowerMatrix!==undefined){closeModal();openTDPanel('matrix');return true;}if(d.powerDetails!==undefined){openPowerDetails();return true;}if(d.unitStats){openUnitStats(d.unitStats);return true;}if(d.raidRules!==undefined){raidRulesOpen=!raidRulesOpen;renderWar();return true;}if(d.combatGroup){combatGroup=d.combatGroup;renderCenter();return true;}if(d.researchGroup){researchGroup=d.researchGroup;renderCenter();return true;}if(d.shopGroup){shopGroup=d.shopGroup;renderShop();return true;}
 let type,params={},after;
 if(d.attendance!==undefined){type='event/attendance';after=()=>{if(!$('modalOverlay').classList.contains('hidden')&&$('modalContent').classList.contains('modal-attendance'))openEvents('attendance');};}
 else if(d.claimQuest){type='quest/claim';params={quest:d.claimQuest};after=()=>d.claimQuest==='starter'?openHeroes():openWorkbook();}
 else if(d.heroAction){type='hero/'+d.heroAction;params={hero:d.id};after=r=>openHero(d.id,r.heroUpgrade);}
 else if(d.draw){startRecruitment(d.draw,Number(d.count));return true;}
 else if(d.exploreStart){type='explore/start';params={mission:d.exploreStart,hero:warHero,amount:warCount,formation:warFormation};after=openExplore;}
 else if(d.exploreClaim!==undefined){type='explore/claim';after=openExplore;}
 else if(d.activateForklift!==undefined){type='forklift/activate';params={item:d.supplyItem||'forkliftTickets'};after=()=>openWarehouse();}
 else if(d.equipForklift!==undefined){type='forklift/equip';params={worker:d.equipForklift};after=openForklift;}
 else if(d.researchAid){type=isTDWorld(state)?'td/speed':'item/research';params={job:d.researchAid,item:d.supplyItem||'researchAid'};after=()=>openWarehouse();}
 else if(d.useShield){type='item/shield';params={item:d.useShield};after=()=>openWarehouse();}
 else if(d.bossPass){type='boss/pass';params={item:d.bossPass};after=()=>openWarehouse();}
 else if(d.useBoost){type='item/boost';params={item:d.useBoost};after=()=>openWarehouse();}
 else if(d.heal!==undefined){type='item/heal';after=()=>openWarehouse();}
 if(type){b.disabled=true;doAction(type,params).then(r=>{if(r)after?.(r);else b.disabled=false;});return true;}return false;
}

function syncMasterForm(){const master=authMode==='login'&&$('nickField').value.trim().toLowerCase()==='master';$('worldField').required=!master;$('worldField').closest('form').classList.toggle('master-login',master);if(master)$('worldField').value='';}
async function loadAdmin(){try{adminState=await api('/api/admin/state');state=null;$('auth').classList.add('hidden');$('app').classList.add('hidden');$('adminApp').classList.remove('hidden');renderAdmin();}catch(e){localStorage.removeItem(ADMIN_KEY);$('adminApp').classList.add('hidden');$('auth').classList.remove('hidden');toast(e.message,true);}}
function renderAdmin(){const a=adminState;$('adminApp').innerHTML=`<div class="admin-header"><h2>센터 운영 관리</h2><button class="btn btn-outline" data-admin-logout>로그아웃</button></div><p>관리자 관찰 · 일반 유저 목록과 랭킹에 표시되지 않습니다.</p><div class="admin-layout"><div class="card"><h3>서버 목록</h3>${a.servers.map(s=>`<button class="btn ${s.world===a.world?'btn-gold':'btn-outline'} btn-wide" data-admin-world="${h(s.world)}">${h(s.world)} · ${s.players}명</button>`).join('')}</div><div class="card"><h3>${h(a.world||'서버를 선택하세요')}</h3>${a.world?`<div class="admin-users">${a.players.map(p=>`<div class="admin-user"><b>${h(p.nickname)}</b><span>${p.suspended?'정지 중':'이용 중'}</span><button class="btn btn-outline" data-admin-action="${p.suspended?'resume':'suspend'}" data-id="${p.id}">${p.suspended?'해제':'정지'}</button><button class="btn btn-outline" data-admin-confirm="deletePlayer" data-id="${p.id}" data-name="${h(p.nickname)}">계정 삭제</button></div>`).join('')}</div><button class="btn btn-danger btn-wide" data-admin-confirm="deleteWorld" data-name="${h(a.world)}">이 서버 전체 삭제</button>`:''}</div></div><div class="card"><h3>관리 이력</h3>${a.audit.map(j=>`<div class="statrow"><span>${h(j.world)} · ${h(j.action)}</span><small>${new Date(Number(j.at)).toLocaleString('ko-KR')}</small></div>`).join('')}</div>`;}
function handleAdminButton(b){const d=b.dataset;if(d.adminLogout!==undefined){api('/api/admin/logout','POST',{}).finally(()=>{localStorage.removeItem(ADMIN_KEY);location.reload();});return true;}if(d.adminWorld){api('/api/admin/select','POST',{world:d.adminWorld}).then(loadAdmin).catch(e=>toast(e.message,true));return true;}if(d.adminConfirm){showModal(`${modalHead(d.adminConfirm==='deleteWorld'?'서버 전체 삭제':'계정 삭제')}<p><strong>${h(d.name)}</strong> 삭제는 되돌릴 수 없습니다. 대상 이름을 정확히 입력해 주세요.</p><input id="adminConfirmText" autocomplete="off" aria-label="삭제 대상 이름 확인"><button class="btn btn-danger btn-wide" data-admin-action="${d.adminConfirm}" data-id="${d.id||''}">삭제 실행</button>`);return true;}if(d.adminAction){b.disabled=true;api('/api/admin/moderate','POST',{action:d.adminAction,world:adminState.world,target:d.id,confirm:$('adminConfirmText')?.value||''}).then(()=>{closeModal();loadAdmin();}).catch(e=>{toast(e.message,true);b.disabled=false;});return true;}if(adminState&&d.close!==undefined){closeModal();return true;}return false;}

function workerTargetRate(w,g,idx){return miningTargetRate(w,g,idx,serverNow());}

function puzzleMarkup(id){return `<span class="puzzle-token"><img class="puzzle-piece" src="assets/puzzle-fragment.webp" alt="파트장 퍼즐 조각"><img class="puzzle-identity" src="assets/hero-${h(id)}.webp" alt=""></span>`;}
function troopPicker(){const available=state.me.game.troops;warCount=available?Math.max(1,Math.min(warCount,available)):0;return `<section class="march-troops"><div class="statrow"><h3>출정 사원</h3><strong id="warCountView">${warCount} / ${available}명</strong></div><div class="march-amount"><button class="btn btn-outline" data-march-adjust="-1" aria-label="출정 사원 1명 줄이기" ${!available?'disabled':''}>−</button><input id="warAmount" type="number" inputmode="numeric" aria-label="출정 사원 수" min="1" max="${available||1}" value="${warCount}" ${!available?'disabled':''}><button class="btn btn-outline" data-march-adjust="1" aria-label="출정 사원 1명 늘리기" ${!available?'disabled':''}>＋</button></div><input id="warSlider" aria-label="출정 인원 조절" type="range" min="1" max="${available||1}" value="${warCount||1}" ${!available?'disabled':''}><div class="march-fractions">${[[.25,'25%'],[.5,'50%'],[.75,'75%'],[1,'전체']].map(([value,label])=>`<button class="btn btn-outline" data-march-fraction="${value}" ${!available?'disabled':''}>${label}</button>`).join('')}</div>${marchPowerMarkup()}<h3>자동 편성 · 총병 / 창병 / 방패병</h3><div class="formation-grid">${FORMATIONS.map(f=>{const roster=buildFormation(warCount,f.id);return `<button class="formation-card ${warFormation===f.id?'chosen':''}" data-formation="${f.id}" aria-pressed="${warFormation===f.id}"><span class="formation-sprites" aria-hidden="true"><i class="ranged"></i><i class="spear"></i><i class="shield"></i></span><strong>${f.name}</strong><span class="formation-counts" data-formation-preview="${f.id}">${formationCountText(roster.roles)}</span>${warFormation===f.id?'<b class="chosen-check">✓</b>':''}</button>`;}).join('')}</div><p class="march-caption">방패병이 앞열, 창병이 중열, 총병이 뒷열로 진격합니다. 앞열부터 피해를 받으며 총병은 긴 사거리에서 공격합니다.</p></section>`;}
function formationCountText(roles){return TROOP_ROLES.map(r=>`${r.name} ${number(roles[r.id]||0)}`).join(' · ');}
function selectedMarchPower(){const hero=state.progression.heroes.find(v=>v.id===warHero&&v.star&&!v.busy);return marchPower(state.unitStats,hero?.stats,warCount,formationFactors(buildFormation(warCount,warFormation),state.unitStats.classes));}
function marchPowerMarkup(){const hero=state.progression.heroes.find(v=>v.id===warHero);return `<div class="march-power"><span>출정 병력 전투력</span><strong data-march-power>${number(selectedMarchPower())}</strong><small data-march-summary>${h(hero?.name||'파트장 선택 전')} · 사원 ${warCount}명</small></div>`;}
function ownedTerritoriesMarkup(){const owned=(state.territories||[]).filter(v=>v.mine);return `<section class="owned-territories"><h3>내 정복지 ${owned.length} / ${state.territoryCap}</h3>${owned.map(v=>`<div class="owned-area"><div><strong>${h(v.name)}</strong><small>시간당 ${h(territoryRewardText(v))}</small><p class="garrison-status">주둔 ${number(v.troops)}명 · ${h(state.progression.heroes.find(x=>x.id===v.heroId)?.name||'파트장 미편성')}</p><small>주둔 사원은 출정 불가 · 파트장은 약탈·탐사 가능</small></div><button class="btn btn-outline" data-release-area="${v.id}" ${v.busy||state.me.game.pendingBattle?'disabled':''}>포기</button></div>`).join('')||'<p>보유한 정복지가 없습니다.</p>'}</section>`;}
function confirmReleaseArea(id){const v=state.territories.find(v=>v.id===id&&v.mine);if(!v)return;showModal(`${modalHead('정복지 포기')}<div class="release-confirm"><h3>${h(v.name)}</h3><p>포기하면 주둔 사원 ${number(v.troops)}명이 센터로 복귀하고, 이곳의 시간당 수입이 중단됩니다. 중립지대가 되어 다시 보유하려면 정복전을 치러야 합니다.</p><button class="btn btn-danger btn-wide" data-release-confirm="${v.id}">정복지 포기하기</button><button class="btn btn-outline btn-wide" data-release-cancel>돌아가기</button></div>`);}
function refreshMarch(){const scroll=$('modalContent').scrollTop;if(marchContext==='explore')openExplore();else openWarChooser();$('modalContent').scrollTop=scroll;}
function updateMarchCounts(){const available=state?.me.game.troops||0;warCount=available?Math.max(1,Math.min(warCount,available)):0;document.querySelectorAll('[data-march-power]').forEach(el=>el.textContent=number(selectedMarchPower()));document.querySelectorAll('[data-march-summary]').forEach(el=>el.textContent=(state.progression.heroes.find(v=>v.id===warHero)?.name||'파트장 선택 전')+' · 사원 '+warCount+'명');if($('warCountView'))$('warCountView').textContent=warCount+' / '+available+'명';if($('warAmount'))$('warAmount').value=warCount;document.querySelectorAll('[data-formation-preview]').forEach(el=>el.textContent=formationCountText(buildFormation(warCount,el.dataset.formationPreview).roles));document.querySelectorAll('[data-explore-start]').forEach(el=>el.disabled=!warHero||warCount<Number(el.dataset.minTroops)||state.me.game.exploreDaily.count>=(state.progression.exploreDailyLimit??5));}
document.addEventListener('change',e=>{if(e.target.id==='warAmount'){const count=Number(e.target.value);if(Number.isSafeInteger(count)){warCount=count;refreshMarch();}}});
function workbookMarkup(){return `<div class="workbook-intro"><h3>센터장의 첫걸음</h3><span>${state.progression.quests.filter(q=>q.claimed).length} / ${state.progression.quests.length} 완료</span></div>${state.progression.quests.map(q=>`<div class="mission-card"><h3>${h(q.name)}</h3><p>${q.description||rewardText(q.reward)}</p><button class="btn btn-gold" data-claim-quest="${q.id}" ${!q.ready||q.claimed?'disabled':''}>${q.claimed?'수령 완료':q.ready?'보상 받기':'진행 중'}</button></div>`).join('')}`;}
function openWorkbook(){openEvents('workbook');}
function openWarehouse(page=warehousePage){warehousePage=page;showModal(`${modalHead('📦 내 창고')}<div class="warehouse-art" role="img" aria-label="센터 창고"></div><div class="category-tabs"><button class="btn ${page==='items'?'btn-gold':'btn-outline'}" data-warehouse-page="items">보급품</button><button class="btn ${page==='shards'?'btn-gold':'btn-outline'}" data-warehouse-page="shards">파트장 조각</button></div>${page==='shards'?`<div class="warehouse-shards">${state.progression.heroes.filter(v=>v.shards>0).map(v=>`<button class="warehouse-shard" data-hero-detail="${v.id}">${puzzleMarkup(v.id)}<strong>${h(v.name)}</strong><b>${number(v.shards)}조각</b>${!v.star&&v.shards>=10?'<span class="hero-ready">해금 가능</span>':''}</button>`).join('')||'<p class="empty-storage">보유한 파트장 조각이 없습니다.</p>'}</div>`:warehouseItemsMarkup()}`);}
function warehouseItemsMarkup(){const g=state.me.game,inv=g.inventory,researchJobs=isTDWorld(state)?state.td.growth.researchJobs:g.upgrades;return `<div class="warehouse-item-grid"><button class="stored-item" data-recruitment><img src="assets/ticket-normal.webp" alt="일반 모집권"><strong>일반 모집권</strong><b>${inv.normalTickets}장</b></button><button class="stored-item" data-recruitment><img src="assets/ticket-rare.webp" alt="희귀 모집권"><strong>희귀 모집권</strong><b>${inv.rareTickets}장</b></button>${['normal','rare'].map(grade=>`<button class="stored-item" data-use-xp="${grade}"><img src="assets/${'book-'+grade}.webp" alt="경험치 교본"><strong>${gradeName(grade)} 경험치 교본</strong><b>${number(inv[grade+'HeroXp'])} XP</b><small>${gradeName(grade)} 파트장 레벨 강화</small></button>`).join('')}</div>${FORKLIFT_PASSES.map(p=>`<div class="inventory-card"><img src="assets/forklift-cute.webp" alt="지게차"><h3>지게차 ${p.label} 이용권 · ${number(inv[p.key]||0)}장</h3><button class="btn btn-gold btn-wide" data-activate-forklift data-supply-item="${p.key}" ${!inv[p.key]?'disabled':''}>사용 · ${p.label} 연장</button></div>`).join('')}${RESEARCH_PASSES.map(p=>[p.key,p.label]).map(([key,label])=>`<div class="inventory-card supply-card"><img src="assets/research-voucher.webp" alt="연구 단축권"><h3>연구 ${label} 단축권 · ${number(inv[key])}장</h3>${researchJobs.map(j=>`<button class="btn btn-outline btn-wide" data-research-aid="${j.id}" data-supply-item="${key}" ${!inv[key]?'disabled':''}>${h(j.kind==='force'?({army:'육군',air:'공군',navy:'해군'})[j.item]:j.kind==='capacity'?'수용 한도':UPGRADES.find(v=>v.key===(j.item||j.key))?.name||'연구')} 단축</button>`).join('')||'<p>진행 중인 연구가 없습니다.</p>'}</div>`).join('')}${BOOST_PASSES.map(p=>`<div class="inventory-card supply-card"><span class="supply-item-icon" aria-hidden="true">⚡</span><h3>채굴 2배 가속 ${p.label}권 · ${number(inv[p.key]||0)}장</h3><button class="btn btn-gold" data-use-boost="${p.key}" ${!inv[p.key]?'disabled':''}>사용 · ${p.label} 가속</button></div>`).join('')}${autoPassMarkup()}${shieldStorageMarkup()}<div class="inventory-card supply-card"><img src="assets/medical-kit.webp" alt="사원 치료권"><h3>사원 치료권 · ${inv.healAid}장</h3><button class="btn btn-outline" data-heal ${!inv.healAid||!g.wounded.length?'disabled':''}>회복 중 사원 전원 치료</button></div>`;}
function recruitmentShopMarkup(){const g=state.me.game,pool=recruitPool,rare=pool==='rare',tickets=g.inventory[pool+'Tickets'];return `${pendingRecruitment()?'<button class="btn btn-gold btn-wide" data-recruit-retry>중단된 모집 결과 확인</button>':''}<div class="category-tabs recruit-tabs">${['normal','rare'].map(id=>`<button class="btn ${pool===id?'btn-gold':'btn-outline'}" data-recruit-pool="${id}">${gradeName(id)} 모집</button>`).join('')}</div><div class="recruitment-pools"><section class="illustrated-pool ${pool}"><div class="recruit-scene"><img src="assets/recruit-${pool}.webp" alt="${gradeName(pool)} 파트장 모집실"><h3>${gradeName(pool)} 파트장 모집</h3></div><div class="pool-controls"><div class="pool-ticket-count"><img src="assets/ticket-${pool}.webp" alt="모집권"><strong>${number(tickets)}장 보유</strong>${rare?`<span>희귀 확정 ${g.recruitPity}/30</span>`:''}</div>${recruitQuantityMarkup(pool,tickets,recruitUseCounts[pool],recruiting)}<details class="pool-rates" data-pool-rates="${pool}" ${shopDisclosure[pool]?'open':''}><summary>모집 확률·보상 안내</summary><p>${state.progression.recruitment.pools[pool].rates.map(r=>h(r.label)+' '+r.percent+'%').join(' · ')}</p><p>같은 등급 내 파트장 등장 확률은 같습니다. 중복 완성본은 전용 조각 10개로 전환됩니다. 교본은 창고에 보관됩니다.</p>${rare?'<p>위 확률은 기본 확률입니다. 30회 이내 희귀 완성본 확정 · 희귀 완성본 획득 시 확정 횟수 초기화</p>':''}</details></div></section></div>${g.lastRecruitment?'<button class="btn btn-outline btn-wide" data-recruit-recent>최근 모집 결과 다시 보기</button>':''}<h3 class="ticket-shop-heading">모집권 구매</h3><p class="supply-notice">모집권은 택배 박스로 구매합니다. 구매한 모집권은 창고에 보관됩니다.</p>`;}
function rewardCard(p,index=0){const def=state.progression.heroes.find(h=>h.id===p.hero),kind=p.kind||(p.shards?'shards':p.whole?'hero':'xp');let art,title,detail;
 if(kind==='shards'){art=puzzleMarkup(p.hero);title=p.duplicate?'중복 완성본 → 조각 10개':'파트장 조각';detail=(def?.name||'파트장')+' +'+p.shards+'조각';}
 else if(kind==='hero'){art=`<img class="recruit-reward-portrait" src="assets/hero-${p.hero}.webp" alt="${h(def?.name)}">`;title='새 파트장 합류!';detail=def?.name||'';}
 else {const grade=p.bookRarity||p.rarity||'normal';art=`<img class="recruit-reward-item" src="assets/book-${grade}.webp" alt="경험치 교본">`;title=gradeName(grade)+' 경험치 교본';detail='창고 보관 +'+p.xp+' XP';}
 return `<article class="recruit-reward ${kind}" style="--reward-delay:${Math.min(index,11)*.05}s">${art}<strong>${title}</strong><span>${h(detail)}</span></article>`;
}
async function startRecruitment(pool,count){
 if(recruiting||!state)return;if(!pendingRecruitment()&&!recruitQuote(state.me.game.inventory[pool+'Tickets'],count).valid){toast('보유한 모집권 범위에서 1~1,000장의 정수를 입력해 주세요.',true);return;}recruiting=true;recruitReady=null;closeModal();const actor=state.me.id,key='ka_recruit_pending_'+actor;
 let pending;try{pending=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
 const request=pending||{pool,count,requestId:crypto.randomUUID()};sessionStorage.setItem(key,JSON.stringify(request));
 const el=$('recruitOverlay');el.className='recruit-overlay opening';el.innerHTML=`<div class="recruit-cinematic ${request.pool}"><img src="assets/recruit-${request.pool}.webp" alt="모집 연출"><div class="summon-rays"></div><div class="summon-sparkles">✦ ✧ ✦</div><div class="summon-caption"><h2>${request.pool==='rare'?'희귀':'일반'} 파트장 모집</h2><p id="summonStatus">새로운 동료를 기다리는 중…</p><button class="btn btn-gold" data-recruit-reveal disabled>모집 중…</button></div></div>`;
 const start=performance.now();
 try{const out=await api('/api/action','POST',{type:'hero/recruit',...request});sessionStorage.removeItem(key);await loadState({silent:true,resumeBattle:false});recruitReady=out;const delay=Math.max(0,1800-(performance.now()-start));setTimeout(()=>{if(recruitReady!==out)return;const b=el.querySelector('[data-recruit-reveal]');if(b){b.disabled=false;b.textContent='결과 확인';}if($('summonStatus'))$('summonStatus').textContent='모집이 완료되었습니다!';el.classList.add('ready');},delay);
 }catch(e){const uncertain=!e.status||e.status>=500;if(!uncertain)sessionStorage.removeItem(key);el.classList.add('hidden');recruiting=false;toast(e.message+(uncertain?' 중단된 모집 결과 확인을 눌러 다시 확인해 주세요.':''),true);renderShop();}
}
function showRecruitResults(pulls){if(!pulls?.length)return;recruiting=true;const el=$('recruitOverlay');el.className='recruit-overlay results';el.innerHTML=`<div class="recruit-results-panel"><h2>모집 결과 · ${pulls.length}회</h2><div class="recruit-reward-grid ${pulls.length===1?'single':''}">${(pulls.length>20?summarizeRecruitPulls(pulls):pulls).map((p,i)=>rewardCard(p,i).replace('</article>',p.count?'<small>'+p.count+'회 결과 합산</small></article>':'</article>')).join('')}</div>${unlockReadyMarkup(unlockReadyHeroes(state.progression.heroes))}<button class="btn btn-gold btn-wide" data-recruit-close>확인</button></div>`;markUnlockSeen(unlockReadyHeroes(state.progression.heroes));}

function pendingRecruitment(){try{return state?JSON.parse(sessionStorage.getItem('ka_recruit_pending_'+state.me.id)||'null'):null;}catch{return null;}}

function openTicketPurchase(id){const item=state.shopItems.find(v=>v.id===id);if(!item)return;showModal(`${modalHead(h(item.name)+' 구매')}<form id="ticketPurchaseForm" class="ticket-purchase" data-item="${id}">${shopVisual(item,shopArt(item))}<p>1장 · 📦 ${number(item.price)} · 보유 📦 ${number(state.me.game.boxes)}</p><label for="ticketQuantity">구매 수량</label><div class="ticket-quantity-controls"><button class="btn btn-outline" type="button" data-ticket-step="-1" aria-label="모집권 수량 1장 줄이기">−</button><input id="ticketQuantity" type="number" inputmode="numeric" min="1" max="1000" step="1" value="1" required><button class="btn btn-outline" type="button" data-ticket-step="1" aria-label="모집권 수량 1장 늘리기">+</button></div><div class="ticket-presets">${[1,10,100].map(n=>`<button type="button" class="btn btn-outline" data-ticket-count="${n}">${n}장</button>`).join('')}<button type="button" class="btn btn-outline" data-ticket-count="max">최대</button></div><p class="ticket-total" id="ticketTotal" role="status"></p><p class="growth-help">한 번에 최대 1,000장까지 구매할 수 있어요.</p><button type="submit" class="btn btn-gold btn-wide">구매하기</button></form>`);updateTicketTotal();}
function updateTicketTotal(){const form=$('ticketPurchaseForm');if(!form)return;const item=state.shopItems.find(v=>v.id===form.dataset.item),quantity=Number($('ticketQuantity').value),valid=Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=1000,total=valid?quantity*item.price:0,afford=valid&&state.me.game.boxes>=total;form.querySelector('[type="submit"]').disabled=!afford||shopPurchasing||!!pendingShopPurchase();$('ticketTotal').textContent=!valid?'수량을 1~1,000장 사이의 정수로 입력하세요.':`${number(quantity)}장 · 합계 📦 ${number(total)}${afford?'':' · 박스가 부족해요.'}`;}
function pendingShopPurchase(){try{return state?JSON.parse(sessionStorage.getItem('ka_shop_pending_'+state.me.id)||'null'):null;}catch{return null;}}
function shopVisual(item,art=shopArt(item)){return item.icon?`<span class="supply-item-icon" role="img" aria-label="${h(item.name)}">${h(item.icon)}</span>`:`<img src="assets/${art}.webp" alt="${h(item.name)}">`;}
function shopArt(item){return {normalTicket:'ticket-normal',rareTicket:'ticket-rare',researchAid:'research-voucher',healAid:'medical-kit'}[item.id]||item.image||SHOP_DETAILS[item.id]?.image||'panel-shop';}
async function purchaseShopItem(itemId,quantity=1){
 if(!state||shopPurchasing)return;
 const key='ka_shop_pending_'+state.me.id,request=pendingShopPurchase()||{item:itemId,quantity,requestId:crypto.randomUUID()};
 const item=state.shopItems.find(i=>i.id===request.item);if(!item)return;
 sessionStorage.setItem(key,JSON.stringify(request));shopPurchasing=true;renderShop();
 try{
  const result=await api('/api/action','POST',{type:'shop/buy',...request});
  sessionStorage.removeItem(key);await loadState({silent:true,resumeBattle:false});
  closeModal();showModal(`${modalHead('구매 완료')}<div class="purchase-success" role="status"><div class="purchase-check">✓</div>${shopVisual(item,shopArt(item))}<h3>${h(item.name)}${result.receipt?.quantity>1?' × '+number(result.receipt.quantity):''}</h3><p>${item.permanent?'센터 설비에 적용되었습니다.':item.id==='boost'?'채굴 가속이 적용되었습니다.':'창고에 보관되었습니다.'}</p>${result.receipt?`<b>${result.receipt.currency==='boxes'?'📦':'💰'} ${number(result.receipt.price)}</b>`:'<p>저장된 구매 결과를 확인했습니다.</p>'}<button class="btn btn-gold btn-wide" data-close>확인</button></div>`);
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
let lastMinerPaint=0,minerAnimationTime=0;function animateMiners(now){requestAnimationFrame(animateMiners);if(document.hidden||selectedTab!=='mine'||!state||now-lastMinerPaint<1000/30)return;const g=miningView(),workerMap=new Map(g.workers.map(w=>[w.id,w]));minerAnimationTime+=Math.min(.1,lastMinerPaint?(now-lastMinerPaint)/1000:0)*miningMultiplier(g,serverNow());lastMinerPaint=now;for(const canvas of document.querySelectorAll('[data-miner-motion]')){const w=workerMap.get(canvas.dataset.minerMotion);if(!w)continue;const forklift=g.forklift?.workerId===w.id&&(g.forklift.permanent||g.forklift.until>serverNow()),dragging=!!canvas.closest('.dragging,.mine-drag-ghost');paintMiner(canvas,w,{mining:!w.parked&&w.target!==null,forklift,dragging,t:minerAnimationTime});}}
loadSceneAssets().then(()=>{if($('warCanvas'))drawBattle(animation?.current);}).catch(()=>toast('장면 이미지를 불러오지 못했습니다. 새로고침해 주세요.',true));requestAnimationFrame(animateMiners);

function autoPassMarkup(){const g=state.me.game;return `<section class="shield-storage"><h3>자동채굴 이용권</h3><p>${g.shop.auto?'자동채굴 영구 사용 중':g.shop.autoUntil>serverNow()?`남은 시간 <span data-live-end="${g.shop.autoUntil}">${timeLeft(g.shop.autoUntil-serverNow())}</span>`:'보유 이용권을 사용하면 자동채굴이 시작됩니다.'}</p><div class="shield-inventory">${[['autoMine3d','3일'],['autoMine2d','2일'],['autoMine1d','1일'],['autoMine2h','2시간']].map(([id,label])=>`<div class="inventory-card"><span class="supply-item-icon">⚙</span><h4>자동채굴 ${label}권</h4><b>${number(g.inventory[id]||0)}장</b><button class="btn btn-gold" data-boss-pass="${id}" ${!g.inventory[id]?'disabled':''}>사용 · ${label}</button></div>`).join('')}</div><p>사용한 순간부터 시작하며 남아 있는 이용 시간에 추가됩니다.</p><p class="community-note">${AUTO_MINING_NOTE}</p></section>`;}



// TEST uses the existing game shell and tabs; there is no second login or game page.
const originalCloseModal=closeModal;closeModal=()=>{if($('modalContent').querySelector('.combat-patch-notice'))patchNoticeController?.acknowledge();if(tdShownTab==='mine-modal'){tdController?.hide();tdShownTab='';}originalCloseModal();};
document.addEventListener('click',event=>{if(event.target.closest('[data-td-mining-research]')){event.preventDefault();openTDMiningResearch().catch(error=>toast(error.message,true));}});
const integratedRenderMine=renderMine;renderMine=(...args)=>{const result=integratedRenderMine(...args);if(isTDWorld(state)){const map=$('tabMine').querySelector('.mine-map');if(map&&!map.querySelector('[data-td-mining-research]')){const b=document.createElement('button');b.type='button';b.className='td-mining-research';b.dataset.tdMiningResearch='';b.textContent='채굴 연구';map.append(b);}}return result;};
if(requestedWorld==='TEST'){$('worldField').value='TEST';$('loginTab').click();$('auth').classList.add('auth-open');}

document.addEventListener('click',event=>{const b=event.target.closest('[data-td-home]');if(!b||!isTDWorld(state))return;tdWarOpen=true;if(b.dataset.tdHome==='defense'){tdDestination={editor:true,scope:'home'};render();return;}tdDestination={page:'expedition',category:'tower'};render();warMode=b.dataset.tdHome==='conquest'?'conquest':'raid';renderTDTab().then(()=>{if(tdController){tdController.ui.plan.mode=warMode==='conquest'?'conquest':'invasion';tdController.ui.plan.target='';tdController.ui.expDetail=false;tdController.ui.render(false);}});});

function syncRecruitQuantity(value){const input=$('recruitUseCount');if(!input)return;const pool=input.dataset.pool;if(value!==undefined)input.value=value;recruitUseCounts[pool]=Number(input.value);const q=recruitQuote(state.me.game.inventory[pool+'Tickets'],input.value),button=document.querySelector('[data-custom-count]');if(button){button.dataset.count=String(q.count);button.disabled=!q.valid||recruiting;button.textContent=q.valid?q.count+'회 모집':'수량을 확인해 주세요';}}
document.addEventListener('input',e=>{if(e.target.id==='recruitUseCount')syncRecruitQuantity();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-recruit-count]');if(b)syncRecruitQuantity(Number(b.dataset.recruitCount));});
