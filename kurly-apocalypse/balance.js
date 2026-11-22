// Shared economy: the browser previews the same rules the server enforces.
export const BALANCE_VERSION=5;
export const OFFLINE_MINING_MS=8*3600000;
export const CENTER_COST=[0,0,300,800,2000,5000,12000,27000,60000,135000,300000];
export const CENTER_TIME=[0,0,60,600,1800,7200,14400,28800,57600,86400,129600];
export const BASE_COST=[0,0,140,290,590,1210,2470,5070,10390,21300,43670];
export const BASE_TIME=[0,0,20,120,600,1800,5400,10800,21600,43200,86400];
export const FACTOR={mine:1.2,troopAtk:1,troopHp:1,troopSpeed:1.2,capacity:1.15,wall:1,turretDmg:1.25,turretSpeed:1.4,laborCost:1.5,lossDiscovery:2,mergeLuck:2.5};
export function upgradeCost(key,level){if(key==='careerLevel')return {boxes:[0,0,800,2400,7200,21600,64800][level],seconds:[0,0,600,3600,10800,28800,86400][level]};return key==='center'?{boxes:CENTER_COST[level],seconds:CENTER_TIME[level]}:{boxes:Math.ceil(BASE_COST[level]*(FACTOR[key]||1)/10)*10,seconds:BASE_TIME[level]};}
export function resourceBaseHp(zone,index){
 // The first parcel teaches the loop in 15 seconds. Deeper rows gradually slow down.
 if(zone===0){if(index===37)return 75;return [1800,1800,1800,1500,1200,900,450,150][Math.floor(index/5)];}
 return 1800*Math.pow(1.5,Math.min(zone,20));
}

export const MINING_RESEARCH=['laborCost','lossDiscovery','careerLevel','mergeLuck'];
export const researchMax=key=>key==='careerLevel'?6:10;
export function miningEconomy(g){const l=g.levels||{};return {costMultiplier:1-.04*((l.laborCost||1)-1),rewardMultiplier:1+.10*((l.lossDiscovery||1)-1),summonLevel:Math.min(6,l.careerLevel||1),mergeChance:.03*((l.mergeLuck||1)-1)};}
export function workerSummonCost(g){return g.onboarding?.stage==='summon'?0:Math.round(80*Math.pow(1.4,Math.min(g.summons,42))*miningEconomy(g).costMultiplier);}
export const miningReward=(g,base)=>Math.floor(base*miningEconomy(g).rewardMultiplier);
export function miningResearchEffect(key,level){const n=(level||1)-1;return {laborCost:`소환 비용 ${Math.round(n*4)}% 감소`,lossDiscovery:`자원 획득량 +${Math.round(n*10)}%`,careerLevel:`기본 소환 Lv.${Math.min(6,level||1)}`,mergeLuck:`2레벨 상승 확률 ${Math.round(n*3)}%`}[key]||'';}
