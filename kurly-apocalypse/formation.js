// Mirrored to public/formation.js for exact client previews. Server derives all counts.
export const FORMATIONS=[
 {id:'balanced',name:'밸런스형',weights:[1,1,1],image:'formation-balanced',description:'돌격·방어·해체를 고르게 편성'},
 {id:'attack',name:'공격 특화형',weights:[3,1,1],image:'formation-attack',description:'돌격 사원을 중심으로 편성'},
 {id:'defense',name:'수비 특화형',weights:[1,3,1],image:'formation-defense',description:'방어 사원을 중심으로 편성'},
 {id:'demolition',name:'해체 특화형',weights:[1,1,3],image:'formation-demolition',description:'시설 해체 사원을 중심으로 편성'}
];
export const TROOP_ROLES=[{id:'assault',name:'돌격',color:'#e88a64'},{id:'support',name:'방어',color:'#6bbf9d'},{id:'engineer',name:'해체',color:'#dbaa51'}];
export function buildFormation(amount,preset='balanced'){
 const spec=FORMATIONS.find(s=>s.id===preset);if(!spec||!Number.isSafeInteger(amount)||amount<0)throw new Error('편성 인원과 유형을 확인해 주세요.');
 const total=spec.weights.reduce((s,w)=>s+w,0),shares=spec.weights.map((w,i)=>({i,value:amount*w/total})),counts=shares.map(s=>Math.floor(s.value));
 let remainder=amount-counts.reduce((s,n)=>s+n,0);shares.sort((a,b)=>(b.value-Math.floor(b.value))-(a.value-Math.floor(a.value))||spec.weights[b.i]-spec.weights[a.i]||a.i-b.i);
 for(let i=0;i<remainder;i++)counts[shares[i].i]++;
 return {preset,amount,roles:Object.fromEntries(TROOP_ROLES.map((r,i)=>[r.id,counts[i]]))};
}
export function formationFactors(formation){
 const r=formation.roles,n=formation.amount||1;
 return {hp:(r.assault*.92+r.support*1.15+r.engineer)/n,attack:(r.assault*1.1+r.support*.9+r.engineer*.85)/n,siegeAttack:(r.assault*1.1+r.support*.9+r.engineer*.85*1.5)/n};
}
