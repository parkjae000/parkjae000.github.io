/* JAEPARK Casino V12 stability and social table coordination.
 * Virtual chips only. Slot machine ownership is server-verified; payouts are still
 * local demo until every casino title has an authoritative settlement endpoint.
 */
(()=>{
'use strict';
const query=s=>document.querySelector(s);
const SLOT_NAMES=['CRIMSON SEVEN','EMERALD FORTUNE','MIDNIGHT ROYALE'];
const endpoint='https://pgupfypoxhjawtonnzzk.supabase.co/functions/v1/jpc-poker';
const lease={machine:null,owner:false,waiting:false,blockedBy:'',session:null,interval:null,epoch:0,lastError:'',online:false};
const formatted=n=>Math.round(Number(n)||0).toLocaleString('ko-KR');
const hudEl=()=>query('#v12LiveStatus');
let toastTimeout=0;
function toast(message){let node=query('#v12Toast');if(!node){node=document.createElement('div');node.id='v12Toast';node.setAttribute('role','status');document.body.append(node)}node.textContent=message;node.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>node?.classList.remove('show'),3000)}
function showStatus(message,tone='neutral'){
 const current=hudEl();if(current){current.textContent=message;current.dataset.tone=tone;}
 const spin=query('#spinBtn');if(spin){spin.disabled=!!lease.session&&(lease.waiting||!lease.owner)||!!state.slotBusy;spin.setAttribute('aria-label',spin.disabled?'현재 사용할 수 없는 슬롯머신':'슬롯머신 스핀');}
}
function token(){try{return localStorage.getItem('jpc_v10_token')||''}catch{return ''}}
async function call(op,machine){const t=token();if(!t)return null;
 const ctrl=new AbortController();const killer=setTimeout(()=>ctrl.abort(),11000);
 try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'act',token:t,op,machine}),signal:ctrl.signal,cache:'no-store'});
 const data=await response.json();if(!response.ok||data.ok!==true)throw Error(data.error||'슬롯머신 연결 실패');return data.room;
 }finally{clearTimeout(killer)}
}
function ensureBadge(){if(state.activeGame!=='slots')return;let x=query('#v12LiveStatus');if(x)return;const node=query('.v8-slot-disclosure')||query('#v8SlotStatus');if(!node)return;x=document.createElement('div');x.id='v12LiveStatus';x.setAttribute('role','status');x.textContent='온라인 슬롯 자리 확인 중';if(node.classList.contains('v8-slot-disclosure'))node.parentNode.insertBefore(x,node);else node.insertAdjacentElement('afterend',x)}
function appendSlotDebug(){const old=query('#v12SlotReserve');old?.remove();if(state.activeGame!=='slots')return;const node=query('#v12LiveStatus');if(!node)return;const btn=document.createElement('button');btn.id='v12SlotReserve';btn.type='button';btn.textContent=lease.owner?'자리 사용 중':'자리 재확인';btn.disabled=lease.owner;btn.addEventListener('click',()=>acquire(state.slotIndex));node.insertAdjacentElement('afterend',btn)}
function refreshLease(room){if(state.activeGame!=='slots')return;const machine=room?.machines?.[state.slotIndex],online=room?.members?.find(x=>x.id===room.me),isMine=!machine||machine.owner===room.me;
 lease.online=true;lease.owner=isMine;lease.blockedBy=isMine?'':(machine?.name||'다른 사용자');
 ensureBadge();showStatus(isMine?`🟢 ${online?.name||'내'} 슬롯 이용 중 · ${SLOT_NAMES[state.slotIndex]}`:`🔴 ${lease.blockedBy}님 플레이 중 · 관전만 가능`,isMine?'good':'bad');appendSlotDebug();if(!isMine)state.autoLeft=0;
}
async function acquire(machine){if(state.slotBusy)return;const newSession=token(),epoch=++lease.epoch;
 lease.machine=machine;lease.session=newSession||null;lease.owner=!newSession;lease.waiting=!!newSession;lease.blockedBy='';
 if(state.activeGame!=='slots')return;
 ensureBadge();if(!newSession){showStatus('체험 모드 · 별도 서버 점유 없이 플레이', 'warn');return}
 showStatus('슬롯머신 자리 확인 중…','warn');
 try{const room=await call('machineEnter',machine);if(lease.epoch!==epoch||state.activeGame!=='slots'||state.slotIndex!==machine){if(room)await call('machineLeave',machine);return}
 lease.waiting=false;refreshLease(room);
 }catch(error){if(epoch!==lease.epoch)return;lease.waiting=false;lease.owner=false;lease.lastError=String(error.message||error);ensureBadge();showStatus(`🔒 ${lease.lastError}`,'bad');appendSlotDebug();}
}
async function release(){const m=lease.machine,wasOwner=lease.owner,isValid=lease.session;
 lease.epoch++;lease.machine=null;lease.owner=false;lease.waiting=false;lease.blockedBy='';lease.session=null;
 if(isValid&&wasOwner&&Number.isInteger(m))try{await call('machineLeave',m)}catch(e){/* lease expires automatically */}
}
let every=0;
function startHeartbeat(){if(every)return;every=setInterval(()=>{
 if(state.activeGame!=='slots'||!lease.session||!lease.owner||lease.waiting||state.slotBusy)return;
 const machine=state.slotIndex,epoch=lease.epoch;
 call('machineRenew',machine).then(room=>{if(room&&epoch===lease.epoch)refreshLease(room)}).catch(()=>{if(epoch!==lease.epoch)return;lease.owner=false;state.autoLeft=0;showStatus('서버 연결이 끊겨 스핀이 중단됐습니다. 자리 재확인 필요','bad');appendSlotDebug()});
 },12000)}
const originalPlay=playGame;
playGame=function(){const game=games[state.gameIndex]?.id;const result=originalPlay();if(game==='slots'){acquire(state.slotIndex);startHeartbeat();}return result};
const prevSpin=spinSlot;
spinSlot=function(){if(state.activeGame!=='slots')return;
 if(lease.waiting||lease.session&&!lease.owner){toast(lease.blockedBy?`${lease.blockedBy}님이 사용 중인 기계입니다.`:'슬롯머신 자리를 먼저 확인해주세요.');ensureBadge();appendSlotDebug();return;}
 return prevSpin();};
const priorSwitch=switchSlot;
switchSlot=function(idx){if(state.slotBusy)return;const old=lease.machine;const owned=lease.owner;const t=lease.session;
 // Release the previous cabinet first, then reserve the new one. Old release
 // is conditional on the token holder so it cannot clear another user's lease.
 priorSwitch(idx);
 if(t&&owned&&Number.isInteger(old)){call('machineLeave',old).catch(()=>{});}
 if(state.activeGame==='slots'){acquire(idx)}
};
const priorSlotRender=renderSlot;
renderSlot=function(){priorSlotRender();ensureBadge();const disclosure=query('.v8-slot-disclosure');if(disclosure)disclosure.textContent=lease.session?'가상칩 게임 · 기계 점유는 서버에서 확인합니다. 잭팟 금액과 정산은 아직 로컬 체험판입니다.':'가상칩 로컬 체험판 · 서버 연동한 리그만 기계 사용을 제한합니다.';if(lease.machine===state.slotIndex){showStatus(lease.waiting?'슬롯머신 자리 확인 중…':lease.session&&!lease.owner?`🔒 ${lease.blockedBy||lease.lastError||'사용 권한 확인 필요'}`:lease.session?`🟢 ${SLOT_NAMES[state.slotIndex]} · 온라인 독점 이용 중`:'체험 모드 · 로컬 슬롯',lease.owner?'good':lease.waiting?'warn':'bad');appendSlotDebug();}};
const oldBack=backGame;
backGame=function(){if(state.activeGame==='slots'&&state.slotBusy){toast('현재 릴이 회전 중입니다. 정산 후 이동하세요.');return}
 if(state.activeGame==='slots'){const promise=release();Promise.resolve(promise).catch(()=>{});}return oldBack();};
const oldTab=goTab;
goTab=function(tab){if(state.activeGame==='slots'&&state.slotBusy){toast('릴이 멈추고 정산되면 이동할 수 있어요.');return}
 if(state.activeGame==='slots'){release().catch(()=>{})}return oldTab(tab)};
// An offline device may be closed abruptly. Leases expire automatically after 45s.
window.addEventListener('pagehide',()=>{if(lease.owner&&lease.session&&Number.isInteger(lease.machine)){
 const m=lease.machine,t=lease.session;try{navigator.sendBeacon(endpoint,JSON.stringify({action:'act',token:t,op:'machineLeave',machine:m}))}catch(e){/* expiry handles crashes */}
 }});
// Card tables: the per-card chip tray stays visible, but betting is impossible
// during a dealing or settlement step. The operator can always find the route back.
const prevCardRender=renderBlackjack;
renderBlackjack=function(){prevCardRender();enhanceCards()};
const prevBacRender=renderBaccarat;
renderBaccarat=function(){prevBacRender();enhanceCards()};
function enhanceCards(){if(!['blackjack','baccarat'].includes(state.activeGame))return;const panel=query('.v11-bet-panel');if(panel){panel.setAttribute('data-step',state.activeGame==='blackjack'?bj.phase:bac.phase);panel.setAttribute('aria-label','베팅 칩 선택 및 놓기');}
 const header=query('.v9-table-head');if(header&&!header.querySelector('.v12-rule')){const label=document.createElement('small');label.className='v12-rule';label.textContent=state.activeGame==='blackjack'?'BLACKJACK 3:2 · STAND ON 17':'PLAYER 1:1 · BANKER 0.95:1 · TIE 8:1';header.insertAdjacentElement('afterend',label)}
}
function addResultLight(){const prize=query('.v8-card-money'),dice=query('.v11-dice-drawn'),wheel=query('.v9-wheel-result');if(prize||dice||wheel){document.body.classList.add('v12-has-result');clearTimeout(window.__v12ResultTimer);window.__v12ResultTimer=setTimeout(()=>document.body.classList.remove('v12-has-result'),2500)}}
const observer=new MutationObserver(()=>{if(state.activeGame&&['blackjack','baccarat','odd','sicbo','roulette','slots'].includes(state.activeGame))addResultLight()});
const target=query('#view');if(target)observer.observe(target,{childList:true,subtree:true});
window.JaepakV12={version:'12',get cabinet(){return {...lease}},reserve:()=>acquire(state.slotIndex),release,debugStatus:()=>({game:state.activeGame,chip:state.chip,money:state.money,slotBusy:state.slotBusy})};
})();