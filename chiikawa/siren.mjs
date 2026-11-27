// Deterministic 20Hz simulation shared by the browser and the authoritative reward check.
export const TICK_MS=50,MAX_TICKS=1200,WIDTH=720,ROW=76;
export const DIRECTIONS='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg';
export const bonusDue=g=>g.stage%3===0;
export function directionCode(x,y){
 if(Math.hypot(x,y)<.15)return 'A';
 const angle=(Math.atan2(y,x)+Math.PI*2)%(Math.PI*2);
 return DIRECTIONS[1+Math.round(angle/(Math.PI*2)*32)%32];
}
export function createSiren(seed,stage=3){
 let value=seed>>>0;const random=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);
 const rows=[];
 for(let row=0;row<200;row++){
  const cells=[];
  for(let col=0;col<7;col++){
   const r=random(),power=row>1&&row%8===4&&col===(row*3)%7;
   const type=power?['time','size','boost','blast'][Math.floor(row/8)%4]:r<.63?'snack':r<.79?'card':r<.88?'gem':r<.95?'chest':'shell';
   cells.push({id:row*7+col,x:72+96*col,y:250+row*ROW,type,hp:type==='chest'?2:type==='shell'?3:1,max:type==='chest'?2:type==='shell'?3:1,done:false,amount:1+Math.floor(random()*2),phase:random()*6.28});
  }
  rows.push(cells);
 }
 return {seed,stage,rows,x:360,y:110,elapsed:0,remaining:30,sizeUntil:0,boostUntil:0,flashUntil:0,elixir:0,gems:0,cards:0,collected:0,events:[],finished:false};
}
function collect(s,o){
 if(o.done)return;o.done=true;s.collected++;
 if(o.type==='time'){s.remaining=Math.min(s.remaining+5,60-s.elapsed);s.events.push({type:'time',x:o.x,y:o.y,text:'+5초',at:s.elapsed});}
 else if(o.type==='size'){s.sizeUntil=s.elapsed+6;s.events.push({type:'size',x:o.x,y:o.y,text:'파도 범위 ×2',at:s.elapsed});}
 else if(o.type==='boost'){s.boostUntil=s.elapsed+3;s.events.push({type:'boost',x:o.x,y:o.y,text:'돌진!',at:s.elapsed});}
 else if(o.type==='blast'){
  s.flashUntil=s.elapsed+.5;s.events.push({type:'blast',x:o.x,y:o.y,text:'세이렌의 노래',at:s.elapsed});
  nearby(s,o.y,230,item=>{if(!item.done&&Math.hypot(item.x-o.x,item.y-o.y)<220)collect(s,item);});
 }else{
  if(o.type==='gem')s.gems+=o.amount;
  else if(o.type==='card')s.cards++;
  else if(o.type==='chest'){s.cards+=2;s.elixir+=5;}
  else s.elixir+=o.type==='shell'?3:o.amount;
  s.events.push({type:o.type,x:o.x,y:o.y,text:o.type==='gem'?'◆ +'+o.amount:o.type==='card'?'+1장':o.type==='chest'?'+2장 · 연구 +5':'+'+(o.type==='shell'?3:o.amount),at:s.elapsed});
 }
}
function nearby(s,y,r,fn){
 const a=Math.max(0,Math.floor((y-r-250)/ROW)),b=Math.min(s.rows.length-1,Math.ceil((y+r-250)/ROW));
 for(let i=a;i<=b;i++)for(const o of s.rows[i])fn(o);
}
export function stepSiren(s,code){
 if(s.finished)return;
 const n=DIRECTIONS.indexOf(code);if(n<0)throw Error('세이렌 조작 값을 확인해 주세요.');
 const dt=.05,angle=(n-1)/32*Math.PI*2,boost=s.elapsed<s.boostUntil,size=s.elapsed<s.sizeUntil;
 const speed=boost?390:195,radius=size?94:48;
 if(n){s.x=Math.max(45,Math.min(WIDTH-45,s.x+Math.cos(angle)*speed*dt));s.y=Math.max(65,s.y+Math.sin(angle)*speed*dt);}
 s.elapsed+=dt;s.remaining=Math.max(0,Math.min(s.remaining-dt,60-s.elapsed));
 nearby(s,s.y+30,radius+40,o=>{
  if(o.done)return;
  if(Math.hypot((o.x-s.x)/1.1,o.y-s.y-30)>radius+23)return;
  if(['time','size','boost','blast'].includes(o.type))collect(s,o);
  else {o.hp=Math.max(0,o.hp-(boost?16:5)*dt);if(o.hp<1e-8)collect(s,o);}
 });
 s.events=s.events.filter(e=>s.elapsed-e.at<.85).slice(-30);
 s.finished=s.remaining<1e-7||s.elapsed>=60-1e-7;
}
export function replaySiren(seed,stage,inputs){
 if(typeof inputs!=='string'||inputs.length>MAX_TICKS||[...inputs].some(c=>!DIRECTIONS.includes(c)))throw Error('세이렌 조작 기록을 확인해 주세요.');
 const s=createSiren(seed,stage);for(const c of inputs){if(s.finished)throw Error('종료 이후의 조작 기록이에요.');stepSiren(s,c);}return s;
}
export function startSiren(g,now,runId){
 if(!g.exit.done||!bonusDue(g))throw Error('출구를 연 뒤 3개 동굴마다 세이렌을 만날 수 있어요.');
 if(g.siren)return g.siren;
 g.siren={id:runId,seed:g.seed>>>0,stage:g.stage,startedAt:now,status:'playing'};return g.siren;
}
export function finishSiren(g,runId,inputs,now){
 const run=g.siren;if(!run||run.id!==runId)throw Error('진행 중인 세이렌 모험을 확인해 주세요.');
 if(run.status==='finished')return run.result;
 if(inputs.length*TICK_MS>Math.max(0,now-run.startedAt)+350)throw Error('아직 모험 시간이 남아 있어요.');
 const s=replaySiren(run.seed,run.stage,inputs);
 // Returning after closing the page uses idle inputs for elapsed real time.
 if(!s.finished&&now-run.startedAt>=60000)while(!s.finished)stepSiren(s,'A');
 if(!s.finished)throw Error('모험을 끝낸 뒤 보상을 받을 수 있어요.');
 const counts={},keys=Object.keys(g.cards);let value=(run.seed^0x9e3779b9)>>>0;
 for(let i=0;i<s.cards;i++){value=(Math.imul(value,1664525)+1013904223)>>>0;const id=keys[value%keys.length];counts[id]=(counts[id]||0)+1;}
 const result={elixir:s.elixir,gems:s.gems,cards:Object.entries(counts).map(([id,amount])=>({id,amount})),collected:s.collected,distance:Math.floor(s.y/10)};
 g.elixir+=result.elixir;g.gems+=result.gems;for(const c of result.cards)g.cards[c.id].count+=c.amount;
 run.status='finished';run.result=result;return result;
}
