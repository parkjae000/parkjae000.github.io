import {conquestTowerStats} from './conquest-stats.mjs?v=td-ux-14';
import {FORCE_IDS,FORCES,TOWER_DEFS,HERO_DEFS,towerStats,heroStats,MATCHUPS} from './progression.mjs?v=td-ux-14';
export function attackPower(growth,roster={}){
 const branches=FORCE_IDS.map(id=>{const count=Math.max(0,Number(roster[id])||0),level=growth.forceLevels[id]||1,hp=FORCES[id].hp*(1+.08*(level-1)),siege=FORCES[id].siege*(1+.07*(level-1)),perUnit=hp*.18+siege*8+FORCES[id].speed*.1;return {id,name:FORCES[id].name,count,level,hp,siege,perUnit,power:Math.round(count*perUnit)};});
 return {attack:branches.reduce((n,b)=>n+b.power,0),branches,count:branches.reduce((n,b)=>n+b.count,0)};
}
export function defensePower(growth,items=[],support=null,strength=1,conquest=false){
 const defenses=items.map(item=>{const tower=!!TOWER_DEFS[item.type],st=tower?(conquest?conquestTowerStats(growth,item.type):towerStats(growth,item.type)):HERO_DEFS[item.type]?heroStats(growth,item.type):null;if(!st)return null;
  const baseDps=st.damage/st.interval*st.hits,skillDps=tower?0:st.skillDamage/st.cooldown*st.hits*2.6,rangeFactor=st.globalRange?1.7:Math.min(1.8,.7+st.range/440),controlFactor=1+(['tesla','ice','frozen','chilled','cs','returns','beauty'].includes(item.type)?.15:0),matchup=Object.values(MATCHUPS[item.type]||{army:1,air:1,navy:1}).reduce((a,b)=>a+b,0)/3;
  const adjusted=conquest&&tower?conquestTowerStats(growth,item.type,support):null,rangeBoost=adjusted?Math.min(1.8,.7+adjusted.range/440)/rangeFactor:1,areaBoost=adjusted?adjusted.hits/st.hits:1;
  const base=(baseDps+skillDps)*strength*8*rangeFactor*controlFactor*matchup,boost=tower?(1+(support?.towerDamage||0))*(1+(support?.towerRate||0))*rangeBoost*areaBoost:1;
  return {id:item.id,type:item.type,name:st.name,kind:st.kind,level:st.level,star:st.star||0,base:Math.round(base),bonus:Math.round(base*boost)-Math.round(base),power:Math.round(base*boost)};
 }).filter(Boolean);
 return {defense:defenses.reduce((n,d)=>n+d.power,0),baseDefense:defenses.reduce((n,d)=>n+d.base,0),supportDefense:defenses.reduce((n,d)=>n+d.bonus,0),defenses};
}
export function combatPower(td){
 const c=td.campaign||{},roster=Object.fromEntries(FORCE_IDS.map(id=>[id,(c.roster?.[id]||0)+(c.pending?.forceTotals?.[id]||0)+(c.external?.[id]||0)])),a=attackPower(td.growth,roster),d=defensePower(td.growth,td.items);
 return {...a,...d,army:a.attack,total:a.attack+d.defense,basis:'td-power-1'};
}
