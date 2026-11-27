// Clear rewards belong to the current cave and are claimed once before departure.
export const clearChestQuote=g=>({stage:g.stage,cardCount:8+2*Math.min(40,g.stage),elixir:20+10*Math.min(50,g.stage)});
export const claimedClearChest=g=>g.clearChest?.stage===g.stage&&g.clearChest.claimed===true?g.clearChest:null;
export const clearChestReady=g=>!!claimedClearChest(g)?.acknowledged;
export function openClearChest(g){
 if(!g.exit.done)throw Error('동굴 출구를 먼저 열어 주세요.');
 const saved=claimedClearChest(g);if(saved)return saved;
 const quote=clearChestQuote(g),keys=Object.keys(g.cards),counts={};
 for(let i=0;i<quote.cardCount;i++){
  g.seed=(Math.imul(g.seed,1664525)+1013904223)>>>0;
  const id=keys[Math.floor(g.seed/4294967296*keys.length)];counts[id]=(counts[id]||0)+1;
 }
 const cards=Object.entries(counts).map(([id,amount])=>({id,amount}));
 for(const c of cards)g.cards[c.id].count+=c.amount;
 g.elixir+=quote.elixir;
 g.clearChest={type:'clearChest',stage:g.stage,claimed:true,acknowledged:false,cards,elixir:quote.elixir,cardCount:quote.cardCount,text:'카드 '+quote.cardCount+'장 · 연구 '+quote.elixir+'를 받았어요.'};
 return g.clearChest;
}
export function confirmClearChest(g){
 const reward=claimedClearChest(g);if(!reward)throw Error('클리어 보상 상자를 먼저 열어 주세요.');
 reward.acknowledged=true;return {stage:g.stage,acknowledged:true};
}
