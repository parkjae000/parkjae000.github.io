import * as E from './economy.mjs';
export const VERSION='1.1.1',DAY=86400000,KST=9*3600000,OFFLINE_CAP=8*3600000;
export const fail=(message,code='invalid',status=400)=>Object.assign(new Error(message),{code,status});
export const dayKey=now=>new Date(now+KST).toISOString().slice(0,10);
export const TASKS=[{id:'visit',name:'오늘의 출석',goal:1,gems:10,elixir:20},{id:'rocks',name:'바위 20개 채굴',goal:20,gems:5,elixir:30},{id:'hires',name:'친구 3명 채용',goal:3,gems:3,elixir:20},{id:'merges',name:'친구 2번 합성',goal:2,gems:3,elixir:20}];
export const GUIDE=[
 {id:'merge',title:'같은 레벨 친구를 합쳐요',text:'같은 숫자의 친구를 다른 친구에게 끌어 놓으세요. 한 단계 강해져요.'},
 {id:'assign',title:'바위를 눌러 일을 맡겨요',text:'표시된 바위를 눌러 보세요. 친구를 바위로 끌어 놓아도 바로 채굴해요.'},
 {id:'upgrade',title:'찻집에 골드를 투자해요',text:'기본 찻집의 초록 강화 버튼을 누르세요. +N은 한 번에 오르는 레벨 수예요.'},
 {id:'recruit',title:'새 친구를 불러요',text:'아래 가운데 채용 버튼을 누르세요. 표시된 레벨의 친구가 대포에서 도착해요.'},
 {id:'next',title:'출구까지 길을 열어요',text:'빈 바닥을 위아래로 밀어 출구를 보세요. 바위와 문을 열고, 출구를 다시 누르면 다음 구역으로 가요.'},
 {id:'repair',title:'새 생산시설을 복구해요',text:'시설 앞 바위를 정리한 뒤 시설 복구를 누르세요. 친구를 끌어 놓아도 돼요.'},
 {id:'activate',title:'복구한 시설을 가동해요',text:'복구 시간이 끝나면 가동하기를 누르세요. 새 찻집이 골드를 생산하기 시작해요.'},
 {id:'collect',title:'첫 생산 골드를 받아요',text:'생산 주기가 끝나면 찻집을 눌러 골드를 받아 보세요. 처음에는 직접 받아야 해요.'},
 {id:'research',title:'찻집 매뉴얼을 연구해요',text:'아래 카드 메뉴에서 숲속 찻집 매뉴얼을 Lv.1로 연구하세요. 필요한 카드와 연구 포인트를 사용해요.'},
 {id:'automate',title:'자동 수령을 켜요',text:'숲속 찻집을 누르고 자동 수령 켜기를 선택하세요. 이제 골드를 누르지 않아도 받아요.'}
];
export function rollDay(g,now){const key=dayKey(now);if(g.daily?.key!==key){g.daily={key,visit:1,rocks:0,hires:0,merges:0,claims:[]};g.wheel.free=false;g.wheel.extra=0;g.wheel.nextAt=0;}}
export function startGame(now=Date.now(),seed=17){const g=E.createState(1,seed);g.version=VERSION;g.lastAt=now;g.revision=0;g.stats={bestStage:1,rocks:0,hires:0,merges:0,upgrades:0,manualAssignments:0,facilityStarted:0,activated:0,collections:0,automated:0};g.guide={step:0,paused:false,rewarded:false};rollDay(g,now);g.friends.forEach(w=>E.move(g,w.id,w.x,w.y));return g;}
export function reconcileGuide(g){const s=g.stats,done=[s.merges>0,s.manualAssignments>0||g.rocks.every(r=>r.done),s.upgrades>0,s.hires>0,s.bestStage>=2,s.facilityStarted>0||s.activated>0,s.activated>0,(s.collections||0)>0||g.facilities.some(f=>f.id!=='forge'&&f.auto),g.cards.tea.level>=1,(s.automated||0)>0||g.facilities.some(f=>f.id!=='forge'&&f.auto)];while(g.guide.step<GUIDE.length&&done[g.guide.step])g.guide.step++;if(g.guide.step===GUIDE.length&&!g.guide.rewarded){g.guide.rewarded=true;g.gems+=10;g.elixir+=20;}}
export function advance(g,now){g.auto=false;g.version=VERSION;if(!Number.isFinite(now))throw fail('시간을 확인해 주세요.');const last=g.lastAt,until=Math.max(last,now),from=Math.max(last,until-OFFLINE_CAP),beforeGold=g.gold,beforeRocks=g.stats.rocks;let cursor=from;rollDay(g,cursor);const births=[];
 while(cursor<until){const midnight=Math.floor((cursor+KST)/DAY)*DAY+DAY-KST,end=Math.min(until,midnight),count=g.rocks.filter(r=>r.done).length;const result=E.advance(g,(end-cursor)/1000);births.push(...result.births);const dug=g.rocks.filter(r=>r.done).length-count;g.stats.rocks+=dug;g.daily.rocks+=dug;cursor=end;rollDay(g,cursor);}
 g.lastAt=until;reconcileGuide(g);return {seconds:Math.max(0,(until-from)/1000),gold:g.gold-beforeGold,rocks:g.stats.rocks-beforeRocks,births};}
const str=(v,max=100)=>{if(typeof v!=='string'||!v||v.length>max)throw fail('작업 대상을 확인해 주세요.');return v;};
const int=(v,min,max)=>{if(!Number.isInteger(v)||v<min||v>max)throw fail('작업 수치를 확인해 주세요.');return v;};
export const PREDICTABLE=new Set(['assign','move','merge','recruit','upgrade','activate','collect','research','automate','auto','next','guide','unpack','charge','mergeCharges']);
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
 case 'next':{const n=E.nextMine(g);for(const key of ['lastAt','revision','stats','guide','daily'])n[key]=g[key];n.version=VERSION;n.stats.bestStage=Math.max(n.stats.bestStage,n.stage);game=n;result={stage:n.stage};break;}
 case 'guide':if(typeof p.paused!=='boolean')throw fail('안내 설정을 확인해 주세요.');g.guide.paused=p.paused;result={...g.guide};break;
 case 'buy':{const before=g.stats.rocks,count=g.rocks.filter(r=>r.done).length;result=E.buy(g,str(p.offer));const dug=g.rocks.filter(r=>r.done).length-count;g.stats.rocks=before+dug;g.daily.rocks+=dug;break;}
 case 'barrel':if(p.barrel!==undefined&&str(p.barrel)!==g.barrel?.id)throw fail('이미 열린 보급통이에요.');result=E.openBarrel(g);break;
 case 'wheel':{if(typeof p.extra!=='boolean')throw fail('회전 종류를 확인해 주세요.');const count=g.rocks.filter(r=>r.done).length;result=E.spin(g,p.extra);const dug=g.rocks.filter(r=>r.done).length-count;g.stats.rocks+=dug;g.daily.rocks+=dug;break;}
 case 'daily':{const task=TASKS.find(t=>t.id===p.id);if(!task||g.daily.claims.includes(task.id)||(g.daily[task.id]||0)<task.goal)throw fail('업무를 완료한 뒤 한 번만 받을 수 있어요.');g.daily.claims.push(task.id);g.gems+=task.gems;g.elixir+=task.elixir;result={text:`보석 ${task.gems} · 연구 ${task.elixir}를 받았어요.`};break;}
 default:throw fail('지원하지 않는 작업이에요.');
 }reconcileGuide(game);return {game,result};}
