import {workerMiningDps,adjacentMiningTarget} from './balance.js?v=20261124-v227-worker-floor';
// Display projection only. Rewards, merge outcomes and valid moves remain server-owned.
export const miningMultiplier=(game,now)=>Number(game?.shop?.boostUntil)>now?2:1;
export function miningHp(hp,rate,from,now,boostUntil=0){
 const elapsed=Math.max(0,(now-from)/1000),boosted=Math.max(0,Math.min(elapsed,(boostUntil-from)/1000));
 return Math.max(0,hp-Math.max(0,rate)*(elapsed+boosted));
}
export function miningSeconds(hp,rate,now,boostUntil=0){
 if(hp<=0)return 0;if(!(rate>0))return Infinity;
 const boosted=Math.max(0,(boostUntil-now)/1000),fastWork=rate*2*boosted;
 return hp<=fastWork?hp/(rate*2):boosted+(hp-fastWork)/rate;
}
export function miningLanding(game,type,params){
 const worker=game.workers.find(w=>w.id===(params.worker||params.a));if(!worker)return null;
 if(type==='worker/merge'){const other=game.workers.find(w=>w.id===params.b);return other&&other.id!==worker.id&&other.level===worker.level?{x:other.x,y:other.y}:null;}
 const passable=(x,y)=>x>=0&&x<5&&y>=0&&y<=8&&(y===8||game.mine.nodes[y*5+x]?.done),seen=new Set(['2:8']),queue=[{x:2,y:8}],dirs=[[0,1],[1,0],[-1,0],[0,-1]];
 for(let i=0;i<queue.length;i++)for(const [dx,dy]of dirs){const x=queue[i].x+dx,y=queue[i].y+dy,key=x+':'+y;if(!seen.has(key)&&passable(x,y)){seen.add(key);queue.push({x,y});}}
 const free=p=>!game.workers.some(w=>w.id!==worker.id&&!w.parked&&w.x===p.x&&w.y===p.y);
 if(type==='mine/move')return queue.find(p=>p.x===params.x&&p.y===params.y&&free(p))||null;
 let candidates;
 if(type==='mine/gate'){if(!game.mine.nodes.every(n=>n.done)||game.mine.gate.done)return null;candidates=queue.filter(p=>p.y===0&&p.x>=1&&p.x<=3&&free(p));}
 else if(type==='mine/dispatch'){const idx=Number(params.idx);if(!Number.isInteger(idx)||idx<0||idx>=40||game.mine.nodes[idx].done)return null;candidates=queue.filter(p=>Math.abs(p.x-idx%5)+Math.abs(p.y-Math.floor(idx/5))===1&&free(p));}
 else return null;
 return candidates.sort((a,b)=>(Math.abs(a.x-worker.x)+Math.abs(a.y-worker.y))-(Math.abs(b.x-worker.x)+Math.abs(b.y-worker.y)))[0]||null;
}
const nodeKey=node=>node.nodeType===1?node.id?'id:'+node.id:node.hasAttribute('data-worker')?'worker:'+node.dataset.worker:node.hasAttribute('data-tile')?'tile:'+node.dataset.tile:node.hasAttribute('data-start')?'start:'+node.dataset.start:node.hasAttribute('data-miner-motion')?'miner:'+node.dataset.minerMotion:null:null;
function patchNode(current,next){
 if(current.nodeType!==next.nodeType||current.nodeName!==next.nodeName){current.replaceWith(next.cloneNode(true));return;}
 if(current.nodeType!==1){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}
 for(const a of [...current.attributes])if(!next.hasAttribute(a.name)&&!(current.nodeName==='DETAILS'&&a.name==='open')&&!(current.id==='mineBoard'&&a.name==='style'))current.removeAttribute(a.name);
 for(const a of next.attributes)if(current.getAttribute(a.name)!==a.value)current.setAttribute(a.name,a.value);
 if(current.nodeName==='CANVAS')return;
 patchChildren(current,next);
}
function patchChildren(current,next){
 const old=[...current.childNodes],keyed=new Map(old.map(n=>[nodeKey(n),n]).filter(([key])=>key)),used=new Set();let cursor=current.firstChild;
 for(const desired of [...next.childNodes]){const key=nodeKey(desired);let existing=key?keyed.get(key):cursor&&!nodeKey(cursor)&&cursor.nodeType===desired.nodeType&&cursor.nodeName===desired.nodeName?cursor:null;
  if(existing&&used.has(existing))existing=null;
  if(!existing){existing=desired.cloneNode(true);current.insertBefore(existing,cursor);}
  else{if(existing!==cursor)current.insertBefore(existing,cursor);patchNode(existing,desired);}
  used.add(existing);cursor=existing.nextSibling;
 }
 for(const node of [...current.childNodes])if(!used.has(node))node.remove();
}
export function patchMiningMarkup(element,markup,{reset=false}={}){
 if(reset||!element.firstElementChild){element.innerHTML=markup;return;}
 const template=element.ownerDocument.createElement('template');template.innerHTML=markup;patchChildren(element,template.content);
}


export function miningTargetRate(w,g,idx,now){
 if(w.parked||w.target===null)return 0;
 const forklift=g.forklift?.workerId===w.id&&(g.forklift.permanent||g.forklift.until>now);
 if(!forklift||w.target==='gate')return w.target===idx?workerMiningDps(w,g):0;
 const targets=g.mine.nodes.map((n,i)=>({n,i})).filter(({n,i})=>!n.done&&Math.abs(i%5-w.x)+Math.abs(Math.floor(i/5)-w.y)===1).map(v=>v.i);
 return targets.includes(idx)?workerMiningDps(w,g)*1.5/targets.length:0;
}
// Predict position/animation/HP only. Never complete a node, award currency or roll a merge.
export function previewMiningDrop(game,type,params,from,now){
 if(!['mine/move','mine/dispatch','mine/gate'].includes(type))return null;
 const cell=miningLanding(game,type,params);if(!cell)return null;
 const g=structuredClone(game);
 for(let i=0;i<g.mine.nodes.length;i++){const n=g.mine.nodes[i];if(n.done)continue;const rate=game.workers.reduce((s,w)=>s+miningTargetRate(w,game,i,from),0);n.hp=miningHp(n.hp,rate,from,now,game.shop.boostUntil);}
 if(g.mine.gate&&!g.mine.gate.done){const rate=game.workers.reduce((s,w)=>s+miningTargetRate(w,game,'gate',from)*(game.forklift?.workerId===w.id&&(game.forklift.permanent||game.forklift.until>from)?1.5:1),0);g.mine.gate.hp=miningHp(g.mine.gate.hp,rate,from,now,game.shop.boostUntil);}
 const w=g.workers.find(w=>w.id===params.worker);w.x=cell.x;w.y=cell.y;w.parked=false;w.target=type==='mine/gate'?'gate':type==='mine/dispatch'?Number(params.idx):adjacentMiningTarget(g,w);
 return {game:g,at:now};
}
