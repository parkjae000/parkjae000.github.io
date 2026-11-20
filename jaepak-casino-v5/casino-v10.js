/* JAEPARK Casino V10: responsive chip betting, real dice and online 2–5 seat hold'em.
   Note: local single-player balances remain a separate demo ledger from the online poker bank. */
(function(){
'use strict';
const API='https://pgupfypoxhjawtonnzzk.supabase.co/functions/v1/jpc-poker';
const $t=selector=>document.querySelector(selector);
const cash=x=>Math.floor(x||0).toLocaleString('ko-KR');
const escape=x=>String(x??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const denominations=[1000,5000,10000,50000,100000];
let chipUnit=10000, chipPlaced=0, v10DiceBets={}, diceBusy=false;
let remote=null, accessToken=localStorage.getItem('jpc_v10_token')||'',requestPending=false,fetchPending=false,onlineTimer=null,clockTimer=null;
let raiseDraft=20000, lastRenderStamp='',lastEventKey='';
const dicePics=['⚀','⚁','⚂','⚃','⚄','⚅'];
const diceFaces=[[1,4,2,5,3,6],[1,4,2,5,3,6]];
const credits=()=>remote?.members?.find(x=>x.id===remote.me)?.bank||0;
const me=()=>remote?.members?.find(x=>x.id===remote.me);
const table=()=>remote?.table;
const inTable=()=>!!me()?.seat;
const playing=()=>table()?.phase==='playing';
function htmlForChips(){return denominations.map((amount,i)=>`<button type="button" draggable="true" data-chip-value="${amount}" ondragstart="v10ChipDragStart(event,${amount})" onclick="v10ChooseChip(${amount})" class="v10-chip-token v10-chip-${i} ${chipUnit===amount?'v10-selected':''}" aria-label="${cash(amount)} 칩"><span>${amount>=10000?amount/10000+'만':amount/1000+'천'}</span></button>`).join('')}
window.v10ChooseChip=function(n){if(diceBusy)return;chipUnit=n;document.querySelectorAll('.v10-chip-token').forEach(e=>e.classList.toggle('v10-selected',+e.dataset.chipValue===n));};
window.v10ChipDragStart=function(e,n){chipUnit=n;e.dataTransfer?.setData('text/plain',String(n));};
function v10ChipBet(locked=false){const val=state.chip;return `<div class="v10-blackjack-chips"><div class="v10-chip-tray" aria-label="카지노 칩 선택">${htmlForChips()}</div><div class="v10-stake-board" data-v10-bettable="1" ondragover="event.preventDefault()" ondrop="v10StakeDrop(event)" onclick="v10StakeAdd()"><span class="v10-stack">◉</span><small>칩을 테이블에 놓으세요</small><b id="v10StakeAmt">${cash(val)} 칩</b></div><button class="v10-undo" ${locked?'disabled':''} onclick="v10StakeUndo()" aria-label="베팅 취소">↶</button></div>`};
window.v10StakeDrop=function(e){e.preventDefault();const n=Number(e.dataTransfer.getData('text/plain'));if(denominations.includes(n))chipUnit=n;v10StakeAdd();};
function v10Locked(){return (state.activeGame==='blackjack'&&['dealing','playing','dealer-turn','settling'].includes(bj.phase))||(state.activeGame==='baccarat'&&bac.phase==='dealing')}
window.v10StakeAdd=function(){if(v10Locked())return;const cap=state.money;state.chip=Math.min(cap,Math.max(0,state.chip+chipUnit));renderGame();};
window.v10StakeUndo=function(){if(v10Locked())return;state.chip=1000;renderGame()};
const v10PreviousBJ=renderBlackjack,v10PreviousBaccarat=renderBaccarat;
function v10SwapBetPanel(){const bar=$t('.v9-bet-controller');if(bar)bar.outerHTML=v10ChipBet(v10Locked());}
renderBlackjack=function(){v10PreviousBJ();v10SwapBetPanel()};
renderBaccarat=function(){v10PreviousBaccarat();v10SwapBetPanel()};

// Single-choice live casino dice with physically rotating 3D cubes and chip placements.
const facesN=n=>[3,4,5,1,0,2][n-1];
function cube(id,number=1){const face=['front','back','right','left','top','bottom'];let n=0;return `<div class="v10-dice-cube" id="v10Die${id}" data-value="${number}">${face.map((f,i)=>`<div class="v10-die-face v10-face-${f}"><span class="v10-pips v10-pips-${i+1}">${Array.from({length:i+1},()=>'<i></i>').join('')}</span></div>`).join('')}</div>`}
function diceControls(sic){return `<section class="v10-dice-table" data-sic="${sic?'yes':'no'}">
 <div class="v10-dice-cage"><div class="v10-glass-shine"></div><div class="v10-dice-stage" id="v10DiceStage">${Array.from({length:sic?3:1},(_,i)=>cube(i)).join('')}</div><div class="v10-cage-rim"></div></div>
 <div class="v10-bet-zones">${(sic?['소','대','홀','짝']:['홀','짝']).map(label=>`<button class="v10-bet-zone" data-bet="${label}" ondragover="event.preventDefault()" ondrop="v10DropDice(event,'${label}')" onclick="v10PlaceDice('${label}')"><span>${label}</span><small>${sic?'삼쌍둥이 제외':'홀짝 결과'}</small><b class="v10-zone-chip">${v10DiceBets[label]?cash(v10DiceBets[label])+'칩':'칩 놓기'}</b></button>`).join('')}</div>
 <div class="v10-chip-tray v10-dice-chips">${htmlForChips()}</div>
 <div class="v10-dice-summary"><span>총 베팅 <b id="v10DiceTotal">${cash(Object.values(v10DiceBets).reduce((a,b)=>a+b,0))}칩</b></span><span>적중 시 총 지급 <b id="v10DiceEstimate">최대 ${cash(Math.max(0,...Object.values(v10DiceBets).map(x=>Math.round(x*1.95))))}칩</b></span></div>
 <div class="v10-dice-actions"><button class="v10-undo" onclick="v10ClearDice()">칩 회수</button><button class="v10-roll" id="v10DiceSpin" onclick="v10RollDice(${sic})">주사위 굴리기</button></div>
 <div class="v10-dice-result" id="v10DiceResult" aria-live="polite">${sic?'세 개의 주사위가 유리 돔 안에서 회전합니다.':'주사위가 구르고 서서히 멈춥니다.'}</div>
 </section>`}
renderDice=function(id){const sic=id==='sicbo';view(`<div class="v10-dice-page">${stageHeading(sic?'✦ SIC BO · 식보 ✦':'✦ 홀짝 다이스 ✦',id)}${diceControls(sic)}</div>`)};
window.v10PlaceDice=function(label){if(diceBusy)return;v10DiceBets[label]=(v10DiceBets[label]||0)+chipUnit;sound('chip');v10RefreshDice()};
window.v10DropDice=function(e,label){e.preventDefault();let n=Number(e.dataTransfer?.getData('text/plain'));if(denominations.includes(n))chipUnit=n;v10PlaceDice(label)};
window.v10ClearDice=function(){if(diceBusy)return;v10DiceBets={};v10RefreshDice()};
function v10RefreshDice(){document.querySelectorAll('.v10-bet-zone').forEach(z=>{const val=v10DiceBets[z.dataset.bet]||0;z.classList.toggle('v10-has-chip',val>0);const child=z.querySelector('.v10-zone-chip');if(child)child.textContent=val?cash(val)+'칩':'칩 놓기'});const total=Object.values(v10DiceBets).reduce((a,b)=>a+b,0);const t=$t('#v10DiceTotal'),e=$t('#v10DiceEstimate');if(t)t.textContent=cash(total)+'칩';if(e)e.textContent='최대 '+cash(Math.max(0,...Object.values(v10DiceBets).map(x=>Math.round(x*1.95))))+'칩'}
function v10CryptoDie(){const a=new Uint32Array(1);crypto.getRandomValues(a);return 1+(a[0]%6)}
window.v10RollDice=async function(sic){if(diceBusy)return;const bets={...v10DiceBets},total=Object.values(bets).reduce((a,b)=>a+b,0);if(!total){$t('#v10DiceResult').textContent='칩을 선택해 베팅판 위에 올려주세요.';return}if(total>state.money){$t('#v10DiceResult').textContent='보유한 칩보다 베팅액이 많습니다.';return}
 diceBusy=true;changeMoney(-total);const button=$t('#v10DiceSpin');button.disabled=true;const resultEl=$t('#v10DiceResult');resultEl.textContent='딜러가 주사위를 흔들고 있습니다…';sound('spin');let values=Array.from({length:sic?3:1},()=>v10CryptoDie());
 const d=Array.from(document.querySelectorAll('.v10-dice-cube'));const duration=2600,started=performance.now();const angles=[[0,180,90,-90,270,0],[0,180,90,-90,270,0]];
 const rotFor=v=>({1:[0,0],2:[0,180],3:[0,-90],4:[0,90],5:[90,0],6:[-90,0]})[v];
 function tick(t){const pct=Math.min(1,(t-started)/duration);const easing=1-Math.pow(1-pct,3);
 d.forEach((el,i)=>{const [rx,ry]=rotFor(values[i]);const turns=3+i*2;el.style.transform=`translateZ(0) rotateX(${turns*360*(1-easing)+rx*easing}deg) rotateY(${(turns-1)*360*(1-easing)+ry*easing}deg)`;el.style.filter=pct>.86?'drop-shadow(0 5px 7px #0007)':'drop-shadow(0 7px 12px #0009)'});
 if(pct<1){requestAnimationFrame(tick)}else finish()};requestAnimationFrame(tick);
 function finish(){let sum=values.reduce((a,b)=>a+b,0),triple=sic&&values.every(x=>x===values[0]);let win=0;for(const [k,amount] of Object.entries(bets)){
 const good=k==='홀'?sum%2===1:k==='짝'?sum%2===0:k==='소'?sum>=4&&sum<=10:k==='대'?sum>=11&&sum<=17:false;
 if(good&&!triple)win+=Math.round(amount*1.95);
 }
 changeMoney(win);const net=win-total;resultEl.innerHTML=`<strong>🎲 ${values.join(' + ')} = ${sum}</strong><br><span class="${net>0?'v10-positive':'v10-negative'}">${win?'총 지급 '+cash(win)+'칩 · ':''}순손익 ${net>=0?'+':''}${cash(net)}칩</span>${triple?' · 삼쌍둥이 제외 규칙':''}`;
 if(win){sound('win');setTicker(`${escape(state.name)}님이 주사위에서 ${cash(win)}칩 획득!`)}button.disabled=false;diceBusy=false;v10DiceBets={};v10RefreshDice();}
};

// Full server-backed Hold'em: exactly 2–5 players, turn lock, raise-to, all-in, invitation and shared messages.
async function rpc(data){const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'});const json=await response.json();if(!json.ok)throw Error(json.error||'네트워크 요청 실패');return json}
const request=async(data)=>rpc({...data,token:accessToken});
const status=x=>{const el=document.querySelector('.v10-connection');if(el)el.textContent=x};
function applyRoom(next,rerender=true){const prev=remote;remote=next;if(!next)return;state.league=next.code;const player=next.members.find(x=>x.id===next.me);if(player)state.name=player.name;lastEventKey=next.events?.[0]?.text||'';
 if(rerender)rerenderActive();}
function rerenderActive(){if(!remote||!state.league)return;if(state.activeGame==='holdem'){const field=$t('#v10RaiseAmount');const editing=field===document.activeElement;const current=field?.value;if(editing)return;renderHoldem();}else if(state.tab==='lounge'&&!state.activeGame){if(document.activeElement?.id==='v10ChatText')return;renderLounge()}else if(state.tab==='rank'&&!state.activeGame){renderRank()}}
const origLand=land;
land=function(){view(`<div class="landing v10-landing"><div class="crest">J</div><div class="small-label">LIVE PRIVATE CASINO CLUB</div><h1>재팤 카지노</h1><p class="muted">리그코드로 친구들과 진짜 홀덤 테이블에 입장하세요.</p><div class="panel" style="width:100%;max-width:350px"><div class="mini-title">리그 입장</div><input class="field" id="leagueInput" maxlength="6" placeholder="6자리 리그 코드" style="margin-bottom:10px;text-transform:uppercase"><input class="field" id="nameInput" maxlength="14" placeholder="닉네임" value="${escape(state.name)}" style="margin-bottom:12px"><button class="gold-btn full" onclick="enterLeague(false)">리그 입장</button><button class="dark-btn full" style="margin-top:10px" onclick="enterLeague(true)">새 리그 만들기</button><p id="v10JoinMessage" class="v10-join-message" role="status"></p></div><p class="muted" style="text-align:center">실시간 홀덤과 라운지는 서버 연결 · 다른 카지노 게임은 가상칩 로컬 체험판입니다.</p></div>`)};
enterLeague=async function(create){if(requestPending)return;const input=$t('#nameInput'),raw=input?.value.trim()||'';if(!raw){input?.focus();return}requestPending=true;const msg=$t('#v10JoinMessage');if(msg)msg.textContent='리그에 연결하고 있습니다…';try{const code=$t('#leagueInput')?.value.trim().toUpperCase()||'';const answer=await rpc(create?{action:'create',name:raw}:{action:'join',name:raw,code});accessToken=answer.token;localStorage.setItem('jpc_v10_token',accessToken);applyRoom(answer.room,false);render();if(onlineTimer)clearInterval(onlineTimer);onlineTimer=setInterval(poll,2200);if(!clockTimer)clockTimer=setInterval(tickTurn,550)}catch(err){if(msg)msg.textContent=err.message}finally{requestPending=false}};
async function poll(){if(fetchPending||!accessToken||!remote)return;fetchPending=true;try{const res=await request({action:'state'});const old=JSON.stringify(remote.table)+JSON.stringify(remote.chat)+JSON.stringify(remote.members)+JSON.stringify(remote.events);const fresh=JSON.stringify(res.room.table)+JSON.stringify(res.room.chat)+JSON.stringify(res.room.members)+JSON.stringify(res.room.events);applyRoom(res.room,old!==fresh)}catch(e){status('재접속 중');}finally{fetchPending=false}}
function tickTurn(){const t=table(),el=$t('#v10TurnCountdown');if(!t||!el||t.phase!=='playing'){if(el)el.textContent='';return}const remain=Math.max(0,Math.ceil(45-(Date.now()-t.turnAt)/1000));el.textContent=remain+'초';el.style.color=remain<=10?'#ff887b':'#ffdf93'}
async function send(op,payload={}){if(requestPending||!accessToken)return;requestPending=true;try{const res=await request({action:'act',op,...payload});applyRoom(res.room);return true}catch(e){const line=$t('#v10HoldemError');if(line)line.textContent=e.message;else alert(e.message);return false}finally{requestPending=false}}
window.v10Act=(op,payload)=>send(op,payload||{});
window.v10CopyCode=()=>navigator.clipboard?.writeText(remote?.code||'');
window.v10LeaveLeague=()=>{if(!confirm('리그에서 나갈까요? 현재 기기에서 계정 연결이 해제됩니다.'))return;localStorage.removeItem('jpc_v10_token');accessToken='';remote=null;state.league='';render()};
function cardsMarkup(arr,back=false){return arr.map(c=>`<span class="v10-poker-card ${!back&&(c.s==='♦'||c.s==='♥')?'red':''} ${back?'back':''}">${back?'♛':escape(c.v===14?'A':c.v===13?'K':c.v===12?'Q':c.v===11?'J':c.v)}<small>${back?'':escape(c.s)}</small></span>`).join('')}
function seatUI(m,t,idx){const isMe=m.id===remote.me,turn=t.actor===m.id,folded=t.folded.includes(m.id);const hand=t.hole[m.id]||[];const cards=hand.length?cardsMarkup(hand,false):t.phase==='playing'&&!folded?cardsMarkup([{},{ }],true):'';
 return `<div class="v10-seat v10-seat-${idx} ${turn?'v10-myturn':''} ${isMe?'v10-me':''} ${folded?'v10-folded':''}"><span class="v10-seat-dot ${m.online?'online':'away'}"></span><span class="v10-seat-person">${isMe?'🙋':'♠'}</span><b>${escape(m.name)}</b><small>${cash(m.bank)}칩</small><div class="v10-hole">${cards}</div>${turn?'<span class="v10-turn-flag">● TURN</span>':''}</div>`}
function holdActions(t){const self=me(),streetBet=t.streetBets[self.id]||0,toCall=Math.max(0,t.currentBet-streetBet),max=streetBet+self.bank,minimum=t.currentBet+t.lastRaise;
 const myTurn=t.actor===self.id&&t.phase==='playing';let amount=raiseDraft;if(amount<minimum)amount=minimum;if(amount>max)amount=max;
 const limits=`<div class="v10-raise-panel"><label for="v10RaiseAmount">레이즈 총액 · <strong>최소 ${cash(minimum)} / 최대 ${cash(max)}</strong></label><div class="v10-raise-input-row"><input id="v10RaiseAmount" inputmode="numeric" type="number" step="1000" min="${minimum}" max="${max}" value="${amount}" oninput="v10RaiseDraft(this.value)" ${!myTurn?'disabled':''}><button onclick="v10SetRaise(${minimum})" ${!myTurn?'disabled':''}>MIN</button><button onclick="v10SetRaise(${max})" ${!myTurn?'disabled':''}>ALL IN</button></div><div class="v10-poker-chips">${[1000,5000,10000,50000,100000].map((n,i)=>`<button onclick="v10RaiseIncrement(${n})" ${!myTurn?'disabled':''} class="v10-chip-token v10-chip-${i}">${n>=10000?n/10000+'만':n/1000+'천'}</button>`).join('')}</div></div>`;
 return `<div class="v10-turn-action"><div class="v10-your-turn ${myTurn?'active':''}">${myTurn?'🟢 당신의 차례입니다 · 지금 베팅하세요':t.phase==='playing'?'다른 참가자의 차례입니다':'게임 준비 또는 쇼다운'}</div>${myTurn?limits:''}<div class="v10-action-buttons"><button class="v10-fold" ${!myTurn?'disabled':''} onclick="v10PokerAction('fold')">폴드</button><button class="v10-call" ${!myTurn?'disabled':''} onclick="v10PokerAction('${toCall===0?'check':'call'}')">${toCall===0?'체크':'콜 '+cash(Math.min(toCall,self.bank))}</button><button class="v10-raise" ${!myTurn||max<=t.currentBet?'disabled':''} onclick="v10PokerAction('raise')">레이즈</button></div></div>`}
window.v10RaiseDraft=x=>{raiseDraft=Math.max(0,Number(x)||0)};
window.v10SetRaise=n=>{raiseDraft=n;const e=$t('#v10RaiseAmount');if(e)e.value=n};
window.v10RaiseIncrement=n=>{const input=$t('#v10RaiseAmount');let cur=Number(input?.value)||table()?.currentBet||0;v10SetRaise(cur+n)};
window.v10PokerAction=async kind=>{const t=table();if(!t||t.actor!==remote.me)return;let payload={kind};if(kind==='raise'){const amount=Number($t('#v10RaiseAmount')?.value||raiseDraft),my=me(),max=(t.streetBets[remote.me]||0)+my.bank;payload.amount=amount;if(amount===max)payload.kind='allin'}await send('action',payload)};
window.v10InviteModal=()=>{const online=(remote?.members||[]).filter(m=>m.online&&!m.seat&&m.id!==remote.me);showModal(`<h2>♠ 친구 초대</h2><p>온라인 멤버만 초대할 수 있어요. 초대받은 친구가 수락해야 입장합니다.</p>${online.length?online.map(m=>`<div class="member"><span class="online-dot"></span><b>${escape(m.name)}</b><button class="dark-btn" onclick="v10InviteOne('${m.id}')">초대</button></div>`).join(''):'<p>현재 초대할 수 있는 온라인 멤버가 없습니다.</p>'}<button class="gold-btn full" onclick="hideModal()">닫기</button>`)};
window.v10InviteOne=async id=>{hideModal();await send('invite',{target:id})};
window.v10AcceptInvite=async accept=>{await send(accept?'seat':'decline');if(accept)hideModal()};
function pendingInvitation(){return table()?.invites?.find(inv=>inv.to===remote.me)}
function inviteBanner(){if(inTable()||!pendingInvitation())return '';const from=remote.members.find(m=>m.id===pendingInvitation().from);return `<div class="v10-invite-banner"><b>♠ ${escape(from?.name||'리그 멤버')}님의 홀덤 초대</b><p>방 코드를 공유하지 않아도 같은 리그의 테이블에 바로 입장할 수 있어요.</p><div class="v10-action-buttons"><button class="v10-fold" onclick="v10AcceptInvite(false)">거절</button><button class="v10-raise" onclick="v10AcceptInvite(true)">수락 후 입장</button></div></div>`}
renderHoldem=function(){if(!remote){view(`${stageHeading('♠ 텍사스 홀덤 ♠','holdem')}<div class="panel">온라인 리그 연결이 필요합니다.</div>`);return}
 const t=table(),people=(t.players||[]).map(id=>remote.members.find(m=>m.id===id)).filter(Boolean),seatsNow=remote.members.filter(m=>m.seat);
 const seats=t.phase==='waiting'||t.phase==='showdown'?seatsNow:people;
 const host=remote.hostId===remote.me,isSeated=inTable(),board=t.board||[];const names=['프리플롭','플롭','턴','리버','쇼다운'];
 const stage=t.phase==='waiting'?'참가 대기':t.phase==='showdown'?'핸드 종료':({'preflop':'프리플롭','flop':'플롭','turn':'턴','river':'리버'})[t.street];
 const turnName=remote.members.find(m=>m.id===t.actor)?.name||'—';
 const chunks=`${seats.map((p,i)=>seatUI(p,t,i)).join('')}${Array.from({length:Math.max(0,5-seats.length)},(_,i)=>`<div class="v10-seat v10-seat-${seats.length+i} empty"><span>＋</span><small>빈 좌석</small></div>`).join('')}`;
 const options=isSeated?`
  ${t.phase==='playing'?holdActions(t):`<div class="v10-lobby-actions"><p>${t.phase==='showdown'?'쇼다운 완료 · 다음 핸드를 시작할 수 있습니다.':'친구를 초대하고 최소 2명이 모이면 시작하세요.'}</p><div class="v10-action-buttons"><button class="v10-call" onclick="v10InviteModal()">친구 초대</button>${host?`<button class="v10-raise" onclick="v10Act('start')" ${seatsNow.filter(m=>m.ready&&m.bank>=10000).length<2?'disabled':''}>게임 시작</button>`:`<button class="v10-raise" onclick="v10Act('ready',{ready:${!me().ready}})">${me().ready?'준비 해제':'준비 완료'}</button>`}</div><button class="v10-ghost" onclick="v10Act('leaveSeat')">테이블 나가기</button></div>`}`
 :`<div class="v10-spectator">${inviteBanner()}<b>현재 홀덤 테이블 관전 중</b><p>친구의 초대를 수락하면 최대 5명까지 참가할 수 있습니다.</p></div>`;
 view(`<div class="v10-holdem">${stageHeading('♠ 텍사스 홀덤 · LIVE ♠','holdem')}
 <div class="v10-holdem-line"><span>리그 ${escape(remote.code)} · ${seats.length}/5명</span><span class="v10-connection"><i></i> 온라인 연결</span></div>
 <div class="v10-poker-table"><div class="v10-felt-seal">♛</div>${chunks}
 <div class="v10-board">${board.map(c=>cardsMarkup([c])).join('')||'<span class="v10-board-empty">공용 카드</span>'}</div>
 <div class="v10-pot-label">🪙 POT ${cash(t.pot)}</div><div class="v10-street">${stage||'대기'} · ${escape(turnName)} <span id="v10TurnCountdown"></span></div>
 </div>${options}<div class="v10-holdem-error" id="v10HoldemError" role="status"></div>
 <div class="v10-hand-history">${(t.history||[]).slice(0,2).map(x=>`<span>${escape(x.text)}</span>`).join('')}</div>
 <small class="v10-explain">서버에서 카드·차례·칩·사이드 팟을 처리합니다. 온라인 홀덤 칩은 체험판의 다른 게임 잔액과 분리되어 있습니다.</small></div>`);
 tickTurn();};
const originalGuide=gameGuide;
gameGuide=function(id){if(id!=='holdem'&&id!=='odd'&&id!=='sicbo')return originalGuide(id);const title=id==='holdem'?'실시간 텍사스 홀덤':'카지노 주사위';showModal(`<h2>ⓘ ${title} · 규칙</h2>${id==='holdem'?'<p>2~5명이 같은 리그에서 실시간 대결합니다. 개인 카드 2장과 공용 카드 5장으로 가장 높은 족보를 만드는 게임입니다.</p><p>내 차례에는 폴드·체크/콜·레이즈를 선택할 수 있습니다. 레이즈는 총 베팅액을 직접 입력하고, MIN·ALL IN 버튼으로 빠르게 조절합니다. 올인과 사이드 팟도 서버가 계산합니다. 턴 제한은 45초입니다.</p>':'<p>주사위 칩을 터치한 후 원하는 베팅 구역에 터치하거나 끌어서 놓으세요. 베팅 합계와 적중 시 지급액을 미리 확인할 수 있습니다.</p><p>식보는 주사위 3개의 합계로 대·소·홀·짝을 맞힙니다. 세 주사위 모두 같은 눈(트리플)이면 모든 대·소·홀·짝 베팅은 미당첨입니다.</p>'}<button class="gold-btn full" onclick="hideModal()">확인</button>`)};
renderLounge=function(){if(!remote){view('<p>리그에 입장해주세요.</p>');return}
 const online=remote.members.filter(m=>m.online);view(`<div class="v10-lounge"><h2 class="section-title">💬 리그 라운지</h2><div class="v10-lounge-heading"><b>${escape(remote.code)} · ${remote.members.length}명</b><span><i class="v10-online-dot"></i> ${online.length}명 접속 중</span></div>
 <div class="v10-online-list">${remote.members.map(m=>`<div class="v10-member-chip"><i class="${m.online?'on':'off'}"></i>${escape(m.name)}</div>`).join('')}</div>
 <div class="v10-chat" id="v10Chat">${(remote.chat||[]).map(m=>`<div class="v10-chat-message ${m.playerId===remote.me?'mine':''}"><b>${escape(m.name)}</b><span>${escape(m.text)}</span></div>`).join('')||'<div class="v10-empty-chat">첫 메시지를 보내세요.</div>'}</div>
 <div class="v10-chat-form"><input id="v10ChatText" maxlength="200" placeholder="리그 채팅" onkeydown="if(event.key==='Enter')v10SendChat()"><button onclick="v10SendChat()">전송</button></div>
 </div>`);const box=$t('#v10Chat');if(box)box.scrollTop=box.scrollHeight};
window.v10SendChat=async()=>{const el=$t('#v10ChatText');const text=el?.value.trim();if(!text)return;el.value='';await send('chat',{text})};
renderRank=function(){if(!remote){view('<p>리그에 입장해주세요.</p>');return}const people=[...remote.members].sort((a,b)=>b.bank-a.bank);view(`<h2 class="section-title">🏆 리그 홀덤 순위</h2><div class="v10-rank-info">${escape(remote.code)} · 실시간 서버 기준 칩 잔액</div>${people.map((p,i)=>`<div class="v10-rank-row ${p.id===remote.me?'self':''}"><b>${i+1}위</b><span>${escape(p.name)} ${p.online?'🟢':'⚪'}</span><strong>${cash(p.bank)}칩</strong></div>`).join('')}<p class="v10-rank-note">현재 온라인 홀덤과 싱글플레이 게임은 별도 체험 지갑입니다. 전체 순자산 통합은 추가 서버 연동이 필요합니다.</p>`)};
const oldWork=sortWork;
// Existing single-player labour minigame remains local; no unearned server credit is minted from client actions.
const oldGoTab=goTab;
goTab=function(tab){oldGoTab(tab);if(remote)rerenderActive()};
function restore(){if(!accessToken){state.league='';render();return}
 rpc({action:'state',token:accessToken}).then(data=>{applyRoom(data.room,false);render();onlineTimer=setInterval(poll,2200);clockTimer=setInterval(tickTurn,550)}).catch(()=>{accessToken='';remote=null;localStorage.removeItem('jpc_v10_token');state.league='';render()})}
window.addEventListener('pagehide',()=>{clearInterval(onlineTimer);clearInterval(clockTimer)});
// Mobile drag ghost: pointerup detects bet-zone / bettable felt; click remains a fallback for accessibility.
let ghost=null,lastPointer={};document.addEventListener('pointerdown',e=>{const token=e.target.closest('.v10-chip-token');if(!token||e.pointerType==='mouse')return;chipUnit=+token.dataset.chipValue||chipUnit;const img=token.cloneNode(true);img.classList.add('v10-drag-ghost');document.body.appendChild(img);ghost=img;lastPointer={x:e.clientX,y:e.clientY,originX:e.clientX,originY:e.clientY};img.style.left=e.clientX-22+'px';img.style.top=e.clientY-22+'px';},{passive:true});
document.addEventListener('pointermove',e=>{if(!ghost)return;lastPointer.x=e.clientX;lastPointer.y=e.clientY;ghost.style.left=e.clientX-22+'px';ghost.style.top=e.clientY-22+'px'},{passive:true});
document.addEventListener('pointerup',e=>{if(!ghost)return;ghost.remove();ghost=null;if(Math.hypot(e.clientX-lastPointer.originX,e.clientY-lastPointer.originY)<20)return;const el=document.elementFromPoint(e.clientX,e.clientY),zone=el?.closest('.v10-bet-zone');if(zone)v10PlaceDice(zone.dataset.bet);else if(el?.closest('[data-v10-bettable]'))v10StakeAdd()},{passive:true});
restore();
})();