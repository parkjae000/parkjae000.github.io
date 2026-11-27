import {PATCH_ID,EVENT_ENDS_AT,PATCH_APOLOGY} from './patch-policy.mjs?v=20261125-v245-forklift-pass';
export function patchUpdateMarkup(now){return `<section class="patch-update"><p>${PATCH_APOLOGY}</p><div class="patch-gift"><span>⚙️</span><h3>자동채굴 1일권 1장 지급</h3><p>채굴 화면의 이용권에서 사용할 수 있어요.<br>사용할 때부터 24시간 적용돼요.</p></div><p><b>협동 보스 이벤트 조기 종료</b><br>11월 25일 밤 12시까지 진행합니다.<br>${now>=EVENT_ENDS_AT?'이벤트가 종료됐어요. 새로운 이벤트로 돌아올게요.':'오늘까지 참여할 수 있으며, 종료 후 새 이벤트를 준비할게요.'}</p><button class="btn btn-gold btn-wide" data-patch-update-ack>확인했어요 · 다시 보지 않기</button></section>`;}
export function mountPatchUpdate({getState,showModal,closeModal,head,api,available,clock=Date.now}){
 const seen=new Set(),key=s=>PATCH_ID+'_'+s.me.world+'_'+s.me.id;
 function acknowledged(s){if(seen.has(key(s))||s.me.game.patchSeen?.[PATCH_ID])return true;try{return localStorage.getItem(key(s))==='1';}catch{return false;}}
 function maybe(){const s=getState();if(!s?.me?.game.patchRewards?.[PATCH_ID]||!available()||s.td?.campaign.pending||acknowledged(s))return false;showModal(head('업데이트 안내와 사과 선물')+patchUpdateMarkup(clock()));acknowledge(false);return true;}
 function acknowledge(close=true){const s=getState();if(!s)return;if(seen.has(key(s))){if(close)closeModal();return;}seen.add(key(s));try{localStorage.setItem(key(s),'1');}catch{}s.me.game.patchSeen ||= {};s.me.game.patchSeen[PATCH_ID]=clock();api('/api/action','POST',{type:'patch/update-ack',requestId:crypto.randomUUID()}).catch(()=>{});if(close)closeModal();}
 document.addEventListener('click',e=>{if(e.target.closest('[data-patch-update-ack]'))acknowledge();});return {maybe,acknowledge};
}
