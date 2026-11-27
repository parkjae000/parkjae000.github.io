import {previewMiningDrop,projectMiningTime} from './mining-ui.js?v=20261127-v300-simple';
import {canMergeWorkers} from './balance.js?v=20261127-v300-simple';
export function mergeMiningDelta(state,delta){
 const td=state?.td;if(!td||!delta||delta.world!==td.world||delta.id!==td.me.id)return false;
 if(delta.serverTime<td.serverTime){const g=state.me.game;g.boxes=td.growth.boxes;g.cash=td.campaign.cash;g.inventory=td.growth.inventory;return false;}
 state.td={...td,growth:{...td.growth,...delta.growth},campaign:{...td.campaign,...delta.campaign},power:state.me.power,serverTime:delta.serverTime};return true;
}
export function previewMiningInput(game,type,params,from,now){
 if(type!=='worker/merge')return previewMiningDrop(game,type,params,from,now);
 const a=game.workers.find(w=>w.id===params.a),b=game.workers.find(w=>w.id===params.b);
 if(!canMergeWorkers(a,b)||a.pendingMerge||b.pendingMerge)return null;
 const g=projectMiningTime(game,from,now),worker=g.workers.find(w=>w.id===a.id),other=g.workers.find(w=>w.id===b.id);
 if(!other.parked)Object.assign(worker,{x:other.x,y:other.y,parked:false});worker.pendingMerge=true;worker.target=null;
 g.workers=g.workers.filter(w=>w.id!==b.id);if(g.forklift?.workerId===b.id)g.forklift.workerId=a.id;
 return {game:g,at:now};
}
export class MiningInputQueue{
 constructor({read,send,publish,failed,clock=Date.now,max=24}){Object.assign(this,{read,send,publish,failed,clock,max});this.items=[];this.running=false;this.generation=0;this.waiters=[];}
 get busy(){return this.items.length>0;}
 project(){const base=this.read();if(!base)return null;let game=base.game,at=base.at;for(const item of this.items){const next=previewMiningInput(game,item.type,item.params,at,this.clock());if(next){game=next.game;at=next.at;}}return this.items.length?{game,at,actor:base.actor,zone:base.game.mine.zone}:null;}
 enqueue(type,params){const base=this.read(),view=this.project()||base;if(!base||this.items.length>=this.max||!previewMiningInput(view.game,type,params,view.at,this.clock()))return Promise.resolve(null);
  let resolve;const promise=new Promise(r=>resolve=r);this.items.push({type,params:JSON.parse(JSON.stringify(params)),actor:base.actor,zone:base.game.mine.zone,requestId:crypto.randomUUID(),resolve,generation:this.generation});this.publish(this.project());this.pump();return promise;
 }
 refresh(){this.publish(this.project());}
 async pump(){if(this.running||!this.items.length)return;this.running=true;const item=this.items[0];try{const out=await this.send(item);if(item.generation===this.generation){this.items.shift();item.resolve(out);this.publish(this.project());}}catch(error){if(item.generation===this.generation){this.reset();await this.failed(error);this.publish(null);}}finally{this.running=false;if(this.items.length)this.pump();else for(const resolve of this.waiters.splice(0))resolve();}}
 flush(){return this.busy||this.running?new Promise(r=>this.waiters.push(r)):Promise.resolve();}
 reset(){this.generation++;for(const item of this.items.splice(0))item.resolve(null);this.publish(null);if(!this.running)for(const resolve of this.waiters.splice(0))resolve();}
}
