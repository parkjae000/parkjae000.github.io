// Visible game screens remain online, including mobile browsers and embedded views.
// Browser chrome, keyboard focus and input inactivity do not mean the player has left.
export function browserAway({hidden=false,visibilityState='visible'}={}){
 return hidden===true||visibilityState==='hidden';
}
