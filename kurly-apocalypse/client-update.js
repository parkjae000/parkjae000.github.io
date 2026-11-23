const RELEASE_PATTERN=/^\d{8}-v\d+-[a-z0-9-]+$/;
export const releaseMismatch=(current,latest)=>typeof current==='string'&&typeof latest==='string'&&RELEASE_PATTERN.test(current)&&RELEASE_PATTERN.test(latest)&&current!==latest;
export function refreshURL(href,latest){if(!RELEASE_PATTERN.test(latest))throw new Error('잘못된 버전입니다.');const url=new URL(href);if(!['http:','https:'].includes(url.protocol))throw new Error('잘못된 게임 주소입니다.');url.searchParams.set('v',latest);return url.href;}
export function startUpdateMonitor(current,{pollMs=60000,fetcher=globalThis.fetch}={}){
 if(!RELEASE_PATTERN.test(current))return ()=>{};
 let checking=false,lastChecked=0,dismissedFor='',stopped=false;
 function show(latest){
  if(dismissedFor===latest||document.querySelector('.client-update-dialog'))return;
  document.querySelectorAll('.client-update:not(.client-update-dialog)').forEach(e=>e.remove());
  const dialog=document.createElement('dialog');dialog.className='client-update client-update-dialog';dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-labelledby','clientUpdateTitle');
  const title=document.createElement('h2');title.id='clientUpdateTitle';title.textContent='새로고침이 필요해요';
  const body=document.createElement('p');body.textContent='지금 사용 중인 화면이 최신 버전이 아닙니다. 새로고침하면 최신 업데이트가 적용됩니다.';
  const note=document.createElement('small');note.textContent='전투 진행은 서버에 유지됩니다. 입력 중인 내용이 있다면 먼저 마무리해주세요.';
  const actions=document.createElement('div');actions.className='client-update-actions';
  const refresh=document.createElement('button');refresh.className='update-now';refresh.dataset.refreshClient='';refresh.textContent='지금 새로고침';refresh.onclick=()=>location.replace(refreshURL(location.href,latest));
  const later=document.createElement('button');later.className='update-later';later.textContent='나중에';later.onclick=()=>dialog.close();
  actions.append(refresh,later);dialog.append(title,body,note,actions);dialog.addEventListener('close',()=>{dismissedFor=latest;dialog.remove();},{once:true});document.body.append(dialog);dialog.showModal();
 }
 async function check(){
  if(stopped||checking||document.hidden||Date.now()-lastChecked<2000)return;checking=true;lastChecked=Date.now();
  try{const url=new URL('release.json',import.meta.url);url.searchParams.set('check',String(Date.now()));const response=await fetcher(url.href,{cache:'no-store'});if(!response.ok)return;const data=await response.json();if(!stopped&&releaseMismatch(current,data.release))show(data.release);}catch{}finally{checking=false;}
 }
 const onVisible=()=>{if(!document.hidden)check();};
 document.addEventListener('visibilitychange',onVisible);window.addEventListener('focus',check);window.addEventListener('pageshow',check);const timer=setInterval(check,pollMs);check();
 return ()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('focus',check);window.removeEventListener('pageshow',check);};
}
