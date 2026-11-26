import {advance,perform,PREDICTABLE} from './game.mjs';
export const STORAGE_KEY='chiikawa-snack-cave-v1';
export class GameSession{
 constructor({api='/api',storage=globalThis.localStorage,fetcher=(...args)=>globalThis.fetch(...args),clock=()=>Date.now(),onGame=()=>{},onStatus=()=>{},onError=()=>{}}={}){Object.assign(this,{api,storage,fetcher,clock,onGame,onStatus,onError});let saved;try{saved=JSON.parse(storage?.getItem(STORAGE_KEY)||'{}');}catch{saved={};}this.token=typeof saved.token==='string'?saved.token:'';this.player=saved.player||null;this.base=saved.game||null;this.game=null;this.offset=0;this.bestClockSample=Infinity;this.pending=Array.isArray(saved.pending)?saved.pending.filter(p=>p&&/^[a-zA-Z0-9_-]{8,80}$/.test(p.id)&&typeof p.type==='string').slice(0,64):[];this.running=false;this.backoff=1500;this.timer=null;this.stopped=false;this.status='loading';}
 now(){return this.clock()+this.offset;}
 statusTo(value){this.status=value;this.onStatus(value);}
 persist(force=false){try{const saved=JSON.parse(this.storage?.getItem(STORAGE_KEY)||'{}');if(!force&&saved.token&&saved.token!==this.token)return;this.storage?.setItem(STORAGE_KEY,JSON.stringify({token:this.token,player:this.player,game:this.base,pending:this.pending.map(({id,type,payload,optimistic,at})=>({id,type,payload,optimistic,at}))}));}catch{this.onError('이 기기에서 로그인 정보 저장을 허용해 주세요. 진행은 서버에 저장돼요.');}}
 async request(path,{method='GET',body,retry=true}={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);try{const sentAt=this.clock();const res=await this.fetcher(this.api+path+(this.api.startsWith('https://')?(path.includes('?')?'&':'?')+'build=130':''),{method,headers:{...(this.token?{authorization:'Bearer '+this.token}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store'}),data=await res.json();if(!res.ok)throw Object.assign(Error(data.error||'서버에 연결하지 못했어요.'),{status:res.status});if(Number.isFinite(data.serverAt)){
 const receivedAt=this.clock(),rtt=Math.max(0,receivedAt-sentAt);
 if(rtt<=this.bestClockSample+1){this.offset=data.serverAt-(sentAt+receivedAt)/2;this.bestClockSample=rtt;}
 }return data;}catch(e){if(retry&&(!e.status||e.status>=500))return this.request(path,{method,body,retry:false});throw e;}finally{clearTimeout(timer);}}
 rebuild(){
  if(!this.base)return;
  let game=structuredClone(this.base);
  const now=this.now();
  for(const item of this.pending){
   if(!item.optimistic)continue;
   const at=Math.max(game.lastAt,Math.min(item.at??now,now));
   advance(game,at);
   try{game=perform(game,item.type,item.payload,item.id,at).game;}catch{}
  }
  advance(game,now);
  this.game=game;this.onGame(game,this.player);
 }
 accept(data){if(!data.game)return;if(this.base&&data.game.revision<this.base.revision)return;this.base=structuredClone(data.game);this.player=data.player||this.player;this.rebuild();this.persist();}
 async connect(){if(!this.token){this.statusTo('signed-out');return false;}try{this.accept(await this.request('/state'));this.statusTo(this.pending.length?'saving':'saved');this.drain();return true;}catch(e){if(e.status===401){this.clear();return false;}if(this.base){this.rebuild();this.statusTo('offline');this.schedule();return true;}this.statusTo('offline');this.onError('연결을 확인한 뒤 다시 시도해 주세요.');return false;}}
 async authenticate(mode,nickname,pin){if(this.running)throw Error('저장을 마친 뒤 다시 시도해 주세요.');const data=await this.request(mode==='register'?'/register':'/login',{method:'POST',body:{nickname,pin},retry:false});this.token=data.token;this.pending=[];this.base=null;this.accept(data);this.persist(true);this.statusTo('saved');return data;}
 clear(){const previous=this.token;clearTimeout(this.timer);this.token='';this.base=null;this.game=null;this.player=null;for(const item of this.pending)item.reject?.(Error('다시 로그인해 주세요.'));this.pending=[];try{if(JSON.parse(this.storage?.getItem(STORAGE_KEY)||'{}').token===previous)this.persist(true);}catch{}this.statusTo('signed-out');this.onGame(null,null);}
 mutate(type,payload={}){if(!this.game||!this.token)throw Error('먼저 로그인해 주세요.');if(!PREDICTABLE.has(type))throw Error('서버 확인이 필요한 작업이에요.');if(this.pending.length>=64)throw Error('연결을 확인하고 저장을 기다려 주세요.');const id=crypto.randomUUID(),value=perform(this.game,type,payload,id,this.now());this.game=value.game;this.pending.push({id,type,payload,at:this.now(),optimistic:true});this.persist();this.onGame(this.game,this.player);this.statusTo('saving');this.drain();return value;}
 confirm(type,payload={}){if(!this.game||!this.token)return Promise.reject(Error('먼저 로그인해 주세요.'));if(this.pending.length>=64)return Promise.reject(Error('연결을 확인하고 저장을 기다려 주세요.'));const id=crypto.randomUUID();return new Promise((resolve,reject)=>{this.pending.push({id,type,payload,optimistic:false,resolve,reject});this.persist();this.statusTo('saving');this.drain();});}
 schedule(){if(this.stopped||this.timer)return;this.timer=setTimeout(()=>{this.timer=null;this.pending.length?this.drain():this.sync();},this.backoff);this.backoff=Math.min(15000,this.backoff*1.5);this.timer.unref?.();}
 async drain(){if(this.running||!this.token||this.stopped)return;clearTimeout(this.timer);this.timer=null;this.running=true;try{while(this.pending.length&&this.token){const item=this.pending[0];try{const data=await this.request('/action',{method:'POST',body:{type:item.type,payload:item.payload,requestId:item.id}});if(this.stopped)break;this.pending.shift();this.accept(data);item.resolve?.(data.result);this.backoff=1500;}catch(e){if(e.status===401){this.clear();break;}if(e.status&&e.status<500){this.pending.shift();this.persist();item.reject?.(e);this.onError(e.message);const fresh=await this.request('/state');this.accept(fresh);continue;}this.statusTo('offline');this.schedule();break;}}if(this.token&&!this.pending.length)this.statusTo('saved');}catch(e){this.statusTo('offline');this.onError('연결을 복구하면 저장을 이어서 진행해요.');this.schedule();}finally{this.running=false;}}
 async sync(){if(!this.token||this.running||this.pending.length){this.drain();return;}const activeToken=this.token;try{const data=await this.request('/state');if(this.token!==activeToken||this.running||this.pending.length)return;this.accept(data);this.statusTo(this.pending.length?'saving':'saved');this.backoff=1500;}catch(e){if(e.status===401)this.clear();else {this.statusTo('offline');this.schedule();}}}
 async flush(){const until=this.clock()+14000;this.drain();while(this.pending.length||this.running){if(this.clock()>until)throw Error('아직 저장 중이에요. 연결을 확인한 뒤 다시 시도해 주세요.');await new Promise(r=>setTimeout(r,40));}}
 async logout(){await this.flush();await this.request('/logout',{method:'POST',body:{}});this.clear();}
 close(){this.stopped=true;clearTimeout(this.timer);}
}
