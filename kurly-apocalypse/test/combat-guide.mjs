import {FORCE_IDS,FORCES,damageMultiplier} from './progression.mjs?v=td-ux-12';
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
  cs:'최대 10개 병력 무리를 잇는 연쇄 번개로 범위 피해와 기절을 줘요.',
  beauty:'블랙홀이 범위 피해·기절·밀치기를 주고, 병력을 저지하는 지대를 남겨요.',
  returns:'맵 전체에서 대상을 골라 메테오를 낙하시켜 강한 범위 피해와 밀치기를 줘요.'
 }[type];
 return {basic:{name:st.basic||st.name,description:basic,facts:`피해 ${n(st.damage)} · ${n(st.interval)}초마다 · ${type==='laser'?'관통 길이 '+n(st.range)+' · 폭 '+n(st.beamWidth):n(st.splash)+' 범위'}`},skill:skill?{name:st.desc,description:skill,facts:`피해 ${n(st.skillDamage)} · 재사용 ${n(st.cooldown)}초 · ${n(st.skillRadius)} 범위`,trigger:st.globalRange?'맵 전체의 병력이 대상 · 자동 사용':'사거리 안에 병력이 있을 때 자동 사용',fieldSeconds:['frozen','chilled','ambient','beauty'].includes(type)?st.fieldDuration:null}:null,control};
}
