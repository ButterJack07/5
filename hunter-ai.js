import {distance} from './game.js';
import {walls,obstacles} from './map.js';

export function sightClear(sim,from,to){
  if(Math.abs((from.z||0)-(to.z||0))>2)return false;
  const length=distance(from,to),steps=Math.max(1,Math.ceil(length/.45));
  if(sim.smoke&&(distance(from,sim.smoke)<sim.smoke.r||distance(to,sim.smoke)<sim.smoke.r))return false;
  for(let i=1;i<steps;i++){
    const x=from.x+(to.x-from.x)*i/steps,y=from.y+(to.y-from.y)*i/steps,z=from.z||0;
    if(walls.some(w=>z<(w.base||0)+(w.h||3.8)&&z+2>(w.base||0)&&Math.abs(x-w.x)<w.w/2&&Math.abs(y-w.y)<w.d/2))return false;
    if(obstacles.some(o=>o.type==='tree'?Math.hypot(x-o.x,y-o.y)<o.r:Math.abs(x-o.x)<o.w/2&&Math.abs(y-o.y)<o.d/2))return false;
  }
  return true;
}

export class HunterBrain{
  constructor(){this.mode='patrol';this.targetId=null;this.lastSeen=null;this.memory=0;this.route=[];this.repath=0;this.patrolIndex=0;this.stuck=0;this.previous=null;}
  update(sim,candidates,dt){
    const actor=sim.hunter;this.memory=Math.max(0,this.memory-dt);this.repath-=dt;
    const visible=candidates.filter(c=>c.hidden==null&&distance(actor,c.sim.player)<32&&sightClear(sim,actor,c.sim.player)&&!(c.sim.smoke&&distance(c.sim.player,c.sim.smoke)<c.sim.smoke.r));
    const score=c=>distance(actor,c.sim.player)-(c.sim.health===1?4:0)-(c.id===this.targetId?7:0);
    visible.sort((a,b)=>score(a)-score(b));
    if(visible.length){const target=visible[0];this.targetId=target.id;this.lastSeen={...target.sim.player};this.memory=5;this.mode='chase';}
    else if(this.memory>0&&this.lastSeen)this.mode='search';
    else{this.mode='patrol';this.targetId=null;this.lastSeen=null;}
    let goal=this.lastSeen;
    if(this.mode==='patrol'){
      // Only nearby calibration/explosion sounds reveal a location, not all players.
      const noise=candidates.find(c=>c.sim.alert>0&&distance(actor,c.sim.player)<55);
      if(noise){goal={...noise.sim.player};this.lastSeen=goal;this.memory=3;this.mode='investigate';}
      else{const objectives=sim.generators.filter(g=>g.p<100);const points=objectives.length?objectives:sim.exits;goal=points[this.patrolIndex%points.length];if(goal&&distance(actor,goal)<6){this.patrolIndex++;goal=points[this.patrolIndex%points.length];}}
    }
    if(!goal)return {x:0,y:0};
    if(this.mode==='search'&&distance(actor,goal)<2){this.memory=0;this.repath=0;return {x:0,y:0};}
    if(this.previous){const moved=distance(actor,this.previous);this.stuck=moved<.03?this.stuck+dt:0;}
    this.previous={x:actor.x,y:actor.y};
    if(this.repath<=0||this.stuck>.6){sim.collisionHeight=actor.z||0;this.route=sim.findPath(goal);sim.collisionHeight=0;this.repath=.7;this.stuck=0;}
    const direct=sightClear(sim,actor,goal);
    let next=direct?goal:this.route[0];
    while(next&&!direct&&distance(actor,next)<1.2){this.route.shift();next=this.route[0];}
    if(!next)return {x:0,y:0};
    const dx=next.x-actor.x,dy=next.y-actor.y,len=Math.hypot(dx,dy)||1;
    const pallet=sim.pallets.find(p=>p.down&&!p.broken&&distance(actor,p)<3.7);
    if(pallet){actor.angle=Math.atan2(pallet.x-actor.x,pallet.y-actor.y);return {x:0,y:0,interact:true};}
    const target=visible.find(c=>c.id===this.targetId);
    if(target&&distance(actor,target.sim.player)<2.3){actor.angle=Math.atan2(target.sim.player.x-actor.x,target.sim.player.y-actor.y);return {x:0,y:0,dash:true};}
    return {x:Math.max(-1,Math.min(1,dx/len)),y:Math.max(-1,Math.min(1,dy/len))};
  }
}
