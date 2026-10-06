import * as map from './map.js';
export const SIZE=map.SIZE;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function palletPose(p){const progress=p.down?1-(p.drop||0)/.4:0,angle=.18+Math.max(0,progress)*(Math.PI/2-.18);return {baseX:p.x-2,angle,length:4,tipX:p.x-2+4*Math.sin(angle),tipZ:4*Math.cos(angle)};}
export const characters=[
  {id:'mercenary',name:'佣兵',skill:'钢铁冲刺',cooldown:5,description:'向面朝方向利用肘部护腕高速弹射冲刺 0.9 秒，碰到障碍即停，强行拉开身位。',color:0x4f6d53},
  {id:'doctor',name:'医生',skill:'自愈针剂',cooldown:5,description:'受伤时使用技能，原地快速注射包扎 3 秒恢复健康。移动或受击中断。',color:0xe1ddd2},
  {id:'seer',name:'先知',skill:'役鸟守护',cooldown:5,description:'驱使役鸟在自身周围盘旋 2.5 秒，抵挡一次监管者攻击。',color:0x3c5166},
  {id:'prospector',name:'勘探员',skill:'磁铁弹射',cooldown:5,description:'向前方掷出同极磁铁，将自身强力向后弹射或反推追猎者拉开 8 米距离。',color:0x85583b},
  {id:'perfumer',name:'调香师',skill:'忘忧之香',cooldown:5,description:'记录当前位置与血量，若 3 秒内再次按技能可回溯到记录点（受击后可瞬间倒流回血）。',color:0x8e5f88},
  {id:'acrobat',name:'杂技演员',skill:'爆弹跳跃',cooldown:5,description:'向前腾空翻滚跃出一段距离并丢下冷却余烬阻滞追猎者。',color:0xb8860b},
  {id:'forward',name:'前锋',skill:'橄榄球冲刺',cooldown:5,description:'抱着橄榄球向前狂暴冲锋 1.4 秒，撞到监管者可将其撞退并眩晕 2 秒！',color:0xad4630},
  {id:'coordinator',name:'空军',skill:'信号枪狙击',cooldown:5,description:'举起信号枪发射精准信号弹，直接命中监管者使其原地眩晕 3 秒。',color:0x51647a},
  {id:'priestess',name:'祭司',skill:'直线通道',cooldown:5,description:'在面前障碍物或墙体上瞬间打通一条直线传送门，直接穿墙到达另一侧。',color:0x544061},
  {id:'antiquarian',name:'古董商',skill:'止戈机关棍',cooldown:5,description:'挥舞藏锋机关棍向前方横扫，击退监管者并使其缴械禁用普通攻击 2 秒。',color:0x3e6b5c},
  {id:'cheerleader',name:'拉拉队员',skill:'振奋鼓舞',cooldown:5,description:'摇动花球为自身注入振奋活力，立刻清除所有负面减速并获得持续 2.5 秒的 40% 爆发加速。',color:0xc4693b},
  {id:'puppeteer',name:'“心理学家”',skill:'移情口哨',cooldown:5,description:'吹响催眠口哨产生应激心理屏障，在受到下一次普通攻击时仅受微量应激并加速逃脱。',color:0xa3967d}
];

export const hunters=[
  {id:'ripper',name:'“杰克”',skill:'雾刃突刺',cooldown:5,weapon:'爪刃',description:'隐匿于浓雾之中，普通挥击附带远距离雾刃刀气，并可在雾区中潜行加速。',color:0x2f3e46},
  {id:'geisha',name:'红蝶',skill:'刹那生灭',cooldown:5,description:'凝视求生者面部化身般若相，无视障碍物瞬间直线飞掠瞬移至目标身前。',color:0x8b3a3a},
  {id:'smiley',name:'小丑',skill:'火箭冲刺',cooldown:5,description:'装配推进器举起火箭筒向前极速狂飙冲锋，可随时转向撞击求生者。',color:0x9e5727},
  {id:'wu_chang',name:'宿伞之魂',skill:'诸魄荡魄',cooldown:5,description:'摇动涤魂铃或掷伞传送，使大范围内的求生者心智失常进入 2 秒失魂僵直。',color:0x222222},
  {id:'bloody_queen',name:'红夫人',skill:'水镜镜像',cooldown:5,description:'在前方召唤一道映照全场的巨大水镜，镜像本体同步挥刀，跨地形隔空挥砍！',color:0x7d2843},
  {id:'opera_singer',name:'歌剧演员',skill:'暗影潜行',cooldown:5,description:'跃入影域化为暗影高速穿梭，在影痕之间连续回跃突袭。',color:0x403152}
];
export const obstacles=[[12,12],[23,17],[43,12],[66,12],[84,14],[12,38],[36,34],[61,30],[86,35],[18,62],[42,59],[67,63],[87,70],[12,87],[38,86],[62,88],[83,91]].map(([x,y],i)=>({x,y,r:2.8,type:'tree',h:7+i%4}));
// Window openings and pallet doorways share the exact gap geometry used by both renderers.
export const walls=[
  {x:45.5,y:27,w:6,d:1},{x:56.5,y:27,w:6,d:1},{x:42,y:33,w:1,d:13},{x:60,y:33,w:1,d:13},{x:44.5,y:39,w:6,d:1},{x:56,y:39,w:9,d:1},
  {x:18.5,y:69,w:6,d:1},{x:29.5,y:69,w:6,d:1},{x:15,y:75,w:1,d:13},{x:33,y:75,w:1,d:13},{x:18,y:81,w:7,d:1},{x:29,y:81,w:9,d:1},
  {x:73.5,y:57,w:6,d:1},{x:84.5,y:57,w:6,d:1},{x:70,y:63,w:1,d:13},{x:88,y:63,w:1,d:13},{x:73,y:69,w:7,d:1},{x:84,y:69,w:9,d:1}
];
obstacles.push(...[[103,19,4],[119,35,5],[109,63,3.5],[125,78,5],[100,105,4],[78,118,5],[47,113,3.5],[24,102,4],[121,119,6],[14,48,3]].map(([x,y,r])=>({x,y,r,type:'rock',h:r*.8})));
obstacles.push(...[[106,10],[131,23],[131,59],[101,89],[12,118],[35,128],[65,130],[94,131],[132,102]].map(([x,y])=>({x,y,r:2.8,type:'tree',h:8})));
walls.push(...[{x:103,y:43,w:15,d:1},{x:96,y:49,w:1,d:13},{x:106,y:55,w:12,d:1},{x:119,y:49,w:1,d:15},{x:114,y:94,w:18,d:1},{x:106,y:100,w:1,d:13},{x:120,y:107,w:15,d:1},{x:57,y:103,w:18,d:1},{x:48,y:109,w:1,d:13},{x:64,y:116,w:16,d:1},{x:29,y:115,w:12,d:1},{x:22,y:121,w:1,d:13}]);
export const outdoorWindows=[{x:104,y:55},{x:59,y:116}];
export const outdoorPallets=[{x:104,y:43},{x:115,y:94},{x:57,y:103},{x:29,y:115},{x:109,y:72}];
// Cut real openings rather than placing vaultable props over solid walls.
for(const opening of [...outdoorWindows,...outdoorPallets]){const index=walls.findIndex(w=>w.w>w.d&&w.y===opening.y&&Math.abs(w.x-opening.x)<w.w/2-2);if(index<0)continue;const wall=walls.splice(index,1)[0],left=wall.x-wall.w/2,right=wall.x+wall.w/2;for(const [a,b] of [[left,opening.x-2],[opening.x+2,right]])if(b>a)walls.push({x:(a+b)/2,y:wall.y,w:b-a,d:wall.d});}
walls.push(...[{x:51,y:33,w:8,d:1},{x:55,y:36,w:1,d:6},{x:23,y:75,w:7,d:1},{x:79,y:63,w:8,d:1},{x:91,y:39,w:10,d:1},{x:86,y:44,w:1,d:10},{x:92,y:50,w:8,d:1},{x:107,y:47,w:1,d:8},{x:114,y:102,w:9,d:1},{x:119,y:99,w:1,d:6},{x:112.5,y:72,w:3,d:1}]);
obstacles.push({x:103,y:72,r:4,type:'rock',h:3.2});
export const factory={height:9,footprint:[[44,88],[84,88],[84,94],[96,94],[96,124],[88,124],[88,134],[44,134]],rooms:[{x:51,y:122},{x:81,y:121}]};
for(let i=walls.length-1;i>=0;i--)if(walls[i].x>=44&&walls[i].x<=96&&walls[i].y>=88)walls.splice(i,1);
for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i].x>40&&obstacles[i].x<100&&obstacles[i].y>84)obstacles.splice(i,1);
walls.push(...[
  {x:52,y:88,w:16,d:1},{x:75,y:88,w:18,d:1},{x:84,y:91,w:1,d:6},{x:90,y:94,w:12,d:1},
  {x:96,y:101,w:1,d:14},{x:96,y:120,w:1,d:8},{x:92,y:124,w:8,d:1},{x:88,y:129,w:1,d:10},
  {x:50,y:134,w:12,d:1},{x:75,y:134,w:26,d:1},{x:44,y:95,w:1,d:14},{x:44,y:118,w:1,d:32},
  {x:47,y:122,w:4,d:1},{x:56,y:122,w:6,d:1},{x:59,y:127.5,w:1,d:11},
  {x:75,y:121,w:8,d:1},{x:85,y:121,w:4,d:1},{x:71,y:127.5,w:1,d:13}
].map(w=>({...w,h:9,factory:true})));
export const railings=[{x:68,y:99,w:22,d:.4},{x:68,y:116,w:22,d:.4},{x:57,y:107.5,w:.4,d:17},{x:79,y:107.5,w:.4,d:17}];
walls.push(...railings.map(w=>({...w,h:1.3,rail:true})));
outdoorWindows.splice(outdoorWindows.findIndex(w=>w.x===59),1);
outdoorWindows.push(...factory.rooms);
outdoorPallets.splice(outdoorPallets.findIndex(p=>p.x===57),1);
outdoorPallets.push({x:62,y:88},{x:59,y:134});
export const upperDeck={x:115,y:14,w:14,d:12,z:4};
export function groundHeight(x,y,z=0){return map.groundHeight(x,y,z);}
walls.push({x:108,y:14,w:.4,d:12,h:1.3,base:4,rail:true},{x:122,y:14,w:.4,d:12,h:1.3,base:4,rail:true},{x:115,y:8,w:14,d:.4,h:1.3,base:4,rail:true});
walls.splice(0,walls.length,...map.walls);obstacles.splice(0,obstacles.length,...map.obstacles);outdoorWindows.splice(0,outdoorWindows.length,...map.outdoorWindows);outdoorPallets.splice(0,outdoorPallets.length,...map.outdoorPallets);Object.assign(factory,map.factory);Object.assign(upperDeck,map.upperDeck);
export const ramps=map.ramps,upperFloors=map.upperFloors;
export class Game{
  constructor(){this.characterId='mercenary';this.hunterId='ripper';this.role='survivor';this.reset();}
  reset(){this.resetState();this.configureMap();this.attack=null;this.healing=false;this.collisionHeight=0;this.palletVaultLock=0;this.palletReleaseRequired=false;}
  get controlled(){return this.role==='hunter'?this.hunter:this.player;}
  get currentHunter(){return hunters.find(h=>h.id===this.hunterId)||hunters[0];}
  selectHunter(id){if(this.status!=='ready'||!hunters.some(h=>h.id===id))return false;this.hunterId=id;return true;}
  configureMap(){
    this.player={x:40,y:70,z:0,angle:0,health:2,nickname:'我'};
    this.hunter={x:150,y:60,z:0,angle:0};
    this.survivors=[this.player];
    this.windows=map.outdoorWindows.map(w=>({...w}));
    this.pallets=[{x:24,y:81},...map.outdoorPallets].map(p=>({...p,down:false,drop:0,broken:false}));
    this.generators=[{x:28,y:42,p:0},{x:121,y:96,p:0},{x:159,y:143,p:0}];
    this.exits=map.exits.map(e=>({...e,p:0}));
    this.exit=this.exits[0];
  }
  setupLANSession(config,myId){
    this.survivors=[];
    const humans=config.roster||[];
    const humanHunter=humans.find(p=>p.role==='hunter');
    if(humanHunter){
      this.hunter.nickname=humanHunter.nickname;
      this.hunter.character=humanHunter.character;
      this.hunter.isLocal=(humanHunter.id===myId);
      this.hunter.isAi=false;
    }else{
      this.hunter.nickname='AI监管者';
      this.hunter.character='ripper';
      this.hunter.isLocal=false;
      this.hunter.isAi=true;
    }

    const humanSurvivors=humans.filter(p=>p.role==='survivor');
    humanSurvivors.forEach((hs,idx)=>{
      const isMe=(hs.id===myId);
      const spawnPts=[{x:40,y:70},{x:160,y:125},{x:35,y:120},{x:140,y:45}];
      const pt=spawnPts[idx%spawnPts.length];
      if(isMe){
        this.player.x=pt.x;this.player.y=pt.y;this.player.z=0;this.player.id=myId;this.player.nickname=hs.nickname;
        this.survivors.push(this.player);
      }else{
        this.survivors.push({id:hs.id,nickname:hs.nickname,character:hs.character,x:pt.x,y:pt.y,z:0,angle:0,health:2,isLocal:false,isAi:false});
      }
    });

    if(config.needsAiSurvivors>0){
      const aiNames=['AI·园丁','AI·幸运儿','AI·魔术师'];
      const spawnPts=[{x:55,y:150},{x:125,y:50},{x:165,y:90}];
      for(let i=0;i<config.needsAiSurvivors&&i<aiNames.length;i++){
        const pt=spawnPts[i];
        this.survivors.push({id:'ai_surv_'+i,nickname:aiNames[i],character:'doctor',x:pt.x,y:pt.y,z:0,angle:0,health:2,isLocal:false,isAi:true,aiTimer:0});
      }
    }
    if(!this.survivors.includes(this.player)&&this.role==='survivor'){
      this.survivors.unshift(this.player);
    }
  }
  selectRole(role){if(this.status!=='ready'||!['survivor','hunter'].includes(role))return false;this.role=role;return true;}
  unstick(actor){this.collisionHeight=actor.z||0;if(!this.blocked(actor.x,actor.y)){this.collisionHeight=0;return;}this.resolveCollision(actor);this.collisionHeight=0;this.pathTimer=0;}
  breakPallet(){const p=this.pallets.find(p=>p.down&&!p.broken&&distance(p,this.hunter)<4);if(!p)return false;if(!this.attack)this.beginAttack();return true;}
  beginAttack(charged=false){
    if(this.attack||this.stun>0||this.hunterAttackCooldown>0)return false;
    this.attack={phase:'windup',elapsed:0,angle:this.hunter.angle||0,charged,duration:charged?.85:.45};
    this.message=charged?'监管者蓄力重击！':'监管者挥刀！';
    return true;
  }
  inAttackCone(target){
    if(Math.abs((target.z||0)-(this.hunter.z||0))>1.5)return false;
    const dx=target.x-this.hunter.x,dy=target.y-this.hunter.y,d=Math.hypot(dx,dy);
    const reach=this.attack?.charged?6.2:(this.hunterId==='ripper'?5.5:4.8);
    if(d<.00001)return true;
    const angle=this.attack?.angle??this.hunter.angle??0;
    const forward=(dx*Math.sin(angle)+dy*Math.cos(angle))/d;
    if(forward<-.000001)return false;
    const extra=forward>=Math.SQRT1_2-.000001?.8:0;
    return d<=reach+extra;
  }
  updateAttack(dt){
    if(!this.attack)return;
    if(this.stun>0){this.attack=null;return;}
    const a=this.attack;
    a.elapsed+=dt;
    if(a.phase==='windup'&&a.elapsed>=a.duration){
      let hit=false;
      const p=this.pallets.find(p=>p.down&&!p.broken&&this.inAttackCone(p));
      if(p){
        p.broken=true;p.down=false;this.pathTimer=0;
        this.message='挥刀劈碎木板！';hit=true;
      }else{
        const activeSurvivors=[this.player,...(this.survivors?this.survivors.filter(s=>s!==this.player&&s.id!==this.player.id&&(s.health||2)>0):[])];
        const hitTarget=activeSurvivors.find(s=>this.inAttackCone(s)&&(s===this.player?this.invincible:(s.invincible||0))<=0);
        if(hitTarget){
          this.stopDecode();
          const hasShield=(hitTarget===this.player?this.shield>0:hitTarget.shield>0);
          if(hasShield){
            if(hitTarget===this.player)this.shield=0;
            hitTarget.shield=0;
            this.message='役鸟抵挡攻击！';
          }else{
            hitTarget.health=Math.max(0,(hitTarget===this.player?this.health:(hitTarget.health??2))-(this.detention>0?2:1));
            if(hitTarget===this.player){this.health=hitTarget.health;this.invincible=3;this.vault=null;this.dashRemaining=0;}
            hitTarget.vault=null;
            hitTarget.dashRemaining=0;
            hitTarget.healProgress=0;
            hitTarget.invincible=3;
            this.message=hitTarget.health>0?`击中【${hitTarget.nickname||'求生者'}】！`:`【${hitTarget.nickname||'求生者'}】已倒地！`;
            if(hitTarget===this.player&&hitTarget.health<=0)this.status='lost';
          }
          hit=true;
        }
      }
      a.phase='recovery';a.elapsed=0;
      a.recoveryTime=hit?1.8:0.9;
      this.hunterAttackCooldown=a.recoveryTime;
      if(!hit)this.message='出刀落空（擦刀间隙）';
    }else if(a.phase==='recovery'&&a.elapsed>=a.recoveryTime){
      this.attack=null;this.hunterAttackCooldown=0;
    }
  }
  get character(){return characters.find(c=>c.id===this.characterId)||characters[0];}
  selectCharacter(id){if(this.status!=='ready'||!characters.some(c=>c.id===id))return false;this.characterId=id;return true;}
  resetState(){this.player={x:48,y:73,angle:0};this.hunter={x:12,y:20,angle:0};this.generators=[];this.pallets=[];this.windows=[];this.exit={x:136,y:50,p:0};this.health=2;this.healProgress=0;this.dashCooldown=0;this.dashFlash=0;this.dashRemaining=0;this.dashDirection=null;this.shield=0;this.smoke=null;this.vault=null;this.vaultBoost=0;this.time=300;this.status='ready';this.invincible=0;this.stun=0;this.elapsed=0;this.message='选择角色，开始演练';this.alert=0;this.path=[];this.pathTimer=0;this.memory=0;this.interacting=false;this.chasing=false;this.lastDash=false;this.lastInteract=false;this.vaultCooldown=0;this.hunterAttackCooldown=0;this.decoding=null;this.calibration=null;this.nextCalibration=0;}
  start(){if(this.status==='ready'){this.configureMap();this.palletVaultLock=0;this.palletReleaseRequired=false;this.healing=false;this.healProgress=0;this.time=300;this.attack=null;this.status='playing';this.message='破译三台密码机，开启任意逃生门';}}
  get powered(){const n=this.generators.filter(g=>g.p>=100).length;return this.generators.length>=7?Math.min(3,n*3/5):n;}
  startDecode(g){if(this.status!=='playing'||this.vault||this.dashRemaining>0||!this.generators.includes(g)||g.p>=100||distance(this.player,g)>=6)return false;if(this.decoding===g){this.stopDecode();return true;}this.decoding=g;this.calibration=null;this.nextCalibration=3+Math.random()*2;this.message='正在破译 · 移动可退出';return true;}
  stopDecode(){this.decoding=null;this.calibration=null;if(this.healing){this.healing=false;this.healProgress=0;}}
  failCalibration(){if(!this.calibration||!this.decoding)return;this.decoding.p=Math.max(0,this.decoding.p-10);this.alert=8;this.message='校准失败！追猎者听到了声响';this.calibration=null;this.nextCalibration=3+Math.random()*3;}
  calibrate(){if(!this.calibration||!this.decoding||this.status!=='playing')return false;const p=this.calibration.elapsed/this.calibration.duration;if(p>=.58&&p<=.76){const perfect=p>=.65&&p<=.69;this.decoding.p=Math.min(100,this.decoding.p+(perfect?6:3));this.message=perfect?'完美校准！':'校准成功';this.calibration=null;this.nextCalibration=3+Math.random()*3;return true;}this.failCalibration();return false;}
  updateDecode(dt){if(!this.decoding)return;if(distance(this.player,this.decoding)>=6){this.stopDecode();return;}if(this.calibration){this.calibration.elapsed+=dt;if(this.calibration.elapsed>=this.calibration.duration)this.failCalibration();return;}this.decoding.p=Math.min(100,this.decoding.p+dt*6);if(this.decoding.p>=100){this.message='密码机破译完成';this.alert=8;this.stopDecode();return;}this.nextCalibration-=dt;if(this.nextCalibration<=0){this.calibration={elapsed:0,duration:1.8};this.message='校准！在亮色区域点击或按空格';}}
  get nearby(){const objects=[...this.generators.filter(g=>g.p<100).map(g=>({...g,ref:g,type:'generator'})),...this.pallets.filter(p=>!p.broken).map(p=>({...p,ref:p,type:p.down?'palletVault':'pallet'})),...this.windows.map(w=>({...w,ref:w,type:'window'})),...(this.powered===3?this.exits.map(e=>({...e,ref:e,type:'exit'})):[])];return objects.filter(o=>Math.abs((o.z||0)-(this.player.z||0))<1.5).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0];}
  get collisionRects(){const z=this.collisionHeight||0;return [...walls,...obstacles.filter(o=>o.type==='rock').map(o=>({...o,h:o.h})),...this.pallets.filter(p=>p.down&&!p.broken).map(p=>({x:p.x,y:p.y,w:4,d:1})),...this.windows.map(w=>({x:w.x,y:w.y,w:4,d:1}))].filter(w=>z<(w.base||0)+(w.h||2)&&z+2.8>(w.base||0));}
  blocked(x,y,r=1){return x<2||y<2||x>SIZE-2||y>SIZE-2||obstacles.filter(o=>o.type==='tree').some(o=>Math.hypot(x-o.x,y-o.y)<o.r+r-.00001)||this.collisionRects.some(w=>{const nx=Math.max(w.x-w.w/2,Math.min(w.x+w.w/2,x)),ny=Math.max(w.y-w.d/2,Math.min(w.y+w.d/2,y));return Math.hypot(x-nx,y-ny)<r-.00001;});}
  resolveCollision(actor){const r=1,epsilon=.0001;actor.x=Math.max(2,Math.min(SIZE-2,actor.x));actor.y=Math.max(2,Math.min(SIZE-2,actor.y));for(let pass=0;pass<5;pass++){for(const o of obstacles){const dx=actor.x-o.x,dy=actor.y-o.y,d=Math.hypot(dx,dy),min=r+o.r;if(d<min){actor.x=o.x+(d?dx/d:1)*(min+epsilon);actor.y=o.y+(d?dy/d:0)*(min+epsilon);}}for(const w of this.collisionRects){const left=w.x-w.w/2,right=w.x+w.w/2,top=w.y-w.d/2,bottom=w.y+w.d/2,nx=Math.max(left,Math.min(right,actor.x)),ny=Math.max(top,Math.min(bottom,actor.y)),dx=actor.x-nx,dy=actor.y-ny,d=Math.hypot(dx,dy);if(d>0&&d<r){actor.x=nx+dx/d*(r+epsilon);actor.y=ny+dy/d*(r+epsilon);}else if(d===0){const sides=[{d:actor.x-left,x:left-r-epsilon,y:actor.y},{d:right-actor.x,x:right+r+epsilon,y:actor.y},{d:actor.y-top,x:actor.x,y:top-r-epsilon},{d:bottom-actor.y,x:actor.x,y:bottom+r+epsilon}].sort((a,b)=>a.d-b.d);actor.x=sides[0].x;actor.y=sides[0].y;}}}actor.x=Math.max(2,Math.min(SIZE-2,actor.x));actor.y=Math.max(2,Math.min(SIZE-2,actor.y));}
  move(actor,x,y){actor.z=actor.z||0;this.collisionHeight=actor.z;const n=Math.max(1,Math.ceil(Math.hypot(x,y)/.2));for(let i=0;i<n;i++){const old={x:actor.x,y:actor.y};if(map.canStep(actor,actor.x+x/n,actor.y+y/n)){actor.x+=x/n;actor.y+=y/n;this.resolveCollision(actor);const nz=groundHeight(actor.x,actor.y,actor.z);if(actor.z-nz>.6)actor.falling=true;else if(!actor.falling)actor.z=nz;}else Object.assign(actor,old);this.collisionHeight=actor.z;}this.collisionHeight=0;if(x||y)actor.angle=Math.atan2(x,y);}
  updateFalls(dt){for(const actor of [this.player,this.hunter]){if(!actor.falling)continue;actor.fallSpeed=(actor.fallSpeed||0)+24*dt;const floor=groundHeight(actor.x,actor.y,0);actor.z=Math.max(floor,actor.z-actor.fallSpeed*dt);if(actor.z<=floor){actor.falling=false;actor.fallSpeed=0;this.collisionHeight=floor;this.resolveCollision(actor);this.collisionHeight=0;}}}
  separateActors(){if(this.vault||Math.abs((this.player.z||0)-(this.hunter.z||0))>1.5)return;const dx=this.hunter.x-this.player.x,dy=this.hunter.y-this.player.y,d=Math.hypot(dx,dy),min=1.65;if(d>=min)return;const nx=d?dx/d:Math.sin(this.hunter.angle||0),ny=d?dy/d:Math.cos(this.hunter.angle||0);this.move(this.hunter,nx*(min-d),ny*(min-d));}
  dash(x=0,y=0){
    if(this.status!=='playing'||this.dashCooldown>0||this.vault)return false;
    this.stopDecode();
    const len=Math.hypot(x,y);
    if(len>.1)this.player.angle=Math.atan2(x,y);

    if(this.characterId==='perfumer'){
      if(this.perfumeState){
        // Rewind position and restore saved health
        this.player.x=this.perfumeState.x;
        this.player.y=this.perfumeState.y;
        this.player.z=this.perfumeState.z||0;
        this.health=Math.max(this.health,this.perfumeState.health);
        this.perfumeState=null;
        this.dashCooldown=5;
        this.message='忘忧之香 · 状态已回溯';
        return true;
      }else{
        this.perfumeState={x:this.player.x,y:this.player.y,z:this.player.z||0,health:this.health,timer:3.5};
        this.dashFlash=3.5;
        this.message='香气记录中 · 3.5秒内再次使用回溯';
        return true;
      }
    }

    if(this.characterId==='doctor'){
      if(this.health!==1){this.message='健康时无需自愈';return false;}
      this.healing=true;this.healProgress=0;this.message='医生正在自愈 · 保持静止';
    }else if(this.characterId==='seer'){
      this.shield=2.5;this.message='役鸟守护 · 2.5秒内抵挡一次攻击';
    }else if(this.characterId==='prospector'){
      // Magnet repels: push hunter away or bounce player back
      const dx=this.hunter.x-this.player.x,dy=this.hunter.y-this.player.y,d=Math.hypot(dx,dy);
      if(d<12){
        this.hunter.x+=dx/d*6;this.hunter.y+=dy/d*6;this.resolveCollision(this.hunter);
        this.player.x-=dx/d*5;this.player.y-=dy/d*5;this.resolveCollision(this.player);
        this.stun=1.5;
        this.message='同极磁铁互斥！追猎者被弹开并眩晕';
      }else{
        const fx=Math.sin(this.player.angle),fy=Math.cos(this.player.angle);
        this.player.x-=fx*7;this.player.y-=fy*7;this.resolveCollision(this.player);
        this.message='磁力排斥 · 自身后撤弹射';
      }
    }else if(this.characterId==='acrobat'){
      const fx=Math.sin(this.player.angle),fy=Math.cos(this.player.angle);
      this.player.x+=fx*8;this.player.y+=fy*8;this.resolveCollision(this.player);
      this.smoke={x:this.player.x-fx*3,y:this.player.y-fy*3,time:3.5,r:6};
      this.message='爆弹翻跃 · 留下余烬减速障';
    }else if(this.characterId==='forward'){
      this.dashDirection={x:Math.sin(this.player.angle),y:Math.cos(this.player.angle)};
      this.dashRemaining=1.4;this.dashFlash=1.4;
      this.message='橄榄球冲刺！高速冲锋撞击';
    }else if(this.characterId==='coordinator'){
      const dx=this.hunter.x-this.player.x,dy=this.hunter.y-this.player.y,d=Math.hypot(dx,dy);
      if(d<28&&this.visible()){
        this.stun=3.2;this.alert=5;
        this.message='信号枪命中！追猎者原地眩晕 3.2 秒';
      }else{
        this.message='信号枪落空（距离过远或视线受阻）';
      }
    }else if(this.characterId==='priestess'){
      const fx=Math.sin(this.player.angle),fy=Math.cos(this.player.angle);
      let passed=false;
      for(let step=3;step<=9;step+=.5){
        const nx=this.player.x+fx*step,ny=this.player.y+fy*step;
        if(!this.blocked(nx,ny)){
          this.player.x=nx;this.player.y=ny;passed=true;break;
        }
      }
      this.message=passed?'门之钥 · 直线通道穿墙穿透！':'前方开阔，无需打通通道';
    }else if(this.characterId==='antiquarian'){
      const dx=this.hunter.x-this.player.x,dy=this.hunter.y-this.player.y,d=Math.hypot(dx,dy);
      if(d<6.5){
        this.hunter.x+=dx/d*5;this.hunter.y+=dy/d*5;this.resolveCollision(this.hunter);
        this.hunterAttackCooldown=2.5;
        this.message='藏锋横扫！击退追猎者并缴械 2.5 秒';
      }else{
        this.message='机关棍挥空';
      }
    }else if(this.characterId==='cheerleader'){
      this.vaultBoost=2.5;
      this.invincible=Math.max(this.invincible,1.2);
      this.message='振奋鼓舞！移动速度爆发 +40%';
    }else if(this.characterId==='puppeteer'){
      this.shield=3;
      this.message='应激屏障生效 · 抵挡下一次攻击';
    }else{
      // Mercenary / default continuous high speed dash
      this.dashDirection={x:Math.sin(this.player.angle),y:Math.cos(this.player.angle)};
      if(this.blocked(this.player.x+this.dashDirection.x*.4,this.player.y+this.dashDirection.y*.4))return false;
      this.dashRemaining=.9;this.dashFlash=.9;this.message='钢铁冲刺！肘部护腕高速弹射';
    }
    this.dashCooldown=5;
    return true;
  }
  beginVault(o){if(this.vault||this.dashRemaining>0||this.vaultCooldown>0||o.type==='palletVault'&&(this.palletVaultLock>0||this.palletReleaseRequired)||Math.abs(this.player.x-o.x)>2.6||Math.abs(this.player.y-o.y)>3)return false;const sign=this.player.y<o.y?1:-1,to={x:o.x,y:o.y+sign*1.8};if(this.blocked(to.x,to.y,.85))return false;this.stopDecode();this.vault={from:{...this.player},to,elapsed:0,duration:1,type:o.type,boost:o.type==='window'};this.player.angle=sign>0?0:Math.PI;this.message=o.type==='window'?'翻越窗口':'翻越木板';return true;}
  visible(){if(this.smoke&&(distance(this.player,this.smoke)<this.smoke.r||distance(this.hunter,this.smoke)<this.smoke.r))return false;const d=distance(this.player,this.hunter);for(let i=0;i<=d;i+=.5){const t=i/Math.max(d,1),x=this.hunter.x+(this.player.x-this.hunter.x)*t,y=this.hunter.y+(this.player.y-this.hunter.y)*t;if(obstacles.some(o=>Math.hypot(x-o.x,y-o.y)<o.r)||walls.some(w=>Math.abs(x-w.x)<w.w/2&&Math.abs(y-w.y)<w.d/2))return false;}return true;}
  findPath(target){const n=SIZE/2,key=(x,y)=>y*n+x,start={x:Math.floor(this.hunter.x/2),y:Math.floor(this.hunter.y/2)},end={x:Math.floor(target.x/2),y:Math.floor(target.y/2)},queue=[start],seen=new Map([[key(start.x,start.y),null]]);let found=null;for(let k=0;k<queue.length;k++){const a=queue[k];if(a.x===end.x&&a.y===end.y){found=a;break;}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=a.x+dx,y=a.y+dy,id=key(x,y);if(x<0||y<0||x>=n||y>=n||seen.has(id)||this.blocked(x*2+1,y*2+1,.8))continue;seen.set(id,a);queue.push({x,y});}}const path=[];while(found){path.unshift({x:found.x*2+1,y:found.y*2+1});found=seen.get(key(found.x,found.y));}return path.slice(1);}
  update(dt,input){if(this.status!=='playing')return;if(this.role==='hunter'){this.hunterInput=input;const danger=distance(this.hunter,this.player)<18;const target=danger?{x:Math.max(3,Math.min(97,this.player.x+(this.player.x-this.hunter.x)*2)),y:Math.max(3,Math.min(97,this.player.y+(this.player.y-this.hunter.y)*2))}:this.generators.find(g=>g.p<100)||this.exit;const dx=target.x-this.player.x,dy=target.y-this.player.y,l=Math.hypot(dx,dy)||1;const near=this.nearby;this.updateSimulation(dt,{x:danger||l>4?dx/l:0,y:danger||l>4?dy/l:0,interact:!danger&&l<6||danger&&near?.type==='pallet'&&distance(near,this.player)<3.5,dash:danger&&this.dashCooldown===0});}else this.updateSimulation(dt,input);}
  updateSimulation(dt,input){if(this.status!=='playing')return;this.elapsed+=dt;this.time-=dt;for(const p of ['invincible','stun','alert','dashCooldown','dashFlash','shield','vaultBoost','vaultCooldown','hunterAttackCooldown'])this[p]=Math.max(0,this[p]-dt);if(this.smoke){this.smoke.time-=dt;if(this.smoke.time<=0)this.smoke=null;}this.pallets.forEach(p=>p.drop=Math.max(0,p.drop-dt));this.unstick(this.hunter);let {x=0,y=0}=input,len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}if(input.dash&&!this.lastDash)this.dash(x,y);this.lastDash=!!input.dash;
    if(this.perfumeState){
      this.perfumeState.timer-=dt;
      if(this.perfumeState.timer<=0){
        this.perfumeState=null;
        this.dashFlash=0;
        this.dashCooldown=5;
      }
    }
    if(this.healing){if(len>.1||this.health!==1||this.vault||this.dashRemaining>0){this.healing=false;this.healProgress=0;}else{this.healProgress=Math.min(100,this.healProgress+dt*100/3);if(this.healProgress>=100){this.health=2;this.healing=false;this.healProgress=0;this.message='自愈完成';}}}
    const dropping=this.palletVaultLock>0;this.palletVaultLock=Math.max(0,(this.palletVaultLock||0)-dt);
    if(!input.interact&&this.palletVaultLock===0)this.palletReleaseRequired=false;
    const locked=!!this.vault||this.dashRemaining>0||this.healing||dropping;
    if(this.vault){const v=this.vault;v.elapsed=Math.min(v.duration,v.elapsed+dt);const t=v.elapsed/v.duration,s=t*t*(3-2*t);this.player.x=v.from.x+(v.to.x-v.from.x)*s;this.player.y=v.from.y+(v.to.y-v.from.y)*s;if(t>=1){this.vault=null;this.vaultCooldown=.2;if(v.boost)this.vaultBoost=2;}}
    else if(this.dashRemaining>0){const step=Math.min(dt,this.dashRemaining),d=this.dashDirection,n=Math.ceil(step*26/.2);for(let i=0;i<n;i++){const nx=this.player.x+d.x*step*26/n,ny=this.player.y+d.y*step*26/n;if(this.blocked(nx,ny)){this.dashRemaining=0;break;}this.player.x=nx;this.player.y=ny;}this.dashRemaining=Math.max(0,this.dashRemaining-step);if(this.dashRemaining<.00001)this.dashRemaining=0;}
    else if(!dropping){if(this.decoding&&len>.1)this.stopDecode();const speed=(this.invincible>0?18:this.health===1?9:10)*(this.vaultBoost>0?1.3:1);this.move(this.player,x*speed*dt,y*speed*dt);}
    this.updateDecode(dt);const near=this.nearby,interaction=!!input.interact;this.interacting=false;if(!locked&&interaction&&near&&distance(near,this.player)<6){this.interacting=true;if(near.type==='pallet'&&!this.lastInteract&&distance(near,this.player)<3.5){near.ref.down=true;near.ref.drop=.4;this.message='放下木板';if(distance(near,this.hunter)<4){this.stun=3;this.message='木板命中！';}this.pathTimer=0;}else if((near.type==='window'||near.type==='palletVault')&&!this.lastInteract)this.beginVault(near);else if(len<.1&&near.type==='heal'){this.healProgress=Math.min(100,this.healProgress+dt*12.5);if(this.healProgress>=100){this.health=2;this.healProgress=0;this.message='包扎完成';}}else if(near.type==='generator'&&!this.lastInteract)this.startDecode(near.ref);else if(len<.1&&near.type==='exit'){near.ref.p=Math.min(100,near.ref.p+dt*25);if(near.ref.p===100)this.message='闸门已开启';}}this.lastInteract=interaction;
    if(this.pallets.some(p=>p.drop===.4)){this.palletVaultLock=1;this.palletReleaseRequired=true;}
    // Update AI Bots (survivors) if present
    if(this.survivors){
      for(const s of this.survivors){
        if(s.isAi&&(s.health||2)>0){
          const hd=distance(s,this.hunter);
          if(hd<14){
            // Flee away from hunter
            const fx=s.x-this.hunter.x,fy=s.y-this.hunter.y,fl=Math.hypot(fx,fy)||1;
            this.move(s,fx/fl*9*dt,fy/fl*9*dt);
          }else{
            // Work on closest unfinished cipher
            const targetGen=this.generators.find(g=>g.p<100);
            if(targetGen){
              const gd=distance(s,targetGen);
              if(gd>3.5){
                const gx=targetGen.x-s.x,gy=targetGen.y-s.y,gl=Math.hypot(gx,gy)||1;
                this.move(s,gx/gl*8*dt,gy/gl*8*dt);
              }else{
                targetGen.p=Math.min(100,targetGen.p+dt*4.5);
              }
            }
          }
        }
      }
    }

    const activeSurvivors=(this.survivors&&this.survivors.length)?this.survivors.filter(s=>(s.health||2)>0):[this.player];
    let closestTarget=this.player,closestDist=1e9;
    for(const s of activeSurvivors){
      const sd=distance(s,this.hunter);
      if(sd<closestDist){closestDist=sd;closestTarget=s;}
    }
    const d=closestDist;
    const hidden=this.smoke&&distance(closestTarget,this.smoke)<this.smoke.r;
    if(!hidden&&((d<30&&this.visible())||this.alert>0))this.memory=5;else this.memory=Math.max(0,this.memory-dt);
    if(hidden)this.memory=0;this.chasing=this.memory>0;
    const target=this.chasing?closestTarget:{x:50+34*Math.sin(this.elapsed*.07),y:50+30*Math.cos(this.elapsed*.07)};
    this.pathTimer-=dt;if(this.pathTimer<=0){this.path=this.findPath(target);this.pathTimer=.65;}
    if(this.attack?.phase==='windup'&&this.role!=='hunter'&&this.stun===0&&this.attack.target==='survivor'){const dx=closestTarget.x-this.hunter.x,dy=closestTarget.y-this.hunter.y,l=Math.hypot(dx,dy)||1,step=Math.min(Math.max(0,l-1.65),Math.max(0,Math.min(dt,.55-this.attack.elapsed))*11.2);this.attack.angle=Math.atan2(dx,dy);this.hunter.angle=this.attack.angle;this.move(this.hunter,dx/l*step,dy/l*step);}
    this.updateAttack(dt);
    if(this.stun===0&&!this.attack&&this.role!=='hunter'&&!this.aiHunterDisabled){
      const pallet=this.pallets.find(p=>p.down&&!p.broken&&distance(p,this.hunter)<4);
      if(pallet){
        this.hunter.angle=Math.atan2(pallet.x-this.hunter.x,pallet.y-this.hunter.y);
        this.beginAttack();
      }else if(d<(this.attackDistance??2.2)&&this.visible()){
        this.hunter.angle=Math.atan2(closestTarget.x-this.hunter.x,closestTarget.y-this.hunter.y);
        if(this.beginAttack())this.attack.target='survivor';
        this.attackDistance=1.9+Math.random()*.6;
      }else{
        let next=this.path[0]||target;
        if(distance(next,this.hunter)<1){this.path.shift();next=this.path[0]||target;}
        const dx=next.x-this.hunter.x,dy=next.y-this.hunter.y,l=Math.hypot(dx,dy)||1;
        this.move(this.hunter,dx/l*dt*(this.chasing?11.2:6),dy/l*dt*(this.chasing?11.2:6));
      }
    }
    if(this.role==='hunter'&&this.stun===0&&!this.attack){
      const h=this.hunterInput||{},l=Math.hypot(h.x||0,h.y||0)||1;
      this.move(this.hunter,(h.x||0)/Math.max(1,l)*11.2*dt,(h.y||0)/Math.max(1,l)*11.2*dt);
      if(h.dash)this.beginAttack(false); // Quick light attack
      else if(h.interact)this.beginAttack(true); // Charged heavy attack (wider reach, longer windup)
    }
    this.updateFalls(dt);this.separateActors();
    if(this.role==='hunter'&&this.calibration&&this.calibration.elapsed/this.calibration.duration>=.65)this.calibrate();
    if(this.exits.some(e=>e.p>=100&&(this.player.x-e.x)*e.side>-2&&Math.abs(this.player.y-e.y)<7&&(this.player.z||0)<1)){this.status='won';this.message='成功逃离雾港';}if(this.time<=0){this.time=0;this.status='lost';this.message='时间耗尽';}
  }
}
hunters.splice(0,hunters.length,
 {id:'smiley',name:'小丑',skill:'火箭冲刺',cooldown:5,color:0xa94f30,description:'长按技能键冲刺，最多10秒，撞到求生者造成一次伤害。'},
 {id:'ripper',name:'杰克',skill:'雾刃',cooldown:5,color:0x304350,description:'发射速度30的雾刃，最长72距离，可躲避且被障碍物阻挡。'},
 {id:'naiad',name:'渔女',skill:'水迹（被动）',cooldown:5,color:0x648d9b,description:'行走留下水迹，闭合形成水圈；圈内积累湿气，满100%造成伤害。无主动技能。'});
