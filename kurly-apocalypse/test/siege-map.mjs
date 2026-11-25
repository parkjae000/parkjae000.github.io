import {WORLD} from './engine.mjs?v=td-ux-17';
import {SIEGE,SIEGE_PADS} from './siege-geometry.mjs?v=td-ux-17';
export function makeSiegeMap(floor,makeCanvas,pads=SIEGE_PADS){
 const canvas=makeCanvas(WORLD.w,WORLD.h),c=canvas.getContext('2d');c.drawImage(floor,0,0,WORLD.w,WORLD.h);
 const g=c.createLinearGradient(230,0,SIEGE.wallX,0);g.addColorStop(0,'#223c7830');g.addColorStop(.7,'#35284100');g.addColorStop(1,'#be644b25');c.fillStyle=g;c.fillRect(170,145,940,750);
 // A broad unobstructed courtyard: no lanes, route lines, or invisible chokepoints.
 c.fillStyle='#3a283b8a';c.fillRect(SIEGE.wallX+30,170,335,675);
 for(const pad of pads){c.fillStyle=pad.kind==='tower'?'#e3bb6d':'#bfa1dd';c.strokeStyle='#533c61';c.lineWidth=5;c.beginPath();c.ellipse(pad.x,pad.y,59,30,0,0,Math.PI*2);c.fill();c.stroke();}
 return canvas;
}
// One continuous barrier. Combat uses one shared HP pool across its entire length.
export function paintSiegeWall(c,art,{ratio=1,time=0,brokenAt=null}={}){
 const broken=ratio<=0,frame=broken?2:ratio<.52?1:0,im=art.gates[frame],x=SIEGE.wallX;
 c.save();c.strokeStyle=broken?'#6b536e':'#e8bc68';c.lineWidth=20;c.lineCap='butt';c.beginPath();c.moveTo(x,SIEGE.top-10);c.lineTo(x,SIEGE.bottom+10);c.stroke();
 for(let y=SIEGE.top+45;y<=SIEGE.bottom+25;y+=68){const h=118,w=im.width/im.height*h;c.globalAlpha=broken?.55:1;c.drawImage(im,x-w/2,y-h/2,w,h);}
 if(!broken){c.strokeStyle='#a2edff';c.shadowColor='#89e7ff';c.shadowBlur=12;c.lineWidth=3;c.beginPath();c.moveTo(x-28,SIEGE.top-10);c.lineTo(x-28,SIEGE.bottom+10);c.stroke();}
 c.restore();
}
