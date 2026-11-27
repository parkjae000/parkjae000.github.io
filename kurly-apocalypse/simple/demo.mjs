// All state stays in this page. No login, player data, or production writes.
import {mountSimpleUI} from './ui.mjs?v=simple-2';
import {short} from './model.mjs?v=simple-2';
import {SimpleBattle} from './battle.mjs?v=simple-2';
import {simpleAction} from './demo-actions.mjs?v=simple-2';
import {purchaseShop} from '../test/shop.mjs?v=td-ux-22';
import {startResearch,settleResearch,upgradeMode} from '../test/research.mjs?v=simple-2';
import {upgradeGrowth} from '../test/progression.mjs?v=td-ux-20';
import {startProduction,settleProduction,setRoster} from '../test/production.mjs?v=simple-2';
const td=await (await fetch('./demo-state.json')).json();td.serverTime=Date.now();td.campaign.shieldUntil=0;const game={td,simple:td.simple,inventory:td.growth.inventory,shop:{},forklift:{},pendingBattle:null,incomingRaid:null};
function sync(){game.inventory=td.growth.inventory;td.simple=game.simple;td.simple.soldier={level:td.growth.forceLevels.army};td.serverTime=Date.now();document.getElementById('demoBoxes').textContent='📦 '+short(td.growth.boxes);document.getElementById('demoCash').textContent='💰 '+short(td.campaign.cash);}
function finishBattle(){const p=td.campaign.pending;if(!p)return;const battle=new SimpleBattle(p);while(battle.status==='running')battle.step();const record={...p,summary:battle.summary(),endTick:battle.ticks,status:battle.status,result:battle.status==='victory'?'win':'lose',survivors:battle.alive,loot:{boxes:battle.status==='victory'?1200:0,cash:battle.status==='victory'?20:0}};td.campaign.pending=null;td.campaign.roster={army:battle.alive,air:0,navy:0};td.campaign.troops=battle.alive;td.campaign.history.unshift(record);return record;}
async function api(url,method='GET',body={}){const now=Date.now();settleResearch(td.growth,now);settleProduction(td.growth,td.campaign,now);let out={};if(method==='POST'){
 if(body.type.startsWith('simple/'))out=simpleAction(game,body,now)||{};
 else if(body.type==='td/buy'){const r=purchaseShop(td.growth,td.campaign,body.item,body.quantity,body.requestId,now);td.growth=r.growth;td.campaign=r.campaign;}
 else if(body.type==='td/produce')startProduction(td.growth,td.campaign,'army',body.cycles,body.requestId,now);
 else if(body.type==='td/upgrade'){if(upgradeMode(body.kind)==='staff')startResearch(td.growth,body.kind,body.item,1,now);else upgradeGrowth(td.growth,body.kind,body.item);}
 else if(body.type==='hero/recruit'){const q=body.count,key=body.pool+'Tickets';if(!Number.isSafeInteger(q)||q<1||q>1000||td.growth.inventory[key]<q)throw Error('보유 모집권을 확인해 주세요.');td.growth.inventory[key]-=q;out.pulls=Array.from({length:q},()=>({kind:'xpBook',xp:40,bookRarity:body.pool}));td.growth.inventory[body.pool+'HeroXp']=(td.growth.inventory[body.pool+'HeroXp']||0)+q*40;}
 else if(body.type==='td/start'){const target=(body.mode==='raid'?td.targets:td.areas).find(t=>t.id===body.target),snapshot=structuredClone(target.snapshot),amount=td.campaign.troops;if(!amount)throw Error('사원을 먼저 생산해 주세요.');snapshot.growth.forceLevels ||= {army:1,air:1,navy:1};const p={id:crypto.randomUUID(),engineVersion:'simple-1',mode:body.mode,targetName:target.name,amount,forceTotals:{army:amount,air:0,navy:0},defenderAmount:30,attackerGrowth:structuredClone(td.growth),snapshot,startedAt:now,clock:{elapsedMs:0,anchorAt:now,speed:1}};td.campaign.pending=p;setRoster(td.campaign,{army:0,air:0,navy:0});}
 else if(body.type==='td/control'){if(body.skip)out.record=finishBattle();else if(td.campaign.pending){const p=td.campaign.pending;p.clock.elapsedMs+=(now-p.clock.anchorAt)*p.clock.speed;p.clock.anchorAt=now;p.clock.speed=body.speed;}}
 else if(body.type==='td/retreat')out.record=finishBattle();
 }
 sync();return {...out,td:structuredClone(td)};}
sync();const controller=await mountSimpleUI({host:document.getElementById('host'),td:structuredClone(td),api,onNavigate:()=>controller.open('tool')});document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>controller.open(b.dataset.page));
