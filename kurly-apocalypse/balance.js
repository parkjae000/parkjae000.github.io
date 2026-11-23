// Shared economy: the browser previews the same rules the server enforces.
export const BALANCE_VERSION=5;
export const OFFLINE_MINING_MS=8*3600000;
export const CENTER_COST=[0,0,300,800,2000,5000,12000,27000,60000,135000,300000];
export const CENTER_TIME=[0,0,60,600,1800,7200,14400,28800,57600,86400,129600];
export const BASE_COST=[0,0,140,290,590,1210,2470,5070,10390,21300,43670];
export const BASE_TIME=[0,0,20,120,600,1800,5400,10800,21600,43200,86400];
export const FACTOR={mine:1.2,troopAtk:1,troopHp:1,troopSpeed:1.2,capacity:1.15,wall:1,turretDmg:1.25,turretSpeed:1.4,laborCost:1.5,lossDiscovery:2,mergeLuck:2.5,wallReflect:1.6,wallRepair:1.8,troopCritChance:1.5,troopCritDmg:1.4,troopLeech:1.8};
export function upgradeCost(key,level){if(key==='careerLevel')return {boxes:[0,0,800,2400,7200,21600,64800][level],seconds:[0,0,600,3600,10800,28800,86400][level]};return key==='center'?{boxes:CENTER_COST[level],seconds:CENTER_TIME[level]}:{boxes:Math.ceil(BASE_COST[level]*(FACTOR[key]||1)/10)*10,seconds:BASE_TIME[level]};}
export function resourceBaseHp(zone,index){
 // The first parcel teaches the loop in 15 seconds. Deeper rows gradually slow down.
 if(zone===0){if(index===37)return 75;return [1800,1800,1800,1500,1200,900,450,150][Math.floor(index/5)];}
 return 1800*Math.pow(1.5,Math.min(zone,20));
}

export const MINING_RESEARCH=['laborCost','lossDiscovery','careerLevel','mergeLuck'];
export const researchMax=key=>key==='careerLevel'?6:10;
export function miningEconomy(g){const l=g.levels||{};return {costMultiplier:Math.max(.64,Math.min(1,1-.04*((l.laborCost||1)-1))),rewardMultiplier:1+.10*((l.lossDiscovery||1)-1),summonLevel:Math.min(6,l.careerLevel||1),mergeChance:.03*((l.mergeLuck||1)-1)};}
export function workerSummonCost(g){return g.onboarding?.stage==='summon'?0:Math.round(80*Math.pow(1.4,Math.min(g.summons,42))*miningEconomy(g).costMultiplier);}
export const miningReward=(g,base)=>Math.floor(base*miningEconomy(g).rewardMultiplier);
export function miningResearchEffect(key,level){const n=(level||1)-1;return {laborCost:`소환 비용 ${Math.min(36,Math.max(0,Math.round(n*4)))}% 감소 · 최대 36%`,lossDiscovery:`자원 획득량 +${Math.round(n*10)}%`,careerLevel:`기본 소환 Lv.${Math.min(6,level||1)}`,mergeLuck:`2레벨 상승 확률 ${Math.round(n*3)}%`}[key]||'';}

export const CLASS_RESEARCH=['rangedDamage','rangedPrecision','spearDamage','spearSpeed','shieldHp','shieldGuard'];
export const COMBAT_RESEARCH=[...CLASS_RESEARCH,'wallReflect','wallRepair','troopCritChance','troopCritDmg','troopLeech'];
export function combatBonuses(levels={}){const n=k=>Math.max(0,Math.min(9,(levels[k]||1)-1));return {wallReflect:.02*n('wallReflect'),wallRepair:.01*n('wallRepair'),critChance:.02*n('troopCritChance'),critDamage:1.5+.1*n('troopCritDmg'),lifeSteal:.01*n('troopLeech')};}
export function combatResearchEffect(key,level){const b=combatBonuses({[key]:level});return {wallReflect:`피해 반사 ${Math.round(b.wallReflect*100)}%`,wallRepair:`시간당 방벽 수리 ${Math.round(b.wallRepair*100)}%`,troopCritChance:`치명타 확률 ${Math.round(b.critChance*100)}%`,troopCritDmg:`치명타 피해 ${Math.round(b.critDamage*100)}%`,troopLeech:`피흡 ${Math.round(b.lifeSteal*100)}%`}[key]||'';}
export const wallMaximum=g=>450*Math.pow(1.12,g.levels.wall-1);
export function wallHealth(g){const max=wallMaximum(g),w=g.wallState;return w?Math.max(0,Math.min(max,w.hp/Math.max(1,w.max)*max)):max;}
export function repairWall(g,now){
 const max=wallMaximum(g);if(!g.wallState){g.wallState={hp:max,max,at:Math.trunc(now)};return;}
 const w=g.wallState,hp=wallHealth(g),elapsed=Math.max(0,now-w.at);
 w.hp=Math.min(max,hp+(g.pendingBattle||g.incomingRaid?0:max*combatBonuses(g.levels).wallRepair*elapsed/3600000));w.max=max;w.at=Math.max(w.at,Math.trunc(now));
}
export function saveWallDamage(g,hp,at,battleMax){const max=wallMaximum(g);g.wallState={hp:Math.max(0,Math.min(max,hp/Math.max(1,battleMax||max)*max)),max,at:Math.trunc(at)};}
export function marchPower(stats,hero,amount,factors=null){
 factors??=stats.classes?{hp:Object.values(stats.classes).reduce((v,s)=>v+s.hpFactor,0)/3,attack:Object.values(stats.classes).reduce((v,s)=>v+s.dpsFactor,0)/3,siegeAttack:Object.values(stats.classes).reduce((v,s)=>v+s.dpsFactor,0)/3}:{hp:1,attack:1,siegeAttack:1};
 const count=Math.max(0,Number(amount)||0),crit=1+(stats.critChance||0)*((stats.critDamage||1.5)-1);
 const troop=(stats.hp*factors.hp*.18+stats.damage/stats.interval*(factors.attack*.8+factors.siegeAttack*.2)*8*crit)*(1+(stats.lifeSteal||0)*.5);
 return Math.round(count*troop+(hero?(hero.hp*.18+hero.damage/hero.interval*8):0));
}

export function repairWallThroughUpgrades(g,now){
 const jobs=(g.upgrades||[]).filter(j=>j.endAt<=now&&['wall','wallRepair'].includes(j.key)).sort((a,b)=>a.endAt-b.endAt);
 for(const job of jobs){repairWall(g,job.endAt);g.levels[job.key]=Math.max(g.levels[job.key],job.target);repairWall(g,job.endAt);}
 repairWall(g,now);
}

// Specialization affects ordinary troops only; common research remains intact.
export function troopClasses(base,levels={}){
 const n=k=>Math.max(0,Math.min(9,(levels[k]||1)-1));
 const make=(hpFactor,dpsFactor,intervalFactor,extra={})=>({hp:base.hp*hpFactor,damage:base.damage*dpsFactor*intervalFactor,interval:base.interval*intervalFactor,hpFactor,dpsFactor,...extra});
 return {engineer:make(.8,Math.pow(1.06,n('rangedDamage')),1,{critChance:Math.min(.6,(base.critChance||0)+.015*n('rangedPrecision'))}),assault:make(1,Math.pow(1.06,n('spearDamage'))*Math.pow(1.025,n('spearSpeed')),1.1/Math.pow(1.025,n('spearSpeed'))),support:make(1.4*Math.pow(1.07,n('shieldHp')),.65/1.35,1.35,{reduction:Math.min(.18,.02*n('shieldGuard'))})};
}
export function classResearchEffect(key,level){const n=Math.max(0,Math.min(9,(level||1)-1));return {rangedDamage:`탄환 피해 +${Math.round((Math.pow(1.06,n)-1)*100)}%`,rangedPrecision:`치명타 확률 +${(n*1.5).toFixed(1)}%p`,spearDamage:`창 피해 +${Math.round((Math.pow(1.06,n)-1)*100)}%`,spearSpeed:`공격 속도 +${Math.round((Math.pow(1.025,n)-1)*100)}%`,shieldHp:`방패병 체력 +${Math.round((Math.pow(1.07,n)-1)*100)}%`,shieldGuard:`방패병 받는 피해 ${n*2}% 감소 · 최대 18%`}[key]||'';}
