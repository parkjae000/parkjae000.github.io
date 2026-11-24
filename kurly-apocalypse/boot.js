// The release pointer is fetched fresh; the game module owns the visible update notice.
const fallback='20261124-v223-timed-passes',safe=/^\d{8}-v\d+-[a-z0-9-]+$/;
async function currentRelease(){try{const r=await fetch(new URL('release.json?check='+Date.now(),import.meta.url),{cache:'no-store'});if(!r.ok)return fallback;const v=await r.json();return safe.test(v.release)?v.release:fallback;}catch{return fallback;}}
const release=await currentRelease();document.documentElement.dataset.clientRelease=release;
await import('./game.js?v='+encodeURIComponent(release));
