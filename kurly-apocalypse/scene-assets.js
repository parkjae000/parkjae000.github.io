import atlas from './scene-atlas.js?v=20261123-v200-animated';
export const FILES={warehouse:'warehouse.webp',miners:'miners.webp',parcel:'parcel.webp',money:'money.webp',yard:'yard.webp',fighters:'fighters.webp',forklift:'forklift.webp',damage:'damage.webp',fortress:'fortress-state.webp',resultWin:'result-win.webp',resultLoss:'result-loss.webp',resultDraw:'result-draw.webp',charge:'chargeSpeech.webp',csMotion:'csMotion.webp',beautyMotion:'beautyMotion.webp',ambientMotion:'ambientMotion.webp',chilledMotion:'chilledMotion.webp',returnsMotion:'returnsMotion.webp',heroFrozen:'hero-frozen.webp',heroChilled:'hero-chilled.webp',heroAmbient:'hero-ambient.webp',heroCs:'hero-cs.webp',heroBeauty:'hero-beauty.webp',heroReturns:'hero-returns.webp'};
export function prepareAssets(raw,meta,makeCanvas){
 const A={...raw};for(const name of ['miners','fighters','forklift','damage','fortress'])A[name+'Frames']=meta[name].map(r=>{const c=makeCanvas(r.w,r.h);c.getContext('2d').drawImage(raw[name],r.x,r.y,r.w,r.h,0,0,r.w,r.h);return c;});
 for(let i=0;i<8;i++){const src=A.fightersFrames[i],c=makeCanvas(Math.round(src.width*70/src.height),70),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(src,0,0,c.width,c.height);A.fightersFrames[i]=c;}
 A.heroScale={frozen:1};A.heroFrames={frozen:[8,11,9,10].map(i=>A.fightersFrames[i])};
 for(const id of ['cs','beauty','ambient','chilled','returns']){const key=id+'Motion',rects=meta[key],scale=Math.min(306/Math.max(...rects.map(r=>r.w)),344/Math.max(...rects.map(r=>r.h)));A.heroScale[id]=360/(rects[0].h*scale);A.heroFrames[id]=rects.map(r=>{const c=makeCanvas(320,360),ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(raw[key],r.x,r.y,r.w,r.h,(320-r.w*scale)/2,352-r.h*scale,r.w*scale,r.h*scale);return c;});}
 for(const [key,w,h]of [['warehouse',720,1280],['yard',1280,720]]){const bg=makeCanvas(w,h),ctx=bg.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(raw[key],0,0,w,h);A[key]=bg;}return A;
}

let cached=null,promise;
export function sceneAssets(){return cached;}
export function loadSceneAssets(){return promise??=Promise.all(Object.entries(FILES).map(([k,v])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve([k,img]);img.onerror=()=>reject(Error('장면 이미지 로드 실패: '+v));img.src='assets/'+v;}))).then(entries=>{
 const raw=Object.fromEntries(entries);cached=prepareAssets(raw,atlas,(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h}));
 return cached;
}).catch(error=>{promise=null;throw error;});}
export function paintMiner(canvas,worker,{mining=false,forklift=false,dragging=false,t=0}={}){
 const A=cached;if(!A)return;const c=canvas.getContext('2d'),W=canvas.width,H=canvas.height;c.clearRect(0,0,W,H);c.imageSmoothingQuality='high';
 const phase=(t*(1+Math.min(5,worker.level-1)*.08))%1.05;
 const f=mining?(phase<.15?0:phase<.30?1:phase<.48?2:phase<.55?3:phase<.69?4:5):0;
 const img=forklift?A.forkliftFrames[mining?Math.floor(t*2)%4:0]:A.minersFrames[f];
 const height=H*.88,width=img.width*height/img.height,y=H*.94-(dragging?5:Math.sin(t*2.5)*.7);
 c.fillStyle='#59432f28';c.beginPath();c.ellipse(W/2,H*.92,W*.32,H*.045,0,0,Math.PI*2);c.fill();c.drawImage(img,(W-width)/2,y-height,width,height);
 if(mining&&!dragging&&phase>.5&&phase<.7){c.strokeStyle='#fff0b5';c.lineWidth=2;for(let i=0;i<3;i++){const x=W*.78+Math.cos(i*2.2)*9,y=H*.5+Math.sin(i*2.2)*8;c.beginPath();c.moveTo(x-3,y);c.lineTo(x+3,y);c.moveTo(x,y-3);c.lineTo(x,y+3);c.stroke();}}
}
