import {rosterOf,setRoster,ensureProduction,rosterTotal,woundedAllocation} from './production.mjs?v=td-ux-17';
import {freshFortress,reconcileFortress,damageFortress} from './recovery.mjs?v=td-ux-17';
import {defaultGrowth,forceComposition} from './progression.mjs?v=td-ux-17';
import {MAX_ARMY} from './progression.mjs?v=td-ux-17';
export const TD_ENGINE_VERSION='td-test-12';
export const SHIELD_MS=6*60*60*1000;
const reviewDay=now=>new Date(now+9*3600000).toISOString().slice(0,10);
const integer=(value,label)=>{if(!Number.isSafeInteger(value)||value<0)throw Error(label+' 값을 확인해 주세요.');return value;};
export function defaultCampaign(troops=10000){return {version:7,troops,roster:forceComposition(troops),production:{army:[],air:[],navy:[]},wounded:[],cash:150000,shieldUntil:Date.now()+SHIELD_MS,sequence:0,pending:null,history:[],targets:{},daily:{day:'',count:0,targets:{}}};}
export function targetEconomy(c,target){return c.targets[target.id]||{boxes:target.boxes,cash:target.cash,shieldUntil:0};}
// Pure review transactions: clone the entire aggregate; persist once after success.
export function beginInvasion(c,target,snapshot,{growth,composition='balanced',now=Date.now(),ackShield=false}={}){
 if(c.pending)throw Error('진행 중인 출정을 먼저 마쳐 주세요.');
 const owned=rosterOf(c),amount=integer(rosterTotal(owned),'보유 병력');if(amount<1||amount>MAX_ARMY)throw Error('센터에 출정 가능한 병력이 없어요.');
 const enemy=structuredClone(targetEconomy(c,target));integer(enemy.boxes,'상대 박스');integer(enemy.cash,'상대 골드');
 if(enemy.shieldUntil>now)throw Error('상대 센터에 보호막이 남아 있어요.');
 if(c.shieldUntil>now&&!ackShield)throw Error('내 보호막 해제 안내를 확인해 주세요.');
 const day=reviewDay(now),daily=c.daily?.day===day?c.daily:{day,count:0,targets:{}};if(daily.count>=5)throw Error('오늘 침공 5회를 모두 사용했어요.');if((daily.targets[target.id]||0)>=2)throw Error('같은 센터는 하루 2회까지 침공할 수 있어요.');
 const next=structuredClone(c),sequence=c.sequence+1,id='review-'+sequence;next.daily=structuredClone(daily);next.daily.count++;next.daily.targets[target.id]=(next.daily.targets[target.id]||0)+1;
 next.sequence=sequence;setRoster(next,{army:0,air:0,navy:0});next.shieldUntil=0;next.targets[target.id]=enemy;
 next.pending={id,engineVersion:TD_ENGINE_VERSION,seed:426+sequence,targetId:target.id,targetName:target.name,startedAt:now,ticks:0,amount,composition,forceTotals:owned,initialState:structuredClone(reconcileFortress(snapshot.growth,enemy.fortress,now)),snapshot:structuredClone(snapshot),attackerGrowth:structuredClone(growth),lootBudget:{boxes:Math.floor(enemy.boxes/5),cash:Math.floor(enemy.cash/5)}};
 return next;
}
export function settleInvasion(c,id,battle,now=Date.now()){
 const recorded=c.history.find(h=>h.id===id);if(recorded)return {campaign:c,record:recorded,duplicate:true};
 const p=c.pending;if(!p||p.id!==id)throw Error('정산할 출정이 없어요.');
 if(battle.status==='running')throw Error('전투가 진행 중이에요. 후퇴하면 생존 병력이 귀환해요.');
 if(battle.total!==p.amount)throw Error('출정 기록의 병력이 일치하지 않아요.');
 const next=structuredClone(c),enemy=next.targets[p.targetId];
 const won=battle.status==='victory'&&battle.centerHp<=0&&battle.wallHp<=0;
 const loot=won?{boxes:Math.min(p.lootBudget.boxes,Math.floor(integer(enemy.boxes,'박스')/5)),cash:Math.min(p.lootBudget.cash,Math.floor(integer(enemy.cash,'골드')/5))}:{boxes:0,cash:0};
 enemy.boxes-=loot.boxes;enemy.cash-=loot.cash;
 if(won)enemy.shieldUntil=Math.max(enemy.shieldUntil||0,now+SHIELD_MS);
 const returning=rosterOf(next),wounded=woundedAllocation(battle.deathsByRole);for(const role of ['army','air','navy']){returning[role]+=battle.forceTotals[role]-battle.deathsByRole[role];}setRoster(next,returning);next.wounded ||= [];if(rosterTotal(wounded))next.wounded.push({id:'wounded-'+id,counts:wounded,endAt:now+30*60000});enemy.fortress=damageFortress(battle.growth,enemy.fortress,battle.wallHp,battle.centerHp,now);next.cash+=loot.cash;integer(next.troops,'귀환 병력');integer(next.cash,'보유 골드');
 const record={...structuredClone(p),endTick:battle.ticks,finishedAt:now,status:battle.status,summary:battle.summary(),loot,returned:battle.alive,wounded:rosterTotal(wounded),woundedByRole:wounded,defenderShieldUntil:enemy.shieldUntil,protectionHours:won?6:0};
 next.pending=null;next.history.unshift(record);next.history=next.history.slice(0,30);
 return {campaign:next,record,duplicate:false};
}
