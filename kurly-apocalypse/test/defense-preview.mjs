import {SIEGE_PADS} from './siege-geometry.mjs?v=td-ux-15';
import {paintSiegeWall} from './siege-map.mjs?v=td-ux-15';
import {siegeLayout} from './conquest.mjs?v=td-ux-15';
import {PADS,WALL_POINT,WORLD} from './engine.mjs?v=td-ux-15';
import {CONQUEST_PADS,CONQUEST_ROUTES} from './conquest-geometry.mjs?v=td-ux-15';
import {HERO_DEFS,TOWER_DEFS} from './progression.mjs?v=td-ux-15';
export function homeDefenseTarget(session){return {id:session.latest.me.id,name:'내 센터',mine:true,home:true,snapshot:{items:session.latest.items,growth:session.growth}};}
export function defensePreviewModel(session,target,conquest=false){
 if(!target?.snapshot)return null;
 let snapshot=target.snapshot,custom=false;
 if(target.home){snapshot={...snapshot,items:session.latest.items,growth:session.growth};custom=true;}
 else if(target.mine){const own=session.latest.outposts?.[target.id];custom=Array.isArray(own?.items);snapshot={...snapshot,items:custom?own.items:snapshot.items,growth:session.growth};}
 if(conquest)snapshot={...snapshot,items:siegeLayout(snapshot.items)};
 const items=snapshot.items||[],pads=conquest?SIEGE_PADS:PADS;
 const positions=items.map(item=>({...item,position:pads.find(p=>p.id===item.pad),level:HERO_DEFS[item.type]?snapshot.growth.heroes[item.type]?.level||1:snapshot.growth.towerLevels[item.type]||1})).filter(item=>item.position);
 const towerLevels=positions.filter(p=>TOWER_DEFS[p.type]).map(p=>p.level),low=Math.min(...towerLevels),high=Math.max(...towerLevels),levelLabel=towerLevels.length?'Lv.'+low+(low===high?'':'~'+high):'없음';
 const source=target.home?'내 센터 저장 배치':target.mine?(custom?'내 정복지 저장 배치':'정복지 기본 배치'):conquest&&!target.ownerId?'중립 수비 배치':'상대 저장 배치';
 return {id:target.id,name:target.name,conquest,custom,source,levelLabel,snapshot,positions,towers:items.filter(i=>TOWER_DEFS[i.type]).length,heroes:items.filter(i=>HERO_DEFS[i.type]).length,key:JSON.stringify([target.id,conquest,items,snapshot.growth.towerLevels,Object.fromEntries(Object.entries(snapshot.growth.heroes||{}).map(([id,h])=>[id,[h.level,h.star]])),snapshot.growth.wallLevel,snapshot.initialState])};
}
export function drawDefensePreview(model,art,makeCanvas){
 const canvas=makeCanvas(768,512),c=canvas.getContext('2d');c.scale(.5,.5);c.drawImage(model.conquest?art.siegeMap:art.map,0,0,WORLD.w,WORLD.h);
 const sprite=(image,x,y,h)=>{if(image)c.drawImage(image,x-image.width/image.height*h/2,y-h,image.width/image.height*h,h);};
 sprite(art.hq,115,520,205);sprite(art.hq,1415,520,205);
 if(model.conquest)paintSiegeWall(c,art);else sprite(art.gates[0],WALL_POINT.x,WALL_POINT.y+33,165);
 for(const [i,item] of model.positions.entries()){
  const p=item.position,image=HERO_DEFS[item.type]?art.heroes[item.type][0]:art[item.type];sprite(image,p.x,p.y,HERO_DEFS[item.type]?125:142);
  c.fillStyle='#4e3256';c.strokeStyle='#ffe59d';c.lineWidth=3;c.beginPath();c.arc(p.x+39,p.y-99,17,0,Math.PI*2);c.fill();c.stroke();
  c.fillStyle='#fff2c7';c.font='900 23px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),p.x+39,p.y-98);
 }
 return canvas;
}
