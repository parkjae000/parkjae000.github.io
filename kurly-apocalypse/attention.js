// Pure presentation rules; gameplay and rewards remain server controlled.
export function miningAttention(g){
 if(!g?.mine||g.onboarding&&g.onboarding.stage!=='done')return {count:0,reason:''};
 if(g.mine.gate?.done)return {count:1,reason:'창고 문 돌파 완료 · 다음 구역으로 이동하세요.'};
 const nodes=g.mine.nodes||[],remaining=nodes.some(n=>!n.done&&n.hp>0),workers=g.workers||[];
 const idle=workers.filter(w=>{
  if(w.parked)return true;
  if(w.target==='gate')return remaining||!(g.mine.gate?.hp>0)||w.y!==0||Math.abs(w.x-2)>1;
  const n=nodes[w.target];return w.target==null||!n||n.done||n.hp<=0||Math.abs(w.x-Number(w.target)%5)+Math.abs(w.y-Math.floor(Number(w.target)/5))!==1;
 }).length;
 if(!g.shop?.auto&&idle&&remaining)return {count:idle,reason:`일용직 ${idle}명 채굴 대기 · 남은 자원 옆으로 옮겨 주세요.`};
 if(!remaining&&workers.length&&!workers.some(w=>w.target==='gate'))return {count:1,reason:'채굴 완료 · 창고 문에 일용직을 배치하세요.'};
 return {count:0,reason:''};
}
export function attackNotices(game,incoming=[]){
 const map=new Map();
 for(const mail of game?.mailbox||[]){
  const mode=mail.attackMode||(mail.type==='defense'?'raid':mail.type==='territory'&&mail.battleId?'conquest':null);
  if(!mode||!mail.battleId)continue;const phase=mail.attackPhase||'finished',key=mail.battleId+':'+phase;
  map.set(key,{key,mode,battleId:mail.battleId,at:mail.at,phase,title:mail.title,body:mail.body});
 }
 for(const a of incoming){const key=a.battleId+':started';map.set(key,{...a,key,phase:'started',at:a.startedAt,title:a.mode==='conquest'?'정복지 공격 진행 중':'센터 공격 진행 중',body:(a.attackerName||'상대 센터장')+' · '+(a.areaName||'내 센터')});}
 const all=[...map.values()],finished=new Set(all.filter(n=>n.phase==='finished').map(n=>n.battleId));
 return all.filter(n=>n.phase==='finished'||!finished.has(n.battleId)).sort((a,b)=>b.at-a.at||a.key.localeCompare(b.key));
}
export function unreadAttacks(notices,readKeys=[]){const read=new Set(readKeys),unread=notices.filter(n=>!read.has(n.key));return {raid:unread.filter(n=>n.mode==='raid').length,conquest:unread.filter(n=>n.mode==='conquest').length,total:unread.length};}
export function rankPlayers(rows,mode){return [...rows].sort((a,b)=>(mode==='mine'?(b.mineZone||1)-(a.mineZone||1):b.power-a.power)||b.power-a.power||String(a.id).localeCompare(String(b.id)));}
export function battleNames(payload={},rows=[],ranks=[]){
 const record=rows.find(b=>b.id===payload.id),user=id=>ranks.find(p=>p.id===id)?.nickname;
 return {a:payload.attackerName||user(payload.attackerId||record?.attacker_id)||'공격 센터',b:payload.defenderPlayerName||user(payload.defenderId||record?.defender_id)||payload.defenderName||'방어 센터'};
}
export function lastSeenLabel(at,now){if(!(at>0))return '마지막 접속 기록 없음';const seconds=Math.max(0,Math.floor((now-at)/1000));return '마지막 접속 '+(seconds<60?'방금':seconds<3600?Math.floor(seconds/60)+'분 전':seconds<86400?Math.floor(seconds/3600)+'시간 전':Math.floor(seconds/86400)+'일 전');}

export function eventReadyCount(progression,now){const a=progression?.attendance;if(!a)return 0;const day=new Date(now+9*3600000).toISOString().slice(0,10);return a.claimed<7&&a.lastDay!==day?1:0;}
