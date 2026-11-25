import {BOOST_PASSES,FORKLIFT_PASSES} from './pass-catalog.mjs?v=20261125-v245-forklift-pass';
export const PASS_ITEMS={
 auto:[['autoMine2h','2시간권'],['autoMine1d','1일권'],['autoMine2d','2일권'],['autoMine3d','3일권']],
 forklift:FORKLIFT_PASSES.map(p=>[p.key,p.label+'권']),boost:BOOST_PASSES.map(p=>[p.key,p.label+'권']),
 shield:[['shield1h','1시간권'],['shield4h','4시간권'],['shield12h','12시간권'],['shield24h','24시간권']]
};
export function passClock(until,now,permanent=false){
 if(permanent)return '영구 사용 중';
 const left=Math.max(0,Math.ceil(((Number(until)||0)-now)/1000));if(!left)return until?'기간 만료':'사용 전';
 const d=Math.floor(left/86400),hh=Math.floor(left%86400/3600),mm=Math.floor(left%3600/60),ss=left%60;
 return (d?d+'일 ':'')+[hh,mm,ss].map(n=>String(n).padStart(2,'0')).join(':');
}
export function passEffects(game,now,shieldUntil=game.shieldUntil||0){
 const inv=game.inventory||{},shop=game.shop||{},forklift=game.forklift||{};
 return [
  {id:'auto',name:'자동채굴',icon:'⚙',until:Number(shop.autoUntil)||0,permanent:!!shop.auto},
  {id:'forklift',name:'지게차',icon:'🚜',until:Number(forklift.until)||0,permanent:!!forklift.permanent},
  {id:'boost',name:'채굴 2배 가속',icon:'⚡',until:Number(shop.boostUntil)||0,permanent:false},
  {id:'shield',name:'센터 보호',icon:'🛡',until:Number(shieldUntil)||0,permanent:false}
 ].map(x=>({...x,active:x.permanent||x.until>now,clock:passClock(x.until,now,x.permanent),stock:PASS_ITEMS[x.id].reduce((sum,[key])=>sum+Math.max(0,Number(inv[key])||0),0)}));
}
export function passUse(item){
 if(PASS_ITEMS.auto.some(([id])=>id===item))return {type:'boss/pass',item};
 if(FORKLIFT_PASSES.some(p=>p.key===item))return {type:'forklift/activate',...(item==='forkliftTickets'?{}:{item})};
 if(PASS_ITEMS.boost.some(([id])=>id===item))return {type:'item/boost',item};
 if(PASS_ITEMS.shield.some(([id])=>id===item))return {type:'td/shield',item};
 throw Error('사용할 이용권을 확인해 주세요.');
}
export function timedPassLauncher(game,now){const effects=passEffects(game,now),stock=effects.reduce((s,x)=>s+x.stock,0),on=effects.some(x=>x.active);return `<button class="mine-icon pass-launcher ${on?'pass-on':''}" data-open-pass-preview aria-label="기간 이용권 · 사용 및 남은 시간 확인" title="기간 이용권 · 사용 및 남은 시간 확인"><span aria-hidden="true">⏱</span><small>이용권</small>${stock?`<b class="pass-count">${stock>99?'99+':stock}</b>`:on?'<i class="pass-on-dot" aria-hidden="true"></i>':''}</button>`;}
export function mountTimedPasses({api,getState,clock,reload,showModal,closeModal,head,toast}){
 let tab='auto',busy=false;const inv=()=>getState()?.me.game.inventory||{};
 const effects=()=>{const s=getState();return passEffects(s.me.game,clock(),s.me.shieldUntil);};
 const clockMarkup=e=>`<b data-pass-clock="${e.until}" data-pass-permanent="${e.permanent}" class="pass-clock ${e.active?'active':''}">${e.clock}</b>`;
 function open(selected=tab){if(!getState())return;tab=selected;const s=getState(),all=effects(),current=all.find(x=>x.id===tab)||all[0],game=s.me.game,stocks=inv(),shieldBusy=!!game.incomingRaid||!!game.pendingBattle||!!s.td?.incoming||!!s.td?.campaign.pending;
  showModal(`${head('⏱ 기간 이용권 미리보기')}<div class="timed-pass-dialog"><header class="pass-preview-head"><span>MY MINING PASSES</span><h3>내 이용권 · 남은 시간</h3><p>사용 중인 시간은 실시간으로 줄어들어요.</p></header><div class="pass-effect-grid">${all.map(e=>`<div class="pass-effect"><span>${e.icon} ${e.name}</span>${clockMarkup(e)}</div>`).join('')}</div><div class="pass-tabs" role="tablist" aria-label="이용권 종류">${all.map(e=>`<button type="button" role="tab" id="pass-tab-${e.id}" aria-controls="passPreviewPanel" tabindex="${e.id===tab?0:-1}" aria-selected="${e.id===tab}" data-pass-tab="${e.id}" class="${e.id===tab?'selected':''}">${e.name.replace('채굴 2배 가속','채굴 가속')}<small>보유 ${e.stock}장</small></button>`).join('')}</div><section class="pass-selected" id="passPreviewPanel" role="tabpanel" aria-labelledby="pass-tab-${tab}"><h4>${current.icon} ${current.name}</h4><div class="pass-remaining"><span>남은 시간</span>${clockMarkup(current)}</div>${current.until>clock()&&!current.permanent?`<p class="pass-end">종료 예정 · ${new Date(current.until).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})} (한국시간)</p>`:''}<div class="pass-stock-grid">${PASS_ITEMS[tab].map(([key,label])=>{const n=Math.max(0,Number(stocks[key])||0),disabled=!n||current.permanent||(tab==='shield'&&shieldBusy);return `<button class="pass-use" data-use-timed-pass="${key}" ${disabled?'disabled':''}><strong>${label}</strong><span>보유 ${n}장</span><b>${current.permanent?'영구 사용 중':tab==='shield'&&shieldBusy?'교전·출정 후 사용':'1장 사용'}</b></button>`;}).join('')}</div>${tab==='forklift'?'<button class="btn btn-outline btn-wide" data-forklift>지게차 탑승 직원 선택</button><p class="pass-help">이용권 사용 후 탑승할 직원을 선택해 주세요.</p>':tab==='shield'?'<p class="pass-help">교전·출정 중에는 보호 쉴드를 사용할 수 없어요.</p>':''}<p class="pass-help">사용한 순간부터 시작하며, 이용 중이라면 남은 시간에 추가됩니다.</p></section><p class="pass-manual-note">자동채굴 중에도 직원 합성과 다음 구역 이동은 직접 진행해야 합니다.</p></div>`);
  const modal=document.getElementById('modalContent');modal.classList.add('modal-timed-passes');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','기간 이용권 미리보기');modal.scrollTop=0;modal.querySelector(`[data-pass-tab="${tab}"]`)?.focus({preventScroll:true});
  if(busy)modal.querySelectorAll('[data-use-timed-pass]').forEach(b=>b.disabled=true);
 }
 document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-open-pass-preview')){open('auto');return;}if(b.dataset.passTab){open(b.dataset.passTab);return;}if(!b.dataset.useTimedPass||busy)return;
  busy=true;document.querySelectorAll('[data-use-timed-pass]').forEach(x=>x.disabled=true);
  try{const out=await api('/api/action','POST',{...passUse(b.dataset.useTimedPass),miningSync:true,requestId:crypto.randomUUID()});await reload(out);busy=false;if(document.querySelector('.timed-pass-dialog')&&!document.getElementById('modalOverlay').classList.contains('hidden'))open();toast(out.message||'이용권을 사용했어요. 남은 시간을 확인해 주세요.');}catch(error){toast(error.message,true);busy=false;if(document.querySelector('.timed-pass-dialog')&&!document.getElementById('modalOverlay').classList.contains('hidden'))open();}
 });
 document.addEventListener('keydown',e=>{if(!document.querySelector('.timed-pass-dialog')||document.getElementById('modalOverlay').classList.contains('hidden'))return;if(e.key==='Escape'){closeModal();return;}if(e.target.dataset.passTab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const ids=Object.keys(PASS_ITEMS),index=ids.indexOf(tab);open(ids[e.key==='Home'?0:e.key==='End'?ids.length-1:(index+(e.key==='ArrowRight'?1:ids.length-1))%ids.length]);}});
 setInterval(()=>{if(document.hidden)return;const now=clock();document.querySelectorAll('[data-pass-clock]').forEach(el=>{const end=Number(el.dataset.passClock),permanent=el.dataset.passPermanent==='true';el.textContent=passClock(end,now,permanent);el.classList.toggle('active',permanent||end>now);});const s=getState(),button=document.querySelector('[data-open-pass-preview]');if(s&&button){const on=passEffects(s.me.game,now,s.me.shieldUntil).some(x=>x.active);button.classList.toggle('pass-on',on);const dot=button.querySelector('.pass-on-dot');if(dot)dot.hidden=!on;}},1000);
 return {open};
}

