// Mining receipts contain persisted game data, while cycle is a computed UI view.
// Keep its world, quotes and rewards when merging a fast mining acknowledgement.
export function mergeSimpleMiningView(view,persisted){
 if(!view||!persisted)return;
 const cycle=view.cycle;Object.assign(view,persisted);
 if(cycle)view.cycle={...cycle,autoMode:persisted.cycle?.autoMode??cycle.autoMode,wins:persisted.cycle?.wins??cycle.wins};
}
