import {Game, obstacles, walls, characters, hunters, distance, palletPose, SIZE, factory, upperDeck, groundHeight, ramps, upperFloors} from './game.js';
import {inputKey, isGameKey} from './input.js';
import {roofs} from './map.js';
import {enableLayoutEditor} from './layout.js';
import {buildArchitecture} from './architecture.js';
import {SharedMatch} from './match.js';
import {chairLocations} from './chairs.js';
import {renderTeam} from './team-status.js';
const $=s=>document.querySelector(s), game=new Game(), canvas=$('#flat'),ctx=canvas.getContext('2d');
$('#settings').appendChild($('#editLayout'));$('#editLayout').hidden=!matchMedia('(pointer:coarse)').matches;const layoutEditing=enableLayoutEditor();
let view='third',keys={},joy={x:0,y:0},held={interact:false,sprint:false,dash:false},tapped={interact:false,dash:false},width=900,height=600,time=0,last=0,cameraAngle=0,cameraPitch=.18,three=null,loading=false;
const names={top:'2D / 全局视野',iso:'2.5D / 等距跟随',third:'3D / 第三人称'};

// LAN Multiplayer Networking State
let lanSocket=null,myLanId=null,lanRoomCode=null,lanPeers=new Map(),lanRoster=[];
let sharedMatch=false;
let chairState=null;
let teamActors=[];
$('#returnRoom').onclick=()=>{if(localMatch){localMatch=null;sharedMatch=false;game.reset();$('#matchResults').hidden=true;showOverlay();return;}if(lanSocket?.readyState===WebSocket.OPEN)lanSocket.send(JSON.stringify({type:'return_room'}));};
let playMode='single',localMatch=null;
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{playMode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(v=>v.classList.toggle('selected',v===b));$('.lanBar').hidden=playMode!=='online';$('#start').hidden=playMode==='online';});
let roomPhase='seats';
function sendAction(action,index){if(localMatch){localMatch.action(myLanId,action,index);return;}if(lanSocket?.readyState===WebSocket.OPEN)lanSocket.send(JSON.stringify({type:'action',action,index}));}
const localDecode=game.startDecode.bind(game),localCalibrate=game.calibrate.bind(game);game.startDecode=g=>sharedMatch?sendAction('decode',game.generators.indexOf(g)):localDecode(g);game.calibrate=()=>sharedMatch?sendAction('calibrate'):localCalibrate();
function initLANMultiplayer(){
  const statusEl=$('#lanStatus'),btn=$('#lanJoinBtn'),inputRoom=$('#lanRoom'),inputName=$('#lanName'),inputHost=$('#lanHost');
  const lobby=$('#roomLobby'),startBtn=$('#startLanMatchBtn'),leaveBtn=$('#leaveRoomBtn'),botsCheck=$('#fillBotsCheck');
  if(!statusEl||!btn)return;
  const select=$('#serverChoice');select.onchange=()=>{if(select.value==='ali'){location.href='http://121.199.161.5/fogbound/';return;}if(select.value==='current')inputHost.value=location.host;else{inputHost.value='';inputHost.focus();}};
  inputHost.addEventListener('change',()=>{if(select.value==='custom')select.selectedOptions[0].textContent=inputHost.value.trim()||'其他服务器（IP:端口）';});

  // Retrieve remembered nickname & host
  try{
    const savedName=localStorage.getItem('fogbound_nickname');if(savedName&&inputName)inputName.value=savedName;
    const savedHost=localStorage.getItem('fogbound_host');
    if(inputHost)inputHost.value=location.hostname.endsWith('github.io')?(savedHost||''):location.host;
  }catch{}

  // Automatically fetch host LAN IP if connected to local Node server
  fetch(new URL('api/lan-info',location.href)).then(r=>r.json()).then(data=>{
    if(data&&data.ip&&inputHost&&!inputHost.value){
      inputHost.value=`${data.ip}:${data.port||5173}`;
    }
  }).catch(()=>{});

  let pendingAction='list_rooms';
  $('#lanConnectBtn').onclick=()=>{pendingAction='list_rooms';btn.onclick();};
  $('#createRoom').onclick=()=>{pendingAction='create_room';btn.onclick();};
  $('#refreshRooms').onclick=()=>{if(lanSocket?.readyState===WebSocket.OPEN)lanSocket.send(JSON.stringify({type:'list_rooms'}));};
  const sendAction=(nickname,room)=>{if(pendingAction==='list_rooms')lanSocket.send(JSON.stringify({type:'list_rooms'}));else lanSocket.send(JSON.stringify({type:pendingAction,room,name:$('#roomName').value,nickname,role:game.role,character:game.role==='hunter'?game.hunterId:game.characterId}));pendingAction='join_room';};
  btn.onclick=()=>{
    const nickname=(inputName.value||'').trim();
    if(!nickname){
      alert('请先输入玩家昵称！');
      inputName.focus();
      return;
    }
    try{localStorage.setItem('fogbound_nickname',nickname);}catch{}

    let targetHost=(inputHost?.value||'').trim();
    if(!targetHost){
      if(location.hostname.endsWith('github.io')){
        alert('你当前正在 GitHub Pages 在线网页浏览。局域网联机需要在局域网中一台电脑上运行 node server.js，并在地址栏输入该电脑的 IP:5173 即可一键联机！');
        targetHost=prompt('请输入运行 node server.js 电脑的局域网 IP:端口 (例如 192.168.1.5:5173)：')||'';
        if(!targetHost)return;
        inputHost.value=targetHost;
      }else{
        targetHost=location.host||'localhost:5173';
      }
    }
    try{localStorage.setItem('fogbound_host',targetHost);}catch{}

    const room=(inputRoom.value||'8888').trim().toUpperCase().slice(0,6);
    if(lanSocket&&lanSocket.readyState===WebSocket.OPEN){
      sendAction(nickname,room);
      return;
    }

    statusEl.textContent='⏳ 正在连接...';
    try{
      const cleanHost=targetHost.replace(/^https?:\/\//,'').replace(/^wss?:\/\//,'');
      if(location.protocol==='https:'&&cleanHost!==location.host){statusEl.textContent='请直接打开服务器提供的游戏地址';return;}
      const path=cleanHost===location.host?new URL('./ws',location.href).pathname:'/ws';
      const wsUrl=`${location.protocol==='https:'?'wss':'ws'}://${cleanHost}${path}`;
      lanSocket=new WebSocket(wsUrl);
    }catch(err){
      statusEl.textContent='✖ 联机地址格式错误';
      alert('联机地址格式错误，请输入 IP:端口 (例如 192.168.1.5:5173)');
      return;
    }

    lanSocket.onopen=()=>{
      statusEl.textContent='✔ 已连入局域网';
      $('#lanHall').hidden=false;sendAction(nickname,room);
    };
    lanSocket.onmessage=e=>{
      try{
        const msg=JSON.parse(e.data);
        if(msg.type==='returned_room'){sharedMatch=false;game.reset();$('#matchResults').hidden=true;$('#overlay').style.display='flex';}
        else if(msg.type==='world_state'){teamActors=msg.state.actors.filter(a=>a.role==='survivor');chairState=msg.state.chairState;applyWorld(msg.state);}
        else if(msg.type==='rooms_list'){renderRooms(msg.rooms||[]);}
        else if(msg.type==='room_left'){lanRoomCode=null;myLanId=null;lobby.hidden=true;$('#lanHall').hidden=false;$('#start').hidden=false;}
        else if(msg.type==='room_joined'||msg.type==='roster_update'){
          if(msg.type==='room_joined'){myLanId=msg.yourId;lanRoomCode=msg.room;}
          lanRoster=msg.roster||[];
          roomPhase=msg.phase||'seats';renderLobby(lanRoster,msg.fillBots,msg.bots||[]);
        }else if(msg.type==='match_start'){
          lobby.hidden=true;
          beginLANMatch(msg);
        }else if(msg.type==='error'){
          $('#hallFeedback').textContent=msg.message;statusEl.textContent=msg.message;
        }else if(msg.type==='player_left'){
          if(lanPeers.has(msg.id)){
            const peer=lanPeers.get(msg.id);
            if(three&&peer.mesh)three.scene.remove(peer.mesh);
            lanPeers.delete(msg.id);
          }
        }else if(msg.type==='peer_pos'){
          updateLanPeer(msg);
        }else if(msg.type==='peer_event'){
          handleLanEvent(msg);
        }
      }catch(err){}
    };
    lanSocket.onerror=()=>{
      statusEl.textContent='✖ 无法连接到服务器';
      alert(`无法连接到局域网联机服务 [${targetHost}]！\n\n请确保：\n1. 电脑终端已运行 npm start\n2. 手机与电脑连入同一个 Wi-Fi 网络\n3. 输入的 IP 地址正确（可在电脑端终端或通过 ipconfig 查看）`);
    };
    lanSocket.onclose=()=>{
      statusEl.textContent='● 未连接';
      lanSocket=null;sharedMatch=false;game.reset();lobby.hidden=true;$('#start').hidden=false;
    };
  };

  botsCheck.onchange=()=>{
    if(lanSocket&&lanSocket.readyState===WebSocket.OPEN){
      lanSocket.send(JSON.stringify({type:'toggle_bots',fillBots:botsCheck.checked}));
    }
  };

  startBtn.onclick=()=>{
    if(lanSocket&&lanSocket.readyState===WebSocket.OPEN){
      lanSocket.send(JSON.stringify({type:roomPhase==='seats'?'choose_characters':'start_match'}));
    }
  };

  leaveBtn.onclick=()=>{
    if(lanSocket?.readyState===WebSocket.OPEN)lanSocket.send(JSON.stringify({type:'leave_room'}));
  };
}
function renderRooms(rooms){const root=$('#roomsList');root.replaceChildren();if(!rooms.length){root.textContent='暂无房间，点击创建房间邀请好友';return;}for(const r of rooms){const row=document.createElement('button');row.className='hallRoom';row.disabled=r.started||r.count>=r.capacity;row.textContent=`${r.name} · ${r.code} · ${r.count}/${r.capacity} · ${r.started?'对局中':'点击加入'}`;row.onclick=()=>{$('#lanRoom').value=r.code;$('#lanJoinBtn').onclick();};root.appendChild(row);}}

function renderLobby(roster,fillBots,bots=[]){
  const lobby=$('#roomLobby');
  if(!lobby)return;
  lobby.hidden=false;
  $('#lanHall').hidden=true;
  $('#start').hidden=true; // Hide single player start button when in room lobby
  $('#roomCodeText').textContent=lanRoomCode;
  $('#playerCountText').textContent=`${roster.length}人已连接`;
  if($('#fillBotsCheck'))$('#fillBotsCheck').checked=!!fillBots;

  const rosterEl=$('#lobbyRoster');
  rosterEl.innerHTML='';
  for(let slot=0;slot<5;slot++){
    const p=roster.find(p=>p.slot===slot)||{nickname:bots.includes(slot)?'人机':'空位',role:slot===4?'hunter':'survivor',character:''};
    const card=document.createElement('button');card.type='button';
    card.className='playerCard'+(p.id===myLanId?' isMe':'');
    const isHunter=p.role==='hunter';
    const name=document.createElement('span');name.textContent=p.nickname+(p.isHost?' (房主)':'')+(p.id===myLanId?' [你]':'');const role=document.createElement('span');role.className='pRole '+(isHunter?'hunter':'survivor');role.textContent=(isHunter?'监管者':'求生者')+': '+p.character;card.append(name,role);
    const row=document.createElement('div');row.className='seatRow';row.appendChild(card);rosterEl.appendChild(row);
    card.onclick=()=>{if(roomPhase!=='seats')return;if(p.id&&p.id!==myLanId)return;lanSocket.send(JSON.stringify({type:'select_slot',slot}));};
    if(!p.id){const label=document.createElement('label');label.className='seatBotToggle';const tick=document.createElement('input');tick.type='checkbox';tick.checked=bots.includes(slot);tick.disabled=roomPhase!=='seats'||!roster.find(p=>p.id===myLanId)?.isHost;tick.setAttribute('aria-label',`${slot===4?'监管者':'求生者 '+(slot+1)}位置添加人机`);tick.onchange=()=>{tick.disabled=true;lanSocket.send(JSON.stringify({type:'slot_bot',slot}));};const text=document.createElement('span');text.textContent='添加人机';label.append(tick,text);row.appendChild(label);}
  }

  const me=roster.find(p=>p.id===myLanId);
  const isHost=me?.isHost;
  $('#fillBotsCheck').disabled=!isHost;
  $('.lobbyOptions').hidden=true;$('#roleSelect').hidden=true;$('#characterSelect').hidden=roomPhase!=='characters';$('#skillDescription').hidden=roomPhase!=='characters';if(me){game.role=me.role;document.querySelectorAll('[data-role]').forEach(b=>b.classList.toggle('selected',b.dataset.role===me.role));characterMenu();}
  const startBtn=$('#startLanMatchBtn');
  if(roster.length<2){
    startBtn.disabled=true;
    startBtn.textContent=`等待其他玩家加入 (当前${roster.length}/2人)...`;
  }else if(!isHost){
    startBtn.disabled=true;
    startBtn.textContent='等待房主开启对局...';
  }else{
    startBtn.disabled=false;
    startBtn.textContent=roomPhase==='seats'?'进入选角阶段':'确认角色并开始对局';
  }
}

const survivorMeshes=new Map();

function beginLANMatch(config){
  localMatch=null;
  $('#overlay').style.display='none';
  game.reset();
  game.start();
  sharedMatch=true;settings(false);clearInput();survivorMeshes.forEach(m=>three?.scene.remove(m.group));survivorMeshes.clear();return;

  // Clear previous mesh instances
  survivorMeshes.forEach(m=>three?.scene.remove(m.group));
  survivorMeshes.clear();

    if(three){
    // Spawn 3D meshes for all other survivors (human peers and AI bots) in the same map
    game.survivors.forEach(s=>{
      if(s===game.player)return; // Local player already has three.player
      const cObj=character(0x486b56,false);
      // Billboard nickname tag above head
      const cv=document.createElement('canvas');cv.width=256;cv.height=64;
      const cx=cv.getContext('2d');cx.fillStyle='#111a18cc';cx.fillRect(0,0,256,64);
      cx.font='bold 26px sans-serif';cx.textAlign='center';cx.fillStyle='#d6ed91';
      cx.fillText(s.nickname||'求生者',128,42);
      const sp=new three.T.Sprite(new three.T.SpriteMaterial({map:new three.T.CanvasTexture(cv)}));
      sp.scale.set(3,.75,1);sp.position.set(0,3.8,0);
      cObj.group.add(sp);
      survivorMeshes.set(s.id||s.nickname,cObj);
    });

    // Check hunter setup
    if(!game.hunter.isLocal&&!game.hunter.isAi){
      // Another human is the hunter
      game.aiHunterDisabled=true;
    }else{
      game.aiHunterDisabled=false;
    }
  }

  game.message=`同图联机已开始！[${lanRoomCode}] 共 ${game.survivors.length} 名求生者与 1 位监管者`;
}
function applyWorld(state){if(!sharedMatch)return;const me=state.actors.find(a=>a.id===myLanId),hunter=state.actors.find(a=>a.role==='hunter');if(!me||!hunter)return;game.role=me.role;game.time=state.time;game.generators=state.generators;game.pallets=state.pallets;game.exits=state.exits;game.exit=game.exits[0];game.hunter={...hunter.position};game.attack=hunter.attack;game.stun=hunter.stun;game.hunterAttackCooldown=hunter.hunterAttackCooldown;game.player={...(me.role==='survivor'?me.position:state.actors.find(a=>a.role==='survivor')?.position||{x:40,y:70}),id:myLanId};game.health=me.health;game.dashCooldown=me.dashCooldown;game.characterId=me.role==='survivor'?me.character:game.characterId;game.hunterId=hunter.character;game.calibration=me.calibration;game.vault=me.vault;game.healing=me.healing;game.healProgress=me.healProgress;game.decoding=game.generators[me.decodeIndex]||null;game.message=me.message;game.status=state.status==='finished'?'lost':'playing';game.survivors=state.actors.filter(a=>a.role==='survivor').map(a=>a.id===myLanId?game.player:{...a.position,id:a.id,nickname:a.nickname,health:a.health,isAi:a.bot});}

function updateLanPeer(data){
  if(data.id===myLanId)return;
  if(data.role==='hunter'){
    // Remote human hunter update
    game.hunter.x=data.x;
    game.hunter.y=data.y;
    game.hunter.z=data.z||0;
    game.hunter.angle=data.angle||0;
    if(data.attack){
      game.attack={phase:data.attack,elapsed:0,duration:.5,angle:data.angle||0};
    }
  }else{
    // Remote human survivor update
    const s=game.survivors.find(p=>p.id===data.id);
    if(s){
      s.x=data.x;s.y=data.y;s.z=data.z||0;s.angle=data.angle||0;s.health=data.health||2;
    }
  }
}

function handleLanEvent(msg){
  if(msg.event==='pallet_down'){
    const p=game.pallets[msg.payload.index];
    if(p){p.down=true;p.drop=.4;}
  }else if(msg.event==='pallet_break'){
    const p=game.pallets[msg.payload.index];
    if(p){p.broken=true;p.down=false;}
  }else if(msg.event==='gen_progress'){
    const g=game.generators[msg.payload.index];
    if(g)g.p=msg.payload.p;
  }
}
initLANMultiplayer();
function resize(){const r=$('#stage').getBoundingClientRect();width=r.width;height=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);if(three){three.renderer.setSize(width,height);three.camera.aspect=width/height;three.camera.updateProjectionMatrix();}}
new ResizeObserver(resize).observe($('#stage'));
function clearInput(){keys={};held={interact:false,sprint:false,dash:false};tapped={interact:false,dash:false};joy={x:0,y:0};$('#nub').style.transform='';game.lastDash=false;game.lastInteract=false;}
window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{clearInput();last=0;});
$('#portraitContinue').onclick=()=>{$('#rotateHint').classList.add('dismissed');last=0;$('#stage').focus({preventScroll:true});};
$('#enterFullscreen').onclick=async()=>{try{await $('#stage').requestFullscreen();$('#rotateHint').classList.add('dismissed');}catch{game.message='全屏不可用，请使用右上角菜单开启全屏';}last=0;$('#stage').focus({preventScroll:true});};
window.addEventListener('keydown',e=>{if(e.target?.matches?.('input,textarea,select')&&game.status!=='playing')return;const key=inputKey(e);if(isGameKey(key)){e.preventDefault();keys[key]=true;if(game.status==='playing'&&$('#rotateHint').classList.contains('dismissed')===false){$('#rotateHint').classList.add('dismissed');}}});
window.addEventListener('keyup',e=>{const key=inputKey(e);if(isGameKey(key)){e.preventDefault();keys[key]=false;}});
window.addEventListener('keydown',e=>{if(inputKey(e)===' '&&!e.repeat&&game.calibration&&$('#settings').hidden){e.preventDefault();game.calibrate();}});
$('#decodeButton').onclick=()=>{const target=game.generators.find(g=>g.p<100&&distance(g,game.player)<6);if(target)game.startDecode(target);};
$('#calibrateButton').onpointerdown=e=>{e.preventDefault();game.calibrate();};
$('#calibrateButton').onclick=e=>{if(e.detail===0)game.calibrate();};
for(const id of ['interact','dash']){let el=$('#'+id);el.onpointerdown=e=>{if(layoutEditing()||id==='interact'&&game.palletVaultLock>0)return;e.preventDefault();el.setPointerCapture(e.pointerId);held[id]=true;tapped[id]=true;};el.onpointerup=el.onpointercancel=()=>held[id]=false;}
let hunterSkillHeld=false;$('#hunterSkill').onpointerdown=e=>{e.preventDefault();e.target.setPointerCapture(e.pointerId);hunterSkillHeld=true;};$('#hunterSkill').onpointerup=$('#hunterSkill').onpointercancel=()=>hunterSkillHeld=false;
function characterMenu(){
  const root=$('#characterSelect');
  root.replaceChildren();
  const list=game.role==='hunter'?hunters:characters;
  const currentId=game.role==='hunter'?game.hunterId:game.characterId;
  list.forEach(c=>{
    const b=document.createElement('button');
    b.textContent=c.name;
    b.classList.toggle('selected',c.id===currentId);
    b.onclick=()=>{
      if(game.status!=='ready')game.reset();
      if(game.role==='hunter')game.selectHunter(c.id);
      else game.selectCharacter(c.id);
      characterMenu();
      syncLobbyProfile();
    };
    root.appendChild(b);
  });
  if(game.role==='hunter'){
    const h=game.currentHunter;
    $('#skillDescription').textContent=`监管者【${h.name}】· 武器【${h.weapon||'手爪'}】· 技能【${h.skill}】— ${h.description}（Q 轻斩 / 靠近按住 E 蓄力重刀）`;
  }else{
    $('#skillDescription').textContent=`求生者【${game.character.name}】· 技能【${game.character.skill}】(5秒冷却) — ${game.character.description}`;
  }
}
characterMenu();
document.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{
  if(game.status!=='ready')game.reset();
  game.selectRole(b.dataset.role);
  document.querySelectorAll('[data-role]').forEach(v=>v.classList.toggle('selected',v===b));
  characterMenu();
  syncLobbyProfile();
});
function syncLobbyProfile(){if(lanRoomCode&&lanSocket?.readyState===WebSocket.OPEN&&game.status==='ready')lanSocket.send(JSON.stringify({type:'update_profile',role:game.role,character:game.role==='hunter'?game.hunterId:game.characterId}));}
let pointer=null;const stick=$('#stick');stick.onpointerdown=e=>{pointer=e.pointerId;stick.setPointerCapture(pointer);stickMove(e);};stick.onpointermove=e=>{if(pointer===e.pointerId)stickMove(e);};stick.onpointerup=stick.onpointercancel=()=>{pointer=null;joy={x:0,y:0};$('#nub').style.transform='';};
function stickMove(e){let r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,l=Math.hypot(x,y);if(l>32){x*=32/l;y*=32/l;}joy={x:x/32,y:y/32};$('#nub').style.transform=`translate(${x}px,${y}px)`;}
let drag=null;$('#stage').addEventListener('pointerdown',e=>{if(e.target===three?.renderer.domElement&&!drag){drag={id:e.pointerId,x:e.clientX,y:e.clientY};e.target.setPointerCapture(e.pointerId);}});$('#stage').addEventListener('pointermove',e=>{if(drag?.id===e.pointerId){cameraAngle-=(e.clientX-drag.x)*.006;cameraPitch=Math.max(-.3,Math.min(.8,cameraPitch+(e.clientY-drag.y)*.005));drag.x=e.clientX;drag.y=e.clientY;}});for(const name of ['pointerup','pointercancel','lostpointercapture'])$('#stage').addEventListener(name,e=>{if(drag?.id===e.pointerId)drag=null;});
function settings(open){$('#settings').hidden=!open;$('#settingsButton').setAttribute('aria-expanded',String(open));clearInput();if(!open)$('#stage').focus({preventScroll:true});}
$('#settingsButton').onclick=()=>settings($('#settings').hidden);$('#closeSettings').onclick=()=>settings(false);
window.addEventListener('keydown',e=>{if(e.key==='Escape')settings($('#settings').hidden);});
function begin(){if(!three)return;if(game.status!=='ready')game.reset();sharedMatch=false;localMatch=null;game.start();myLanId='local-player';localMatch=new SharedMatch([{id:myLanId,nickname:'你',role:game.role,character:game.role==='hunter'?game.hunterId:game.characterId}],playMode==='ai');if(playMode==='single'&&game.role==='hunter')localMatch=new SharedMatch([{id:myLanId,nickname:'你',role:'hunter',character:game.hunterId},{id:'bot-single',nickname:'人机求生者',role:'survivor',character:'mercenary',bot:true}],false);sharedMatch=true;survivorMeshes.forEach(m=>three.scene.remove(m.group));survivorMeshes.clear();chairState=localMatch.chairSnapshot();applyWorld(localMatch.snapshot());$('#overlay').style.display='none';settings(false);clearInput();$('#stage').focus({preventScroll:true});}
$('#start').onclick=begin;$('#restart').onclick=()=>{game.reset();settings(false);clearInput();showOverlay();};$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#stage').requestFullscreen();settings(false);}catch{game.message='当前浏览器不支持全屏，请横屏体验';}};
function showOverlay(){const status=game.status;$('#overlay').style.display='flex';$('#overlay h2').textContent=status==='won'?'成功逃脱':status==='lost'?'演练结束':'沉船林地';$('#overlay p:not(.eyebrow)').innerHTML=status==='ready'?'破译三台密码机，开启闸门逃脱。<br>选择角色，利用建筑窗口和木板脱离追击。':game.message+'<br>可选择不同角色再试一次。';$('#start').textContent=status==='ready'?'进入演练 ↗':'再试一次 ↗';characterMenu();}
document.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=async()=>{let next=btn.dataset.view;if(next==='third'&&!three){if(loading)return;loading=true;game.message='正在加载 3D 渲染器…';try{await setupThree();}catch(e){game.message='3D 加载失败：请检查网络和 WebGL 支持；2D / 2.5D 仍可玩';$('#cameraHint').textContent=game.message;console.error(e);loading=false;return;}loading=false;}view=next;clearInput();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b===btn));canvas.style.display=view==='third'?'none':'block';$('#webgl').style.display=view==='third'?'block':'none';$('#mode').textContent=names[view];$('#cameraHint').textContent=view==='third'?'拖动画面旋转镜头 · 移动随镜头方向':'可随时切换视角，保留对局';resize();settings(false);});
function project(x,y,z=0){const focus=game.controlled;let s=Math.min(width/62,height/45);return {x:width/2+((x-focus.x)-(y-focus.y))*.707*s,y:height*.59+((x-focus.x)+(y-focus.y))*.36*s-(z-(focus.z||0))*s,s};}
function poly(points,fill,stroke){ctx.beginPath();points.forEach(([x,y,z],i)=>{let p=project(x,y,(z||0)+actorElevation);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
let actorElevation=0;
function terrainFlat(){for(const e of game.exits){box(e.x,e.y-6,1.5,2,7,'#7a826d');box(e.x,e.y+6,1.5,2,7,'#7a826d');if(e.p<100)box(e.x,e.y,1,10,5,'#646e50');label(e.x,e.y,8,'GATE '+Math.floor(e.p)+'%');}for(const roof of roofs){ctx.save();ctx.globalAlpha=Math.abs(game.controlled.x-roof.x)<roof.w/2+8&&Math.abs(game.controlled.y-roof.y)<roof.d/2+8?.16:.8;poly([[roof.x-roof.w/2,roof.y-roof.d/2,roof.z],[roof.x+roof.w/2,roof.y-roof.d/2,roof.z],[roof.x+roof.w/2,roof.y+roof.d/2,roof.z+1],[roof.x-roof.w/2,roof.y+roof.d/2,roof.z+1]],'#58675f','#9aab94');ctx.restore();}if(game.smoke)ellipse(game.smoke.x,game.smoke.y,2,game.smoke.r,game.smoke.r*.6,'#b4cece55');}
function palletFlat(p){const pose=palletPose(p),x=pose.baseX,z=pose.tipZ;poly([[x,p.y-.65,0],[x,p.y+.65,0],[pose.tipX,p.y+.65,z],[pose.tipX,p.y-.65,z]],'#b59b69','#e0c28b');}
function redLight(){poly(factory.footprint.map(([x,y])=>[x,y,.03]),'#696951');for(const r of ramps)poly([[r.x-r.w/2,r.top,4],[r.x+r.w/2,r.top,4],[r.x+r.w/2,r.bottom,0],[r.x-r.w/2,r.bottom,0]],r.kind==='stairs'?'#8d8770':'#7b7864');for(const r of upperFloors){ctx.save();ctx.globalAlpha=(game.controlled.z||0)<1?.28:1;poly([[r.x-r.w/2,r.y-r.d/2,4],[r.x+r.w/2,r.y-r.d/2,4],[r.x+r.w/2,r.y+r.d/2,4],[r.x-r.w/2,r.y+r.d/2,4]],'#596c66');ctx.restore();}const h=game.hunter,angle=h.angle||0,z=h.z||0,points=[[h.x,h.y,z+.02]];for(let i=0;i<=20;i++){const a=angle-.55+i/20*1.1;points.push([h.x+Math.sin(a)*9,h.y+Math.cos(a)*9,z+.02]);}poly(points,'#ed362638');}
function box(x,y,w,d,h,color){const wall=color==='#858673'?walls.find(o=>o.h&&Math.abs(x-o.x)<=o.w/2+.01&&Math.abs(y-o.y)<=o.d/2+.01):null;if(wall)h=wall.h;const base=wall?.base||0;if(x===96&&['#81866b','#52574b'].includes(color))x=game.exit.x;if(color==='#b59b69'&&w===4){const p=game.pallets.find(p=>p.x===x&&p.y===y);if(p){palletFlat(p);return;}}if(wall?.rail){for(const xx of [x-w/2,x+w/2])poly([[xx-.06,y-.06,base],[xx+.06,y+.06,base],[xx+.06,y+.06,base+h],[xx-.06,y-.06,base+h]],'#8d9990');poly([[x-w/2,y-d/2,base+h],[x+w/2,y-d/2,base+h],[x+w/2,y+d/2,base+h],[x-w/2,y+d/2,base+h]],'#bcc0aa');return;}poly([[x-w/2,y-d/2,base],[x+w/2,y-d/2,base],[x+w/2,y+d/2,base],[x-w/2,y+d/2,base]],'#13231f');poly([[x+w/2,y-d/2,base],[x+w/2,y+d/2,base],[x+w/2,y+d/2,h+base],[x+w/2,y-d/2,h+base]],'#303a32');poly([[x-w/2,y+d/2,base],[x+w/2,y+d/2,base],[x+w/2,y+d/2,h+base],[x-w/2,y+d/2,h+base]],'#4b5142');poly([[x-w/2,y-d/2,h+base],[x+w/2,y-d/2,h+base],[x+w/2,y+d/2,h+base],[x-w/2,y+d/2,h+base]],color,'#a5b29c44');}
function ellipse(x,y,z,rx,ry,color){let p=project(x,y,z+actorElevation);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(p.x,p.y,rx*p.s,ry*p.s,0,0,Math.PI*2);ctx.fill();}
function label(x,y,z,text,color='#d6ed91'){if(text==='EXIT')x=game.exit.x;let p=project(x,y,z);ctx.font='10px monospace';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,p.x,p.y);}
function actor(a,hunter){actorElevation=a.z||0;const v=!hunter&&game.vault,t=v?v.elapsed/v.duration:0,lift=v?Math.sin(t*Math.PI)*1.1:0,walk=v?0:Math.sin(time*(game.dashRemaining>0?22:11))*.3;ellipse(a.x,a.y,0,1.3,.7,'#06121088');box(a.x-.45,a.y+walk,.45,.5,1.6+lift,'#242f30');box(a.x+.45,a.y-walk+(v?Math.sin(t*Math.PI):0),.45,.5,1.6+lift+(v?.5:0),'#242f30');box(a.x,a.y,1.5,.8,2.7+lift,hunter?'#b35b48':'#'+game.character.color.toString(16));ellipse(a.x,a.y,3.4+lift,.6,.6,'#e7cba0');if(hunter)box(a.x+1.5,a.y,.25,.5,3.8,'#949a81');if(!hunter&&game.shield>0)ellipse(a.x,a.y,3,2.2,1.2,'#ecb47155');if(hunter&&game.stun>0)label(a.x,a.y,5,'STUN');actorElevation=0;}
function drawFlat(){ctx.clearRect(0,0,width,height);ctx.fillStyle='#102725';ctx.fillRect(0,0,width,height);poly([[0,0],[100,0],[100,100],[0,100]],'#354436','#6e7850');for(let y=0;y<100;y+=5)for(let x=0;x<100;x+=5){let n=(x*31+y*17)%13;poly([[x,y],[x+5,y],[x+5,y+5],[x,y+5]],n<4?'#394936':'#344333');}poly([[0,47],[100,47],[100,53],[0,53]],'#615f45');poly([[47,0],[53,0],[53,100],[47,100]],'#5a5b43');for(let i=0;i<240;i++){let x=(i*37.17)%98+1,y=(i*19.33)%98+1;ellipse(x,y,0,.12,.12,'#a0a77844');}
game.generators.forEach(g=>ellipse(g.x,g.y,0,4,2,g.p>=100?'#d6ed9122':'#ecb47122'));
poly([[100,0],[SIZE,0],[SIZE,SIZE],[100,SIZE]],'#354436');poly([[0,100],[100,100],[100,SIZE],[0,SIZE]],'#354436');redLight();const pieces=walls.flatMap(w=>{const n=Math.ceil(Math.max(w.w,w.d)/1.5);return Array.from({length:n},(_,i)=>({...w,x:w.x+(w.w>w.d?((i+.5)/n-.5)*w.w:0),y:w.y+(w.d>w.w?((i+.5)/n-.5)*w.d:0),w:w.w>w.d?w.w/n:w.w,d:w.d>w.w?w.d/n:w.d,kind:'wall'}));});
const items=[...pieces,...obstacles.filter(o=>o.type==='rock').map(o=>({...o,kind:'wall'})),...obstacles.filter(o=>o.type==='tree').map(o=>({...o,kind:'tree'})),...game.generators.map((g,i)=>({...g,kind:'gen',i})),...game.pallets.filter(p=>!p.broken).map(p=>({...p,kind:'pallet'})),...game.windows.map(w=>({...w,kind:'window'})),{...game.player,kind:'player'},{...game.hunter,kind:'hunter'}];
items.sort((a,b)=>a.x+a.y-b.x-b.y);for(const o of items){ctx.save();if(['wall','tree','window'].includes(o.kind)&&Math.abs(o.x-game.controlled.x)<4&&o.y>game.controlled.y&&o.y-game.controlled.y<5)ctx.globalAlpha=.45;switch(o.kind){case 'wall':box(o.x,o.y,o.w,o.d,3.8,'#858673');break;case 'tree':box(o.x,o.y,.8,.8,5,'#736148');ellipse(o.x,o.y,5,3.5,2.7,'#172f26');ellipse(o.x-1,o.y-.5,7,2.7,2.3,'#345b3d');break;case 'gen':box(o.x,o.y,3,2.4,2.4,o.p>=100?'#a8be70':'#8d7250');box(o.x,o.y,1.5,1.5,3.2,'#323d34');label(o.x,o.y,5,'G'+(o.i+1)+' '+Math.floor(o.p)+'%');break;case 'pallet':{const t=o.down?1-o.drop/.4:0;box(o.x,o.y,4,.6+t*2,3*(1-t)+.25,'#b59b69');break;}case 'window':box(o.x-2.2,o.y,.6,1,3.8,'#909479');box(o.x+2.2,o.y,.6,1,3.8,'#909479');box(o.x,o.y,4,.6,1.2,'#c2b181');break;case 'player':actor(game.player,false);break;case 'hunter':actor(game.hunter,true);break;case 'exit':box(96,44,1.5,2,7,'#81866b');box(96,56,1.5,2,7,'#81866b');if(o.p<100)box(96,50,1,10,5,'#52574b');label(96,50,8,'EXIT');}ctx.restore();}
terrainFlat();let vg=ctx.createRadialGradient(width/2,height/2,height*.18,width/2,height/2,height*.75);vg.addColorStop(0,'#0b1d1900');vg.addColorStop(1,'#061614bb');ctx.fillStyle=vg;ctx.fillRect(0,0,width,height);drawMinimap();}
function drawMinimap(){const w=84,x=width-w-12,y=height-w-260;if(y<140)return;ctx.save();ctx.translate(x,y);ctx.scale(w/SIZE,w/SIZE);ctx.fillStyle='#0c1d1bc9';ctx.fillRect(0,0,SIZE,SIZE);ctx.strokeStyle='#72836155';ctx.strokeRect(0,0,SIZE,SIZE);for(const o of obstacles){ctx.fillStyle='#4c5c45';ctx.fillRect(o.x-2,o.y-2,4,4);}for(const wall of walls){ctx.fillStyle='#7a8270';ctx.fillRect(wall.x-wall.w/2,wall.y-wall.d/2,wall.w,wall.d);}for(const g of game.generators){ctx.fillStyle=g.p>=100?'#d6ed91':'#ecb471';ctx.fillRect(g.x-2,g.y-2,4,4);}ctx.fillStyle='#d6ed91';ctx.beginPath();ctx.arc(game.player.x,game.player.y,3,0,7);ctx.fill();ctx.fillStyle='#e78265';ctx.beginPath();ctx.arc(game.hunter.x,game.hunter.y,2.5,0,7);ctx.fill();ctx.fillStyle='#d6ed91';ctx.fillRect(game.exit.x-1,44,3,12);ctx.restore();}
async function setupThree(){const T=await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(width,height);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;const scene=new T.Scene();scene.background=new T.Color('#172d30');scene.fog=new T.Fog('#172d30',25,85);const camera=new T.PerspectiveCamera(58,width/height,.1,150);scene.add(new T.HemisphereLight(0xd8e3c1,0x273833,2));const sun=new T.DirectionalLight(0xffddb0,2.7);sun.position.set(-25,55,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60});scene.add(sun);
function mesh(geo,color,x,y,z,parent=scene){const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.95,flatShading:true}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cube(x,y,z,w,h,d,color,parent){const m=mesh(new T.BoxGeometry(w,h,d),color,x,y,z,parent);if((x===96||x===136)&&color===0x81866b)m.visible=false;return m;}
cube(50,-.25,50,100,.5,100,0x42503b);cube(50,.01,50,100,.03,6,0x68674f);cube(50,.02,50,6,.03,100,0x62624a);
cube(SIZE/2,-.55,SIZE/2,SIZE,.5,SIZE,0x42503b);cube(136,3.5,44,1.5,7,2,0x81866b);cube(136,3.5,56,1.5,7,2,0x81866b);
walls.filter(w=>!w.factory&&!w.rail&&!w.cottage&&!w.churchProp&&!w.barrelCluster&&!w.brickWall&&!w.redChurchProp).forEach(w=>cube(w.x,1.9,w.y,w.w,3.8,w.d,0x858673));
buildArchitecture(T,scene);
for(const [i,c] of chairLocations.entries()){const group=new T.Group();group.name='chair-'+i;group.position.set(c.x,0,c.y);scene.add(group);cube(0,.8,0,1.5,.3,1.2,0x843b46,group);cube(0,1.8,-.45,1.5,2,.25,0x843b46,group);for(const side of [-1,1]){cube(side*.8,1.2,0,.15,.2,1.4,0x6d5b45,group);mesh(new T.CylinderGeometry(.25,.25,2.5,10),0x665d42,side*1.05,1.8,-.45,group);mesh(new T.ConeGeometry(.3,.7,10),0x8e3039,side*1.05,3.4,-.45,group);}cube(0,1.9,-.25,1.6,.18,.12,0x372b28,group);const clock=mesh(new T.CylinderGeometry(.38,.38,.12,12),0xc7b57c,0,3,-.3,group);clock.rotation.x=Math.PI/2;}
buildOutdoorDetailing(T,scene);
const upperMeshes=upperFloors.map(r=>cube(r.x,3.85,r.y,r.w,.3,r.d,0x596c66));upperMeshes.forEach(m=>m.name='upperFloor');
game.exits.forEach(e=>{cube(e.x,3.5,e.y-6,1.5,7,2,0x7a826d);cube(e.x,3.5,e.y+6,1.5,7,2,0x7a826d);const m=cube(e.x,2.5,e.y,1,5,10,0x646e50);m.name='escapeGate';m.userData.exit=e;});
for(const r of ramps){for(let i=0;i<24;i++){const depth=r.d/24,h=(24-i)/24*4;cube(r.x,h/2,r.top+(i+.5)*depth,r.w,h,depth,0x8d8770);}}
const redShape=new T.Shape();redShape.moveTo(0,0);for(let i=0;i<=24;i++){const a=-.55+i/24*1.1;redShape.lineTo(Math.sin(a)*9,-Math.cos(a)*9);}redShape.lineTo(0,0);const redMesh=new T.Mesh(new T.ShapeGeometry(redShape),new T.MeshBasicMaterial({color:0xf02a20,transparent:true,opacity:.25,depthWrite:false,side:T.DoubleSide}));const redGroup=new T.Group();redGroup.name='hunterRedLight';redMesh.rotation.x=-Math.PI/2;redGroup.add(redMesh);scene.add(redGroup);
const smokeMesh=new T.Mesh(new T.SphereGeometry(1,12,8),new T.MeshBasicMaterial({color:0xb4cece,transparent:true,opacity:.24,depthWrite:false}));smokeMesh.name='skillSmoke';smokeMesh.visible=false;scene.add(smokeMesh);
// Environment detailing: Gothic style weathered vegetation, low poly mossy boulders, and iron street lamps.
function buildOutdoorDetailing(T,scene){
  const trunkMat=new T.MeshStandardMaterial({color:0x362b21,roughness:.95}),rockMat=new T.MeshStandardMaterial({color:0x5e6560,roughness:.92,flatShading:true}),mossMat=new T.MeshStandardMaterial({color:0x415438,roughness:.95}),ironMat=new T.MeshStandardMaterial({color:0x262f2c,metalness:.7,roughness:.4});
  for(const o of obstacles){
    if(o.type==='tree'){
      // Tall gothic bare tree trunks with gnarled bare branches (no green cone foliage)
      const tree=new T.Group();tree.position.set(o.x,0,o.y);scene.add(tree);
      const tallH=10.5+Math.random()*2.5;
      const trunk=new T.Mesh(new T.CylinderGeometry(.28,.68,tallH,8),trunkMat);
      trunk.position.y=tallH/2;trunk.castShadow=true;trunk.receiveShadow=true;tree.add(trunk);
      // Gnarled side branches
      for(let bi=0;bi<4;bi++){
        const bAngle=bi*(Math.PI/2)+.3,bY=tallH*.62+bi*1.1,bLen=2.2+bi*.4;
        const branch=new T.Mesh(new T.CylinderGeometry(.08,.16,bLen,6),trunkMat);
        branch.position.set(Math.sin(bAngle)*bLen*.4,bY,Math.cos(bAngle)*bLen*.4);
        branch.rotation.set(Math.sin(bAngle)*.7,bAngle,-Math.cos(bAngle)*.7);
        branch.castShadow=true;tree.add(branch);
      }
    }else{
      const b=new T.Group();b.position.set(o.x,0,o.y);scene.add(b);
      const base=new T.Mesh(new T.DodecahedronGeometry(o.w*.48,1),rockMat);base.scale.set(1.45,o.h/(o.w*.48||1)*.55,1);base.position.y=o.h*.5;base.castShadow=true;base.receiveShadow=true;b.add(base);
      const moss=new T.Mesh(new T.DodecahedronGeometry(o.w*.32,0),mossMat);moss.scale.set(1.2,.35,1);moss.position.set(0,o.h*.82,0);b.add(moss);
    }
  }
  // Iron lamp posts scattered across the grounds for vintage gothic cemetery vibe.
  for(const [lx,lz] of [[52,48],[148,52],[45,115],[152,142],[98,42],[100,154]]){
    const pole=new T.Mesh(new T.CylinderGeometry(.12,.18,4.2,6),ironMat);pole.position.set(lx,2.1,lz);scene.add(pole);
    const arm=new T.Mesh(new T.BoxGeometry(1,.12,.12),ironMat);arm.position.set(lx+.35,4.1,lz);scene.add(arm);
    const lantern=new T.Mesh(new T.OctahedronGeometry(.35,0),new T.MeshStandardMaterial({color:0xffd99b,emissive:0xffa834,emissiveIntensity:1.8}));lantern.position.set(lx+.7,3.8,lz);scene.add(lantern);
    const light=new T.PointLight(0xffb85c,4.5,18,2);light.position.set(lx+.7,3.7,lz);scene.add(light);
  }
}
for(let i=0;i<160;i++){const x=(i*31.13)%SIZE+2,z=(i*17.43)%SIZE+2;if(roofs.some(r=>Math.abs(x-r.x)<r.w/2+2&&Math.abs(z-r.y)<r.d/2+2))continue;mesh(new T.ConeGeometry(.25,.7,3),0x61714b,x,.3,z);}
// High-fidelity Cipher Machine model: typewriter keyboard, mechanical drums, and tall wooden antenna mast with bright beacon
function buildCipherModel(T,g,group){
  const metal=new T.MeshStandardMaterial({color:0x36433e,metalness:.6,roughness:.4}),wood=new T.MeshStandardMaterial({color:0x523d2a,roughness:.85}),brass=new T.MeshStandardMaterial({color:0xbfa054,metalness:.7,roughness:.35}),glowMat=new T.MeshStandardMaterial({color:0xffcc00,emissive:0xffaa00,emissiveIntensity:2.4});
  // Wooden desk foundation
  cube(0,.75,0,3.2,1.5,2.4,0x523d2a,group);
  cube(0,.05,0,3.4,.1,2.6,0x38281a,group);
  // Machine iron casing and typewriting table
  cube(0,1.75,-.2,2.8,.5,1.8,0x2c3834,group);
  cube(0,1.95,.4,2.2,.15,.8,0x1a211f,group); // keyboard bed
  // Cylindrical decoding rotators
  for(let x=-.8;x<=.8;x+=.8){
    const drum=new T.Mesh(new T.CylinderGeometry(.35,.35,1.2,12),brass);
    drum.rotation.z=Math.PI/2;drum.position.set(x,2.2,-.3);drum.castShadow=true;group.add(drum);
  }
  // Tall wooden telephone/antenna pole
  const pole=new T.Mesh(new T.CylinderGeometry(.12,.18,7.5,7),wood);
  pole.position.set(-1.25,3.75,-.85);pole.castShadow=true;group.add(pole);
  // Crossbar on the pole
  const cross=new T.Mesh(new T.BoxGeometry(1.6,.12,.12),wood);
  cross.position.set(-1.25,7.1,-.85);group.add(cross);
  // Glass insulators on crossbar
  for(const ox of [-.6,.6]){
    const ins=new T.Mesh(new T.CylinderGeometry(.06,.06,.22,6),metal);
    ins.position.set(-1.25+ox,7.25,-.85);group.add(ins);
  }
  // High-mounted beacon lamp (glowing bright yellow when unfixed, bright green when finished)
  const lampBeacon=new T.Mesh(new T.SphereGeometry(.32,10,8),glowMat);
  lampBeacon.position.set(-1.25,7.5,-.85);group.add(lampBeacon);
  const beaconLight=new T.PointLight(0xffaa00,4,16,2);
  beaconLight.position.set(-1.25,7.6,-.85);group.add(beaconLight);
  group.userData.lampBeacon=lampBeacon;
  group.userData.beaconLight=beaconLight;
  return lampBeacon;
}
const generators=game.generators.map(g=>{
  const group=new T.Group();group.position.set(g.x,0,g.y);scene.add(group);
  return buildCipherModel(T,g,group);
});const pallets=game.pallets.map(p=>cube(p.x,1.5,p.y,4,3,.6,0xb59b69));game.windows.forEach(w=>{cube(w.x-2.2,1.9,w.y,.6,3.8,1,0x909479);cube(w.x+2.2,1.9,w.y,.6,3.8,1,0x909479);cube(w.x,1.2,w.y,4,.35,.7,0xc2b181);cube(w.x,3.8,w.y,4,.35,1,0x909479);});cube(96,3.5,44,1.5,7,2,0x81866b);cube(96,3.5,56,1.5,7,2,0x81866b);cube(96,7,50,1.5,1,14,0x81866b);const gate=cube(96,2.5,50,1,5,10,0x657153);
function character(color,hunter){
  const group=new T.Group();scene.add(group);
  const body=cube(0,1.9,0,1.1,1.3,.7,color,group);
  mesh(new T.IcosahedronGeometry(.48,1),0xe5c6a0,0,3,0,group);
  const legs=[cube(-.3,.65,0,.38,1.2,.4,0x263534,group),cube(.3,.65,0,.38,1.2,.4,0x263534,group)];
  const armL=cube(-.8,1.9,0,.3,1,.35,color,group);
  const armR=cube(.8,1.9,0,.3,1,.35,color,group);
  if(hunter){
    // Weapon hand with distinct weapon model and attack pivot
    const wepPivot=new T.Group();wepPivot.position.set(1.1,1.9,0);group.add(wepPivot);
    cube(0,-.4,0,.14,1.8,.14,0x544132,wepPivot); // handle
    const blade=cube(.25,.4,0,.5,.8,.12,0xadb3a2,wepPivot); // blade / claw
    group.userData.wepPivot=wepPivot;
    group.userData.armR=armR;
  }
  return {group,legs,armL,armR};
}const player=character(0xafc77d,false),hunter=character(0xb35b48,true);$('#webgl').appendChild(renderer.domElement);three={T,renderer,scene,camera,player,hunter,generators,pallets,gate};resize();}
function drawThree(dt){const {T,renderer,scene,camera,player,hunter,generators,pallets,gate}=three;for(const [visual,actor] of [[player,game.player],[hunter,game.hunter]]){const v=visual===player?game.vault:null,t=v?v.elapsed/v.duration:0,lift=v?Math.sin(t*Math.PI)*.75:0;visual.group.position.set(actor.x,lift,actor.y);visual.group.rotation.y=actor.angle;visual.group.rotation.x=v?Math.sin(t*Math.PI)*.4:0;const moving=game.status==='playing'&&(visual===hunter?game.stun===0:game.dashRemaining>0||Math.hypot(input.x,input.y)>.1);visual.legs.forEach((l,i)=>{l.rotation.x=v?Math.sin(t*Math.PI)*(i===0?-1.5:.9):moving?Math.sin(time*(game.dashRemaining>0?22:10)+i*Math.PI)*.65:0;l.rotation.z=v?Math.sin(t*Math.PI)*(i===0?-.3:.3):0;});}    // Render all other survivors in the same map (human peers and AI bots)
    if(game.survivors){
      for(const s of game.survivors){
        if(s===game.player)continue;
        let sMesh=survivorMeshes.get(s.id||s.nickname);
        if(!sMesh&&three){
          const group=three.player.group.clone(true);group.visible=true;group.traverse(o=>{if(o.material)o.material=o.material.clone();});three.scene.add(group);sMesh={group,legs:[group.children[2],group.children[3]]};
          const cv=document.createElement('canvas');cv.width=256;cv.height=64;
          const cx=cv.getContext('2d');cx.fillStyle='#111a18cc';cx.fillRect(0,0,256,64);
          cx.font='bold 26px sans-serif';cx.textAlign='center';cx.fillStyle=s.isAi?'#adb5a8':'#d6ed91';
          cx.fillText(s.nickname||'求生者',128,42);
          const sp=new three.T.Sprite(new three.T.SpriteMaterial({map:new three.T.CanvasTexture(cv)}));
          sp.scale.set(3,.75,1);sp.position.set(0,3.8,0);
          sMesh.group.add(sp);
          survivorMeshes.set(s.id||s.nickname,sMesh);
        }
        if(sMesh){
          sMesh.group.position.set(s.x,s.z||0,s.y);
          sMesh.group.rotation.y=s.angle||0;
          const moving=(Math.hypot(s.x-(s.lastX||s.x),s.y-(s.lastY||s.y))>0.005);
          s.lastX=s.x;s.lastY=s.y;
          sMesh.legs.forEach((l,i)=>{l.rotation.x=moving?Math.sin(time*10+i*Math.PI)*.55:0;});
          sMesh.group.visible=true;if((s.health??2)<=0){
            sMesh.group.rotation.x=Math.PI/2;sMesh.group.position.y=.3;
          }else{
            sMesh.group.rotation.x=0;
          }
        }
      }
    }

    player.group.children[0].material.color.setHex(game.character.color);
    generators.forEach((m,i)=>{
      const done=game.generators[i].p>=100;
      m.material.color.set(done?0x68f070:0xffcc00);
      m.material.emissive.set(done?0x26c030:0xffaa00);
      m.material.emissiveIntensity=done?1.8:2.6;
      const group=m.parent;
      if(group&&group.userData.beaconLight){
        group.userData.beaconLight.color.set(done?0x40e050:0xffaa00);
        group.userData.beaconLight.intensity=done?3.5:5.5;
      }
    });pallets.forEach((m,i)=>{const p=game.pallets[i],t=p.down?1-p.drop/.4:0;m.rotation.x=t*Math.PI/2;m.position.y=1.5-t*1.1;});gate.position.y=2.5+game.exit.p/100*6;const target=new T.Vector3(game.player.x+Math.sin(cameraAngle)*12,10,game.player.y+Math.cos(cameraAngle)*12);camera.position.lerp(target,1-Math.exp(-dt*8));camera.lookAt(game.player.x,2,game.player.y);renderer.render(scene,camera);}
let input={x:0,y:0};function frame(t){let dt=last?Math.min((t-last)/1000,.05):.016;last=t;time+=dt;let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joy.x,y=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+joy.y;[x,y]=[x*Math.cos(cameraAngle)+y*Math.sin(cameraAngle),y*Math.cos(cameraAngle)-x*Math.sin(cameraAngle)];input={x,y,interact:keys.e||held.interact||tapped.interact,dash:keys.q||held.dash||tapped.dash};const active=!document.hidden&&$('#settings').hidden&&(!matchMedia('(pointer:coarse)').matches||$('#rotateHint').classList.contains('dismissed'));if(sharedMatch){if(lanSocket?.readyState===WebSocket.OPEN&&time-lastNetworkInput>=.05){lanSocket.send(JSON.stringify({type:'input',input:active?input:{x:0,y:0}}));lastNetworkInput=time;tapped.interact=false;tapped.dash=false;}}else if(active){game.update(dt,input);tapped.interact=false;tapped.dash=false;}if(three){three.player.group.visible=game.role!=='hunter';drawThree(dt);}updateHUD();requestAnimationFrame(frame);}
let lastNetworkInput=0;
function tickLocalMatch(){if(!localMatch||!sharedMatch)return;const active=!document.hidden&&$('#settings').hidden;localMatch.input(myLanId,active?input:{x:0,y:0});if(active)localMatch.update(.05);chairState=localMatch.chairSnapshot();const state=localMatch.snapshot();teamActors=state.actors.filter(a=>a.role==='survivor');applyWorld(state);}
setInterval(tickLocalMatch,50);
setInterval(()=>{const held=!!keys.f||hunterSkillHeld;if(localMatch){const a=localMatch.actors.find(a=>a.id===myLanId);if(a)a.skillHeld=held;}else if(sharedMatch&&lanSocket?.readyState===WebSocket.OPEN)lanSocket.send(JSON.stringify({type:'hunter_skill',held:!document.hidden&&$('#settings').hidden&&held}));},50);
window.addEventListener('error',event=>{const box=$('#message');box.textContent='游戏运行错误：'+event.message;box.classList.add('visible');console.error(event.error);});

let lastSyncTime=0,lastCipherSyncTime=0;
function broadcastLocalPosition(){
  if(!lanSocket||lanSocket.readyState!==WebSocket.OPEN||!lanRoomCode)return;
  const now=performance.now();
  if(now-lastSyncTime<65)return; // ~15Hz bandwidth-conserving smooth sync
  lastSyncTime=now;
  const me=game.controlled;
  lanSocket.send(JSON.stringify({
    type:'sync_pos',
    x:me.x,y:me.y,z:me.z||0,
    angle:me.angle||0,
    health:game.health,
    attack:game.attack?game.attack.phase:null
  }));

  // Sync active decoding progress across the room
  if(game.decoding&&now-lastCipherSyncTime>350){
    lastCipherSyncTime=now;
    const gIdx=game.generators.indexOf(game.decoding);
    if(gIdx>=0){
      lanSocket.send(JSON.stringify({type:'game_event',event:'gen_progress',payload:{index:gIdx,p:game.decoding.p}}));
    }
  }

  // Sync pallet states
  game.pallets.forEach((p,idx)=>{
    if(p.down&&!p._lanSyncedDown){
      p._lanSyncedDown=true;
      lanSocket.send(JSON.stringify({type:'game_event',event:'pallet_down',payload:{index:idx}}));
    }
    if(p.broken&&!p._lanSyncedBroken){
      p._lanSyncedBroken=true;
      lanSocket.send(JSON.stringify({type:'game_event',event:'pallet_break',payload:{index:idx}}));
    }
  });
}
let previousMessage='',messageUntil=0;
function updateHUD(){
  if(three&&chairState?.hunterSkills){const s=chairState.hunterSkills;let fx=three.scene.getObjectByName('hunterSkillFx');if(!fx){fx=new three.T.Group();fx.name='hunterSkillFx';three.scene.add(fx);}while(fx.children.length) {const m=fx.children[0];fx.remove(m);m.geometry.dispose();m.material.dispose();}const T=three.T;for(const p of s.projectiles){const m=new T.Mesh(new T.SphereGeometry(.7,8,5),new T.MeshBasicMaterial({color:0xaad6ce,transparent:true,opacity:.65}));m.scale.set(1,.3,1.8);m.position.set(p.x,p.z+1.4,p.y);m.rotation.y=p.angle;fx.add(m);}for(const p of s.trail){const m=new T.Mesh(new T.CircleGeometry(1.2,8),new T.MeshBasicMaterial({color:0x67b7c9,transparent:true,opacity:.35,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(p.x,p.z+.06,p.y);fx.add(m);}for(const z of s.zones){const shape=new T.Shape();z.polygon.forEach((p,i)=>i?shape.lineTo(p.x,-p.y):shape.moveTo(p.x,-p.y));shape.closePath();const m=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:0x429bab,transparent:true,opacity:.25,depthWrite:false,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.y=z.z+.05;fx.add(m);}}
  input.skill=!!keys.f||hunterSkillHeld;$('#hunterSkill').hidden=game.role!=='hunter'||game.status!=='playing';const hs=chairState?.hunterSkills;$('#hunterSkill').disabled=game.hunterId==='naiad'||(hs?.cooldown||0)>0;$('#hunterSkill').textContent=game.hunterId==='naiad'?'水迹 · 被动':hs?.rocket>0?'冲刺 '+hs.rocket.toFixed(1)+'s':hs?.cooldown>0?hs.cooldown.toFixed(1)+'s':'F · '+game.currentHunter.skill;
  if(sharedMatch&&chairState?.result){$('#matchResults').hidden=false;$('#resultTitle').textContent=chairState.result.winner==='draw'?'平局':chairState.result.winner==='survivors'?'求生者获胜':'监管者获胜';$('#resultDetails').textContent=`逃脱 ${chairState.result.escaped} 人 · 淘汰 ${chairState.result.eliminated} 人`;game.status='playing';}
  const teamRoot=$('#teamStatus');teamRoot.hidden=game.status==='ready';if(!teamRoot.hidden){const actors=sharedMatch?teamActors:[{id:'single',nickname:game.character.name,health:game.health}];renderTeam(teamRoot,actors,chairState);}
  if(chairState&&sharedMatch){const me=chairState.actors.find(a=>a.id===myLanId);if(me?.seated!=null){game.message='上椅淘汰进度 '+Math.round(chairState.chairs[me.seated].progress/60*100)+'%';}else if(me?.eliminated)game.message='已淘汰';else if(game.role==='hunter')game.message=chairState.carried?'牵气球中 · 靠近椅子按 E 挂椅':'靠近倒地求生者按 E 牵气球';}
  if(layoutEditing()){clearInput();$('#interact').disabled=false;$('#dash').disabled=false;return;}
  if(view==='third'&&three&&game.role==='hunter'){const a=game.hunter;three.camera.position.set(a.x+Math.sin(cameraAngle)*12,10,a.y+Math.cos(cameraAngle)*12);three.camera.lookAt(a.x,2,a.y);three.pallets.forEach((m,i)=>m.visible=!game.pallets[i].broken);three.renderer.render(three.scene,three.camera);}
  const near=game.nearby,close=near&&distance(near,game.player)<6,repairing=close&&['generator','exit'].includes(near.type),decode=game.decoding;
  $('#time').textContent=Math.floor(game.time/60).toString().padStart(2,'0')+':'+Math.floor(game.time%60).toString().padStart(2,'0');
  $('#count').textContent=game.powered===3?'电力已恢复 · 开启逃生闸门':'还需启动 '+(3-game.powered)+' 台发电机';
  $('#characterName').textContent=game.role==='hunter'?'监管者':game.character.name;$('#energy').textContent=game.role==='hunter'?(game.stun>0?'眩晕中':game.attack?.phase==='windup'?'挥击中':game.attack?'擦刀中':'追击中'):game.vault?'翻越中':game.vaultBoost>0?'翻窗加速 +30%':game.dashRemaining>0?'疾步冲刺':game.shield>0?'护光生效':'普通移动';
  if(three){while(three.pallets.length<game.pallets.length){const p=game.pallets[three.pallets.length],m=new three.T.Mesh(new three.T.BoxGeometry(4,3,.6),new three.T.MeshStandardMaterial({color:0xb59b69,roughness:.9}));m.position.set(p.x,1.5,p.y);three.scene.add(m);three.pallets.push(m);}game.windows.forEach(w=>{const name='window:'+w.x+':'+w.y;if(!three.scene.getObjectByName(name)){const group=new three.T.Group();group.name=name;group.position.set(w.x,0,w.y);for(const [x,y,width,height] of [[-2.2,1.9,.6,3.8],[2.2,1.9,.6,3.8],[0,1.2,4,.35],[0,3.8,4,.35]]){const m=new three.T.Mesh(new three.T.BoxGeometry(width,height,.7),new three.T.MeshStandardMaterial({color:0x909479}));m.position.set(x,y,0);group.add(m);}three.scene.add(group);}});three.gate.position.x=game.exit.x;three.generators.forEach((lamp,i)=>lamp.parent.position.set(game.generators[i].x,0,game.generators[i].y));const smoke=three.scene.getObjectByName('skillSmoke');smoke.visible=!!game.smoke;if(game.smoke){smoke.position.set(game.smoke.x,1,game.smoke.y);smoke.scale.set(game.smoke.r,3,game.smoke.r);}}
  $('#health').textContent=game.health===2?'健康':game.health===1?'受伤':'倒地';$('#health').style.color=game.health===2?'#d6ed91':'#e78265';
  if(previousMessage!==game.message){previousMessage=game.message;messageUntil=time+3.5;$('#message').textContent=game.message;}
  $('#message').classList.toggle('visible',time<messageUntil&&game.status==='playing');
  $('#repairPanel').hidden=(!repairing&&!decode&&!game.healing)||game.status!=='playing';
  $('#repairLabel').firstChild.textContent=game.healing?'医生自愈 ':decode?'正在破译 ':near?.type==='exit'?'开启闸门 ':'破译进度 ';
  const progress=game.healing?game.healProgress:decode?.p??(near?.ref?.p||0);
  $('#repair').textContent=repairing||decode||game.healing?Math.floor(progress)+'%':'—';$('#repairbar').style.width=repairing||decode||game.healing?progress+'%':'0%';
  const machine=game.generators.find(g=>g.p<100&&distance(g,game.player)<6&&Math.abs((game.player.z||0)-(g.z||0))<1.5);
  $('#decodeButton').hidden=!machine||game.status!=='playing'||!$('#settings').hidden||!!game.calibration||!$('#rotateHint').classList.contains('dismissed');
  $('#decodeButton small').textContent=game.decoding===machine?'退出':'破译';
  let decodePoint=null;
  if(machine&&view==='iso'){const p=project(machine.x,machine.y,5);decodePoint={x:p.x+45,y:p.y-28};}
  if(machine&&view==='third'&&three){const point=new three.T.Vector3(machine.x,3,machine.y).project(three.camera);if(point.z< -1||point.z>1)$('#decodeButton').hidden=true;decodePoint={x:(point.x+1)*width/2+45,y:(1-point.y)*height/2-25};}
  if(decodePoint){const touch=matchMedia('(pointer:coarse)').matches,top=touch?105:65,bottom=touch?height-155:height-48,right=touch?width-205:width-40;$('#decodeButton').style.left=Math.max(45,Math.min(right,decodePoint.x))+'px';$('#decodeButton').style.top=Math.max(top,Math.min(Math.max(top,bottom),decodePoint.y))+'px';}
  $('#calibration').hidden=!game.calibration||game.status!=='playing';
  if(game.calibration)$('#calibrationNeedle').style.left=(game.calibration.elapsed/game.calibration.duration*100)+'%';
  const touch=matchMedia('(pointer:coarse)').matches,key=touch?'按住交互':'按住 E';
  $('#prompt').textContent=game.calibration?'点击校准或按空格':decode?'破译中 · 移动中断':close?near.type==='pallet'?(touch?'点击交互放下木板':'[ E ] 放下木板'):near.type==='window'?(touch?'点击交互翻越窗口':'[ E ] 翻越窗口'):near.type==='heal'?key+' 包扎 · 保持静止':near.type==='exit'?key+' 开门 · 保持静止':'点击密码机旁按钮破译':game.exit.p>=100?'穿过东侧出口':game.powered===3?'前往东侧闸门':'';
  $('#dash').disabled=game.status!=='playing'||game.dashCooldown>0;
  $('#dash').classList.toggle('ready',game.dashCooldown<=0);
  $('#dashTime').textContent=game.dashCooldown>0?game.dashCooldown.toFixed(1)+'s':'Q · '+game.character.skill;
  $('#dash').disabled=$('#dash').disabled||!!game.vault||game.characterId==='doctor'&&game.health!==1;$('#dash').setAttribute('aria-label',game.character.skill);
  if(game.healing)$('#prompt').textContent='医生自愈中 · 移动或受击中断';
  $('#interact').textContent=near?.type==='palletVault'?'翻板':near?.type==='window'?'翻窗':near?.type==='pallet'?'放板':near?.type==='heal'?'包扎':near?.type==='generator'?'破译':'交互';
  if(near?.type==='palletVault'&&!decode&&!game.calibration){const blocked=game.palletVaultLock>0||game.palletReleaseRequired;$('#prompt').textContent=blocked?'放板恢复中 · 松开交互后再翻板':'靠近木板 · 点击交互翻板';$('#interact').disabled=blocked;}else $('#interact').disabled=!!game.vault;
  if(game.role==='hunter'){$('#decodeButton').hidden=true;$('#calibration').hidden=true;$('#repairPanel').hidden=true;$('#dashTime').textContent=game.hunterAttackCooldown>0?game.hunterAttackCooldown.toFixed(1)+'s':'Q · 攻击';$('#dash').disabled=game.status!=='playing'||game.stun>0||game.hunterAttackCooldown>0;$('#interact').textContent='拆板';$('#prompt').textContent=game.stun>0?'被木板砸中 · 眩晕中':'Q 攻击 · 靠近木板按住 E 拆除';$('#health').textContent='目标 '+(game.health===2?'健康':game.health===1?'受伤':'倒地');}
  $('.bottom').hidden=!$('#prompt').textContent||game.status!=='playing';
  $('#threat').textContent=game.stun>0?'追猎者已被眩晕':game.chasing?'危险 · 追猎者正在逼近':'';
  $('.threat').hidden=!$('#threat').textContent||game.status!=='playing';
  if(three){
    three.player.group.position.y=(game.player.z||0)+(game.vault?Math.sin(game.vault.elapsed*Math.PI)*.75:0);
    three.hunter.group.position.y=game.hunter.z||0;three.hunter.group.scale.setScalar(1.35);
    if(three.hunter.group.userData.skinId!==game.hunterId){const old=three.hunter.group.getObjectByName('hunterCostume');if(old)three.hunter.group.remove(old);const T=three.T,costume=new T.Group();costume.name='hunterCostume';const material=new T.MeshStandardMaterial({color:game.currentHunter.color,roughness:.85});const coat=new T.Mesh(new T.CylinderGeometry(.6,.8,1.5,10),material);coat.position.y=1.55;costume.add(coat);if(game.hunterId==='ripper'){const hat=new T.Mesh(new T.CylinderGeometry(.5,.5,.65,12),material);hat.position.y=3.7;costume.add(hat);const brim=new T.Mesh(new T.CylinderGeometry(.75,.75,.08,12),material);brim.position.y=3.35;costume.add(brim);}if(game.hunterId==='smiley'){const nose=new T.Mesh(new T.SphereGeometry(.16,8,6),new T.MeshStandardMaterial({color:0xd34b38}));nose.position.set(0,3,.48);costume.add(nose);const rocket=new T.Mesh(new T.CylinderGeometry(.3,.3,1.8,10),material);rocket.rotation.x=Math.PI/2;rocket.position.set(1,1.8,.4);costume.add(rocket);}if(game.hunterId==='naiad'){const spear=new T.Mesh(new T.CylinderGeometry(.04,.04,4,6),new T.MeshStandardMaterial({color:0xb7c7bb,metalness:.6}));spear.position.set(1.1,2,0);costume.add(spear);const head=new T.Mesh(new T.ConeGeometry(.17,.65,6),material);head.position.set(1.1,4.3,0);costume.add(head);}three.hunter.group.add(costume);three.hunter.group.userData.skinId=game.hunterId;}
    three.hunter.group.children[0].material.color.setHex(game.currentHunter.color);
    three.scene.children.filter(m=>m.name==='upperFloor').forEach(m=>m.visible=(game.controlled.z||0)>1);
    three.pallets.forEach((m,i)=>{
      const p=game.pallets[i];if(!p){m.visible=false;return;}
      const pose=palletPose(p);m.visible=!p.broken;
      m.rotation.set(0,0,-pose.angle);
      m.scale.set(1.3/4,4/3,1);
      m.position.set(pose.baseX+2*Math.sin(pose.angle),2*Math.cos(pose.angle),p.y);
    });
    const glow=three.scene.getObjectByName('hunterRedLight');
    if(glow){glow.position.set(game.hunter.x,.07+(game.hunter.z||0),game.hunter.y);glow.rotation.y=game.hunter.angle||0;}

    // Refined attack and recovery animations: windup slash, blade clean pause
    const a=game.attack,pivot=three.hunter.group.userData?.wepPivot,armR=three.hunter.group.userData?.armR;
    if(pivot&&armR){
      if(a?.phase==='windup'){
        const progress=Math.min(1,a.elapsed/a.duration);
        pivot.rotation.x=-Math.sin(progress*Math.PI)*1.85; // heavy forward-downward cleave
        pivot.rotation.z=-Math.sin(progress*Math.PI)*.45;
        armR.rotation.x=pivot.rotation.x*.8;
      }else if(a?.phase==='recovery'){
        const progress=Math.min(1,a.elapsed/a.recoveryTime);
        pivot.rotation.x=.65+Math.sin(progress*Math.PI*2)*.15; // blade raised across chest for wiping
        pivot.rotation.z=.4;
        armR.rotation.x=.5;
      }else{
        pivot.rotation.set(0,0,0);
        armR.rotation.set(0,0,0);
      }
    }
    const focus=game.controlled;
    three.camera.position.set(focus.x+Math.sin(cameraAngle)*12,10+(focus.z||0),focus.y+Math.cos(cameraAngle)*12);
    three.camera.lookAt(focus.x,2+(focus.z||0),focus.y);
    three.renderer.render(three.scene,three.camera);
  }
  if(three){three.gate.visible=false;for(const m of three.scene.children){if(m.name==='upperFloor'||m.name==='buildingRoof'){m.visible=true;m.material.transparent=false;m.material.opacity=1;m.material.depthWrite=true;}if(m.name==='escapeGate'){const e=game.exits.find(e=>e.x===m.userData.exit.x);m.position.y=2.5+(e?.p||0)/100*6;}}updateCamera();three.renderer.render(three.scene,three.camera);}
  if(sharedMatch&&chairState&&!chairState.result){const c=chairState.chairs.find(c=>c.occupant&&distance(c,game.player)<3),rescue=chairState.rescues.find(r=>r.id===myLanId);if(game.role==='survivor'&&c&&game.health>0){$('#interact').textContent='救人';$('#prompt').textContent=rescue?'救援中 '+Math.floor(rescue.time*100)+'% · 受击会震慑':'点击 E / 交互救人（1秒）';$('.bottom').hidden=false;}if(game.role==='hunter'){const near=chairLocations.some(c=>distance(c,game.hunter)<3);$('#interact').textContent=chairState.carried&&near?'挂椅':chairState.carried?'牵气球':'牵起';}}
  if(!sharedMatch&&['lost','won'].includes(game.status)&&$('#overlay').style.display==='none'){showOverlay();if(game.role==='hunter'){$('#overlay h2').textContent=game.health<=0?'追击成功':game.status==='won'?'逃生者已逃脱':'对局结束';$('#overlay p:not(.eyebrow)').textContent=game.health<=0?'你已击倒逃生者':'本局演练结束';}}
}
function updateCamera(){const {T,camera,scene}=three,a=game.controlled,target=new T.Vector3(a.x,(a.z||0)+2.25,a.y),length=5.2,offset=new T.Vector3(Math.sin(cameraAngle)*Math.cos(cameraPitch)*length,Math.sin(cameraPitch)*length,Math.cos(cameraAngle)*Math.cos(cameraPitch)*length),direction=offset.clone().normalize();const ray=new T.Raycaster(target,direction,.1,length+.3);const blockers=scene.children.filter(m=>m.isMesh&&m.visible&&!['hunterRedLight','skillSmoke'].includes(m.name)&&!three.pallets.includes(m)&&m!==three.gate&&m.material?.opacity>=.9);const hit=ray.intersectObjects(blockers,false)[0];const distance=hit?Math.max(.45,Math.min(length,hit.distance-.3)):length;camera.position.copy(target).addScaledVector(direction,distance);camera.position.y=Math.max((a.z||0)+.3,camera.position.y);camera.lookAt(target);}
async function loadGame(){canvas.style.display='none';$('#webgl').style.display='block';$('#start').disabled=true;$('#start').textContent='正在加载 3D…';try{await setupThree();$('#start').disabled=false;$('#start').textContent='开始演练';}catch(error){console.error(error);$('#overlay p:not(.eyebrow)').textContent='3D 加载失败，请检查网络或浏览器 WebGL 支持。';$('#start').textContent='重试加载';$('#start').disabled=false;$('#start').onclick=async()=>{await loadGame();if(three)$('#start').onclick=begin;};}}
resize();loadGame();requestAnimationFrame(frame);
