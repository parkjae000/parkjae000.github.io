// Shared mining rules. The server owns saved state and validates all commands.
export const ECONOMY_VERSION='1.2.0';
export const COLS=7,MAX_LEVEL=200,CAPACITY=8;
export const CHARACTERS=[{name:'우사기',idle:2,hit:5},{name:'하치와레',idle:1,hit:4},{name:'치이카와',idle:0,hit:3}];
export const appearance=level=>CHARACTERS[(Math.max(1,Math.floor(level))-1)%3];
export const scale=stage=>2.3**Math.floor((Math.min(stage,120)-1)/4)*1.055**Math.min(stage-1,120);
const BASE={forge:{name:'기본 찻집',yield:12,cycle:4,cost:35,growth:1.18,required:0,art:16},tea:{name:'숲속 찻집',yield:48,cycle:6,cost:60,growth:1.16,required:1,art:10},bakery:{name:'간식 공방',yield:120,cycle:8,cost:90,growth:1.17,required:2,art:11}};
export const facilityDef=id=>BASE[id];
const MILESTONE_INTERVAL={forge:10,tea:20,bakery:40};
export function milestoneBar(f){
 const interval=MILESTONE_INTERVAL[f.id],previous=Math.floor(f.level/interval)*interval;
 const next=Math.min(MAX_LEVEL,previous+interval);
 return {previous,next,interval,progress:f.level===MAX_LEVEL?1:(f.level-previous)/interval};
}
export function milestones(f){
 return 2**Math.floor(f.level/MILESTONE_INTERVAL[f.id])*(f.earnedMultiplier||1);
}
export function preserveEarnedMultipliers(facilities){
 for(const f of facilities){
  const oldSteps=Number(f.level>=5)+Number(f.level>=10)+Math.floor(f.level/25);
  f.earnedMultiplier=2**Math.max(0,oldSteps-Math.floor(f.level/MILESTONE_INTERVAL[f.id]));
 }
}
export const hireLevel=s=>Math.min(30,1+Math.floor((s.stage-1)/4)+Math.floor(s.hires/10));
export const cannonLevel=s=>Math.max(1,hireLevel(s)-1);
export const capacity=s=>CAPACITY+Math.min(4,s.cards.capacity?.level||0);
export const hirePrice=s=>Math.ceil(45*s.scale*1.32**Math.min(s.hires,20)*1.08**Math.max(0,s.hires-20)*.85**s.checkpoints.filter(t=>t.done).length*.94**s.cards.discount.level);
export const workerPower=(s,w)=>4*2.3**(w.level-1)*1.18**s.cards.pickaxe.level;
export const cycleYield=(s,f)=>Math.max(1,Math.round(BASE[f.id].yield*s.scale*1.08**(f.level-1)*milestones(f)*1.25**s.cards[f.id].level));
export const facilityRate=(s,f)=>cycleYield(s,f)/BASE[f.id].cycle;
export const upgradePrice=(s,f,level=f.level)=>Math.ceil(BASE[f.id].cost*s.scale*BASE[f.id].growth**(level-1));
export function quoteUpgrade(s,f,limit=200){if(!f.active||f.level>=MAX_LEVEL)return {count:0,cost:0};let count=0,cost=0;const remaining=milestoneBar(f).next-f.level;while(count<Math.min(limit,remaining)&&f.level+count<MAX_LEVEL){const next=upgradePrice(s,f,f.level+count);if(cost+next>s.gold+1e-7)break;cost+=next;count++;}return {count,cost:count?cost:upgradePrice(s,f)};}
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
 const s={version:ECONOMY_VERSION,stage,scale:scale(stage),seed,sequence:0,rows,segments,camp:{segment:0,row:segments[0].campRow,moves:0},gold:Math.round(240*scale(stage)),elixir:60,gems:96,hires:0,elapsed:0,freeAt:2400,barrelAt:25,barrel:null,auto:false,cards:Object.fromEntries(['forge','tea','bakery','pickaxe','discount','capacity'].map(k=>[k,{level:0,count:k==='capacity'?0:8}])),friends:[],rocks:[],bedrock:[],facilities:[],checkpoints:[],ledger:{forge:0,tea:0,bakery:0,rocks:0,barrels:0},merges:0,wheel:{free:false,extra:0,nextAt:0},shop:{freeAt:0},cleared:false};
 if(permanent){for(const k of ['elixir','gems','cards','wheel','shop'])s[k]=structuredClone(permanent[k]);s.wheel.nextAt=Math.max(0,s.wheel.nextAt-permanent.elapsed);s.shop.freeAt=Math.max(0,s.shop.freeAt-permanent.elapsed);}
 s.facilities=[{id:'forge',level:1,active:true,repaired:true,auto:true,progress:0,ready:0,hp:0,max:0,footprint:[]}];
 const workScale=Math.min(s.scale,2.8*2.3**(hireLevel(s)-1));
 const sideIds=stage===1?[]:stage===2?['tea']:['tea','bakery'];
 for(const [i,kind] of sideIds.entries()){
  const segment=i?segments.at(-1):segments[0],start=segment.top+(stage<4?(i?1:3):layoutRoll(stage,i,2)%(segment.bottom-segment.top-3)),hp=Math.ceil((stage<=2?180+i*80:400+i*180)*workScale);
  s.facilities.push({id:kind,level:1,active:false,repaired:false,auto:false,progress:0,ready:0,hp,max:hp,port:[i?4:2,start+2],visual:{x:i?5.7:.3,y:start+1.1},footprint:Array.from({length:6},(_,j)=>[i?5+j%2:j%2,start+1+Math.floor(j/2)])});
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
  const depth=segment.bottom-y+(segment.index*3),roll=layoutRoll(stage,x,y)%100,kind=roll<6?'chest':roll<20?'gold':roll<37?'crystal':'rock',hp=Math.ceil((stage<=2?40:100)*workScale*1.14**depth*(kind==='crystal'?1.3:kind==='gold'?1.2:1)*(1+(x%3)*.08));
  s.rocks.push({id:'r'+x+'-'+y,x,y,kind,type:{rock:6,crystal:7,gold:8,chest:9}[kind],level:1+Math.floor((stage-1)/4)+Math.floor(depth/2),hp,max:hp,depth,done:false});
 }
 for(const segment of segments.slice(1)){const hp=Math.ceil(220*workScale*(1+segment.index*.2));s.checkpoints.push({id:'checkpoint-'+segment.index,x:2+layoutRoll(stage,segment.index,9)%3,y:segment.campRow+3,toSegment:segment.index,hp,max:hp,done:false,kind:'checkpoint'});}
 // Compatibility alias for older read-only audits; real layout uses the checkpoint array.
 s.checkpoint=s.checkpoints[0]||{id:'no-checkpoint',done:true};
 const hp=Math.ceil((stage<=2?260:650)*workScale);s.exit={id:'exit',x:3,y:-1,hp,max:hp,done:false,kind:'exit'};
 for(let i=0;i<3;i++){
  const w={id:id(s),level:hireLevel(s),x:2+i,y:s.camp.row,target:null,paused:false};
  mineNearby(s,w);s.friends.push(w);
 }
 return s;
}
export const occupiedSlots = s => s.friends.length + (s.workerBarrels?.length || 0);
export function crewInfo(s){
 const parcels=s.workerBarrels||[],sorted=[...s.friends].sort((a,b)=>a.level-b.level);
 const pair=sorted.find((w,i)=>w.level<40&&sorted[i+1]?.level===w.level);
 const lowest=sorted.find(w=>w.level<40),full=occupiedSlots(s)>=capacity(s);
 const missing=lowest&&lowest.level<cannonLevel(s)-1&&
  !sorted.some(w=>w!==lowest&&w.level===lowest.level)&&!parcels.some(b=>b.level===lowest.level);
 return {pair,lowest,partner:missing?lowest:null,full,stranded:full&&!parcels.length&&!pair&&!!lowest};
}
export const deliveryInterval = s => 2400 * .9 ** s.checkpoints.filter(gate => gate.done).length;
export const targets=s=>[...s.rocks.filter(r=>!r.done),...s.facilities.filter(f=>!f.repaired),...s.checkpoints.filter(t=>!t.done),...(s.exit.done?[]:[s.exit])];
function campBlocked(s,x,y){return y>=s.camp.row+1&&y<=s.camp.row+2&&(x<=1||x>=5);}
export function openTiles(s){const blocked=new Set(s.rocks.filter(r=>!r.done).map(r=>r.x+','+r.y));for(const p of s.bedrock||[])blocked.add(p.join(','));for(const f of s.facilities)for(const p of f.footprint)blocked.add(p.join(','));for(const t of s.checkpoints)for(let x=0;x<COLS;x++)if(x!==t.x||!t.done)blocked.add(x+','+t.y);for(let y=s.camp.row+1;y<=s.camp.row+2;y++)for(let x=0;x<COLS;x++)if(campBlocked(s,x,y))blocked.add(x+','+y);
 const seen=new Set(),queue=[[3,s.camp.row]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i],k=x+','+y;if(seen.has(k)||blocked.has(k)||x<0||x>=COLS||y<0||y>s.rows+2)continue;seen.add(k);queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}return seen;
}
export function freeTiles(s,worker=null){return [...openTiles(s)].map(k=>k.split(',').map(Number)).filter(([x,y])=>!(x===6&&y===s.camp.row)&&!s.friends.some(w=>w.id!==worker?.id&&w.x===x&&w.y===y));}
function spotFor(open,t,w=null){const spots=(t.port?[t.port]:[[t.x,t.y+1],[t.x-1,t.y],[t.x+1,t.y],[t.x,t.y-1]]).filter(p=>open.has(p.join(',')));spots.sort((a,b)=>{const score=p=>w?Math.abs(p[0]-w.x)+Math.abs(p[1]-w.y):-p[1];return score(a)-score(b);});return spots[0]?{x:spots[0][0],y:spots[0][1]}:null;}
export function destination(s,t,w=null){return spotFor(new Set(freeTiles(s,w).map(p=>p.join(','))),t,w);}
export function assign(s,workerId,targetId){const w=s.friends.find(w=>w.id===workerId),t=targets(s).find(t=>t.id===targetId);if(!w||!t)error('일할 친구와 대상을 다시 선택해 주세요.');const p=destination(s,t,w);if(!p)error('앞의 바위를 캐서 연결된 작업 자리를 열어 주세요.');Object.assign(w,p);w.target=t.id;w.paused=false;return w;}
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
 const rock=nearbyRock(s,w);
 w.target=rock?.id??null;
 w.paused=!rock;
 return rock;
}
export function move(s,workerId,x,y){
 const w=s.friends.find(w=>w.id===workerId);
 if(!w||!freeTiles(s,w).some(p=>p[0]===x&&p[1]===y))error('연결된 빈 바닥에 놓아 주세요.');
 Object.assign(w,{x,y});
 mineNearby(s,w);
 return w;
}
export function spawnOrigin(s){return {x:3,y:s.camp.row};}
function addFriend(s,level=hireLevel(s)){if(occupiedSlots(s)>=capacity(s))error('같은 레벨 친구를 합쳐 빈자리를 만들어 주세요.');const origin=spawnOrigin(s),p=freeTiles(s).sort((a,b)=>Math.abs(a[1]-origin.y)*3+Math.abs(a[0]-origin.x)-Math.abs(b[1]-origin.y)*3-Math.abs(b[0]-origin.x))[0];if(!p)error('친구가 설 빈자리가 필요해요.');const w={id:id(s),level,x:p[0],y:p[1],target:null,paused:false};mineNearby(s,w);s.friends.push(w);return w;}
export function recruit(s){const price=hirePrice(s);if(s.gold<price)error('골드가 부족해요. 기본 찻집은 계속 생산해요.');const w=addFriend(s);s.gold-=price;s.hires++;return w;}
export function merge(s,aId,bId){const a=s.friends.find(w=>w.id===aId),b=s.friends.find(w=>w.id===bId);if(!a||!b||a===b||a.level!==b.level)error('같은 레벨 친구 두 명을 합쳐 주세요.');if(b.level>=40)error('최대 레벨이에요.');b.level++;
 const jobs=targets(s);
 const work=[b.target,a.target].map(id=>jobs.find(t=>t.id===id)).find(t=>t&&validTask(b,t));
 b.target=work?.id||null;b.paused=false;if(!work)mineNearby(s,b);s.friends=s.friends.filter(w=>w!==a);s.merges++;return b;}
export function upgrade(s,fId,count=null){const f=s.facilities.find(f=>f.id===fId);if(!f?.active)error('먼저 시설을 복구하고 가동해 주세요.');const q=quoteUpgrade(s,f,count??200);if(!q.count||count!=null&&q.count!==count)error('시설 강화에 필요한 골드가 부족해요.');const before=milestones(f);s.gold-=q.cost;f.level+=q.count;const bonuses=Math.round(Math.log2(milestones(f)/before));s.elixir+=bonuses*10;return {...q,bonuses,level:f.level};}
export function activate(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.repaired||f.active)error('시설 복구를 먼저 완료해 주세요.');f.active=true;f.progress=0;s.elixir+=20;for(const c of ['tea','bakery'])s.cards[c].count+=2;return f;}
export function collect(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.ready)error('아직 생산 중이에요.');const amount=f.ready;s.gold+=amount;s.ledger[f.id]+=amount;f.ready=0;f.progress=0;return amount;}
export function researchCost(s,card){const c=s.cards[card];return {cards:2+c.level*2,elixir:Math.ceil(12*1.55**c.level)};}
export function cardPreview(s,card){const c=s.cards[card],cost=researchCost(s,card),next=structuredClone(s),cap=card==='capacity'?4:20;next.cards[card].level=Math.min(cap,c.level+1);const f=s.facilities.find(f=>f.id===card)||{id:card,level:1};let current,value,label,unit;
 if(BASE[card]){current=cycleYield(s,f);value=cycleYield(next,f);label=BASE[card].name+' · '+BASE[card].cycle+'초 생산';unit='골드';}
 else if(card==='capacity'){current=capacity(s);value=capacity(next);label='친구와 미개봉 보급 정원';unit='칸';}
 else if(card==='pickaxe'){current=workerPower(s,{level:1});value=workerPower(next,{level:1});label='Lv.1 친구 작업 능력';unit='/초';}
 else {current=hirePrice(s);value=hirePrice(next);label='현재 소환 레벨 채용 비용';unit='골드';}
 return {current,next:value,label,unit,cost,max:c.level>=cap,art:BASE[card]?.art??(card==='pickaxe'?18:19)};
}
export function research(s,card){const c=s.cards[card];if(!c||c.level>=(card==='capacity'?4:20))error('최대 연구 레벨이에요.');const cost=researchCost(s,card);if(c.count<cost.cards||s.elixir<cost.elixir)error('카드 또는 연구 포인트가 부족해요.');c.count-=cost.cards;s.elixir-=cost.elixir;c.level++;return c;}
export function automate(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.active)error('먼저 시설을 가동해 주세요.');if(s.cards[f.id].level<BASE[f.id].required)error(`${BASE[f.id].name} 카드를 Lv.${BASE[f.id].required}까지 연구해 주세요.`);if(f.ready)collect(s,fId);f.auto=true;return f;}
function forwardCamp(s,t){const segment=s.segments[t.toSegment];s.camp={segment:segment.index,row:segment.campRow,moves:s.camp.moves+1};for(const w of s.friends){if(w.target===t.id)w.target=null;if(!w.target||campBlocked(s,w.x,w.y)){const p=freeTiles(s,w).sort((a,b)=>Math.abs(a[1]-s.camp.row)*3+Math.abs(a[0]-3)-Math.abs(b[1]-s.camp.row)*3-Math.abs(b[0]-3))[0];if(p)Object.assign(w,{x:p[0],y:p[1],target:null});}}}
function destroyed(s,t){t.hp=0;if(t.port){t.repaired=true;return;}t.done=true;if(t.id==='exit'){s.cleared=true;return;}if(t.kind==='checkpoint'){forwardCamp(s,t);s.elixir+=20;for(const c of Object.values(s.cards))c.count+=2;s.freeAt=Math.min(s.freeAt,s.elapsed+deliveryInterval(s));return;}const reward=Math.round(t.max*.45*(t.kind==='gold'?1.5:1));s.gold+=reward;s.ledger.rocks+=reward;s.elixir+=t.kind==='chest'?12:2;if(t.kind==='chest')for(let i=0;i<8;i++){const keys=Object.keys(s.cards);s.cards[keys[Math.floor(random(s)*keys.length)]].count++;}}
function validTask(w,t){return t.port?w.x===t.port[0]&&w.y===t.port[1]:Math.abs(w.x-t.x)+Math.abs(w.y-t.y)===1;}
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
export function advance(s,seconds){
 let remaining=Math.max(0,Math.min(seconds,8*3600)),iterations=0;
 const births=[];
 let work=collectWork(s);
 while(remaining>1e-8&&iterations++<100000){
 let step=remaining;if(!s.barrel&&s.barrelAt>s.elapsed)step=Math.min(step,s.barrelAt-s.elapsed);if(occupiedSlots(s)<capacity(s)&&s.freeAt>s.elapsed)step=Math.min(step,s.freeAt-s.elapsed);for(const {t,power}of work.values())step=Math.min(step,t.hp/power);for(const f of s.facilities.filter(f=>f.active&&(f.auto||!f.ready)))step=Math.min(step,BASE[f.id].cycle-f.progress);if(step<1e-8)step=Math.min(remaining,1e-7);
 for(const f of s.facilities.filter(f=>f.active&&(f.auto||!f.ready))){f.progress+=step;if(f.progress>=BASE[f.id].cycle-1e-7){const amount=cycleYield(s,f);f.progress=Math.max(0,f.progress-BASE[f.id].cycle);if(f.auto){s.gold+=amount;s.ledger[f.id]+=amount;}else {f.ready=amount;f.progress=0;}}}
 for(const {t,power}of work.values())t.hp=Math.max(0,t.hp-power*step);if(occupiedSlots(s)>=capacity(s))s.freeAt=Math.max(s.elapsed,s.freeAt)+step;
 s.elapsed+=step;remaining-=step;
 let finished=false;
 for(const {t} of work.values())if(t.hp<1e-6){destroyed(s,t);finished=true;}
 // Resolve simultaneous breaks before choosing neighbors, even at the exact end of a tick.
 if(finished)work=collectWork(s);
 if(s.elapsed>=s.freeAt&&occupiedSlots(s)<capacity(s)){(s.workerBarrels ??= []).push({id:id(s),level:cannonLevel(s)});s.freeAt=s.elapsed+deliveryInterval(s);}
 if(!s.barrel&&s.elapsed>=s.barrelAt)s.barrel={id:id(s),at:s.elapsed};
 }if(iterations>=100000)error('정산 처리 한도를 넘었어요.');return {births};}
export function unpackWorker(s, barrelId) {
 const barrels=s.workerBarrels || [];
 const index=barrels.findIndex(barrel=>barrel.id===barrelId);
 if(index<0)error('이미 열었거나 아직 도착하지 않은 친구 보급이에요.');
 const [barrel]=barrels.splice(index,1);
 try { return addFriend(s,barrel.level); }
 catch(err) { barrels.splice(index,0,barrel);throw err; }
}
export const regularIncome=s=>s.facilities.filter(f=>f.active&&f.auto).reduce((n,f)=>n+facilityRate(s,f),0);
export function chargePreview(s, chargeId, targetId) {
 const charge=s.charges?.find(item=>item.id===chargeId);
 const target=targets(s).find(item=>item.id===targetId);
 if(!charge||!target||!spotFor(openTiles(s),target))return null;
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
 const r=random(s),crew=crewInfo(s);let result;
 if(crew.stranded){
  // The incoming partner merges on contact without occupying a ninth tile.
  const w=crew.lowest;w.level++;s.merges++;
  result={type:'partner',text:'합성 짝 도착! Lv.'+(w.level-1)+' 친구가 Lv.'+w.level+'이 되었어요.'};
 }else if(!crew.full&&(crew.partner||r<.15)){
  const level=crew.partner?.level??Math.max(1,cannonLevel(s)-1),w=addFriend(s,level);
  result={type:'worker',id:w.id,text:crew.partner?'혼자 남은 Lv.'+level+' 친구의 합성 짝이 도착했어요.':'Lv.'+level+' 친구가 도착했어요!'};
 }else if(r>=.4&&r<.5&&(s.charges?.length||0)<4){
 const charge={id:id(s),level:Math.max(1,...s.friends.map(w=>w.level))};
 (s.charges??=[]).push(charge);result={type:'charge',text:'별사탕 폭죽 Lv.'+charge.level+' 획득! 바위로 끌어 놓으세요.'};
 }else if(r<.4){const amount=8+Math.floor(random(s)*12);s.elixir+=amount;result={type:'elixir',text:'연구 포인트 +'+amount};}else {const amount=Math.round(regularIncome(s)*20);s.gold+=amount;s.ledger.barrels+=amount;result={type:'gold',amount,text:'보급 골드 +'+Math.floor(amount).toLocaleString('ko-KR')};}s.barrel=null;s.barrelAt=s.elapsed+25;return result;}
export function readyForNext(s){return s.exit.done&&s.facilities.every(f=>f.active);}
export function nextMine(s){if(!readyForNext(s))error('모든 시설과 출구를 개방해 주세요.');return createState(s.stage+1,s.seed,s);}
export const WHEEL_REWARDS=[{type:'gems',amount:10,label:'보석 10'},{type:'elixir',amount:25,label:'연구 25'},{type:'cards',amount:4,label:'카드 4장'},{type:'time',amount:60,label:'시간 1분'},{type:'gems',amount:30,label:'보석 30'},{type:'elixir',amount:60,label:'연구 60'},{type:'cards',amount:8,label:'카드 8장'},{type:'worker',amount:1,label:'친구 +1레벨'}];
export function spin(s,extra=false){if(extra){if(s.wheel.extra>=5||s.elapsed<s.wheel.nextAt)error('추가 회전 준비 중이에요.');s.wheel.extra++;s.wheel.nextAt=s.elapsed+7200;}else {if(s.wheel.free)error('무료 회전을 이미 사용했어요.');s.wheel.free=true;}
 const index=Math.floor(random(s)*WHEEL_REWARDS.length),reward={...WHEEL_REWARDS[index],index};if(reward.type==='gems')s.gems+=reward.amount;else if(reward.type==='elixir')s.elixir+=reward.amount;else if(reward.type==='cards'){const keys=Object.keys(s.cards);for(let i=0;i<reward.amount;i++)s.cards[keys[Math.floor(random(s)*keys.length)]].count++;}else if(reward.type==='time')advance(s,reward.amount);else if(occupiedSlots(s)<capacity(s))reward.id=addFriend(s,hireLevel(s)+1).id;else {s.elixir+=40;reward.label='정원 가득 · 연구 40';reward.type='elixir';reward.amount=40;}return reward;}
export function buy(s,offer){let price=0,result={type:offer};if(offer==='free'){if(s.elapsed<s.shop.freeAt)error('무료 상자를 준비 중이에요.');s.shop.freeAt=s.elapsed+14400;s.elixir+=15;for(let i=0;i<3;i++){const keys=Object.keys(s.cards);s.cards[keys[Math.floor(random(s)*keys.length)]].count++;}result.text='카드 3장 · 연구 15를 받았어요.';return result;}
 if(offer==='chest')price=35;else if(offer==='research')price=25;else if(offer==='time')price=20;else if(offer.startsWith('card-')&&s.cards[offer.slice(5)])price=12;else error('상품을 다시 선택해 주세요.');if(s.gems<price)error('보석이 부족해요.');s.gems-=price;
 if(offer==='chest'){s.elixir+=60;for(const c of Object.values(s.cards))c.count+=2;result.text='카드 각 2장 · 연구 60을 받았어요.';}else if(offer==='research'){s.elixir+=80;result.text='연구 포인트 80을 받았어요.';}else if(offer==='time'){advance(s,300);result.text='시설 생산과 지정한 작업을 5분 진행했어요.';}else {s.cards[offer.slice(5)].count+=3;result.text='선택한 카드 3장을 받았어요.';}return result;
}
