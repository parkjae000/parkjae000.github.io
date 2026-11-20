/* JAEPARK CASINO V9 | cinematic turn-based table director.
 * Offline virtual-chip visual demonstration: no genuine multiplayer or certified 3D human rig.
 * Separates game state changes, dealer movement, flying cards, and final payment.
 */
(function(){
'use strict';
const $v=s=>document.querySelector(s), $$v=s=>[...document.querySelectorAll(s)];
const V9_EASING='cubic-bezier(.14,.79,.22,1)';
const V9_TRAVEL=660;
let v9Epoch=0, v9DealerSeq=0, v9BJStake=0, v9BACStake=0;
let v9BJMessage='',v9BACMessage='';
let v9Deck=[], v9RouletteObserver=null, v9HoldemBusy=false;
const v9Sleeping=ms=>new Promise(r=>setTimeout(r,ms));
const v9Fmt=n=>Math.round(n).toLocaleString('ko-KR');
const v9HasFocus=(epoch,game)=>epoch===v9Epoch && state.activeGame===game && !!$v('.v9-cardgame');
const v9Choice=x=>{if(x!=='플레이어'&&x!=='타이'&&x!=='뱅커')return '플레이어';return x};
const v9WheelColors=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
function v9ShuffleDeck(){
 const d=[];for(const s of ['♠','♥','♣','♦'])for(let v=2;v<=14;v++)d.push({v,s});
 for(let i=d.length-1;i>0;i--){let c=new Uint32Array(1);crypto.getRandomValues(c);const j=c[0]%(i+1);[d[i],d[j]]=[d[j],d[i]]}
 return d;
}
function v9Draw(){if(v9Deck.length<9)v9Deck=v9ShuffleDeck();return v9Deck.pop()}
function v9Face(c){return `${labelCard(c)}<span class="v9-suit">${c.s}</span>`}
function v9Card(c,hidden=false){
 const red=c && (c.s==='♥'||c.s==='♦');
 return `<div class="v9-card ${red?'v9-red':''} ${hidden?'v9-hidden':''}" role="img" aria-label="${hidden?'뒷면 카드':c?labelCard(c)+c.s:'카드'}"><div class="v9-card-inner"><div class="v9-face v9-front">${c?`<span class="v9-rank">${labelCard(c)}</span><span class="v9-pip">${c.s}</span><span class="v9-corner">${v9Face(c)}</span>`:''}</div><div class="v9-face v9-back">♛<span>J CLUB</span></div></div></div>`;
}
function v9Dealer(){
 return `<div class="v9-dealer-scene"><div class="v9-dealer-glow"></div><div class="v9-room-lamp v9-lamp-left"></div><div class="v9-room-lamp v9-lamp-right"></div><div class="v9-dealer-stage" id="v9DealerStage"><img id="v9DealerSprite" alt="카드를 건네는 애니메이션 딜러" src="${DEALER_IDLE}"></div><div class="v9-deck" id="v9Deck" aria-label="딜러 카드 덱"><span>♛</span></div><div class="v9-dealer-label">LIVE TABLE · JAEPARK CLUB</div></div>`;
}
function v9Header(title,id){return `<div class="v9-table-head"><button class="v9-head-round" onclick="v9Back()" aria-label="게임 목록">‹</button><b>${title}</b><button class="v9-head-round" onclick="gameGuide('${id}')" aria-label="게임 방법">?</button></div>`}
function v9Back(){if(v9IsAnimating()){return;} v9Epoch++;backGame()}
function v9IsAnimating(){return (state.activeGame==='blackjack'&&['dealing','dealer-turn','settling'].includes(bj.phase)) || (state.activeGame==='baccarat'&&bac.phase==='dealing') || (state.activeGame==='holdem'&&v9HoldemBusy)}
function v9TableDealerCards(cards,hiddenIndex=-1){return cards.map((c,i)=>v9Card(c,i===hiddenIndex)).join('')}
function v9ChipsBet(disabled=false){
 const choices=[1000,5000,10000,50000,100000,500000,1000000];
 return `<div class="v9-bet-controller"><span>베팅</span><div class="v9-bet-amount">🪙 <strong>${v9Fmt(state.chip)}</strong></div><button ${disabled?'disabled':''} onclick="v9BetDelta(-1)" aria-label="베팅 줄이기">−</button><button ${disabled?'disabled':''} onclick="v9BetDelta(1)" aria-label="베팅 늘리기">＋</button></div>`
}
function v9BetDelta(dir){if(v9IsAnimating()||bj.phase==='playing'&&state.activeGame==='blackjack')return;const a=[1000,5000,10000,50000,100000,500000,1000000];let i=a.findIndex(v=>v===state.chip);state.chip=a[Math.max(0,Math.min(a.length-1,(i<0?2:i)+dir))];renderGame()}
function v9Status(message='',kind='normal'){const e=$v('#v9TurnStatus');if(e){e.textContent=message;e.dataset.kind=kind}}
function v9Controls(actions){const t=$v('#v9ControlActions');if(t)t.innerHTML=actions}
function v9UpdateCount(target,count,hide=false){const c=$v(`[data-v9-count="${target}"]`);if(c)c.textContent=hide?'?':String(count)}
function v9CardTrack(){const root=$v('.v9-cardgame');if(root)root.style.setProperty('--v9-active','1')}
function v9SoundDeal(){
 if(!state.sound)return;
 try{
  const c=audioCtx ||=new(window.AudioContext||window.webkitAudioContext)();if(c.state==='suspended')c.resume();
  const frames=Math.floor(c.sampleRate*.22),buffer=c.createBuffer(1,frames,c.sampleRate),a=buffer.getChannelData(0);
  for(let i=0;i<frames;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/frames,.7);
  const src=c.createBufferSource();src.buffer=buffer;
  const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1600;f.Q.value=.56;
  const g=c.createGain(),t=c.currentTime;g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(.045,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.21);
  src.connect(f);f.connect(g);g.connect(c.destination);src.start(t);src.stop(t+.22)
 }catch(_){}
}
function v9MoveDealer(){
 const e=$v('#v9DealerSprite'),holder=$v('#v9DealerStage');if(!e)return;
 const seq=++v9DealerSeq;
 e.src=DEALER_IDLE; // reset the 12-frame animated WebP to its first frame
 void e.offsetWidth;
 requestAnimationFrame(()=>{if(!e.isConnected||seq!==v9DealerSeq)return;e.src=DEALER_MOTION;e.classList.remove('v9-reaching');void e.offsetWidth;e.classList.add('v9-reaching')});
 setTimeout(()=>{if(e.isConnected&&seq===v9DealerSeq){e.src=DEALER_IDLE;e.classList.remove('v9-reaching')}},1010);
 holder?.classList.remove('v9-active-hand');void holder?.offsetWidth;holder?.classList.add('v9-active-hand');
}
async function v9DealCard(targetId,card,faceDown,epoch,game){
 if(!v9HasFocus(epoch,game))return false;
 const target=$v('#'+targetId);if(!target)return false;
 v9MoveDealer();v9SoundDeal();
 const child=document.createElement('div');child.innerHTML=v9Card(card,faceDown);
 const dest=child.firstElementChild;dest.classList.add('v9-pending');target.append(dest);
 const src=$v('#v9Deck');const from=(src||target).getBoundingClientRect(),to=dest.getBoundingClientRect();
 const fly=document.createElement('div');fly.className='v9-flying-card';fly.innerHTML='<div class="v9-flying-crest">♛</div>';
 fly.style.left=(from.left+from.width/2-22)+'px';fly.style.top=(from.top+from.height/2-31)+'px';
 document.body.append(fly);
 const dx=to.left+to.width/2-(from.left+from.width/2),dy=to.top+to.height/2-(from.top+from.height/2);
 let anim;try{anim=fly.animate([
   {transform:'translate3d(0,0,0) rotate(-18deg) rotateY(180deg) scale(.72)',opacity:0.92,filter:'blur(0px)'},
   {offset:.38,transform:`translate3d(${dx*.46}px,${dy*.28-33}px,0) rotate(12deg) rotateY(175deg) scale(1.04)`,opacity:1},
   {offset:.76,transform:`translate3d(${dx*.87}px,${dy*.86-13}px,0) rotate(-4deg) rotateY(${faceDown?180:45}deg) scale(1.04)`,opacity:1},
   {transform:`translate3d(${dx}px,${dy}px,0) rotate(0deg) rotateY(${faceDown?180:0}deg) scale(1)`,opacity:1,filter:'blur(0px)'}
 ],{duration:V9_TRAVEL,easing:V9_EASING,fill:'forwards'});
 await Promise.race([anim.finished.catch(()=>{}),v9Sleeping(V9_TRAVEL+220)]);
 }catch(_){await v9Sleeping(V9_TRAVEL)}
 fly.remove();if(!v9HasFocus(epoch,game))return false;
 dest.classList.remove('v9-pending');dest.classList.add('v9-landed');
 try{sound('chip')}catch(_){ }
 await v9Sleeping(145);
 return v9HasFocus(epoch,game);
}
function v9BlackjackUI(){
 const locked=v9IsAnimating(),playing=bj.phase==='playing';
 const finished=bj.phase==='over';
 const hole=playing||bj.phase==='dealing'||bj.phase==='dealer-turn-hidden';
 return `<div class="v9-cardgame v9-blackjack">${v9Header('♠ BLACKJACK 21 ♠','blackjack')}
 <div class="v9-casino-arena">${v9Dealer()}
  <div class="v9-felt"><div class="v9-felt-crest">J</div><div class="v9-trim"></div></div><div class="v9-chip-pile v9-chips-left"><i></i><i></i><i></i></div><div class="v9-chip-pile v9-chips-right"><i></i><i></i><i></i></div>
  <div class="v9-hand v9-hand-dealer"><div class="v9-hand-label">딜러 <span data-v9-count="dealer">${!bj.dealer.length?'-':hole?'?':valueHand(bj.dealer)}</span></div><div class="v9-cards" id="v9BJDealer">${v9TableDealerCards(bj.dealer,hole?1:-1)}</div></div>
  <div class="v9-center-mark" id="v9MiddleMark">♛ BLACKJACK PAYS 3:2 ♛</div>
  <div class="v9-hand v9-hand-player"><div class="v9-hand-label">나의 카드 <span data-v9-count="player">${bj.player.length?valueHand(bj.player):'READY'}</span></div><div class="v9-cards" id="v9BJPlayer">${v9TableDealerCards(bj.player)}</div></div>
  <div class="v9-prize-anchor" id="v9PrizeAnchor"></div>
 </div>
 <div class="v9-card-controls">${v9ChipsBet(locked||playing)}<div class="v9-turn-status" id="v9TurnStatus">${v9BJMessage||'딜러가 카드를 한 장씩 나눠줍니다'}</div>
 <div class="v9-actions" id="v9ControlActions">${locked?`<button class="v9-action-muted" disabled>♠ 카드 배분 중...</button>`:playing?`<button class="v9-action-gold" onclick="bjHit()">한 장 더 · HIT</button><button class="v9-action-red" onclick="bjStand()">멈추기 · STAND</button>`:`<button class="v9-action-gold" onclick="bjStart()">${finished?'다음 게임':'카드 받기 · DEAL'}</button>`}</div></div>
 </div>`;
}
renderBlackjack=function(){view(v9BlackjackUI())};
async function v9BjEnd(epoch,title,gross){
 if(!v9HasFocus(epoch,'blackjack'))return;
 bj.phase='over';if(gross)changeMoney(gross);
 v9BJMessage=title;
 v9UpdateCount('dealer',valueHand(bj.dealer));v9Status(title,gross?'win':'loss');
 v9Controls('<button class="v9-action-gold" onclick="bjStart()">다음 판 · DEAL</button>');
 v9AnimatePrize(title,gross,v9BJStake,epoch);
 if(gross>v9BJStake){sound('win');setTicker(`${state.name}님이 블랙잭에서 ${v9Fmt(gross)}칩 획득!`)}
}
bjStart=async function(){
 if(v9IsAnimating()||bj.phase==='playing')return;
 if(state.money<state.chip){v9Status('칩이 부족합니다. 근무 탭에서 골드를 모아주세요.','loss');return}
 const epoch=++v9Epoch;v9Deck=v9ShuffleDeck();v9BJStake=state.chip;
 bj={dealer:[],player:[],phase:'dealing'};v9BJMessage='딜러가 카드를 나눠주고 있습니다…';changeMoney(-v9BJStake);renderBlackjack();
 const plan=[['v9BJPlayer','player',false],['v9BJDealer','dealer',false],['v9BJPlayer','player',false],['v9BJDealer','dealer',true]];
 for(let i=0;i<plan.length;i++){
  if(!v9HasFocus(epoch,'blackjack'))return;
  const [id,hand,down]=plan[i],card=v9Draw();
  v9Status(`${i+1} / 4 · ${hand==='dealer'?'딜러':'플레이어'}에게 카드 배분 중…`);
  const done=await v9DealCard(id,card,down,epoch,'blackjack');if(!done)return;
  bj[hand].push(card);
  if(hand==='player')v9UpdateCount('player',valueHand(bj.player));
  if(hand==='dealer')v9UpdateCount('dealer',valueHand([bj.dealer[0]]),true);
 }
 if(!v9HasFocus(epoch,'blackjack'))return;
 const p=valueHand(bj.player),d=valueHand(bj.dealer);
 if(p===21 || d===21){
  bj.phase='dealer-turn';v9Status('BLACKJACK · 히든 카드 공개');
  await v9RevealHole(epoch);
  if(!v9HasFocus(epoch,'blackjack'))return;
  const gross=p===21&&d===21?v9BJStake:p===21?Math.floor(v9BJStake*2.5):0;
  await v9BjEnd(epoch,p===21&&d===21?'블랙잭 · 무승부':p===21?'NATURAL BLACKJACK!':'딜러 블랙잭',gross);
  return;
 }
 bj.phase='playing';v9BJMessage='히트 또는 스탠드를 선택하세요';v9Status(v9BJMessage);
 v9Controls('<button class="v9-action-gold" onclick="bjHit()">한 장 더 · HIT</button><button class="v9-action-red" onclick="bjStand()">멈추기 · STAND</button>');
};
async function v9RevealHole(epoch){
 if(!v9HasFocus(epoch,'blackjack'))return false;
 const hole=$v('#v9BJDealer .v9-card:nth-child(2)');if(hole){hole.classList.remove('v9-hidden');sound('chip')}
 await v9Sleeping(700);
 if(!v9HasFocus(epoch,'blackjack'))return false;
 v9UpdateCount('dealer',valueHand(bj.dealer));return true;
}
bjHit=async function(){
 if(bj.phase!=='playing')return;
 const epoch=++v9Epoch;bj.phase='dealing';v9Controls('<button class="v9-action-muted" disabled>♠ 히트 카드 이동 중...</button>');v9Status('플레이어에게 카드 한 장을 건넵니다…');
 const card=v9Draw(),ok=await v9DealCard('v9BJPlayer',card,false,epoch,'blackjack');if(!ok)return;
 bj.player.push(card);const p=valueHand(bj.player);v9UpdateCount('player',p);
 if(p>21){bj.phase='dealer-turn';v9Status('BUST · 21을 초과했습니다.');await v9RevealHole(epoch);await v9BjEnd(epoch,'BUST · 딜러 승리',0);return}
 if(p===21){bj.phase='playing';return bjStand()}
 bj.phase='playing';v9Status('카드를 받았습니다. 히트 또는 스탠드를 선택하세요');
 v9Controls('<button class="v9-action-gold" onclick="bjHit()">한 장 더 · HIT</button><button class="v9-action-red" onclick="bjStand()">멈추기 · STAND</button>');
};
bjStand=async function(){
 if(bj.phase!=='playing')return;
 const epoch=++v9Epoch;bj.phase='dealer-turn';v9Controls('<button class="v9-action-muted" disabled>딜러 차례 · 카드 공개 중…</button>');v9Status('STAND · 딜러의 숨긴 카드를 뒤집습니다…');
 if(!await v9RevealHole(epoch))return;
 while(valueHand(bj.dealer)<17){
  v9Status('딜러가 17점까지 한 장씩 카드를 받습니다…');
  await v9Sleeping(340);if(!v9HasFocus(epoch,'blackjack'))return;
  const card=v9Draw(),ok=await v9DealCard('v9BJDealer',card,false,epoch,'blackjack');if(!ok)return;
  bj.dealer.push(card);v9UpdateCount('dealer',valueHand(bj.dealer));
  await v9Sleeping(280);
 }
 if(!v9HasFocus(epoch,'blackjack'))return;
 const p=valueHand(bj.player),d=valueHand(bj.dealer),gross=d>21||p>d?v9BJStake*2:p===d?v9BJStake:0;
 await v9BjEnd(epoch,d>21?'딜러 BUST · 승리!':gross===v9BJStake?'PUSH · 무승부':gross?'WIN · 플레이어 승리!':'딜러 승리',gross);
};

function v9BaccaratUI(){
 const locked=bac.phase==='dealing';const active=v9Choice(state.selected);
 return `<div class="v9-cardgame v9-baccarat">${v9Header('♦ ROYAL BACCARAT ♦','baccarat')}
 <div class="v9-casino-arena">${v9Dealer()}
  <div class="v9-felt"><div class="v9-felt-crest">J</div></div><div class="v9-chip-pile v9-chips-left"><i></i><i></i><i></i></div><div class="v9-chip-pile v9-chips-right"><i></i><i></i><i></i></div>
  <div class="v9-baccarat-hands"><div class="v9-hand v9-baccarat-player"><div class="v9-hand-label">PLAYER <span data-v9-count="p">${bac.p.length?v9Punto(bac.p):'-'}</span></div><div class="v9-cards" id="v9BACPlayer">${v9TableDealerCards(bac.p)}</div></div>
  <div class="v9-hand v9-baccarat-banker"><div class="v9-hand-label">BANKER <span data-v9-count="b">${bac.b.length?v9Punto(bac.b):'-'}</span></div><div class="v9-cards" id="v9BACBanker">${v9TableDealerCards(bac.b)}</div></div></div>
  <div class="v9-center-mark v9-bac-crest">✦ PLAYER · BANKER · TIE ✦</div><div class="v9-prize-anchor" id="v9PrizeAnchor"></div>
 </div>
 <div class="v9-card-controls"><div class="v9-bac-choices">${['플레이어','타이','뱅커'].map((x,i)=>`<button class="v9-bac-choice v9-bac-${i} ${active===x?'selected':''}" ${locked?'disabled':''} onclick="v9ChooseBAC('${x}')">${x}</button>`).join('')}</div>
 ${v9ChipsBet(locked)}<div class="v9-turn-status" id="v9TurnStatus">${v9BACMessage||'베팅 영역을 고른 뒤 카드를 배분하세요'}</div>
 <div class="v9-actions" id="v9ControlActions"><button class="v9-action-gold" ${locked?'disabled':''} onclick="dealBaccarat()">${locked?'딜러가 카드를 배분 중…':'✦ 베팅하고 카드 받기 ✦'}</button></div></div>
 </div>`;
}
function v9Punto(cards){return cards.reduce((n,c)=>n+(c.v>=10?0:c.v),0)%10}
function v9ChooseBAC(x){if(bac.phase==='dealing')return;state.selected=x;renderBaccarat()}
renderBaccarat=function(){view(v9BaccaratUI())};
dealBaccarat=async function(){
 if(bac.phase==='dealing')return;
 if(state.money<state.chip){v9Status('베팅할 칩이 부족합니다.','loss');return}
 const epoch=++v9Epoch;v9Deck=v9ShuffleDeck();v9BACStake=state.chip;state.selected=v9Choice(state.selected);
 bac={p:[],b:[],result:'',phase:'dealing'};v9BACMessage='딜러가 플레이어와 뱅커에 교대로 카드를 배분합니다…';changeMoney(-v9BACStake);renderBaccarat();
 const plan=[['p','v9BACPlayer'],['b','v9BACBanker'],['p','v9BACPlayer'],['b','v9BACBanker']];
 for(let i=0;i<plan.length;i++){
   if(!v9HasFocus(epoch,'baccarat'))return;
   v9Status(`${i+1} / 4 · ${plan[i][0]==='p'?'플레이어':'뱅커'} 카드 배분 중…`);
   const c=v9Draw(),ok=await v9DealCard(plan[i][1],c,false,epoch,'baccarat');if(!ok)return;
   bac[plan[i][0]].push(c);v9UpdateCount(plan[i][0],v9Punto(bac[plan[i][0]]));
 }
 const p2=v9Punto(bac.p),b2=v9Punto(bac.b);let third=null;
 if(p2<8&&b2<8){
   if(p2<=5){
     v9Status('플레이어의 세 번째 카드를 배분합니다…');await v9Sleeping(250);
     third=v9Draw();if(!await v9DealCard('v9BACPlayer',third,false,epoch,'baccarat'))return;
     bac.p.push(third);v9UpdateCount('p',v9Punto(bac.p));
   }
   const v=third?(third.v>=10?0:third.v):null;
   const bankerDraw=third===null?b2<=5:b2<=2 || (b2===3&&v!==8) || (b2===4&&v>=2&&v<=7) || (b2===5&&v>=4&&v<=7) || (b2===6&&v>=6&&v<=7);
   if(bankerDraw){
     v9Status('뱅커가 규칙에 따라 세 번째 카드를 받습니다…');await v9Sleeping(300);
     const c=v9Draw();if(!await v9DealCard('v9BACBanker',c,false,epoch,'baccarat'))return;
     bac.b.push(c);v9UpdateCount('b',v9Punto(bac.b));
   }
 }
 if(!v9HasFocus(epoch,'baccarat'))return;
 await v9Sleeping(550);
 const p=v9Punto(bac.p),b=v9Punto(bac.b),win=p===b?'타이':p>b?'플레이어':'뱅커';
 let gross=0;
 if(state.selected===win){gross=v9BACStake*(win==='타이'?9:win==='뱅커'?1.95:2)}
 else if(win==='타이'&&state.selected!=='타이'){gross=v9BACStake}
 gross=Math.round(gross);if(gross)changeMoney(gross);
 bac.phase='over';bac.result=`${win} 승리 (${p}:${b})`;
 const msg=`${win} ${p}:${b} · ${gross>v9BACStake?'베팅 적중!':gross?'무승부 환불':'미당첨'}`;
 v9BACMessage=msg;v9Status(msg,gross>v9BACStake?'win':gross?'normal':'loss');
 v9Controls('<button class="v9-action-gold" onclick="dealBaccarat()">다음 판 · DEAL</button>');
 v9AnimatePrize(msg,gross,v9BACStake,epoch);
 if(gross>v9BACStake){sound('win');setTicker(`${state.name}님이 바카라에서 ${v9Fmt(gross)}칩 획득!`)}
};

function v9AnimatePrize(title,gross,stake,epoch){
 const root=$v('#v9PrizeAnchor');if(!root)return;
 if(gross<=stake){return;} // Keep the cards visible on losses and pushes; status line shows settlement.
 root.replaceChildren();const el=document.createElement('div');el.className='v9-win-float '+(gross>stake?'v9-positive':gross?'v9-push':'v9-lost');
 const label=gross>stake?'WINNER!':gross?'PUSH':'NO WIN';
 el.innerHTML=`<div class="v9-win-title">${label}</div><div class="v9-win-money">+<span class="v9-win-counter">0</span> <small>칩 지급</small></div><div class="v9-win-net">순손익 <strong>${gross-stake>=0?'+':''}${v9Fmt(gross-stake)}</strong> 칩</div><button class="v9-win-skip" type="button">건너뛰기 ›</button>`;
 root.append(el);const start=performance.now(),duration=gross>stake?1500:540;
 let complete=false,handle=0;const finish=()=>{if(complete)return;complete=true;cancelAnimationFrame(handle);if(el.isConnected){el.querySelector('.v9-win-counter').textContent=v9Fmt(gross);el.classList.add('v9-prize-complete');setTimeout(()=>el.isConnected&&el.remove(),850)}};
 el.querySelector('.v9-win-skip').addEventListener('click',finish);
 const step=now=>{if(!el.isConnected)return;if(epoch!==v9Epoch){el.remove();return}const t=Math.min(1,(now-start)/duration),ease=1-(1-t)**2.45;el.querySelector('.v9-win-counter').textContent=v9Fmt(gross*ease);if(t<1)handle=requestAnimationFrame(step);else finish()};handle=requestAnimationFrame(step);
}

/* Roulette result: never obscure the spin. The prominent marker remains on the
   table after settlement, with the winning pocket color and gross/net payout. */
const v8RenderRoulette=renderRoulette, v8SpinRoulette=spinRoulette;
let v9RouletteWatch=null;
function v9ShowWheelResult(){
 const stage=$v('.r-scene');if(!stage)return;
 const status=$v('#wheelStatus'),text=$v('#result')?.textContent||'';
 const m=status?.textContent.match(/당첨 번호\s*(\d+)/)||text.match(/(?:결과\s*)?(\d+)번/);if(!m)return;
 const n=Number(m[1]);
 const color=n===0?'green':v9WheelColors.has(n)?'red':'black';
 const txt=$v('#result')?.textContent||'';
 const pay=(txt.match(/지급\s*([\d,]+)칩/)||[])[1]||'0';
 const net=(txt.match(/순손익\s*([+-]?[\d,]+)칩/)||[])[1]||'0';
 let badge=stage.querySelector('.v9-roulette-win-panel');if(!badge){badge=document.createElement('div');badge.className='v9-roulette-win-panel';stage.append(badge)}
 badge.innerHTML=`<div class="v9-win-label">WINNING NUMBER</div><strong class="v9-win-ball v9-color-${color}">${n}</strong><span class="v9-win-details">지급 ${pay}칩<br>순손익 ${net}칩</span>`;
 $v(`[data-roulette-choice="${n}"]`)?.classList.add('v9-roulette-hit');
}
renderRoulette=function(){
 v8RenderRoulette();v9RouletteWatch?.disconnect();
 const status=$v('#wheelStatus'),result=$v('#result');if(status||result){v9RouletteWatch=new MutationObserver(()=>v9ShowWheelResult());for(const el of [status,result])if(el)v9RouletteWatch.observe(el,{childList:true,subtree:true,characterData:true});v9ShowWheelResult()}
};
spinRoulette=function(){
 $v('.v9-roulette-win-panel')?.remove();$$v('.v9-roulette-hit').forEach(x=>x.classList.remove('v9-roulette-hit'));
 return v8SpinRoulette();
};

/* Poker remains a local visual simulation, not genuine multiplayer.
   Keep 5 seats while making each community card reveal visible in order. */
const v8RenderHoldem=renderHoldem, v8StartPoker=startPoker, v8PokerAct=pokerAct;
renderHoldem=function(){v8RenderHoldem();const table=$v('.poker-table');if(table){table.classList.add('v9-poker-scene');table.insertAdjacentHTML('beforeend','<div class="v9-poker-deck">♛</div>')}if(v9HoldemBusy){$$v('.view[data-screen="play-holdem"] button').forEach(b=>{if(/폴드|콜|레이즈|테이블 시작/.test(b.textContent))b.disabled=true})}};
startPoker=async function(){
 if(v9HoldemBusy||state.money<10000)return;
 v9HoldemBusy=true;v9Epoch++;v9Deck=v9ShuffleDeck();const e=v9Epoch;
 poker={phase:'active',round:0,players:poker.players,private:[],board:[],pot:poker.players*10000,bets:0};changeMoney(-10000);renderHoldem();
 for(let i=0;i<2;i++){
  await v9Sleeping(290);if(state.activeGame!=='holdem'||e!==v9Epoch){v9HoldemBusy=false;return}
  const card=v9Draw();poker.private.push(card);const hand=$v('.my-cards');if(hand){hand.innerHTML=poker.private.map(c=>cardHtml(c)).join('');hand.lastElementChild?.animate([{transform:'translateY(-100px) rotateY(145deg) scale(.6)',opacity:.2},{transform:'translateY(0) rotateY(0deg) scale(1)',opacity:1}],{duration:650,easing:V9_EASING})}sound('chip')
 }
 v9HoldemBusy=false;renderHoldem();
};
pokerAct=async function(action){
 if(v9HoldemBusy)return;
 if(action==='fold'){return v8PokerAct(action)};
 if(state.money<state.betChoice){alert('칩 부족');return}
 v9HoldemBusy=true;const e=++v9Epoch;changeMoney(-state.betChoice);poker.pot+=state.betChoice*poker.players;
 const count=poker.round===0?3:poker.round===1||poker.round===2?1:0;
 poker.round++;renderHoldem();
 for(let i=0;i<count;i++){
  await v9Sleeping(440);if(state.activeGame!=='holdem'||e!==v9Epoch){v9HoldemBusy=false;return}
  const card=v9Draw();poker.board.push(card);const hand=$v('.community');if(hand){hand.innerHTML=poker.board.map(c=>cardHtml(c)).join('');hand.lastElementChild?.animate([{transform:'translateY(-95px) rotateY(150deg) scale(.8)',opacity:.2},{transform:'translateY(0) rotateY(0deg) scale(1)',opacity:1}],{duration:620,easing:V9_EASING})}sound('chip')
 }
 if(poker.round>=4){
  const win=Math.random()<.3;if(win){changeMoney(poker.pot);setTicker(`${state.name}님이 홀덤에서 ${v9Fmt(poker.pot)}칩 획득!`);sound('win')}
  v9HoldemBusy=false;
  showModal(`<h2>쇼다운 · 시각 데모</h2><p>${win?'🎉 승리!':'이번 판은 상대가 승리했어요.'}</p><p>팟 ${v9Fmt(poker.pot)}칩</p><button class="gold-btn full" onclick="hideModal();poker.phase='waiting';renderHoldem()">다음 판</button>`);
 }else{v9HoldemBusy=false;renderHoldem()}
};
// When switching to a different game while a sequence is in progress, mark it stale.
const v9BaseBack=backGame;
backGame=function(){v9Epoch++;v9HoldemBusy=false;return v9BaseBack()};
const v9BaseGo=goTab;
goTab=function(tab){v9Epoch++;v9HoldemBusy=false;return v9BaseGo(tab)};
})();