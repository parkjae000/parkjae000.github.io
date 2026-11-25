import {upgradeGrowth,upgradeQuote,MAX_CAPACITY_LEVEL} from './progression.mjs?v=td-ux-16';
import {legacyCost,BASE_TIME} from './legacy-costs.mjs?v=td-ux-16';
export const FACILITY_DEFS={productionEfficiency:{name:'생산 효율',group:'military',identity:'육·공·해 생산 주기 단축',max:20},
 mine:{name:'채굴 효율',group:'mine',identity:'일용직의 채굴 속도 증가',max:30},
 laborCost:{name:'일용직 인건비 감소',group:'mine',identity:'일용직 소환 비용 감소',max:20},
 lossDiscovery:{name:'로스 발견',group:'mine',identity:'박스·희귀 돈 획득량 증가',max:30},
 careerLevel:{name:'경력 증가',group:'mine',identity:'기본 소환 일용직 레벨 증가',max:6},
 mergeLuck:{name:'경력 확률',group:'mine',identity:'합성 시2레벨 상승 확률 증가',max:20},
 center:{name:'센터 레벨',group:'facility',identity:'센터 내구도 증가',max:30},
 wallRepair:{name:'방벽 자가 수리',group:'facility',identity:'교전 중지 상태에서 방벽을 자동 수리',max:30},
 wallReflect:{name:'방벽 반사 피해',group:'facility',identity:'방벽을 공격한 병력에게 피해 반사',max:30}
};
export const upgradeMode=kind=>['tower','wall','hero-level','hero-star'].includes(kind)?'instant':'staff';
export function ensureResearch(g){g.facilityLevels ||= {};for(const id of Object.keys(FACILITY_DEFS))g.facilityLevels[id] ||= 1;g.staffCount ||= 1;g.researchJobs ||= [];g.researchSeq ||= 0;return g;}
export function facilityStats(g,id,level=g.facilityLevels?.[id]||1){const d=FACILITY_DEFS[id],n=level-1;return {...d,level,hp:Math.round(100000*1.18**n),miningSpeed:1.2**n,costReduction:Math.min(.76,.04*n),rewardBonus:.1*n,summonLevel:Math.min(6,level),mergeChance:.03*n,repairRate:.01*n,reflectRate:.02*n,productionReduction:Math.min(.5,.03*n)};}
export const timeText=seconds=>seconds>=3600?(seconds/3600).toFixed(seconds%3600?1:0)+'시간':seconds>=60?Math.ceil(seconds/60)+'분':Math.ceil(seconds)+'초';
export function staffQuote(g,kind,id,steps=1){
 const quote=kind==='facility'?facilityQuote(g,id,steps):upgradeQuote(g,kind,id,steps);if(!quote.nextGrowth)return quote;
 const jobs=g.researchJobs||[],key=kind+':'+(id||''),duplicate=jobs.some(j=>j.key===key),full=jobs.length>=(g.staffCount||1);
 const level=kind==='capacity'?g.capacityLevel:kind==='force'?g.forceLevels[id]:g.facilityLevels?.[id]||1;
 let seconds=0;for(let i=0;i<steps;i++)seconds+=kind==='facility'?legacyCost(id,level+i+1).seconds:kind==='capacity'?60:BASE_TIME[Math.min(40,level+i+1)];
 const reason=duplicate?'이미 연구 중':full?'사용 가능한 스탭 없음':quote.reason||'';
 return {...quote,enabled:quote.enabled&&!duplicate&&!full,reason,key,seconds,staffRequired:1,mode:'staff'};
}
function facilityQuote(g,id,steps){const d=FACILITY_DEFS[id],level=g.facilityLevels?.[id]||1;if(!d||!Number.isSafeInteger(steps)||steps<1||level+steps>d.max)return {enabled:false,reason:'연구 상한 도달'};let cost=0;for(let n=level+1;n<=level+steps;n++)cost+=legacyCost(id,n).boxes;const nextGrowth=structuredClone(g);nextGrowth.facilityLevels ||= {};nextGrowth.facilityLevels[id]=level+steps;return {cost,owned:g.boxes,resource:'박스',nextGrowth,enabled:g.boxes>=cost,reason:g.boxes>=cost?'':'박스 부족',steps};}
export function startResearch(g,kind,id,steps=1,now=Date.now()){
 if(upgradeMode(kind)!=='staff')throw Error('이 강화는 스탭 없이 즉시 적용돼요.');const q=staffQuote(g,kind,id,steps);if(!q.enabled)throw Error(q.reason);ensureResearch(g);g.boxes-=q.cost;const level=kind==='capacity'?g.capacityLevel:kind==='force'?g.forceLevels[id]:g.facilityLevels[id];const job={id:'research-'+(++g.researchSeq),key:q.key,kind,item:id,from:level,target:level+steps,steps,cost:q.cost,startAt:now,endAt:now+q.seconds*1000};g.researchJobs.push(job);return job;
}
export function settleResearch(g,now=Date.now()){
 const finished=(g.researchJobs||[]).filter(j=>j.endAt<=now);if(!finished.length)return [];
 for(const job of finished){if(job.kind==='facility')g.facilityLevels[job.item]=job.target;else if(job.kind==='force')g.forceLevels[job.item]=job.target;else if(job.kind==='capacity')g.capacityLevel=job.target;}
 g.researchJobs=g.researchJobs.filter(j=>j.endAt>now);return finished;
}
export function speedResearch(g,jobId,item,now=Date.now()){
 const minutes={researchAid:10,researchHourAid:60}[item],job=(g.researchJobs||[]).find(j=>j.id===jobId);if(!minutes||!job)throw Error('진행 중인 스탭 연구를 선택해 주세요.');if(!(g.inventory[item]>0))throw Error('보유 단축권이 없어요.');if(job.endAt<=now)throw Error('이미 끝난 연구예요.');g.inventory[item]--;job.endAt=Math.max(now,job.endAt-minutes*60000);return settleResearch(g,now);
}
