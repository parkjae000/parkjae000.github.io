import {conquestTowerStats} from './conquest-stats.mjs?v=td-ux-15';
import {AttackPreview} from './attack-preview.mjs?v=td-ux-15';
import {syncCanvasControls} from './canvas-controls.mjs?v=td-ux-15';
import {RemoteSession} from './remote-session.mjs?v=td-ux-15';
import {CompactUI} from './compact-ui.mjs?v=td-ux-15';
import {Renderer} from './renderer-v2.mjs?v=td-ux-15';
import {browserArt} from './art.mjs?v=td-ux-15';
import {EditorInteraction,editorPads} from './editor-interaction.mjs?v=td-ux-15';
import {CATALOG,WORLD} from './engine.mjs?v=td-ux-15';
import {HERO_DEFS,TOWER_IDS,heroStats,towerStats,rangeLabel} from './progression.mjs?v=td-ux-15';
import {GROWTH_CATEGORIES} from './ui-model.mjs?v=td-ux-15';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function styles(){await Promise.all(['review-ui.css','test.css','integrated.css','compact.css','operations.css'].map(file=>new Promise((resolve,reject)=>{const href=new URL(file+'?v=td-ux-15',import.meta.url).href;if([...document.styleSheets].some(s=>s.href===href))return resolve();const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.onload=resolve;link.onerror=()=>reject(Error('전장 화면을 불러오지 못했어요.'));document.head.append(link);})));}
class IntegratedSession extends RemoteSession{
 constructor(td,token,api){super(td,token);this.api=api;this.active=false;}
 async send(type,params={}){params=structuredClone(params);const run=async()=>{this.busy=true;try{const out=await this.api('/api/action','POST',{type,...params,requestId:crypto.randomUUID()});if(out.td)this.apply(out.td);this.notify(out.message||'저장했어요.');return out;}catch(error){this.notify(error.message);throw error;}finally{this.busy=false;}};const pending=this.requestChain.then(run);this.requestChain=pending.catch(()=>{});return pending;}
 async poll(force=false){if(!this.active||this.polling||this.busy||!force&&Date.now()-this.lastPoll<(this.campaign.pending?2000:6500))return;this.polling=true;try{const result=await this.api('/api/td-state');this.apply(result.td);}catch(error){this.notify(error.message);}finally{this.polling=false;this.lastPoll=Date.now();}}
}
class EmbeddedUI extends CompactUI{
 constructor(root,session,art,owner){super(root,session,art);this.owner=owner;root.removeAttribute('aria-modal');root.setAttribute('role','region');}
 open(page='management',category='tower'){this.plan.amount=this.s.campaign.troops;this.plan.shieldActive=this.s.campaign.shieldUntil>Date.now();this.s.growthOpen=false;this.page=page;this.category=category;this.selected=GROWTH_CATEGORIES[category]?.ids[0]||'cannon';this.detail=false;this.expDetail=false;this.shopDetail=false;this.receipt=null;this.notice='';this.render(false);}

 action(id,value){
  if(id==='classic'){this.owner.navigate('explore');return;}
  if(id==='page'&&value==='mining'){this.owner.navigate('mine');return;}
  if(id==='page'&&value==='shop'){this.owner.navigate('shop');return;}
  if(id==='page'&&value==='army'){this.owner.navigate('center');return;}
  if(id==='close'&&this.page==='expedition'&&!this.s.campaign.pending){this.close();this.owner.navigate('war-home');return;}
  if(id==='editor'||id==='close'){if(this.s.campaign.pending){this.close();return;}this.owner.navigate('defense',{scope:this.s.scope});return;}
  if(id==='local-page'){this.open(value,this.category);return;}
  if(id==='scope'){this.owner.navigate('defense',{scope:value});return;}
  if(id==='range'){super.action(id,value);this.owner.refreshEditor();return;}
  return super.action(id,value);
 }
}
class EmbeddedRenderer extends Renderer{
 drawHeader(s){if(s.mode!=='design')super.drawHeader(s);}
 drawFooter(s){if(s.mode!=='design')super.drawFooter(s);}
 drawSide(){}
}
export async function mountIntegratedTD({host,td,token,api,onState=()=>{},onNavigate=()=>{},sessionFactory=null}){
 if(!/^[A-Z0-9-]{4,12}$/.test(td.world))throw Error('서버 코드를 확인해 주세요.');await styles();const art=await browserArt(),root=document.createElement('section');root.className='td-root';root.setAttribute('aria-label','센터 병력과 전장 관리');
 root.innerHTML='<div class="td-stage"><canvas id="screen" aria-label="방어 설정. 타워를 누르면 사거리가 표시되고 드래그로 이동합니다."></canvas><div id="controls"></div><div id="reviewUI" hidden></div><div class="td-selection" hidden></div><div class="td-battle-feedback" role="status" hidden></div><div class="td-attack-preview" hidden></div></div><div class="td-editor-dock" hidden></div>';
 host.append(root);const canvas=root.querySelector('#screen'),controls=root.querySelector('#controls'),stage=root.querySelector('.td-stage'),dock=root.querySelector('.td-editor-dock'),selection=root.querySelector('.td-selection');
 const session=sessionFactory?sessionFactory(td,token):new IntegratedSession(td,token,api),renderer=new EmbeddedRenderer(canvas,art);session.useDOMUI=true;let destroyed=false,visible=true,last=performance.now(),raf=0,lastDockKey='',lastMode='',editingScope=null;
 const baseViewport=session.setViewport.bind(session);session.setViewport=(w,h)=>{baseViewport(w,h);if(session.mode==='design'){session.layout={mobile:w<760,header:0,footer:0,side:0,stage:{x:0,y:0,w,h}};session.clampCamera();}};
 const baseFit=session.fit.bind(session);session.fit=()=>{session.follow=false;if(session.mode!=='design')return baseFit();const v=session.layout.stage;session.camera={x:WORLD.w/2,y:WORLD.h/2,zoom:Math.min(v.w/WORLD.w,v.h/WORLD.h),initialized:true};session.uiVersion++;};
 let attackPreview;
 const owner={navigate:onNavigate,preview(type,growth,context=null){attackPreview.show(type,growth,context);},edit(scope='home'){if(session.campaign.pending||session.latest.incoming){session.notify('진행 중인 전투가 있어요. 전투가 끝난 후 배치를 바꿀 수 있어요.');return;}if(session.editor.dirty&&scope!==session.scope){session.notify('현재 배치를 저장하거나 되돌린 뒤 다른 전장을 선택하세요.');return;}if(scope!=='home')session.category='tower';if(scope!==session.scope)session.chooseScope(scope);else{session.mode='design';session.battle=null;session.replay=null;session.lastRecord=null;session.resultAt=null;}ui.close();resize();if(editingScope!==scope){editingScope=scope;if(session.layout.mobile){session.camera={x:scope==='home'?470:1210,y:scope==='home'?480:520,zoom:.58,initialized:true};session.clampCamera();}else session.fit();}lastDockKey='';refreshEditor();},refreshEditor};
 const ui=new EmbeddedUI(root.querySelector('#reviewUI'),session,art,owner),previousUpdate=session.onRemoteUpdate;session.onRemoteUpdate=()=>{previousUpdate?.();onState(session.latest);refreshEditor();};
 function resize(){if(!visible)return;const r=stage.getBoundingClientRect();if(r.width<1||r.height<1)return;renderer.resize(r.width,r.height,Math.min(2,devicePixelRatio||1));session.setViewport(r.width,r.height);}
 function refreshEditor(){
  const editing=visible&&!ui.isOpen&&session.mode==='design';dock.hidden=!editing;selection.hidden=!editing;root.dataset.editor=editing?'true':'false';root.dataset.scope=session.scope;root.dataset.selected=session.editor.selected||'';root.dataset.dirty=String(session.editor.dirty);
  if(!editing){lastDockKey='';return;}
  const support=session.scope==='home'?null:session.latest.areas.find(a=>a.id===session.scope)?.snapshot.support;const selected=session.editor.items.find(p=>p.id===session.editor.selected),stats=selected?(HERO_DEFS[selected.type]?heroStats(session.growth,selected.type):session.scope==='home'?towerStats(session.growth,selected.type):conquestTowerStats(session.growth,selected.type,support)):null;
  const key=JSON.stringify([session.category,session.scope,session.editor.tool,session.editor.selected,session.editor.dirty,session.editor.history.length,session.busy,session.growth.towerLevels,session.growth.heroes,support,session.latest.areas.filter(a=>a.mine).map(a=>a.id)]);if(key===lastDockKey)return;lastDockKey=key;
  const types=session.category==='hero'?Object.keys(HERO_DEFS).filter(id=>session.growth.heroes[id]?.star):TOWER_IDS;
  dock.innerHTML=`<div class="td-dock-top"><div><button type="button" data-td-category="tower" class="btn ${session.category==='tower'?'btn-purple':'btn-outline'}">포탑</button>${session.scope==='home'?`<button type="button" data-td-category="hero" class="btn ${session.category==='hero'?'btn-purple':'btn-outline'}">파트장</button>`:''}</div><button type="button" class="btn btn-outline" data-td-undo ${!session.editor.history.length?'disabled':''}>되돌리기</button><button type="button" class="btn btn-gold" data-td-save ${session.busy?'disabled':''}>${session.busy?'저장 중…':session.editor.dirty?'배치 저장':'저장됨'}</button></div><div class="td-tools">${types.map(type=>`<button type="button" data-td-tool="${type}" class="td-tool ${session.editor.tool===type?'selected':''}"><img src="${ui.urls[type]}" alt=""><span>${CATALOG[type].name}</span></button>`).join('')||'<p>보유한 파트장을 모집하면 배치할 수 있어요.</p>'}</div><div class="td-map-switch"><select aria-label="방어 전장 선택" data-td-scope><option value="home">내 센터 방어</option>${session.latest.areas.filter(a=>a.mine).map(a=>`<option value="${escape(a.id)}" ${session.scope===a.id?'selected':''}>${escape(a.name)} 방어</option>`).join('')}</select><button type="button" class="btn btn-outline" data-td-manage>${session.category==='hero'?'파트장 강화':'포탑 강화'}</button><button type="button" class="btn btn-purple" data-td-expedition>출정 준비</button></div>`;
  selection.innerHTML=session.scope!=='home'?(selected?`<div><strong>${escape(CATALOG[selected.type].name)} Lv.${stats.level}</strong><span>사거리 ${Math.round(stats.range)} · ${selected.type==='laser'?'관통 폭 '+Math.round(stats.beamWidth):'공격 반경 '+Math.round(stats.splash)}</span><small>피해 ${stats.baseStats.damage} + ${(stats.damage-stats.baseStats.damage).toFixed(1)} · 연사 +${((support?.towerRate||0)*100).toFixed(1)}%</small></div><button type="button" class="btn btn-outline" data-td-upgrade>강화</button>`:'<span>전면 포탑 4기 · 눌러서 사거리 확인 · 드래그로 자리 교환</span>'):selected?`<div><strong>${escape(CATALOG[selected.type].name)} Lv.${stats?.level||1}</strong><span>${stats?rangeLabel(stats):''} · 드래그해서 이동</span>${support&&stats?.kind==='tower'?`<span>기본 피해 ${Math.round(stats.damage).toLocaleString()} + 병력 지원 ${Math.round(stats.damage*support.towerDamage).toLocaleString()} · 연사 +${(support.towerRate*100).toFixed(1)}%</span>`:''}</div><button type="button" class="btn btn-outline" data-td-upgrade>${HERO_DEFS[selected.type]?'파트장 강화':'포탑 강화'}</button><button type="button" class="btn btn-outline" data-td-remove>제거</button>${selected.type==='laser'?`<span class="td-selection-guide">${session.scope==='home'?'금색 발판은 길 끝 배치 지점 · ':''}점선은 관통 방향 예시 · 실전에서는 병력을 자동 조준해요.</span>`:''}`:`<span>${session.scope==='home'?'타워를 누르면 사거리 표시 · 타워는 드래그로 이동':'센터 위아래 포탑 4기 · 중앙 파트장 2명 · 같은 종류 발판끼리 드래그 이동'}</span>`;
  resize();
 }
 attackPreview=new AttackPreview(root.querySelector('.td-attack-preview'),art);
 const interaction=new EditorInteraction(session,renderer,{changed:refreshEditor}),point=event=>{const r=canvas.getBoundingClientRect();return {x:event.clientX-r.left,y:event.clientY-r.top};};
 canvas.addEventListener('pointerdown',event=>{if(ui.isOpen)return;canvas.setPointerCapture(event.pointerId);interaction.down(event.pointerId,point(event));});
 canvas.addEventListener('pointermove',event=>{if(!ui.isOpen)interaction.move(event.pointerId,point(event));});
 canvas.addEventListener('pointerup',event=>{if(!ui.isOpen)interaction.up(event.pointerId,point(event));});canvas.addEventListener('pointercancel',()=>interaction.cancel());
 canvas.addEventListener('wheel',event=>{if(ui.isOpen)return;event.preventDefault();const p=point(event),before=renderer.toWorld(session,p.x,p.y);session.zoom(Math.exp(-event.deltaY*.0012));const after=renderer.toWorld(session,p.x,p.y);session.camera.x+=before.x-after.x;session.camera.y+=before.y-after.y;session.clampCamera();},{passive:false});
 root.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;if(b.dataset.tdTool){session.action('tool',b.dataset.tdTool);refreshEditor();}if(b.dataset.tdCategory){session.category=b.dataset.tdCategory;session.editor.selected=null;session.editor.tool=session.category==='tower'?'cannon':Object.keys(HERO_DEFS).find(id=>session.growth.heroes[id]?.star)||'frozen';refreshEditor();}if(b.hasAttribute('data-td-save')){session.save();refreshEditor();}if(b.hasAttribute('data-td-undo')){session.editor.undo();session.uiVersion++;refreshEditor();}if(b.hasAttribute('data-td-remove')&&session.scope==='home'){session.editor.remove();session.uiVersion++;refreshEditor();}if(b.hasAttribute('data-td-manage'))ui.open('management',session.category==='hero'?'hero':'tower');if(b.hasAttribute('data-td-expedition'))ui.open('expedition');if(b.hasAttribute('data-td-upgrade')){const p=session.editor.items.find(p=>p.id===session.editor.selected);if(p){ui.open('management',HERO_DEFS[p.type]?'hero':'tower');ui.selected=p.type;ui.detail=true;ui.render(false);}}});
 root.addEventListener('change',event=>{if(event.target.matches('[data-td-scope]'))owner.edit(event.target.value);});
 function setExpanded(value){session.expanded=value;root.classList.toggle('td-fullscreen',value);interaction.cancel();resize();session.fit();}
 function syncButtons(){syncCanvasControls(controls,renderer.buttons,(id,data)=>{if(id==='fit'){setExpanded(!session.expanded);}else if(id==='growth')ui.open('management');else ui.dispatchCanvasAction(id,data);refreshEditor();},{blocked:ui.isOpen});}
 const onKey=event=>{if(event.key==='Escape'&&session.expanded){event.preventDefault();setExpanded(false);}};document.addEventListener('keydown',onKey);

 const observer=new ResizeObserver(resize);observer.observe(stage);
 const baseClose=ui.close.bind(ui);ui.close=()=>{baseClose();interaction.cancel();lastDockKey='';refreshEditor();resize();};
 const baseRender=ui.render.bind(ui);ui.render=preserve=>{if(session.expanded)setExpanded(false);baseRender(preserve);refreshEditor();};
 function frame(now){if(destroyed)return;const dt=Math.min(.08,(now-last)/1000);last=now;if(visible&&!document.hidden){session.tick(dt);const mode=ui.isOpen?'ui':session.mode;if(mode!==lastMode){lastMode=mode;refreshEditor();resize();}if(!ui.isOpen){renderer.draw(session);syncButtons();}const feedback=root.querySelector('.td-battle-feedback'),message=session.toast&&session.toast.until>session.elapsed?session.toast.message:'';feedback.hidden=!message||ui.isOpen||session.resultAt!==null;if(feedback.textContent!==message)feedback.textContent=message;ui.refreshTimer(now);ui.animateProduction(now);attackPreview.tick(dt);refreshEditor();}raf=requestAnimationFrame(frame);}
 raf=requestAnimationFrame(frame);resize();if(session.campaign.pending){session.mode='battle';ui.close();}else ui.open('production');
 return {root,session,ui,get active(){return visible;},get managing(){return visible;},show(host,page='production',category='tower'){host.append(root);visible=true;session.active=true;if(page==='battle'&&session.campaign.pending)ui.close();else ui.open(page,category);resize();},hide(){attackPreview.close();if(session.expanded)setExpanded(false);visible=false;session.active=false;interaction.cancel();},update(value){if(value?.world===session.latest.world&&value.me.id===session.latest.me.id)session.apply(value);},edit:owner.edit,open(page,category){ui.open(page,category);resize();},destroy(){attackPreview.close();destroyed=true;session.active=false;cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('keydown',onKey);root.remove();}};
}
