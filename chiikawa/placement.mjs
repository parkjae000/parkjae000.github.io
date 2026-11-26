import {freeTiles, isWideGate, spotFor, targets} from './economy.mjs';

const key=(x,y)=>x+','+y;

// Index the reachable floor once per layout change, not once per animation frame.
export function placementBoard(game,worker){
 const open=new Set(freeTiles(game,worker).map(([x,y])=>key(x,y)));
 const work=new Map();
 for(const target of targets(game)){
  const cells=target.port?target.footprint:isWideGate(target)?[-1,0,1].map(dx=>[target.x+dx,target.y]):[[target.x,target.y]];
  for(const [x,y] of cells)work.set(key(x,y),target);
 }
 return {open,work};
}

export function resolvePlacement(board,worker,touch,grip,friend){
 if(friend&&friend.id!==worker.id&&friend.level===worker.level&&worker.level<40){
  return {spot:'merge',friend,x:friend.x,y:friend.y};
 }
 const feet={x:touch.x,y:touch.y+grip};
 let best=null,priority=Infinity,score=Infinity;
 function consider(rank,distance,candidate){
  if(rank<priority||(rank===priority&&distance<score)){
   best=candidate;priority=rank;score=distance;
  }
 }
 const col=Math.round(touch.x),row=Math.round(touch.y);
 for(let y=row-2;y<=row+3;y++)for(let x=col-2;x<=col+2;x++){
  const tile=key(x,y),dx=Math.abs(touch.x-x),dy=touch.y-y;
  if(board.open.has(tile)){
   const dist=Math.hypot(dx,feet.y-y);
   const inside=dx<=.5&&Math.abs(feet.y-y)<=.5;
   if((inside||dist<=1.45)&&(inside||x!==worker.x||y!==worker.y)){
    consider(inside?1:2,dist,{spot:'move',x,y});
   }
  }
  const target=board.work.get(tile);
  if(!target)continue;
  const offset=target.port?0:.30;
  const distance=Math.hypot(dx,dy+offset);
  const direct=dx<=.5&&Math.abs(dy+offset)<=.5;
  if(!direct&&distance>1.35)continue;
  const stand=spotFor(board.open,target,feet);
  if(stand)consider(direct?0:2,distance+.12,{spot:'assign',target,...stand});
 }
 return best;
}
