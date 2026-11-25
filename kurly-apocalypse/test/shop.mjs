import {RESEARCH_PASSES,BOOST_PASSES,FORKLIFT_PASSES,SHIELD_PRICES,HEAL_PRICE} from '../pass-catalog.mjs?v=20261125-v245-forklift-pass';
import {researchStaffCount} from './research-economy.mjs?v=td-ux-20';
import {HERO_DEFS} from './progression.mjs?v=td-ux-20';
export const SHOP_GROUPS={growth:'파트장 성장',research:'연구·채굴',defense:'보호·치료'};
export const SHOP_ITEMS=[
 {id:'normalTicket',name:'일반 모집권',group:'growth',currency:'boxes',price:500,key:'normalTickets',amount:1,art:'ticketNormal',description:'기존 일반 모집에 사용하는 모집권',existing:true},
 {id:'rareTicket',name:'희귀 모집권',group:'growth',currency:'boxes',price:2000,key:'rareTickets',amount:1,art:'ticketRare',description:'기존 희귀 모집에 사용하는 모집권',existing:true},
 {id:'normalBook',name:'일반 경험치 교본',group:'growth',currency:'boxes',price:1200,key:'normalHeroXp',amount:500,art:'bookNormal',description:'일반 파트장 레벨 강화에500 XP 사용',limit:10,draft:true},
 {id:'rareBook',name:'희귀 경험치 교본',group:'growth',currency:'cash',price:80,key:'rareHeroXp',amount:500,art:'bookRare',description:'희귀 파트장 레벨 강화에500 XP 사용',limit:5,draft:true},
 ...Object.entries(HERO_DEFS).map(([id,def])=>({id:id+'Shard',name:def.name+' 전용 조각',group:'growth',currency:def.rarity==='희귀'?'cash':'boxes',price:def.rarity==='희귀'?120:1500,hero:id,amount:5,art:id,description:def.name+' 성급 강화에 사용하는 전용 조각5개',limit:def.rarity==='희귀'?2:4,draft:true})),
 ...RESEARCH_PASSES.map(p=>({id:p.key,name:'연구 단축 · '+p.label,group:'research',currency:'cash',price:p.price,key:p.key,amount:1,art:'researchVoucher',description:'진행 중인 연구의 남은 시간 '+p.label+' 단축 · 남은 시간까지만 적용',existing:true})),
 {id:'bot',name:'연구 스태프 3',group:'research',currency:'cash',price:3600,permanent:true,art:'workerCute',description:'기본 2명 + 추가 1명 · 연구 3개 동시 진행 · 영구 적용',existing:true},
 ...BOOST_PASSES.map(p=>({id:p.key,name:'채굴 2배 가속 · '+p.label,group:'research',currency:'cash',price:p.price,key:p.key,amount:1,art:'miningBoost',description:'이용권 보관 · 사용 시 '+p.label+' 동안 채굴 속도 2배',existing:true})),
 ...FORKLIFT_PASSES.filter(p=>p.shopId).map(p=>({id:p.shopId,name:'지게차 '+p.label+' 이용권',group:'research',currency:'cash',price:p.price,key:p.key,amount:1,art:'forklift',description:'사용 시 '+p.label+' 연장 · 채굴 직원 1명을 탑승시켜요.'})),
 ...[1,4,12,24].map((hours,i)=>({id:'shield'+hours+'h',name:'센터 보호막'+hours+'시간권',group:'defense',currency:'cash',price:SHIELD_PRICES[i],key:'shield'+hours+'h',amount:1,hours,art:'wall',description:'창고 보관 · 출정·교전 중 사용 불가. 침공 출발 시 내 보호 해제',existing:true})),
 {id:'healAid',name:'사원 치료권',group:'defense',currency:'cash',price:HEAL_PRICE,key:'healAid',amount:1,art:'medicalKit',description:'회복 대기 중인 사원을 모두 즉시 치료해요.',existing:true}
];
const shopDay=now=>new Date(now+9*3600000).toISOString().slice(0,10);
export function shopOwned(g,c,item){if(item.permanent)return researchStaffCount(g)>=3?1:0;return item.hero?g.heroes[item.hero].shards:g.inventory[item.key]||0;}
export function shopQuote(g,c,id,quantity=1,now=Date.now()){
 const item=SHOP_ITEMS.find(x=>x.id===id);if(!item)return {enabled:false,reason:'상품을 선택하세요.'};const valid=Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=1000&&(!item.permanent||quantity===1);const safeQuantity=valid?quantity:0;
 const day=shopDay(now),p=c.shopDaily?.day===day?c.shopDaily.counts:{},bought=p?.[id]||0,cost=item.price*safeQuantity,wallet=item.currency==='boxes'?g.boxes:c.cash,owned=shopOwned(g,c,item);
 // Explicit branch avoids the ternary precedence treating a blocked item as owned.
 const blocked=!valid?'구매 수량을 확인하세요.':item.blocked||(item.permanent&&owned?'이미 보유 중':item.limit&&bought+quantity>item.limit?'오늘 구매 한도 초과':wallet<cost?'재화 부족':'');
 return {item,quantity,cost,wallet,owned,afterOwned:item.permanent?1:owned+item.amount*safeQuantity,remaining:item.limit?Math.max(0,item.limit-bought):null,enabled:!blocked,reason:blocked,day};
}
export function purchaseShop(g,c,id,quantity=1,requestId='',now=Date.now()){
 if(!requestId)throw Error('구매 요청 ID가 필요해요.');const previous=c.shopReceipts?.find(x=>x.requestId===requestId);if(previous){if(previous.item!==id||previous.quantity!==quantity)throw Error('같은 구매 요청 ID에 다른 상품을 사용할 수 없어요.');return {growth:g,campaign:c,receipt:previous,duplicate:true};}
 const q=shopQuote(g,c,id,quantity,now);if(!q.enabled)throw Error(q.reason);const nextG=structuredClone(g),nextC=structuredClone(c),item=q.item;nextG.inventory ||= {};
 if(item.currency==='boxes')nextG.boxes-=q.cost;else nextC.cash-=q.cost;
 if(item.permanent){nextG.staffCount=3;nextG.staffPolicyVersion=2;}else if(item.hero)nextG.heroes[item.hero].shards+=item.amount*quantity;else nextG.inventory[item.key]=(nextG.inventory[item.key]||0)+item.amount*quantity;
 if(nextC.shopDaily?.day!==q.day)nextC.shopDaily={day:q.day,counts:{}};nextC.shopDaily.counts[id]=(nextC.shopDaily.counts[id]||0)+quantity;
 const receipt={requestId,item:id,name:item.name,quantity,currency:item.currency,cost:q.cost,at:now};nextC.shopReceipts ||= [];nextC.shopReceipts.unshift(receipt);
 return {growth:nextG,campaign:nextC,receipt,duplicate:false};
}
export function useShieldReview(g,c,id,now=Date.now()){
 const item=SHOP_ITEMS.find(x=>x.id===id&&x.hours);if(!item||!(g.inventory[id]>0))throw Error('보유한 보호막을 선택하세요.');if(c.pending)throw Error('출정 중에는 보호막을 사용할 수 없어요.');g.inventory[id]--;c.shieldUntil=Math.max(now,c.shieldUntil||0)+item.hours*3600000;return c.shieldUntil;
}
