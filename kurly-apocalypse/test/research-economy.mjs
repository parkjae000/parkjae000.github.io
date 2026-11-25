import {legacyCost} from './legacy-costs.mjs?v=td-ux-17';
export const RESEARCH_ECONOMY_VERSION=2;
const EARLY_SECONDS=[0,0,20,60,120,300,600,900,1800,2700,3600];
export function researchCost(kind,id,target){
 if(kind==='capacity')return 200+4*(target-1);
 const base=kind==='force'?1000:1200,factor=kind==='force'?1.5:1.55;
 if(kind==='facility')return target<=10?legacyCost(id,target).boxes:Math.ceil(legacyCost(id,10).boxes*1.3**(target-10)/10)*10;
 return Math.round(base*factor**(Math.min(target,10)-2)*1.3**Math.max(0,target-10));
}
export function researchSeconds(kind,id,target){
 if(kind==='capacity')return 60;
 const base=target<=10?EARLY_SECONDS[target]:Math.ceil(3600*1.1**(target-10)/60)*60;
 return Math.min(kind==='facility'&&id==='center'?86400:28800,base*(kind==='facility'&&id==='center'?3:kind==='facility'&&id==='careerLevel'?4:1));
}
export function researchStaffCount(g){return g.staffPolicyVersion===2?Math.max(2,Math.min(3,g.staffCount||2)):(g.staffCount>=2?3:2);}
