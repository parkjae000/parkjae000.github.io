// Shared with the client: coordinates are normalized to the full battlefield.
export const COMBAT_GEOMETRY={version:2,midline:.5,start:{a:.32,b:.68},contactGap:.035,speed:.055,collapseSeconds:1,targets:{W:900/1280,T:978/1280,C:1080/1280}};
export const opposing=side=>side==='a'?'b':'a';
export const firstStructure=hp=>['W','T','C'].find(key=>hp[key]>0)||null;
export function structureFront(side,key){const x=COMBAT_GEOMETRY.targets[key]??COMBAT_GEOMETRY.targets.C;return side==='a'?x:1-x;}
export function turretInRange(side,x){return Number.isFinite(x)&&x>=0&&x<=1&&(side==='a'?x<=.5:x>=.5);}
export function advanceFront(side,x,key,dt){const target=structureFront(side,key),step=COMBAT_GEOMETRY.speed*dt;return side==='a'?Math.min(target,x+step):Math.max(target,x-step);}
