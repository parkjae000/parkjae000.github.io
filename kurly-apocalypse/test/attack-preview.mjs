import {Battle,CATALOG} from './engine.mjs?v=td-ux-13';
import {HERO_DEFS} from './progression.mjs?v=td-ux-13';
import {Renderer} from './renderer-v2.mjs?v=td-ux-13';
import {CombatVFX} from './battle-vfx.mjs?v=td-ux-13';
import {attackGuide} from './combat-guide.mjs?v=td-ux-13';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// An isolated visual sandbox using the same fire, impact, status and VFX code as real combat.
export function createAttackDemo(type,growth,mode='basic'){
 if(!CATALOG[type])throw Error('공격 미리보기 대상을 선택해 주세요.');
 mode=HERO_DEFS[type]&&mode==='skill'?'skill':'basic';
 const g=structuredClone(growth);
 if(HERO_DEFS[type]&&!g.heroes[type]?.star)g.heroes[type]={level:1,star:1,xp:0,shards:0};
 const b=new Battle([{id:'preview-caster',type,pad:'pad-0'}],{amount:504,growth:g,attackerGrowth:g,seed:426});
 const d=b.defenders[0];d.x=160;d.y=320;d.cooldown=d.skillCooldown=1e9;
 const hp=Math.max(100,(mode==='skill'?d.stats.skillDamage:d.stats.damage)*1.2);
 b.units=b.units.slice(0,42).map((u,i)=>({...u,count:12,perHp:hp,hp:12*hp,maxHp:12*hp,s:340+(i%7)*8,lane:(Math.floor(i/7)-2.5)*15,speed:8}));
 b.forceTotals={army:168,air:168,navy:168};b.position=u=>({x:640-u.s,y:320+u.lane,angle:Math.PI});
 b.aimPosition=(u,lead=0)=>b.position({...u,s:u.s+lead});b.resolveSiege=()=>{};
 let next=.35;
 return {battle:b,growth:g,type,mode,elapsed:0,advance(dt){
  this.elapsed+=dt;if(b.status==='running')b.step(dt);else b.time+=dt;
  if(this.elapsed>=next&&b.status==='running'){
   const targets=b.units.filter(u=>u.hp>0).sort((a,c)=>c.s-a.s||a.id-c.id);
   if(targets.length)b.fire(d,targets,mode==='skill');
   next=mode==='skill'?Infinity:this.elapsed+Math.max(.13,d.stats.interval);
  }
 }};
}
export class AttackPreview{
 constructor(root,art){this.root=root;this.art=art;this.demo=null;this.mode='basic';this.paused=false;this.accumulator=0;root.hidden=true;
  root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();this.close();}});
  root.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;event.stopPropagation();if(b.hasAttribute('data-demo-close'))this.close();if(b.dataset.demoMode)this.start(b.dataset.demoMode);if(b.hasAttribute('data-demo-restart'))this.start(this.mode);if(b.hasAttribute('data-demo-pause')){this.paused=!this.paused;b.textContent=this.paused?'▶ 계속':'Ⅱ 일시정지';}});
 }
 get open(){return !this.root.hidden;}
 show(type,growth){this.type=type;this.growth=structuredClone(growth);this.root.hidden=false;this.start('basic');}
 start(mode){this.mode=mode;this.demo=createAttackDemo(this.type,this.growth,mode);this.paused=false;this.accumulator=0;const st=this.demo.battle.defenders[0].stats,guide=attackGuide(this.type,st),info=mode==='skill'?guide.skill:guide.basic;
  this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-label',st.name+' 공격 영상');
  this.root.innerHTML=`<section class="td-demo-shell"><header><div><small>공격 영상 미리보기</small><h3>${esc(st.name)} <span>Lv.${st.level}</span></h3></div><button type="button" data-demo-close aria-label="공격 미리보기 닫기">닫기 ✕</button></header><nav aria-label="공격 종류"><button type="button" data-demo-mode="basic" class="${mode==='basic'?'selected':''}">기본 공격</button>${guide.skill?`<button type="button" data-demo-mode="skill" class="${mode==='skill'?'selected':''}">${esc(guide.skill.name)}</button>`:''}</nav><canvas width="960" height="630" aria-label="${esc(st.name+' '+info.name)} 공격 애니메이션"></canvas><div class="td-demo-playback"><button type="button" data-demo-pause>Ⅱ 일시정지</button><progress max="6" value="0" aria-label="6초 반복 영상 진행"></progress><button type="button" data-demo-restart>↻ 다시 재생</button></div><div class="td-demo-description"><h4>${esc(info.name)}</h4><p>${esc(info.description)}</p><b>${esc(info.facts)}</b><small>실제 전투 이펙트 · 6초 반복 · 자원·병력 소모 없음</small></div></section>`;
  this.renderer=new Renderer(this.root.querySelector('canvas'),this.art,{width:640,height:420,pixelRatio:1.5});this.vfx=new CombatVFX(this.renderer);this.draw();
 }
 close(){this.root.hidden=true;this.root.innerHTML='';this.demo=null;this.renderer=null;}
 tick(dt){if(!this.open||!this.demo||this.paused)return;this.accumulator+=dt;if(this.accumulator<1/30)return;const elapsed=this.accumulator;this.accumulator=0;
  if(this.demo.elapsed>=6)this.demo=createAttackDemo(this.type,this.growth,this.mode);
  const steps=Math.ceil(elapsed/(1/30));for(let i=0;i<steps;i++)this.demo.advance(elapsed/steps);
  this.draw();const progress=this.root.querySelector('progress');if(progress)progress.value=this.demo.elapsed;
 }
 draw(){const demo=this.demo,b=demo.battle,r=this.renderer,c=r.c,t=b.time,state={mode:'battle',growth:demo.growth,battle:b},art=this.art;
  c.setTransform(1.5,0,0,1.5,0,0);c.clearRect(0,0,640,420);c.drawImage(art.floor||art.map,260,225,1020,700,0,0,640,420);
  c.fillStyle='#423448b0';c.fillRect(0,238,640,145);c.fillStyle='#8d7c98';c.fillRect(0,246,640,128);c.strokeStyle='#e3bc7a';c.lineWidth=5;c.strokeRect(-5,241,650,140);c.strokeStyle='#d5bdcf66';c.setLineDash([12,18]);c.lineWidth=2;c.beginPath();c.moveTo(0,310);c.lineTo(640,310);c.stroke();c.setLineDash([]);
  for(const f of b.fields)this.vfx.field(f,t,false);
  const entries=[{y:320,kind:'caster'}];
  for(const u of b.units)if(u.hp>0){const drawS=u.knockUntil>t?u.knockFrom+(u.s-u.knockFrom)*Math.min(1,(t-u.knockAt)/.28):u.s;for(let j=0;j<3;j++){const p=b.position({...u,s:drawS-j*9,lane:u.lane+(j-1)*5});entries.push({kind:'unit',u,p,y:p.y});}}
  entries.sort((a,z)=>a.y-z.y);for(const entry of entries)if(entry.kind==='caster')r.drawDefender(state,b.defenders[0],t);else r.drawUnit(state,entry.u,entry.p,t);
  for(const f of b.fields)this.vfx.field(f,t,true);for(const e of b.projectiles)this.vfx.projectile(e,t);for(const e of b.effects)r.effect(e,t);
 }
}
