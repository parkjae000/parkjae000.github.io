// Stable DOM buttons above the canvas: never replace a pressed button on a frame update.
export function syncCanvasControls(root,buttons,dispatch,{blocked=false}={}){
 root.inert=blocked;root.hidden=blocked;
 const wanted=new Set(),counts=new Map();
 for(const b of buttons){
  const ordinal=counts.get(b.id)||0;counts.set(b.id,ordinal+1);
  const key=b.id+':'+ordinal;wanted.add(key);
  let el=[...root.children].find(node=>node.dataset.controlKey===key);
  if(!el){el=root.ownerDocument.createElement('button');el.type='button';el.dataset.controlKey=key;el.dataset.canvasAction=b.id;el.addEventListener('click',event=>{event.stopPropagation();const current=el.tdCanvasCommand;if(!el.disabled)dispatch(current.id,current.data);});root.append(el);}
  el.tdCanvasCommand=b;
  if(el.textContent!==b.label)el.textContent=b.label;
  if(el.getAttribute('aria-label')!==b.label)el.setAttribute('aria-label',b.label);
  if(el.disabled!==!!b.disabled)el.disabled=!!b.disabled;
  const style=`left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;`;
  if(el.style.cssText!==style)el.style.cssText=style;
 }
 for(const el of [...root.children])if(!wanted.has(el.dataset.controlKey))el.remove();
}
