export const unlockReadyHeroes=heroes=>(heroes||[]).filter(v=>!v.star&&Number(v.shards)>=10);
export const unseenUnlockHeroes=(heroes,seen=[])=>{const ids=new Set(seen);return unlockReadyHeroes(heroes).filter(v=>!ids.has(v.id));};
