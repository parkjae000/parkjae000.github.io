import {RemoteSession} from './remote-session.mjs?v=td-ux-10';
import {CompactUI} from './compact-ui.mjs?v=td-ux-10';
import {Renderer} from './renderer-v2.mjs?v=td-ux-10';
import {browserArt} from './art.mjs?v=td-ux-10';
import {EditorInteraction,editorPads} from './editor-interaction.mjs';
import {CATALOG,WORLD} from './engine.mjs?v=td-ux-10';
import {HERO_DEFS,TOWER_IDS,heroStats,towerStats,rangeLabel} from './progression.mjs';
import {GROWTH_CATEGORIES} from './ui-model.mjs';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function styles(){await Promise.all(['review-ui.css','test.css','integrated.css','compact.css'].map(file=>new Promise((resolve,reject)=>{const href=new URL(file+'?v=td-ux-10',import.meta.url).href;if([...document.styleSheets].some(s=>s.href===href))return resolve();const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.onload=resolve;link.onerror=()=>reject(Error('전장 화면을 불러오지 못했어요.'));document.head.append(link);})));}
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
 if(td.world!=='TEST')throw Error('TEST 서버에서만 새 전장을 사용할 수 있어요.');await styles();const art=await browserArt(),root=document.createElement('section');root.className='td-root';root.setAttribute('aria-label','센터 병력과 전장 관리');
 root.innerHTML='<div class="td-stage"><canvas id="screen" aria-label="방어 전장. 타워를 누르면 사거리가 표시되고 드래그로 이동합니다."></canvas><div id="controls"></div><div id="reviewUI" hidden></div><div class="td-selection" hidden></div></div><div class="td-editor-dock" hidden></div>';
 host.append(root);const canvas=root.querySelector('#screen'),controls=root.querySelector('#controls'),stage=root.querySelector('.td-stage'),dock=root.querySelector('.td-editor-dock'),selection=root.querySelector('.td-selection');
 const session=sessionFactory?sessionFactory(td,token):new IntegratedSession(td,token,api),renderer=new EmbeddedRenderer(canvas,art);session.useDOMUI=true;let destroyed=false,visible=true,last=performance.now(),raf=0,lastDockKey='',lastMode='',editingScope=null;
 const baseViewport=session.setViewport.bind(session);session.setViewport=(w,h)=>{baseViewport(w,h);if(session.mode==='design'){session.layout={mobile:w<760,header:0,footer:0,side:0,stage:{x:0,y:0,w,h}};session.clampCamera();}};
 const baseFit=session.fit.bind(session);session.fit=()=>{if(session.mode!=='design')return baseFit();const v=session.layout.stage;session.camera={x:WORLD.w/2,y:WORLD.h/2,zoom:Math.min(v.w/WORLD.w,v.h/WORLD.h),initialized:true};session.uiVersion++;};
 const owner={navigate:onNavigate,edit(scope='home'){if(session.campaign.pending||session.latest.incoming){session.notify('진행 중인 전투가 있어요. 전투가 끝난 후 배치를 바꿀 수 있어요.');return;}if(session.editor.dirty&&scope!==session.scope){session.notify('현재 배치를 저장하거나 되돌린 뒤 다른 전장을 선택하세요.');return;}if(scope!==session.scope)session.chooseScope(scope);else{session.mode='design';session.battle=null;session.replay=null;session.lastRecord=null;session.resultAt=null;}ui.close();resize();if(editingScope!==scope){editingScope=scope;if(session.layout.mobile){session.camera={x:470,y:480,zoom:.58,initialized:true};session.clampCamera();}else session.fit();}lastDockKey='';refreshEditor();},refreshEditor};
 const ui=new EmbeddedUI(root.querySelector('#reviewUI'),session,art,owner),previousUpdate=session.onRemoteUpdate;session.onRemoteUpdate=()=>{previousUpdate?.();onState(session.latest);refreshEditor();};
 function resize(){if(!visible)return;const r=stage.getBoundingClientRect();if(r.width<1||r.height<1)return;renderer.resize(r.width,r.height,Math.min(2,devicePixelRatio||1));session.setViewport(r.width,r.height);}
 function refreshEditor(){
  const editing=visible&&!ui.isOpen&&session.mode==='design';dock.hidden=!editing;selection.hidden=!editing;root.dataset.editor=editing?'true':'false';root.dataset.scope=session.scope;root.dataset.selected=session.editor.selected||'';root.dataset.dirty=String(session.editor.dirty);
  if(!editing){lastDockKey='';return;}
  const selected=session.editor.items.find(p=>p.id===session.editor.selected),stats=selected?(HERO_DEFS[selected.type]?heroStats(session.growth,selected.type):towerStats(session.growth,selected.type)):null;
  const key=JSON.stringify([session.category,session.scope,session.editor.tool,session.editor.selected,session.editor.dirty,session.editor.history.length,session.busy,session.growth.towerLevels,session.growth.heroes,session.latest.areas.filter(a=>a.mine).map(a=>a.id)]);if(key===lastDockKey)return;lastDockKey=key;
  const types=session.category==='hero'?Object.keys(HERO_DEFS).filter(id=>session.growth.heroes[id]?.star):TOWER_IDS;
  dock.innerHTML=`<div class="td-dock-top"><div><button type="button" data-td-category="tower" class="btn ${session.category==='tower'?'btn-purple':'btn-outline'}">포탑</button><button type="button" data-td-category="hero" class="btn ${session.category==='hero'?'btn-purple':'btn-outline'}">파트장</button></div><button type="button" class="btn btn-outline" data-td-undo ${!session.editor.history.length?'disabled':''}>되돌리기</button><button type="button" class="btn btn-gold" data-td-save ${session.busy?'disabled':''}>${session.busy?'저장 중…':session.editor.dirty?'배치 저장':'저장됨'}</button></div><div class="td-tools">${types.map(type=>`<button type="button" data-td-tool="${type}" class="td-tool ${session.editor.tool===type?'selected':''}"><img src="${ui.urls[type]}" alt=""><span>${CATALOG[type].name}</span></button>`).join('')||'<p>보유한 파트장을 모집하면 배치할 수 있어요.</p>'}</div><div class="td-map-switch"><select aria-label="방어 전장 선택" data-td-scope><option value="home">내 센터 방어</option>${session.latest.areas.filter(a=>a.mine).map(a=>`<option value="${escape(a.id)}" ${session.scope===a.id?'selected':''}>${escape(a.name)} 방어</option>`).join('')}</select><button type="button" class="btn btn-outline" data-td-manage>방어 강화</button><button type="button" class="btn btn-purple" data-td-expedition>출정 준비</button></div>`;
  selection.innerHTML=selected?`<div><strong>${escape(CATALOG[selected.type].name)} Lv.${stats?.level||1}</strong><span>${stats?rangeLabel(stats):''} · 드래그해서 이동</span></div><button type="button" class="btn btn-outline" data-td-upgrade>강화</button><button type="button" class="btn btn-outline" data-td-remove>제거</button>`:'<span>타워를 누르면 사거리 표시 · 타워는 드래그로 이동</span>';
  resize();
 }
 const interaction=new EditorInteraction(session,renderer,{changed:refreshEditor}),point=event=>{const r=canvas.getBoundingClientRect();return {x:event.clientX-r.left,y:event.clientY-r.top};};
 canvas.addEventListener('pointerdown',event=>{if(ui.isOpen)return;canvas.setPointerCapture(event.pointerId);interaction.down(event.pointerId,point(event));});
 canvas.addEventListener('pointermove',event=>{if(!ui.isOpen)interaction.move(event.pointerId,point(event));});
 canvas.addEventListener('pointerup',event=>{if(!ui.isOpen)interaction.up(event.pointerId,point(event));});canvas.addEventListener('pointercancel',()=>interaction.cancel());
 canvas.addEventListener('wheel',event=>{if(ui.isOpen)return;event.preventDefault();const p=point(event),before=renderer.toWorld(session,p.x,p.y);session.zoom(Math.exp(-event.deltaY*.0012));const after=renderer.toWorld(session,p.x,p.y);session.camera.x+=before.x-after.x;session.camera.y+=before.y-after.y;session.clampCamera();},{passive:false});
 root.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;if(b.dataset.tdTool){session.action('tool',b.dataset.tdTool);refreshEditor();}if(b.dataset.tdCategory){session.category=b.dataset.tdCategory;session.editor.selected=null;session.editor.tool=session.category==='tower'?'cannon':Object.keys(HERO_DEFS).find(id=>session.growth.heroes[id]?.star)||'frozen';refreshEditor();}if(b.hasAttribute('data-td-save')){session.save();refreshEditor();}if(b.hasAttribute('data-td-undo')){session.editor.undo();session.uiVersion++;refreshEditor();}if(b.hasAttribute('data-td-remove')){session.editor.remove();session.uiVersion++;refreshEditor();}if(b.hasAttribute('data-td-manage'))ui.open('management','tower');if(b.hasAttribute('data-td-expedition'))ui.open('expedition');if(b.hasAttribute('data-td-upgrade')){const p=session.editor.items.find(p=>p.id===session.editor.selected);if(p){ui.open('management',HERO_DEFS[p.type]?'hero':'tower');ui.selected=p.type;ui.detail=true;ui.render(false);}}});
 root.addEventListener('change',event=>{if(event.target.matches('[data-td-scope]'))owner.edit(event.target.value);});
 function syncButtons(){const keys=new Set();for(const [i,b] of renderer.buttons.entries()){const key=b.id+':'+i;keys.add(key);let el=controls.querySelector(`[data-control-key="${key}"]`);if(!el){el=document.createElement('button');el.dataset.controlKey=key;el.addEventListener('click',()=>{const button=el.command;if(button.id==='growth')ui.open('management');else ui.dispatchCanvasAction(button.id,button.data);refreshEditor();});controls.append(el);}el.command=b;el.textContent=b.label;el.setAttribute('aria-label',b.label);el.disabled=!!b.disabled;el.style.cssText=`left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;`;}for(const el of controls.children)if(!keys.has(el.dataset.controlKey))el.remove();}
 const observer=new ResizeObserver(resize);observer.observe(stage);
 const baseClose=ui.close.bind(ui);ui.close=()=>{baseClose();interaction.cancel();lastDockKey='';refreshEditor();resize();};
 const baseRender=ui.render.bind(ui);ui.render=preserve=>{baseRender(preserve);refreshEditor();};
 function frame(now){if(destroyed)return;const dt=Math.min(.08,(now-last)/1000);last=now;if(visible&&!document.hidden){session.tick(dt);const mode=ui.isOpen?'ui':session.mode;if(mode!==lastMode){lastMode=mode;refreshEditor();resize();}if(!ui.isOpen){renderer.draw(session);syncButtons();}ui.refreshTimer(now);ui.animateProduction(now);refreshEditor();}raf=requestAnimationFrame(frame);}
 raf=requestAnimationFrame(frame);resize();if(session.campaign.pending){session.mode='battle';ui.close();}else ui.open('production');
 return {root,session,ui,get active(){return visible;},get managing(){return visible;},show(host,page='production',category='tower'){host.append(root);visible=true;session.active=true;if(page==='battle'&&session.campaign.pending)ui.close();else ui.open(page,category);resize();},hide(){visible=false;session.active=false;interaction.cancel();},update(value){if(value?.world==='TEST'&&value.me.id===session.latest.me.id)session.apply(value);},edit:owner.edit,open(page,category){ui.open(page,category);resize();},destroy(){destroyed=true;session.active=false;cancelAnimationFrame(raf);observer.disconnect();root.remove();}};
}
