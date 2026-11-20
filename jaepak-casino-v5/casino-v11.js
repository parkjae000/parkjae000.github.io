/* JAEPARK Casino V11 — interaction and settlement QA release.
   Does not modify shared server ledgers, odds, or game RNG. */
(function(){
'use strict';
const Q=s=>document.querySelector(s), QQ=s=>[...document.querySelectorAll(s)];
const fmt=n=>Math.floor(Number(n)||0).toLocaleString('ko-KR');
const denoms=[1000,5000,10000,50000,100000,500000];
let chosenChip=10000, contributions=[], noticeTimer=0;
let diceRun=null,diceLastGame=null,diceEpoch=0;
const dieSides={front:1,back:6,right:3,left:4,top:2,bottom:5};
const dieRotation={1:[0,0],2:[-90,0],3:[0,-90],4:[0,90],5:[90,0],6:[0,180]};
const cardReady=()=>state.activeGame==='blackjack'||state.activeGame==='baccarat';
const locked=()=>state.activeGame==='blackjack' ? ['playing','dealing','dealer-turn','settling'].includes(bj.phase) : state.activeGame==='baccarat' ? bac.phase==='dealing':false;
function notice(msg){let el=Q('#v11Toast');if(!el){el=document.createElement('div');el.id='v11Toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=msg;el.classList.add('on');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el?.classList.remove('on'),2900)}
const nativeBack=backGame, nativePlay=playGame, nativeTab=goTab;
function activeHand(){return state.activeGame==='blackjack' ? ['dealing','playing','dealer-turn','settling'].includes(bj.phase) : state.activeGame==='baccarat' ? bac.phase==='dealing':false}
function leaveBlocked(){if(activeHand()){notice(bj.phase==='playing'&&state.activeGame==='blackjack'?'진행 중인 블랙잭입니다. 스탠드로 정산 후 이동하거나 게임을 포기하세요.':'딜러가 카드를 배분하고 있습니다. 잠시 후 이동할 수 있어요.');return true}
 if(diceRun?.busy&&['odd','sicbo'].includes(state.activeGame)){notice('주사위가 굴러가는 중입니다. 결과 정산 후 이동할 수 있어요.');return true}return false}
function leaveOk(){if(leaveBlocked())return false;if(cardReady()&&state.chip===0)state.chip=10000;return true}
backGame=function(){if(!leaveOk())return;nativeBack()};
goTab=function(t){if(!leaveOk())return;nativeTab(t)};
window.v9Back=function(){if(!leaveOk()){if(state.activeGame==='blackjack'&&bj.phase==='playing'){
 showModal(`<h2>♠ 진행 중인 블랙잭</h2><p>현재 판을 포기하고 게임 선택으로 나갈까요? 이미 건 판돈은 돌려받지 못합니다.</p><div class="v11-dialog-actions"><button class="dark-btn" onclick="hideModal()">계속하기</button><button class="gold-btn" onclick="v11ForfeitBJ()">판 포기하고 나가기</button></div>`)}return}nativeBack()};
window.v11ForfeitBJ=function(){if(state.activeGame!=='blackjack'||bj.phase!=='playing')return;bj.phase='over';hideModal();nativeBack()};
// Previous card-game buttons referenced private IIFE methods from inline handlers.
// Expose a safe global choice function, with the same game-state preconditions.
window.v9ChooseBAC=function(side){if(state.activeGame!=='baccarat'||bac.phase==='dealing')return;if(!['플레이어','타이','뱅커'].includes(side))return;state.selected=side;renderBaccarat()};

const priorPlay=nativePlay;
playGame=function(){const game=games[state.gameIndex]?.id;if(game==='blackjack'||game==='baccarat'){
 // Entering a new table requires the user to physically place a chip.
 if(game==='blackjack'){if(['over','bet'].includes(bj.phase)){bj={dealer:[],player:[],phase:'bet'}}}
 if(game==='baccarat'){if(bac.phase!=='dealing')bac={p:[],b:[],result:'',phase:'bet'};state.selected='플레이어'}
 contributions=[];state.chip=0;chosenChip=10000;
 }else if(state.chip<1000){state.chip=10000}
 return priorPlay();};
const prevBJ=renderBlackjack,prevBAC=renderBaccarat;
function chipMarkup(n){return `<button type="button" class="v11-chip v11-chip-${denoms.indexOf(n)} ${chosenChip===n?'active':''}" draggable="true" data-v11-chip="${n}" ondragstart="v11DragStart(event,${n})" onclick="v11PlaceCardChip(${n})" aria-label="${fmt(n)}칩 놓기"><b>${n<10000?n/1000+'천':n/10000+'만'}</b></button>`}
function cardBetPanel(){const value=Math.max(0,state.chip);const disabled=locked(),canModify=!disabled;
 return `<section class="v11-bet-panel ${disabled?'locked':''}" aria-label="베팅 칩 트레이">
 <div class="v11-bet-guide"><span>🪙 칩을 터치하면 바로 베팅</span><strong>베팅 ${fmt(value)}칩</strong></div>
 <div class="v11-bet-rail">${denoms.map(chipMarkup).join('')}</div>
 <div class="v11-bet-foot"><button class="v11-bet-spot" data-v11-bettable="1" ondragover="event.preventDefault()" ondrop="v11DropCardChip(event)" onclick="v11PlaceCardChip()" ${disabled?'disabled':''}><span class="v11-stack-graphic">◉</span> <span>칩 놓는 곳 · <b>${fmt(value)}칩</b></span></button>
 <button class="v11-bet-undo" onclick="v11UndoCardChip()" ${!canModify||!value?'disabled':''} title="마지막 칩 회수" aria-label="마지막 칩 회수">↶</button>
 <button class="v11-bet-clear" onclick="v11ClearCardBet()" ${!canModify||!value?'disabled':''}>전체 회수</button></div>
 </section>`}
function refreshCardBet(){const node=Q('.v10-blackjack-chips');if(node)node.outerHTML=cardBetPanel();QQ('.v11-chip').forEach(x=>x.disabled=locked());
 const start=Q('#v9ControlActions button');if(start&&!locked()&&state.chip<=0&&['카드 받기','DEAL','다음 판'].some(x=>start.textContent.includes(x))){start.disabled=true;start.setAttribute('aria-label','먼저 칩을 하나 이상 베팅해주세요')}
 if(state.activeGame==='baccarat'){
   QQ('.v9-bac-choice').forEach(b=>{let k=b.textContent.trim(),odds=k==='타이'?'8 : 1':k==='뱅커'?'0.95 : 1':'1 : 1';b.setAttribute('aria-pressed',String(k===state.selected));b.innerHTML=`<strong>${k}</strong><small>${odds}</small>`});
 }
}
renderBlackjack=function(){prevBJ();refreshCardBet()};
renderBaccarat=function(){prevBAC();refreshCardBet()};
window.v11PlaceCardChip=function(n){if(!cardReady())return;if(locked()){notice('카드 진행 중에는 베팅을 변경할 수 없습니다.');return}
 n=denoms.includes(Number(n))?Number(n):chosenChip;chosenChip=n;
 if(state.money-state.chip<n){notice('보유 칩보다 많이 베팅할 수 없습니다.');return}
 contributions.push(n);state.chip+=n;sound('chip');renderGame()};
window.v11UndoCardChip=function(){if(locked())return;if(state.chip<=0)return;const n=contributions.pop()||Math.min(chosenChip,state.chip);state.chip=Math.max(0,state.chip-n);renderGame()};
window.v11ClearCardBet=function(){if(locked())return;state.chip=0;contributions=[];renderGame()};
window.v11DragStart=function(e,n){chosenChip=n;e.dataTransfer?.setData('text/plain',String(n));if(e.dataTransfer)e.dataTransfer.effectAllowed='copy'};
window.v11DropCardChip=function(e){e.preventDefault();const n=Number(e.dataTransfer?.getData('text/plain'));v11PlaceCardChip(denoms.includes(n)?n:chosenChip)};
const oldBJStart=bjStart,oldBACStart=dealBaccarat;
bjStart=async function(){if(state.chip<=0){notice('먼저 칩을 터치해 판돈을 놓아주세요.');return}return oldBJStart()};
dealBaccarat=async function(){if(state.chip<=0){notice('플레이어·뱅커·타이를 선택하고 칩을 베팅해주세요.');return}return oldBACStart()};

// Realistic 3D dice geometry: opposite faces sum to seven, and rotations bring
// the actual scored face toward the player. Per-game wagers do not bleed across tables.
const PIP_LOC={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
function facePips(v){return `<span class="v11-face-pips">${PIP_LOC[v].map(p=>`<i style="grid-area:${Math.ceil(p/3)}/${((p-1)%3)+1}"></i>`).join('')}</span>`}
function die(idx){return `<div class="v11-die-shell"><div class="v11-dice-shadow"></div><div class="v11-die" id="v11Die${idx}" data-value="1">${Object.entries(dieSides).map(([side,v])=>`<div class="v11-face v11-face-${side}" data-pips="${v}">${facePips(v)}</div>`).join('')}</div></div>`}
const diePad=(g)=>`<div class="v11-dice-panel">
<div class="v11-dice-title"><span>${g==='sicbo'?'세 개의 주사위':'하나의 주사위'}</span><b id="v11DiceState">READY TO ROLL</b></div>
<div class="v11-dice-shaker"><div class="v11-dice-halo"></div><div class="v11-dice-line"></div><div class="v11-dice-scene" id="v11DiceScene">${Array.from({length:g==='sicbo'?3:1},(_,i)=>die(i)).join('')}</div><div class="v11-dice-rim"></div></div>
<div class="v11-dice-result" id="v11DiceResult" role="status" aria-live="polite">칩을 선택한 다음 베팅 구역에 올려주세요.</div>
</div>`;
function newDiceState(game){return {game,bets:{},chip:10000,busy:false,last:null,seq:++diceEpoch}}
function diceZones(game){return (game==='sicbo'?['소','대','홀','짝']:['홀','짝']).map(label=>`<button class="v11-dice-zone ${diceRun.bets[label]?'has-bet':''}" type="button" data-v11-zone="${label}" onclick="v11DicePlace('${label}')" ondragover="event.preventDefault()" ondrop="v11DiceDrop(event,'${label}')"><span>${label}</span><small>${game==='sicbo'?label==='소'?'4–10':label==='대'?'11–17':'삼쌍둥이 제외':'홀수 / 짝수'}</small><b>${diceRun.bets[label]?fmt(diceRun.bets[label])+'칩':'칩 놓기'}</b></button>`).join('')}
function diceChip(n){return `<button class="v11-chip v11-chip-${denoms.indexOf(n)} ${diceRun.chip===n?'active':''}" type="button" data-v11-chip="${n}" draggable="true" ondragstart="v11DragStart(event,${n})" onclick="v11DiceChoose(${n})" aria-label="${fmt(n)}칩 선택"><b>${n<10000?n/1000+'천':n/10000+'만'}</b></button>`}
function renderDiceV11(game){if(!diceRun||diceLastGame!==game){diceRun=newDiceState(game);diceLastGame=game}
 const total=Object.values(diceRun.bets).reduce((a,b)=>a+b,0),available=state.money-total;
 view(`<div class="v11-dice-page">${stageHeading(game==='sicbo'?'✦ SIC BO · 식보 ✦':'✦ 홀짝 다이스 ✦',game)}
 ${diePad(game)}
 <div class="v11-dice-wagers">${diceZones(game)}</div>
 <div class="v11-dice-console"><div class="v11-dice-chips"><label>칩 선택</label><div class="v11-dice-chiplist">${denoms.map(diceChip).join('')}</div></div>
 <div class="v11-wager-total"><span>총 베팅 <b>${fmt(total)}칩</b></span><span>잔액 <b>${fmt(available)}칩</b></span></div>
 <div class="v11-dice-buttons"><button class="v11-dice-reset" onclick="v11DiceReset()" ${!total||diceRun.busy?'disabled':''}>↶ 칩 회수</button><button class="v11-dice-go" onclick="v11DiceRoll()" ${!total||diceRun.busy?'disabled':''}>🎲 주사위 굴리기</button></div></div></div>`);
 if(diceRun.last){const a=Q('#v11DiceResult');if(a)a.innerHTML=diceRun.last.html}
}
renderDice=function(id){renderDiceV11(id)};
window.v11DiceChoose=function(n){if(!diceRun||diceRun.busy)return;diceRun.chip=n;QQ('.v11-dice-chiplist .v11-chip').forEach(x=>x.classList.toggle('active',Number(x.dataset.v11Chip)===n))};
window.v11DicePlace=function(zone){if(!diceRun||diceRun.busy)return;const total=Object.values(diceRun.bets).reduce((a,b)=>a+b,0);if(total+diceRun.chip>state.money){notice('칩이 부족해 베팅할 수 없습니다.');return}diceRun.bets[zone]=(diceRun.bets[zone]||0)+diceRun.chip;sound('chip');renderDiceV11(diceRun.game)};
window.v11DiceDrop=function(e,zone){e.preventDefault();const n=Number(e.dataTransfer?.getData('text/plain'));if(denoms.includes(n))diceRun.chip=n;v11DicePlace(zone)};
window.v11DiceReset=function(){if(!diceRun||diceRun.busy)return;diceRun.bets={};renderDiceV11(diceRun.game)};
function dieRoll(){const arr=new Uint32Array(1),bound=2**32-(2**32%6);let x;do{crypto.getRandomValues(arr);x=arr[0]}while(x>=bound);return 1+(x%6)}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
window.v11DiceRoll=async function(){if(!diceRun||diceRun.busy)return;const ctx=diceRun,game=ctx.game;
 const bets={...ctx.bets},total=Object.values(bets).reduce((a,b)=>a+b,0);if(!total||total>state.money){notice('베팅할 칩을 확인해주세요.');return}
 ctx.busy=true;ctx.last=null;const btn=Q('.v11-dice-go');if(btn)btn.disabled=true;
 const words=Q('#v11DiceResult'),status=Q('#v11DiceState');if(words)words.textContent='주사위가 회전하고 있습니다…';if(status)status.textContent='ROLLING · PLEASE WAIT';
 changeMoney(-total);sound('spin');const results=Array.from({length:game==='sicbo'?3:1},()=>dieRoll());
 const animations=results.map((v,i)=>{
  const el=Q('#v11Die'+i),angle=dieRotation[v],end=`translate3d(0,0,0) rotateX(${angle[0]}deg) rotateY(${angle[1]}deg)`,duration=1900+i*220;
  if(!el)return sleep(duration);
  const anim=el.animate([
   {offset:0,transform:'translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)'},
   {offset:.24,transform:`translate3d(${i%2?-7:8}px,-31px,16px) rotateX(${720+angle[0]}deg) rotateY(${540+angle[1]}deg) rotateZ(12deg)`},
   {offset:.59,transform:`translate3d(${i%2?8:-7}px,-3px,0) rotateX(${1080+angle[0]}deg) rotateY(${1080+angle[1]}deg) rotateZ(-8deg)`},
   {offset:.79,transform:`translate3d(0,-12px,3px) rotateX(${720+angle[0]}deg) rotateY(${720+angle[1]}deg) rotateZ(2deg)`},
   {offset:1,transform:end}
  ],{duration,easing:'cubic-bezier(.12,.7,.2,1)',fill:'forwards'});
  return anim.finished.catch(()=>{}).then(()=>{el.style.transform=end;el.dataset.value=String(v);anim.cancel();sound('chip')});
 });
 await Promise.all(animations);
 const sum=results.reduce((a,b)=>a+b,0),triple=game==='sicbo'&&results.every(x=>x===results[0]);let gross=0;
 for(const [label,stake] of Object.entries(bets)){
  const match=label==='홀'&&sum%2===1||label==='짝'&&sum%2===0||label==='소'&&sum>=4&&sum<=10||label==='대'&&sum>=11&&sum<=17;
  if(match&&!triple)gross+=Math.round(stake*1.95);
 }
 changeMoney(gross);const net=gross-total;
 const html=`<div class="v11-dice-drawn"><b>${results.join(' + ')} = ${sum}</b><span class="${net>=0?'winning':'losing'}">${gross?`총 지급 <strong>${fmt(gross)}</strong>칩 · `:'총 지급 0칩 · '}순손익 <strong>${net>=0?'+':''}${fmt(net)}</strong>칩</span></div>${triple?'<small>세 주사위가 같은 숫자: 대·소·홀·짝 제외</small>':''}`;
 ctx.last={html,results,gross,net};ctx.bets={};ctx.busy=false;
 if(words){words.innerHTML=html;words.classList.toggle('is-win',net>0)}if(status)status.textContent=gross?'WIN RESULT':'ROUND COMPLETED';
 if(net>0){sound('win');setTicker(`${state.name}님이 주사위에서 ${fmt(gross)}칩 획득!`)}
 // Preserve dice outcome and visible top faces after settlement; update wagers only.
 QQ('.v11-dice-zone').forEach(z=>{z.classList.remove('has-bet');const b=z.querySelector('b');if(b)b.textContent='칩 놓기'});
 const wager=Q('.v11-wager-total');if(wager)wager.innerHTML=`<span>총 베팅 <b>0칩</b></span><span>잔액 <b>${fmt(state.money)}칩</b></span>`;
 if(btn)btn.disabled=true;
 const reset=Q('.v11-dice-reset');if(reset)reset.disabled=true;
};

// Treat touch dragging as direct, visually tracked drop; native desktop HTML drag stays supported.
let floating=null,start=null,dragMoved=false;
document.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'||!e.target.closest('.v11-chip'))return;
 const b=e.target.closest('.v11-chip');floating=b.cloneNode(true);floating.classList.add('v11-floating');document.body.appendChild(floating);
 start={x:e.clientX,y:e.clientY,value:Number(b.dataset.v11Chip)};dragMoved=false;
 floating.style.left=e.clientX-18+'px';floating.style.top=e.clientY-18+'px';
},{passive:true});
document.addEventListener('pointermove',e=>{if(!floating||!start)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>12)dragMoved=true;floating.style.left=e.clientX-18+'px';floating.style.top=e.clientY-18+'px'},{passive:true});
document.addEventListener('pointerup',e=>{if(!floating||!start)return;floating.remove();floating=null;
 if(dragMoved){const target=document.elementFromPoint(e.clientX,e.clientY);if(target?.closest('.v11-dice-zone')){v11DiceChoose(start.value);v11DicePlace(target.closest('.v11-dice-zone').dataset.v11Zone)}else if(target?.closest('[data-v11-bettable]'))v11PlaceCardChip(start.value)}start=null;
},{passive:true});
document.addEventListener('pointercancel',()=>{floating?.remove();floating=null;start=null},{passive:true});

// Clear the old V10 dice animation state when navigating between dice games.
const oldSelect=switchSlot;
switchSlot=function(i){if(diceRun?.busy){notice('주사위 정산이 끝난 뒤 이동하세요.');return}return oldSelect(i)};
})();