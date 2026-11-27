export const WORLD_CENTER={x:1200,y:900};
export const AREA_POSITIONS={dock:{x:800,y:680},depot:{x:1520,y:620},cold:{x:1760,y:980},hub:{x:1280,y:1370},'sector-1':{x:720,y:1100},'sector-2':{x:1140,y:420}};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function assignWorldPositions(entries){
 const occupied=Object.values(AREA_POSITIONS).map(x=>({...x}));
 for(const e of entries){const p=e.g.simple?.cycle?.position;if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))occupied.push(p);}
 for(const e of [...entries].sort((a,b)=>Number(a.row.created_at)-Number(b.row.created_at)||a.row.id.localeCompare(b.row.id))){
  const c=e.g.simple?.cycle;if(!c||c.position)continue;
  for(let i=0;i<10000;i++){const r=150+Math.sqrt(i)*105,angle=i*2.399963229728653,p={x:Math.round(WORLD_CENTER.x+Math.cos(angle)*r),y:Math.round(WORLD_CENTER.y+Math.sin(angle)*r*.75)};if(occupied.every(q=>distance(p,q)>155)){c.position=p;occupied.push(p);break;}}
 }
}
export function buildWorld(entries,areas,meId,now,endAt){
 const bases=entries.filter(e=>e.g.simple?.cycle?.position).map(e=>({id:e.row.id,kind:'base',name:e.row.nickname,...e.g.simple.cycle.position,level:e.g.td?.growth?.facilityLevels?.center||1,mine:e.row.id===meId,shieldUntil:e.g.td?.campaign?.shieldUntil||0}));
 const sites=areas.map((a,i)=>({...a,...(AREA_POSITIONS[a.id]||{x:650+i*180,y:1450}),kind:'area',level:a.level||1}));
 const nodes=[...bases,...sites],marches=[];
 for(const e of entries){const p=e.g.td?.campaign?.pending;if(!p)continue;const from=bases.find(b=>b.id===e.row.id),to=nodes.find(n=>n.id===(p.areaId||p.targetId));if(!from||!to)continue;const finish=endAt(p);marches.push({id:p.id,ownerId:e.row.id,name:e.row.nickname,mine:e.row.id===meId,from:{x:from.x,y:from.y},to:{x:to.x,y:to.y},startedAt:p.startedAt,arrivesAt:p.travel?.arrivesAt||p.startedAt+(finish-p.startedAt)*.65,endsAt:finish,targetId:to.id});}
 const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);return {meId,nodes,marches,serverTime:now,bounds:{left:Math.min(0,...xs)-200,top:Math.min(0,...ys)-200,right:Math.max(2400,...xs)+200,bottom:Math.max(1800,...ys)+200}};
}
export function routePlan(world,targetId,now){const from=world.nodes.find(n=>n.id===world.meId),to=world.nodes.find(n=>n.id===targetId);if(!from||!to)throw Error('지도 위치를 확인해 주세요.');const length=distance(from,to),durationMs=Math.max(3000,Math.min(18000,Math.round(length/60*1000)));return {from:{x:from.x,y:from.y},to:{x:to.x,y:to.y},distance:Math.round(length),startedAt:now,arrivesAt:now+durationMs,durationMs};}
export const directionFrame=(dx,dy)=>(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
export function marchPosition(march,now){const fraction=Math.max(0,Math.min(1,(now-march.startedAt)/Math.max(1,march.arrivesAt-march.startedAt)));return {x:march.from.x+(march.to.x-march.from.x)*fraction,y:march.from.y+(march.to.y-march.from.y)*fraction,fraction,frame:directionFrame(march.to.x-march.from.x,march.to.y-march.from.y),fighting:fraction===1&&now<march.endsAt};}
export function clusterNodes(nodes,camera,width,height){
 const visible=nodes.map(n=>({...n,sx:(n.x-camera.x)*camera.zoom+width/2,sy:(n.y-camera.y)*camera.zoom+height/2})).filter(n=>n.sx>-90&&n.sx<width+90&&n.sy>-100&&n.sy<height+100);
 if(camera.zoom>=.5)return visible.map(n=>({nodes:[n],sx:n.sx,sy:n.sy,x:n.x,y:n.y}));
 const groups=new Map();for(const n of visible){const key=n.mine?'mine:'+n.id:Math.floor(n.sx/70)+':'+Math.floor(n.sy/70)+':'+n.kind;const g=groups.get(key)||[];g.push(n);groups.set(key,g);}return [...groups.values()].map(group=>({nodes:group,sx:group.reduce((s,n)=>s+n.sx,0)/group.length,sy:group.reduce((s,n)=>s+n.sy,0)/group.length,x:group.reduce((s,n)=>s+n.x,0)/group.length,y:group.reduce((s,n)=>s+n.y,0)/group.length}));
}
