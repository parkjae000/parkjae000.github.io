import * as E from './economy.mjs';
export const VERSION='1.2.0',DAY=86400000,KST=9*3600000,OFFLINE_CAP=8*3600000;
export const fail=(message,code='invalid',status=400)=>Object.assign(new Error(message),{code,status});
export const dayKey=now=>new Date(now+KST).toISOString().slice(0,10);
export const TASKS=[{id:'visit',name:'오늘의 출석',goal:1,gems:10,elixir:20},{id:'rocks',name:'바위 20개 채굴',goal:20,gems:5,elixir:30},{id:'hires',name:'친구 3명 채용',goal:3,gems:3,elixir:20},{id:'merges',name:'친구 2번 합성',goal:2,gems:3,elixir:20}];
export function rollDay(g,now){const key=dayKey(now);if(g.daily?.key!==key){g.daily={key,visit:1,rocks:0,hires:0,merges:0,claims:[]};g.wheel.free=false;g.wheel.extra=0;g.wheel.nextAt=0;}}
export function startGame(now=Date.now(),seed=17){const g=E.createState(1,seed);g.version=VERSION;g.lastAt=now;g.revision=0;g.stats={bestStage:1,rocks:0,hires:0,merges:0,upgrades:0,manualAssignments:0,facilityStarted:0,activated:0,collections:0,automated:0};g.introSeen=true;g.guide={step:10,paused:true,rewarded:true};rollDay(g,now);g.friends.forEach(w=>E.move(g,w.id,w.x,w.y));return g;}
export function advance(g,now){if(g.version!==VERSION){
  E.preserveEarnedMultipliers(g.facilities);
  g.cards.capacity??={level:0,count:0};
  g.version=VERSION;
  if(g.guide)g.guide.paused=true;
 }
 // Older clients still read this flag when opening a saved account.
 g.introSeen=true;
 g.auto=false;if(!Number.isFinite(now))throw fail('시간을 확인해 주세요.');const last=g.lastAt,until=Math.max(last,now),from=Math.max(last,until-OFFLINE_CAP),beforeGold=g.gold,beforeRocks=g.stats.rocks;let cursor=from;rollDay(g,cursor);const births=[];
 while(cursor<until){const midnight=Math.floor((cursor+KST)/DAY)*DAY+DAY-KST,end=Math.min(until,midnight),count=g.rocks.filter(r=>r.done).length;const result=E.advance(g,(end-cursor)/1000);births.push(...result.births);const dug=g.rocks.filter(r=>r.done).length-count;g.stats.rocks+=dug;g.daily.rocks+=dug;cursor=end;rollDay(g,cursor);}
 g.lastAt=until;return {seconds:Math.max(0,(until-from)/1000),gold:g.gold-beforeGold,rocks:g.stats.rocks-beforeRocks,births};}
const str=(v,max=100)=>{if(typeof v!=='string'||!v||v.length>max)throw fail('작업 대상을 확인해 주세요.');return v;};
const int=(v,min,max)=>{if(!Number.isInteger(v)||v<min||v>max)throw fail('작업 수치를 확인해 주세요.');return v;};
export const PREDICTABLE=new Set(['assign','move','merge','recruit','upgrade','activate','collect','research','automate','auto','next','guide','dismissIntro','unpack','charge','mergeCharges']);
export function perform(g,type,p={},requestId='local-action',now=g.lastAt){let result,game=g;switch(type){
 case 'assign':{const target=str(p.target);result=E.assign(g,str(p.worker),target);if(target.startsWith('r'))g.stats.manualAssignments++;if(g.facilities.some(f=>f.id===target))g.stats.facilityStarted++;break;}
 case 'move':result=E.move(g,str(p.worker),int(p.x,0,6),int(p.y,0,g.rows+2));if(result.target)g.stats.manualAssignments++;break;
 case 'charge':{
  const target=str(p.target),wasRock=g.rocks.some(r=>r.id===target&&!r.done);
  result=E.useCharge(g,str(p.charge),target);
  if(wasRock&&result.cleared){g.stats.rocks++;g.daily.rocks++;}
  break;
 }
 case 'mergeCharges':result=E.mergeCharges(g,str(p.a),str(p.b));break;
 case 'unpack':result=E.unpackWorker(g,str(p.barrel));result.id='w-'+str(requestId,80);break;
 case 'merge':result=E.merge(g,str(p.a),str(p.b));g.stats.merges++;g.daily.merges++;break;
 case 'recruit':result=E.recruit(g);result.id='w-'+str(requestId,80);g.stats.hires++;g.daily.hires++;break;
 case 'upgrade':result=E.upgrade(g,str(p.facility),int(p.count,1,200));g.stats.upgrades++;break;
 case 'activate':result=E.activate(g,str(p.facility));g.stats.activated++;break;
 case 'collect':result={amount:E.collect(g,str(p.facility))};g.stats.collections=(g.stats.collections||0)+1;break;
 case 'research':result=E.research(g,str(p.card));break;
 case 'automate':result=E.automate(g,str(p.facility));g.stats.automated=(g.stats.automated||0)+1;break;
 // Old clients can still replay a queued toggle after reconnecting.
 case 'auto':g.auto=false;result={enabled:false};break;
 case 'next':{const n=E.nextMine(g);for(const key of ['lastAt','revision','stats','guide','daily','introSeen'])n[key]=g[key];n.version=VERSION;n.stats.bestStage=Math.max(n.stats.bestStage,n.stage);game=n;result={stage:n.stage};break;}
 case 'dismissIntro':g.introSeen=true;result={seen:true};break;
 // A client returning with an old queued tutorial action can discard it safely.
 case 'guide':result={paused:true};break;
 case 'buy':{const before=g.stats.rocks,count=g.rocks.filter(r=>r.done).length;result=E.buy(g,str(p.offer));const dug=g.rocks.filter(r=>r.done).length-count;g.stats.rocks=before+dug;g.daily.rocks+=dug;break;}
 case 'barrel':if(p.barrel!==undefined&&str(p.barrel)!==g.barrel?.id)throw fail('이미 열린 보급통이에요.');result=E.openBarrel(g);if(result.type==='partner'){g.stats.merges++;g.daily.merges++;}break;
 case 'wheel':{if(typeof p.extra!=='boolean')throw fail('회전 종류를 확인해 주세요.');const count=g.rocks.filter(r=>r.done).length;result=E.spin(g,p.extra);const dug=g.rocks.filter(r=>r.done).length-count;g.stats.rocks+=dug;g.daily.rocks+=dug;break;}
 case 'daily':{const task=TASKS.find(t=>t.id===p.id);if(!task||g.daily.claims.includes(task.id)||(g.daily[task.id]||0)<task.goal)throw fail('업무를 완료한 뒤 한 번만 받을 수 있어요.');g.daily.claims.push(task.id);g.gems+=task.gems;g.elixir+=task.elixir;result={text:`보석 ${task.gems} · 연구 ${task.elixir}를 받았어요.`};break;}
 default:throw fail('지원하지 않는 작업이에요.');
 }return {game,result};}
