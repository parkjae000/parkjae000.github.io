export const SIMPLE_VERSION='simple-1';
export const SIMPLE_RELEASE='20261127-v300-simple';
export const n=v=>Math.floor(Number(v)||0).toLocaleString('ko-KR');
export const short=v=>v>=1e12?(v/1e12).toFixed(1)+'조':v>=1e8?(v/1e8).toFixed(1)+'억':v>=1e4?(v/1e4).toFixed(1)+'만':n(v);
export const soldierStats=(level=1)=>({level,hp:Math.round(250*1.22**(level-1)),damage:Math.round(24*1.18**(level-1)),interval:1.2});
export function simpleFortress(growth){return {wall:Math.round(600*1.22**((growth.wallLevel||1)-1)),center:Math.round(1500*1.22**((growth.facilityLevels?.center||1)-1)),damage:Math.round(8*Object.values(growth.towerLevels||{cannon:1}).reduce((n,l)=>n+1.2**(l-1),0)/Math.max(1,Object.keys(growth.towerLevels||{cannon:1}).length))};}
export const toolBonus=level=>1+.04*Math.max(0,Math.min(19,(level||1)-1));
export const toolCost=level=>2*level;
export const toolNames=['나무 곡괭이','강철 곡괭이','합금 곡괭이','수정 곡괭이','황금 곡괭이','전설 곡괭이'];
export const toolName=level=>toolNames[level>=20?5:Math.min(4,Math.floor(((level||1)-1)/4))];
export function simpleResourceHp(zone,index=0){
 if(zone===0)return index===37?75:[1800,1800,1800,1500,1200,900,450,150][Math.floor(index/5)];
 const expectedLevel=Math.min(20,1+zone/5),research=Math.min(29,zone/12),seconds=12+Math.min(33,zone*.5);
 return Math.min(9e14,Math.round(5*2.4**(expectedLevel-1)*1.2**research*seconds*1.035**Math.max(0,zone-95)));
}
export function quantity(value,stock=1000){const q=Number(value);if(!Number.isSafeInteger(q)||q<1||q>1000||q>stock)throw Error('보유 수량 안에서 1~1,000개를 입력해 주세요.');return q;}
const heroValue=(id,h)=>(.005*h.level+.025*h.star)*(['cs','beauty','returns'].includes(id)?1.35:1);
export const heroId=g=>Object.entries(g.heroes||{}).filter(([,h])=>h.star>0).sort((a,b)=>heroValue(b[0],b[1])-heroValue(a[0],a[1])||a[0].localeCompare(b[0]))[0]?.[0]||null;
export const heroBonus=g=>{if(g.noHeroBonus)return 0;const id=heroId(g),h=g.heroes?.[id];return h?Math.min(.85,heroValue(id,h)):0;};

export function simplePower(t){const st=soldierStats(t.growth.forceLevels.army),f=simpleFortress(t.growth),count=t.campaign.troops||0,attack=Math.round(count*(st.hp*.18+st.damage/st.interval*8)*(1+heroBonus(t.growth))),defense=Math.round(attack+f.wall*.1+f.center*.1+f.damage*8);return {attack,defense,total:attack+defense};}

// Consume the selected XP, retain fractional level progress, and stop spending at cap.
export function heroXpPlan(hero,stock,requested){
 const q=Number(requested);if(!Number.isSafeInteger(q)||q<1||q>1e9)throw Error('사용할 XP를 정수로 입력해 주세요.');
 if(!hero?.star||hero.level>=100)throw Error('강화할 파트장을 확인해 주세요.');
 let need=0;for(let level=hero.level;level<100;level++)need+=50*level;
 const used=Math.min(q,Math.max(0,Math.floor(stock||0)),Math.max(0,need-(hero.xp||0)));
 let level=hero.level,xp=(hero.xp||0)+used;while(level<100&&xp>=50*level){xp-=50*level;level++;}
 return {used,level,xp};
}
