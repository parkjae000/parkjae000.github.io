// Isolated fictional-account preview only. Never imported by the live app.
import {quantity,toolCost,soldierStats,heroBonus} from './model.mjs?v=simple-1';
import {upgradeGrowth} from '../test/progression.mjs';
import {settleResearch} from '../test/research.mjs';
import {RESEARCH_MINUTES,BOOST_MINUTES} from '../pass-catalog.mjs';
import {useShieldReview} from '../test/shop.mjs';
const day=now=>new Date(now+9*3600000).toISOString().slice(0,10);
const clone=x=>structuredClone(x);
export function settleSimpleBoss(g,now,skip=false){
 const s=g.simple,b=s?.boss,run=b?.run;if(!run||run.finished)return null;if(!skip&&now<run.endsAt)return null;
 run.finished=true;b.claims[run.day]=true;b.scores[run.day]=(b.scores[run.day]||0)+run.score;
 g.td.growth.inventory.autoMine2h=(g.td.growth.inventory.autoMine2h||0)+1;g.td.growth.inventory.rareTickets=(g.td.growth.inventory.rareTickets||0)+1;s.toolParts+=2;
 g.inventory=clone(g.td.growth.inventory);return {score:run.score,autoMine2h:1,rareTickets:1,toolParts:2};
}
export function simpleAction(g,b,now){
 if(!g.simple||!String(b.type).startsWith('simple/'))return null;
 const t=g.td,c=t.campaign,inv=t.growth.inventory,s=g.simple;settleSimpleBoss(g,now);
 if(b.type==='simple/defense'){const next=clone(t.growth),items=[['wall','wall',next.wallLevel],...Object.entries(next.towerLevels).map(([id,level])=>['tower',id,level])].filter(([,id,level])=>level<40);if(!items.length)throw Error('최고 단계에 도달했어요.');for(const [kind,id]of items)upgradeGrowth(next,kind,id);t.growth=next;return {message:'센터 방어가 강화되었어요.'};}
 if(b.type==='simple/tool'){
  if(s.toolLevel>=20)throw Error('최고 단계에 도달했어요.');const cost=toolCost(s.toolLevel);if(s.toolParts<cost)throw Error('도구 부품이 부족해요.');s.toolParts-=cost;s.toolLevel++;return {message:'도구 Lv.'+s.toolLevel};
 }
 if(b.type==='simple/hero'){
  const amount=quantity(b.quantity),next=clone(t.growth);let used=0;
  for(;used<amount;used++){try{upgradeGrowth(next,'hero-level',b.hero);}catch(e){if(!used)throw e;break;}}
  t.growth=next;return {message:'파트장 '+used+'단계 강화',used};
 }
 if(b.type==='simple/use'){
  const amount=quantity(b.quantity,inv[b.item]||0);
  if(b.item.startsWith('shield')){if(t.incoming||c.pending||g.pendingBattle||g.incomingRaid)throw Error('교전·출정이 끝나면 사용할 수 있어요.');for(let i=0;i<amount;i++)useShieldReview(t.growth,c,b.item,now);return {used:amount,message:'보호 시간이 연장되었어요.'};}
  if(BOOST_MINUTES[b.item]){inv[b.item]-=amount;g.shop.boostUntil=Math.max(now,g.shop.boostUntil||0)+BOOST_MINUTES[b.item]*60000*amount;return {used:amount};}
  const auto={autoMine2h:2,autoMine1d:24,autoMine2d:48,autoMine3d:72}[b.item];
  if(auto){if(g.shop.auto)throw Error('자동채굴을 영구 사용 중이에요.');inv[b.item]-=amount;g.shop.autoUntil=Math.max(now,g.shop.autoUntil||0)+auto*3600000*amount;return {used:amount};}
  const days={forkliftDayTickets:1,forkliftTickets:7}[b.item];if(days){if(g.forklift.permanent)throw Error('지게차를 영구 사용 중이에요.');inv[b.item]-=amount;g.forklift.until=Math.max(now,g.forklift.until||0)+days*86400000*amount;return {used:amount};}
  throw Error('사용할 이용권을 선택해 주세요.');
 }
 if(b.type==='simple/speed'){
  const minutes=RESEARCH_MINUTES[b.item],job=t.growth.researchJobs.find(j=>j.id===b.job);if(!minutes||!job||job.endAt<=now)throw Error('진행 중인 연구를 선택해 주세요.');
  const amount=quantity(b.quantity,inv[b.item]||0),used=Math.min(amount,Math.ceil((job.endAt-now)/(minutes*60000)));inv[b.item]-=used;job.endAt=Math.max(now,job.endAt-used*minutes*60000);settleResearch(t.growth,now);return {used};
 }
 if(b.type==='simple/boss-start'){
  if(c.pending||t.incoming)throw Error('진행 중인 전투를 먼저 마쳐 주세요.');const d=day(now),boss=s.boss;
  if(boss.claims[d])throw Error('오늘의 보상을 받았어요. 내일 다시 만나요.');if(boss.run&&!boss.run.finished)return {bossRun:boss.run};
  const count=c.troops;if(!count)throw Error('사원을 먼저 생산해 주세요.');const stat=soldierStats(t.growth.forceLevels.army);
  const score=Math.max(1,Math.floor(count*stat.damage/stat.interval*30*(1+heroBonus(t.growth))));boss.run={id:crypto.randomUUID(),day:d,startedAt:now,endsAt:now+30000,score,amount:count,finished:false};return {bossRun:boss.run};
 }
 if(b.type==='simple/boss-finish'){
  const run=s.boss.run;if(!run||run.id!==b.id)throw Error('참가 중인 보스를 확인해 주세요.');const rewards=settleSimpleBoss(g,now,b.skip===true);if(!run.finished)throw Error('보스 전투가 진행 중이에요.');return {bossResult:rewards||{score:run.score,alreadyClaimed:true}};
 }
 throw Error('지원하지 않는 요청이에요.');
}
