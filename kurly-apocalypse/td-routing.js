export const TEST_GAME_API='https://pgupfypoxhjawtonnzzk.supabase.co/functions/v1/kurly-apocalypse-test';
export const isTDWorld=state=>state?.me?.world==='TEST'&&state?.td?.version===8;
export const tdTab=tab=>['center','war','shop'].includes(tab);
export function gameAPI(base,endpoint,{body,sessionWorld='',requestedWorld=''}={}){
 if(endpoint.startsWith('/api/admin/'))return base;
 const world=['/api/login','/api/register'].includes(endpoint)?String(body?.world||'').trim().toUpperCase():requestedWorld==='TEST'?'TEST':sessionWorld;
 return world==='TEST'?TEST_GAME_API:base;
}
export function mergeTDState(state,td){
 if(!state||state.me?.world!=='TEST'||td?.world!=='TEST'||td.me.id!==state.me.id)return false;
 if(state.td?.serverTime>td.serverTime)return false;state.td=td;const g=state.me.game;g.boxes=td.growth.boxes;g.cash=td.campaign.cash;g.troops=td.campaign.troops;g.heroes=structuredClone(td.growth.heroes);g.inventory=structuredClone(td.growth.inventory);g.shieldUntil=td.campaign.shieldUntil;state.me.shieldUntil=td.campaign.shieldUntil;g.upgrades=td.growth.researchJobs.map(j=>({...j,key:j.item||j.kind}));g.wounded=td.campaign.wounded.map(w=>({...w,amount:Object.values(w.counts).reduce((a,b)=>a+b,0)}));Object.assign(g.levels,td.growth.facilityLevels,{wall:td.growth.wallLevel});return true;
}
export function tdAction(type,params={}){
 if(type==='hero/level'||type==='hero/star')return {type:'td/upgrade',params:{kind:type==='hero/level'?'hero-level':'hero-star',item:params.hero,steps:1}};
 if(type==='item/heal')return {type:'td/heal',params:{}};
 if(type==='item/shield')return {type:'td/shield',params:{item:params.item}};
 if(type==='item/research')return {type:'td/speed',params:{job:params.job,item:params.item||'researchAid'}};
 if(type==='upgrade/start')return {type:'td/upgrade',params:{kind:params.key==='wall'?'wall':params.key==='capacity'?'capacity':'facility',item:params.key,steps:1}};
 return {type,params};
}
