import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {networkInterfaces} from 'node:os';
import {SharedMatch} from './match.js';

const files=new Set(['index.html','style.css','app.js','game.js','input.js','map.js','layout.js','architecture.js','match.js','hunter-ai.js','chairs.js','team-status.js','hunter-skills.js','hunter-model.js','survivor-model.js','standard-rules.js']);
const mime={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',json:'application/json'};
files.add('map-interactions.js');

// Minimal standalone LAN WebSocket frame encoder and decoder (RFC 6455)
// No third-party npm packages required so anyone on local Wi-Fi can play immediately.
class WSServer {
  constructor(server){
    this.clients=new Set();
    this.rooms=new Map(); // roomCode -> { players: Set, state: {} }
    this.timer=setInterval(()=>{for(const [code,r] of this.rooms){if(!r.match)continue;r.match.update(.05);this.broadcast(code,{type:'world_state',state:{...r.match.snapshot(),chairState:r.match.chairSnapshot()}});}},50);
    server.on('close',()=>clearInterval(this.timer));
    server.on('upgrade',(req,socket)=>{
      if(this.clients.size>=40||!['/ws','/'].includes(req.url)){socket.destroy();return;}
      const key=req.headers['sec-websocket-key'];
      if(!key){socket.destroy();return;}
      const accept=createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
      socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
      const client={socket,id:Math.random().toString(36).slice(2,9),nickname:'访客',room:null,role:'survivor',character:'mercenary',ready:false};
      this.clients.add(client);
      this.bindSocket(client);
    });
  }

  send(client,data){
    if(client.socket.destroyed)return;
    const json=JSON.stringify(data);
    const payload=Buffer.from(json);
    const len=payload.length;
    let header;
    if(len<126){
      header=Buffer.from([0x81,len]);
    }else if(len<=65535){
      header=Buffer.alloc(4);
      header[0]=0x81;header[1]=126;header.writeUInt16BE(len,2);
    }else{
      header=Buffer.alloc(10);
      header[0]=0x81;header[1]=127;header.writeBigUInt64BE(BigInt(len),2);
    }
    client.socket.write(Buffer.concat([header,payload]));
  }

  broadcast(roomCode,data,excludeClient=null){
    const r=this.rooms.get(roomCode);
    if(!r)return;
    for(const c of r.players){
      if(c!==excludeClient)this.send(c,data);
    }
  }
  roster(r){return [...r.players].map((p,i)=>({id:p.id,nickname:p.nickname,role:p.role,character:p.character,ready:!!p.ready,slot:p.slot,isHost:i===0}));}
  roomState(code){const r=this.rooms.get(code);if(!r)return;for(const client of r.players)this.send(client,{type:'roster_update',roster:this.roster(r).map(p=>client.role==='survivor'&&p.role==='hunter'?{...p,character:'隐藏'}:p),phase:r.phase||'seats',bots:r.bots||[],fillBots:false});}
  listRooms(){return [...this.rooms].map(([code,r])=>({code,name:r.name||code,count:r.players.size,started:r.matchStarted,host:this.roster(r)[0]?.nickname||'',capacity:5}));}
  notifyLobby(){const data={type:'rooms_list',rooms:this.listRooms()};for(const c of this.clients)this.send(c,data);}
  leave(client){const code=client.room,r=this.rooms.get(code);client.room=null;if(!r)return;r.players.delete(client);if(!r.players.size)this.rooms.delete(code);else{this.broadcast(code,{type:'player_left',id:client.id});this.broadcast(code,{type:'roster_update',roster:this.roster(r),fillBots:r.fillBots});}this.notifyLobby();}

  bindSocket(client){
    let buffer=Buffer.alloc(0);
    client.socket.on('data',chunk=>{
      buffer=Buffer.concat([buffer,chunk]);
      if(buffer.length>65536){client.socket.destroy();return;}
      while(buffer.length>=2){
        const opcode=buffer[0]&15;if(opcode===8){client.socket.end(Buffer.from([0x88,0]));return;}
        const isMasked=(buffer[1]&0x80)!==0;
        let len=buffer[1]&0x7f;
        let offset=2;
        if(len===126){
          if(buffer.length<4)break;
          len=buffer.readUInt16BE(2);offset=4;
        }else if(len===127){
          if(buffer.length<10)break;
          len=Number(buffer.readBigUInt64BE(2));offset=10;
        }
        if(!isMasked||len>16384){client.socket.destroy();return;}
        if(buffer.length<offset+4+len)break;
        const mask=buffer.subarray(offset,offset+4);
        const data=buffer.subarray(offset+4,offset+4+len);
        buffer=buffer.subarray(offset+4+len);
        const unmasked=Buffer.alloc(len);
        for(let i=0;i<len;i++)unmasked[i]=data[i]^mask[i%4];
        try{
          const msg=JSON.parse(unmasked.toString('utf8'));
          this.handleMessage(client,msg);
        }catch(e){}
      }
    });

    const cleanup=()=>{
      this.clients.delete(client);this.leave(client);
    };
    client.socket.on('close',cleanup);
    client.socket.on('error',cleanup);
  }

  handleMessage(client,msg){
    if(msg.type==='ready'&&client.room){const r=this.rooms.get(client.room);if(!r||r.phase!=='characters'||r.matchStarted)return;client.ready=!client.ready;this.roomState(client.room);return;}
    if(msg.type==='hunter_skill'&&client.room){const match=this.rooms.get(client.room)?.match,a=match?.actors.find(a=>a.id===client.id&&a.role==='hunter');if(a)a.skillHeld=!!msg.held;return;}
    if(msg.type==='return_room'&&client.room){const r=this.rooms.get(client.room);if(!r||r.match?.status!=='finished')return;r.match=null;r.matchStarted=false;r.phase='seats';this.broadcast(client.room,{type:'returned_room'});this.roomState(client.room);this.notifyLobby();return;}
    if(msg.type==='list_rooms'){this.send(client,{type:'rooms_list',rooms:this.listRooms()});return;}
    if(msg.type==='leave_room'){this.leave(client);this.send(client,{type:'room_left'});return;}
    if(msg.type==='create_room'||msg.type==='join_room'){
      if(msg.type==='create_room'&&this.rooms.size>=8){this.send(client,{type:'error',message:'服务器房间已满'});return;}
      const nickname=String(msg.nickname||'').trim().slice(0,10);
      if(!nickname){this.send(client,{type:'error',message:'请先设置昵称'});return;}
      const roomCode=msg.type==='create_room'?Math.random().toString(36).slice(2,8).toUpperCase():String(msg.room||'').trim().toUpperCase();
      if(!/^[A-Z0-9]{1,6}$/.test(roomCode)){this.send(client,{type:'error',message:'房间号须为 1～6 位字母或数字'});return;}
      if(msg.type==='join_room'&&!this.rooms.has(roomCode)){this.send(client,{type:'error',message:'房间不存在，请点击创建房间'});return;}
      const existing=this.rooms.get(roomCode);
      if(existing&&(existing.matchStarted||existing.players.size>=5)){this.send(client,{type:'error',message:'房间已开局或已满'});return;}
      const role=msg.role==='hunter'?'hunter':'survivor';
      if(existing&&role==='hunter'&&[...existing.players].some(p=>p!==client&&p.role==='hunter')){this.send(client,{type:'error',message:'监管者位置已有人'});return;}
      this.leave(client);
      if(!this.rooms.has(roomCode))this.rooms.set(roomCode,{name:String(msg.name||nickname+'的房间').slice(0,24),players:new Set(),fillBots:false,bots:[],phase:'seats',matchStarted:false});
      const r=this.rooms.get(roomCode);
      client.room=roomCode;
      client.nickname=nickname;
      client.role=role;
      client.slot=role==='hunter'?4:[0,1,2,3].find(i=>![...r.players].some(p=>p.slot===i));
      if(client.slot===undefined){this.send(client,{type:'error',message:'求生者位置已满'});return;}
      r.bots=r.bots.filter(i=>i!==client.slot);
      client.character=msg.character||'mercenary';
      r.players.add(client);
      const getRoster=()=>Array.from(r.players).map(p=>({id:p.id,nickname:p.nickname,role:p.role,character:p.character,isHost:p===Array.from(r.players)[0]}));
      this.send(client,{type:'room_joined',room:roomCode,yourId:client.id,roster:getRoster(),fillBots:r.fillBots});
      this.broadcast(roomCode,{type:'roster_update',roster:getRoster(),fillBots:r.fillBots});
      this.notifyLobby();
      this.roomState(roomCode);
    }else if(msg.type==='select_slot'&&client.room){const r=this.rooms.get(client.room),slot=Number(msg.slot);if(!r||r.phase!=='seats'||!Number.isInteger(slot)||slot<0||slot>4)return;if([...r.players].some(p=>p!==client&&p.slot===slot)){this.send(client,{type:'error',message:'该位置已有人'});return;}client.slot=slot;client.role=slot===4?'hunter':'survivor';client.character=slot===4?'ripper':'mercenary';r.bots=r.bots.filter(i=>i!==slot);this.roomState(client.room);
    }else if(msg.type==='slot_bot'&&client.room){const r=this.rooms.get(client.room),slot=Number(msg.slot);if(!r||[...r.players][0]!==client||r.phase!=='seats'||!Number.isInteger(slot)||slot<0||slot>4||[...r.players].some(p=>p.slot===slot))return;r.bots=r.bots.includes(slot)?r.bots.filter(i=>i!==slot):[...r.bots,slot];this.roomState(client.room);
    }else if(msg.type==='choose_characters'&&client.room){const r=this.rooms.get(client.room);if(!r||[...r.players][0]!==client||r.phase!=='seats')return;if(r.players.size<2){this.send(client,{type:'error',message:'至少需要 2 名真人'});return;}if(![...r.players].some(p=>p.role==='survivor')){this.send(client,{type:'error',message:'需要求生者'});return;}r.phase='characters';this.roomState(client.room);
    }else if(msg.type==='update_profile'&&client.room){
      const r=this.rooms.get(client.room);
      if(!r)return;
      if(r.matchStarted)return;
      if(msg.role==='hunter'&&[...r.players].some(p=>p!==client&&p.role==='hunter')){this.send(client,{type:'error',message:'监管者位置已有人'});return;}
      if(msg.nickname)client.nickname=String(msg.nickname).slice(0,10);
      if(r.phase==='seats'&&['hunter','survivor'].includes(msg.role)){const slot=msg.role==='hunter'?4:[0,1,2,3].find(i=>![...r.players].some(p=>p!==client&&p.slot===i));if(slot!==undefined){client.slot=slot;client.role=msg.role;}}
      if(msg.character){client.character=msg.character;client.ready=false;}
      const getRoster=()=>Array.from(r.players).map(p=>({id:p.id,nickname:p.nickname,role:p.role,character:p.character,isHost:p===Array.from(r.players)[0]}));
      this.broadcast(client.room,{type:'roster_update',roster:getRoster(),fillBots:r.fillBots});
      this.roomState(client.room);
    }else if(msg.type==='toggle_bots'&&client.room){
      const r=this.rooms.get(client.room);
      if(!r)return;
      if([...r.players][0]!==client||r.matchStarted)return;
      r.fillBots=!!msg.fillBots;
      const getRoster=()=>Array.from(r.players).map(p=>({id:p.id,nickname:p.nickname,role:p.role,character:p.character,isHost:p===Array.from(r.players)[0]}));
      this.broadcast(client.room,{type:'roster_update',roster:getRoster(),fillBots:r.fillBots});
    }else if(msg.type==='start_match'&&client.room){
      const r=this.rooms.get(client.room);
      if(!r)return;
      if([...r.players][0]!==client||r.matchStarted)return;
      if(r.phase!=='characters'){this.send(client,{type:'error',message:'请先进入选角阶段'});return;}
      if(![...r.players].every(p=>p.ready)){this.send(client,{type:'error',message:'等待所有玩家点击准备'});return;}
      const players=Array.from(r.players);
      const survivors=players.filter(p=>p.role==='survivor');
      const hunters=players.filter(p=>p.role==='hunter');
      // Rules: At least 2 players to start
      if(players.length<2){
        this.send(client,{type:'error',message:'需要至少 2 名玩家方可开始联机对局'});
        return;
      }
      if(!survivors.length||hunters.length>1||survivors.length>4){this.send(client,{type:'error',message:'需要 1～4 名求生者，最多 1 名监管者'});return;}
      r.matchStarted=true;
      const bots=r.bots.filter(i=>!players.some(p=>p.slot===i)).map(i=>({id:'bot-slot-'+i,nickname:i===4?'人机监管者':'人机求生者 '+(i+1),role:i===4?'hunter':'survivor',character:i===4?'ripper':'mercenary',bot:true,slot:i}));
      r.match=new SharedMatch([...players.map(p=>({id:p.id,nickname:p.nickname,role:p.role,character:p.character})),...bots],true);
      this.broadcast(client.room,{
        type:'match_start',
        roster:players.map(p=>({id:p.id,nickname:p.nickname,role:p.role,character:p.character})),
        fillBots:r.fillBots,
        needsAiHunter:hunters.length===0,
        needsAiSurvivors:r.fillBots?Math.max(0,4-survivors.length):0
      });
      this.notifyLobby();
    }else if(msg.type==='input'&&client.room){this.rooms.get(client.room)?.match?.input(client.id,msg.input||{});
    }else if(msg.type==='action'&&client.room){this.rooms.get(client.room)?.match?.action(client.id,msg.action,msg.index);
    }else if(msg.type==='sync_pos'&&client.room){
      if(this.rooms.get(client.room)?.match)return;
      // Forward player coordinate/orientation sync to peers in same room
      this.broadcast(client.room,{type:'peer_pos',id:client.id,nickname:client.nickname,x:msg.x,y:msg.y,z:msg.z,angle:msg.angle,role:client.role,character:client.character,health:msg.health,attack:msg.attack,anim:msg.anim},client);
    }else if(msg.type==='game_event'&&client.room){
      // Forward game actions (cipher progress, pallet drop, hunter swing/hit)
      this.broadcast(client.room,{type:'peer_event',id:client.id,event:msg.event,payload:msg.payload},client);
    }
  }
}

// Get local IPv4 address so player can easily connect from phone on Wi-Fi
function getLocalIP(){
  const nets=networkInterfaces();
  for(const name of Object.keys(nets)){
    for(const net of nets[name]||[]){
      if(net.family==='IPv4'&&!net.internal)return net.address;
    }
  }
  return 'localhost';
}

const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');return;}
  if(url.pathname==='/api/lan-info'){
    res.writeHead(200,{'Content-Type':mime.json,'Cache-Control':'no-store'});
    res.end(JSON.stringify({ip:getLocalIP(),port:Number(process.env.PORT)||5173}));
    return;
  }
  const name=url.pathname.slice(1)||'index.html';
  if(!files.has(name)){res.writeHead(404);res.end('Not found');return;}
  try{
    const data=await readFile(fileURLToPath(new URL(name,import.meta.url)));
    res.writeHead(200,{'Content-Type':mime[name.split('.').pop()],'Cache-Control':'no-store'});
    res.end(data);
  }catch{res.writeHead(500);res.end('Server error');}
});

new WSServer(server);
const PORT=Number(process.env.PORT)||5173;
server.listen(PORT,process.env.HOST||'0.0.0.0',()=>{
  const ip=getLocalIP();
  console.log(`\n========================================`);
  console.log(`Fogbound (雾港) LAN Server Started!`);
  console.log(`本机电脑访问: http://localhost:${PORT}`);
  console.log(`手机同一Wi-Fi访问: http://${ip}:${PORT}`);
  console.log(`========================================\n`);
});
