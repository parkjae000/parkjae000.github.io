// The index becomes visible on Pages only after the new bundle is published.
export function watchRelease({version,save}){
 const banner=document.querySelector('#release-banner'),button=document.querySelector('#refresh-release');
 const message=document.querySelector('#release-message');
 let available=version,checking=false,lastCheck=0,remindAt=0;
 const url=new URL(location.href);
 if(Number(url.searchParams.get('patch'))===version){
  url.searchParams.delete('patch');history.replaceState(history.state,'',url);
 }
 async function check(){
  if(document.hidden||checking||Date.now()-lastCheck<5000)return;
  checking=true;lastCheck=Date.now();
  try{
   const index=new URL('./index.html',document.baseURI);index.searchParams.set('release-check',String(lastCheck));
   const response=await fetch(index,{cache:'no-store',signal:AbortSignal.timeout(12000)});
   if(!response.ok)return;
   const page=new DOMParser().parseFromString(await response.text(),'text/html');
   const src=page.querySelector('script[type="module"][src^="app.mjs?"]')?.getAttribute('src');
   if(!src)return;
   const next=Number(new URL(src,index).searchParams.get('v'));
   if(Number.isSafeInteger(next)&&next>available){available=next;remindAt=0;}
   if(available>version&&Date.now()>=remindAt)banner.hidden=false;
  }catch{/* An offline device will check again when it returns. */}
  finally{checking=false;}
 }
 const later=document.querySelector('#later-release');
 later.onclick=()=>{remindAt=Date.now()+600000;banner.hidden=true;};
 button.onclick=async()=>{
  button.disabled=later.disabled=true;message.textContent='진행을 저장하고 있어요…';
  try{
   await save();
   const target=new URL(location.href);target.searchParams.set('patch',String(available));
   location.replace(target);
  }catch{
   message.textContent='저장 대기 중이에요. 연결 후 다시 눌러 주세요.';button.disabled=later.disabled=false;
  }
 };
 window.addEventListener('online',check);window.addEventListener('focus',check);
 document.addEventListener('visibilitychange',check);
 setInterval(check,60000);check();
}
