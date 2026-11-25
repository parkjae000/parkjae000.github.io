import {WORLD,ROUTE,lanePoint,ROUTE_LENGTH} from './engine.mjs?v=td-ux-18';
// Cache the illustrated floor and exact battle lane once. Geometry is shared with simulation.
export function makeBattleMap(floor,makeCanvas){
 const canvas=makeCanvas(WORLD.w,WORLD.h),c=canvas.getContext('2d');c.drawImage(floor,0,0,WORLD.w,WORLD.h);
 const path=()=>{c.beginPath();ROUTE.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));};
 c.lineCap='round';c.lineJoin='round';
 c.save();c.translate(0,7);path();c.strokeStyle='#30223878';c.lineWidth=110;c.stroke();c.restore();
 path();c.strokeStyle='#504253';c.lineWidth=102;c.stroke();
 path();c.strokeStyle='#c69148';c.lineWidth=96;c.stroke();
 path();c.strokeStyle='#ffe599';c.lineWidth=91;c.stroke();
 path();c.strokeStyle='#ad7b3e';c.lineWidth=91;c.setLineDash([17,24]);c.stroke();c.setLineDash([]);
 path();c.strokeStyle='#51465d';c.lineWidth=78;c.stroke();
 path();c.strokeStyle='#84758e';c.lineWidth=74;c.stroke();
 path();c.strokeStyle='#93829b';c.lineWidth=67;c.stroke();
 path();c.strokeStyle='#b7a0bc18';c.lineWidth=56;c.setLineDash([3,28]);c.stroke();c.setLineDash([]);
 path();c.strokeStyle='#b7a0bc35';c.lineWidth=2;c.setLineDash([9,25]);c.stroke();c.setLineDash([]);
 // Bolted gold curb lights follow the same curve and make corners readable.
 for(let s=35;s<ROUTE_LENGTH-30;s+=112){for(const offset of [-45,45]){const p=lanePoint(s,offset);c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.fillStyle='#ffe5a4';c.strokeStyle='#ba8544';c.lineWidth=1.4;c.fillRect(-7,-4,14,8);c.strokeRect(-7,-4,14,8);c.fillStyle='#fff8cf';c.fillRect(-3,-2,6,4);c.restore();}}
 return canvas;
}
