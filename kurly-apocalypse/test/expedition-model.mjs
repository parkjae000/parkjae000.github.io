import {defaultGrowth,capacity,forceComposition,FORCE_IDS,HERO_DEFS,damageMultiplier,COMPOSITIONS} from './progression.mjs?v=td-ux-17';
import {defaultLayout} from './engine.mjs?v=td-ux-17';
export const EXPEDITION_MODES={invasion:{name:'침공',title:'물류센터 침공전',reward:'센터 자원 확보',rule:'방벽을 돌파한 뒤 센터를 파괴하세요.'},conquest:{name:'정복',title:'정복지 출정',reward:'시간당 수입 확보',rule:'세 시설과 중앙 지휘소를 돌파하면 점령하고 생존 병력은 전원 귀환합니다.'},explore:{name:'탐사',title:'탐사 파견',reward:'교본·조각 수급',rule:'하루 5회 · 임무 완료 후 전원 귀환'}};
export const REVIEW_TARGETS=[
 {id:'practice-balanced',name:'균형 방어 센터',tag:'연습 전장',description:'모든 방어 유형을 고르게 배치한 전장',loot:120000,boxes:600000,cash:25000,variant:'balanced',status:'도전 가능'},
 {id:'practice-air',name:'대공 방어 센터',tag:'전기·CS 집중',description:'공군을 집중 견제하는 방어 배치',loot:150000,boxes:750000,cash:40000,variant:'anti-air',status:'도전 가능'},
 {id:'practice-navy',name:'중장갑 방어 센터',tag:'레이저·빙하 집중',description:'해군의 내구를 뚫는 장거리 배치',loot:150000,boxes:750000,cash:40000,variant:'anti-navy',status:'도전 가능'}
];
export const REVIEW_AREAS=[
 {id:'review-boxes',name:'물류 보급 거점',tag:'자원',income:'박스 1,200 / 시간',owner:'중립 수비대',troops:5000},
 {id:'review-books',name:'교육 지원 거점',tag:'교본',income:'일반 교본 60 XP / 시간',owner:'중립 수비대',troops:8000},
 {id:'review-shards',name:'파트장 훈련 거점',tag:'조각',income:'냉동 조각 1개 / 시간',owner:'중립 수비대',troops:12000}
];
// These three mission definitions are copied from the inspected2.2.7 source; fixtures never dispatch a real job.
export const REVIEW_MISSIONS=[
 {id:'parcel',name:'분실 택배 수색',seconds:900,minTroops:1,boxes:300,xp:60,ticket:2,shards:1},
 {id:'warehouse',name:'폐쇄 창고 조사',seconds:3600,minTroops:5,boxes:1200,xp:200,ticket:4,rareTicket:1,shards:2},
 {id:'returns',name:'반품 센터 심층 조사',seconds:10800,minTroops:10,boxes:3600,xp:520,ticket:8,rareTicket:2,shards:4}
];
export function targetSnapshot(id){const target=REVIEW_TARGETS.find(t=>t.id===id);if(!target)throw Error('예시 전장을 선택해 주세요.');const items=defaultLayout(),growth=defaultGrowth();
 if(target.variant==='anti-air'){for(const i of [0,4,7,8])items[i].type='tesla';}
 if(target.variant==='anti-navy'){for(const i of [0,1,4,7])items[i].type='laser';}
 return {version:7,targetId:id,targetName:target.name,items,growth};
}
export function defenseSummary(snapshot){const counts={};for(const d of snapshot.items)counts[d.type]=(counts[d.type]||0)+1;return Object.entries(counts).map(([type,count])=>({type,count}));}
export function counterWarnings(snapshot,composition){const ratios=typeof composition==='object'?composition:forceComposition(10000,composition),role=FORCE_IDS.reduce((a,b)=>ratios[a]>=ratios[b]?a:b);return defenseSummary(snapshot).filter(d=>damageMultiplier(d.type,role)>=1.4).map(d=>({...d,role,multiplier:damageMultiplier(d.type,role)}));}
export function validateReviewPlan(plan,g,owned=capacity(g)){if(!EXPEDITION_MODES[plan.mode])return {ok:false,reason:'출정 종류를 선택하세요.'};const list=plan.mode==='invasion'?REVIEW_TARGETS:plan.mode==='conquest'?REVIEW_AREAS:REVIEW_MISSIONS,target=list.find(t=>t.id===plan.target);if(!target)return {ok:false,reason:'대상을 먼저 선택하세요.'};
 if(!COMPOSITIONS[plan.composition])return {ok:false,reason:'편성 유형을 선택하세요.'};
 const amount=plan.mode==='invasion'?owned:Number(plan.amount),minimum=plan.mode==='invasion'?1:plan.mode==='explore'?target.minTroops:1;
 if(!Number.isSafeInteger(amount)||amount<minimum||amount>(plan.mode==='invasion'?owned:capacity(g)))return {ok:false,reason:plan.mode==='invasion'?'센터에 출정 가능한 병력이 없어요.':'필요 인원과 출격 한도를 확인하세요.'};
 if(plan.mode!=='invasion'&&!g.heroes[plan.hero]?.star)return {ok:false,reason:'보유 파트장을 선택하세요.'};
 if(plan.mode==='invasion'&&plan.shieldActive&&!plan.ackShield)return {ok:false,reason:'보호 해제 안내를 확인하세요.'};
 return {ok:true,target,amount,composition:forceComposition(amount,plan.composition),hero:plan.mode==='invasion'?null:HERO_DEFS[plan.hero].name};
}
