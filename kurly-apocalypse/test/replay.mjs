import {ConquestBattle as ConquestBattleV10} from './conquest-battle-v10.mjs?v=td-ux-16';
import {ConquestBattle as LegacyConquestBattle} from './conquest-battle-legacy.mjs?v=td-ux-16';
import {ConquestBattle} from './conquest-battle.mjs?v=td-ux-16';
import {Battle} from './engine.mjs?v=td-ux-16';
import {TD_ENGINE_VERSION} from './campaign-review.mjs?v=td-ux-16';
export function battleFromRecord(record){if(!['td-test-8','td-test-9','td-test-10',TD_ENGINE_VERSION].includes(record.engineVersion))throw Error('이 기록은 이전 버전 전투 재생기가 필요해요.');return new (record.mode==='conquest'?(record.engineVersion===TD_ENGINE_VERSION?ConquestBattle:record.engineVersion==='td-test-10'?ConquestBattleV10:LegacyConquestBattle):Battle)(record.snapshot.items,{combatVersion:record.engineVersion==='td-test-8'?8:9,amount:record.amount,seed:record.seed,growth:record.snapshot.growth,attackerGrowth:record.attackerGrowth,composition:record.composition,forceTotals:record.forceTotals,initialState:record.initialState,strength:record.snapshot.strength??1,fortressProfile:record.snapshot.fortressProfile,support:record.snapshot.support,routePlan:record.routePlan||'balanced'});}
export class Replay{
 constructor(record){this.record=structuredClone(record);this.battle=battleFromRecord(record);this.endTick=record.endTick;this.finished=false;this.speed=1;this.accumulator=0;this.elapsed=0;this.timelapse=false;this.paused=false;}
 setSpeed(speed){this.timelapse=false;this.speed=speed;this.paused=false;}
 setTimelapse(){this.timelapse=true;this.speed=Math.max(1,(this.endTick-this.battle.ticks)/30/10);this.paused=false;}
 advanceOne(){if(this.finished)return;const b=this.battle;if(b.ticks<this.endTick&&b.status==='running')b.step(1/30);if(b.ticks>=this.endTick||b.status!=='running'){if(this.record.status==='retreated'&&b.status==='running')b.retreat();this.finished=true;}}
 tick(dt){if(this.finished||this.paused)return;this.elapsed+=dt;this.accumulator+=dt*this.speed;while(this.accumulator+1e-10>=1/30&&!this.finished){this.accumulator-=1/30;this.advanceOne();}}
 skip(){while(!this.finished)this.advanceOne();}
}
