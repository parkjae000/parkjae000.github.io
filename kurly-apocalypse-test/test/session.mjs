import {ensureProduction,settleProduction,setRoster,rosterOf} from './production.mjs?v=td-ux-20';
import {freshFortress,reconcileFortress} from './recovery.mjs?v=td-ux-20';
import {ensureResearch,startResearch,settleResearch,upgradeMode} from './research.mjs?v=td-ux-20';
import {heroResetPreview} from './migration.mjs?v=td-ux-20';
import {defaultCampaign,beginInvasion,settleInvasion,targetEconomy,TD_ENGINE_VERSION} from './campaign-review.mjs?v=td-ux-20';
import {Replay,battleFromRecord} from './replay.mjs?v=td-ux-20';
import {REVIEW_TARGETS,targetSnapshot} from './expedition-model.mjs?v=td-ux-20';
import {defaultGrowth,migrateLegacyGrowth,capacity,upgradeGrowth,MAX_ARMY,HERO_DEFS,short,forceComposition} from './progression.mjs?v=td-ux-20';
import {Battle,DefenseEditor,CATALOG,PADS,WORLD,STORAGE_KEY,validateLayout,defaultLayout,clamp} from './engine.mjs?v=td-ux-20';
export function layoutFor(w,h){const mobile=w<760;const header=mobile?96:82;const footer=mobile?190:122;const side=!mobile&&w>=1180?282:0;return {mobile,header,footer,side,stage:{x:0,y:header,w:w-side,h:Math.max(180,h-header-footer)}};}
export class Session{
 constructor(storage){this.storage=storage;const initialReset=heroResetPreview(defaultGrowth());this.migrationPreview={rows:initialReset.rows,total:initialReset.total,basis:initialReset.basis};let saved;try{saved=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');}catch{}
  this.saved=saved?.version===7&&validateLayout(saved.items)?saved:{version:7,items:defaultLayout(),growth:initialReset.game};this.growth=ensureResearch(migrateLegacyGrowth(this.saved.growth));this.campaign=ensureProduction(this.saved.campaign||defaultCampaign(Math.floor(capacity(this.growth)*.6)));this.productionEvents=[];this.campaign.fortress=reconcileFortress(this.growth,this.campaign.fortress,Date.now(),!!this.campaign.pending);this.productionEvents.push(...settleProduction(this.growth,this.campaign));this.replay=null;this.lastRecord=null;this.checkpoint=0;this.practice=false;this.management='defense';this.growthTab='tower';this.growthOpen=false;this.heroPage=0;this.perspective='attack';this.composition='balanced';this.accumulator=0;this.editor=new DefenseEditor(this.saved.items);this.mode='design';this.category='tower';this.amount=capacity(this.growth);this.speed=1;this.paused=false;this.elapsed=0;this.battle=null;this.follow=true;this.resultAt=null;this.toast=null;this.showLog=false;this.camera={x:768,y:512,zoom:1,initialized:false};this.width=1280;this.height=800;this.uiVersion=0;
  if(this.campaign.pending){const p=this.campaign.pending;this.battle=battleFromRecord(p);for(let i=0;i<p.ticks&&this.battle.status==='running';i++)this.battle.step(1/30);this.amount=p.amount;this.mode='battle';this.reviewTarget=p.snapshot;this.composition=p.composition;if(this.battle.status!=='running')this.finishBattle();}
 }
 setViewport(w,h){const changed=this.width!==w||this.height!==h;this.width=w;this.height=h;this.layout=layoutFor(w,h);if(this.mode!=='design'){this.layout.stage.w+=this.layout.side;this.layout.side=0;}if(this.mode==='battle'&&this.layout.mobile){this.layout.header=72;this.layout.footer=164;this.layout.stage.y=72;this.layout.stage.h=Math.max(180,h-236);}if(!this.camera.initialized){this.camera.initialized=true;if(this.layout.mobile){this.camera={x:470,y:430,zoom:.98,initialized:true};}else this.fit();}if(changed)this.clampCamera();}
 notify(message){this.toast={message,until:this.elapsed+2.5};this.uiVersion++;}
 fit(){const v=this.layout?.stage||layoutFor(this.width,this.height).stage;this.follow=false;this.camera={zoom:Math.min(v.w/WORLD.w,v.h/WORLD.h),x:WORLD.w/2,y:WORLD.h/2,initialized:true};this.uiVersion++;}
 clampCamera(){const v=(this.layout||layoutFor(this.width,this.height)).stage,c=this.camera;const minFit=Math.min(v.w/WORLD.w,v.h/WORLD.h);c.zoom=clamp(c.zoom,minFit,1.65);const hw=v.w/(2*c.zoom),hh=v.h/(2*c.zoom);c.x=hw>=WORLD.w/2?WORLD.w/2:clamp(c.x,hw,WORLD.w-hw);c.y=hh>=WORLD.h/2?WORLD.h/2:clamp(c.y,hh,WORLD.h-hh);}
 zoom(factor){this.camera.zoom*=factor;this.follow=false;this.clampCamera();this.uiVersion++;}
 pan(dx,dy){this.camera.x-=dx/this.camera.zoom;this.camera.y-=dy/this.camera.zoom;this.follow=false;this.clampCamera();}
 persist(){const data={version:7,items:structuredClone(this.editor.items),growth:structuredClone(this.growth),campaign:structuredClone(this.campaign)};try{this.storage?.setItem(STORAGE_KEY,JSON.stringify(data));this.saved=data;return true;}catch{this.notify('이 기기에서 저장할 수 없어요. 브라우저 저장 설정을 확인해 주세요.');return false;}}
 save(){if(!this.persist())return false;this.editor.dirty=false;this.notify('방어배치 저장 완료');return true;}
 prepare(){if(this.campaign.pending)return false;if(!this.save())return false;this.mode='prepare';this.showLog=false;this.battle=null;this.replay=null;this.setViewport(this.width,this.height);if(this.layout.mobile){this.camera={x:250,y:495,zoom:1,initialized:true};this.clampCamera();}else this.fit();this.uiVersion++;return true;}
 launch({ackShield=false,practice=false}={}){
  if(this.campaign.pending){this.mode='battle';return false;}if(!this.save())return false;
  const target=REVIEW_TARGETS.find(t=>t.id===this.reviewTarget?.targetId)||REVIEW_TARGETS[0],snapshot=this.reviewTarget||targetSnapshot(target.id);
  try{
   this.practice=practice;this.replay=null;this.lastRecord=null;
   if(practice){this.practiceRecord={id:'training-'+Date.now(),engineVersion:TD_ENGINE_VERSION,seed:426,targetId:'training',targetName:'내 배치 방어 시험',startedAt:Date.now(),amount:this.amount,composition:this.composition,snapshot:{items:structuredClone(this.saved.items),growth:structuredClone(this.growth)},attackerGrowth:structuredClone(this.growth),practice:true};this.battle=battleFromRecord(this.practiceRecord);}
   else{const next=beginInvasion(this.campaign,target,snapshot,{growth:this.growth,composition:this.composition,ackShield});const old=this.campaign;this.campaign=next;if(!this.persist()){this.campaign=old;return false;}this.battle=battleFromRecord(next.pending);this.amount=next.pending.amount;}
  }catch(e){this.notify(e.message);return false;}
  this.mode='battle';this.speed=1;this.paused=false;this.follow=true;this.resultAt=null;this.showLog=false;this.accumulator=0;this.checkpoint=0;this.notify(short(this.amount)+'명 전량 출격!');this.uiVersion++;return true;
 }
 finishBattle(){if(!this.battle||this.replay||this.battle.status==='running'||this.lastRecord)return;
  if(this.practice){this.lastRecord={...this.practiceRecord,endTick:this.battle.ticks,status:this.battle.status,finishedAt:Date.now(),summary:this.battle.summary(),returned:this.battle.alive,loot:{boxes:0,cash:0},protectionHours:0};this.campaign.history.unshift(this.lastRecord);this.campaign.history=this.campaign.history.slice(0,30);}
  else{const result=settleInvasion(this.campaign,this.campaign.pending.id,this.battle);this.campaign=result.campaign;this.lastRecord=result.record;if(!result.duplicate)this.growth.boxes+=result.record.loot.boxes;}
  this.persist();this.resultAt=this.elapsed;this.uiVersion++;
 }
 playReplay(id){if(this.campaign.pending)return false;const record=this.campaign.history.find(h=>h.id===id)||this.lastRecord;if(!record)return false;this.replay=new Replay(record);this.battle=this.replay.battle;this.lastRecord=record;this.amount=record.amount;this.mode='battle';this.resultAt=null;this.follow=true;this.showLog=false;this.speed=1;this.paused=false;this.uiVersion++;return true;}
 edit(){if(this.campaign.pending){this.notify('진행 중에는 후퇴 버튼으로만 병력을 귀환시킬 수 있어요.');return;}this.reviewTarget=null;this.mode='design';this.battle=null;this.replay=null;this.practice=false;this.resultAt=null;this.showLog=false;this.editor=new DefenseEditor(this.saved.items);this.uiVersion++;}
 action(id,data){
  if(id==='growth'){this.growthOpen=!this.growthOpen;if(this.growthOpen){this.management='defense';this.growthTab='tower';}this.uiVersion++;return;}
  if(id==='army'){this.management='army';this.growthTab='force';this.growthOpen=true;this.uiVersion++;return;}
  if(id==='growth-tab'){this.growthTab=data;this.heroPage=0;this.uiVersion++;return;}
  if(id==='hero-page'){this.heroPage=(this.heroPage+1)%3;this.uiVersion++;return;}
  if(id==='upgrade'){if(this.mode==='battle')return;try{const result=upgradeMode(data.kind)==='staff'?{message:'스탭 연구를 시작했어요.',job:startResearch(this.growth,data.kind,data.id,data.steps||1)}:upgradeGrowth(this.growth,data.kind,data.id,data.steps||1);this.amount=capacity(this.growth);this.editor.dirty=true;this.notify(result.message);}catch(error){this.notify(error.message);}return;}
  if(id==='composition'){this.composition=data;this.uiVersion++;return;}
  if(id==='perspective'){this.perspective=this.perspective==='attack'?'defense':'attack';this.follow=false;this.camera.x=this.perspective==='defense'?1320:240;this.camera.y=495;this.camera.zoom=Math.max(this.camera.zoom,.65);this.clampCamera();this.notify(this.perspective==='defense'?'방어 센터 시점':'공격 진입 시점');this.uiVersion++;return;}
  if(id==='defend'){this.reviewTarget=null;this.perspective='defense';this.amount=10000;this.growth.capacityLevel=91;this.prepare();this.launch({practice:true});return;}

  if(id==='tool'){this.editor.choose(data);this.uiVersion++;return;}
  if(id==='category'){this.category=data;this.editor.selected=null;this.editor.tool=data==='tower'?'cannon':'frozen';this.uiVersion++;return;}
  if(id==='pad'&&this.mode==='design'){const answer=this.editor.place(data);this.notify(answer.message);return answer;}
  if(id==='save'){return this.save();}if(id==='prepare'){return this.prepare();}if(id==='launch'){return this.launch();}
  if(id==='remove'){this.editor.remove();this.uiVersion++;return;}if(id==='undo'){this.editor.undo();this.uiVersion++;return;}
  if(id==='edit'){return this.edit();}if(id==='fit'){this.fit();return;}
  if(id==='plus'){this.zoom(1.2);return;}if(id==='minus'){this.zoom(1/1.2);return;}
  if(id==='follow'){this.follow=!this.follow;if(this.follow){this.camera.zoom=Math.max(this.camera.zoom,.65);const u=this.battle?.units.filter(u=>u.hp>0&&u.s>=0).sort((a,b)=>b.s-a.s)[0];if(u){const p=this.battle.position(u);this.camera.x=p.x;this.camera.y=p.y;}this.clampCamera();}this.notify(this.follow?'병력 자동 추적을 켰어요.':'병력 자동 추적을 껐어요.');this.uiVersion++;return;}if(id==='speed'&&this.replay){this.replay.setSpeed(this.replay.speed===1?2:1);this.speed=this.replay.speed;this.paused=false;this.uiVersion++;return;}
  if(id==='amount'&&[10000,1000000,100000000].includes(data)){if(this.campaign.pending)return;this.amount=data;setRoster(this.campaign,forceComposition(data,this.composition));this.growth.capacityLevel=1+(data-1000)/100;this.editor.dirty=true;this.persist();this.uiVersion++;return;}
  if(id==='pause'&&this.replay){this.replay.paused=!this.replay.paused;this.paused=this.replay.paused;this.uiVersion++;return;}
  if(id==='skip'&&this.replay){this.replay.skip();this.resultAt=this.elapsed;this.uiVersion++;return;}
  if(id==='timelapse'&&this.replay){this.replay.setTimelapse();this.speed=this.replay.speed;this.paused=false;this.uiVersion++;return;}
  if(id==='speed'&&!this.replay&&this.battle){this.speed=this.speed===1?2:1;this.uiVersion++;return;}
  if(id==='skip'&&!this.replay&&this.battle){this.battle.skip();this.finishBattle();this.uiVersion++;return;}
  if(id==='retreat'&&this.battle&&!this.replay){this.battle.retreat();this.finishBattle();return;}
  if(id==='replay'){this.playReplay(data||this.lastRecord?.id);return;}
  if(id==='replay-exit'){this.edit();return;}
  if(id==='log'){this.showLog=!this.showLog;this.uiVersion++;return;}
  if(id==='again'){this.prepare();return;}
 }
 tick(dt){this.elapsed+=dt;const produced=settleProduction(this.growth,this.campaign,Date.now());if(produced.length){this.productionEvents.push(...produced);this.productionEvents=this.productionEvents.slice(-9);this.persist();this.uiVersion++;}this.campaign.fortress=reconcileFortress(this.growth,this.campaign.fortress,Date.now(),!!this.campaign.pending);const done=settleResearch(this.growth,Date.now());if(done.length){this.persist();this.notify('연구 '+done.length+'건 완료');}
  if(this.replay){this.replay.tick(dt);if(this.replay.finished&&this.resultAt===null){this.resultAt=this.elapsed;this.uiVersion++;}}
  else if(this.battle&&this.battle.status==='running'){
   this.accumulator+=dt*this.speed;while(this.accumulator+1e-10>=1/30&&this.battle.status==='running'){this.battle.step(1/30);this.accumulator-=1/30;}
   if(this.campaign.pending){this.campaign.pending.ticks=this.battle.ticks;this.checkpoint+=dt;if(this.checkpoint>=1){this.persist();this.checkpoint=0;}}
   if(this.battle.status!=='running')this.finishBattle();
  }
  if(this.mode==='battle'&&this.battle&&this.follow&&this.layout?.mobile){const b=this.battle;const units=b.units.filter(u=>u.hp>0&&u.s>=0).sort((a,c)=>c.s-a.s);const focus=units[Math.min(12,Math.max(0,units.length-1))];if(focus){const p=b.position(focus),k=1-Math.exp(-dt*2.3);this.camera.x+=(p.x-this.camera.x)*k;this.camera.y+=(p.y-this.camera.y)*k;this.clampCamera();}}
 }
 get activeItems(){return this.mode==='design'?this.editor.items:this.battle?.layout||this.saved.items;}
}
