// Match the server's maximum reward: 20% of each wallet, rounded down.
export function raidLootBudget(wallet={}){
 const part=value=>{const n=Number(value);return Number.isFinite(n)?Math.floor(Math.max(0,n)/5):0;};
 return {boxes:part(wallet.boxes),cash:part(wallet.cash)};
}
