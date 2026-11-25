import {LEGACY_RESEARCH} from './research-review.mjs?v=td-ux-17';
import {legacyCost} from './legacy-costs.mjs?v=td-ux-17';
import {HERO_DEFS,STAR_COST} from './progression.mjs?v=td-ux-17';
export const HERO_RESET_VERSION='td-hero-reset-1';
const nonnegative=(n,label)=>{if(!Number.isSafeInteger(n)||n<0)throw Error(label+' 원본 수치 확인 필요');return n;};
// Dry-run only. Ownership and unlock investment are retained; no new unlock refund.
export function heroResetPreview(game){
 if(game.migrations?.[HERO_RESET_VERSION])return {alreadyApplied:true,game:structuredClone(game),rows:[],total:{normalXp:0,rareXp:0,shards:0}};
 const next=structuredClone(game),rows=[],total={normalXp:0,rareXp:0,shards:0};next.inventory ||= {};next.heroes ||= {};
 next.inventory.normalHeroXp=nonnegative(next.inventory.normalHeroXp||0,'일반 교본');next.inventory.rareHeroXp=nonnegative(next.inventory.rareHeroXp||0,'희귀 교본');
 next.inventory.normalHeroXp+=nonnegative(next.inventory.heroXp||0,'구형 교본');next.inventory.heroXp=0;
 for(const [id,def] of Object.entries(HERO_DEFS)){
  const h=next.heroes[id]||{level:1,star:0,xp:0,shards:0},level=nonnegative(h.level??1,id+' 레벨'),star=nonnegative(h.star??0,id+' 성급'),xp=nonnegative(h.xp||0,id+' 잔여 XP'),shards=nonnegative(h.shards||0,id+' 조각');
  if(level<1||level>50||star>5||!star&&level!==1)throw Error(def.name+' 성장 이력 확인 필요');
  const spentXp=25*level*(level-1),spentShards=Array.from({length:Math.max(0,star-1)},(_,i)=>STAR_COST[i+1]).reduce((a,b)=>a+b,0),refundXp=spentXp+xp,key=def.rarity==='희귀'?'rareHeroXp':'normalHeroXp';
  next.inventory[key]+=refundXp;next.heroes[id]={...h,level:1,star:star?1:0,xp:0,shards:shards+spentShards};
  total[key==='rareHeroXp'?'rareXp':'normalXp']+=refundXp;total.shards+=spentShards;
  rows.push({id,name:def.name,grade:def.rarity,owned:star>0,beforeLevel:level,beforeStar:star,spentXp,unspentXp:xp,refundXp,heldShards:shards,spentShards,afterShards:shards+spentShards,afterStar:star?1:0});
 }
 next.migrations ||= {};next.migrations[HERO_RESET_VERSION]={basis:'current-progress-cost-curve',version:HERO_RESET_VERSION};
 return {alreadyApplied:false,game:next,rows,total,basis:'현재 운영 비용표 기준. 과거 비용 변경·개별 보상 이력은 운영 전환 전 검증 필요.'};
}

// Approved reset scope; payment amounts remain a read-only estimate without a ledger.
export const RESEARCH_RESET_VERSION='td-research-reset-1';
export const RETAIN_RESEARCH=['mine','laborCost','lossDiscovery','careerLevel','mergeLuck','center','wall','wallRepair'];
export function researchResetPreview(game,now=Date.now()){
 if(game.migrations?.[RESEARCH_RESET_VERSION])return {alreadyApplied:true,game:structuredClone(game),rows:[],refund:0};
 const next=structuredClone(game),rows=[];let refund=0;
 for(const def of LEGACY_RESEARCH.filter(d=>!RETAIN_RESEARCH.includes(d.key))){const level=next.levels?.[def.key]||1;if(!Number.isSafeInteger(level)||level<1||level>20)throw Error(def.name+' 투자 이력 확인 필요');let completedCost=0;for(let lv=2;lv<=level;lv++)completedCost+=legacyCost(def.key,lv).boxes;
  const jobs=(next.upgrades||[]).filter(j=>j.key===def.key);let pendingCost=0;for(const job of jobs){if(job.target!==level+1)throw Error(def.name+' 진행 단계 확인 필요');pendingCost+=nonnegative(job.paidBoxes??legacyCost(def.key,job.target).boxes,def.name+' 선결제');}
  refund+=completedCost+pendingCost;rows.push({...def,level,completedCost,pendingCost,refund:completedCost+pendingCost});if(next.levels)next.levels[def.key]=1;
 }
 if(!Number.isSafeInteger(refund)||!Number.isSafeInteger((next.boxes||0)+refund))throw Error('환급액 검산 필요');next.boxes=(next.boxes||0)+refund;next.upgrades=(next.upgrades||[]).filter(j=>RETAIN_RESEARCH.includes(j.key));next.towerLevels={cannon:1,tesla:1,ice:1,laser:1};next.forceLevels={army:1,air:1,navy:1};next.capacityLevel=1;next.wallLevel=game.levels?.wall||game.wallLevel||1;next.facilityLevels=Object.fromEntries(['mine','laborCost','lossDiscovery','careerLevel','mergeLuck','center','wallRepair','wallReflect'].map(id=>[id,next.levels?.[id]||1]));next.migrations ||= {};next.migrations[RESEARCH_RESET_VERSION]={at:now,basis:'2.2.7-cost-table-estimate'};
 return {alreadyApplied:false,game:next,rows,refund,basis:'현재 운영 비용표로 재구성한 검토액. 결제 이력·가속권 처리 검산 후 운영 적용.'};
}
