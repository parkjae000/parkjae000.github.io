import {WORLD} from './engine.mjs?v=td-ux-20';
import {CONQUEST_ROUTES,conquestPoint,LANE_NAMES} from './conquest-geometry.mjs?v=td-ux-20';
export function makeConquestMap(floor,makeCanvas){
 const canvas=makeCanvas(WORLD.w,WORLD.h),c=canvas.getContext('2d');c.drawImage(floor,0,0,WORLD.w,WORLD.h);c.lineCap='round';c.lineJoin='round';
 for(const [i,r] of CONQUEST_ROUTES.entries()){
  const path=()=>{c.beginPath();r.points.forEach((p,k)=>k?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));};
  for(const [width,color] of [[99,'#3c304d'],[92,'#e8bd68'],[86,'#705769'],[74,'#9786a3'],[64,'#b9a3bc55']]){path();c.lineWidth=width;c.strokeStyle=color;c.stroke();}
  path();c.strokeStyle=['#8be4ff','#ffe39f','#ccb0ff'][i];c.lineWidth=3;c.setLineDash([12,23]);c.stroke();c.setLineDash([]);
  for(let s=50;s<r.length-120;s+=105)for(const offset of [-43,43]){const p=conquestPoint(r,s,offset);c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.fillStyle='#fff0af';c.fillRect(-6,-3,12,6);c.restore();}
  const p=conquestPoint(r,r.wallS-135);c.fillStyle='#392b53e8';c.beginPath();c.roundRect(p.x-79,p.y-76,158,36,9);c.fill();c.strokeStyle=['#8be4ff','#ffe39f','#ccb0ff'][i];c.lineWidth=2;c.stroke();c.font='bold 20px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff0cf';c.fillText(LANE_NAMES[i]+' 진입로',p.x,p.y-58);
 }
 // Central shared kill zone: all three roads converge under the owner's defenses.
 c.strokeStyle='#e9bd6c';c.lineWidth=4;c.setLineDash([10,8]);c.beginPath();c.ellipse(1265,495,120,155,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
 return canvas;
}
