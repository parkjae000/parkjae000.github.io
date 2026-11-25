import {FORCE_IDS,capacity} from './progression.mjs?v=td-ux-12';
import {rosterTotal,rosterOf,capacityUsed} from './production.mjs?v=td-ux-12';
// Preview only: all live orders and currency remain server owned.
export function productionPreview(g,c,quote,now=Date.now()){
 const at=Math.max(now,quote.endAt||now),current=rosterTotal(rosterOf(c));let queued=0,recovered=0;
 for(const role of FORCE_IDS)for(const job of c.production?.[role]||[]){
  if(job.nextAt>at)continue;
  queued+=Math.min(job.remaining,(Math.floor((at-job.nextAt)/job.cycleMs)+1)*job.batch);
 }
 for(const wound of c.wounded||[])if(wound.endAt<=at)recovered+=rosterTotal(wound.counts);
 const added=Math.max(0,Number(quote.amount)||0),after=current+queued+recovered+added,cap=capacity(g),used=capacityUsed(c);
 return {current,queued,recovered,added,after,capacity:cap,used,usedAfter:used+added,percent:Math.round(after/cap*100),at,overCapacity:used+added>cap,activeBattle:!!c.pending};
}
