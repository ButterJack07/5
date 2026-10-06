export function interruptInteraction(match,actor){
  const g=actor.sim,v=g.vault||actor._hitVault,rescuing=match.chairSystem.rescues.has(actor.id);
  if(!v&&!rescuing)return false;
  if(v){const t=v.elapsed/v.duration,point=t<.5?v.from:v.to;g.player.x=point.x;g.player.y=point.y;g.player.z=point.z??v.from.z??0;g.collisionHeight=g.player.z;g.resolveCollision(g.player);g.collisionHeight=0;}
  g.vault=null;g.vaultBoost=0;g.dashRemaining=0;g.stopDecode();g.health=0;g.player.health=0;g.message='恐惧震慑';match.chairSystem.rescues.delete(actor.id);match.chairSystem.heals.delete(actor.id);
  actor.shockTick=match.tick;match.interactions.shock={tick:match.tick,victim:actor.id};return true;
}
