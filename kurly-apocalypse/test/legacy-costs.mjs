// Cost/time tables read from parkjae000/kurly-apocalypse2.2.7 on2026-11-25.
export const RESEARCH_PREPARED_LEVEL=20;
// Extend only future levels; already paid prices and durations stay unchanged.
const extendResearch=(base,growth,unit)=>{for(let lv=base.length;lv<=RESEARCH_PREPARED_LEVEL;lv++)base.push(Math.ceil(base[10]*growth**(lv-10)/unit)*unit);return base;};
export const CENTER_COST=extendResearch([0,0,300,800,2000,5000,12000,27000,60000,135000,300000],1.65,10);
export const CENTER_TIME=extendResearch([0,0,60,600,1800,7200,14400,28800,57600,86400,129600],1.15,60);
export const BASE_COST=extendResearch([0,0,140,290,590,1210,2470,5070,10390,21300,43670],1.65,10);
export const BASE_TIME=extendResearch([0,0,20,120,600,1800,5400,10800,21600,43200,86400],1.15,60);
export const FACTOR={mine:1.2,troopAtk:1,troopHp:1,troopSpeed:1.2,capacity:1.15,wall:1,turretDmg:1.25,turretSpeed:1.4,laborCost:1.5,lossDiscovery:2,mergeLuck:2.5,wallReflect:1.6,wallRepair:1.8,troopCritChance:1.5,troopCritDmg:1.4,troopLeech:1.8};
export function legacyCost(key,level){if(key==='careerLevel')return {boxes:[0,0,800,2400,7200,21600,64800][level],seconds:[0,0,600,3600,10800,28800,86400][level]};return key==='center'?{boxes:CENTER_COST[level],seconds:CENTER_TIME[level]}:{boxes:Math.ceil(BASE_COST[level]*(FACTOR[key]||1)/10)*10,seconds:BASE_TIME[level]};}
