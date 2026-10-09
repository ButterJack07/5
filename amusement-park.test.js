import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ParkMatch,createParkMap} from './amusement-park.js';
import {walls} from './game.js';

test('park has seven ciphers two usable gate openings and five actors',()=>{
  const m=new ParkMatch();
  assert.equal(m.world.generators.length,7);
  assert.equal(m.world.exits.length,2);
  assert.equal(m.actors.length,5);
  for(const e of m.world.exits)assert.ok(!walls.some(w=>w.manor&&w.x===e.x&&w.y===e.y));
  assert.equal(createParkMap().size.cols,50);
});
test('park chest search gives one consumable medical kit',()=>{
  const m=new ParkMatch(),a=m.actors.find(a=>a.id==='player'),c=m.chests[0];
  for(const other of m.actors)other.bot=false;
  Object.assign(a.sim.player,{x:c.x,y:c.y,z:0});
  for(let i=0;i<105;i++){m.input(a.id,{interact:true});m.update(.05);}
  assert.ok(c.opened);assert.equal(a.parkItem,'medicalKit');
  a.sim.health=1;assert.ok(m.useMedicalKit(a.id));assert.equal(a.sim.health,2);
  assert.equal(m.useMedicalKit(a.id),false);
});
