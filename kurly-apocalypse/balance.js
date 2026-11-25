// Shared economy: the browser previews the same rules the server enforces.
export const BALANCE_VERSION=5;
// Worker merges and starting-level research have separate ceilings.
export const WORKER_MAX_LEVEL=20;
export const SUMMON_MAX_LEVEL=6;
export const WORKER_LEVEL_MULTIPLIER=2.4;
export const workerBaseDps=level=>5*Math.pow(WORKER_LEVEL_MULTIPLIER,level-1);
export function workerMiningDps(worker,g){if(worker.parked)return 0;return workerBaseDps(worker.level)*Math.pow(1.2,(g.levels.mine||1)-1)*(1+.03*(g.captures||[]).length)*(1+.02*(g.miningMastery||0));}
export const canMergeWorkers=(a,b)=>!!a&&!!b&&a.id!==b.id&&a.level===b.level&&a.level<WORKER_MAX_LEVEL;
export const OFFLINE_MINING_MS=8*3600000;
export const RESEARCH_PREPARED_LEVEL=30;
// Extend only future levels; already paid prices and durations stay unchanged.
const extendResearch=(base,growth,unit)=>{for(let lv=base.length;lv<=RESEARCH_PREPARED_LEVEL;lv++)base.push(Math.ceil(base[10]*growth**(lv-10)/unit)*unit);return base;};
export const CENTER_COST=extendResearch([0,0,300,800,2000,5000,12000,27000,60000,135000,300000],1.65,10);
export const CENTER_TIME=extendResearch([0,0,60,600,1800,7200,14400,28800,57600,86400,129600],1.15,60);
export const BASE_COST=extendResearch([0,0,140,290,590,1210,2470,5070,10390,21300,43670],1.65,10);
export const BASE_TIME=extendResearch([0,0,20,120,600,1800,5400,10800,21600,43200,86400],1.15,60);
export const FACTOR={mine:1.2,troopAtk:1,troopHp:1,troopSpeed:1.2,capacity:1.15,wall:1,turretDmg:1.25,turretSpeed:1.4,laborCost:1.5,lossDiscovery:2,mergeLuck:2.5,wallReflect:1.6,wallRepair:1.8,troopCritChance:1.5,troopCritDmg:1.4,troopLeech:1.8};
export function upgradeCost(key,level){if(key==='careerLevel')return {boxes:[0,0,800,2400,7200,21600,64800][level],seconds:[0,0,600,3600,10800,28800,86400][level]};return key==='center'?{boxes:CENTER_COST[level],seconds:CENTER_TIME[level]}:{boxes:Math.ceil(BASE_COST[level]*(FACTOR[key]||1)/10)*10,seconds:BASE_TIME[level]};}
export function resourceBaseHp(zone,index){
 // The first parcel teaches the loop in 15 seconds. Deeper rows gradually slow down.
 if(zone===0){if(index===37)return 75;return [1800,1800,1800,1500,1200,900,450,150][Math.floor(index/5)];}
 const d=Math.max(0,zone-55);return 1800*Math.pow(1.5,Math.min(zone,20))*(1+.025*d+.00004*d*d);
}

export const MINING_RESEARCH=['laborCost','lossDiscovery','careerLevel','mergeLuck'];
export const researchMax=key=>key==='careerLevel'?SUMMON_MAX_LEVEL:['mine','lossDiscovery','center','wallRepair','wallReflect'].includes(key)?RESEARCH_PREPARED_LEVEL:20;
export const researchLimitKind=key=>key==='careerLevel'?'system':'prepared';
export const researchLimitLabel=key=>researchLimitKind(key)==='system'?`최대 Lv.${researchMax(key)}`:'추가 연구 준비 중';
export function miningEconomy(g){const l=g.levels||{};return {costMultiplier:Math.max(.24,Math.min(1,1-.04*((l.laborCost||1)-1))),rewardMultiplier:1+.10*((l.lossDiscovery||1)-1),maxWorkerLevel:WORKER_MAX_LEVEL,maxSummonLevel:SUMMON_MAX_LEVEL,summonLevel:Math.min(SUMMON_MAX_LEVEL,l.careerLevel||1),mergeChance:.03*((l.mergeLuck||1)-1)};}
// Existing and parked workers share the researched starting level, without losing merges.
export function enforceWorkerSummonFloor(g){
 const floor=miningEconomy(g).summonLevel;let changed=0;
 for(const worker of g.workers||[]){if(worker.level<floor){worker.level=floor;changed++;}}
 return changed;
}
export function workerSummonCost(g){const n=Math.max(0,Math.min(Number(g.summons)||0,42));return g.onboarding?.stage==='summon'?0:Math.round(80*Math.pow(1.4,Math.min(n,12))*Math.pow(1.04,Math.max(0,n-12))*miningEconomy(g).costMultiplier);}
export const miningReward=(g,base)=>Math.floor(base*miningEconomy(g).rewardMultiplier);
export function miningResearchEffect(key,level){const n=(level||1)-1;return {mine:`채굴 속도 ${Math.pow(1.2,n).toFixed(2)}배`,laborCost:`소환 비용 ${Math.min(76,Math.max(0,Math.round(n*4)))}% 감소`,lossDiscovery:`자원 획득량 +${Math.round(n*10)}%`,careerLevel:`기본 소환 Lv.${Math.min(SUMMON_MAX_LEVEL,level||1)}`,mergeLuck:`2레벨 상승 확률 ${Math.round(n*3)}%`}[key]||'';}

export const CLASS_TRAINING=[{"key": "rangedDamage", "group": "ranged", "name": "총병 공격력", "icon": "🔫", "desc": "탄환 피해 단계당 +6%"}, {"key": "rangedHp", "group": "ranged", "name": "총병 체력", "icon": "❤️", "desc": "체력 단계당 +7%"}, {"key": "rangedSpeed", "group": "ranged", "name": "총병 연사속도", "icon": "⚡", "desc": "공격 속도 단계당 +2.5%"}, {"key": "rangedPrecision", "group": "ranged", "name": "정밀 조준", "icon": "🎯", "desc": "치명타 확률 단계당 +1.5%p"}, {"key": "rangedCritDmg", "group": "ranged", "name": "급소 사격", "icon": "💥", "desc": "치명타 피해 단계당 +10%p"}, {"key": "spearDamage", "group": "spear", "name": "창병 공격력", "icon": "🔱", "desc": "창 피해 단계당 +6%"}, {"key": "spearHp", "group": "spear", "name": "창병 체력", "icon": "❤️", "desc": "체력 단계당 +7%"}, {"key": "spearSpeed", "group": "spear", "name": "연속 찌르기", "icon": "⚡", "desc": "공격 속도 단계당 +2.5%"}, {"key": "spearLeech", "group": "spear", "name": "전투 회복", "icon": "💚", "desc": "가한 피해의 회복 비율 단계당 +1%p"}, {"key": "shieldDamage", "group": "shield", "name": "방패병 공격력", "icon": "🛡", "desc": "방패 타격 피해 단계당 +6%"}, {"key": "shieldHp", "group": "shield", "name": "방패병 체력", "icon": "❤️", "desc": "체력 단계당 +7%"}, {"key": "shieldSpeed", "group": "shield", "name": "방패 타격속도", "icon": "⚡", "desc": "공격 속도 단계당 +2.5%"}, {"key": "shieldGuard", "group": "shield", "name": "방패 방어술", "icon": "🛡", "desc": "받는 피해 단계당 2% 감소"}];
export const CLASS_RESEARCH=CLASS_TRAINING.map(v=>v.key);
export const LEGACY_TRAINING=['troopAtk','troopHp','troopSpeed','troopCritChance','troopCritDmg','troopLeech'];
export const researchCenterRequired=key=>['rangedPrecision','rangedCritDmg','spearLeech','shieldGuard'].includes(key)?3:1;
export const COMBAT_RESEARCH=[...CLASS_RESEARCH,'wallReflect','wallRepair','troopCritChance','troopCritDmg','troopLeech'];
export function combatBonuses(levels={}){const n=k=>Math.max(0,Math.min(9,(levels[k]||1)-1)),active=k=>Math.max(0,Math.min(RESEARCH_PREPARED_LEVEL-1,(levels[k]||1)-1));return {wallReflect:.02*active('wallReflect'),wallRepair:.01*active('wallRepair'),critChance:.02*n('troopCritChance'),critDamage:1.5+.1*n('troopCritDmg'),lifeSteal:.01*n('troopLeech')};}
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
 const count=Math.max(0,Math.trunc(Number(amount)||0));let troop=0;
 if(stats.classes){const keys=['assault','support','engineer'],roles=factors?.roles||Object.fromEntries(keys.map((k,i)=>[k,Math.floor(count/3)+(i<count%3?1:0)]));for(const k of keys){const c=stats.classes[k],crit=1+(c.critChance??stats.critChance??0)*((c.critDamage??stats.critDamage??1.5)-1),dps=c.damage/c.interval*crit;troop+=(roles[k]||0)*(c.hp/Math.max(.1,1-(c.reduction||0))*.18+dps*8)*(1+(c.lifeSteal??stats.lifeSteal??0)*.5);}}
 else {factors??={hp:1,attack:1,siegeAttack:1};const crit=1+(stats.critChance||0)*((stats.critDamage||1.5)-1);troop=count*(stats.hp*factors.hp*.18+stats.damage/stats.interval*(factors.attack*.8+factors.siegeAttack*.2)*8*crit)*(1+(stats.lifeSteal||0)*.5);}
 return Math.round(troop+(hero?(hero.hp*.18+hero.damage/hero.interval*8):0));
}
export function centerPower(g){
 const l=g.levels,clamp=v=>Math.max(0,Math.min(1,v)),steps=RESEARCH_PREPARED_LEVEL-1,L=k=>Math.max(0,Math.min(steps,(l[k]||1)-1))/9;
 // Preserve every old score, including capped legacy foundations; add new levels above ten.
 const mean=(keys,legacy)=>keys.reduce((sum,k)=>sum+clamp(((l[k]||1)-1+(l[legacy]||1)-1)/9)+Math.max(0,Math.min(steps,(l[k]||1)-1)-9)/9,0)/3;
 const mining=0,defense=Math.round(3000*(.35*L('center')+.25*L('wall')+.25*L('turretDmg')+.15*L('turretSpeed'))),army=Math.round(3500*(.3*mean(['rangedDamage','spearDamage','shieldDamage'],'troopAtk')+.3*mean(['rangedHp','spearHp','shieldHp'],'troopHp')+.2*mean(['rangedSpeed','spearSpeed','shieldSpeed'],'troopSpeed')+.2*L('capacity'))),capture=0;
 return {total:Math.max(0,defense+army),mining,defense,army,capture};
}

export function repairWallThroughUpgrades(g,now){
 const jobs=(g.upgrades||[]).filter(j=>j.endAt<=now&&['wall','wallRepair'].includes(j.key)).sort((a,b)=>a.endAt-b.endAt);
 for(const job of jobs){repairWall(g,job.endAt);g.levels[job.key]=Math.max(g.levels[job.key],job.target);repairWall(g,job.endAt);}
 repairWall(g,now);
}

// Retired common levels remain as the saved foundation. All new training is class-specific.
export function troopClasses(base,levels={}){
 const n=k=>Math.max(0,Math.min(RESEARCH_PREPARED_LEVEL-1,(levels[k]||1)-1));
 const make=(role,hpFactor,dpsFactor,intervalFactor,extra={})=>({hp:base.hp*hpFactor,damage:base.damage*dpsFactor*intervalFactor,interval:base.interval*intervalFactor,hpFactor,dpsFactor,critChance:base.critChance||0,critDamage:base.critDamage||1.5,lifeSteal:base.lifeSteal||0,range:{engineer:.235,assault:.098,support:.05}[role],reduction:0,...extra});
 return {engineer:make('engineer',.8*Math.pow(1.07,n('rangedHp')),Math.pow(1.06,n('rangedDamage'))*Math.pow(1.025,n('rangedSpeed')),1/Math.pow(1.025,n('rangedSpeed')),{critChance:Math.min(.6,(base.critChance||0)+.015*n('rangedPrecision')),critDamage:(base.critDamage||1.5)+.1*n('rangedCritDmg')}),assault:make('assault',Math.pow(1.07,n('spearHp')),Math.pow(1.06,n('spearDamage'))*Math.pow(1.025,n('spearSpeed')),1.1/Math.pow(1.025,n('spearSpeed')),{lifeSteal:(base.lifeSteal||0)+.01*n('spearLeech')}),support:make('support',1.4*Math.pow(1.07,n('shieldHp')),.65/1.35*Math.pow(1.06,n('shieldDamage'))*Math.pow(1.025,n('shieldSpeed')),1.35/Math.pow(1.025,n('shieldSpeed')),{reduction:Math.min(.38,.02*n('shieldGuard'))})};
}
export function classResearchEffect(key,level){const n=Math.max(0,Math.min(RESEARCH_PREPARED_LEVEL-1,(level||1)-1)),def=CLASS_TRAINING.find(v=>v.key===key);if(!def)return '';if(key.endsWith('Damage'))return `공격 피해 +${Math.round((Math.pow(1.06,n)-1)*100)}%`;if(key.endsWith('Hp'))return `체력 +${Math.round((Math.pow(1.07,n)-1)*100)}%`;if(key.endsWith('Speed'))return `공격 속도 +${Math.round((Math.pow(1.025,n)-1)*1000)/10}%`;return {rangedPrecision:`치명타 확률 +${(n*1.5).toFixed(1)}%p`,rangedCritDmg:`치명타 피해 +${n*10}%p`,spearLeech:`피해 회복 ${n}%`,shieldGuard:`받는 피해 ${n*2}% 감소`}[key]||'';}


// A manual placement starts adjacent work immediately; it never triggers paid auto-travel.
export function adjacentMiningTarget(g,w){
 if(w.parked)return null;const options=[];
 for(const [dx,dy]of [[0,1],[-1,0],[1,0],[0,-1]]){const x=w.x+dx,y=w.y+dy;if(x<0||x>=5||y<0||y>=8)continue;const idx=y*5+x;if(g.mine.nodes[idx]&&!g.mine.nodes[idx].done)options.push({idx,x,y});}
 options.sort((a,b)=>b.y-a.y||a.x-b.x);
 return options[0]?.idx??(w.y===0&&w.x>=1&&w.x<=3&&g.mine.nodes.every(n=>n.done)&&!g.mine.gate?.done?'gate':null);
}

