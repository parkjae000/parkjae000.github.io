// Inventory of the inspected 2.2.7 source. This is a read-only decision aid, not a migration policy.
export const LEGACY_RESEARCH=[
 ['mine','채굴 효율','채굴 유지'],['laborCost','일용직 인건비 감소','채굴 유지'],['lossDiscovery','로스 발견','채굴 유지'],['careerLevel','경력 증가','채굴 유지'],['mergeLuck','경력 확률','채굴 유지'],
 ['center','센터 레벨','시설 유지 제안'],['wall','방벽 내구도','시설 유지 제안'],['wallRepair','방벽 자가 수리','시설 유지 제안'],
 ['capacity','사원 수용 한도','환급 후 재연구 제안'],['turretDmg','포탑 공격력','환급 후 재연구 제안'],['turretSpeed','포탑 공격속도','환급 후 재연구 제안'],['wallReflect','방벽 반사 피해','환급 후 재연구 제안'],
 ['rangedDamage','총병 공격력','환급 후 재연구 제안'],['rangedHp','총병 체력','환급 후 재연구 제안'],['rangedSpeed','총병 연사속도','환급 후 재연구 제안'],['rangedPrecision','정밀 조준','환급 후 재연구 제안'],['rangedCritDmg','급소 사격','환급 후 재연구 제안'],
 ['spearDamage','창병 공격력','환급 후 재연구 제안'],['spearHp','창병 체력','환급 후 재연구 제안'],['spearSpeed','연속 찌르기','환급 후 재연구 제안'],['spearLeech','전투 회복','환급 후 재연구 제안'],
 ['shieldDamage','방패병 공격력','환급 후 재연구 제안'],['shieldHp','방패병 체력','환급 후 재연구 제안'],['shieldSpeed','방패 타격속도','환급 후 재연구 제안'],['shieldGuard','방패 방어술','환급 후 재연구 제안'],
 ['troopAtk','구형 사원 공격력','구형 투자 이력 별도 검산'],['troopHp','구형 사원 체력','구형 투자 이력 별도 검산'],['troopSpeed','구형 사원 공격속도','구형 투자 이력 별도 검산'],['troopCritChance','구형 사원 치명타 확률','구형 투자 이력 별도 검산'],['troopCritDmg','구형 사원 치명타 피해','구형 투자 이력 별도 검산'],['troopLeech','구형 사원 피흡','구형 투자 이력 별도 검산']
].map(([key,name,proposal])=>({key,name,proposal}));
export function researchInventory(game){return LEGACY_RESEARCH.map(def=>({...def,level:game.levels?.[def.key]||1,pending:(game.upgrades||[]).filter(job=>job.key===def.key).map(job=>({...job})),decision:'미확정'}));}
