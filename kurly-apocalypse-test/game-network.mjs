export function gameRequestURL(base,endpoint){const path=base+endpoint;if(!/\/functions\/v1\/kurly-apocalypse(?:-test)?$/.test(base))return path;return path+(endpoint.includes('?')?'&':'?')+'forceFunctionRegion=ap-northeast-2';}
export async function fetchGame(url,init,fetcher=fetch){
 const retry=(!init.method||init.method==='GET')||init.method==='POST'&&!!JSON.parse(init.body||'{}').requestId;
 try{const response=await fetcher(url,init);if(!retry||response.status<500||!url.includes('forceFunctionRegion='))return response;}catch(error){if(!retry||!url.includes('forceFunctionRegion='))throw error;}
 return fetcher(url.replace(/([?&])forceFunctionRegion=[^&]+&?/,(all,sep)=>all.endsWith('&')?sep:'').replace(/[?&]$/,''),init);
}
