// Four tower platforms on the center's front line. The wall remains the first target.
export const SIEGE={spawnX:180,wallX:1115,top:155,bottom:885,centerX:1380,centerY:520};
export const SIEGE_PADS=[260,450,640,830].map((y,i)=>({id:'pad-'+i,x:1195,y,kind:'tower'}));
export const siegeSlotAccepts=(pad,kind)=>kind==='tower'&&SIEGE_PADS.some(p=>p.id===pad);
export const isSiegeScene=s=>s.battle?.objective==='conquest'?s.battle.variant==='open-siege':s.mode==='design'&&s.scope!=='home';
