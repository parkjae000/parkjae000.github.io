export const PATCH_ID='patch-20261125-rare-events';
export const EVENT_ENDS_AT=Date.UTC(2026,10,25,15,0,0);
export const PATCH_GIFT_ITEM='autoMine1d';
export const PATCH_APOLOGY='갑작스러운 전투 방식과 화면 변경으로 이용에 불편을 드려 죄송합니다. 더 쉽게 이용하실 수 있도록 계속 개선하겠습니다.';
export function eventClosed(now){return now>=EVENT_ENDS_AT;}
export function grantPatchGift(g,createdAt,now){
 if(!Number.isFinite(Number(createdAt))||Number(createdAt)<=0||Number(createdAt)>=EVENT_ENDS_AT||g.patchRewards?.[PATCH_ID])return false;
 g.inventory ||= {};g.inventory[PATCH_GIFT_ITEM]=(g.inventory[PATCH_GIFT_ITEM]||0)+1;
 if(g.td?.growth){g.td.growth.inventory ||= {};g.td.growth.inventory[PATCH_GIFT_ITEM]=g.inventory[PATCH_GIFT_ITEM];}
 g.patchRewards ||= {};g.patchRewards[PATCH_ID]={at:now,item:PATCH_GIFT_ITEM,quantity:1};
 g.mailbox ||= [];g.mailbox.unshift({id:PATCH_ID,type:'patch',title:'업데이트 사과 선물 · 자동채굴 1일권',body:PATCH_APOLOGY+' 자동채굴 1일권 1장을 창고에 지급했습니다. 협동 보스 이벤트는 11월 25일 24시(한국시간)에 조기 종료됩니다.',at:now,readAt:0,reward:{item:PATCH_GIFT_ITEM,quantity:1}});g.mailbox=g.mailbox.slice(0,60);return true;
}
export function acknowledgePatch(g,now){g.patchSeen ||= {};g.patchSeen[PATCH_ID] ||= now;return {message:'',patchSeen:true};}
