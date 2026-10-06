import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

test('real websocket lobby creates lists joins switches role and starts as host',async()=>{
  const port=19000+Math.floor(Math.random()*5000);
  const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:String(port)}});
  const sockets=[];
  try{
    await Promise.race([once(child.stdout,'data'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('server startup timeout')),5000))]);
    async function client(){const ws=new WebSocket(`ws://127.0.0.1:${port}`);sockets.push(ws);const queue=[];ws.onmessage=e=>queue.push(JSON.parse(e.data));await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});return {send:m=>ws.send(JSON.stringify(m)),wait:async type=>{for(let i=0;i<100;i++){const idx=queue.findIndex(m=>m.type===type);if(idx>=0)return queue.splice(idx,1)[0];await new Promise(r=>setTimeout(r,20));}throw new Error('timeout '+type);}};}
    const a=await client(),b=await client();
    a.send({type:'list_rooms'});assert.equal((await a.wait('rooms_list')).rooms.length,0);
    a.send({type:'create_room',nickname:'Alice',role:'survivor',name:'Test room'});
    const joined=await a.wait('room_joined');assert.ok(joined.room);assert.equal(joined.roster[0].isHost,true);
    b.send({type:'list_rooms'});let list=await b.wait('rooms_list');if(!list.rooms.length)list=await b.wait('rooms_list');assert.equal(list.rooms[0].code,joined.room);
    a.send({type:'choose_characters'});assert.match((await a.wait('error')).message,/2/);
    b.send({type:'join_room',room:joined.room,nickname:'Bob',role:'survivor'});assert.equal((await b.wait('room_joined')).roster.length,2);
    b.send({type:'update_profile',role:'hunter',character:'ripper'});
    let roster;do{roster=await b.wait('roster_update');}while(!roster.roster.some(p=>p.role==='hunter'));
    assert.equal(roster.roster.filter(p=>p.role==='hunter').length,1);
    a.send({type:'slot_bot',slot:2});let slots;do{slots=await a.wait('roster_update');}while(!slots.bots?.includes(2));assert.equal(slots.phase,'seats');
    a.send({type:'slot_bot',slot:2});a.send({type:'choose_characters'});a.send({type:'ready'});b.send({type:'ready'});let prepared;do{prepared=await a.wait('roster_update');}while(!prepared.roster.every(p=>p.ready));a.send({type:'start_match'});
    const match=await b.wait('match_start');assert.equal(match.needsAiHunter,false);assert.equal(match.needsAiSurvivors,0);assert.equal(match.roster.length,2);
    const firstA=await a.wait('world_state'),firstB=await b.wait('world_state');assert.deepEqual(firstA.state.generators,firstB.state.generators);assert.deepEqual(firstA.state.actors.map(p=>p.id),firstB.state.actors.map(p=>p.id));
    const original=firstA.state.actors.find(p=>p.id===joined.yourId).position.x;
    a.send({type:'input',input:{x:1}});
    let moved;for(let i=0;i<10;i++){moved=await b.wait('world_state');if(moved.state.actors.find(p=>p.id===joined.yourId).position.x>original)break;}
    assert.ok(moved.state.actors.find(p=>p.id===joined.yourId).position.x>original);
  }finally{for(const ws of sockets)ws.close();child.kill();}
});
