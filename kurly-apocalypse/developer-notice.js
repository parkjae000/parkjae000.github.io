export function mountDeveloperTicker(root,onResize=()=>{}){
 const track=root.querySelector('.developer-ticker-track'),text=root.querySelector('.developer-ticker-message'),app=root.parentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let key='',motion=null,geometry='';
 function animate(){
  if(root.hidden)return;
  const width=track.clientWidth,length=text.scrollWidth,next=[width,length,reduce.matches].join(':');
  if(next===geometry)return;geometry=next;motion?.cancel();motion=null;
  if(reduce.matches){text.style.transform='none';return;}
  text.style.transform='';motion=text.animate([{transform:`translateX(${width}px)`},{transform:`translateX(-${length}px)`}],{duration:Math.max(8000,(width+length)/44*1000),iterations:Infinity,easing:'linear'});
 }
 const observer=new ResizeObserver(()=>{animate();onResize();});observer.observe(track);reduce.addEventListener('change',()=>{geometry='';animate();});
 return function update(value){
  if(!value)return;const next=[value.enabled,value.message,value.revision].join('|');if(next===key)return;key=next;
  const active=!!value.enabled&&!!value.message;root.hidden=!active;app.classList.toggle('has-developer-notice',active);
  text.textContent=active?value.message:'';motion?.cancel();motion=null;geometry='';
  if(active)requestAnimationFrame(animate);onResize();
 };
}
