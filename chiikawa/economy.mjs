// Shared by the live client and the save service.
import {MILESTONES} from './main-mine.mjs';
export const ECONOMY_VERSION='1.3.0';
export const COLS=7,CAPACITY=8;
export const CHARACTERS=[{name:'우사기',idle:2,hit:5},{name:'하치와레',idle:1,hit:4},{name:'치이카와',idle:0,hit:3}];
export const appearance=level=>CHARACTERS[(Math.max(1,Math.floor(level))-1)%3];
export const startingGold=()=>80;
// Display names follow the snack theme. Campaign milestone and cost rows are keyed to the corresponding shaft.
const PRODUCTS=[
 ['forge','기본 찻집','🍵',1,2,16],['tea','숲속 찻집','🫖',2,6,10],['bakery','간식 공방','🥐',3,12,11],
 ['candy','별사탕 가게','🍬',4,24,11],['honey','꿀단지 가게','🍯',6,48,10],['jam','과일잼 공방','🍓',9,90,11],
 ['pudding','푸딩 가게','🍮',12,180,10],['waffle','와플 공방','🧇',20,270,11],['mochi','경단 가게','🍡',30,420,10],
 ['cake','케이크 공방','🍰',45,720,11],['cocoa','코코아 가게','☕',60,1080,10],['berry','베리 타르트 공방','🫐',80,1440,11],['parfait','파르페 가게','🍨',100,1800,10]
];
const BASE=Object.fromEntries(PRODUCTS.map(([id,name,product,stage,cycle,art],index)=>{
 const growth=1.43+index*.03,first=MILESTONES[id][0],steps=first[0]-1;
 const cost=Math.round(first[2]*(growth-1)/(growth**steps-1));
 return [id,{id,name,product,stage,cycle,tier:index,art,growth,cost,yield:index?Math.round(cost*cycle/8):9}];
}));
export const facilityDef=id=>BASE[id];
export const maxFacilityLevel=id=>MILESTONES[id].at(-1)[0];
export const maxCardLevel=id=>id==='capacity'?4:id==='goldenCannon'?5:BASE[id]?14:id.startsWith('manager-')?12:20;
export const cardName=id=>BASE[id]?BASE[id].name+' 매뉴얼':id.startsWith('manager-')?BASE[id.slice(8)].name+' 숙련 매뉴얼':({capacity:'친구 정원 확장',pickaxe:'숙련 작업',discount:'채용 협약',goldenCannon:'황금 대포',speed:'쾌속 운반',delivery:'배달 시계',profit:'황금 수레',critChance:'정밀 채굴',critDamage:'강력한 일격'})[id];
export function prepareCards(s){
 const ids=['pickaxe','discount','capacity','forge','tea','bakery'];
 for(const d of Object.values(BASE))if(s.stage>=d.stage){ids.push(d.id);if(d.tier&&(s.stage>=d.stage+6||d.id==='tea'&&s.stage>=6))ids.push('manager-'+d.id);}
 for(const [id,stage] of [['speed',3],['delivery',4],['profit',6],['critChance',8],['critDamage',12],['goldenCannon',50]])if(s.stage>=stage)ids.push(id);
 for(const id of ids)s.cards[id]??={level:0,count:0};
}
export function automation(s,id){
 const firstShaft={2:['tea',1],3:['tea',2],4:['tea',3],5:['tea',4],6:['manager-tea',3],8:['manager-tea',4],9:['tea',5]};
 if(id==='tea'&&s.stage>=67&&s.stage<=74)return {card:'tea',level:13};
 if(id==='tea'&&s.stage>=76&&s.stage<=95)return {card:'manager-tea',level:11};
 if(id==='tea'&&firstShaft[s.stage]){const [card,level]=firstShaft[s.stage];return {card,level};}
 const d=BASE[id],age=Math.max(0,s.stage-d.stage),expert=age>=6 && Math.floor((age-6)/4)%2===0;
 return {card:expert?'manager-'+id:id,level:Math.min(expert?12:14,1+Math.floor(age/6)+(expert?0:Math.min(d.tier-1,2)))};
}
const researchLevel=(s,id)=>s.cards[id]?.level||0;
export const facilityCycle=(s,f)=>BASE[f.id].cycle/(1+.1*researchLevel(s,'speed'));
export function milestoneBar(f){
 const table=MILESTONES[f.id],index=table.findIndex(([level])=>level>f.level);
 if(index<0){const level=table.at(-1)[0];return {previous:level,next:level,interval:0,progress:1,bonus:1};}
 const [next,bonus]=table[index],previous=index?table[index-1][0]:0;
 return {previous,next,interval:next-previous,progress:(f.level-previous)/(next-previous),bonus};
}
const payouts=Object.fromEntries(Object.entries(MILESTONES).map(([id,rows])=>{
 let m=1,i=0;return [id,Array.from({length:rows.at(-1)[0]+1},(_,level)=>{if(rows[i]?.[0]===level)m*=rows[i++][1];return m;})];
}));
export const milestones=f=>payouts[f.id][Math.min(maxFacilityLevel(f.id),f.level)]*(f.earnedMultiplier||1);
export const hiresPerLevel=8;
export const hireLevel=s=>Math.min(40,1+researchLevel(s,'goldenCannon')+Math.floor(s.hires/hiresPerLevel)+s.checkpoints.filter(t=>t.done).length+(s.hireBonus||0));
export const cannonLevel=s=>Math.max(1,hireLevel(s)-1);
export const capacity=s=>CAPACITY+Math.min(4,researchLevel(s,'capacity'));
export const hirePrice=s=>Math.ceil(8*4**Math.min(475,Math.max(0,s.hires-(s.hirePriceAnchor||0)))*(s.hirePriceFactor??1)*.85**s.checkpoints.filter(t=>t.done).length*.94**researchLevel(s,'discount'));
export const workerPower=(s,w)=>4*2.1**(w.level-1)*1.18**researchLevel(s,'pickaxe')*(1+.025*researchLevel(s,'critChance')*(1+.25*researchLevel(s,'critDamage')));
export const cycleYield=(s,f)=>Math.max(1,Math.round(BASE[f.id].yield*(f.payoutScale||1)*1.12**(f.level-1)*milestones(f)*3**researchLevel(s,f.id)*4**researchLevel(s,'manager-'+f.id)*1.35**researchLevel(s,'profit')));
export const facilityRate=(s,f)=>cycleYield(s,f)/facilityCycle(s,f);
// Geometric single-level prices distribute the published block totals. Rounded prefix differences keep bulk and individual buys equal.
const prices=Object.fromEntries(Object.entries(MILESTONES).map(([id,rows])=>{
 const result=[],growth=BASE[id].growth;let start=1;
 for(const [end,,block] of rows){const span=end-start;let previous=0;for(let step=1;step<=span;step++){
  const prefix=Math.round(block*(growth**step-1)/(growth**span-1));result[start+step-1]=Math.max(1,prefix-previous);previous=prefix;
 } start=end;}return [id,result];
}));
export const upgradePrice=(s,f,level=f.level)=>Math.ceil((prices[f.id][level]??0)*(f.priceScale||1));
export function quoteUpgrade(s,f,limit=200){
 if(!f.active||f.level>=maxFacilityLevel(f.id))return {count:0,cost:0};
 const remaining=Math.min(limit,milestoneBar(f).next-f.level);let count=0,cost=0;
 while(count<remaining){const price=upgradePrice(s,f,f.level+count);if(cost+price>s.gold+1e-7)break;cost+=price;count++;}
 return {count,cost:count?cost:upgradePrice(s,f)};
}
// Approximate community timing observations for ordinary rocks, normalized to a Lv.1 worker.
const ROCK_SECONDS=[0,20,40,180,420,1260,3960,16680,76200,252000,460440,743400,1333584,2433600];
function rockSeconds(level){return ROCK_SECONDS[level]??ROCK_SECONDS.at(-1)*1.65**(level-13);}
const id=s=>'u'+(++s.sequence);
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
const error=text=>{throw new Error(text);};
// Each band adds a checkpoint. Between checkpoints, ore rows grow gradually.
const MAP_BANDS=[
 {from:4,segments:2,ore:16,every:2},{from:12,segments:3,ore:24,every:2},
 {from:30,segments:4,ore:32,every:3},{from:60,segments:5,ore:42,every:4},
 {from:100,segments:6,ore:52,every:6}
];
export function mapPlan(stage){
 const band=MAP_BANDS.findLast(b=>stage>=b.from);
 const count=band?.segments??1;
 const ore=band?band.ore+Math.floor((Math.min(stage,200)-band.from)/band.every):[5,8,9][stage-1];
 let bottom=ore+4*(count-1)-1;
 return Array.from({length:count},(_,index)=>{
  const rows=Math.floor(ore/count)+Number((index+stage)%count<ore%count);
  const segment={index,top:bottom-rows+1,bottom,campRow:bottom+1};
  bottom=segment.top-5;
  return segment;
 });
}
function layoutRoll(stage,x,y){
 let n=Math.imul(stage,73856093)^Math.imul(x+13,19349663)^Math.imul(y+17,83492791);
 n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0;
}
export function createState(stage=2,seed=17,permanent=null){
 const segments=mapPlan(stage),rows=segments[0].bottom+1;
 const s={version:ECONOMY_VERSION,stage,seed,sequence:0,rows,segments,camp:{segment:0,row:segments[0].campRow,moves:0},gold:startingGold(stage),elixir:60,gems:96,hires:0,elapsed:0,freeAt:2400,barrelAt:25,barrel:null,auto:false,cards:Object.fromEntries(['forge','tea','bakery','pickaxe','discount','capacity'].map(k=>[k,{level:0,count:k==='capacity'?0:8}])),friends:[],rocks:[],bedrock:[],facilities:[],checkpoints:[],ledger:{forge:0,tea:0,bakery:0,rocks:0,barrels:0},merges:0,wheel:{free:false,extra:0,nextAt:0},shop:{freeAt:0},cleared:false};
 if(permanent){for(const k of ['elixir','gems','cards','wheel','shop'])s[k]=structuredClone(permanent[k]);s.wheel.nextAt=Math.max(0,s.wheel.nextAt-permanent.elapsed);s.shop.freeAt=Math.max(0,s.shop.freeAt-permanent.elapsed);}
 s.facilities=[{id:'forge',level:1,active:true,repaired:true,auto:true,progress:0,ready:0,hp:0,max:0,footprint:[]}];
 prepareCards(s);
 const available=Object.values(BASE).filter(d=>d.tier&&stage>=d.stage&&!(stage===7&&d.id==='tea'));
 const slots=segments.length*2;
 const selected=available.length>slots?[...available.slice(0,1),...available.slice(1-slots)]:available;
 for(const [i,d] of selected.entries()){
  const segment=segments[Math.min(segments.length-1,Math.floor(i*segments.length/selected.length))],right=i%2===1;
  const start=segment.top+(stage<4?(right?1:3):layoutRoll(stage,i,2)%Math.max(1,segment.bottom-segment.top-3));
  const hp=Math.ceil(4*rockSeconds(Math.min(14,Math.max(2,d.tier+1))));
  s.ledger[d.id]=0;
  s.facilities.push({id:d.id,level:1,active:false,repaired:false,auto:false,progress:0,ready:0,hp,max:hp,port:[right?4:2,start+2],visual:{x:right?5.7:.3,y:start+1.1},footprint:Array.from({length:6},(_,j)=>[right?5+j%2:j%2,start+1+Math.floor(j/2)])});
 }
 // Permanent outcrops occupy real tiles. Keep facility doors and a route around each outcrop diggable.
 if(stage>=3)for(const seg of segments){
  const first=seg.top+1+layoutRoll(stage,seg.index,63)%2;
  for(let y=first;y<seg.bottom;y+=4){
   const right=layoutRoll(stage,seg.index,y)%2,edge=right?6:0,dir=right?-1:1;
   const besideShaft=s.facilities.some(f=>f.footprint.some(([,fy])=>fy===y));
   const width=2+layoutRoll(stage,edge,y)%(stage>=4&&!besideShaft?3:2);
   for(let j=0;j<width;j++){
    const x=edge+dir*j;
    if(s.facilities.some(f=>f.port?.[0]===x&&f.port[1]===y||f.footprint.some(([fx,fy])=>fx===x&&fy===y)))continue;
    s.bedrock.push([x,y]);
   }
  }
 }
 const fixed=new Set(s.bedrock.map(p=>p.join(',')));
 for(const segment of segments)for(let y=segment.top;y<=segment.bottom;y++)for(let x=0;x<COLS;x++){
  if(fixed.has(x+','+y)||s.facilities.some(f=>f.footprint.some(p=>p[0]===x&&p[1]===y)))continue;
  const depth=segment.bottom-y+(segment.index*3),roll=layoutRoll(stage,x,y)%100,kind=roll<6?'chest':roll<20?'gold':roll<37?'crystal':'rock';
  const level=1+Math.min(5,Math.floor(Math.log2(stage)/1.5))+Math.floor((segment.bottom-y)/3)+segment.index*2;
  const hp=Math.round(4*rockSeconds(level)*(kind==='crystal'?1.3:kind==='gold'?1.2:1));
  s.rocks.push({id:'r'+x+'-'+y,x,y,kind,type:{rock:6,crystal:7,gold:8,chest:9}[kind],level,hp,max:hp,depth,done:false});
 }
 for(const segment of segments.slice(1)){const hp=Math.ceil(4*rockSeconds(2+segment.index*2));s.checkpoints.push({id:'checkpoint-'+segment.index,x:2+layoutRoll(stage,segment.index,9)%3,y:segment.campRow+3,toSegment:segment.index,hp,max:hp,done:false,kind:'checkpoint'});}
 // Compatibility alias for older read-only audits; real layout uses the checkpoint array.
 s.checkpoint=s.checkpoints[0]||{id:'no-checkpoint',done:true};
 const hp=Math.ceil(4*rockSeconds(2+Math.min(5,Math.floor(Math.log2(stage)/1.5))+2*(segments.length-1))*1.5);s.exit={id:'exit',x:3,y:-1,hp,max:hp,done:false,kind:'exit'};
 for(let i=0;i<3;i++){
  const w={id:id(s),level:hireLevel(s),x:2+i,y:s.camp.row,target:null,paused:false};
  mineNearby(s,w);s.friends.push(w);
 }
 return s;
}
export const occupiedSlots = s => s.friends.length;
export function crewInfo(s){
 const parcels=s.workerBarrels||[],sorted=[...s.friends].sort((a,b)=>a.level-b.level);
 const pair=sorted.find((w,i)=>w.level<40&&sorted[i+1]?.level===w.level);
 const lowest=sorted.find(w=>w.level<40),full=occupiedSlots(s)>=capacity(s);
 const missing=lowest&&lowest.level<cannonLevel(s)-1&&
  !sorted.some(w=>w!==lowest&&w.level===lowest.level)&&!parcels.some(b=>b.level===lowest.level);
 return {pair,lowest,partner:missing?lowest:null,full,stranded:full&&!pair&&!!lowest};
}
export const deliveryInterval = s => 2400 / (1+.1*researchLevel(s,'delivery')) * .9 ** s.checkpoints.filter(gate => gate.done).length;
export const targets=s=>[...s.rocks.filter(r=>!r.done),...s.facilities.filter(f=>!f.repaired),...s.checkpoints.filter(t=>!t.done),...(s.exit.done?[]:[s.exit])];
function campBlocked(s,x,y){return y>=s.camp.row+1&&y<=s.camp.row+2&&(x<=1||x>=5)&&!(x===6&&y===s.camp.row+1);}
export function openTiles(s){const blocked=new Set(s.rocks.filter(r=>!r.done).map(r=>r.x+','+r.y));for(const p of s.bedrock||[])blocked.add(p.join(','));for(const f of s.facilities)for(const p of f.footprint)blocked.add(p.join(','));for(const t of s.checkpoints)for(let x=0;x<COLS;x++)if(!t.done||Math.abs(x-t.x)>1)blocked.add(x+','+t.y);for(let y=s.camp.row+1;y<=s.camp.row+2;y++)for(let x=0;x<COLS;x++)if(campBlocked(s,x,y))blocked.add(x+','+y);
 const seen=new Set(),queue=[[3,s.camp.row]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i],k=x+','+y;if(seen.has(k)||blocked.has(k)||x<0||x>=COLS||y<0||y>s.rows+2)continue;seen.add(k);queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}return seen;
}
export const boardItems=s=>[...(s.barrel?[s.barrel]:[]),...(s.workerBarrels||[]),...(s.charges||[])];
export function freeTiles(s,except=null){
 const used=new Set([...s.friends,...boardItems(s)].filter(o=>o.id!==except?.id).map(o=>o.x+','+o.y));
 return [...openTiles(s)].filter(k=>!used.has(k)).map(k=>k.split(',').map(Number));
}
// Positions are relative to the active camp. Both the renderer and item placement use this footprint.
export const forgePanelCells=Object.freeze({left:2,right:4,top:1,bottom:2});
function underForgePanel(s,x,y){
 const rect=forgePanelCells,row=y-s.camp.row;
 return x>=rect.left&&x<=rect.right&&row>=rect.top&&row<=rect.bottom;
}
export const lootTiles=(s,except=null)=>freeTiles(s,except).filter(([x,y])=>!underForgePanel(s,x,y));
const landingCache=new WeakMap();
export function deliverySpot(s){
 const key=[s.camp.row,...s.friends,...boardItems(s)].map(o=>typeof o==='number'?o:o.x+','+o.y).join('/');
 const cached=landingCache.get(s);
 if(cached?.key===key)return cached.spot;
 let best=null,distance=Infinity;
 for(const [x,y] of lootTiles(s)){
  const d=Math.abs(6-x)+Math.abs(s.camp.row+1-y);
  if(d<distance){best={x,y};distance=d;}
 }
 landingCache.set(s,{key,spot:best});return best;
}
// Older inventory entries have no board coordinates. Keep each one until a tile opens.
export function placeStoredItems(s,relocate=false){
 const items=boardItems(s);
 for(const o of items)if(underForgePanel(s,o.x,o.y)||(relocate&&campBlocked(s,o.x,o.y))){delete o.x;delete o.y;}
 for(const item of items)if(!Number.isInteger(item.x)||!Number.isInteger(item.y)){
  const spot=deliverySpot(s);if(!spot)break;Object.assign(item,spot);
 }
}
export function moveCharge(s,id,x,y){
 const charge=s.charges?.find(c=>c.id===id);
 if(!charge||!lootTiles(s,charge).some(([cx,cy])=>cx===x&&cy===y))error('폭죽을 빈 바닥에 놓아 주세요.');
 Object.assign(charge,{x,y});return charge;
}
// Offsets from a target to the floor cells where a worker can stand.
export const EXIT_APPROACH=[[0,1],[-1,1],[1,1]];
const ordinaryApproach=[[0,1],[-1,0],[1,0],[0,-1]];
export const isWideGate=t=>t.id==='exit'||t.kind==='checkpoint';
const approachFor=t=>isWideGate(t)?EXIT_APPROACH:ordinaryApproach;
// A shop can be worked along any exposed edge of the tiles occupied by its building.
const facilityEdges=new WeakMap();
export function facilityApproaches(f){
 if(!f.footprint?.length)return f.port?[f.port]:[];
 const cached=facilityEdges.get(f.footprint);if(cached)return cached;
 const occupied=new Set(f.footprint.map(p=>p.join(','))),edge=new Map();
 for(const [x,y] of f.footprint)for(const [dx,dy] of ordinaryApproach){
  const tile=[x+dx,y+dy],key=tile.join(',');
  if(!occupied.has(key))edge.set(key,tile);
 }
 const positions=[...edge.values()];facilityEdges.set(f.footprint,positions);return positions;
}
export function spotFor(open,t,w=null){
 const spots=t.port?facilityApproaches(t):approachFor(t).map(([dx,dy])=>[t.x+dx,t.y+dy]);
 const reachable=spots.filter(p=>open.has(p.join(',')));
 const distance=p=>w?Math.abs(p[0]-w.x)+Math.abs(p[1]-w.y):-p[1];
 reachable.sort((a,b)=>distance(a)-distance(b));
 return reachable.length?{x:reachable[0][0],y:reachable[0][1]}:null;
}
export function destination(s,t,w=null){return spotFor(new Set(freeTiles(s,w).map(p=>p.join(','))),t,w);}
export function assign(s,workerId,targetId,preferred=null){const w=s.friends.find(w=>w.id===workerId),t=targets(s).find(t=>t.id===targetId);if(!w||!t)error('일할 친구와 대상을 다시 선택해 주세요.');const p=preferred?spotFor(new Set(freeTiles(s,w).map(tile=>tile.join(','))),t,preferred):destination(s,t,w);if(!p)error('앞의 바위를 캐서 연결된 작업 자리를 열어 주세요.');Object.assign(w,p);w.target=t.id;w.paused=false;return w;}
// Rock coordinates stay fixed for the lifetime of a board, including after mining.
const rockGrids=new WeakMap();
const neighbors=[[0,-1],[-1,0],[1,0],[0,1]];
function nearbyRock(s,w){
 let grid=rockGrids.get(s.rocks);
 if(!grid){
  grid=new Map(s.rocks.map(r=>[r.x+','+r.y,r]));
  rockGrids.set(s.rocks,grid);
 }
 let next=null;
 for(const [dx,dy] of neighbors){
  const rock=grid.get((w.x+dx)+','+(w.y+dy));
  if(!rock||rock.done)continue;
  if(rock.id===w.target)return rock;
  if(!next||rock.hp<next.hp)next=rock;
 }
 return next;
}
function mineNearby(s,w){
 const facility=s.facilities.find(f=>!f.repaired&&validTask(w,f));
 const gate=!s.exit.done&&validTask(w,s.exit)?s.exit:s.checkpoints.find(t=>!t.done&&validTask(w,t));
 const target=gate||facility||nearbyRock(s,w);
 w.target=target?.id??null;
 w.paused=!target;
 return target;
}
export function move(s,workerId,x,y){
 const w=s.friends.find(w=>w.id===workerId);
 if(!w||!freeTiles(s,w).some(p=>p[0]===x&&p[1]===y))error('연결된 빈 바닥에 놓아 주세요.');
 Object.assign(w,{x,y});
 mineNearby(s,w);
 return w;
}
export function spawnOrigin(s){return {x:3,y:s.camp.row};}
function addFriend(s,level=hireLevel(s),at=null){if(occupiedSlots(s)>=capacity(s))error('같은 레벨 친구 두 명을 합쳐 친구 정원을 비워 주세요.');const spot=at||deliverySpot(s),p=spot&&[spot.x,spot.y];if(!p)error('친구가 설 빈자리가 필요해요.');const w={id:id(s),level,x:p[0],y:p[1],target:null,paused:false};mineNearby(s,w);s.friends.push(w);return w;}
export function recruit(s){const price=hirePrice(s);if(s.gold<price)error('골드가 부족해요. 기본 찻집은 계속 생산해요.');const w=addFriend(s);s.gold-=price;s.hires++;return w;}
export function merge(s,aId,bId){const a=s.friends.find(w=>w.id===aId),b=s.friends.find(w=>w.id===bId);if(!a||!b||a===b||a.level!==b.level)error('같은 레벨 친구 두 명을 합쳐 주세요.');if(b.level>=40)error('최대 레벨이에요.');b.level++;
 const jobs=targets(s);
 const work=[b.target,a.target].map(id=>jobs.find(t=>t.id===id)).find(t=>t&&validTask(b,t));
 b.target=work?.id||null;b.paused=false;if(!work)mineNearby(s,b);s.friends=s.friends.filter(w=>w!==a);s.merges++;return b;}
export function upgrade(s,fId,count=null){const f=s.facilities.find(f=>f.id===fId);if(!f?.active)error('먼저 시설을 복구하고 가동해 주세요.');const q=quoteUpgrade(s,f,count??200);if(!q.count||count!=null&&q.count!==count)error('시설 강화에 필요한 골드가 부족해요.');const threshold=milestoneBar(f).next;s.gold-=q.cost;f.level+=q.count;const bonuses=Number(f.level===threshold);s.elixir+=bonuses*10;return {...q,bonuses,level:f.level};}
export function activate(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.repaired)error('친구가 가게 옆에서 가게를 다 캐야 열려요.');if(f.active)return f;f.active=true;if(s.stats)s.stats.activated=(s.stats.activated||0)+1;f.progress=0;s.elixir+=20;for(const c of ['tea','bakery'])s.cards[c].count+=2;return f;}
export function collect(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.ready)error('아직 생산 중이에요.');const amount=f.ready;s.gold+=amount;s.ledger[f.id]=(s.ledger[f.id]||0)+amount;f.ready=0;f.progress=0;return amount;}
export function researchCost(s,card){
 const level=s.cards[card].level;
 if(BASE[card]||card.startsWith('manager-')){
  const cards=[2,2,5,10,20,50,100,200,400,800,1200,2000,4000,8000];
  const prices=card.startsWith('manager-')?[12,100,200,400,1000,2400,4000,8000,16000,32000,64000,96000]:[12,50,100,200,300,400,800,1500,3000,6000,8000,24000,48000,72000];
  return {cards:cards[Math.min(level,cards.length-1)],elixir:prices[Math.min(level,prices.length-1)]};
 }
 return {cards:2+level*2,elixir:Math.ceil(12*1.55**level)};
}
export function cardPreview(s,card){
 const c=s.cards[card],cost=researchCost(s,card),cap=maxCardLevel(card);
 const next={...s,cards:{...s.cards,[card]:{...c,level:Math.min(cap,c.level+1)}}};
 const facility=BASE[card]||BASE[card.replace('manager-','')];
 let measure,label,unit,art=18;
 if(facility){const f=s.facilities.find(f=>f.id===facility.id)||{id:facility.id,level:1};measure=state=>cycleYield(state,f);label=facility.name+' · 1회 생산량';unit='골드';art=facility.art;}
 else if(card==='capacity'){measure=capacity;label='지도에 꺼낼 수 있는 친구';unit='칸';art=19;}
 else if(card==='goldenCannon'){measure=state=>1+researchLevel(state,card);label='새 동굴 첫 채용';unit='레벨';art=12;}
 else if(card==='speed'){measure=state=>Math.round(facilityCycle(state,{id:'tea'})*100)/100;label='숲속 찻집 한 번 생산하는 시간';unit='초';art=16;}
 else if(card==='profit'){measure=state=>facilityRate(state,s.facilities[0]);label='기본 찻집 초당 수입';unit='골드';art=16;}
 else if(card==='delivery'){measure=state=>Math.round(deliveryInterval(state));label='무료 친구 배달 간격';unit='초';art=12;}
 else if(card==='discount'){measure=hirePrice;label='현재 친구 채용 비용';unit='골드';art=19;}
 else if(card==='critChance'){measure=state=>2.5*researchLevel(state,card);label='평균 작업량에 반영되는 치명타 확률';unit='%';}
 else if(card==='critDamage'){measure=state=>2+.25*researchLevel(state,card);label='치명타 피해 배율';unit='배';}
 else {measure=state=>workerPower(state,{level:1});label='Lv.1 친구 작업 능력';unit='/초';}
 return {current:measure(s),next:measure(next),label,unit,cost,max:c.level>=cap,art};
}
export function research(s,card){
 const c=s.cards[card];if(!c||c.level>=maxCardLevel(card))error('최대 연구 레벨이에요.');
 const cost=researchCost(s,card);if(c.count<cost.cards||s.elixir<cost.elixir)error('카드 또는 연구 포인트가 부족해요.');
 const oldSpeed=1+.1*researchLevel(s,'speed'),oldDelivery=deliveryInterval(s);
 c.count-=cost.cards;s.elixir-=cost.elixir;c.level++;
 if(card==='speed')for(const f of s.facilities)f.progress*=oldSpeed/(1+.1*c.level);
 if(card==='delivery')s.freeAt=s.elapsed+Math.max(0,s.freeAt-s.elapsed)*deliveryInterval(s)/oldDelivery;
 return c;
}
export function automate(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.active)error('먼저 시설을 가동해 주세요.');const req=automation(s,f.id);if(researchLevel(s,req.card)<req.level)error(`${cardName(req.card)}을 Lv.${req.level}까지 연구해 주세요.`);if(f.ready)collect(s,fId);f.auto=true;return f;}
function forwardCamp(s,t){const segment=s.segments[t.toSegment];s.camp={segment:segment.index,row:segment.campRow,moves:s.camp.moves+1};placeStoredItems(s,true);for(const w of s.friends){if(w.target===t.id)w.target=null;if(!w.target||campBlocked(s,w.x,w.y)){const p=freeTiles(s,w).sort((a,b)=>Math.abs(a[1]-s.camp.row)*3+Math.abs(a[0]-3)-Math.abs(b[1]-s.camp.row)*3-Math.abs(b[0]-3))[0];if(p)Object.assign(w,{x:p[0],y:p[1],target:null});}}}
function destroyed(s,t){landingCache.delete(s);t.hp=0;if(t.port){t.repaired=true;activate(s,t.id);return;}t.done=true;if(t.id==='exit'){s.cleared=true;return;}if(t.kind==='checkpoint'){forwardCamp(s,t);s.elixir+=20;for(const c of Object.values(s.cards))c.count+=2;s.freeAt=Math.min(s.freeAt,s.elapsed+deliveryInterval(s));return;}const reward=Math.max(1,Math.round(regularIncome(s)*10*(1+.12*(t.level-1))*(t.kind==='gold'?1.5:1))); s.gold+=reward;s.ledger.rocks+=reward;s.elixir+=t.kind==='chest'?12:2;if(t.kind==='chest')for(let i=0;i<8;i++){const keys=Object.keys(s.cards);s.cards[keys[Math.floor(random(s)*keys.length)]].count++;}}
function validTask(w,t){
 if(t.port)return facilityApproaches(t).some(([x,y])=>w.x===x&&w.y===y);
 return approachFor(t).some(([dx,dy])=>w.x===t.x+dx&&w.y===t.y+dy);
}
function collectWork(s){
 const active=new Map(targets(s).map(t=>[t.id,t]));
 const work=new Map();
 for(const w of s.friends){
  let t=active.get(w.target);
  if(!t||!validTask(w,t))t=mineNearby(s,w);
  if(!t)continue;
  const item=work.get(t.id)||{t,power:0};
  item.power+=workerPower(s,w);
  work.set(t.id,item);
 }
 return work;
}
function dispatchDue(s){
 placeStoredItems(s);
 if(s.elapsed>=s.freeAt){
  const spot=deliverySpot(s);
  if(spot){(s.workerBarrels??=[]).push({id:id(s),level:cannonLevel(s),...spot});s.freeAt=s.elapsed+deliveryInterval(s);}
 }
 if(!s.barrel&&s.elapsed>=s.barrelAt){
  const spot=deliverySpot(s);
  if(spot)s.barrel={id:id(s),at:s.elapsed,...spot};
 }
}
export function advance(s,seconds){
 let remaining=Math.max(0,Math.min(seconds,8*3600)),iterations=0;
 const births=[];
 dispatchDue(s);
 let work=collectWork(s);
 while(remaining>1e-8&&iterations++<100000){
 const space=deliverySpot(s);
 let step=remaining;if(space&&!s.barrel&&s.barrelAt>s.elapsed)step=Math.min(step,s.barrelAt-s.elapsed);if(space&&s.freeAt>s.elapsed)step=Math.min(step,s.freeAt-s.elapsed);for(const {t,power}of work.values())step=Math.min(step,t.hp/power);if(step<1e-8)step=Math.min(remaining,1e-7);
 for(const f of s.facilities){
  if(!f.active||(!f.auto&&f.ready))continue;
  const cycle=facilityCycle(s,f),elapsed=f.progress+step,cycles=Math.floor((elapsed+1e-8)/cycle);
  if(!cycles){f.progress=elapsed;continue;}
  const amount=cycleYield(s,f);
  if(f.auto){const earned=amount*cycles;f.progress=Math.max(0,elapsed-cycles*cycle);s.gold+=earned;s.ledger[f.id]=(s.ledger[f.id]||0)+earned;}
  else {f.ready=amount;f.progress=0;}
 }
 for(const {t,power}of work.values())t.hp=Math.max(0,t.hp-power*step);if(!space)s.freeAt=Math.max(s.elapsed,s.freeAt)+step;
 s.elapsed+=step;remaining-=step;
 let finished=false;
 for(const {t} of work.values())if(t.hp<1e-6){destroyed(s,t);finished=true;}
 // Resolve simultaneous breaks before choosing neighbors, even at the exact end of a tick.
 if(finished)work=collectWork(s);
 dispatchDue(s);
 }if(iterations>=100000)error('정산 처리 한도를 넘었어요.');return {births};}
export function unpackWorker(s, barrelId) {
 const barrels=s.workerBarrels || [];
 const index=barrels.findIndex(barrel=>barrel.id===barrelId);
 if(index<0)error('이미 열었거나 아직 도착하지 않은 친구 보급이에요.');
 const [barrel]=barrels.splice(index,1);
 try { return addFriend(s,barrel.level,Number.isInteger(barrel.x)?barrel:null); }
 catch(err) { barrels.splice(index,0,barrel);throw err; }
}
export const regularIncome=s=>s.facilities.filter(f=>f.active&&f.auto).reduce((n,f)=>n+facilityRate(s,f),0);
export function chargePreview(s, chargeId, targetId) {
 const charge=s.charges?.find(item=>item.id===chargeId);
 const target=targets(s).find(item=>item.id===targetId);
 if(!charge||!target||!spotFor(openTiles(s),target))return null;
 if(target.port&&!s.friends.some(w=>w.target===target.id&&validTask(w,target)))return null;
 const damage=Math.min(target.hp,workerPower(s,charge)*300);
 return {damage,remaining:Math.max(0,target.hp-damage),target};
}
export function useCharge(s, chargeId, targetId) {
 const preview=chargePreview(s,chargeId,targetId);
 if(!preview)error('친구가 닿을 수 있는 바위·시설·문을 골라 주세요.');
 const {target,damage,remaining}=preview;
 s.charges=s.charges.filter(item=>item.id!==chargeId);
 target.hp=remaining;
 if(!remaining){
  destroyed(s,target);
  collectWork(s);
 }
 return {damage,cleared:remaining===0};
}
export function mergeCharges(s,aId,bId){
 const a=s.charges?.find(item=>item.id===aId),b=s.charges?.find(item=>item.id===bId);
 if(!a||!b||a===b||a.level!==b.level)error('같은 레벨 폭죽 두 개를 골라 주세요.');
 if(b.level>=Math.max(...s.friends.map(w=>w.level))+3)error('가장 높은 친구 레벨보다 3단계까지만 합칠 수 있어요.');
 b.level++;s.charges=s.charges.filter(item=>item!==a);
 return b;
}
export function openBarrel(s){
 if(!s.barrel)error('보급 배달을 기다려 주세요.');
 placeStoredItems(s);
 const box=s.barrel,at=Number.isInteger(box.x)?{x:box.x,y:box.y}:deliverySpot(s);
 const r=random(s),crew=crewInfo(s);let result;
 if(crew.stranded){
  // The incoming partner merges on contact without occupying a ninth tile.
  const w=crew.lowest;w.level++;s.merges++;
  result={type:'partner',text:'합성 짝 도착! Lv.'+(w.level-1)+' 친구가 Lv.'+w.level+'이 되었어요.'};
 }else if(at&&!crew.full&&(crew.partner||r<.15)){
  const level=crew.partner?.level??Math.max(1,cannonLevel(s)-1),w=addFriend(s,level,at);
  result={type:'worker',id:w.id,text:crew.partner?'혼자 남은 Lv.'+level+' 친구의 합성 짝이 도착했어요.':'Lv.'+level+' 친구가 도착했어요!'};
 }else if(at&&r>=.4&&r<.5&&(s.charges?.length||0)<4){
 const charge={...at,id:id(s),level:Math.max(1,...s.friends.map(w=>w.level))};
 (s.charges??=[]).push(charge);result={type:'charge',id:charge.id,text:'별사탕 폭죽 Lv.'+charge.level+' 획득! 바위로 끌어 놓으세요.'};
 }else if(r<.4){const amount=8+Math.floor(random(s)*12);s.elixir+=amount;result={type:'elixir',text:'연구 포인트 +'+amount};}else {const amount=Math.round(regularIncome(s)*20);s.gold+=amount;s.ledger.barrels+=amount;result={type:'gold',amount,text:'보급 골드 +'+Math.floor(amount).toLocaleString('ko-KR')};}s.barrel=null;s.barrelAt=s.elapsed+25;return result;}
export function readyForNext(s){return s.exit.done;}
export function nextMine(s){if(!readyForNext(s))error('출구 채굴을 먼저 마쳐 주세요.');return createState(s.stage+1,s.seed,s);}
export const WHEEL_REWARDS=[{type:'gems',amount:10,label:'보석 10'},{type:'elixir',amount:25,label:'연구 25'},{type:'cards',amount:4,label:'카드 4장'},{type:'time',amount:60,label:'시간 1분'},{type:'gems',amount:30,label:'보석 30'},{type:'elixir',amount:60,label:'연구 60'},{type:'cards',amount:8,label:'카드 8장'},{type:'worker',amount:1,label:'친구 +1레벨'}];
export function spin(s,extra=false){if(extra){if(s.wheel.extra>=5||s.elapsed<s.wheel.nextAt)error('추가 회전 준비 중이에요.');s.wheel.extra++;s.wheel.nextAt=s.elapsed+7200;}else {if(s.wheel.free)error('무료 회전을 이미 사용했어요.');s.wheel.free=true;}
 const index=Math.floor(random(s)*WHEEL_REWARDS.length),reward={...WHEEL_REWARDS[index],index};if(reward.type==='gems')s.gems+=reward.amount;else if(reward.type==='elixir')s.elixir+=reward.amount;else if(reward.type==='cards'){const keys=Object.keys(s.cards);for(let i=0;i<reward.amount;i++)s.cards[keys[Math.floor(random(s)*keys.length)]].count++;}else if(reward.type==='time')advance(s,reward.amount);else if(occupiedSlots(s)<capacity(s)&&deliverySpot(s))reward.id=addFriend(s,hireLevel(s)+1).id;else {s.elixir+=40;reward.label='정원 가득 · 연구 40';reward.type='elixir';reward.amount=40;}return reward;}
export function buy(s,offer){
 if(offer.startsWith('card-')){
  const id=offer.slice(5);
  if(s.cards[id]?.level>=maxCardLevel(id))error('이 카드는 이미 연구를 끝냈어요.');
 }
 let price=0,result={type:offer};if(offer==='free'){if(s.elapsed<s.shop.freeAt)error('무료 상자를 준비 중이에요.');s.shop.freeAt=s.elapsed+14400;s.elixir+=15;for(let i=0;i<3;i++){const keys=Object.keys(s.cards);s.cards[keys[Math.floor(random(s)*keys.length)]].count++;}result.text='카드 3장 · 연구 15를 받았어요.';return result;}
 if(offer==='chest')price=35;else if(offer==='research')price=25;else if(offer==='time')price=20;else if(offer.startsWith('card-')&&s.cards[offer.slice(5)])price=12;else error('상품을 다시 선택해 주세요.');if(s.gems<price)error('보석이 부족해요.');s.gems-=price;
 if(offer==='chest'){s.elixir+=60;for(const c of Object.values(s.cards))c.count+=2;result.text='카드 각 2장 · 연구 60을 받았어요.';}else if(offer==='research'){s.elixir+=80;result.text='연구 포인트 80을 받았어요.';}else if(offer==='time'){advance(s,300);result.text='시설 생산과 지정한 작업을 5분 진행했어요.';}else {s.cards[offer.slice(5)].count+=3;result.text='선택한 카드 3장을 받았어요.';}return result;
}

// Keep the current mine playable across the economy patch. Anchors expire when the player leaves it.
export function migrateEconomy(s){
 prepareCards(s);
 const scale=s.scale||1,oldBaseline=1+Math.floor((s.stage-1)/4);
 const oldHire=Math.min(30,oldBaseline+Math.floor(s.hires/10));
 s.hireBonus=Math.max(0,oldHire-hireLevel(s));
 s.hirePriceAnchor=s.hires;s.hirePriceFactor=45*scale*1.32**Math.min(s.hires,20)*1.08**Math.max(0,s.hires-20)/8;
 const old={forge:[4,12,35,1.18,10],tea:[6,48,60,1.16,20],bakery:[8,120,90,1.17,40]};
 for(const f of s.facilities){
  const [cycle,yieldBase,price,growth,interval]=old[f.id];
  const steps=s.version==='1.2.0'?Math.floor(f.level/interval):Math.max(Math.floor(f.level/interval),Number(f.level>=5)+Number(f.level>=10)+Math.floor(f.level/25));
  const previousYield=Math.max(1,Math.round(yieldBase*scale*1.08**(f.level-1)*2**steps*(f.earnedMultiplier||1)*1.25**researchLevel(s,f.id)));
  delete f.earnedMultiplier;
  f.payoutScale=previousYield*facilityCycle(s,f)/cycle/cycleYield(s,f);
  f.priceScale=price*scale*growth**(f.level-1)/upgradePrice(s,f);
  f.progress=Math.min(.999999,f.progress/cycle)*facilityCycle(s,f);
 }
}
