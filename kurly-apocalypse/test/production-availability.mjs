import {FORCE_IDS,capacity} from './progression.mjs?v=td-ux-16';
import {rosterOf,rosterTotal,capacityUsed,PRODUCTION_DEFS,productionQuote} from './production.mjs?v=td-ux-16';
export function productionAvailability(g,c){
 const ready=rosterOf(c),limit=capacity(g),used=capacityUsed(c),free=Math.max(0,limit-used),space=Math.floor(free/100)*100;
 const roles=Object.fromEntries(FORCE_IDS.map(role=>{
  const queue=c.production?.[role]||[],reserved=queue.reduce((n,j)=>n+j.remaining,0),budget=Math.floor(Math.max(0,g.boxes)/PRODUCTION_DEFS[role].unitCost/100)*100;
  const amount=queue.length>=5?0:Math.min(space,budget),reason=queue.length>=5?'예약 5건 대기 중':space<100?'수용 공간 없음':budget<100?'박스 부족':'';
  return [role,{ready:ready[role],reserved,available:amount,reason}];
 }));
 const readyTotal=rosterTotal(ready),reserved=FORCE_IDS.reduce((n,id)=>n+roles[id].reserved,0),other=Math.max(0,used-readyTotal-reserved);
 return {ready:readyTotal,reserved,other,used,limit,free,space,roles};
}
export function selectedProductionQuote(g,c,role,selection,now=Date.now()){
 const available=productionAvailability(g,c).roles[role].available;
 const cycles=selection==='max'&&available>0?{amount:available}:selection;
 return {quote:productionQuote(g,c,role,cycles,now),cycles};
}
