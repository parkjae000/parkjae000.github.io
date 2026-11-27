import {TOWER_DEFS,HERO_DEFS,FORCES,FORCE_IDS,defaultGrowth,towerStats,heroStats,heroStatsV12,wallStats,forceStats,MAX_ARMY,short,damageMultiplier,forceComposition} from './progression.mjs?v=td-ux-20';
export const WORLD={w:1536,h:1024};
export const STORAGE_KEY='kurly-tower-defense-review-v7';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const CATALOG={...TOWER_DEFS,...HERO_DEFS};
export const PADS=[
 [400,360],[400,630],[600,360],[600,630],[800,360],[800,630],[1000,360],[1000,700],
 [1195,700],[800,700],[1195,400],[1195,255],[1000,535],[180,750],[400,215],[600,755],
 [500,120],[700,120],[900,120],[1100,120],[500,910],[700,910],[900,910],[1100,910]
].map(([x,y],i)=>({id:'pad-'+i,x,y,...(i>=16?{laserLane:true}:{} )}));
// Six switchbacks use the inner courtyard. Rendering and movement share this exact curve.
const segments=[['M',205,495],['L',245,495],['Q',300,495,300,550],['L',300,740],['Q',300,800,360,800],['L',440,800],['Q',500,800,500,740],['L',500,270],['Q',500,210,560,210],['L',640,210],['Q',700,210,700,270],['L',700,740],['Q',700,800,760,800],['L',840,800],['Q',900,800,900,740],['L',900,270],['Q',900,210,960,210],['L',1040,210],['Q',1100,210,1100,270],['L',1100,740],['Q',1100,800,1160,800],['L',1230,800],['Q',1290,800,1290,740],['L',1290,565],['Q',1290,495,1360,495],['L',1380,495]];
const points=[];let current;
for(const [kind,...p] of segments){
 if(kind==='M'){current={x:p[0],y:p[1]};points.push({...current});continue;}
 if(kind==='L'){const end={x:p[0],y:p[1]},n=Math.ceil(Math.hypot(end.x-current.x,end.y-current.y)/5),start=current;for(let i=1;i<=n;i++){const t=i/n;points.push({x:start.x+(end.x-start.x)*t,y:start.y+(end.y-start.y)*t});}current=end;}
 else {const start=current,end={x:p[2],y:p[3]};for(let i=1;i<=24;i++){const t=i/24,k=1-t;points.push({x:k*k*start.x+2*k*t*p[0]+t*t*end.x,y:k*k*start.y+2*k*t*p[1]+t*t*end.y});}current=end;}
}
let total=0;
export const ROUTE=points.map((p,i)=>{if(i)total+=Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y);return {...p,s:total};});
export const ROUTE_LENGTH=total;
export function lanePoint(distance,offset=0){
 if(distance<0)return {x:205+distance,y:495+offset,angle:0};
 const d=clamp(distance,0,ROUTE_LENGTH);let lo=0,hi=ROUTE.length-1;
 while(lo+1<hi){const mid=(lo+hi)>>1;if(ROUTE[mid].s<d)lo=mid;else hi=mid;}
 const a=ROUTE[lo],b=ROUTE[hi],t=(d-a.s)/Math.max(.001,b.s-a.s),angle=Math.atan2(b.y-a.y,b.x-a.x);
 return {x:a.x+(b.x-a.x)*t-Math.sin(angle)*offset,y:a.y+(b.y-a.y)*t+Math.cos(angle)*offset,angle};
}
export function defaultLayout(){return [
 ['cannon',0],['tesla',1],['beauty',2],['ambient',3],['tesla',5],['frozen',6],['ice',7],['cannon',8],['laser',10],['cs',11],['chilled',4],['returns',12]
].map(([type,pad],i)=>({id:'def-'+i,type,pad:PADS[pad].id}));}
export function validateLayout(layout){
 if(!Array.isArray(layout)||layout.length>12)return false;const ids=new Set(),pads=new Set(),heroes=new Set();let towerCount=0,heroCount=0;
 for(const p of layout){const def=CATALOG[p?.type];if(!def||typeof p.id!=='string'||ids.has(p.id)||!PADS.some(x=>x.id===p.pad)||pads.has(p.pad))return false;ids.add(p.id);pads.add(p.pad);if(def.kind==='hero'){if(heroes.has(p.type))return false;heroes.add(p.type);heroCount++;}else towerCount++;}
 return towerCount<=6&&heroCount<=6;
}
export class DefenseEditor{
 constructor(layout=defaultLayout()){this.items=validateLayout(layout)?structuredClone(layout):defaultLayout();this.history=[];this.selected=null;this.tool='cannon';this.dirty=false;this.nextId=1;while(this.items.some(p=>p.id==='new-'+this.nextId))this.nextId++;}
 select(id){const item=this.items.find(p=>p.id===id);if(!item)return false;this.selected=id;this.tool=item.type;return true;}
 move(id,pad,{swap=true}={}){
  const current=this.items.find(p=>p.id===id);if(!current||!PADS.some(p=>p.id===pad))return {ok:false,message:'배치 가능한 발판에 놓아 주세요.'};if(current.pad===pad){this.select(id);return {ok:true,changed:false,message:'현재 위치예요.'};}
  const candidate=structuredClone(this.items),moving=candidate.find(p=>p.id===id),occupied=candidate.find(p=>p.pad===pad);if(occupied&&!swap)return {ok:false,message:'이미 다른 방어 시설이 있어요.'};if(occupied)occupied.pad=moving.pad;moving.pad=pad;
  if(!validateLayout(candidate))return {ok:false,message:'이 발판에는 배치할 수 없어요.'};this.remember();this.items=candidate;this.select(id);return {ok:true,changed:true,swapped:!!occupied,message:occupied?'두 시설의 자리를 바꿨어요.':'배치를 옮겼어요.'};
 }
 remember(){this.history.push(structuredClone(this.items));this.history=this.history.slice(-30);this.dirty=true;}
 choose(type){if(!CATALOG[type])return;this.tool=type;this.selected=null;}
 place(pad){
  if(!PADS.some(p=>p.id===pad))return {ok:false,message:'배치 가능한 발판을 선택해 주세요.'};
  const occupant=this.items.find(p=>p.pad===pad);
  if(occupant){this.selected=occupant.id;this.tool=occupant.type;return {ok:true,selected:true,message:CATALOG[occupant.type].name+' 선택 · 빈 발판을 누르면 이동'};}
  const candidate=structuredClone(this.items);const moving=candidate.find(p=>p.id===this.selected);
  if(moving)moving.pad=pad;else candidate.push({id:'new-'+this.nextId,type:this.tool,pad});
  if(!validateLayout(candidate))return {ok:false,message:CATALOG[this.tool].kind==='hero'?'파트장은 중복 없이 최대 6명까지 배치해요.':'타워는 최대 6기까지 배치해요.'};
  this.remember();this.items=candidate;if(!moving){this.nextId++;while(this.items.some(p=>p.id==='new-'+this.nextId))this.nextId++;}this.selected=null;
  return {ok:true,message:moving?'배치 위치를 옮겼어요.':CATALOG[this.tool].name+' 배치 완료'};
 }
 remove(){if(!this.selected)return false;this.remember();this.items=this.items.filter(p=>p.id!==this.selected);this.selected=null;return true;}
 undo(){if(!this.history.length)return false;this.items=this.history.pop();this.selected=null;this.dirty=true;return true;}
 snapshot(){return {version:1,items:structuredClone(this.items)};}
}
export const WALL_S=ROUTE_LENGTH-78;
export const WALL_POINT=lanePoint(WALL_S);
export const MAX_COHORTS=192;
const rng=seed=>{let v=seed>>>0;return()=>((v=(Math.imul(v,1664525)+1013904223)>>>0)/4294967296);};
export class Battle{
 constructor(layout,{amount=1_000_000,seed=426,growth=defaultGrowth(),attackerGrowth=growth,composition='balanced',forceTotals=null,initialState=null,strength=1,fortressProfile=null,pads=PADS,combatVersion=13}={}){
  if(!validateLayout(layout))throw Error('Invalid saved defense layout');
  if(!Number.isSafeInteger(amount)||amount<1||amount>MAX_ARMY)throw Error('보유 병력은 1명부터 최대 1억 명까지 출정해요.');
  this.objective='raid';this.combatVersion=combatVersion;this.pads=pads;this.layout=structuredClone(layout);this.growth=structuredClone(growth);this.attackerGrowth=structuredClone(attackerGrowth);this.total=amount;this.seed=seed;this.ticks=0;this.time=0;this.centerMax=fortressProfile?.centerMax??Math.round(100000*1.18**((growth.facilityLevels?.center||1)-1));this.centerHp=this.centerMax;this.wallMax=fortressProfile?.wallMax??wallStats(growth).hp;this.wallHp=initialState?clamp(initialState.wallHp,0,this.wallMax):this.wallMax;this.centerHp=initialState?clamp(initialState.centerHp,0,this.centerMax):this.centerMax;this.wallBrokenAt=this.wallHp===0?-10:null;this.strength=strength;this.composition=composition;this.status='running';this.won=false;this.kills=0;this.events=[];this.effects=[];this.fields=[];this.shots=[];this.projectiles=[];this.castId=0;this.chainJumps=0;this.maxKnockback=0;this.attackClock=0;this.peakVisible=0;this.goalAttackers=0;this.killedBy={};this.deathsByRole={army:0,air:0,navy:0};
  this.density=Math.max(1,(amount/10000)**.80);const random=rng(seed);this.forceTotals=forceTotals?{...forceTotals}:forceComposition(amount,composition);if(FORCE_IDS.some(id=>!Number.isSafeInteger(this.forceTotals[id])||this.forceTotals[id]<0)||Object.values(this.forceTotals).reduce((a,b)=>a+b,0)!==amount)throw Error('병과별 출정 인원을 확인해 주세요.');const amounts=FORCE_IDS.map(id=>this.forceTotals[id]);
  const groups=FORCE_IDS.map((id,r)=>{const n=Math.min(64,amounts[r]);return Array.from({length:n},(_,i)=>{const count=Math.floor(amounts[r]/n)+(i<amounts[r]%n?1:0),level=attackerGrowth.forceLevels[id],perHp=combatVersion>=12?forceStats(attackerGrowth,id).hp:FORCES[id].hp*(1+.08*(level-1));return {role:id,count,hp:perHp*count,maxHp:perHp*count,perHp,level};});});
  this.units=[];for(let index=0;index<64;index++)for(let r=0;r<3;r++){if(!groups[r][index])continue;const i=this.units.length;this.units.push({...groups[r][index],id:i,s:-18-Math.floor(i/8)*31-(i%8)*.55,lane:(i%8-3.5)*8.4,speed:FORCES[FORCE_IDS[r]].speed+random()*4,slowUntil:0,freezeUntil:0,stunUntil:0,burnUntil:0,vulnerableUntil:0,hitAt:-10,hitKind:null,phase:random()*6.28,controlLoad:0,resolveUntil:0,nextKnockAt:0,knockFrom:0,knockAt:-10,knockUntil:-10,goal:false,sieging:false});}
  this.defenders=layout.map((p,i)=>({...p,...pads.find(v=>v.id===p.pad),id:p.id,stats:CATALOG[p.type].kind==='hero'?(combatVersion>=13?heroStats(growth,p.type):heroStatsV12(growth,p.type)):towerStats(growth,p.type),cooldown:.25+i*.13,skillCooldown:2+i*.38,lastShot:-10,lastSkill:-10,shots:0,skills:0,target:null})).filter(d=>d.stats);
  this.log('deploy',short(amount)+'명 육·공·해군 일괄 출격');
 }
 log(type,message,extra={}){this.events.push({at:this.time,type,message,...extra});this.events=this.events.slice(-240);}
 members(u){return u.hp<=0?0:Math.min(u.count,Math.ceil((u.hp-1e-8)/u.perHp));}
 get alive(){return this.total-this.kills;}
 get front(){return Math.max(0,...this.units.filter(u=>u.hp>0).map(u=>u.s));}
 position(u){return lanePoint(u.s,u.lane);}
 aimPosition(u,lead=0){return lanePoint(Math.min(u.s+lead,this.wallHp>0?WALL_S-28:ROUTE_LENGTH-16),u.lane);}
 queueUnits(){const gateClosed=this.wallHp>0||this.wallBrokenAt!==null&&this.time-this.wallBrokenAt<.9,stop=gateClosed?WALL_S-28:ROUTE_LENGTH-16;
  const queues=Array.from({length:8},()=>[]);for(const u of this.units)if(u.hp>0)queues[u.id%8].push(u);for(const queue of queues){queue.sort((a,b)=>b.s-a.s||a.id-b.id);let limit=stop;for(const u of queue){u.s=Math.min(u.s,limit);u.goal=u.s>=stop-.1;u.sieging=u.s>=stop-110;limit=u.s-27;}}
 }
 resolveSiege(visible,dt){const gateClosed=this.wallHp>0||this.wallBrokenAt!==null&&this.time-this.wallBrokenAt<.9;
  const atGoal=visible.filter(u=>u.sieging&&u.hp>0);this.goalAttackers=atGoal.reduce((n,u)=>n+this.members(u),0);
  if(atGoal.length){const damage=atGoal.reduce((n,u)=>n+Math.sqrt(this.members(u))*(this.combatVersion>=12?forceStats(this.attackerGrowth,u.role).siege:FORCES[u.role].siege*(1+.07*(u.level-1))),0)*dt;
   if(this.wallHp>0){this.wallHp=Math.max(0,this.wallHp-damage);const reflected=Math.min(.38,.02*((this.growth.facilityLevels?.wallReflect||1)-1));if(reflected)for(const u of atGoal)this.damage(u,Math.sqrt(this.members(u))*(this.combatVersion>=12?forceStats(this.attackerGrowth,u.role).siege:FORCES[u.role].siege*(1+.07*(u.level-1)))*dt*reflected,'wallReflect');if(this.wallHp===0){this.wallBrokenAt=this.time;this.log('wall','방벽 돌파 · 센터 진입');this.effects.push({type:'wall-break',x:WALL_POINT.x,y:WALL_POINT.y,at:this.time,duration:1.6,radius:125});}}
   else if(!gateClosed)this.centerHp=Math.max(0,this.centerHp-damage);
   this.attackClock+=dt;if(this.attackClock>.20){this.attackClock=0;this.effects.push({type:'siege',x:gateClosed?WALL_POINT.x:1380,y:gateClosed?WALL_POINT.y-35:455,fromX:gateClosed?WALL_POINT.x-90:1300,fromY:495,at:this.time,duration:.3,radius:40});}
  }
 }
 damage(u,amount,type){if(u.hp<=0)return 0;const before=this.members(u),resist=damageMultiplier(type,u.role);u.hp=Math.max(0,u.hp-amount*resist*(this.combatVersion>=13&&u.beautyVulnerableUntil>this.time?1.35:u.vulnerableUntil>this.time?1.25:1));u.hitAt=this.time;u.hitKind=type;const killed=before-this.members(u);this.kills+=killed;this.killedBy[type]=(this.killedBy[type]||0)+killed;this.deathsByRole[u.role]+=killed;
  if(killed){const p=this.position(u);this.effects.push({type:'casualty',role:u.role,hit:type,x:p.x,y:p.y,at:this.time,duration:.8,radius:20,count:killed,seed:u.id});}return killed;}
 knockback(u,distance){if(this.time<u.resolveUntil||this.time<u.nextKnockAt)return;u.nextKnockAt=this.time+.55;distance*=1-(FORCES[u.role].knockbackResist||0);const before=u.s;u.knockFrom=u.s;u.s=Math.max(0,u.s-distance);u.knockAt=this.time;u.knockUntil=this.time+.28;this.maxKnockback=Math.max(this.maxKnockback,before-u.s);}
 applyStatus(u,type,skill,control=100){const scale=control/100;if(type==='laser'||type==='ambient'){u.burnUntil=this.time+(skill?4:1.2)*scale;u.burnSource=type;};if(this.time<u.resolveUntil)return;
  if(type==='ice'||type==='frozen'){u.slowUntil=this.time+1.7*scale;if(skill&&type==='frozen'){u.freezeUntil=this.time+.28;this.knockback(u,35*Math.sqrt(scale));}}
  if(type==='tesla'||type==='cs')u.stunUntil=this.time+(skill?(this.combatVersion>=13&&type==='cs'?1.1:.7):.22)*Math.sqrt(scale);
  if(type==='chilled'){u.slowUntil=this.time+2.6*scale;u.vulnerableUntil=this.time+3*scale;if(skill)u.freezeUntil=this.time+.85*Math.sqrt(scale);}
  if(type==='beauty'){u.stunUntil=this.time+(skill?(this.combatVersion>=13?.75:.5):.1)*Math.sqrt(scale);if(skill){this.knockback(u,25*Math.sqrt(scale));if(this.combatVersion>=13){u.beautyVulnerableUntil=this.time+4*scale;u.slowUntil=this.time+2.2*scale;}}}
  if(type==='returns'&&skill)this.knockback(u,58*Math.sqrt(scale));
  if(type==='laser'||type==='ambient'){u.burnUntil=this.time+(skill?4:1.2)*scale;u.burnSource=type;};
 }
 fire(d,candidates,skill=false){
  const st=d.stats,target=candidates[0],delay=d.type==='cannon'?.07:d.type==='tesla'?.16:d.type==='laser'?.12:skill&&d.type==='returns'?1.15:skill&&d.type==='frozen'?.30:skill?.6:d.type==='ambient'?.58:.50;
  const canMove=target.freezeUntil<=this.time&&target.stunUntil<=this.time;
  const lead=canMove?target.speed*delay*.65:0,p=this.aimPosition(target,lead);
  const radius=skill&&this.combatVersion>=13?(st.skillRadius||st.splash*1.8):st.splash*(skill?1.8:1),fromX=d.x+(d.type==='cannon'?(p.x>d.x?34:-34):d.type==='laser'?(this.combatVersion>=9?0:-18):10),fromY=d.y-(d.type==='tesla'?116:st.kind==='hero'?65:71);
  const e={id:++this.castId,type:d.type,skill,x:p.x,y:p.y,angle:p.angle,fromX,fromY,at:this.time,delay,impactAt:this.time+delay,duration:delay+(skill?2.1:.65),radius,control:st.control||100,stats:st,targetId:target.id,targets:[],resolved:false};
  if(d.type==='laser'&&this.combatVersion>=9){const length=Math.hypot(p.x-fromX,p.y-fromY)||1;e.beamEnd={x:fromX+(p.x-fromX)/length*st.range,y:fromY+(p.y-fromY)/length*st.range};e.beamWidth=st.beamWidth/2;}
  this.projectiles.push(e);if(this.combatVersion>=13&&skill&&st.skillEcho){this.projectiles.push({...e,id:++this.castId,delay:e.delay+st.echoDelay,impactAt:e.impactAt+st.echoDelay,duration:e.duration+st.echoDelay,radius:e.radius*.75,stats:{...st,skillDamage:Math.round(st.skillDamage*st.skillEcho)},echo:true});}this.projectiles=this.projectiles.slice(-80);
  d.lastShot=this.time;d.target={...p};d.shots++;
  if(skill){d.lastSkill=this.time;d.skills++;this.log('skill',st.name+' · '+st.desc,{hero:d.type});}
  this.shots.push({type:d.type,skill,at:this.time,x:fromX,y:fromY,tx:p.x,ty:p.y});
 }
 resolveImpact(e){
  const st=e.stats,visible=this.units.filter(u=>u.hp>0&&u.s>=0),point=u=>this.position(u);
  let near=visible.filter(u=>{const p=point(u);return Math.hypot(p.x-e.x,p.y-e.y)<=e.radius;});
  if(e.type==='laser'&&e.beamEnd){const dx=e.beamEnd.x-e.fromX,dy=e.beamEnd.y-e.fromY,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;near=visible.map(u=>{const p=point(u),x=p.x-e.fromX,y=p.y-e.fromY;return {u,along:x*ux+y*uy,side:Math.abs(x*uy-y*ux)};}).filter(q=>q.along>=0&&q.along<=length&&q.side<=e.beamWidth).sort((a,b)=>a.along-b.along||a.u.id-b.u.id).map(q=>q.u);}
  if(e.type==='tesla'||e.type==='cs'&&e.skill){
   const first=visible.find(u=>u.id===e.targetId)||near[0];near=[];let current=first;
   while(current&&near.length<(e.skill?st.skillChainTargets??10:st.chainTargets??7)){near.push(current);const p=point(current);current=visible.filter(u=>!near.includes(u)).map(u=>({u,p:point(u)})).filter(q=>Math.hypot(q.p.x-p.x,q.p.y-p.y)<(st.chainRange??145)).sort((a,b)=>Math.hypot(a.p.x-p.x,a.p.y-p.y)-Math.hypot(b.p.x-p.x,b.p.y-p.y))[0]?.u;}
  }
  let budget=Math.ceil(st.hits*(e.skill?2.6:1)*this.density),hits=0;const hitUnits=[];
  near.forEach((u,i)=>{const victims=Math.min(this.members(u),Math.ceil(budget/(near.length-i)));if(victims<=0)return;this.damage(u,(e.skill?st.skillDamage:st.damage)*this.strength*victims,e.type);this.applyStatus(u,e.type,e.skill,e.control);hits+=victims;budget-=victims;hitUnits.push(u);});
  e.targets=hitUnits.map(u=>({...point(u),role:u.role,id:u.id}));e.hits=hits;e.resolved=true;
  if(e.type==='tesla'||e.type==='cs'&&e.skill)this.chainJumps+=Math.max(0,hitUnits.length-1);
  if(e.type==='ice'||e.skill&&['frozen','ambient','chilled','beauty'].includes(e.type)){
   const f={type:e.type,x:e.x,y:e.y,angle:e.angle,at:this.time,until:this.time+(e.skill?st.fieldDuration||4.4:3),radius:e.radius,damage:st.damage*this.strength*(e.skill?.18:.07),hits:Math.ceil(st.hits*this.density*.28),nextAt:this.time+.3,control:e.control,skill:e.skill};this.fields.push(f);
  }
 }
 step(dt){if(this.status!=='running')return;this.ticks++;this.time+=dt;const gateClosed=this.wallHp>0||this.wallBrokenAt!==null&&this.time-this.wallBrokenAt<.9,stop=gateClosed?WALL_S-28:ROUTE_LENGTH-16;
  for(const u of this.units){if(u.hp<=0)continue;if(this.time>=u.resolveUntil&&(u.slowUntil>this.time||u.stunUntil>this.time||u.freezeUntil>this.time)){u.controlLoad+=dt;if(u.controlLoad>=2.8){u.resolveUntil=this.time+1.8;u.controlLoad=0;u.slowUntil=0;u.stunUntil=0;u.freezeUntil=0;}}else if(this.time>=u.resolveUntil)u.controlLoad=Math.max(0,u.controlLoad-dt);if(u.burnUntil>this.time)this.damage(u,Math.sqrt(this.members(u))*dt*2.2,u.burnSource||'burn');if(u.hp<=0)continue;if(this.time<u.freezeUntil||this.time<u.stunUntil)continue;u.s+=u.speed*(u.slowUntil>this.time?1-.38*(1-(FORCES[u.role].slowResist||0)):1)*dt;}
  this.queueUnits();
  const visible=this.units.filter(u=>u.hp>0&&u.s>=0);this.peakVisible=Math.max(this.peakVisible,visible.length);
  for(const d of this.defenders){d.cooldown-=dt;d.skillCooldown-=dt;if(d.cooldown>0&&(d.stats.kind!=='hero'||d.skillCooldown>0))continue;const candidates=visible.filter(u=>{const p=this.position(u);return d.stats.globalRange||Math.hypot(p.x-d.x,p.y-d.y)<d.stats.range;}).sort((a,b)=>b.s-a.s||a.id-b.id);if(!candidates.length)continue;
   if(d.stats.kind==='hero'&&d.skillCooldown<=0){this.fire(d,candidates,true);d.skillCooldown=d.stats.cooldown;}
   else if(d.cooldown<=0){this.fire(d,candidates,false);d.cooldown=d.stats.interval;}
  }
  for(const e of this.projectiles)if(!e.resolved&&e.impactAt<=this.time)this.resolveImpact(e);
  this.projectiles=this.projectiles.filter(e=>this.time-e.at<e.duration);
  this.fields=this.fields.filter(f=>f.until>this.time).slice(-18);
  for(const f of this.fields){if(f.nextAt>this.time)continue;f.nextAt+=.3;
   const near=visible.filter(u=>{const p=this.position(u),dx=p.x-f.x,dy=p.y-f.y;if(f.type==='ambient'){const along=dx*Math.cos(f.angle)+dy*Math.sin(f.angle),across=-dx*Math.sin(f.angle)+dy*Math.cos(f.angle);return Math.abs(along)<36&&Math.abs(across)<f.radius;}return Math.hypot(dx,dy)<f.radius;});
   let budget=f.hits;near.forEach((u,i)=>{const victims=Math.min(this.members(u),Math.ceil(budget/(near.length-i)));if(victims>0){this.damage(u,f.damage*victims,f.type);this.applyStatus(u,f.type,false,f.control);if(this.combatVersion>=13&&f.type==='beauty'&&f.skill&&u.resolveUntil<=this.time){u.beautyVulnerableUntil=this.time+4*f.control/100;u.slowUntil=this.time+2.2*f.control/100;}budget-=victims;if(f.type==='frozen')this.knockback(u,23*Math.sqrt(f.control/100));if(f.type==='beauty')this.knockback(u,9);}});
  }
  this.resolveSiege(visible,dt);
  this.effects=this.effects.filter(e=>this.time-e.at<e.duration).slice(-110);this.shots=this.shots.filter(e=>this.time-e.at<1).slice(-80);
  if(this.centerHp<=0){this.status='victory';this.won=true;this.log('result','센터 붕괴 · 공격 승리');}
  else if(!this.alive){this.status='defeat';this.log('result','전 병력 격파 · 방어 승리');}
  else if(this.combatVersion>=12&&this.time>=300){this.status='defeat';this.log('result','5분 제한시간 종료 · 방어 성공 · 생존 병력 귀환');}
 }
 retreat(){if(this.status!=='running')return false;this.status='retreated';this.won=false;this.log('result','후퇴 · 생존 병력 전원 귀환');return true;}
 skip(){for(let i=0;i<1800*30&&this.status==='running';i++)this.step(1/30);if(this.status==='running')throw Error('모의 계산이 길어졌어요. 진행 상태 확인이 필요해요.');return this.status;}
 summary(){return {total:this.total,alive:this.alive,dead:this.kills,forceTotals:{...this.forceTotals},deathsByRole:{...this.deathsByRole},centerHp:Math.round(this.centerHp),wallHp:Math.round(this.wallHp),wallBrokenAt:this.wallBrokenAt,time:Math.round(this.time*10)/10,status:this.status,cohorts:this.units.length,peakVisible:this.peakVisible,chainJumps:this.chainJumps,maxKnockback:this.maxKnockback,killedBy:{...this.killedBy},shots:this.defenders.map(d=>({type:d.type,basic:d.shots-d.skills,skills:d.skills})),growth:structuredClone(this.growth),attackerGrowth:structuredClone(this.attackerGrowth),layout:structuredClone(this.layout)};}
}
