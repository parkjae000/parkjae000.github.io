// Shared economy: the browser previews the same rules the server enforces.
export const BALANCE_VERSION=5;
export const OFFLINE_MINING_MS=8*3600000;
export const CENTER_COST=[0,0,300,800,2000,5000,12000,27000,60000,135000,300000];
export const CENTER_TIME=[0,0,60,600,1800,7200,14400,28800,57600,86400,129600];
export const BASE_COST=[0,0,140,290,590,1210,2470,5070,10390,21300,43670];
export const BASE_TIME=[0,0,20,120,600,1800,5400,10800,21600,43200,86400];
export const FACTOR={mine:1.2,troopAtk:1,troopHp:1,troopSpeed:1.2,capacity:1.15,wall:1,turretDmg:1.25,turretSpeed:1.4};
export function upgradeCost(key,level){return key==='center'?{boxes:CENTER_COST[level],seconds:CENTER_TIME[level]}:{boxes:Math.ceil(BASE_COST[level]*(FACTOR[key]||1)/10)*10,seconds:BASE_TIME[level]};}
export function resourceBaseHp(zone,index){
 // The first parcel teaches the loop in 15 seconds. Deeper rows gradually slow down.
 if(zone===0){if(index===37)return 75;return [1800,1800,1800,1500,1200,900,450,150][Math.floor(index/5)];}
 return 1800*Math.pow(1.5,Math.min(zone,20));
}
