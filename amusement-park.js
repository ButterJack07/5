import {createEmptyMap, placeTile} from './map-editor.js';
import {SharedMatch} from './match.js';
import {distance, walls} from './game.js';

export function createParkMap(){
  const m=createEmptyMap('废弃游乐场','large');
  for(let i=0;i<50;i++)for(const [x,y] of [[i,0],[i,49],[0,i],[49,i]])placeTile(m,'manorWall',x,y);
  placeTile(m,'exit',0,12);placeTile(m,'exit',49,37);
  for(const [x,y] of [[8,8],[23,8],[39,10],[10,25],[30,24],[12,40],[40,40]])placeTile(m,'cipher',x,y);
  for(const [x,y] of [[6,17],[18,11],[39,20],[17,34],[35,38],[43,30]])placeTile(m,'chair',x,y);
  for(const [x,y] of [[20,23],[34,15],[25,40]])placeTile(m,'hatch',x,y);
  for(const [x,y] of [[10,13],[31,32],[38,12]])placeTile(m,'windowHouse',x,y);
  for(const [x,y] of [[7,32],[26,14],[39,32],[15,20],[29,40]]){
    placeTile(m,'wall',x,y);placeTile(m,'rock',x+2,y);placeTile(m,'pallet',x+1,y);
  }
  for(let i=0;i<60;i++)placeTile(m,i%3?'tree':'rock',3+(i*13)%44,3+(i*19)%44);
  return m;
}

export const parkLandmarks=[
  {x:56,y:48,name:'停转摩天轮',kind:'wheel'},
  {x:116,y:108,name:'旋转木马',kind:'carousel'},
  {x:152,y:156,name:'废弃过山车',kind:'coaster'},
  {x:40,y:108,name:'售票广场',kind:'tickets'}
];

export class ParkMatch extends SharedMatch{
  constructor(role='survivor'){
    super([{id:'player',nickname:'你',role,character:role==='hunter'?'ripper':'mercenary'}],true,10,createParkMap());
    for(const w of walls){
      if(w.manor){
        if(w.x===2||w.x===198)w.w=.9;
        else w.d=.9;
      }else if(w.w===4&&w.d===4){w.d=.75;}
    }
    // Gate cells are openings, not solid sections of the perimeter.
    for(const e of this.world.exits){
      const i=walls.findIndex(w=>w.manor&&w.x===e.x&&w.y===e.y);
      if(i>=0)walls.splice(i,1);
    }
    for(const a of this.actors)a.sim._staticColliders=null;
    this.chests=[[32,32],[88,56],[136,76],[56,156],[164,120]].map(([x,y],id)=>({id,x,y,opened:false}));
    this.searches=new Map();
  }
  update(dt=.05){
    if(this.status!=='playing')return;
    super.update(dt);
    for(const a of this.actors){
      if(a.role!=='survivor'||a.eliminated||a.escaped||a.seated!=null||a.sim.health<=0||this.chairSystem.carried===a.id){this.searches.delete(a.id);continue;}
      const c=this.chests.find(c=>!c.opened&&distance(c,a.sim.player)<3);
      const hurt=a._chestHealth!=null&&a.sim.health<a._chestHealth;
      a._chestHealth=a.sim.health;
      if(!c||hurt||!a.input.interact||Math.hypot(a.input.x||0,a.input.y||0)>.1){this.searches.delete(a.id);continue;}
      if([...this.searches.entries()].some(([id,s])=>id!==a.id&&s.chest===c.id))continue;
      const previous=this.searches.get(a.id),time=previous?.chest===c.id?previous.time+dt:dt;
      this.searches.set(a.id,{chest:c.id,time});a.sim.stopDecode();
      if(time>=5){c.opened=true;a.parkItem='medicalKit';this.searches.delete(a.id);}
    }
  }
  useMedicalKit(id){
    const a=this.actors.find(a=>a.id===id);
    if(!a||a.parkItem!=='medicalKit'||a.sim.health!==1||a.seated!=null||a.eliminated||a.escaped)return false;
    a.parkItem=null;a.sim.health=2;a.sim.player.health=2;return true;
  }
}
