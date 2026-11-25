export const battleSpeed=p=>p.clock?.speed===2?2:1;
export function battleElapsedMs(p,now){const c=p.clock;return Math.max(0,c?.elapsedMs||0)+Math.max(0,now-(c?.anchorAt??p.startedAt))*battleSpeed(p);}
export const battleElapsedTicks=(p,now)=>Math.max(0,Math.floor(battleElapsedMs(p,now)*30/1000+1e-8));
export function battleEndAt(p){const c=p.clock,remaining=Math.max(0,p.computed.ticks*1000/30-(c?.elapsedMs||0));return Math.max(p.startedAt,Math.ceil((c?.anchorAt??p.startedAt)+remaining/battleSpeed(p)));}
export function changeBattleSpeed(p,speed,now){if(![1,2].includes(speed))throw Error('배속은 1배 또는 2배를 선택해 주세요.');p.clock={elapsedMs:battleElapsedMs(p,now),anchorAt:now,speed};return p.clock;}
