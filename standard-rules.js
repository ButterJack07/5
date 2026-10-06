import {distance} from './game.js';
export const cipherLocations=[{x:28,y:42},{x:121,y:96},{x:159,y:143},{x:48,y:120},{x:146,y:39},{x:79,y:147},{x:173,y:89}];
export const hatchLocations=[{x:67,y:123},{x:153,y:82},{x:36,y:106}];
export function actorState(a,chairs){if(a.eliminated)return 'eliminated';if(a.escaped)return 'escaped';if(a.seated!=null)return 'seated';if(chairs.carried===a.id)return 'carried';return a.sim.health<=0?'downed':a.sim.health===1?'injured':'healthy';}
export class StandardRules{
  constructor(){this.powered=false;this.detention=0;this.hatch=null;this.recovery=new Map();this.struggle=0;}
  update(m,dt){const survivors=m.actors.filter(a=>a.role==='survivor'),h=m.actors.find(a=>a.role==='hunter'),decoded=m.world.generators.filter(g=>g.p>=100).length;this.detention=Math.max(0,this.detention-dt);
    if(decoded>=2&&!this.hatch)this.hatch={...hatchLocations[Math.floor(Math.random()*3)],open:false};
    if(decoded>=5&&!this.powered){this.powered=true;this.detention=60;for(const a of survivors)if(['healthy','injured','downed'].includes(actorState(a,m.chairSystem))){a.sim.health=Math.min(2,a.sim.health+1);a.sim.player.health=a.sim.health;a.sim.invincible=1;}}
    const active=survivors.filter(a=>!a.eliminated&&!a.escaped);if(this.hatch)this.hatch.open=active.length===1;
    for(const a of active){const state=actorState(a,m.chairSystem),input=m.tick-a.seen<=10||a.bot?a.input:{};
      if(state==='downed'){let p=this.recovery.get(a.id)||0;p=input.interact&&Math.hypot(input.x||0,input.y||0)<.1?p+dt/12:0;this.recovery.set(a.id,p);if(p>=1){a.sim.health=1;a.sim.player.health=1;this.recovery.delete(a.id);}}
      if(state==='carried'&&input.interact){this.struggle+=dt/10;if(this.struggle>=1){m.chairSystem.carried=null;h.sim.stun=2;a.sim.player.z=h.sim.hunter.z||0;a.sim.health=0;this.struggle=0;}}
      if(this.hatch?.open&&input.interact&&!['seated','carried'].includes(state)&&distance(a.sim.player,this.hatch)<3&&(a.sim.player.z||0)<1)a.escaped=true;
    }
    if(!m.chairSystem.carried)this.struggle=0;h.sim.detention=this.detention;
  }
  snapshot(m){const h=m.actors.find(a=>a.role==='hunter');return {powered:this.powered,decoded:m.world.generators.filter(g=>g.p>=100).length,required:5,detention:this.detention,hatch:this.hatch,recovery:Object.fromEntries(this.recovery),struggle:this.struggle,reveal:m.actors.filter(a=>a.role==='survivor'&&a.sim.alert>0).map(a=>a.id),tinnitus:m.actors.some(a=>a.role==='survivor'&&!a.eliminated&&!a.escaped&&a.seated==null&&distance(a.sim.player,h.sim.hunter)<32)};}
}
