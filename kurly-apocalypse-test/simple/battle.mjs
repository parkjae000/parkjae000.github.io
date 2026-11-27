import {soldierStats,simpleFortress,heroBonus} from './model.mjs';
// A single ordinary unit on each side. Simulation is deterministic and server authoritative.
export class SimpleBattle{
 constructor(record){
  this.record=record;this.ticks=0;this.status='running';this.forceTotals={army:record.amount,air:0,navy:0};this.initialA=record.amount;this.initialB=record.defenderAmount||0;
  const ag=record.attackerGrowth,dg=record.snapshot.growth;this.a=soldierStats(ag.forceLevels.army);this.b=soldierStats(dg.forceLevels.army);
  this.attackFactor=.90+.24*((((Math.imul((record.seed??42)>>>0,1664525)+1013904223)>>>0)/4294967296));
  this.a.damage*=1+heroBonus(ag);this.b.damage*=1+heroBonus(dg);
  this.hpA=this.initialA*this.a.hp;this.hpB=this.initialB*this.b.hp;this.xA=.18;this.xB=.82;this.attackA=0;this.attackB=0;
  const f=simpleFortress(dg);this.wallMax=f.wall;this.centerMax=f.center;this.wallHp=f.wall;this.centerHp=f.center;this.turretDamage=f.damage;this.defenderSurvivors=this.initialB;this.deathsByRole={army:0,air:0,navy:0};this.alive=this.initialA;
 }
 step(dt=1/30){
  if(this.status!=='running')return;this.ticks++;const time=this.ticks/30,na=Math.max(0,Math.ceil(this.hpA/this.a.hp-1e-9)),nb=Math.max(0,Math.ceil(this.hpB/this.b.hp-1e-9));
  if(nb&&na){if(this.xB-this.xA>.095){this.xA+=.06*dt;this.xB-=.06*dt;}else{let da=0,db=0;if(time>=this.attackA){this.attackA=time+1.2;da=na*this.a.damage*this.attackFactor;}if(time>=this.attackB){this.attackB=time+1.2;db=nb*this.b.damage;}this.hpA=Math.max(0,this.hpA-db);this.hpB=Math.max(0,this.hpB-da);}}
  else if(na){const target=this.wallHp>0?.77:.88;if(this.xA<target-.07)this.xA=Math.min(target-.07,this.xA+.07*dt);else{if(time>=this.attackA){this.attackA=time+1.2;const damage=na*this.a.damage;if(this.wallHp>0)this.wallHp=Math.max(0,this.wallHp-damage);else this.centerHp=Math.max(0,this.centerHp-damage);}this.hpA=Math.max(0,this.hpA-this.turretDamage*dt);}}
  this.alive=Math.max(0,Math.ceil(this.hpA/this.a.hp-1e-9));this.defenderSurvivors=Math.max(0,Math.ceil(this.hpB/this.b.hp-1e-9));this.deathsByRole.army=this.initialA-this.alive;
  if(this.centerHp<=0)this.status='victory';else if(!this.alive)this.status='defeat';else if(time>=120)this.status='draw';
 }
 retreat(){if(this.status==='running')this.status='retreated';}
 summary(){return {status:this.status,ticks:this.ticks,wallHp:Math.ceil(this.wallHp),centerHp:Math.ceil(this.centerHp),survivors:this.alive,defenderSurvivors:this.defenderSurvivors,deathsByRole:{...this.deathsByRole}};}
}
