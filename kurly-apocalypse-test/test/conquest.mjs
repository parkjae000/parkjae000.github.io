import {SIEGE_PADS,siegeSlotAccepts} from './siege-geometry.mjs?v=td-ux-20';
import {defaultGrowth,forceComposition,HERO_DEFS,TOWER_DEFS,FORCE_IDS,FORCES,forceStats} from './progression.mjs?v=td-ux-20';
import {CATALOG,validateLayout} from './engine.mjs?v=td-ux-20';
export const OCCUPATION_PROTECTION_MS=2*3600000;
export function neutralDefense(area){
 const level=Math.max(1,Math.min(30,1+2*(area.level-1))),growth=defaultGrowth();
 growth.boxes=0;growth.towerLevels=Object.fromEntries(Object.keys(TOWER_DEFS).map(id=>[id,level]));growth.wallLevel=Math.max(1,area.level);growth.facilityLevels.center=Math.max(1,area.level);
 for(const h of Object.values(growth.heroes))Object.assign(h,{star:0,level:1,xp:0,shards:0});
 const specs=[['cannon',0],['ice',1],['tesla',2],['laser',3]];
 const items=specs.map(([type,pad],i)=>({id:'neutral-'+i,type,pad:'pad-'+pad}));
 return {variant:'open-siege',rulesVersion:11,items,growth,strength:[0,.72,1.2,2,3][Math.min(4,area.level)],fortressProfile:{wallMax:Math.round(6000*1.7**(area.level-1)),centerMax:Math.round(5000*1.7**(area.level-1))},recommended:[0,300,1000,4000,12000][Math.min(4,area.level)]};
}
export function validateOutpostLayout(items,growth){
 if(!validateLayout(items)||items.length!==4||items.some(i=>CATALOG[i.type]?.kind!=='tower'||!siegeSlotAccepts(i.pad,'tower')))return '정복전은 센터 전면의 포탑 4기로 방어해요. 파트장은 참여하지 않아요.';
 return '';
}
// Preserve tower choices and their IDs; leaders stay owned and usable in home defense.
export function siegeLayout(items){
 const result=[],waiting=[];for(const item of items||[]){if(CATALOG[item.type]?.kind!=='tower')continue;if(siegeSlotAccepts(item.pad,'tower')&&!result.some(i=>i.pad===item.pad))result.push({...item});else waiting.push(item);}
 for(const pad of SIEGE_PADS)if(!result.some(i=>i.pad===pad.id)){const old=waiting.shift(),type=Object.keys(TOWER_DEFS).find(id=>!result.some(i=>i.type===id))||'cannon';result.push(old?{...old,pad:pad.id}:{id:'conquest-default-'+pad.id,type,pad:pad.id});}return result.slice(0,4);
}
export function garrisonSupport(growth,roster,recommended){
 const counts=Object.fromEntries(FORCE_IDS.map(id=>[id,Math.max(0,Math.floor(Number(roster?.[id])||0))]));
 let endurance=0,firepower=0;for(const id of FORCE_IDS){const level=growth.forceLevels[id]||1;endurance+=counts[id]*forceStats(growth,id).hp;firepower+=counts[id]*forceStats(growth,id).siege;}
 const baseline=Math.max(1,recommended),healthRatio=endurance/(baseline*105),damageRatio=firepower/(baseline*7.2);
 return {source:'ready-roster',count:FORCE_IDS.reduce((n,id)=>n+counts[id],0),roster:counts,levels:{...growth.forceLevels},endurance,firepower,wallHp:.8*healthRatio/(1+healthRatio),towerDamage:.4*damageRatio/(1+damageRatio),towerRate:.2*damageRatio/(1+damageRatio),towerRange:.35*damageRatio/(1+damageRatio),towerArea:.5*damageRatio/(1+damageRatio)};
}
export function ownedDefense(area,td,stationed=null){
 const neutral=neutralDefense(area),items=siegeLayout(td.outposts?.[area.id]?.items||neutral.items),roster=stationed&&typeof stationed==='object'?stationed:td.campaign?.roster||forceComposition(Number(stationed)||0),support=garrisonSupport(td.growth,roster,neutral.recommended),baseWall=Math.round(30000*1.2**(td.growth.wallLevel-1));
 return {variant:'open-siege',rulesVersion:11,items:structuredClone(items),growth:structuredClone(td.growth),strength:4,fortressProfile:{wallMax:Math.round(baseWall*(1+support.wallHp)),baseWall,centerMax:Math.round(24000*1.18**(td.growth.facilityLevels.center-1))},support,recommended:neutral.recommended};
}
export function survivorsByRole(battle){return Object.fromEntries(FORCE_IDS.map(id=>[id,battle.forceTotals[id]-battle.deathsByRole[id]]));}
export function countsFromLegacy(garrison){const r=garrison?.formation?.roles;if(r){const army=r.spear??r.assault,air=r.ranged??r.engineer,navy=r.shield??r.support;if([army,air,navy].every(n=>Number.isSafeInteger(n)&&n>=0)&&army+air+navy===garrison.amount)return {army,air,navy};}return forceComposition(garrison?.amount||0);}
export function legacyFormation(counts){return {preset:'balanced',amount:FORCE_IDS.reduce((n,id)=>n+counts[id],0),roles:{spear:counts.army,ranged:counts.air,shield:counts.navy}};}

export function areaIncomeText(a){const p=[];if(a.boxesPerHour)p.push('박스 '+a.boxesPerHour);if(a.cashPerHour)p.push('골드 '+a.cashPerHour);if(a.normalHeroXpPerHour)p.push('일반 교본 '+a.normalHeroXpPerHour+' XP');if(a.rareHeroXpPerHour)p.push('희귀 교본 '+a.rareHeroXpPerHour+' XP');for(const [id,n] of Object.entries(a.shardsPerHour||{}))p.push(HERO_DEFS[id].name+' 조각 '+n+'개');return p.join(' · ')+' / 시간';}
