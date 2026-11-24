// Shared, server-authoritative game rules. Client imports only for previews and presentation.
export const VERSION='1.1.0';
export const COLS=7;
export const CARDS=[
 {id:'forge',name:'기본 라인 매뉴얼',rarity:'일반',icon:'⚙',desc:'기본 라인의 수입 증가',max:20},
 {id:'packing',name:'상온 작업 매뉴얼',rarity:'일반',icon:'▣',desc:'상온 라인 자동화 · 수입 증가',max:20},
 {id:'cold',name:'콜드체인 매뉴얼',rarity:'고급',icon:'❄',desc:'냉장 라인 자동화 · 수입 증가',max:20},
 {id:'produce',name:'신선 작업 매뉴얼',rarity:'고급',icon:'✿',desc:'신선 라인 자동화 · 수입 증가',max:20},
 {id:'pickaxe',name:'숙련 작업',rarity:'희귀',icon:'⚒',desc:'모든 일용직의 작업 능력 증가',max:15},
 {id:'discount',name:'채용 협약',rarity:'희귀',icon:'▤',desc:'일용직 채용 비용 감소',max:12},
 {id:'delivery',name:'빠른 배차',rarity:'희귀',icon:'◷',desc:'무료 일용직 배달 간격 단축',max:12},
 {id:'capacity',name:'확장 휴게실',rarity:'희귀',icon:'♟',desc:'현장 일용직 정원 증가',max:6},
 {id:'critical',name:'정확한 타격',rarity:'전설',icon:'✦',desc:'평균 작업 능력 증가',max:10},
 {id:'barrel',name:'든든한 보급',rarity:'희귀',icon:'⬡',desc:'보급통 골드 보상 증가',max:15},
 {id:'truck',name:'지게차 튜닝',rarity:'영웅',icon:'▰',desc:'보너스 지게차의 보상 증가',max:10}
];
export const FOREMEN=[
 {id:'ambient',name:'상온 파트장',short:'상온',color:'#91b86c',desc:'주변 2칸 작업 능력 +25%',skill:'착착 정리',active:'20초간 모든 일용직 작업 능력 2배'},
 {id:'frozen',name:'냉동 파트장',short:'냉동',color:'#70c4ed',desc:'주변 2칸 냉동 박스 작업 능력 +60%',skill:'급속 분류',active:'20초간 모든 일용직 작업 능력 2배'},
 {id:'chilled',name:'냉장 파트장',short:'냉장',color:'#72c9b0',desc:'배치 중 시설 수입 +20%',skill:'콜드체인',active:'20초간 모든 일용직 작업 능력 2배'},
 {id:'cs',name:'CS 파트장',short:'CS',color:'#56b2dc',desc:'배치 중 무료 배달 간격 20% 단축',skill:'긴급 지원',active:'무료 일용직 1명 즉시 지원'},
 {id:'beauty',name:'뷰티 파트장',short:'뷰티',color:'#b980d9',desc:'주변 2칸 작업 능력 +40%',skill:'완벽한 마감',active:'20초간 모든 일용직 작업 능력 3배'},
 {id:'returns',name:'회수 파트장',short:'회수',color:'#e39b5b',desc:'배치 중 돌파 도구 효과 +50%',skill:'전량 회수',active:'최고 레벨 돌파 도구 1개 지원'}
];
export const SHOP=[
 {id:'chest',name:'보급 상자',price:35,icon:'chest',desc:'카드 12장 · 연구 포인트 60'},
 {id:'bigchest',name:'특급 보급 상자',price:100,icon:'chest',desc:'카드 40장 · 연구 포인트 220'},
 {id:'elixir',name:'연구 포인트',price:25,icon:'elixir',desc:'연구 포인트 150'},
 {id:'time30',name:'30분 시간 단축',price:25,icon:'time',desc:'배치한 작업과 시설 생산을 30분 진행'},
 {id:'time120',name:'2시간 시간 단축',price:75,icon:'time',desc:'배치한 작업과 시설 생산을 2시간 진행'},
 {id:'income',name:'운영 수입 2배',price:30,icon:'gold',desc:'3시간 동안 모든 시설 수입 2배'},
 {id:'workers',name:'긴급 인력 지원',price:40,icon:'worker',desc:'현재 채용 레벨 일용직 3명'},
 {id:'bomb',name:'돌파 도구',price:20,icon:'bomb',desc:'최고 일용직 레벨의 도구 1개'}
];
export const QUESTS=[
 {id:'boxes',name:'물량 15개 처리',target:15,gems:8,elixir:25},
 {id:'merges',name:'일용직 5번 합성',target:5,gems:8,elixir:25},
 {id:'upgrades',name:'시설 10번 업그레이드',target:10,gems:8,elixir:25}
];
export const fail=(message,code='rule',status=400)=>Object.assign(new Error(message),{code,status});
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const uid=()=>crypto.randomUUID();
export const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export const clone=v=>structuredClone(v);
export const dayKey=t=>new Date(t+9*3600000).toISOString().slice(0,10);
export const stageScale=s=>Math.pow(2.3,Math.min(29,Math.floor((s-1)/4)))*Math.pow(1.055,Math.min(s-1,120));
export function schedule(now){
 const offset=9*3600000,week=7*86400000,epoch=Date.UTC(2026,0,4,15),start=epoch+Math.floor((now-epoch)/week)*week;
 const phase=now<start+2*86400000?0:1,from=start+(phase?2*86400000:0),end=phase?start+week:start+2*86400000;
 const weekly={id:`${phase?'rush':'daily'}-${from}`,name:phase?'새벽배송 물량전':'센터 특근 챌린지',start:from,end,days:phase?5:2,season:false};
 const d=new Date(now+offset),month=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)-offset;
 const seasonal={id:`season-${month}`,name:'월간 물류 페스티벌',start:month,end:month+12*86400000,days:12,season:true};
 return [weekly,...(now<seasonal.end?[seasonal]:[])];
}
function rng(g){g.seed=(Math.imul(g.seed||1,1664525)+1013904223)>>>0;return g.seed/4294967296;}
function stats(){return {boxes:0,merges:0,upgrades:0,gold:0,keys:0};}
function cardSet(){return Object.fromEntries(CARDS.map(c=>[c.id,{level:c.id==='forge'?1:0,count:['forge','packing','cold','produce'].includes(c.id)?8:0}]))}
export function startGame(now=Date.now()){
 const g={version:1,seed:Math.floor(Math.random()*0xffffffff)||1,createdAt:now,lastAt:now,gems:90,elixir:60,shovels:3,cards:cardSet(),ancestral:0,knowledge:0,heroes:Object.fromEntries(FOREMEN.map(h=>[h.id,{level:h.id==='ambient'?1:0,fragments:0}])),foreman:'ambient',foremanPos:{x:1,y:1},heroUntil:0,heroCooldown:0,boostUntil:0,main:null,events:{},activeEvent:null,treasure:{region:0,regions:Array.from({length:8},()=>({dug:[],premium:false})),loops:0},daily:{day:dayKey(now),stats:stats(),claimed:[],wheel:false,boost:false},lastChest:0,stats:stats(),bestStage:1,mail:[],tutorial:0,truck:null,settings:{auto:false},achievements:[],eventRewards:{}};
 g.main=makeBoard(1,now);return g;
}
export function makeBoard(stage,now,event=null){
 const rows=stage===1&&!event?12:Math.min(26,13+Math.floor(stage/2)),scale=stageScale(stage),cells=[],walls=[];
 const gates=Array.from({length:Math.floor((rows-4)/6)},(_,i)=>7+i*6).filter(y=>y<rows-1);
 for(const y of gates)walls.push(y);
 const facilities=[{id:'forge',kind:'forge',x:1,y:0,level:1,active:true,auto:true,ready:0,progress:0,required:0}];
 const shaftRows=[4,Math.min(rows-3,8),...(stage>=3?[Math.min(rows-2,11)]:[])];
 for(let i=0;i<shaftRows.length;i++){
  let y=shaftRows[i];while(gates.includes(y)||shaftRows.slice(0,i).includes(y))y++;
  facilities.push({id:`line${i}`,kind:['packing','cold','produce'][i],x:(i+Math.floor(stage/3))%2?6:0,y,level:1,active:false,auto:false,ready:0,progress:0,required:Math.min(12,1+Math.floor((stage-1)/6)+(i===1?1:0)),hp:Math.round(28*scale*Math.pow(1.17,y-3)),max:Math.round(28*scale*Math.pow(1.17,y-3)),repaired:false});
 }
 for(let y=3;y<rows;y++)for(let x=0;x<COLS;x++){
  if(gates.includes(y)){if(x===[3,1,5][((stage-1)+gates.indexOf(y))%3])cells.push({id:`gate${y}`,kind:'gate',x,y,hp:Math.round(110*scale*Math.pow(1.19,y-3)),max:Math.round(110*scale*Math.pow(1.19,y-3)),done:false});continue;}
  if(facilities.some(f=>f.x===x&&f.y===y))continue;
  if(y===rows-1&&x!==3)continue;if(stage>1&&y>3&&y<rows-1&&((x*31+y*17+stage*13)%23===0))continue;
  const k=y===rows-1?'exit':((x*17+y*11+stage*3)%19===0?'chest':event&&x===(y+stage)%COLS&&y%3===1?'key':['parcel','frozen','produce'][(x+y+stage)%3]);
  const hp=Math.round((k==='exit'?170:k==='chest'?62:38)*scale*Math.pow(1.19,y-3)*(1+((x*7+y*3+stage)%5)*.09));
  cells.push({id:`c${x}_${y}`,kind:k,x,y,hp,max:hp,done:false,tier:Math.min(99,stage+Math.floor((y-3)/2))});
 }
 return {slotRules:1,supportPos:event?null:{x:1,y:1},stage,rows,scale,walls,cells,facilities,workers:[{id:uid(),level:Math.min(30,1+Math.floor((stage-1)/4)),x:2,y:1,target:null},{id:uid(),level:Math.min(30,1+Math.floor((stage-1)/4)),x:4,y:1,target:null},{id:uid(),level:Math.min(30,1+Math.floor((stage-1)/4)),x:3,y:1,target:null}],gold:240*scale,hires:0,keys:0,crowns:0,bombs:[],freeAt:now+2400000,barrelAt:now+20000,barrel:null,boostUntil:0,lastAt:now,event,elixir:40,cards:event?cardSet():null,elapsed:0,auto:false,checkpoint:0,claimedKeys:[],cleared:false};
}
export function board(g,mode='main'){if(mode==='main')return g.main;const b=g.events[mode];if(!b)throw fail('먼저 이벤트에 입장해 주세요.');return b;}
export const cardLevel=(g,b,id)=>(b.event?b.cards:g.cards)?.[id]?.level||0;
export function hireLevel(b){return Math.min(30,1+Math.floor((b.stage-1)/4)+Math.floor(b.hires/10));}
export const workerCap=(g,b)=>8+cardLevel(g,b,'capacity');
export const hireCost=(g,b)=>Math.ceil(45*b.scale*Math.pow(1.28,Math.min(b.hires,18))*Math.pow(1.06,Math.max(0,b.hires-18))*Math.pow(.94,cardLevel(g,b,'discount'))*Math.pow(.85,b.checkpoint));
export const deliveryInterval=(g,b)=>Math.max(240,2400*Math.pow(.91,cardLevel(g,b,'delivery'))*Math.pow(.9,b.checkpoint)*(g.foreman==='cs'&&!b.event?.8:1));
export function milestoneMultiplier(level){return Math.pow(2,(level>=5?1:0)+(level>=10?1:0)+Math.floor(level/25));}
export const facilityCost=(b,f)=>Math.ceil((f.kind==='forge'?35:60)*b.scale*Math.pow(1.14,f.level-1));
export function facilityRate(g,b,f,at=Date.now()){
 const card=cardLevel(g,b,f.kind),hero=!b.event&&g.foreman==='chilled'?1.2+.02*(g.heroes.chilled.level-1):1;
 return (f.kind==='forge'?3:f.kind==='packing'?8:f.kind==='cold'?15:23)*b.scale*Math.pow(1.105,f.level-1)*milestoneMultiplier(f.level)*Math.pow(1.25,card)*hero*((b.event?b.boostUntil:g.boostUntil)>at?2:1);
}
export const facilityCycle=f=>f.kind==='forge'?4:f.kind==='packing'?6:f.kind==='cold'?8:10;
export function workerDamage(g,b,w,target,at=Date.now()){
 let d=4*Math.pow(2.3,w.level-1)*Math.pow(1.18,cardLevel(g,b,'pickaxe'))*(1+cardLevel(g,b,'critical')*.06);
 if(!b.event){d*=Math.pow(1.05,g.ancestral);if(g.heroUntil>at)d*=g.foreman==='beauty'?3:2;const p=g.foremanPos,h=g.heroes[g.foreman];if(p&&h?.level>0&&Math.abs(w.x-p.x)+Math.abs(w.y-p.y)<=2){if(g.foreman==='ambient')d*=1.25+.05*(h.level-1);if(g.foreman==='beauty')d*=1.4+.05*(h.level-1);if(g.foreman==='frozen'&&target?.kind==='frozen')d*=1.6+.1*(h.level-1);}}
 return d;
}
export function targets(b){return [...b.cells.filter(c=>!c.done),...b.facilities.filter(f=>!f.active&&!f.repaired)]}
export function objectAt(b,x,y){return targets(b).find(c=>c.x===x&&c.y===y)}
export function reachable(b){
 const seen=new Set(),queue=[[3,0]],blocked=new Set(targets(b).map(c=>`${c.x},${c.y}`));
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i],key=`${x},${y}`;if(seen.has(key)||x<0||x>=COLS||y<0||y>=b.rows||blocked.has(key)||b.walls.includes(y)&&x!==(b.cells.find(z=>z.kind==='gate'&&z.y===y)?.x??3))continue;seen.add(key);queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}return seen;
}
// Actors can walk through open lanes, but each standing tile has a single occupant.
export function standingTiles(b,{worker=null,hero=false}={}){
 const open=reachable(b);return [...open].map(k=>k.split(',').map(Number)).filter(([x,y])=>
  !b.facilities.some(f=>f.x===x&&f.y===y)&&!(x===6&&(y===0||y===1))&&
  (hero||!b.supportPos||b.supportPos.x!==x||b.supportPos.y!==y)&&
  !b.workers.some(w=>w.id!==worker?.id&&w.x===x&&w.y===y));
}
export function destination(b,target,worker=null){
 const open=b.slotRules?new Set(standingTiles(b,{worker}).map(p=>p.join(','))):reachable(b);
 const spots=[[target.x-1,target.y],[target.x+1,target.y],[target.x,target.y-1],[target.x,target.y+1]].filter(([x,y])=>open.has(`${x},${y}`));
 const score=p=>(b.slotRules?0:b.workers.some(w=>w.id!==worker?.id&&w.x===p[0]&&w.y===p[1])?100:0)+(worker?Math.abs(p[0]-worker.x)+Math.abs(p[1]-worker.y):p[1]);
 spots.sort((a,z)=>score(a)-score(z));return spots.length?{x:spots[0][0],y:spots[0][1]}:null;
}
function repairWorkforce(b){
 if(b.slotRules)return;
 const open=reachable(b),claimed=new Set();
 const legal=([x,y])=>open.has(`${x},${y}`)&&!claimed.has(`${x},${y}`)&&!b.facilities.some(f=>f.x===x&&f.y===y)&&!(x===6&&(y===0||y===1))&&(!b.supportPos||b.supportPos.x!==x||b.supportPos.y!==y);
 for(const w of b.workers){
  const t=targets(b).find(t=>t.id===w.target);
  if(!legal([w.x,w.y])){
   const spots=[...open].map(k=>k.split(',').map(Number)).filter(legal);
   spots.sort((a,z)=>{const score=p=>(t&&Math.abs(p[0]-t.x)+Math.abs(p[1]-t.y)===1?-1000:0)+Math.abs(p[0]-w.x)+Math.abs(p[1]-w.y);return score(a)-score(z);});
   if(!spots.length)throw fail('현장 배치를 복구할 공간이 부족해요.');[w.x,w.y]=spots[0];
  }
  claimed.add(`${w.x},${w.y}`);if(!t||Math.abs(w.x-t.x)+Math.abs(w.y-t.y)!==1)w.target=null;
 }
 b.slotRules=1;
}
export function autoAssign(g,b,w){
 const opts=targets(b).map(t=>({t,d:Math.abs(t.x-w.x)+Math.abs(t.y-w.y)===1?{x:w.x,y:w.y}:b.slotRules?destination(b,t,w):null})).filter(o=>o.d&&Math.abs(o.d.x-w.x)+Math.abs(o.d.y-w.y)<=2);
 opts.sort((a,z)=>(a.t.kind==='gate'?-1:0)-(z.t.kind==='gate'?-1:0)||a.t.hp-z.t.hp);
 const next=opts[0];w.target=next?.t.id||null;if(next)Object.assign(w,next.d);
}
function addStat(g,id,n=1,at=g.lastAt){g.stats[id]=(g.stats[id]||0)+n;if(dayKey(at)===g.daily.day)g.daily.stats[id]=(g.daily.stats[id]||0)+n;}
export function giveChest(g,b,tier=1){
 const cards=b.event?b.cards:g.cards,amount=tier===1?12:40,elixir=tier===1?60:220,drops={};
 for(let i=0;i<amount;i++){const c=CARDS[Math.floor(rng(g)*CARDS.length)],v=cards[c.id];drops[c.id]=(drops[c.id]||0)+1;if(v.level>=c.max){if(!b.event){g.knowledge+=c.rarity==='일반'?1:c.rarity==='고급'?2:3;}}else v.count++;}
 if(b.event)b.elixir+=elixir;else g.elixir+=elixir;
 return {cards:amount,elixir,drops};
}
function destroy(g,b,t,now,recordAt=now){
 if(t.done||t.repaired)return;
 if('active'in t){t.repaired=true;t.hp=0;return;}
 t.done=true;t.hp=0;
 if(t.kind==='gate'){b.checkpoint++;b.freeAt=Math.min(b.freeAt,now+deliveryInterval(g,b));giveChest(g,b,1);return;}
 if(t.kind==='exit'){b.cleared=true;return;}
 const reward=Math.round(t.max*.7);b.gold+=reward;addStat(g,'gold',reward,recordAt);addStat(g,'boxes',1,recordAt);
 if(b.event){b.crowns+=2+Math.floor(rng(g)*8);if(t.kind==='key'){b.keys++;addStat(g,'keys',1,recordAt);}}
 else {if(g.stats.boxes%12===0)g.shovels++;if(g.stats.boxes%7===0)g.gems++;}
 if(t.kind==='chest'){giveChest(g,b,1);if(!b.event){g.heroes[FOREMEN[Math.floor(rng(g)*FOREMEN.length)].id].fragments++;}}else {const q=2+Math.floor(rng(g)*5);if(b.event)b.elixir+=q;else g.elixir+=q;}
}
function advanceSegment(g,b,seconds,start,recordAt=null){
 if(seconds<=0)return;let remaining=seconds,at=start,iterations=0;
 // Every pass lands on the next completed target, so offline and frequent polls agree.
 while(remaining>1e-8&&iterations++<1500){
  const assigned=new Map();for(const w of b.workers){const t=targets(b).find(t=>t.id===w.target);if(!t){w.target=null;continue;}if(Math.abs(w.x-t.x)+Math.abs(w.y-t.y)!==1){w.target=null;continue;}const z=assigned.get(t.id)||{t,dps:0};z.dps+=workerDamage(g,b,w,t,at);assigned.set(t.id,z);}
  let step=remaining;for(const {t,dps}of assigned.values())step=Math.min(step,t.hp/dps);
  if(!Number.isFinite(step)||step<1e-9)step=Math.min(remaining,1e-6);
  for(const f of b.facilities.filter(f=>f.active)){
   const cycle=facilityCycle(f),rate=facilityRate(g,b,f,at),total=f.progress+step;
   if(f.auto){const income=rate*step;b.gold+=income;addStat(g,'gold',income,recordAt??at);f.progress=total%cycle;}
   else if(f.ready<=0){if(total>=cycle){f.ready=rate*cycle;f.progress=0;}else f.progress=total;}
  }
  for(const {t,dps}of assigned.values())t.hp=Math.max(0,t.hp-dps*step);
  at+=step*1000;remaining-=step;b.elapsed+=step;
  let completed=false;for(const {t}of assigned.values())if(t.hp<1e-6){destroy(g,b,t,at,recordAt??at);completed=true;for(const w of b.workers.filter(w=>w.target===t.id)){w.target=null;if(b.auto){if(!('active'in t)&&(!b.slotRules||standingTiles(b,{worker:w}).some(([x,y])=>x===t.x&&y===t.y))){w.x=t.x;w.y=t.y;}autoAssign(g,b,w);}}}
  if(!completed)break;
 }
}
export function simulate(g,b,seconds,start,virtual=false){
 let end=start+seconds*1000,cur=start;
 const midnight=Math.floor((start+9*3600000)/86400000)*86400000-9*3600000+86400000;const boundaries=[b.event?b.boostUntil:g.boostUntil,b.event?0:g.heroUntil,end,...Array.from({length:Math.max(0,Math.ceil((end-midnight)/86400000))},(_,i)=>midnight+i*86400000)].filter(t=>t>start&&t<=end).sort((a,b)=>a-b);
 for(const t of [...new Set(boundaries)]){advanceSegment(g,b,(t-cur)/1000,cur,virtual?start:null);cur=t;}
}
export function synchronize(g,now=Date.now()){
 if(g.daily.day!==dayKey(now))g.daily={day:dayKey(now),stats:stats(),claimed:[],wheel:false,boost:false};
 let offline={seconds:0,gold:0,boxes:0};
 for(const b of [g.main,...Object.values(g.events)]){
  b.supportPos=b.event?null:{...g.foremanPos};
  const end=b.event?Math.min(now,b.event.end):now;if(end<=b.lastAt){repairWorkforce(b);continue;}
  const elapsed=Math.min(8*3600,(end-b.lastAt)/1000),before=b.gold,boxes=g.stats.boxes;
  simulate(g,b,elapsed,b.lastAt);b.lastAt=end;repairWorkforce(b);
  if(b===g.main)offline={seconds:elapsed,gold:Math.floor(b.gold-before),boxes:g.stats.boxes-boxes};
  if(!b.event||now<b.event.end){
   if(!b.barrel&&now>=b.barrelAt)b.barrel={id:uid(),at:now,x:6,y:1};
  }
 }
 g.lastAt=now;g.bestStage=Math.max(g.bestStage,g.main.stage);return offline;
}
export function cardCost(c){return {cards:2+c.level*2,elixir:Math.ceil(12*Math.pow(1.55,c.level))};}
function addWorker(g,b,level=hireLevel(b)){
 if(b.workers.length>=workerCap(g,b))throw fail('휴게실이 가득 찼어요. 같은 레벨을 합성해 주세요.');
 const positions=standingTiles(b).sort((a,z)=>a[1]-z[1]||Math.abs(a[0]-3)-Math.abs(z[0]-3)),p=positions[0];
 if(!p)throw fail('일용직이 설 빈칸이 필요해요. 먼저 합성하거나 길을 열어 주세요.');
 const w={id:uid(),level,x:p[0],y:p[1],target:null};b.workers.push(w);return w;
}
export function readyForNext(b){return b.cleared&&b.facilities.every(f=>f.active);}
function truckTrack(seed){const a=[];let s=seed;for(let i=0;i<42;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;a.push({at:900+i*660,lane:s%3,type:i%9===8?'gem':i%4===3?'chest':'elixir'});}return a;}
export {truckTrack};
export function act(g,type,p={},now=Date.now()){
 synchronize(g,now);const mode=p.mode||'main',b=['eventJoin','treasureDig','treasureNext','treasurePass','quest','wheel','dailyBoost','freeChest','heroUpgrade','heroSelect','achievement','tutorial','truckFinish'].includes(type)?null:board(g,mode);
 if(b?.event&&now>=b.event.end)throw fail('이벤트가 종료됐어요. 보상 창을 확인해 주세요.');
 let result={};
 switch(type){
 case 'hire':{const cost=hireCost(g,b);if(b.gold<cost)throw fail('운영 골드가 부족해요. 시설 수입을 모아 주세요.');const w=addWorker(g,b);b.gold-=cost;b.hires++;result={worker:w.id};break;}
 case 'move':{const w=b.workers.find(w=>w.id===p.id);if(!w)throw fail('일용직을 찾을 수 없어요.');const x=num(p.x,-1),y=num(p.y,-1);if(!Number.isInteger(x)||!Number.isInteger(y))throw fail('올바른 위치를 선택해 주세요.');const others=b.workers.filter(z=>z.id!==w.id&&z.x===x&&z.y===y);const other=(p.mergeTarget?b.workers.find(z=>z.id===p.mergeTarget&&z.id!==w.id):others.find(z=>z.level===w.level)||others[0]);if(other){if(other.level!==w.level)throw fail('같은 레벨끼리 합성할 수 있어요.');if(w.level>=40)throw fail('최대 레벨이에요.');other.level++;other.target=null;b.workers=b.workers.filter(z=>z.id!==w.id);autoAssign(g,b,other);addStat(g,'merges');result={merged:true,id:other.id};break;}
 const target=objectAt(b,x,y);if(target){const d=destination(b,target,w);if(!d)throw fail('먼저 앞쪽 박스를 처리해 길을 열어 주세요.');Object.assign(w,d);w.target=target.id;}else {if(!standingTiles(b,{worker:w}).some(p=>p[0]===x&&p[1]===y))throw fail('일용직이 설 수 있는 빈 바닥을 선택해 주세요.');w.x=x;w.y=y;autoAssign(g,b,w);}break;}
 case 'assign':{const w=b.workers.find(w=>w.id===p.id),t=targets(b).find(t=>t.id===p.target);if(!w||!t)throw fail('작업 대상을 다시 선택해 주세요.');const d=destination(b,t,w);if(!d)throw fail('연결된 길이 필요해요.');Object.assign(w,d);w.target=t.id;break;}
 case 'upgrade':{const f=b.facilities.find(f=>f.id===p.id);if(!f?.active)throw fail('먼저 시설을 복구해 주세요.');const count=p.count===10?10:1;let n=0;while(n<count&&f.level<200){const cost=facilityCost(b,f);if(b.gold<cost)break;b.gold-=cost;f.level++;n++;if([5,10,25,50,75,100,125,150,175,200].includes(f.level)){if(b.event)b.elixir+=10;else g.elixir+=10;}}if(!n)throw fail('운영 골드가 부족해요.');addStat(g,'upgrades',n);result={levels:n};break;}
 case 'activate':{const f=b.facilities.find(f=>f.id===p.id);if(!f?.repaired||f.active)throw fail('일용직으로 시설 복구를 완료해 주세요.');f.active=true;giveChest(g,b,1);result={chest:true};break;}
 case 'collect':{const f=b.facilities.find(f=>f.id===p.id);if(!f?.active||f.ready<=0)throw fail('아직 생산 중이에요.');b.gold+=f.ready;addStat(g,'gold',f.ready);result={gold:Math.floor(f.ready)};f.ready=0;f.progress=0;break;}
 case 'automate':{const f=b.facilities.find(f=>f.id===p.id);if(!f?.active)throw fail('먼저 시설을 가동해 주세요.');if(cardLevel(g,b,f.kind)<f.required)throw fail(`해당 매뉴얼을 Lv.${f.required}까지 연구해 주세요.`);f.auto=true;if(f.ready){b.gold+=f.ready;f.ready=0;}break;}
 case 'card':{const cards=b.event?b.cards:g.cards,c=cards[p.id],def=CARDS.find(d=>d.id===p.id);if(!c||!def)throw fail('매뉴얼을 찾을 수 없어요.');if(c.level>=def.max)throw fail('최대 연구 레벨이에요.');const cost=cardCost(c),e=b.event?b.elixir:g.elixir;if(c.count<cost.cards||e<cost.elixir)throw fail('카드 또는 연구 포인트가 부족해요.');c.count-=cost.cards;if(b.event)b.elixir-=cost.elixir;else g.elixir-=cost.elixir;c.level++;break;}
 case 'auto':b.auto=!b.auto;if(b.auto)for(const w of b.workers.filter(w=>!w.target))autoAssign(g,b,w);break;
 case 'freeWorker':{if(now<b.freeAt)throw fail('배달 준비 중이에요.');addWorker(g,b);b.freeAt=now+deliveryInterval(g,b);break;}
 case 'barrel':{if(!b.barrel)throw fail('보급통이 아직 도착하지 않았어요.');const r=rng(g);if(r<.16&&b.workers.length<workerCap(g,b)){addWorker(g,b,Math.max(1,hireLevel(b)-1));result={kind:'worker',text:'일용직 지원!'};}else if(r<.28&&b.bombs.length<4){const lv=Math.max(...b.workers.map(w=>w.level),1);b.bombs.push({id:uid(),level:lv});result={kind:'bomb',text:`Lv.${lv} 돌파 도구!`};}else if(r<.48){const n=8+Math.floor(rng(g)*16);if(b.event)b.elixir+=n;else g.elixir+=n;result={kind:'elixir',text:`연구 포인트 +${n}`};}else {const n=Math.round(b.facilities.filter(f=>f.active&&f.auto).reduce((s,f)=>s+facilityRate(g,b,f,now),0)*25*Math.pow(1.2,cardLevel(g,b,'barrel')));b.gold+=n;result={kind:'gold',text:`골드 +${Math.floor(n)}`};}b.barrel=null;b.barrelAt=now+25000;break;}
 case 'bomb':{const bomb=b.bombs.find(z=>z.id===p.id),t=targets(b).find(z=>z.id===p.target);if(!bomb||!t)throw fail('돌파 도구와 대상을 선택해 주세요.');if(!destination({...b,slotRules:0},t))throw fail('일용직이 닿을 수 있는 대상에 사용해 주세요.');const d=workerDamage(g,b,{level:bomb.level,x:t.x,y:t.y},t,now)*300*(!b.event&&g.foreman==='returns'?1.5:1);t.hp=Math.max(0,t.hp-d);b.bombs=b.bombs.filter(z=>z.id!==bomb.id);if(t.hp===0)destroy(g,b,t,now);result={damage:d};break;}
 case 'bombMerge':{const a=b.bombs.find(z=>z.id===p.id),z=b.bombs.find(z=>z.id===p.other);if(!a||!z||a===z||a.level!==z.level)throw fail('같은 레벨 도구 2개가 필요해요.');if(a.level>=Math.max(...b.workers.map(w=>w.level),1)+3)throw fail('최고 일용직보다 3레벨 높은 도구까지 합성할 수 있어요.');a.level++;b.bombs=b.bombs.filter(q=>q!==z);break;}
 case 'eventJoin':{const ev=schedule(now).find(z=>z.id===p.id);if(!ev)throw fail('현재 진행 중인 이벤트가 아니에요.');if(!g.events[ev.id])g.events[ev.id]=makeBoard(1,now,ev);g.activeEvent=ev.id;break;}
 case 'eventMilestone':{const thresholds=[1,3,6,10,15],n=num(p.threshold);if(!thresholds.includes(n)||b.keys<n||b.claimedKeys.includes(n))throw fail('아직 수령할 수 없는 보상이에요.');b.claimedKeys.push(n);g.gems+=n*3;g.elixir+=n*25;g.shovels+=Math.ceil(n/3);giveChest(g,g.main,n>=6?2:1);break;}
 case 'next':{if(!readyForNext(b))throw fail('출구와 모든 작업 라인을 개방해 주세요.');if(g.truck)throw fail('진행 중인 지게차 보너스를 마쳐 주세요.');if(p.skip){const next=makeBoard(b.stage+1,now,b.event);if(mode==='main'){g.main=next;g.foremanPos={x:1,y:1};g.gems+=10;g.shovels+=2;}else {next.crowns=b.crowns;next.keys=b.keys;next.cards=b.cards;next.elixir=b.elixir;next.boostUntil=b.boostUntil;next.claimedKeys=b.claimedKeys;g.events[mode]=next;}break;}g.truck={id:uid(),mode,stage:b.stage,start:now,seed:Math.floor(rng(g)*0xffffffff),finished:false};result={truck:g.truck};break;}
 case 'truckFinish':{const tr=g.truck;if(!tr||tr.id!==p.id)throw fail('진행 중인 지게차 보너스가 없어요.');const elapsed=Math.min(30000,now-tr.start);if(elapsed<3000&&!p.skip)throw fail('지게차가 작업 중이에요.');const events=Array.isArray(p.inputs)?p.inputs.slice(0,180):[];let prev=-1000;for(const q of events){if(!Number.isFinite(q.at)||q.at<0||q.at>elapsed+100||q.at<prev+100||![0,1,2].includes(q.lane))throw fail('올바르지 않은 조작 기록이에요.');prev=q.at;}let hits=0,gems=0;for(const item of truckTrack(tr.seed)){if(item.at>elapsed||p.skip)continue;let lane=1;for(const e of events){if(e.at<=item.at)lane=e.lane;else break;}if(lane===item.lane){hits++;if(item.type==='gem'&&tr.mode==='main')gems++;}}const prior=board(g,tr.mode);if(prior.event&&now>=prior.event.end){g.truck=null;result={expired:true,hits:0,elixir:0,gems:0};break;}const factor=1+cardLevel(g,prior,'truck')*.15,elixir=Math.round(hits*4*factor);if(prior.event)prior.elixir+=elixir;else {g.elixir+=elixir;g.gems+=gems;g.gems+=10;g.shovels+=2;}if(hits>=5)giveChest(g,prior,1);const next=makeBoard(prior.stage+1,now,prior.event);if(tr.mode==='main'){g.main=next;g.foremanPos={x:1,y:1};}else {Object.assign(next,{crowns:prior.crowns,keys:prior.keys,cards:prior.cards,elixir:prior.elixir,boostUntil:prior.boostUntil,claimedKeys:prior.claimedKeys});g.events[tr.mode]=next;}g.truck=null;result={hits,elixir,gems};break;}
 case 'shop':{const item=SHOP.find(s=>s.id===p.id);if(!item)throw fail('상품을 찾을 수 없어요.');if(g.gems<item.price)throw fail('보석이 부족해요. 일일 업무와 구역 보상으로 모을 수 있어요.');if(p.id==='workers'&&b.workers.length+3>workerCap(g,b))throw fail('일용직 3명이 들어갈 공간이 필요해요.');if(p.id==='bomb'&&b.bombs.length>=4)throw fail('돌파 도구는 4개까지 보관할 수 있어요.');g.gems-=item.price;switch(p.id){case'chest':result=giveChest(g,b,1);break;case'bigchest':result=giveChest(g,b,2);break;case'elixir':if(b.event)b.elixir+=150;else g.elixir+=150;break;case'time30':case'time120':simulate(g,b,(p.id==='time30'?30:120)*60,now,true);break;case'income':if(b.event)b.boostUntil=Math.max(now,b.boostUntil||0)+3*3600000;else g.boostUntil=Math.max(now,g.boostUntil)+3*3600000;break;case'workers':for(let i=0;i<3;i++)addWorker(g,b);break;case'bomb':b.bombs.push({id:uid(),level:Math.max(...b.workers.map(w=>w.level),1)});break;}break;}
 case 'freeChest':if(now-g.lastChest<4*3600000)throw fail('다음 보급 시간을 기다려 주세요.');g.lastChest=now;result=giveChest(g,g.main,1);break;
 case 'dailyBoost':if(g.daily.boost)throw fail('오늘의 지원 부스트를 이미 받았어요.');g.daily.boost=true;g.boostUntil=Math.max(now,g.boostUntil)+600000;break;
 case 'wheel':{if(g.daily.wheel)throw fail('오늘의 무료 룰렛을 이미 사용했어요.');g.daily.wheel=true;const r=Math.floor(rng(g)*6),rewards=['보석 15개','연구 포인트 80','보급 상자','삽 3개','보석 30개','연구 포인트 150'];if(r===0)g.gems+=15;if(r===1)g.elixir+=80;if(r===2)giveChest(g,g.main,1);if(r===3)g.shovels+=3;if(r===4)g.gems+=30;if(r===5)g.elixir+=150;result={index:r,text:rewards[r]};break;}
 case 'quest':{const q=QUESTS.find(q=>q.id===p.id);if(!q||g.daily.claimed.includes(q.id)||g.daily.stats[q.id]<q.target)throw fail('업무 목표를 먼저 달성해 주세요.');g.daily.claimed.push(q.id);g.gems+=q.gems;g.elixir+=q.elixir;g.shovels++;break;}
 case 'treasureDig':{const r=g.treasure.regions[g.treasure.region],i=num(p.index,-1);if(!Number.isInteger(i)||i<0||i>=25||r.dug.includes(i))throw fail('발굴할 타일을 선택해 주세요.');if(g.shovels<1)throw fail('삽이 부족해요. 구역 진행과 일일 업무로 모을 수 있어요.');const adjacent=r.dug.length?r.dug.some(z=>Math.abs(z%5-i%5)+Math.abs(Math.floor(z/5)-Math.floor(i/5))===1):i===22;if(!adjacent)throw fail('이미 연 타일 옆으로 발굴해 주세요.');g.shovels--;r.dug.push(i);if(i%5===0){g.gems+=8;result={text:'보석 +8'};}else if(i%5===1){g.elixir+=40;result={text:'연구 포인트 +40'};}else if(i%5===2){giveChest(g,g.main,1);result={text:'보급 상자 획득'};}else {const id=FOREMEN[(i+g.treasure.region)%6].id;g.heroes[id].fragments++;result={text:`${FOREMEN.find(h=>h.id===id).short} 파트장 조각 +1`};}if(r.premium){g.gems+=3;g.elixir+=15;}break;}
 case 'treasurePass':{const r=g.treasure.regions[g.treasure.region];if(r.premium)throw fail('이미 활성화한 패스예요.');if(g.gems<120)throw fail('보석 120개가 필요해요.');g.gems-=120;r.premium=true;g.gems+=r.dug.length*3;g.elixir+=r.dug.length*15;break;}
 case 'treasureNext':{const t=g.treasure,r=t.regions[t.region];if(r.dug.length<15)throw fail('현재 지역을 15칸 이상 발굴해 주세요.');if(t.region<7)t.region++;else {t.loops++;g.gems+=50;g.shovels+=3;t.regions=Array.from({length:8},()=>({dug:[],premium:false}));t.region=0;}break;}
 case 'heroSelect':{const h=g.heroes[p.id];if(!h?.level)throw fail('먼저 파트장을 영입해 주세요.');g.foreman=p.id;break;}
 case 'heroUpgrade':{const h=g.heroes[p.id];if(!h)throw fail('파트장을 찾을 수 없어요.');const need=h.level?2+h.level*2:4,cost=h.level?30*h.level:30;if(h.fragments<need||g.elixir<cost)throw fail('파트장 조각 또는 연구 포인트가 부족해요.');h.fragments-=need;g.elixir-=cost;h.level++;break;}
 case 'heroMove':if(b.event)throw fail('파트장은 본편에서 지원해요.');if(!standingTiles(b,{hero:true}).some(q=>q[0]===Number(p.x)&&q[1]===Number(p.y)))throw fail('일용직과 시설이 없는 빈 바닥을 선택해 주세요.');g.foremanPos={x:Number(p.x),y:Number(p.y)};b.supportPos={...g.foremanPos};break;
 case 'heroSkill':if(b.event)throw fail('파트장은 본편에서 지원해요.');if(now<g.heroCooldown)throw fail('파트장이 다음 지원을 준비하고 있어요.');if(g.foreman==='cs')addWorker(g,b);else if(g.foreman==='returns'){if(b.bombs.length>=4)throw fail('돌파 도구 보관함이 가득 찼어요.');b.bombs.push({id:uid(),level:Math.max(...b.workers.map(w=>w.level),1)});}else g.heroUntil=now+20000;g.heroCooldown=now+120000;break;
 case 'ancestral':if(g.main.stage<100||g.knowledge<50*(g.ancestral+1))throw fail('100구역과 선조 지식이 필요해요.');g.knowledge-=50*(g.ancestral+1);g.ancestral++;break;
 case 'tutorial':g.tutorial=Math.max(g.tutorial,clamp(num(p.step),0,6));break;
 default:throw fail('알 수 없는 작업이에요.');
 }
 g.revision=(g.revision||0)+1;g.bestStage=Math.max(g.bestStage,g.main.stage);return result;
}
export function view(g,now=Date.now()){
 return {...g,serverAt:now,schedules:schedule(now)};
}
