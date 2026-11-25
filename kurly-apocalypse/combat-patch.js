const PATCH_IMAGE=new URL('./assets/combat-patch-v240.webp',import.meta.url).href;
export const COMBAT_PATCH='combat-20261125';
export function combatPatchMarkup(state){
 const refund=state.td?.migration?.boxes||0,n=v=>Number(v).toLocaleString('ko-KR');
 return `<section class="combat-patch-notice"><div class="combat-patch-art"><img src="${PATCH_IMAGE}" alt="육군·공군·해군이 출동하고, 전면 포탑 네 기가 정복지를 지키며, 복슬이가 투자 내역을 정산하는 세 장면"><h3>전투가 새로워졌어요!</h3><b class="patch-caption first">육군 · 공군 · 해군을 따로 생산해요</b><b class="patch-caption second">정복전은 전면 포탑 4기로 방어해요</b><b class="patch-caption third">기존 강화 계승 · 삭제 항목 환급</b></div><div class="combat-patch-facts"><p><b>출정은 보유 병력 전량</b> · 생존 병력은 귀환해요.</p><p><b>정복지는 최대 2곳</b> · 점령하면 2시간 보호받아요.</p><p><b>센터 약탈 성공 시 박스·골드 20%</b> · 피해 센터는 6시간 보호돼요.</p><p>파트장은 내 센터 방어에 참여해요. 정복전에서는 포탑만 참가해요.</p><p>탐사전은 종료하고, 남은 병력과 완료 보상은 안전하게 정산해요.</p></div><details class="combat-patch-investment"><summary>내 투자 계승·환급 내역</summary><p>파트장 레벨·성급·조각·교본, 채굴 성장, 센터·방벽·수리·반사 연구와 보유 상품을 유지했어요.</p><p>교체된 구형 병력·포탑·수용 한도 연구는 박스로 돌려드려요. 기존 정복지가 2곳보다 많아도 보유권은 유지하고, 2곳 미만이 되면 다시 점령할 수 있어요.</p><strong>연구 환급 ${n(refund)} 박스</strong>${state.td?.migration?.rows?.filter(r=>r.refund>0).map(r=>`<div>${r.name} <b>+${n(r.refund)}</b></div>`).join('')||'<p>이미 전환했거나 환급할 연구가 없으면 추가 차감 없이 현재 투자를 유지해요.</p>'}</details><div class="combat-patch-actions"><button class="btn btn-gold btn-wide combat-patch-confirm" data-combat-patch-ack>확인했어요</button><button class="btn btn-outline btn-wide" data-combat-patch-never>다시는 안 보기</button></div></section>`;
}
export function mountCombatPatch({getState,showModal,closeModal,head,api,available}){
 const seen=new Set();const key=s=>'ka_patch_'+COMBAT_PATCH+'_'+s.me.world+'_'+s.me.id;
 function acknowledged(s){if(seen.has(key(s))||s.me.game.patchSeen?.[COMBAT_PATCH])return true;try{return localStorage.getItem(key(s))==='1';}catch{return false;}}
 function open(){const s=getState();if(!s?.td)return false;showModal(head('전투 업데이트')+combatPatchMarkup(s));document.getElementById('modalContent')?.classList.add('modal-combat-patch');return true;}
 function maybe(){const s=getState();if(!s?.td||!available()||s.td.campaign.pending||acknowledged(s))return false;return open();}
 function acknowledge(){const s=getState();if(!s||seen.has(key(s)))return;seen.add(key(s));try{localStorage.setItem(key(s),'1');}catch{}s.me.game.patchSeen ||= {};s.me.game.patchSeen[COMBAT_PATCH]=Date.now();api('/api/action','POST',{type:'patch/ack',requestId:crypto.randomUUID()}).catch(()=>{});}
 document.addEventListener('click',event=>{if(event.target.closest('[data-combat-patch]'))open();if(event.target.closest('[data-combat-patch-ack],[data-combat-patch-never]')){acknowledge();closeModal();}});
 return {open,maybe,acknowledge};
}
