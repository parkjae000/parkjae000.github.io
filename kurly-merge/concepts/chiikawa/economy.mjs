// Isolated playable prototype. Original-game structure is researched; coefficients below are our own.
export const ECONOMY_VERSION='0.2.0';
export const COLS=7,MAX_LEVEL=200,CAPACITY=8;
export const CHARACTERS=[{name:'우사기',idle:2,hit:5},{name:'하치와레',idle:1,hit:4},{name:'치이카와',idle:0,hit:3}];
export const appearance=level=>CHARACTERS[(Math.max(1,Math.floor(level))-1)%3];
export const scale=stage=>2.3**Math.floor((stage-1)/4)*1.055**Math.min(stage-1,120);
const BASE={forge:{name:'기본 찻집',yield:12,cycle:4,cost:35,growth:1.18,required:0,art:10},tea:{name:'숲속 찻집',yield:48,cycle:6,cost:60,growth:1.16,required:1,art:10},bakery:{name:'간식 공방',yield:120,cycle:8,cost:90,growth:1.17,required:2,art:11}};
export const facilityDef=id=>BASE[id];
export const milestones=level=>2**((level>=5?1:0)+(level>=10?1:0)+Math.floor(level/25));
export function milestoneBar(level){const points=[1,5,10,...Array.from({length:8},(_,i)=>(i+1)*25)],previous=points.filter(n=>n<=level).at(-1)||1,next=points.find(n=>n>level)||200;return {previous,next,progress:level>=200?1:(level-previous)/(next-previous)};}
export const hireLevel=s=>Math.min(30,1+Math.floor((s.stage-1)/4)+Math.floor(s.hires/10));
export const hirePrice=s=>Math.ceil(45*s.scale*1.32**Math.min(s.hires,20)*1.08**Math.max(0,s.hires-20)*.85**(s.stage>=3&&s.checkpoint.done?1:0)*.94**s.cards.discount.level);
export const workerPower=(s,w)=>4*2.3**(w.level-1)*1.18**s.cards.pickaxe.level;
export const cycleYield=(s,f)=>Math.max(1,Math.round(BASE[f.id].yield*s.scale*1.08**(f.level-1)*milestones(f.level)*1.25**s.cards[f.id].level));
export const facilityRate=(s,f)=>cycleYield(s,f)/BASE[f.id].cycle;
export const upgradePrice=(s,f,level=f.level)=>Math.ceil(BASE[f.id].cost*s.scale*BASE[f.id].growth**(level-1));
export function quoteUpgrade(s,f,limit=200){if(!f.active||f.level>=MAX_LEVEL)return {count:0,cost:0};let count=0,cost=0;while(count<limit&&f.level+count<MAX_LEVEL){const next=upgradePrice(s,f,f.level+count);if(cost+next>s.gold+1e-7)break;cost+=next;count++;}return {count,cost:count?cost:upgradePrice(s,f)};}
const id=s=>'u'+(++s.sequence);
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
const error=text=>{throw new Error(text);};
export function createState(stage=2,seed=17,permanent=null){
 const s={version:ECONOMY_VERSION,stage,scale:scale(stage),seed,sequence:0,rows:9,gold:Math.round(240*scale(stage)),elixir:60,gems:96,hires:0,elapsed:0,freeAt:2400,barrelAt:25,barrel:null,auto:false,cards:Object.fromEntries(['forge','tea','bakery','pickaxe','discount'].map(k=>[k,{level:0,count:8}])),friends:[],rocks:[],facilities:[],ledger:{forge:0,tea:0,bakery:0,rocks:0,barrels:0},merges:0,wheel:{free:false,extra:0,nextAt:0},cleared:false};
 if(permanent){for(const k of ['elixir','gems','cards','wheel'])s[k]=structuredClone(permanent[k]);s.wheel.nextAt=Math.max(0,s.wheel.nextAt-permanent.elapsed);}
 s.facilities=[{id:'forge',level:1,active:true,repaired:true,auto:true,progress:0,ready:0,hp:0,max:0,footprint:[]},...['tea','bakery'].map((kind,i)=>{const hp=Math.ceil((stage<=2?180+i*80:400+i*180)*s.scale);return {id:kind,level:1,active:false,repaired:false,auto:false,progress:0,ready:0,hp,max:hp,port:i?[4,3]:[2,8],visual:i?{x:5.7,y:1.8}:{x:.3,y:6.2},footprint:Array.from({length:12},(_,j)=>[i?5+j%2:j%2,(i?0:5)+Math.floor(j/2)])};})];
 for(let y=0;y<s.rows;y++)for(let x=0;x<7;x++){
  if(s.facilities.some(f=>f.footprint.some(p=>p[0]===x&&p[1]===y))||stage>=3&&y===4)continue;
  if(stage<=2&&(x<2||x>4||y<4)&&!(x===2&&y===8)&&!(x===4&&y===3))continue;
  if(stage>2&&(y===8&&[0,2,4,6].includes(x)||x===3&&y>=4&&y<=6))continue;
  const depth=s.rows-1-y,kind=(x*7+y*13+stage)%17===0?'chest':(x+y*3)%7===0?'gold':(x*2+y)%5===0?'crystal':'rock',hp=Math.ceil((stage<=2?40:120)*s.scale*1.22**depth*(kind==='crystal'?1.3:kind==='gold'?1.2:1)*(1+(x%3)*.08));
  s.rocks.push({id:'r'+x+'-'+y,x,y,kind,type:{rock:6,crystal:7,gold:8,chest:9}[kind],level:1+Math.floor((stage-1)/4)+Math.floor(depth/2),hp,max:hp,depth,done:false});
 }
 // A port cannot be occupied by a decorative omission: gate each side facility with a real front rock.
 for(const f of s.facilities.filter(f=>f.port)){const [x,y]=f.port;if(!s.rocks.some(r=>r.x===x&&r.y===y)){const hp=Math.ceil((stage<=2?40:120)*s.scale);s.rocks.push({id:'r'+x+'-'+y,x,y,kind:'rock',type:6,level:1+Math.floor((stage-1)/4),hp,max:hp,depth:0,done:false});}}
 s.checkpoint={id:'checkpoint',x:3,y:4,hp:320*s.scale,max:320*s.scale,done:stage<3,kind:'checkpoint'};
 const hp=Math.ceil((stage<=2?650:1200)*s.scale);s.exit={id:'exit',x:3,y:-1,hp,max:hp,done:false,kind:'exit'};
 for(let i=0;i<3;i++)s.friends.push({id:id(s),level:hireLevel(s),x:2+i,y:s.rows,target:null});return s;
}
export function preset(which='progress'){
 const s=createState(which==='early'?2:18);if(which==='early')return s;
 s.gold=Math.round(5000*s.scale);s.hires=21;s.checkpoint.done=true;s.checkpoint.hp=0;s.cards.tea.level=2;s.cards.bakery.level=1;s.cards.forge.level=1;
 Object.assign(s.facilities[0],{level:14});Object.assign(s.facilities[1],{level:9,active:true,repaired:true,auto:true,hp:0});Object.assign(s.facilities[2],{level:7,active:true,repaired:true,auto:false,hp:0});
 s.friends.forEach((f,i)=>{f.level=i===2?8:7;f.x=[1,3,5][i];});return s;
}
export const targets=s=>[...s.rocks.filter(r=>!r.done),...s.facilities.filter(f=>!f.repaired),...(s.checkpoint.done?[]:[s.checkpoint]),...(s.exit.done?[]:[s.exit])];
export function openTiles(s){const blocked=new Set(s.rocks.filter(r=>!r.done).map(r=>r.x+','+r.y));for(const f of s.facilities)for(const p of f.footprint)blocked.add(p.join(','));if(s.stage>=3)for(let x=0;x<7;x++)if(x!==3||!s.checkpoint.done)blocked.add(x+',4');const seen=new Set(),queue=[[3,s.rows+2]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i],k=x+','+y;if(seen.has(k)||blocked.has(k)||x<0||x>=7||y<0||y>s.rows+2)continue;seen.add(k);queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}return seen;}
export function freeTiles(s,worker=null){return [...openTiles(s)].map(k=>k.split(',').map(Number)).filter(([x,y])=>!(y===s.rows+2&&(x<=2||x>=5))&&!s.friends.some(w=>w.id!==worker?.id&&w.x===x&&w.y===y));}
export function destination(s,t,w=null){const open=new Set(freeTiles(s,w).map(p=>p.join(','))),spots=(t.port?[t.port]:[[t.x,t.y+1],[t.x-1,t.y],[t.x+1,t.y],[t.x,t.y-1]]).filter(p=>open.has(p.join(',')));spots.sort((a,b)=>{const score=p=>w?Math.abs(p[0]-w.x)+Math.abs(p[1]-w.y):-p[1];return score(a)-score(b);});return spots[0]?{x:spots[0][0],y:spots[0][1]}:null;}
export function assign(s,workerId,targetId){const w=s.friends.find(w=>w.id===workerId),t=targets(s).find(t=>t.id===targetId);if(!w||!t)error('일할 친구와 대상을 다시 선택해 주세요.');const p=destination(s,t,w);if(!p)error('먼저 앞의 바위를 정리해 빈 작업 자리를 열어 주세요.');Object.assign(w,p);w.target=t.id;return w;}
export function move(s,workerId,x,y){const w=s.friends.find(w=>w.id===workerId);if(!w||!freeTiles(s,w).some(p=>p[0]===x&&p[1]===y))error('연결된 빈 바닥에 놓아 주세요.');Object.assign(w,{x,y,target:null});return w;}
function addFriend(s,level=hireLevel(s)){if(s.friends.length>=CAPACITY)error('같은 레벨 친구를 합쳐 빈자리를 만들어 주세요.');const p=freeTiles(s).sort((a,b)=>Math.abs(a[1]-s.rows-1)+Math.abs(a[0]-3)-Math.abs(b[1]-s.rows-1)-Math.abs(b[0]-3))[0];if(!p)error('친구가 설 빈자리가 필요해요.');const w={id:id(s),level,x:p[0],y:p[1],target:null};s.friends.push(w);return w;}
export function recruit(s){const price=hirePrice(s);if(s.gold<price)error('골드가 부족해요. 기본 찻집은 계속 생산해요.');const w=addFriend(s);s.gold-=price;s.hires++;return w;}
export function merge(s,aId,bId){const a=s.friends.find(w=>w.id===aId),b=s.friends.find(w=>w.id===bId);if(!a||!b||a===b||a.level!==b.level)error('같은 레벨 친구 두 명을 합쳐 주세요.');if(b.level>=40)error('최대 레벨이에요.');b.level++;b.target=null;s.friends=s.friends.filter(w=>w!==a);s.merges++;return b;}
export function upgrade(s,fId,count=null){const f=s.facilities.find(f=>f.id===fId);if(!f?.active)error('먼저 시설을 복구하고 가동해 주세요.');const q=quoteUpgrade(s,f,count??200);if(!q.count||count!=null&&q.count!==count)error('시설 강화에 필요한 골드가 부족해요.');const before=milestones(f.level);s.gold-=q.cost;f.level+=q.count;const bonuses=Math.round(Math.log2(milestones(f.level)/before));s.elixir+=bonuses*10;return {...q,bonuses,level:f.level};}
export function activate(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.repaired||f.active)error('시설 복구를 먼저 완료해 주세요.');f.active=true;f.progress=0;s.elixir+=20;for(const c of ['tea','bakery'])s.cards[c].count+=2;return f;}
export function collect(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.ready)error('아직 생산 중이에요.');const amount=f.ready;s.gold+=amount;s.ledger[f.id]+=amount;f.ready=0;f.progress=0;return amount;}
export function researchCost(s,card){const c=s.cards[card];return {cards:2+c.level*2,elixir:Math.ceil(12*1.55**c.level)};}
export function research(s,card){const c=s.cards[card];if(!c||c.level>=20)error('연구할 수 없는 카드예요.');const cost=researchCost(s,card);if(c.count<cost.cards||s.elixir<cost.elixir)error('카드 또는 연구 포인트가 부족해요.');c.count-=cost.cards;s.elixir-=cost.elixir;c.level++;return c;}
export function automate(s,fId){const f=s.facilities.find(f=>f.id===fId);if(!f?.active)error('먼저 시설을 가동해 주세요.');if(s.cards[f.id].level<BASE[f.id].required)error(`${BASE[f.id].name} 카드를 Lv.${BASE[f.id].required}까지 연구해 주세요.`);if(f.ready)collect(s,fId);f.auto=true;return f;}
function destroyed(s,t){t.hp=0;if(t.port){t.repaired=true;return;}t.done=true;if(t.id==='exit'){s.cleared=true;return;}if(t.kind==='checkpoint'){s.elixir+=20;for(const c of Object.values(s.cards))c.count+=2;s.freeAt=Math.min(s.freeAt,s.elapsed+2160);return;}const reward=Math.round(t.max*.45*(t.kind==='gold'?1.5:1));s.gold+=reward;s.ledger.rocks+=reward;s.elixir+=t.kind==='chest'?12:2;if(t.kind==='chest')for(let i=0;i<8;i++){const keys=Object.keys(s.cards);s.cards[keys[Math.floor(random(s)*keys.length)]].count++;}}
function validTask(w,t){return t.port?w.x===t.port[0]&&w.y===t.port[1]:Math.abs(w.x-t.x)+Math.abs(w.y-t.y)===1;}
export function autoAssign(s,w){const options=targets(s).filter(t=>t.id!=='exit'||s.facilities.every(f=>f.active)).map(t=>({t,p:destination(s,t,w)})).filter(o=>o.p&&Math.abs(o.p.x-w.x)+Math.abs(o.p.y-w.y)<=2).sort((a,b)=>a.t.hp-b.t.hp);if(options[0]){Object.assign(w,options[0].p);w.target=options[0].t.id;}else w.target=null;}
export function advance(s,seconds){let remaining=Math.max(0,Math.min(seconds,8*3600)),iterations=0;const births=[];while(remaining>1e-8&&iterations++<100000){
 const active=targets(s),work=new Map();for(const w of s.friends){const t=active.find(t=>t.id===w.target);if(!t||!validTask(w,t)){w.target=null;continue;}const item=work.get(t.id)||{t,power:0};item.power+=workerPower(s,w);work.set(t.id,item);}
 let step=remaining;if(!s.barrel&&s.barrelAt>s.elapsed)step=Math.min(step,s.barrelAt-s.elapsed);if(s.friends.length<CAPACITY&&s.freeAt>s.elapsed)step=Math.min(step,s.freeAt-s.elapsed);for(const {t,power}of work.values())step=Math.min(step,t.hp/power);for(const f of s.facilities.filter(f=>f.active&&(f.auto||!f.ready)))step=Math.min(step,BASE[f.id].cycle-f.progress);if(step<1e-8)step=Math.min(remaining,1e-7);
 for(const f of s.facilities.filter(f=>f.active&&(f.auto||!f.ready))){f.progress+=step;if(f.progress>=BASE[f.id].cycle-1e-7){const amount=cycleYield(s,f);f.progress=Math.max(0,f.progress-BASE[f.id].cycle);if(f.auto){s.gold+=amount;s.ledger[f.id]+=amount;}else {f.ready=amount;f.progress=0;}}}
 for(const {t,power}of work.values())t.hp=Math.max(0,t.hp-power*step);s.elapsed+=step;remaining-=step;
 for(const {t}of work.values())if(t.hp<1e-6){destroyed(s,t);for(const w of s.friends.filter(w=>w.target===t.id)){w.target=null;if(s.auto)autoAssign(s,w);}}
 if(s.elapsed>=s.freeAt&&s.friends.length<CAPACITY){try{const w=addFriend(s);births.push(w.id);s.freeAt=s.elapsed+2400;}catch{}}
 if(!s.barrel&&s.elapsed>=s.barrelAt)s.barrel={id:id(s),at:s.elapsed};
 }if(iterations>=100000)error('정산 처리 한도를 넘었어요.');return {births};}
export const regularIncome=s=>s.facilities.filter(f=>f.active&&f.auto).reduce((n,f)=>n+facilityRate(s,f),0);
export function openBarrel(s){if(!s.barrel)error('보급 배달을 기다려 주세요.');const r=random(s);let result;if(r<.15&&s.friends.length<CAPACITY){const w=addFriend(s,Math.max(1,hireLevel(s)-1));result={type:'worker',id:w.id,text:'친구가 도착했어요!'};}else if(r<.4){const amount=8+Math.floor(random(s)*12);s.elixir+=amount;result={type:'elixir',text:'연구 포인트 +'+amount};}else {const amount=Math.round(regularIncome(s)*20);s.gold+=amount;s.ledger.barrels+=amount;result={type:'gold',amount,text:'보급 골드 +'+Math.floor(amount).toLocaleString('ko-KR')};}s.barrel=null;s.barrelAt=s.elapsed+25;return result;}
export function readyForNext(s){return s.exit.done&&s.facilities.every(f=>f.active);}
export function nextMine(s){if(!readyForNext(s))error('모든 시설과 출구를 개방해 주세요.');return createState(s.stage+1,s.seed,s);}
export function spin(s,extra=false){if(extra){if(s.wheel.extra>=5||s.elapsed<s.wheel.nextAt)error('추가 회전 준비 중이에요.');s.wheel.extra++;s.wheel.nextAt=s.elapsed+7200;}else {if(s.wheel.free)error('무료 회전을 이미 사용했어요.');s.wheel.free=true;}const pick=Math.floor(random(s)*4);if(pick===0){s.gems+=10;return '보석 +10';}if(pick===1){s.elixir+=40;return '연구 포인트 +40';}if(pick===2&&s.friends.length<CAPACITY){addFriend(s,hireLevel(s)+1);return '친구 지원!';}advance(s,60);return '1분 생산·작업 진행';}
