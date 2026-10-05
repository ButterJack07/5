import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {networkInterfaces} from 'node:os';

const files=new Set(['index.html','style.css','app.js','game.js','input.js','map.js','layout.js','architecture.js']);
const mime={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',json:'application/json'};

// Minimal standalone LAN WebSocket frame encoder and decoder (RFC 6455)
// No third-party npm packages required so anyone on local Wi-Fi can play immediately.
class WSServer {
  constructor(server){
    this.clients=new Set();
    this.rooms=new Map(); // roomCode -> { players: Set, state: {} }
    server.on('upgrade',(req,socket)=>{
      const key=req.headers['sec-websocket-key'];
      if(!key){socket.destroy();return;}
      const accept=createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
      socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
      const client={socket,id:Math.random().toString(36).slice(2,9),room:null,role:'survivor',character:'mercenary'};
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

  bindSocket(client){
    let buffer=Buffer.alloc(0);
    client.socket.on('data',chunk=>{
      buffer=Buffer.concat([buffer,chunk]);
      while(buffer.length>=2){
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
        if(!isMasked){client.socket.destroy();return;}
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
      this.clients.delete(client);
      if(client.room){
        const r=this.rooms.get(client.room);
        if(r){
          r.players.delete(client);
          this.broadcast(client.room,{type:'player_left',id:client.id});
          if(!r.players.size)this.rooms.delete(client.room);
        }
      }
    };
    client.socket.on('close',cleanup);
    client.socket.on('error',cleanup);
  }

  handleMessage(client,msg){
    if(msg.type==='join_room'){
      const roomCode=String(msg.room||'8888').toUpperCase().slice(0,6);
      if(client.room&&this.rooms.has(client.room))this.rooms.get(client.room).players.delete(client);
      if(!this.rooms.has(roomCode))this.rooms.set(roomCode,{players:new Set(),matchState:{started:false}});
      const r=this.rooms.get(roomCode);
      client.room=roomCode;
      client.role=msg.role||'survivor';
      client.character=msg.character||'mercenary';
      r.players.add(client);
      // Inform joining player of room status and peer roster
      const roster=Array.from(r.players).map(p=>({id:p.id,role:p.role,character:p.character}));
      this.send(client,{type:'room_joined',room:roomCode,yourId:client.id,roster});
      this.broadcast(roomCode,{type:'player_joined',player:{id:client.id,role:client.role,character:client.character}},client);
    }else if(msg.type==='sync_pos'&&client.room){
      // Forward player coordinate/orientation sync to peers in same room
      this.broadcast(client.room,{type:'peer_pos',id:client.id,x:msg.x,y:msg.y,z:msg.z,angle:msg.angle,role:client.role,character:client.character,health:msg.health,attack:msg.attack,anim:msg.anim},client);
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
server.listen(PORT,'0.0.0.0',()=>{
  const ip=getLocalIP();
  console.log(`\n========================================`);
  console.log(`Fogbound (雾港) LAN Server Started!`);
  console.log(`本机电脑访问: http://localhost:${PORT}`);
  console.log(`手机同一Wi-Fi访问: http://${ip}:${PORT}`);
  console.log(`========================================\n`);
});
