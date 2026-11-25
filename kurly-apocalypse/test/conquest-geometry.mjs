export const CONQUEST_PLANS={balanced:{name:'균등 돌파',ratios:[.34,.33,.33]},center:{name:'중앙 집중',ratios:[.25,.5,.25]},wings:{name:'양익 공략',ratios:[.4,.2,.4]}};
export const LANE_NAMES=['북문','중문','남문'];
const vertices=[
 [[205,495],[270,495],[270,245],[460,245],[460,155],[730,155],[730,270],[1050,270],[1160,390],[1280,495],[1380,495]],
 [[205,495],[380,495],[500,415],[760,415],[900,495],[1050,495],[1280,495],[1380,495]],
 [[205,495],[270,495],[270,755],[460,755],[460,855],[730,855],[730,760],[1050,760],[1160,610],[1280,495],[1380,495]]
];
export function routeFromVertices(v){let length=0;const points=[];for(let k=0;k<v.length-1;k++){const a=v[k],b=v[k+1],distance=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(distance/5);for(let j=0;j<steps;j++){const f=j/steps;points.push({x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,s:length+distance*f});}length+=distance;}points.push({x:v.at(-1)[0],y:v.at(-1)[1],s:length});return {points,length};}
export const CONQUEST_ROUTES=vertices.map((v,i)=>{const route=routeFromVertices(v),gateIndex=i===1?5:7;return {...route,wallS:v.slice(0,gateIndex+1).reduce((n,p,k)=>k?n+Math.hypot(p[0]-v[k-1][0],p[1]-v[k-1][1]):0,0),wallPoint:{x:v[gateIndex][0],y:v[gateIndex][1]}};});
export function conquestPoint(route,distance,offset=0){const p=route.points;if(distance<0)return {x:p[0].x+distance,y:p[0].y+offset,angle:0};const d=Math.max(0,Math.min(route.length,distance));let lo=0,hi=p.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(p[mid].s<d)lo=mid;else hi=mid;}const a=p[lo],b=p[hi],f=(d-a.s)/Math.max(.001,b.s-a.s),angle=Math.atan2(b.y-a.y,b.x-a.x);return {x:a.x+(b.x-a.x)*f-Math.sin(angle)*offset,y:a.y+(b.y-a.y)*f+Math.cos(angle)*offset,angle};}
export const CONQUEST_PADS=[[390,325],[390,670],[640,320],[650,680],[600,515],[850,335],[850,620],[1000,170],[1000,840],[1000,620],[1200,400],[1200,600],[1000,390],[270,410],[400,140],[600,880]].map(([x,y],i)=>({id:'pad-'+i,x,y}));
function apportion(amount,weights){const total=weights.reduce((a,b)=>a+b,0),r=weights.map(w=>Math.floor(amount*w/total));let left=amount-r.reduce((a,b)=>a+b,0);const order=weights.map((w,i)=>({i,f:amount*w/total-r[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);for(const {i}of order)if(left-->0)r[i]++;return r;}
export function splitConquestRoster(counts,plan='balanced'){
 const roles=['army','air','navy'],weights=CONQUEST_PLANS[plan]?.ratios;if(!weights)throw Error('진입로 배분을 선택해 주세요.');const total=roles.reduce((n,id)=>n+counts[id],0);if(!Number.isSafeInteger(total)||total<3)throw Error('세 진입로에는 최소 3명의 병력이 필요해요.');const totals=apportion(total,weights),left={...counts},lanes=[];
 for(let i=0;i<3;i++){const allocation=i===2?roles.map(id=>left[id]):apportion(totals[i],roles.map(id=>left[id]));const roster=Object.fromEntries(roles.map((id,k)=>[id,allocation[k]]));roles.forEach(id=>left[id]-=roster[id]);lanes.push(roster);}return lanes;
}
