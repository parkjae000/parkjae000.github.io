import {icon,esc} from './ui.mjs?v=127';
// This view never keeps a receipt in the shop. Closing it disposes the result.
export class ChestOpening{
 constructor(host,{kind='clear',quote=null,reward=null,claim,art,cardArt,cardName,continueLabel='확인',onContinue,onStay=null,autoOpen=false}){
  Object.assign(this,{host,kind,quote,claim,art,cardArt,cardName,continueLabel,onContinue,onStay});this.closed=false;this.busy=false;
  this.reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  host.className='chest-opening';
  host.innerHTML=`<p class="chest-eyebrow">${kind==='clear'?'동굴 탐험 완료!':'작은 행운을 열어 봐요'}</p><div class="chest-scene"><span class="chest-rays" aria-hidden="true"></span><span class="chest-sprite" role="img" aria-label="닫힌 보상 상자"></span><span class="chest-stars" aria-hidden="true">✦ ✧ ✦</span></div><div class="chest-body"></div><div class="chest-actions"></div>`;
  this.scene=host.querySelector('.chest-scene');this.body=host.querySelector('.chest-body');this.actions=host.querySelector('.chest-actions');
  if(reward)this.showResult(reward);
  else{
   this.body.innerHTML=`<p class="chest-instruction">상자를 눌러 보상을 받아요</p>${quote?`<div class="chest-summary"><span>${icon('cards')} 카드 <b>${quote.cardCount}장</b></span><span>${icon('elixir')} 연구 <b>${quote.elixir}</b></span></div>`:''}<p class="chest-error" role="alert"></p>`;
   const b=document.createElement('button');b.className='dialog-button chest-open-button';b.textContent='상자 열기';b.onclick=()=>this.run();this.actions.append(b);
   this.scene.setAttribute('role','button');this.scene.setAttribute('aria-label','보상 상자 열기');this.scene.tabIndex=0;this.scene.onclick=()=>this.run();this.scene.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.run();}};
   if(autoOpen)requestAnimationFrame(()=>this.run());else b.focus({preventScroll:true});
  }
 }
 async run(){
  if(this.busy||this.reward||this.closed)return;this.busy=true;
  const b=this.actions.querySelector('button');b.disabled=true;b.textContent='상자를 열고 있어요…';this.scene.classList.add('shaking');this.host.setAttribute('aria-busy','true');this.body.querySelector('.chest-error').textContent='';
  try{
   const [reward]=await Promise.all([this.claim(),new Promise(resolve=>setTimeout(resolve,this.reduced?0:650))]);
   if(this.closed||!this.host.isConnected)return;
   this.scene.classList.remove('shaking');this.scene.classList.add('opened');
   await new Promise(resolve=>setTimeout(resolve,this.reduced?0:220));
   if(!this.closed&&this.host.isConnected)this.showResult(reward);
  }catch(e){if(this.closed||!this.host.isConnected)return;this.scene.classList.remove('shaking');this.body.querySelector('.chest-error').textContent=e.message;b.disabled=false;b.textContent='다시 열기';}
  finally{this.busy=false;this.host.removeAttribute('aria-busy');}
 }
 showResult(reward){
  this.reward=reward;this.scene.classList.remove('shaking');this.scene.classList.add('opened');this.scene.removeAttribute('role');this.scene.removeAttribute('tabindex');this.scene.onclick=null;this.scene.onkeydown=null;
  this.scene.querySelector('.chest-sprite').setAttribute('aria-label','열린 보상 상자');
  const cards=reward.cards||[],total=cards.reduce((n,c)=>n+c.amount,0);
  this.body.innerHTML=`<h2 class="chest-received-title">${this.kind==='clear'?reward.stage+'번 동굴 클리어 보상':'이번에 받은 보상'}</h2><div class="chest-summary" role="status"><span>${icon('cards')} 카드 <b>${total}장</b></span><span>${icon('elixir')} 연구 <b>+${reward.elixir||0}</b></span></div><div class="chest-reward-list" aria-label="획득한 카드 종류와 수량">${cards.map((c,i)=>`<div class="chest-card-reward" style="--reveal-delay:${Math.min(i,5)*45}ms">${this.art(this.cardArt(c.id))}<span>${esc(this.cardName(c.id))}</span><strong>+${c.amount}장</strong></div>`).join('')}</div><p class="chest-save-note">${this.kind==='clear'?'클리어 보상은 한 번 지급되며 다음 동굴에도 가져가요.':'확인을 누르면 상점으로 돌아가요.'}</p>`;
  this.actions.replaceChildren();
  if(this.onStay){const stay=document.createElement('button');stay.className='chest-stay-button';stay.textContent='계속 채굴';stay.onclick=()=>this.onStay();this.actions.append(stay);}
  const ok=document.createElement('button');ok.className='dialog-button chest-continue-button';ok.textContent=this.continueLabel;ok.onclick=()=>{if(!this.closed)this.onContinue(reward);};this.actions.append(ok);ok.focus({preventScroll:true});
 }
 destroy(){this.closed=true;}
}
