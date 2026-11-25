import {SIEGE_PADS,siegeSlotAccepts} from './siege-geometry.mjs?v=td-ux-16';
import {PADS,CATALOG} from './engine.mjs?v=td-ux-16';
import {CONQUEST_PADS} from './conquest-geometry.mjs?v=td-ux-16';
export const editorPads=session=>session.scope==='home'?PADS:SIEGE_PADS;
export function hitDefense(items,pads,point){
 return [...items].map(item=>({...item,position:pads.find(p=>p.id===item.pad)})).filter(item=>item.position&&Math.abs(point.x-item.position.x)<=58&&point.y>=item.position.y-140&&point.y<=item.position.y+38).sort((a,b)=>b.position.y-a.position.y||Math.abs(point.x-a.position.x)-Math.abs(point.x-b.position.x))[0]||null;
}
export class EditorInteraction{
 constructor(session,renderer,{changed=()=>{}}={}){this.s=session;this.r=renderer;this.changed=changed;this.pointers=new Map();this.gesture=null;this.pinch=null;}
 down(id,point){
  this.pointers.set(id,point);if(this.pointers.size===2){this.s.editorDrag=null;this.gesture=null;const [a,b]=this.pointers.values();this.pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:this.s.camera.zoom};this.changed();return;}
  const world=this.r.toWorld(this.s,point.x,point.y),item=this.s.mode==='design'?hitDefense(this.s.editor.items,editorPads(this.s),world):null;
  if(item){this.s.editor.select(item.id);this.s.rangePreview=null;this.s.uiVersion++;}
  this.gesture={id,start:point,last:point,moved:false,itemId:item?.id,offset:item?{x:item.position.x-world.x,y:item.position.y-world.y}:null};this.changed();
 }
 move(id,point){
  if(!this.pointers.has(id))return;this.pointers.set(id,point);
  if(this.pointers.size===2&&this.pinch){const [a,b]=this.pointers.values();this.s.camera.zoom=this.pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(10,this.pinch.distance);this.s.follow=false;this.s.clampCamera();return;}
  const g=this.gesture;if(!g||g.id!==id)return;const distance=Math.hypot(point.x-g.start.x,point.y-g.start.y);if(distance>=9)g.moved=true;
  if(g.moved&&g.itemId&&this.s.mode==='design'){
   const p=this.r.toWorld(this.s,point.x,point.y),world={x:p.x+g.offset.x,y:p.y+g.offset.y},nearest=editorPads(this.s).filter(p=>this.s.scope==='home'||siegeSlotAccepts(p.id,CATALOG[this.s.editor.items.find(i=>i.id===g.itemId)?.type]?.kind)).map(pad=>({pad,distance:Math.hypot(pad.x-world.x,pad.y-world.y)})).sort((a,b)=>a.distance-b.distance)[0];
   this.s.editorDrag={id:g.itemId,world,pad:nearest?.distance<=78?nearest.pad:null};this.s.uiVersion++;this.changed();
  }else if(g.moved)this.s.pan(point.x-g.last.x,point.y-g.last.y);
  g.last=point;
 }
 up(id,point){
  const g=this.gesture,wasPinching=!!this.pinch;this.pointers.delete(id);this.pinch=null;this.gesture=null;
  if(wasPinching){this.s.editorDrag=null;this.pointers.clear();this.changed();return;}
  if(!g||g.id!==id)return;
  if(g.itemId&&g.moved){const drop=this.s.editorDrag?.pad;const result=drop?this.s.editor.move(g.itemId,drop.id):{ok:false,message:'발판 위에 놓아 주세요. 원래 배치는 유지돼요.'};this.s.editorDrag=null;this.s.notify(result.message);this.changed();return result;}
  this.s.editorDrag=null;
  if(!g.moved&&!g.itemId&&this.s.mode==='design'){const world=this.r.toWorld(this.s,point.x,point.y),pad=editorPads(this.s).find(p=>Math.hypot(p.x-world.x,p.y-world.y)<46);if(pad){const moving=this.s.editor.items.find(i=>i.id===this.s.editor.selected),kind=CATALOG[this.s.editor.tool]?.kind,max=this.s.scope==='home'?6:kind==='tower'?4:2;if(!moving&&this.s.editor.items.filter(i=>CATALOG[i.type].kind===kind).length>=max){this.s.notify((kind==='tower'?'포탑':'파트장')+'은 최대 '+max+(kind==='tower'?'기':'명')+'까지 배치해요.');}else this.s.action('pad',pad.id);}else{this.s.editor.selected=null;this.s.rangePreview=null;this.s.uiVersion++;}}
  this.changed();
 }
 cancel(){this.pointers.clear();this.gesture=null;this.pinch=null;this.s.editorDrag=null;this.changed();}
}
