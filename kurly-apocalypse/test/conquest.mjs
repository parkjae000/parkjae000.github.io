import {defaultGrowth,forceComposition,HERO_DEFS,TOWER_DEFS,FORCE_IDS} from './progression.mjs?v=td-ux-11';
import {CATALOG,validateLayout} from './engine.mjs?v=td-ux-11';
export const OCCUPATION_PROTECTION_MS=6*3600000;
export function neutralDefense(area){
 const level=Math.max(1,Math.min(30,1+2*(area.level-1))),growth=defaultGrowth();
 growth.boxes=0;growth.towerLevels=Object.fromEntries(Object.keys(TOWER_DEFS).map(id=>[id,level]));growth.wallLevel=Math.max(1,area.level);growth.facilityLevels.center=Math.max(1,area.level);
 for(const h of Object.values(growth.heroes))Object.assign(h,{star:0,level:1,xp:0,shards:0});
 const specs=[['cannon',0],['ice',1],['tesla',4],['laser',10]];
 const items=specs.map(([type,pad],i)=>({id:'neutral-'+i,type,pad:'pad-'+pad}));
 return {items,growth,strength:[0,.18,.3,.5,.75][Math.min(4,area.level)],fortressProfile:{wallMax:Math.round(2000*1.7**(area.level-1)),centerMax:Math.round(5000*1.7**(area.level-1))},recommended:[0,300,1000,4000,12000][Math.min(4,area.level)]};
}
export function validateOutpostLayout(items,growth){
 if(!validateLayout(items))return '빈 발판에 중복 없이 배치해 주세요.';
 if(items.filter(i=>CATALOG[i.type].kind==='tower').length>4)return '정복지는 포탑을 최대 4기 배치해요.';
 if(items.filter(i=>CATALOG[i.type].kind==='hero').length>2)return '정복지는 파트장을 최대 2명 배치해요.';
 if(items.some(i=>HERO_DEFS[i.type]&&!growth.heroes[i.type]?.star))return '보유한 파트장만 배치할 수 있어요.';
 return '';
}
export function ownedDefense(area,td,stationed=0){
 const neutral=neutralDefense(area),items=td.outposts?.[area.id]?.items||neutral.items;
 const support=Math.min(.25,stationed/Math.max(1,neutral.recommended)*.25);
 return {items:structuredClone(items),growth:structuredClone(td.growth),strength:1+support,fortressProfile:{wallMax:Math.round(10000*1.2**(td.growth.wallLevel-1)),centerMax:Math.round(24000*1.18**(td.growth.facilityLevels.center-1)*(1+support))},support,recommended:neutral.recommended};
}
export function survivorsByRole(battle){return Object.fromEntries(FORCE_IDS.map(id=>[id,battle.forceTotals[id]-battle.deathsByRole[id]]));}
export function countsFromLegacy(garrison){const r=garrison?.formation?.roles;if(r&&r.spear+r.ranged+r.shield===garrison.amount)return {army:r.spear,air:r.ranged,navy:r.shield};return forceComposition(garrison?.amount||0);}
export function legacyFormation(counts){return {preset:'balanced',amount:FORCE_IDS.reduce((n,id)=>n+counts[id],0),roles:{spear:counts.army,ranged:counts.air,shield:counts.navy}};}

export function areaIncomeText(a){const p=[];if(a.boxesPerHour)p.push('박스 '+a.boxesPerHour);if(a.cashPerHour)p.push('골드 '+a.cashPerHour);if(a.normalHeroXpPerHour)p.push('일반 교본 '+a.normalHeroXpPerHour+' XP');if(a.rareHeroXpPerHour)p.push('희귀 교본 '+a.rareHeroXpPerHour+' XP');for(const [id,n] of Object.entries(a.shardsPerHour||{}))p.push(HERO_DEFS[id].name+' 조각 '+n+'개');return p.join(' · ')+' / 시간';}
