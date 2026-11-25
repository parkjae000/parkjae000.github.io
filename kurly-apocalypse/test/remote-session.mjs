import {battleSpeed,battleElapsedTicks} from './battle-clock.mjs?v=td-ux-20';
import {siegeLayout} from './conquest.mjs?v=td-ux-20';
import {siegeSlotAccepts} from './siege-geometry.mjs?v=td-ux-20';
import {CATALOG} from './engine.mjs?v=td-ux-20';
import {Session} from './session.mjs?v=td-ux-20';
import {STORAGE_KEY,DefenseEditor} from './engine.mjs?v=td-ux-20';
import {battleFromRecord} from './replay.mjs?v=td-ux-20';
import {rosterOf} from './production.mjs?v=td-ux-20';
export const API='https://pgupfypoxhjawtonnzzk.supabase.co/functions/v1/kurly-apocalypse-test';
export const TEST_TOKEN_KEY='ka_game_test_session_v1';
export async function testApi(path,{token,body}={}){const r=await fetch(API+path+(path.includes('?')?'&':'?')+'forceFunctionRegion=ap-northeast-2',{method:body?'POST':'GET',cache:'no-store',headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error||'연결을 확인해 주세요.'),{status:r.status,code:data.code});return data;}
export class RemoteSession extends Session{
 constructor(td,token){
  super({getItem:key=>key===STORAGE_KEY?JSON.stringify({version:7,items:td.items,growth:td.growth,campaign:{...td.campaign,pending:null}}):null,setItem(){}});
  this.remote=true;this.token=token;this.scope='home';this.requestChain=Promise.resolve();this.lastPoll=0;this.polling=false;this.busy=false;this.latest=null;this.apply(td);
 }
 apply(td){if(this.latest&&(td.world!==this.latest.world||td.me.id!==this.latest.me.id||td.serverTime<this.latest.serverTime))return;
  const previous=this.campaign,oldPending=previous?.pending;this.latest=td;if(this.scope!=='home'&&!td.areas.some(a=>a.id===this.scope&&a.mine)){this.scope='home';this.editor.dirty=false;}this.serverOffset=td.serverTime-Date.now();this.growth=td.growth;this.campaign=td.campaign;this.amount=this.campaign.pending?.amount||this.campaign.troops;
  for(const role of ['army','air','navy']){const difference=(rosterOf(this.campaign)[role]||0)-(rosterOf(previous)[role]||0);if(difference>0&&!oldPending)this.productionEvents.push({role,count:difference,at:Date.now(),kind:'production'});}this.productionEvents=this.productionEvents.slice(-9);
  const items=this.scope==='home'?td.items:siegeLayout(td.outposts[this.scope]?.items||td.areas.find(a=>a.id===this.scope)?.snapshot.items||[]);this.saved={version:7,items:structuredClone(items),growth:this.growth,campaign:this.campaign};if(!this.editor.dirty){const selected=this.editor.selected,tool=this.editor.tool;this.editor=new DefenseEditor(items);this.editor.tool=tool;if(selected)this.editor.select(selected);}
  const p=this.campaign.pending;if(p){this.speed=battleSpeed(p);const fresh=!this.battle||this.liveId!==p.id||this.replay;if(fresh){this.replay=null;this.battle=battleFromRecord(p);this.liveId=p.id;this.lastRecord=null;this.mode='battle';this.resultAt=null;this.follow=true;this.accumulator=0;}this.setViewport(this.width,this.height);if(fresh&&this.battle.variant==='open-siege'){if(this.layout.mobile){this.camera={x:400,y:520,zoom:.55,initialized:true};this.clampCamera();}else this.fit();}}
  else if(oldPending){const r=this.campaign.history.find(x=>x.id===oldPending.id);if(r){this.lastRecord=r;if(!this.battle||this.liveId!==r.id)this.battle=battleFromRecord(r);while(this.battle.status==='running'&&this.battle.ticks<r.endTick)this.battle.step(1/30);if(r.status==='retreated'&&this.battle.status==='running')this.battle.retreat();this.resultAt=this.elapsed;this.mode='battle';}}
  this.uiVersion++;this.onRemoteUpdate?.();
 }
 persist(){return true;}
 async send(type,params={}){params=structuredClone(params);
  const run=async()=>{this.busy=true;try{const r=await testApi('/api/action',{token:this.token,body:{type,...params,requestId:crypto.randomUUID()}});if(r.td)this.apply(r.td);if(!['td/upgrade','td/speed','td/control','td/repair'].includes(type))this.notify(r.message||'저장했어요.');return r;}catch(e){this.notify(e.message);throw e;}finally{this.busy=false;}};
  const request=this.requestChain.then(run);this.requestChain=request.catch(()=>{});return request;
 }
 async poll(force=false){if(this.polling||this.busy||!force&&Date.now()-this.lastPoll<(this.campaign.pending?1600:5000))return;this.polling=true;this.lastPoll=Date.now();try{const r=await testApi('/api/td-state',{token:this.token});this.apply(r.td);}catch(e){this.notify(e.message);}finally{this.polling=false;this.lastPoll=Date.now();}}
 save(){const editor=this.editor,items=structuredClone(editor.items),scope=this.scope;this.send('td/layout',{scope,items}).then(()=>{if(this.editor===editor&&JSON.stringify(editor.items)===JSON.stringify(items))editor.dirty=false;}).catch(()=>{});return true;}
 finishBattle(){if(this.remote)this.poll(true);}
 action(id,data){
  if(id==='remove'&&this.scope!=='home'){this.notify('정복전은 기본 포탑 4기로 방어해요. 드래그로 위치를 바꿀 수 있어요.');return;}
  if(id==='tool'&&this.scope!=='home'){const item=this.editor.items.find(i=>i.type===data);if(item)this.editor.select(item.id);this.uiVersion++;return;}
  if(id==='pad'&&this.scope!=='home'){const kind=CATALOG[this.editor.items.find(i=>i.id===this.editor.selected)?.type||this.editor.tool]?.kind;if(!siegeSlotAccepts(data,kind)){this.notify('포탑은 센터 위아래 발판, 파트장은 중앙 지원 발판에 배치해요.');return;}}
  if(id==='amount'||id==='defend'){this.notify('시험 서버에서는 실제 보유 병력을 사용해요.');return;}
  if(['speed','skip'].includes(id)&&!this.replay){const p=this.campaign.pending;if(!p||this.retreatPending||this.battleControlPending)return;this.battleControlPending=true;this.uiVersion++;this.send('td/control',{battleId:p.id,...(id==='skip'?{skip:true}:{speed:battleSpeed(p)===1?2:1})}).catch(()=>{}).finally(()=>{this.battleControlPending=false;this.uiVersion++;});return;}
  if(id==='retreat'&&!this.replay){if(this.retreatPending||this.battleControlPending||!this.campaign.pending)return;this.retreatPending=true;this.notify('후퇴 요청 중… 생존 병력을 귀환시킵니다.');this.send('td/retreat').catch(()=>{}).finally(()=>{this.retreatPending=false;this.uiVersion++;});return;}
  if(id==='save')return this.save();
  if(id==='upgrade'){this.send('td/upgrade',{kind:data.kind,item:data.id,steps:data.steps||1}).catch(()=>{});return;}
  return super.action(id,data);
 }
 chooseScope(scope){if(this.campaign.pending)return;this.scope=scope;this.editor.dirty=false;this.apply(this.latest);this.mode='design';this.battle=null;this.replay=null;this.lastRecord=null;this.uiVersion++;}
 tick(dt){
  this.elapsed+=dt;this.poll();if(this.replay){this.replay.tick(dt);if(this.replay.finished&&this.resultAt===null){this.resultAt=this.elapsed;this.uiVersion++;}}
  else if(this.battle&&this.campaign.pending){const target=battleElapsedTicks(this.campaign.pending,Date.now()+this.serverOffset);let budget=240;while(this.battle.status==='running'&&this.battle.ticks<target&&budget-->0)this.battle.step(1/30);if(this.battle.status!=='running')this.poll();}
  if(this.mode==='battle'&&this.battle&&this.follow&&this.layout?.mobile){const front=this.battle.units.filter(u=>u.hp>0&&u.s>=0).sort((a,b)=>b.s-a.s)[8]||this.battle.units.find(u=>u.hp>0);if(front){const p=this.battle.position(front),k=1-Math.exp(-dt*2.3);this.camera.x+=(p.x-this.camera.x)*k;this.camera.y+=(p.y-this.camera.y)*k;this.clampCamera();}}
 }
}
