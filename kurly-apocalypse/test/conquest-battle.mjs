import {conquestTowerStats} from './conquest-stats.mjs?v=td-ux-19';
import {siegeLayout} from './conquest.mjs?v=td-ux-19';
import {Battle} from './engine.mjs?v=td-ux-19';
import {FORCES,forceStats} from './progression.mjs?v=td-ux-19';
import {SIEGE,SIEGE_PADS} from './siege-geometry.mjs?v=td-ux-19';
export class ConquestBattle extends Battle{
 constructor(layout,options={}){
  super(siegeLayout(layout),{...options,pads:SIEGE_PADS});this.siegeVersion=12;this.objective='conquest';this.variant='open-siege';this.support=structuredClone(options.support||null);
  // Exact army counts use bounded cohorts, spread over a broad open formation.
  for(const u of this.units){const row=u.id%20;u.y=SIEGE.top+25+row*(SIEGE.bottom-SIEGE.top-50)/19;u.baseLane=u.lane;u.s=-18-Math.floor(u.id/20)*18-(u.id%4)*1.3;u.hqY=SIEGE.centerY+(row-9.5)*8;}
  for(const d of this.defenders){d.stats=conquestTowerStats(this.growth,d.type,this.support);d.baseStats=structuredClone(d.stats.baseStats);d.supportBonus={damage:d.stats.damage-d.baseStats.damage,rate:this.support?.towerRate||0,range:d.stats.range-d.baseStats.range,area:this.support?.towerArea||0};}
  this.log('siege','넓은 전선 동시 돌격 · 방벽 → 센터 · 포탑은 공격 대상에서 제외');
 }
 position(u){return {x:SIEGE.spawnX+u.s,y:u.y+(u.lane-u.baseLane),angle:this.wallHp>0?0:Math.atan2(u.hqY-u.y,Math.max(35,SIEGE.centerX-SIEGE.spawnX-u.s))};}
 stopFor(u){const blocked=this.wallHp>0||this.wallBrokenAt!==null&&this.time-this.wallBrokenAt<.9;return (blocked?SIEGE.wallX-27:SIEGE.centerX-42)-SIEGE.spawnX-(u.id%5)*7;}
 aimPosition(u,lead=0){return this.position({...u,s:Math.min(u.s+lead,this.stopFor(u))});}
 queueUnits(){for(const u of this.units){if(u.hp<=0)continue;const stop=this.stopFor(u);u.s=Math.min(u.s,stop);u.goal=u.s>=stop-.1;u.sieging=u.s>=stop-92&&(this.wallHp>0||Math.abs(u.y-SIEGE.centerY)<145);}}
 step(dt){
  if(this.status!=='running')return;
  if(this.wallHp===0&&this.wallBrokenAt!==null&&this.time-this.wallBrokenAt>=.9)for(const u of this.units){if(u.hp<=0||u.freezeUntil>this.time||u.stunUntil>this.time)continue;const delta=u.hqY-u.y,speed=u.speed*(u.slowUntil>this.time?.62:1);u.y+=Math.sign(delta)*Math.min(Math.abs(delta),speed*dt*.85);}
  super.step(dt);
 }
 resolveSiege(visible,dt){
  const atGoal=visible.filter(u=>u.sieging&&u.hp>0),blocked=this.wallHp>0;this.goalAttackers=atGoal.reduce((n,u)=>n+this.members(u),0);if(!atGoal.length)return;
  const hit=u=>Math.sqrt(this.members(u))*(this.combatVersion>=12?forceStats(this.attackerGrowth,u.role).siege:FORCES[u.role].siege*(1+.07*(u.level-1)))*dt,damage=atGoal.reduce((n,u)=>n+hit(u),0);
  if(blocked){this.wallHp=Math.max(0,this.wallHp-damage);const reflect=Math.min(.38,.02*((this.growth.facilityLevels?.wallReflect||1)-1));if(reflect)for(const u of atGoal)this.damage(u,hit(u)*reflect,'wallReflect');
   if(this.wallHp===0){this.wallBrokenAt=this.time;this.log('wall','전면 방벽 붕괴 · 센터로 총진격');for(let y=SIEGE.top;y<=SIEGE.bottom;y+=90)this.effects.push({type:'wall-break',x:SIEGE.wallX,y,at:this.time,duration:1.6,radius:100});}
  }else if(this.time-this.wallBrokenAt>=.9)this.centerHp=Math.max(0,this.centerHp-damage);
  this.attackClock+=dt;if(this.attackClock>.2){this.attackClock=0;for(let i=0;i<Math.min(9,atGoal.length);i++){const u=atGoal[(i*13+Math.floor(this.time*7))%atGoal.length],p=this.position(u);this.effects.push({type:'siege',x:blocked?SIEGE.wallX:SIEGE.centerX-25,y:blocked?p.y:SIEGE.centerY-50+(i%4)*24,fromX:p.x,fromY:p.y,at:this.time,duration:.3,radius:30});}}
 }
 summary(){return {...super.summary(),objective:'conquest',variant:this.variant,rulesVersion:12,support:structuredClone(this.support),attackOrder:['wall','center']};}
}
