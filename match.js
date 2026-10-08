import {Game,distance} from './game.js';
import {HunterBrain,sightClear} from './hunter-ai.js';
import {ChairSystem} from './chairs.js';
import {HunterSkills} from './hunter-skills.js';
import {StandardRules,cipherLocations,actorState} from './standard-rules.js';
import {MapInteractions} from './map-interactions.js';
import {collectScores} from './scoring.js';
import {SurvivorBrain} from './survivor-ai.js';
import {interruptInteraction} from './terror-shock.js';

export const survivorSpawnPool = [
  {x: 40, y: 72},   // 西区木屋东侧空地
  {x: 136, y: 48},  // 北区废弃马厩旁
  {x: 164, y: 125}, // 东区石舍空地
  {x: 70, y: 160},  // 南区工棚南侧空地
  {x: 28, y: 35},   // 西北荒林
  {x: 168, y: 165}, // 东南旷野
  {x: 36, y: 115},  // 西南废墟
  {x: 115, y: 30},  // 东北外围
  {x: 82, y: 55},   // 教堂北庭院
  {x: 82, y: 155}   // 教堂南空地
];

export const hunterSpawnPool = [
  {x: 104, y: 105}, // 教堂正殿中轴
  {x: 48, y: 65},   // 西中庭
  {x: 148, y: 95},  // 东中庭
  {x: 100, y: 40},  // 北大门轴线
  {x: 100, y: 165}  // 南大门轴线
];

export function generateScatteredSpawns(survivorCount = 4) {
  const hunterIndex = Math.floor(Math.random() * hunterSpawnPool.length);
  const hunterPos = { ...hunterSpawnPool[hunterIndex] };

  let candidates = survivorSpawnPool
    .filter(p => Math.hypot(p.x - hunterPos.x, p.y - hunterPos.y) >= 30)
    .sort(() => Math.random() - 0.5);

  if (candidates.length < survivorCount) {
    candidates = [...survivorSpawnPool].sort(() => Math.random() - 0.5);
  }

  const selected = [candidates[0]];
  for (let i = 1; i < survivorCount; i++) {
    let best = null, maxDist = -1;
    for (const cand of candidates) {
      if (selected.includes(cand)) continue;
      const minDist = Math.min(...selected.map(s => Math.hypot(s.x - cand.x, s.y - cand.y)));
      if (minDist > maxDist) {
        maxDist = minDist;
        best = cand;
      }
    }
    selected.push(best || candidates[i % candidates.length]);
  }

  return { hunter: hunterPos, survivors: selected.map(p => ({ ...p })) };
}

export class SharedMatch{
  constructor(roster,fillBots,prepTime=0){
    this.world=new Game();this.world.start();this.world.generators=cipherLocations.map(p=>({...p,p:0}));this.time=300;this.status='playing';
    const members=[...roster];if(!members.some(p=>p.role==='hunter'))members.push({id:'bot-hunter',nickname:'人机监管者',role:'hunter',character:'ripper',bot:true});
    if(fillBots)while(members.filter(p=>p.role==='survivor').length<4)members.push({id:'bot-'+members.length,nickname:'人机求生者 '+members.length,role:'survivor',character:'mercenary',bot:true});
    const survTotal = members.filter(p=>p.role==='survivor').length;
    const spawns = generateScatteredSpawns(Math.max(1, survTotal));
    let survIdx=0;
    this.actors=members.map(p=>{
      const sim=new Game();
      sim.characterId=p.role==='survivor'?p.character:'mercenary';
      sim.hunterId=p.role==='hunter'?p.character:'ripper';
      sim.start();
      const pos=p.role==='hunter'?{...spawns.hunter}:{...(spawns.survivors[survIdx++]||{x:40,y:70})};
      Object.assign(p.role==='hunter'?sim.hunter:sim.player,pos);
      sim.generators=this.world.generators;sim.pallets=this.world.pallets;sim.exits=this.world.exits;sim.exit=this.world.exit;
      return {...p,sim,input:{x:0,y:0},seen:0};
    });
    this.tick=0;this.hunterBrain=new HunterBrain();this.chairSystem=new ChairSystem();this.hunterSkills=new HunterSkills();this.rules=new StandardRules();this.interactions=new MapInteractions();this.previousProgress=this.world.generators.map(g=>g.p);this.prepTime=prepTime;
  }
  input(id,input){const a=this.actors.find(a=>a.id===id&&!a.bot);if(!a)return;a.input={x:Math.max(-1,Math.min(1,Number(input.x)||0)),y:Math.max(-1,Math.min(1,Number(input.y)||0)),angle:Number.isFinite(input.angle)?Number(input.angle):undefined,interact:!!input.interact,dash:!!input.dash,skill:!!input.skill,sneak:!!input.sneak,progSpeedToggle:!!input.progSpeedToggle,progStun:!!input.progStun,progTeleport:input.progTeleport||null};a.seen=this.tick;}
  action(id,action,index){if(['locker','hunter_vault'].includes(action)){this.interactions.action(this,id,action,index);return;}const a=this.actors.find(a=>a.id===id&&!a.bot);if(!a||a.role!=='survivor'||a.hidden!=null||!['healthy','injured'].includes(actorState(a,this.chairSystem)))return;if(action==='decode')a.sim.startDecode(this.world.generators[index]);if(action==='calibrate')a.sim.calibrate();}
  chairSnapshot(){return {scores:collectScores(this),interactions:this.interactions.snapshot(),rules:this.rules.snapshot(this),hunterSkills:this.hunterSkills.snapshot(),result:this.result,chairs:this.chairSystem.chairs,carried:this.chairSystem.carried,rescues:[...this.chairSystem.rescues].map(([id,r])=>({id,...r})),actors:this.actors.map(a=>({id:a.id,hidden:a.hidden,state:actorState(a,this.chairSystem),seated:a.seated,eliminated:!!a.eliminated,nextChair:a.nextChair||0}))};}
  update(dt=.05){if(this.status!=='playing')return;this.tick++;this.time-=dt;if(this.prepTime>0)this.prepTime=Math.max(0,this.prepTime-dt);this.rules.update(this,dt);this.interactions.update(this,dt);const hunter=this.actors.find(a=>a.role==='hunter'),survivors=this.actors.filter(a=>a.role==='survivor');
    // Count workers per cipher to ensure multi-player decoding does NOT accelerate beyond 1.0x
    const machineWorkers=new Map();
    for(const a of survivors){
      if(a.sim.decoding){
        machineWorkers.set(a.sim.decoding,(machineWorkers.get(a.sim.decoding)||0)+1);
      }
    }
    for(const a of survivors){const g=a.sim;if(a.eliminated||a.escaped||a.seated!=null||this.chairSystem.carried===a.id)continue;if(g.health<=0){if(a.bot)a.input={x:0,y:0,interact:true};if(this.tick-a.seen<=10&&!a.bot)g.move(g.player,(a.input.x||0)*2*dt,(a.input.y||0)*2*dt);continue;}Object.assign(g.hunter,hunter.sim.hunter);g.aiHunterDisabled=true;g.stun=999;g.attack=null;g.status='playing';if(this.prepTime>0)g.invincible=Math.max(g.invincible||0,0.5);let input=a.input;if(a.bot){a.brain??=new SurvivorBrain();input=a.brain.update(this,a,dt);a.input=input;}else if(this.tick-a.seen>10)input={x:0,y:0};
      const before=this.world.pallets.map(p=>p.down);
      const decGen=g.decoding,wCount=decGen?machineWorkers.get(decGen)||1:1;
      const prevP=decGen?decGen.p:0;
      g.updateSimulation(dt,input);
      // If multiple survivors decoding same machine, cancel excess progress to keep baseline 1.0x rate
      if(decGen&&wCount>1&&decGen.p>prevP){
        const delta=decGen.p-prevP;
        decGen.p=Math.min(100,prevP+delta/wCount);
      }
      if(a.character==='programmer'){
        if(input.progSpeedToggle){g.triggerProgrammerSpeed();input.progSpeedToggle=false;}
        if(input.progStun){
          if(distance(g.player,hunter.sim.hunter)<30){hunter.sim.stun=4;g.message='404 Bug 报错！追猎者被全域眩晕 4 秒';}
          input.progStun=false;
        }
        if(input.progTeleport){g.triggerProgrammerTeleport(input.progTeleport);input.progTeleport=null;}
      }
      if(before.some((v,i)=>!v&&this.world.pallets[i].down)&&distance(g.player,hunter.sim.hunter)<4)hunter.sim.stun=3;
      if(!a.bot&&a.input.angle!==undefined&&!g.vault&&Math.hypot(a.input.x||0,a.input.y||0)<0.05)g.player.angle=a.input.angle;
      g.player.health=g.health;if(g.status==='won')a.escaped=true;
    }
    const h=hunter.sim;h.stun=Math.max(0,h.stun-dt);h.hunterAttackCooldown=Math.max(0,h.hunterAttackCooldown-dt);if(this.prepTime>0){h.hunterAttackCooldown=Math.max(h.hunterAttackCooldown,0.5);}const targets=survivors.filter(a=>a.sim.health>0&&!a.escaped).sort((a,b)=>distance(a.sim.player,h.hunter)-distance(b.sim.player,h.hunter));let input=hunter.input;if(hunter.bot)input=this.hunterBrain.update(h,targets,dt);else if(this.tick-hunter.seen>10)input={x:0,y:0};
    if(!hunter.bot&&input.angle!==undefined){if(!h.attack||h.attack.phase==='windup'){if(Math.hypot(input.x||0,input.y||0)<0.05||!h.attack)h.hunter.angle=input.angle;if(h.attack)h.attack.angle=input.angle;}}
    input.skill=!this.chairSystem.carried&&(!!hunter.skillHeld||!!input.skill);this.hunterSkills.update(this,hunter,input,dt);
    for(const a of survivors){a._hitVault=a.sim.vault?{...a.sim.vault,from:{...a.sim.vault.from},to:{...a.sim.vault.to}}:null;a._hitInteraction=!!a.sim.vault||this.chairSystem.rescues.has(a.id);a._hitHealth=a.sim.health;}
    const chairInteraction=this.chairSystem.carried||this.hunterSkills.rocket>0||survivors.some(a=>a.sim.health<=0&&!a.eliminated&&a.seated==null&&distance(a.sim.player,h.hunter)<3);
    if(!h.attack&&h.stun===0){if(!(hunter.bot&&this.chairSystem.carried))h.move(h.hunter,(input.x||0)*7.8*dt,(input.y||0)*7.8*dt);if(input.dash||input.interact&&!chairInteraction)h.beginAttack(!!input.interact);}
    else if(h.attack?.phase==='windup'&&h.stun===0){const target=targets.find(a=>sightClear(h,h.hunter,a.sim.player));if(target&&hunter.bot){const dx=target.sim.player.x-h.hunter.x,dy=target.sim.player.y-h.hunter.y,d=Math.hypot(dx,dy)||1;h.hunter.angle=Math.atan2(dx,dy);h.attack.angle=h.hunter.angle;h.move(h.hunter,dx/d*Math.min(Math.max(0,d-1.65),7.8*dt),dy/d*Math.min(Math.max(0,d-1.65),7.8*dt));}else if(!hunter.bot)h.move(h.hunter,(input.x||0)*5*dt,(input.y||0)*5*dt);}
    if(h.attack){const target=targets.find(a=>h.inAttackCone(a.sim.player)&&sightClear(h,h.hunter,a.sim.player));if(target){h.player=target.sim.player;h.survivors=[h.player];h.health=target.sim.health;h.shield=target.sim.shield;h.invincible=target.sim.invincible||0;h.player.invincible=h.invincible;h.player.health=target.sim.health;const previousHealth=target.sim.health,phase=h.attack.phase;h.updateAttack(dt);if(phase==='windup'&&h.attack?.phase==='recovery'){target.sim.health=h.player.health;target.sim.shield=h.shield;target.sim.invincible=h.player.invincible||0;if(target.sim.health<previousHealth)target.sim.stopDecode();}}else{h.player={x:-1000,y:-1000,z:0};h.survivors=[];h.invincible=0;h.updateAttack(dt);}}
    for(const a of survivors){if(a._hitInteraction&&a.sim.health<a._hitHealth){if(interruptInteraction(this,a)){h.message='恐惧震慑';this.shock={tick:this.tick,victim:a.id};}}a._hitInteraction=false;a._previousHealth=a.sim.health;}
    for(const a of survivors){const g=a.sim.decoding,index=this.world.generators.indexOf(g);if(index>=0){const workers=survivors.filter(p=>p.sim.decoding===g).length;a.decodeContribution=(a.decodeContribution||0)+Math.max(0,g.p-this.previousProgress[index])/Math.max(1,workers);}}this.previousProgress=this.world.generators.map(g=>g.p);
    this.chairSystem.update(this,dt);h.updateFalls(dt);if(survivors.every(a=>a.escaped||a.eliminated)){this.status='finished';const escaped=survivors.filter(a=>a.escaped).length;this.result={escaped,eliminated:survivors.length-escaped,total:survivors.length,winner:escaped>survivors.length/2?'survivors':escaped===survivors.length/2?'draw':'hunter'};}
  }
  snapshot(){return {tick:this.tick,time:this.time,prepTime:this.prepTime||0,status:this.status,generators:this.world.generators,pallets:this.world.pallets,exits:this.world.exits,actors:this.actors.map(a=>{const g=a.sim;return {id:a.id,nickname:a.nickname,role:a.role,character:a.character,bot:!!a.bot,position:a.role==='hunter'?g.hunter:g.player,health:g.health,escaped:!!a.escaped,attack:a.role==='hunter'?g.attack:null,stun:g.stun,dashCooldown:g.dashCooldown,hunterAttackCooldown:g.hunterAttackCooldown,vault:g.vault,calibration:g.calibration,decodeIndex:this.world.generators.indexOf(g.decoding),shield:g.shield,healing:g.healing,healProgress:g.healProgress,message:g.message};})};}
}
