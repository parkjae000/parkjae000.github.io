// Mirrored to public/formation.js for exact client previews. Server derives all counts.
export const FORMATIONS=[
 {id:'balanced',name:'밸런스형',weights:[1,1,1],image:'formation-balanced',description:'근접·방패병·원거리를 고르게 편성'},
 {id:'attack',name:'근접 특화형',weights:[3,1,1],image:'formation-attack',description:'창을 든 근접 사원을 중심으로 편성'},
 {id:'defense',name:'방패 특화형',weights:[1,3,1],image:'formation-defense',description:'전열을 지키는 방패병을 중심으로 편성'},
 {id:'demolition',name:'원거리 특화형',weights:[1,1,3],image:'formation-demolition',description:'총을 든 원거리 사원을 중심으로 편성'}
];
export const TROOP_ROLES=[{id:'assault',name:'근접',color:'#e88a64'},{id:'support',name:'방패병',color:'#6bbf9d'},{id:'engineer',name:'원거리',color:'#dbaa51'}];
export function buildFormation(amount,preset='balanced'){
 const spec=FORMATIONS.find(s=>s.id===preset);if(!spec||!Number.isSafeInteger(amount)||amount<0)throw new Error('편성 인원과 유형을 확인해 주세요.');
 const total=spec.weights.reduce((s,w)=>s+w,0),shares=spec.weights.map((w,i)=>({i,value:amount*w/total})),counts=shares.map(s=>Math.floor(s.value));
 let remainder=amount-counts.reduce((s,n)=>s+n,0);shares.sort((a,b)=>(b.value-Math.floor(b.value))-(a.value-Math.floor(a.value))||spec.weights[b.i]-spec.weights[a.i]||a.i-b.i);
 for(let i=0;i<remainder;i++)counts[shares[i].i]++;
 return {preset,amount,roles:Object.fromEntries(TROOP_ROLES.map((r,i)=>[r.id,counts[i]]))};
}
// Stable role IDs preserve saved formations: assault=spear, support=shield, engineer=ranged.
export const ROLE_ORDER=['support','assault','engineer'];
export const ROLE_SPECS={support:{weapon:'shield',range:.05,hp:1.4,damage:.65,interval:1.35},assault:{weapon:'spear',range:.098,hp:1,damage:1.1,interval:1.1},engineer:{weapon:'ranged',range:.235,hp:.8,damage:1,interval:1}};
export const HERO_RANGE=id=>['frozen','chilled','cs','beauty'].includes(id)?.235:.098;
export function formationFactors(formation,classes=null){
 const n=formation.amount||1,r=formation.roles;
 return {hp:ROLE_ORDER.reduce((v,k)=>v+(r[k]||0)*(classes?.[k]?.hpFactor??ROLE_SPECS[k].hp),0)/n,attack:ROLE_ORDER.reduce((v,k)=>v+(r[k]||0)*(classes?.[k]?.dpsFactor??ROLE_SPECS[k].damage/ROLE_SPECS[k].interval),0)/n,siegeAttack:ROLE_ORDER.reduce((v,k)=>v+(r[k]||0)*(classes?.[k]?.dpsFactor??ROLE_SPECS[k].damage/ROLE_SPECS[k].interval),0)/n};
}
