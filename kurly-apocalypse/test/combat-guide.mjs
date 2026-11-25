import {FORCE_IDS,FORCES,damageMultiplier} from './progression.mjs?v=td-ux-20';
const n=v=>Number(v).toLocaleString('ko-KR',{maximumFractionDigits:2});
export function affinityInfo(type,role){
 const multiplier=damageMultiplier(type,role),percent=Math.round((multiplier-1)*100);
 return {role,name:FORCES[role].name,multiplier,percent,tone:percent>0?'advantage':percent<0?'disadvantage':'even',label:percent>0?'유리':percent<0?'불리':'보통',change:percent===0?'기본 피해':(percent>0?'+':'')+percent+'% 피해'};
}
export const affinityList=type=>FORCE_IDS.map(role=>affinityInfo(type,role));
export function attackGuide(type,st){
 const control=(st.control||100)/100;
 const basic={
  cannon:'빠르게 탄막을 쏘아 작은 범위의 병력을 연속 타격해요.',
  tesla:'가까운 병력 사이를 최대 7개 무리까지 연결해 감전시켜요.',
  ice:'범위 피해와 빙판을 만들고 진입한 병력의 이동을 늦춰요.',
  laser:'조준한 방향으로 사거리 끝까지 직선 관통해요. 길 끝에서 긴 직선 구간을 겨누면 더 많은 병력을 맞힐 수 있어요.',
  frozen:'눈덩이가 터지며 범위 피해와 둔화를 줘요.',
  chilled:'얼음 창이 터지며 범위 피해를 주고, 둔화와 받는 피해 증가를 남겨요.',
  ambient:'파이어볼 폭발로 범위 피해를 주고 화상을 남겨요.',
  cs:'플라즈마 탄이 터지며 범위 피해를 주고 주변 병력을 감전시켜요.',
  beauty:'회전 꽃잎이 주변 병력을 타격하고 잠깐 기절시켜요.',
  returns:'맵 어디든 유성 파편을 떨어뜨려 범위 피해를 줘요.'
 }[type];
 const skill={
  frozen:'눈보라로 범위 피해·둔화·밀치기를 주고, 짧게 얼린 뒤 눈보라 지대를 남겨요.',
  chilled:'빙하가 솟아 범위 피해·빙결·둔화를 주고, 받는 피해가 증가하는 지대를 남겨요.',
  ambient:'강한 범위 폭발 뒤 화염벽을 남겨 진입한 병력에 지속 피해와 화상을 줘요.',
  cs:`최대 ${st.skillChainTargets||10}개 병력 무리를 잇는 연쇄 번개로 범위 피해와 기절을 줘요.`,
  beauty:st.signature?'더 넓은 블랙홀 지대에서 둔화·기절을 주고 받는 피해를 35% 늘려요.':'블랙홀이 범위 피해·기절·밀치기를 주고 지대를 남겨요.',
  returns:st.skillEcho?'전역 메테오 뒤 0.45초 후 45% 피해의 추가 폭발이 발생해요.':'전역 메테오로 범위 피해와 밀치기를 줘요.'
 }[type];
 const reach=st.globalRange?'사거리 전역':'사거리 '+n(st.range),area=radius=>'반경 '+n(radius)+' · 지름 '+n(radius*2);
 const effects=[];if(st.skillEcho)effects.push('추가 폭발 '+area(st.skillRadius*.75));if(st.skillStunSeconds)effects.push('기절 '+n(st.skillStunSeconds)+'초');if(st.freezeSeconds)effects.push('빙결 '+n(st.freezeSeconds)+'초');if(st.slowSeconds)effects.push('둔화 '+n(st.slowSeconds)+'초');if(st.weaknessSeconds)effects.push('받는 피해 +'+n((st.weaknessMultiplier-1)*100)+'% · '+n(st.weaknessSeconds)+'초');
 return {basic:{name:st.basic||st.name,description:basic,facts:`피해 ${n(st.damage)} · ${n(st.interval)}초마다 · ${reach} · ${type==='laser'?'관통 길이 '+n(st.range)+' · 폭 '+n(st.beamWidth):area(st.splash)} · 기본 타격 인원 ${n(st.hits)}명`},skill:skill?{name:st.signature?.name||st.desc,description:skill,facts:`피해 ${n(st.skillDamage)} · 재사용 ${n(st.cooldown)}초 · ${reach} · ${area(st.skillRadius)}${st.skillChainTargets?' · 최대 '+st.skillChainTargets+'무리 · 연쇄 거리 '+n(st.chainRange):''}`,trigger:st.globalRange?'전장 어디서든 자동 사용':'사거리 안에 병력이 있을 때 자동 사용',fieldSeconds:['frozen','chilled','ambient','beauty'].includes(type)?st.fieldDuration:null,effects:effects.join(' · ')}:null,control};
}
