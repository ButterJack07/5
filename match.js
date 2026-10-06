import {Game,distance} from './game.js';

export class SharedMatch{
  constructor(roster,fillBots){
    this.world=new Game();this.world.start();this.time=300;this.status='playing';
    const members=[...roster];if(!members.some(p=>p.role==='hunter'))members.push({id:'bot-hunter',nickname:'人机监管者',role:'hunter',character:'ripper',bot:true});
    if(fillBots)while(members.filter(p=>p.role==='survivor').length<4)members.push({id:'bot-'+members.length,nickname:'人机求生者 '+members.length,role:'survivor',character:'mercenary',bot:true});
    let index=0;this.actors=members.map(p=>{const sim=new Game();sim.characterId=p.role==='survivor'?p.character:'mercenary';sim.hunterId=p.role==='hunter'?p.character:'ripper';sim.start();const pos=p.role==='hunter'?{x:48,y:65}: {x:40+index++*4,y:70};Object.assign(p.role==='hunter'?sim.hunter:sim.player,pos);sim.generators=this.world.generators;sim.pallets=this.world.pallets;sim.exits=this.world.exits;sim.exit=this.world.exit;return {...p,sim,input:{x:0,y:0},seen:0};});
    this.tick=0;
  }
  input(id,input){const a=this.actors.find(a=>a.id===id&&!a.bot);if(!a)return;a.input={x:Math.max(-1,Math.min(1,Number(input.x)||0)),y:Math.max(-1,Math.min(1,Number(input.y)||0)),interact:!!input.interact,dash:!!input.dash};a.seen=this.tick;}
  action(id,action,index){const a=this.actors.find(a=>a.id===id&&!a.bot);if(!a||a.role!=='survivor')return;if(action==='decode')a.sim.startDecode(this.world.generators[index]);if(action==='calibrate')a.sim.calibrate();}
  update(dt=.05){if(this.status!=='playing')return;this.tick++;this.time-=dt;const hunter=this.actors.find(a=>a.role==='hunter'),survivors=this.actors.filter(a=>a.role==='survivor');
    for(const a of survivors){const g=a.sim;if(g.health<=0||a.escaped)continue;Object.assign(g.hunter,hunter.sim.hunter);g.aiHunterDisabled=true;g.stun=999;g.attack=null;g.status='playing';let input=a.input;if(a.bot){const target=this.world.generators.find(m=>m.p<100)||this.world.exits[0],d=distance(g.player,hunter.sim.hunter),dx=d<12?g.player.x-hunter.sim.hunter.x:target.x-g.player.x,dy=d<12?g.player.y-hunter.sim.hunter.y:target.y-g.player.y,l=Math.hypot(dx,dy)||1;input={x:Math.hypot(dx,dy)>3?dx/l:0,y:Math.hypot(dx,dy)>3?dy/l:0,interact:d>=12&&distance(g.player,target)<6};if(!g.decoding&&target.p<100&&this.world.generators.includes(target)&&distance(g.player,target)<6)g.startDecode(target);if(g.calibration)g.calibration.elapsed=g.calibration.duration*.67,g.calibrate();}else if(this.tick-a.seen>10)input={x:0,y:0};
      const before=this.world.pallets.map(p=>p.down);g.updateSimulation(dt,input);if(before.some((v,i)=>!v&&this.world.pallets[i].down)&&distance(g.player,hunter.sim.hunter)<4)hunter.sim.stun=3;
      g.player.health=g.health;if(g.status==='won')a.escaped=true;
    }
    const h=hunter.sim;h.stun=Math.max(0,h.stun-dt);h.hunterAttackCooldown=Math.max(0,h.hunterAttackCooldown-dt);const targets=survivors.filter(a=>a.sim.health>0&&!a.escaped).sort((a,b)=>distance(a.sim.player,h.hunter)-distance(b.sim.player,h.hunter));let input=hunter.input;if(hunter.bot){const t=targets[0]?.sim.player;if(t){const dx=t.x-h.hunter.x,dy=t.y-h.hunter.y,l=Math.hypot(dx,dy)||1;input={x:dx/l,y:dy/l,dash:l<2.5};}}else if(this.tick-hunter.seen>10)input={x:0,y:0};
    if(!h.attack&&h.stun===0){h.move(h.hunter,(input.x||0)*11.2*dt,(input.y||0)*11.2*dt);if(input.dash||input.interact)h.beginAttack(!!input.interact);}
    if(h.attack){const target=targets.find(a=>h.inAttackCone(a.sim.player))||targets[0];if(target){h.player=target.sim.player;h.survivors=[h.player];h.health=target.sim.health;h.shield=target.sim.shield;h.player.invincible=target.sim.invincible;h.player.health=target.sim.health;const phase=h.attack.phase;h.updateAttack(dt);if(phase==='windup'&&h.attack?.phase==='recovery'){target.sim.health=h.player.health;target.sim.shield=h.shield;target.sim.invincible=h.player.invincible||0;if(target.sim.health<h.health)target.sim.stopDecode();}}else h.updateAttack(dt);}
    h.updateFalls(dt);if(this.time<=0||survivors.every(a=>a.escaped||a.sim.health<=0))this.status='finished';
  }
  snapshot(){return {tick:this.tick,time:this.time,status:this.status,generators:this.world.generators,pallets:this.world.pallets,exits:this.world.exits,actors:this.actors.map(a=>{const g=a.sim;return {id:a.id,nickname:a.nickname,role:a.role,character:a.character,bot:!!a.bot,position:a.role==='hunter'?g.hunter:g.player,health:g.health,escaped:!!a.escaped,attack:a.role==='hunter'?g.attack:null,stun:g.stun,dashCooldown:g.dashCooldown,hunterAttackCooldown:g.hunterAttackCooldown,vault:g.vault,calibration:g.calibration,decodeIndex:this.world.generators.indexOf(g.decoding),shield:g.shield,healing:g.healing,healProgress:g.healProgress,message:g.message};})};}
}
