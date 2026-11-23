// Resume against message IDs, so a sliding server history cannot shift the reader.
export function chatResume(messages,{position=null,lastRead=0,resume=false,forceBottom=false}={}){
 if(forceBottom)return {kind:'bottom'};
 const unread=Number(lastRead)>0?messages.find(m=>Number(m.id)>Number(lastRead)):null;
 if(resume&&unread)return {kind:'unread',id:Number(unread.id)};
 if(position&&messages.some(m=>Number(m.id)===Number(position.id)))return {kind:'anchor',id:Number(position.id),offset:Number(position.offset)||0};
 if(unread)return {kind:'unread',id:Number(unread.id)};
 return {kind:'bottom'};
}
export function visibleChatRead(rows,{top,bottom}){
 return rows.reduce((last,row)=>row.bottom<=bottom+1&&row.bottom>top+1?Math.max(last,Number(row.id)||0):last,0);
}
export function chatViewport(viewport,layoutHeight,baselineHeight,focused){
 const height=Math.max(1,Math.round(viewport?.height||layoutHeight));
 return {height,top:Math.max(0,Math.round(viewport?.offsetTop||0)),keyboard:!!focused&&Math.max(layoutHeight,baselineHeight||0)-height>120};
}
