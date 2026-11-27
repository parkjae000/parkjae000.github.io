// Conquest platforms are defensive positions, not prescribed movement routes.
export const SIEGE={spawnX:180,wallX:1115,top:155,bottom:885,centerX:1380,centerY:520};
export const SIEGE_PADS=[
 {id:'pad-0',x:1205,y:325,kind:'tower'},{id:'pad-1',x:1380,y:325,kind:'tower'},
 {id:'pad-2',x:1205,y:790,kind:'tower'},{id:'pad-3',x:1380,y:790,kind:'tower'},
 {id:'pad-4',x:1210,y:475,kind:'hero'},{id:'pad-5',x:1210,y:650,kind:'hero'}
];
export const siegeSlotAccepts=(pad,kind)=>SIEGE_PADS.some(p=>p.id===pad&&p.kind===kind);
export const isSiegeScene=s=>s.battle?.objective==='conquest'?s.battle.variant==='open-siege':s.mode==='design'&&s.scope!=='home';
