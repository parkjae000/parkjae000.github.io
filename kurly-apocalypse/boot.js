// Fetch the release pointer without HTTP cache so a previously cached HTML page loads current modules.
const fallback='20261123-v212-research-news',safe=/^\d{8}-v\d+-[a-z0-9-]+$/;
const newer=(a,b)=>{const x=a.match(/^(\d{8})-v(\d+)/),y=b.match(/^(\d{8})-v(\d+)/);return !!x&&!!y&&(x[1]>y[1]||x[1]===y[1]&&Number(x[2])>Number(y[2]));};
async function currentRelease(){try{const r=await fetch(new URL('release.json?check='+Date.now(),import.meta.url),{cache:'no-store'});if(!r.ok)return fallback;const v=await r.json();return safe.test(v.release)&&newer(v.release,fallback)?v.release:fallback;}catch{return fallback;}}
const release=await currentRelease();document.documentElement.dataset.clientRelease=release;
await import('./game.js?v='+encodeURIComponent(release));
let checking=false;
async function checkUpdate(){if(checking||document.hidden)return;checking=true;try{const next=await currentRelease();if(!newer(next,release)||document.querySelector('.client-update'))return;const box=document.createElement('aside');box.className='client-update';box.setAttribute('role','status');const text=document.createElement('span');text.textContent='새 게임 버전이 준비됐어요.';const button=document.createElement('button');button.textContent='새 버전 적용';button.onclick=()=>{const url=new URL(location.href);url.searchParams.set('v',next);location.replace(url.href);};box.append(text,button);document.body.append(box);}finally{checking=false;}}
document.addEventListener('visibilitychange',checkUpdate);setInterval(checkUpdate,60000);
