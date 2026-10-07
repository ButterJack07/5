import {distance} from './game.js';
import {sightClear} from './hunter-ai.js';
import {findRoute,walkSegment} from './pathfinding.js';

export class SurvivorBrain{
  constructor(){
    this.mode='decode';
    this.target=null;
    this.route=[];
    this.repath=0;
    this.previous=null;
    this.stuck=0;
    this.interactLast=false;
    this.jukeTimer=Math.random()*Math.PI*2;
    this.jukeFreq=4+Math.random()*3;
    this.calibrationSweet=0.62+Math.random()*0.18;
    this.randomOffset=(Math.random()-0.5)*12;
    this.baitTime=0;
    this.vaultCooldown=0;
  }

  navigate(g,goal,dt){
    this.repath-=dt;
    const pos=g.player;
    if(this.previous)this.stuck=distance(pos,this.previous)<.025?this.stuck+dt:0;
    this.previous={...pos};
    if(this.repath<=0||this.stuck>.6){
      this.route=findRoute(g,pos,goal);
      this.repath=1.2+Math.random()*0.4;
      this.stuck=0;
    }
    let next=walkSegment(g,pos,goal)?goal:this.route[0];
    while(next&&next!==goal&&distance(next,pos)<.6){
      this.route.shift();
      next=this.route[0];
    }
    if(!next)return {x:0,y:0};
    const dx=next.x-pos.x,dy=next.y-pos.y,l=Math.hypot(dx,dy)||1;
    return {x:dx/l,y:dy/l};
  }

  update(match,a,dt){
    this.jukeTimer+=dt*this.jukeFreq;
    if(this.vaultCooldown>0)this.vaultCooldown-=dt;
    const g=a.sim,h=match.actors.find(p=>p.role==='hunter').sim,pos=g.player;
    const distToHunter=distance(pos,h.hunter);
    const danger=distToHunter<17&&sightClear(g,h.hunter,pos);
    let goal=null,interact=false,dash=false;

    if(danger){
      this.mode='flee';
      g.stopDecode();
      const options=[];
      for(let i=0;i<16;i++){
        const angle=i*Math.PI/8,p={x:pos.x+Math.sin(angle)*10,y:pos.y+Math.cos(angle)*10};
        if(g.blocked(p.x,p.y)||!sightClear(g,pos,p))continue;
        const distScore=distance(p,h.hunter);
        const coverBonus=!sightClear(g,h.hunter,p)?8:0;
        // Moderate random noise for less predictable evasive routing
        const noise=Math.sin(this.jukeTimer+i)*2.5;
        options.push({...p,score:distScore+coverBonus+noise});
      }
      options.sort((x,y)=>y.score-x.score);
      goal=options[0]||pos;

      // Pallet and window mindgame
      const near=g.nearby;
      if(near&&distance(near,pos)<3&&this.vaultCooldown<=0){
        if(near.type==='pallet'){
          // Only drop pallet when hunter is close enough to be stunned or blocked, not wasted at distance
          if(distance(near,h.hunter)<4.2){
            interact=!this.interactLast;
            this.vaultCooldown=1.0;
            goal=pos;
          }
        }else if(['window','palletVault'].includes(near.type)){
          // Vault if safe or hunter in recovery, avoid slow vault when point blank
          if(distToHunter>2.2||h.attack||h.stun>0){
            interact=!this.interactLast;
            this.vaultCooldown=1.2;
            goal=pos;
          }
        }
      }

      // Evasive dash skills
      dash=g.dashCooldown===0&&distToHunter<9&&['mercenary','forward','seer','prospector','antiquarian','perfumer'].includes(a.character);
    }else{
      // Non-danger state
      const chairs=match.chairSystem.chairs.filter(c=>c.occupant);
      const rescue=chairs.sort((x,y)=>y.progress-x.progress)[0];
      const eligible=match.actors.filter(p=>p.role==='survivor'&&p.sim.health>0&&!p.eliminated&&!p.escaped&&p.seated==null&&p.hidden==null).sort((x,y)=>(distance(x.sim.player,rescue||pos)+(x.sim.health===1?20:0))-(distance(y.sim.player,rescue||pos)+(y.sim.health===1?20:0)));

      if(rescue&&eligible[0]?.id===a.id){
        this.mode='rescue';
        goal=rescue;
        const close=distance(pos,goal)<2.8;
        if(close){
          // Mindgame to avoid terror shock when hunter camps chair
          const hunterCamping=distToHunter<4.5&&!h.attack&&h.stun===0;
          if(hunterCamping){
            // Tap interaction briefly then pause to bait attack swing
            this.baitTime+=dt;
            interact=(this.baitTime%0.6)<0.25;
          }else{
            interact=true;
          }
        }else{
          this.baitTime=0;
        }
      }else if(match.rules.hatch?.open){
        this.mode='escape';
        goal=match.rules.hatch;
        interact=distance(pos,goal)<2.8;
      }else if(match.rules.powered){
        this.mode='gate';
        goal=[...match.world.exits].sort((x,y)=>distance(pos,x)-distance(pos,y))[0];
        if(goal.p>=100){
          goal={x:goal.x+goal.side*2,y:goal.y};
          this.mode='escape';
        }else{
          interact=distance(pos,goal)<2.8;
        }
      }else{
        this.mode='decode';
        // Doctor self-heals when injured and safe
        if(a.character==='doctor'&&g.health===1&&distToHunter>22){
          if(g.dashCooldown===0)dash=true;
        }
        const machines=match.world.generators.filter(m=>m.p<100);
        // Distribute bots across ciphers with randomized preferences
        const score=m=>distance(pos,m)+match.actors.filter(p=>p!==a&&p.sim.decoding===m).length*25+(distance(m,h.hunter)<20?25:0)+(Math.sin(this.randomOffset+m.x)*6);
        goal=g.decoding||machines.sort((x,y)=>score(x)-score(y))[0];
        if(goal&&distance(pos,goal)<5){
          if(!g.decoding)g.startDecode(goal);
          goal=pos;
        }
        if(g.calibration&&g.calibration.elapsed/g.calibration.duration>=this.calibrationSweet){
          g.calibrate();
          this.calibrationSweet=0.62+Math.random()*0.18;
        }
      }
    }

    const key=goal?`${Math.round(goal.x/4)},${Math.round(goal.y/4)}`:'';
    if(this.target!==key){
      this.target=key;
      this.repath=0;
    }

    let movement=!goal||distance(pos,goal)<(interact?2.8:.4)?{x:0,y:0}:this.navigate(g,goal,dt);

    // Apply high-frequency zig-zag evasive juking when chased at close range
    if(this.mode==='flee'&&distToHunter<6&&Math.hypot(movement.x,movement.y)>0.1){
      const perpX=-movement.y,perpY=movement.x;
      const jukeAmp=Math.sin(this.jukeTimer)*0.4;
      movement.x+=perpX*jukeAmp;
      movement.y+=perpY*jukeAmp;
      const ml=Math.hypot(movement.x,movement.y)||1;
      movement.x/=ml;
      movement.y/=ml;
    }

    this.interactLast=interact;
    return {...movement,interact,dash};
  }
}
