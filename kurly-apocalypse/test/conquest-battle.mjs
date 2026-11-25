import {Battle} from './engine.mjs';
import {FORCES,FORCE_IDS} from './progression.mjs';
import {CONQUEST_ROUTES,CONQUEST_PADS,conquestPoint,splitConquestRoster,LANE_NAMES} from './conquest-geometry.mjs';
export class ConquestBattle extends Battle{
 constructor(layout,options){
  super(layout,{...options,pads:CONQUEST_PADS});this.objective='conquest';this.plan=options.routePlan||'balanced';this.facilitiesDisabled=[];this.routes=CONQUEST_ROUTES;this.laneTotals=splitConquestRoster(this.forceTotals,this.plan);this.walls=this.routes.map((r,i)=>({lane:i,name:LANE_NAMES[i],hp:options.fortressProfile?.wallMax||this.wallMax,max:options.fortressProfile?.wallMax||this.wallMax,brokenAt:null,...r.wallPoint}));this.wallMax=this.walls.reduce((n,w)=>n+w.max,0);this.wallHp=this.wallMax;this.units=[];
  let randomState=this.seed>>>0;const random=()=>((randomState=(Math.imul(randomState,1664525)+1013904223)>>>0)/4294967296);
  for(let index=0;index<21;index++)for(let lane=0;lane<3;lane++)for(const role of FORCE_IDS){const amount=this.laneTotals[lane][role],groups=Math.min(21,amount);if(index>=groups)continue;const count=Math.floor(amount/groups)+(index<amount%groups?1:0),level=this.attackerGrowth.forceLevels[role],perHp=FORCES[role].hp*(1+.08*(level-1)),id=this.units.length;this.units.push({role,count,hp:perHp*count,maxHp:perHp*count,perHp,level,id,routeId:lane,s:-18-Math.floor(index/2)*29-(id%6)*.6,lane:(index%4-1.5)*10,speed:FORCES[role].speed+random()*4,slowUntil:0,freezeUntil:0,stunUntil:0,burnUntil:0,vulnerableUntil:0,hitAt:-10,hitKind:null,phase:random()*6.28,controlLoad:0,resolveUntil:0,nextKnockAt:0,knockFrom:0,knockAt:-10,knockUntil:-10,goal:false,sieging:false});}
 }
 position(u){return conquestPoint(this.routes[u.routeId],u.s,u.lane);}
 stopFor(u){const r=this.routes[u.routeId],w=this.walls[u.routeId],blocked=w.hp>0||w.brokenAt!==null&&this.time-w.brokenAt<.9;return blocked?r.wallS-28:r.length-16;}
 aimPosition(u,lead=0){return conquestPoint(this.routes[u.routeId],Math.min(u.s+lead,this.stopFor(u)),u.lane);}
 queueUnits(){for(let routeId=0;routeId<3;routeId++){const queues=Array.from({length:4},()=>[]);for(const u of this.units)if(u.hp>0&&u.routeId===routeId)queues[Math.round((u.lane+15)/10)%4].push(u);for(const queue of queues){queue.sort((a,b)=>b.s-a.s||a.id-b.id);let limit=queue.length?this.stopFor(queue[0]):0;for(const u of queue){const stop=this.stopFor(u);u.s=Math.min(u.s,limit);u.goal=u.s>=stop-.1;u.sieging=u.s>=stop-110;limit=u.s-25;}}}}
 resolveSiege(visible,dt){
  this.goalAttackers=0;for(let routeId=0;routeId<3;routeId++){const w=this.walls[routeId],atGoal=visible.filter(u=>u.routeId===routeId&&u.sieging&&u.hp>0);this.goalAttackers+=atGoal.reduce((n,u)=>n+this.members(u),0);if(!atGoal.length)continue;const damage=atGoal.reduce((n,u)=>n+Math.sqrt(this.members(u))*FORCES[u.role].siege*(1+.07*(u.level-1)),0)*dt;
   if(w.hp>0){w.hp=Math.max(0,w.hp-damage);const reflected=Math.min(.38,.02*((this.growth.facilityLevels?.wallReflect||1)-1));if(reflected)for(const u of atGoal)this.damage(u,Math.sqrt(this.members(u))*FORCES[u.role].siege*(1+.07*(u.level-1))*dt*reflected,'wallReflect');if(!w.hp){w.brokenAt=this.time;this.disableFacility(routeId);this.effects.push({type:'wall-break',x:w.x,y:w.y,at:this.time,duration:1.6,radius:125});this.log('wall',w.name+' 방벽 돌파');}}
   else if(this.walls.every(v=>!v.hp)&&this.time-w.brokenAt>=.9)this.centerHp=Math.max(0,this.centerHp-damage);
   this.attackClock+=dt;if(this.attackClock>.2){this.attackClock=0;this.effects.push({type:'siege',x:w.hp?w.x:1380,y:w.hp?w.y-35:455,fromX:w.hp?w.x-80:1300,fromY:w.hp?w.y:495,at:this.time,duration:.3,radius:40});}
  }
  this.wallHp=this.walls.reduce((n,w)=>n+w.hp,0);if(!this.wallHp&&this.wallBrokenAt===null){this.wallBrokenAt=this.time;this.log('shield','세 방벽 파괴 · 중앙 지휘소 보호 해제');}
 }
 step(dt){super.step(dt);if(this.status==='running'){const collapsed=this.walls.find((w,i)=>w.hp>0&&!this.units.some(u=>u.hp>0&&u.routeId===i));if(collapsed){this.status='defeat';this.failedLane=collapsed.lane;this.log('result',collapsed.name+' 부대 전멸 · 공략 실패 · 나머지 생존 병력 귀환');}}}
 disableFacility(lane){
  const names=['전력소','탄약고','관제소'];this.facilitiesDisabled.push({lane,name:names[lane],at:this.time});
  for(const d of this.defenders){if(lane===0&&['tesla','laser'].includes(d.type)){d.stats.damage*=.75;d.stats.skillDamage=(d.stats.skillDamage||0)*.75;}if(lane===1&&d.type==='cannon'){d.stats.interval/=.8;d.cooldown/=.8;}if(lane===2){if(d.stats.kind==='tower')d.stats.range*=.85;else{d.stats.cooldown*=1.25;d.skillCooldown*=1.25;}}}
  this.log('facility',names[lane]+' 무력화 · 방어 설비 약화');
 }
 summary(){return {...super.summary(),objective:'conquest',facilitiesDisabled:structuredClone(this.facilitiesDisabled),routePlan:this.plan,laneTotals:structuredClone(this.laneTotals),walls:this.walls.map(w=>({name:w.name,hp:w.hp,max:w.max,brokenAt:w.brokenAt})),failedLane:this.failedLane};}
}
