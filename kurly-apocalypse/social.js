// Activity comes only from the signed-in actor's heartbeat, never world settlement.
export const PRESENCE_TIMEOUT_MS=75000;
export function presenceView(game,now){const p=game.presence;return !p||now-p.seenAt>PRESENCE_TIMEOUT_MS?'offline':p.away?'away':'online';}
export const lastSeenAt=game=>Number(game.presence?.activeAt||game.presence?.seenAt)||0;
export function heartbeat(game,away,now){const activeAt=away===true?lastSeenAt(game):Math.trunc(now);game.presence={seenAt:Math.trunc(now),activeAt,away:away===true};}
export function chatNotification(messages,actorId,lastRead){
 const latest=messages.reduce((n,m)=>Math.max(n,Number(m.id)||0),0);
 return {latest,unread:messages.filter(m=>Number(m.id)>lastRead&&m.player_id!==actorId).length};
}
