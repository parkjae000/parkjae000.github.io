export const MAX_ARMY=100_000_000;
export const CAPACITY_BASE=1000;
export const CAPACITY_STEP=100;
export const MAX_CAPACITY_LEVEL=1+(MAX_ARMY-CAPACITY_BASE)/CAPACITY_STEP;
export const TOWER_IDS=['cannon','tesla','ice','laser'];
export const FORCE_IDS=['army','air','navy'];
export const FORCES={
 army:{name:'육군',hp:105,speed:112,siege:7.5,color:'#ffd278',identity:'균형 잡힌 진격',knockbackResist:0,slowResist:0},
 air:{name:'공군',hp:75,speed:140,siege:5,color:'#8feaff',identity:'빠른 기동 · 밀치기 저항 40%',knockbackResist:.4,slowResist:0},
 navy:{name:'해군',hp:140,speed:90,siege:9,color:'#a3bcff',identity:'고내구 공성 · 둔화 저항 25%',knockbackResist:0,slowResist:.25}
};
// Soft counters: every defense can damage all three branches. No hard immunity.
export const MATCHUPS={
 cannon:{army:1.5,air:1,navy:.7},tesla:{army:.75,air:1.5,navy:1.1},ice:{army:1.35,air:.7,navy:1.1},laser:{army:1,air:.8,navy:1.8},
 frozen:{army:1.4,air:.7,navy:1},chilled:{army:1,air:.75,navy:1.65},ambient:{army:1.6,air:.65,navy:1.1},
 cs:{army:.95,air:1.6,navy:.8},beauty:{army:1.25,air:1,navy:1.1},returns:{army:1,air:.7,navy:1.65}
};
export const damageMultiplier=(type,role)=>MATCHUPS[type]?.[role]??1;
export const rangeLabel=st=>st.globalRange?'전역':(st.range<=210?'근거리 ':st.range<=380?'중거리 ':'장거리 ')+Math.round(st.range);
export const TOWER_DEFS={
 cannon:{name:'게틀링',kind:'tower',color:'#ffbf55',range:170,interval:.13,damage:11,splash:50,hits:11,desc:'근거리 육군 제압',identity:'짧은 사거리 · 빠른 탄막'},
 tesla:{name:'전기탑',kind:'tower',color:'#bd93ff',range:285,interval:.85,damage:40,splash:95,hits:22,desc:'중거리 대공 연쇄 감전',identity:'공군에 강한 연쇄 번개'},
 ice:{name:'빙결탑',kind:'tower',color:'#83eaff',range:225,interval:1.65,damage:26,splash:95,hits:30,desc:'중거리 육군 둔화',identity:'빙판으로 진격을 지연'},
 laser:{name:'레이저',kind:'tower',color:'#65dbff',range:440,interval:1.65,damage:70,splash:60,hits:25,desc:'장거리 해군 관통',identity:'중장갑 함선을 멀리서 관통'}
};
export const HERO_DEFS={
 frozen:{name:'냉동',kind:'hero',color:'#86deff',range:180,interval:1.15,damage:34,splash:92,hits:28,desc:'화이트아웃',basic:'눈덩이 투척',identity:'근거리 눈보라 · 육군 저지',rarity:'일반',cooldown:7.6,skillMultiplier:4.8},
 chilled:{name:'냉장',kind:'hero',color:'#8aefcf',range:310,interval:1.25,damage:27,splash:73,hits:23,desc:'빙하 장벽',basic:'얼음 창',identity:'중거리 빙하 · 해군 저격',rarity:'일반',cooldown:7.8,skillMultiplier:4.3},
 ambient:{name:'상온',kind:'hero',color:'#ffb85e',range:145,interval:1.35,damage:49,splash:98,hits:32,desc:'화염 장벽',basic:'파이어볼',identity:'초근거리 고화력 · 육군 소각',rarity:'일반',cooldown:7.5,skillMultiplier:5.2},
 cs:{name:'CS',kind:'hero',color:'#6bcaff',range:560,interval:1.35,damage:25,splash:65,hits:20,desc:'뇌전 폭풍',basic:'플라즈마 탄',identity:'장거리 대공 지원',rarity:'희귀',cooldown:9.8,skillMultiplier:5.6},
 beauty:{name:'뷰티',kind:'hero',color:'#ff9ee4',range:350,interval:1.20,damage:27,splash:78,hits:24,desc:'만개 블랙홀',basic:'회전 꽃잎',identity:'중거리 광역 제어',rarity:'희귀',cooldown:8.8,skillMultiplier:5.6},
 returns:{name:'회수',kind:'hero',color:'#ffd276',range:0,globalRange:true,interval:2.5,damage:23,splash:70,hits:15,desc:'메테오 낙하',basic:'유성 파편',identity:'전역 메테오 · 해군 압박',rarity:'희귀',cooldown:13.0,skillMultiplier:6.2}
};
export const COMPOSITIONS={balanced:{name:'균형',ratios:[.4,.3,.3]},army:{name:'육군 중심',ratios:[.7,.15,.15]},air:{name:'공군 중심',ratios:[.15,.7,.15]},navy:{name:'해군 중심',ratios:[.15,.15,.7]}};
export function forceComposition(amount,key='balanced'){const r=(COMPOSITIONS[key]||COMPOSITIONS.balanced).ratios,a=Math.floor(amount*r[0]),b=Math.floor(amount*r[1]);return {army:a,air:b,navy:amount-a-b};}
export function forceStats(g,id,level=g.forceLevels[id]){const d=FORCES[id];return {...d,level,hp:Math.round(d.hp*(1+.08*(level-1))),siege:Number((d.siege*(1+.07*(level-1))).toFixed(2))};}
export const STAR_COST=[0,20,40,80,160];
export function defaultGrowth(){return {boxes:3_000_000_000_000,capacityLevel:91,towerLevels:{cannon:5,tesla:5,ice:5,laser:5},wallLevel:5,forceLevels:{army:5,air:5,navy:5},heroes:Object.fromEntries(Object.keys(HERO_DEFS).map(id=>[id,{level:12,star:3,xp:200,shards:500}])),facilityLevels:{mine:1,laborCost:1,lossDiscovery:1,careerLevel:1,mergeLuck:1,center:1,wallRepair:1,wallReflect:1},staffCount:1,researchJobs:[],inventory:{normalHeroXp:50000,rareHeroXp:50000,researchAid:2,researchHourAid:1}};}
export const capacity=g=>Math.min(MAX_ARMY,CAPACITY_BASE+CAPACITY_STEP*((g.capacityLevel||1)-1));
export function towerStats(g,id,level=g.towerLevels[id]){const d=TOWER_DEFS[id],n=Math.max(0,level-1);return {...d,level,damage:Math.round(d.damage*1.3**n),interval:d.interval/Math.min(1.8,1+n*.025),range:d.range+Math.min(55,n*2),hits:d.hits+n*2,splash:d.splash+n*1.1,...(id==='laser'?{beamWidth:72}:{})};}
export function heroStats(g,id,override){const d=HERO_DEFS[id],h=override||g.heroes[id];if(!h?.star)return null;const mult=(d.rarity==='희귀'?1.25:1)*(1+.12*(h.level-1))*(1+.3*(h.star-1));const damage=Math.round(d.damage*mult),control=100+(h.level-1)*3+(h.star-1)*18;return {...d,level:h.level,star:h.star,xp:h.xp,damage,control,skillDamage:Math.round(damage*d.skillMultiplier*(1+.08*(h.star-1))),range:d.globalRange?0:d.range+(h.star-1)*7,splash:d.splash+(h.level-1)*.7+(h.star-1)*5,hits:d.hits+Math.floor(h.level/3)+h.star*3,interval:d.interval/(1+.025*(h.star-1)),cooldown:d.cooldown/(1+.045*(h.star-1)),skillRadius:(d.splash+(h.level-1)*.7+(h.star-1)*5)*1.8,fieldDuration:4.4*control/169,duration:1.8*control/100};}
export const wallStats=g=>({hp:Math.round(44000*1.20**((g.wallLevel||1)-1)),level:g.wallLevel||1});
// V4 prototype hydration only; never use this automatic research mapping for live migration.
export function migrateLegacyGrowth(legacy){const g=defaultGrowth();if(!legacy)return g;if(legacy.heroes)for(const id of Object.keys(HERO_DEFS)){if(legacy.heroes[id])g.heroes[id]={...legacy.heroes[id]};}if(legacy.migrations)g.migrations=structuredClone(legacy.migrations);if(legacy.inventory)g.inventory={...legacy.inventory};for(const key of ['facilityLevels','staffCount','researchJobs','researchSeq'])if(legacy[key]!==undefined)g[key]=structuredClone(legacy[key]);if(Number.isFinite(legacy.boxes))g.boxes=legacy.boxes;
 for(const id of TOWER_IDS)g.towerLevels[id]=legacy.towerLevels?.[id]||legacy.levels?.turretDmg||g.towerLevels[id];g.forceLevels={army:legacy.forceLevels?.army||legacy.levels?.spearDamage||5,air:legacy.forceLevels?.air||legacy.levels?.rangedDamage||5,navy:legacy.forceLevels?.navy||legacy.levels?.shieldDamage||5};g.wallLevel=legacy.wallLevel||legacy.levels?.wall||5;g.capacityLevel=Math.max(1,Math.min(MAX_CAPACITY_LEVEL,legacy.capacityLevel||91));return g;}
export function upgradeGrowth(g,kind,id,steps=1){
 if(!Number.isSafeInteger(steps)||steps<1)throw Error('강화 횟수를 확인해 주세요.');
 let cost=0,level,target;
 if(kind==='capacity'){level=g.capacityLevel;target=level+steps;if(target>MAX_CAPACITY_LEVEL)throw Error('병력은 최대 1억 명까지 준비돼요.');cost=steps*(200+4*level)+2*steps*(steps-1);}
 else if(kind==='tower'){if(!TOWER_IDS.includes(id))throw Error('포탑을 선택해 주세요.');level=g.towerLevels[id];target=level+steps;if(target>40)throw Error('포탑은 최대 Lv.40이에요.');for(let n=level;n<target;n++)cost+=Math.round(1200*1.55**(n-1));}
 else if(kind==='force'){if(!FORCE_IDS.includes(id))throw Error('병력을 선택해 주세요.');level=g.forceLevels[id];target=level+steps;if(target>40)throw Error('병력 연구는 최대 Lv.40이에요.');for(let n=level;n<target;n++)cost+=Math.round(1000*1.5**(n-1));}
 else if(kind==='wall'){level=g.wallLevel;target=level+steps;if(target>40)throw Error('방벽은 최대 Lv.40이에요.');for(let n=level;n<target;n++)cost+=Math.round(1200*1.55**(n-1));}
 else if(kind==='hero-level'){const h=g.heroes[id];if(!h?.star||h.level>=100)throw Error('파트장 레벨을 확인해 주세요.');const key=HERO_DEFS[id].rarity==='희귀'?'rareHeroXp':'normalHeroXp',needed=50*h.level;if(h.xp+(g.inventory[key]||0)<needed)throw Error('경험치 교본이 부족해요.');const personal=Math.min(h.xp,needed);h.xp-=personal;g.inventory[key]-=needed-personal;h.level++;return {message:HERO_DEFS[id].name+' Lv.'+h.level};}
 else if(kind==='hero-star'){const h=g.heroes[id],needed=STAR_COST[h?.star];if(!needed||h.star>=5||h.shards<needed)throw Error('성급 강화에 필요한 조각을 확인해 주세요.');h.shards-=needed;h.star++;return {message:HERO_DEFS[id].name+' '+h.star+'성 달성'};}
 else throw Error('강화 항목을 확인해 주세요.');
 if(!Number.isSafeInteger(cost)||cost>g.boxes)throw Error('택배 박스가 부족해요.');g.boxes-=cost;
 if(kind==='capacity')g.capacityLevel=target;else if(kind==='tower')g.towerLevels[id]=target;else if(kind==='force')g.forceLevels[id]=target;else g.wallLevel=target;
 return {cost,message:kind==='capacity'?`출격 한도 +${100*steps}명`:kind==='tower'?TOWER_DEFS[id].name+' Lv.'+target:kind==='force'?FORCES[id].name+' Lv.'+target:'방벽 Lv.'+target};
}
export const short=n=>n>=1e12?(n/1e12).toFixed(n%1e12?1:0)+'조':n>=1e8?(n/1e8).toFixed(n%1e8?1:0)+'억':n>=1e4?(n/1e4).toFixed(n%1e4?1:0)+'만':Math.floor(n).toLocaleString('ko-KR');

// Quote previews use the same mutation function as purchase; preview resources never leak to g.
export function upgradeQuote(g,kind,id,steps=1){
 const next=structuredClone(g),before={boxes:g.boxes,normalHeroXp:g.inventory.normalHeroXp||0,rareHeroXp:g.inventory.rareHeroXp||0};
 if(kind.startsWith('hero-')&&steps!==1)return {enabled:false,reason:'파트장은 한 단계씩 강화해요.'};
 next.boxes=Number.MAX_SAFE_INTEGER;for(const k of ['normalHeroXp','rareHeroXp'])next.inventory[k]=100000000;
 if(kind==='hero-star'&&next.heroes[id])next.heroes[id].shards=100000000;
 let result;try{result=upgradeGrowth(next,kind,id,steps);}catch(e){return {enabled:false,reason:e.message};}
 let resource='박스',cost=result.cost||0,owned=g.boxes;
 if(kind==='hero-level'){resource=HERO_DEFS[id].rarity==='희귀'?'희귀 XP':'일반 XP';cost=50*g.heroes[id].level;owned=g.heroes[id].xp+(g.inventory[HERO_DEFS[id].rarity==='희귀'?'rareHeroXp':'normalHeroXp']||0);}
 if(kind==='hero-star'){resource='전용 조각';cost=STAR_COST[g.heroes[id].star];owned=g.heroes[id].shards;}
 // Restore wallets: next carries only the quoted stat progression, not synthetic resources.
 next.boxes=g.boxes;next.inventory=structuredClone(g.inventory);if(kind==='hero-star')next.heroes[id].shards=g.heroes[id].shards;
 return {enabled:owned>=cost,reason:owned>=cost?'':resource+' 부족',cost,owned,resource,nextGrowth:next,steps};
}
