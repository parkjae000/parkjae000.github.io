// Shared mining rules. The server owns saved state and validates all commands.
export const ECONOMY_VERSION='1.1.1';
export const COLS=7,MAX_LEVEL=200,CAPACITY=8;
export const CHARACTERS=[{name:'우사기',idle:2,hit:5},{name:'하치와레',idle:1,hit:4},{name:'치이카와',idle:0,hit:3}];
export const appearance=level=>CHARACTERS[(Math.max(1,Math.floor(level))-1)%3];
export const scale=stage=>2.3**Math.floor((stage-1)/4)*1.055**Math.min(stage-1,120);
const BASE={forge:{name:'기본 찻집',yield:12,cycle:4,cost:35,growth:1.18,required:0,art:16},tea:{name:'숲속 찻집',yield:48,cycle:6,cost:60,growth:1.16,required:1,art:10},bakery:{name:'간식 공방',yield:120,cycle:8,cost:90,growth:1.17,required:2,art:11}};
export const facilityDef=id=>BASE[id];
export const milestones=level=>2**((level>=5?1:0)+(level>=10?1:0)+Math.floor(level/25));
export function milestoneBar(level){const points=[1,5,10,...Array.from({length:8},(_,i)=>(i+1)*25)],previous=points.filter(n=>n<=level).at(-1)||1,next=points.find(n=>n>level)||200;return {previous,next,progress:level>=200?1:(level-previous)/(next-previous)};}
export const hireLevel=s=>Math.min(30,1+Math.floor((s.stage-1)/4)+Math.floor(s.hires/10));
export const hirePrice=s=>Math.ceil(45*s.scale*1.32**Math.min(s.hires,20)*1.08**Math.max(0,s.hires-20)*.85**s.checkpoints.filter(t=>t.done).length*.94**s.cards.discount.level);
export const workerPower=(s,w)=>4*2.3**(w.level-1)*1.18**s.cards.pickaxe.level;
export const cycleYield=(s,f)=>Math.max(1,Math.round(BASE[f.id].yield*s.scale*1.08**(f.level-1)*milestones(f.level)*1.25**s.cards[f.id].level));
export const facilityRate=(s,f)=>cycleYield(s,f)/BASE[f.id].cycle;
export const upgradePrice=(s,f,level=f.level)=>Math.ceil(BASE[f.id].cost*s.scale*BASE[f.id].growth**(level-1));
export function quoteUpgrade(s,f,limit=200){if(!f.active||f.level>=MAX_LEVEL)return {count:0,cost:0};let count=0,cost=0;while(count<limit&&f.level+count<MAX_LEVEL){const next=upgradePrice(s,f,f.level+count);if(cost+next>s.gold+1e-7)break;cost+=next;count++;}return {count,cost:count?cost:upgradePrice(s,f)};}
const id=s=>'u'+(++s.sequence);
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
const error=text=>{throw new Error(text);};
export function mapPlan(stage){const count=stage<4?1:stage<12?2:3,mineRows=stage===1?5:8;return Array.from({length:count},(_,i)=>{const top=(count-1-i)*(mineRows+4);return {index:i,top,bottom:top+mineRows-1,campRow:top+mineRows};});}
export function createState(stage=2,seed=17,permanent=null){
 const segments=mapPlan(stage),rows=segments[0].bottom+1;
 const s={version:ECONOMY_VERSION,stage,scale:scale(stage),seed,sequence:0,rows,segments,camp:{segment:0,row:segments[0].campRow,moves:0},gold:Math.round(240*scale(stage)),elixir:60,gems:96,hires:0,elapsed:0,freeAt:2400,barrelAt:25,barrel:null,auto:false,cards:Object.fromEntries(['forge','tea','bakery','pickaxe','discount'].map(k=>[k,{level:0,count:8}])),friends:[],rocks:[],facilities:[],checkpoints:[],ledger:{forge:0,tea:0,bakery:0,rocks:0,barrels:0},merges:0,wheel:{free:false,extra:0,nextAt:0},shop:{freeAt:0},cleared:false};
 if(permanent){for(const k of ['elixir','gems','cards','wheel','shop'])s[k]=structuredClone(permanent[k]);s.wheel.nextAt=Math.max(0,s.wheel.nextAt-permanent.elapsed);s.shop.freeAt=Math.max(0,s.shop.freeAt-permanent.elapsed);}
 s.facilities=[{id:'forge',level:1,active:true,repaired:true,auto:true,progress:0,ready:0,hp:0,max:0,footprint:[]}];
 const sideIds=stage===1?[]:stage===2?['tea']:['tea','bakery'];
 for(const [i,kind] of sideIds.entries()){
  const segment=i?segments.at(-1):segments[0],start=segment.top+(i?1:3),hp=Math.ceil((stage<=2?180+i*80:400+i*180)*s.scale);
  s.facilities.push({id:kind,level:1,active:false,repaired:false,auto:false,progress:0,ready:0,hp,max:hp,port:[i?4:2,start+2],visual:{x:i?5.7:.3,y:start+1.1},footprint:Array.from({length:10},(_,j)=>[i?5+j%2:j%2,start+Math.floor(j/2)])});
 }
 for(const segment of segments)for(let y=segment.top;y<=segment.bottom;y++)for(let x=0;x<COLS;x++){
  if(s.facilities.some(f=>f.footprint.some(p=>p[0]===x&&p[1]===y)))continue;
  const depth=segment.bottom-y+(segment.index*3),kind=(x*7+y*13+stage)%17===0?'chest':(x+y*3)%7===0?'gold':(x*2+y)%5===0?'crystal':'rock',hp=Math.ceil((stage<=2?40:100)*s.scale*1.14**depth*(kind==='crystal'?1.3:kind==='gold'?1.2:1)*(1+(x%3)*.08));
  s.rocks.push({id:'r'+x+'-'+y,x,y,kind,type:{rock:6,crystal:7,gold:8,chest:9}[kind],level:1+Math.floor((stage-1)/4)+Math.floor(depth/2),hp,max:hp,depth,done:false});
 }
 for(const segment of segments.slice(1)){const hp=Math.ceil(220*s.scale*(1+segment.index*.2));s.checkpoints.push({id:'checkpoint-'+segment.index,x:3,y:segment.campRow+3,toSegment:segment.index,hp,max:hp,done:false,kind:'checkpoint'});}
 // Compatibility alias for older read-only audits; real layout uses the checkpoint array.
 s.checkpoint=s.checkpoints[0]||{id:'no-checkpoint',done:true};
 const hp=Math.ceil((stage<=2?260:650)*s.scale);s.exit={id:'exit',x:3,y:-1,hp,max:hp,done:false,kind:'exit'};
 for(let i=0;i<3;i++)s.friends.push({id:id(s),level:hireLevel(s),x:2+i,y:s.camp.row,target:null,paused:false});return s;
}
export const occupiedSlots = s => s.friends.length + (s.workerBarrels?.length || 0);
export const deliveryInterval = s => 2400 * .9 ** s.checkpoints.filter(gate => gate.done).length;
export const targets=s=>[...s.rocks.filter(r=>!r.done),...s.facilities.filter(f=>!f.repaired),...s.checkpoints.filter(t=>!t.done),...(s.exit.done?[]:[s.exit])];
function campBlocked(s,x,y){return y>=s.camp.row+1&&y<=s.camp.row+2&&(x<=1||x>=5);}
export function openTiles(s){const blocked=new Set(s.rocks.filter(r=>!r.done).map(r=>r.x+','+r.y));for(const f of s.facilities)for(const p of f.footprint)blocked.add(p.join(','));for(const t of s.checkpoints)for(let x=0;x<COLS;x++)if(x!==3||!t.done)blocked.add(x+','+t.y);for(let y=s.camp.row+1;y<=s.camp.row+2;y++)for(let x=0;x<COLS;x++)if(campBlocked(s,x,y))blocked.add(x+','+y);
 const seen=new Set(),queue=[[3,s.camp.row]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i],k=x+','+y;if(seen.has(k)||blocked.has(k)||x<0||x>=COLS||y<0||y>s.rows+2)continue;seen.add(k);queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}return seen;
}
export function freeTiles(s,worker=null){return [...openTiles(s)].map(k=>k.split(',').map(Number)).filter(([x,y])=>!(x===6&&y===s.camp.row)&&!s.friends.some(w=>w.id!==worker?.id&&w.x===x&&w.y===y));}
function spotFor(open,t,w=null){const spots=(t.port?[t.port]:[[t.x,t.y+1],[t.x-1,t.y],[t.x+1,t.y],[t.x,t.y-1]]).filter(p=>open.has(p.join(',')));spots.sort((a,b)=>{const score=p=>w?Math.abs(p[0]-w.x)+Math.abs(p[1]-w.y):-p[1];return score(a)-score(b);});return spots[0]?{x:spots[0][0],y:spots[0][1]}:null;}
export function destination(s,t,w=null){return spotFor(new Set(freeTiles(s,w).map(p=>p.join(','))),t,w);}
export function assign(s,workerId,targetId){const w=s.friends.find(w=>w.id===workerId),t=targets(s).find(t=>t.id===targetId);if(!w||!t)error('일할 친구와 대상을 다시 선택해 주세요.');const p=destination(s,t,w);if(!p)error('앞의 바위를 캐서 연결된 작업 자리를 열어 주세요.');Object.assign(w,p);w.target=t.id;w.paused=false;return w;}
export function move(s,workerId,x,y){const w=s.friends.find(w=>w.id===workerId);if(!w||!freeTiles(s,w).some(p=>p[0]===x&&p[1]===y))error('연결된 빈 바닥에 놓아 주세요.');const adjacent = s.rocks.filter(rock => !rock.done && Math.abs(x-rock.x)+Math.abs(y-rock.y)===1);
 const target = adjacent.find(rock => rock.id===w.target) || adjacent.sort((a,b)=>a.hp-b.hp)[0];
 Object.assign(w,{x,y,target:target?.id || null,paused:!target});return w;}
export function spawnOrigin(s){return {x:3,y:s.camp.row};}
function addFriend(s,level=hireLevel(s)){if(occupiedSlots(s)>=CAPACITY)error('같은 레벨 친구를 합쳐 빈자리를 만들어 주세요.');const origin=spawnOrigin(s),p=freeTiles(s).sort((a,b)=>Math.abs(a[1]-origin.y)*3+Math.abs(a[0]-origin.x)-Math.abs(b[1]-origin.y)*3-Math.abs(b[0]-origin.x))[0];if(!p)error('친구가 설 빈자리가 필요해요.');const w={id:id(s),level,x:p[0],y:p[1],target:null,paused:false};s.friends.push(w);return w;}
export function recruit(s){const price=hirePrice(s);if(s.gold<price)error('골드가 부족해요. 기본 찻집은 계속 생산해요.');const w=addFriend(s);s.gold-=price;s.hires++;return w;}
export function merge(s,aId,bId){const a=s.friends.find(w=>w.id===aId),b=s.friends.find(w=>w.id===bId);if(!a||!b||a===b||a.level!==b.level)error('같은 레벨 친구 두 명을 합쳐 주세요.');if(b.level>=40)error('최대 레벨이에요.');b.level++;
 const jobs=targets(s);
 const work=[b.target,a.target].map(id=>jobs.find(t=>t.id===id)).find(t=>t&&validTask(b,t));
 b.target=work?.id||null;b.paused=false;s.friends=s.friends.filter(w=>w!==a);s.merges++;return b;}
export function upgrade(s,fId,count=null){const f=s.facilities.find(f=>f.id===fId);if(!f?.active)error('먼저 시설을 복구하고 가동해 주세요.');const q=quoteUpgrade(s,f,count??200);if(!q.count||count!=null&&q.count!==count)error('시설 강화에 필요한 골드가 부족해요.');const before=milestones(f.level);s.gold-=q.cost;f.level+=q.count;const bonuses=Math.round(Math.log2(milestones(f.level)/before));s.elixir+=bonuses*10;return {...q,bonuses,level:f.level};}
export function activate(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.repaired||f.active)error('시설 복구를 먼저 완료해 주세요.');f.active=true;f.progress=0;s.elixir+=20;for(const c of ['tea','bakery'])s.cards[c].count+=2;return f;}
export function collect(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.ready)error('아직 생산 중이에요.');const amount=f.ready;s.gold+=amount;s.ledger[f.id]+=amount;f.ready=0;f.progress=0;return amount;}
export function researchCost(s,card){const c=s.cards[card];return {cards:2+c.level*2,elixir:Math.ceil(12*1.55**c.level)};}
export function cardPreview(s,card){const c=s.cards[card],cost=researchCost(s,card),next=structuredClone(s);next.cards[card].level=Math.min(20,c.level+1);const f=s.facilities.find(f=>f.id===card)||{id:card,level:1};let current,value,label,unit;
 if(BASE[card]){current=cycleYield(s,f);value=cycleYield(next,f);label=BASE[card].name+' · '+BASE[card].cycle+'초 생산';unit='골드';}
 else if(card==='pickaxe'){current=workerPower(s,{level:1});value=workerPower(next,{level:1});label='Lv.1 친구 작업 능력';unit='/초';}
 else {current=hirePrice(s);value=hirePrice(next);label='현재 소환 레벨 채용 비용';unit='골드';}
 return {current,next:value,label,unit,cost,max:c.level>=20,art:BASE[card]?.art??(card==='pickaxe'?18:19)};
}
export function research(s,card){const c=s.cards[card];if(!c||c.level>=20)error('최대 연구 레벨이에요.');const cost=researchCost(s,card);if(c.count<cost.cards||s.elixir<cost.elixir)error('카드 또는 연구 포인트가 부족해요.');c.count-=cost.cards;s.elixir-=cost.elixir;c.level++;return c;}
export function automate(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.active)error('먼저 시설을 가동해 주세요.');if(s.cards[f.id].level<BASE[f.id].required)error(`${BASE[f.id].name} 카드를 Lv.${BASE[f.id].required}까지 연구해 주세요.`);if(f.ready)collect(s,fId);f.auto=true;return f;}
function forwardCamp(s,t){const segment=s.segments[t.toSegment];s.camp={segment:segment.index,row:segment.campRow,moves:s.camp.moves+1};for(const w of s.friends){if(w.target===t.id)w.target=null;if(!w.target||campBlocked(s,w.x,w.y)){const p=freeTiles(s,w).sort((a,b)=>Math.abs(a[1]-s.camp.row)*3+Math.abs(a[0]-3)-Math.abs(b[1]-s.camp.row)*3-Math.abs(b[0]-3))[0];if(p)Object.assign(w,{x:p[0],y:p[1],target:null});}}}
function destroyed(s,t){t.hp=0;if(t.port){t.repaired=true;return;}t.done=true;if(t.id==='exit'){s.cleared=true;return;}if(t.kind==='checkpoint'){forwardCamp(s,t);s.elixir+=20;for(const c of Object.values(s.cards))c.count+=2;s.freeAt=Math.min(s.freeAt,s.elapsed+deliveryInterval(s));return;}const reward=Math.round(t.max*.45*(t.kind==='gold'?1.5:1));s.gold+=reward;s.ledger.rocks+=reward;s.elixir+=t.kind==='chest'?12:2;if(t.kind==='chest')for(let i=0;i<8;i++){const keys=Object.keys(s.cards);s.cards[keys[Math.floor(random(s)*keys.length)]].count++;}}
function validTask(w,t){return t.port?w.x===t.port[0]&&w.y===t.port[1]:Math.abs(w.x-t.x)+Math.abs(w.y-t.y)===1;}
export function advance(s,seconds){let remaining=Math.max(0,Math.min(seconds,8*3600)),iterations=0;const births=[];while(remaining>1e-8&&iterations++<100000){
 const active=targets(s),work=new Map();for(const w of s.friends){const t=active.find(t=>t.id===w.target);if(!t||!validTask(w,t)){w.target=null;continue;}const item=work.get(t.id)||{t,power:0};item.power+=workerPower(s,w);work.set(t.id,item);}
 let step=remaining;if(!s.barrel&&s.barrelAt>s.elapsed)step=Math.min(step,s.barrelAt-s.elapsed);if(occupiedSlots(s)<CAPACITY&&s.freeAt>s.elapsed)step=Math.min(step,s.freeAt-s.elapsed);for(const {t,power}of work.values())step=Math.min(step,t.hp/power);for(const f of s.facilities.filter(f=>f.active&&(f.auto||!f.ready)))step=Math.min(step,BASE[f.id].cycle-f.progress);if(step<1e-8)step=Math.min(remaining,1e-7);
 for(const f of s.facilities.filter(f=>f.active&&(f.auto||!f.ready))){f.progress+=step;if(f.progress>=BASE[f.id].cycle-1e-7){const amount=cycleYield(s,f);f.progress=Math.max(0,f.progress-BASE[f.id].cycle);if(f.auto){s.gold+=amount;s.ledger[f.id]+=amount;}else {f.ready=amount;f.progress=0;}}}
 for(const {t,power}of work.values())t.hp=Math.max(0,t.hp-power*step);s.elapsed+=step;remaining-=step;
 for(const {t}of work.values())if(t.hp<1e-6){destroyed(s,t);for(const w of s.friends.filter(w=>w.target===t.id))w.target=null;}
 if(s.elapsed>=s.freeAt&&occupiedSlots(s)<CAPACITY){(s.workerBarrels ??= []).push({id:id(s),level:hireLevel(s)});s.freeAt=s.elapsed+deliveryInterval(s);}
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
  for(const w of s.friends)if(w.target===target.id)w.target=null;
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
export function openBarrel(s){if(!s.barrel)error('보급 배달을 기다려 주세요.');const r=random(s);let result;if(r<.15&&occupiedSlots(s)<CAPACITY){const w=addFriend(s,Math.max(1,hireLevel(s)-1));result={type:'worker',id:w.id,text:'친구가 도착했어요!'};}else if(r>=.4&&r<.5&&(s.charges?.length||0)<4){
 const charge={id:id(s),level:Math.max(1,...s.friends.map(w=>w.level))};
 (s.charges??=[]).push(charge);result={type:'charge',text:'별사탕 폭죽 Lv.'+charge.level+' 획득! 바위로 끌어 놓으세요.'};
 }else if(r<.4){const amount=8+Math.floor(random(s)*12);s.elixir+=amount;result={type:'elixir',text:'연구 포인트 +'+amount};}else {const amount=Math.round(regularIncome(s)*20);s.gold+=amount;s.ledger.barrels+=amount;result={type:'gold',amount,text:'보급 골드 +'+Math.floor(amount).toLocaleString('ko-KR')};}s.barrel=null;s.barrelAt=s.elapsed+25;return result;}
export function readyForNext(s){return s.exit.done&&s.facilities.every(f=>f.active);}
export function nextMine(s){if(!readyForNext(s))error('모든 시설과 출구를 개방해 주세요.');return createState(s.stage+1,s.seed,s);}
export const WHEEL_REWARDS=[{type:'gems',amount:10,label:'보석 10'},{type:'elixir',amount:25,label:'연구 25'},{type:'cards',amount:4,label:'카드 4장'},{type:'time',amount:60,label:'시간 1분'},{type:'gems',amount:30,label:'보석 30'},{type:'elixir',amount:60,label:'연구 60'},{type:'cards',amount:8,label:'카드 8장'},{type:'worker',amount:1,label:'친구 +1레벨'}];
export function spin(s,extra=false){if(extra){if(s.wheel.extra>=5||s.elapsed<s.wheel.nextAt)error('추가 회전 준비 중이에요.');s.wheel.extra++;s.wheel.nextAt=s.elapsed+7200;}else {if(s.wheel.free)error('무료 회전을 이미 사용했어요.');s.wheel.free=true;}
 const index=Math.floor(random(s)*WHEEL_REWARDS.length),reward={...WHEEL_REWARDS[index],index};if(reward.type==='gems')s.gems+=reward.amount;else if(reward.type==='elixir')s.elixir+=reward.amount;else if(reward.type==='cards'){const keys=Object.keys(s.cards);for(let i=0;i<reward.amount;i++)s.cards[keys[Math.floor(random(s)*keys.length)]].count++;}else if(reward.type==='time')advance(s,reward.amount);else if(occupiedSlots(s)<CAPACITY)reward.id=addFriend(s,hireLevel(s)+1).id;else {s.elixir+=40;reward.label='정원 가득 · 연구 40';reward.type='elixir';reward.amount=40;}return reward;}
export function buy(s,offer){let price=0,result={type:offer};if(offer==='free'){if(s.elapsed<s.shop.freeAt)error('무료 상자를 준비 중이에요.');s.shop.freeAt=s.elapsed+14400;s.elixir+=15;for(let i=0;i<3;i++){const keys=Object.keys(s.cards);s.cards[keys[Math.floor(random(s)*keys.length)]].count++;}result.text='카드 3장 · 연구 15를 받았어요.';return result;}
 if(offer==='chest')price=35;else if(offer==='research')price=25;else if(offer==='time')price=20;else if(offer.startsWith('card-')&&s.cards[offer.slice(5)])price=12;else error('상품을 다시 선택해 주세요.');if(s.gems<price)error('보석이 부족해요.');s.gems-=price;
 if(offer==='chest'){s.elixir+=60;for(const c of Object.values(s.cards))c.count+=2;result.text='카드 각 2장 · 연구 60을 받았어요.';}else if(offer==='research'){s.elixir+=80;result.text='연구 포인트 80을 받았어요.';}else if(offer==='time'){advance(s,300);result.text='시설 생산과 지정한 작업을 5분 진행했어요.';}else {s.cards[offer.slice(5)].count+=3;result.text='선택한 카드 3장을 받았어요.';}return result;
}
