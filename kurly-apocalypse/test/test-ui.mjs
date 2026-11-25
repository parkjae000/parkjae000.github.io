import {conquestTowerStats} from './conquest-stats.mjs?v=td-ux-18';
import {SIEGE_PADS} from './siege-geometry.mjs?v=td-ux-18';
import {expeditionMarkup} from './expedition-view.mjs?v=td-ux-18';
import {CONQUEST_PLANS,splitConquestRoster,LANE_NAMES,CONQUEST_PADS,CONQUEST_ROUTES} from './conquest-geometry.mjs?v=td-ux-18';
import {ReviewUI} from './review-ui.mjs?v=td-ux-18';
import {growthKind} from './ui-model.mjs?v=td-ux-18';
import {short,FORCES,TOWER_DEFS,HERO_DEFS} from './progression.mjs?v=td-ux-18';
import {PADS,CATALOG} from './engine.mjs?v=td-ux-18';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const remaining=until=>Math.max(0,Math.ceil((until-Date.now())/60000))+'분';
export class TestUI extends ReviewUI{
 constructor(root,s,art){super(root,s,art);this.plan.routePlan='balanced';this.plan.mode='conquest';this.plan.target=s.latest.areas[0]?.id;this.s.onRemoteUpdate=()=>{if(this.isOpen&&this.root.isConnected)this.render();};}
 header(){return super.header().replace('컬리 아포칼립스 · V7','TEST · '+esc(this.s.latest.me.name)).replace('체험 데이터','서버 저장').replace(this.button('page','채굴','mining'),this.button('classic','채굴')+this.button('mining-research','채굴 연구'));}
 async request(type,data={}){if(this.requestPending)return null;const quiet=['td/upgrade','td/speed'].includes(type);this.requestPending=true;this.requestType=type;this.notice=quiet?'':'처리 중이에요…';if(this.isOpen)this.render();try{const result=await this.s.send(type,data);this.notice=quiet?'':result.message||'';if(this.isOpen)this.render();return result;}catch(e){this.notice=e.message;if(this.isOpen)this.render();return null;}finally{this.requestPending=false;this.requestType=null;if(this.isOpen)this.render();}}
 action(id,value){
  if(id==='classic'){location.href='classic.html';return;}
  if(id==='page'&&value==='mining'){location.href='classic.html';return;}
  if(id==='exp-mode'){this.plan.mode=value;this.plan.target=value==='conquest'?this.s.latest.areas[0]?.id:this.s.latest.targets[0]?.id;this.expDetail=false;this.render(false);return;}
  if(id==='target'){this.plan.target=value;this.expDetail=true;this.render(false);return;}
  if(id==='back-targets'){this.expDetail=false;this.render(false);return;}
  if(id==='route-plan'){this.plan.routePlan=value;this.render();return;}
  if(id==='range'&&this.s.scope!=='home'){const item=this.s.editor.items.find(i=>i.type===this.selected),pad=SIEGE_PADS.find(p=>p.id===item?.pad)||SIEGE_PADS[0],snapshot=this.s.latest.areas.find(a=>a.id===this.s.scope)?.snapshot;this.s.rangePreview={pad,stats:conquestTowerStats(this.s.growth,this.selected,snapshot?.support)};this.s.editor.selected=item?.id||null;this.s.mode='design';this.s.camera.x=pad.x;this.s.camera.y=pad.y;this.s.camera.zoom=.65;this.s.clampCamera();this.close();return;}
  if(id==='range'){super.action(id,value);if(this.s.scope!=='home'&&this.s.rangePreview){const item=this.s.editor.items.find(i=>i.type===this.selected),pad=SIEGE_PADS.find(p=>p.id===item?.pad)||SIEGE_PADS[4];this.s.rangePreview.pad=pad;this.s.camera.x=pad.x;this.s.camera.y=pad.y;this.s.clampCamera();}return;}
  if(id==='mining-research'){this.open('management','mine');return;}
  if(id==='test-start'){this.request('td/start',{mode:this.plan.mode==='invasion'?'raid':'conquest',target:this.plan.target,routePlan:this.plan.routePlan,ackShield:this.plan.ackShield}).then(r=>{if(r)this.close();});return;}
  if(id==='scope'){this.s.chooseScope(value);this.close();return;}
  if(id==='production-start'){this.request('td/produce',{role:value,cycles:this.productionCycles[value]});return;}
  if(id==='production-cancel'){const [role,job]=value.split('|');this.request('td/cancel',{role,job});return;}
  if(id==='production-goal-start'){this.request('td/goal',{goal:this.s.campaign.productionGoal});return;}
  if(id==='production-goal'){this.s.campaign.productionGoal=value;this.render();return;}
  if(id==='upgrade'){this.request('td/upgrade',{kind:growthKind(this.category,this.heroMode),item:this.selected,steps:this.category==='hero'?1:this.steps});return;}
  if(id==='buy'){this.request('td/buy',{item:this.shopSelected,quantity:this.shopQuantity});return;}
  if(id==='use-shield'){this.request('td/shield',{item:value});return;}
  if(id==='speed-job'){const [job,item]=value.split('|');this.request('td/speed',{job,item});return;}
  if(id==='heal-wounded'){this.request('td/heal');return;}
  if(id==='repair-fortress'){this.request('td/repair');return;}
  if(['damage-preview','scale'].includes(id))return;
  return super.action(id,value);
 }
 render(preserve=true){super.render(preserve);if(this.requestPending)this.root.querySelectorAll('[data-ui="test-start"],[data-ui="production-start"],[data-ui="production-cancel"],[data-ui="production-goal-start"],[data-ui="upgrade"],[data-ui="buy"],[data-ui="use-shield"],[data-ui="speed-job"],[data-ui="heal-wounded"],[data-ui="repair-fortress"]').forEach(b=>b.disabled=true);this.root.querySelectorAll('[data-ui="scale"],[data-ui="damage-preview"]').forEach(b=>{if(b.dataset.ui==='scale')b.closest('.ui-section')?.remove();else b.remove();});if(this.page==='management'&&!this.detail&&!['mine','force','capacity','military'].includes(this.category)){const toolbar=document.createElement('div');toolbar.className='scope-picker';toolbar.innerHTML='<span>방어 설정 선택</span>'+this.button('scope','내 센터','home',this.s.scope==='home'?'selected':'')+this.s.latest.areas.filter(a=>a.mine).map(a=>this.button('scope',esc(a.name),a.id,this.s.scope===a.id?'selected':'')).join('');this.root.querySelector('.management-tabs').append(toolbar);}}
 shop(){return super.shop().replace('모든 구매는 체험 재화만 사용합니다.','TEST 계정의 보유 박스·골드를 사용합니다.');}
 shopItemDetail(){return super.shopItemDetail().replace('체험 구매','구매하기');}
 expedition(){return expeditionMarkup(this);}

 transition(){const m=this.s.latest.migration;return `<div class="history-content ui-scroll"><h2>성장 계승·환급 내역</h2><div class="transition-summary"><b>현재 파트장·채굴·센터·방벽 성장은 그대로 계승합니다.</b><p>교체된 전투 연구 환급: ${short(m.boxes)} 박스</p><p>파트장 레벨·성급·XP·조각·교본과 남은 상품은 보존합니다. 이미 TEST에서 재투자한 강화도 유지합니다.</p><p>제거된 거점의 병력과 탐사 병력은 귀환하고, 완료된 보상은 한 번만 정산합니다.</p><p>전환 전 상태와 항목별 환급 내역은 계정에 보관됩니다.</p></div></div>`;}
 history(){const records=this.s.campaign.history;return `<div class="history-content ui-scroll" data-scroll="history"><div class="history-tools">${this.button('page','성장 전환 내역','transition')}${this.button('matrix','상성표')}</div><h2>최근 전투 ${records.length}건</h2>${records.map(r=>`<article class="history-card"><div><span>${r.mode==='conquest'?'정복전':'센터 약탈전'}</span><h3>${esc(r.targetName)}</h3><b>${r.status==='victory'?'작전 성공':r.status==='retreated'?'후퇴 완료':'공략 실패'}</b>${r.powerAtStart?`<p>공격력 ${short(r.powerAtStart.attacker)} · 방어력 ${short(r.powerAtStart.defender)}</p>`:''}<p>출격 ${short(r.amount)} · 귀환 ${short(r.returned)} · 부상 ${short(r.wounded)}</p><p>${r.mode==='conquest'?(r.status==='victory'?'소유권·생산 수입 확보 · 거점 '+(r.protectionHours||2)+'시간 보호':'소유권 유지 · 생존 병력 전원 귀환'):'박스 +'+short(r.loot.boxes)+' · 골드 +'+short(r.loot.cash)}</p>${r.summary.variant==='open-siege'?`<p>전면 공성전 · 방벽 ${r.summary.wallBrokenAt===null?'미돌파':r.summary.wallBrokenAt.toFixed(1)+'초 돌파'} · 방어 지원 ${short(r.summary.support?.count||0)}명</p>`:''}${r.summary.walls?`<div class="route-results">${r.summary.walls.map((w,i)=>`<span>${LANE_NAMES[i]} ${w.brokenAt===null?'미돌파':w.brokenAt.toFixed(1)+'초 돌파'}</span>`).join('')}</div>`:''}${r.summary.facilitiesDisabled?.map(f=>`<small>${esc(f.name)} ${f.at.toFixed(1)}초 무력화 </small>`).join('')||''}</div>${this.button('play-history','리플레이',r.id,'primary')}</article>`).join('')||'<div class="ui-empty">전투가 끝나면 방벽 돌파 시점과 전투 결과를 확인할 수 있어요.</div>'}</div>`;}

}
