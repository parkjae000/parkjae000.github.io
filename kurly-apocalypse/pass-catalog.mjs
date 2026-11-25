export const RESEARCH_PASSES=[
 {key:'researchAid',minutes:10,label:'10분',price:60},
 {key:'researchHourAid',minutes:60,label:'1시간',price:240},
 {key:'research6hAid',minutes:360,label:'6시간',price:1200},
 {key:'research12hAid',minutes:720,label:'12시간',price:2160}
];
export const BOOST_PASSES=[
 {key:'boost10',minutes:10,label:'10분',price:120},
 {key:'boost30',minutes:30,label:'30분',price:240},
 {key:'boost6h',minutes:360,label:'6시간',price:1920},
 {key:'boost12h',minutes:720,label:'12시간',price:3360}
];
export const FORKLIFT_PASSES=[{key:'forkliftDayTickets',days:1,label:'1일',shopId:'forklift1d',price:2400},{key:'forkliftTickets',days:7,label:'7일'}];
export const SHIELD_PRICES=[300,900,2100,3600];
export const HEAL_PRICE=100;
export const RESEARCH_MINUTES=Object.freeze(Object.assign(Object.create(null),Object.fromEntries(RESEARCH_PASSES.map(p=>[p.key,p.minutes]))));
export const BOOST_MINUTES=Object.freeze(Object.assign(Object.create(null),Object.fromEntries(BOOST_PASSES.map(p=>[p.key,p.minutes]))));
