import {towerStats} from './progression.mjs?v=td-ux-18';
export const CONQUEST_RANGE_BONUS={cannon:150,tesla:135,ice:135,laser:150};
export function conquestTowerStats(growth,id,support=null){
 const personal=towerStats(growth,id),base={...personal,range:personal.range+CONQUEST_RANGE_BONUS[id]},area=support?.towerArea||0;
 const stats={...base,damage:base.damage*(1+(support?.towerDamage||0)),interval:base.interval/(1+(support?.towerRate||0)),range:base.range*(1+(support?.towerRange||0)),splash:base.splash*(1+area),hits:Math.ceil(base.hits*(1+area))};
 if(id==='laser')stats.beamWidth=base.beamWidth*(1+area);
 if(id==='tesla'){stats.chainRange=145*(1+area);stats.chainTargets=7+Math.floor(area*6);}
 return {...stats,personalStats:personal,baseStats:base};
}
