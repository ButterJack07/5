import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SharedMatch} from './match.js';
test('hunter recovers from first hit and can hit again after victim protection ends',()=>{
  const m=new SharedMatch([{id:'a',role:'survivor',character:'doctor'},{id:'h',role:'hunter',character:'ripper'}],false);
  const a=m.actors[0],h=m.actors[1];a.sim.player={x:50,y:52,z:0,health:2};h.sim.hunter={x:50,y:50,z:0,angle:0};
  m.input('h',{dash:true});for(let i=0;i<10;i++)m.update(.05);assert.equal(a.sim.health,1);
  m.input('h',{});for(let i=0;i<75;i++)m.update(.05);assert.equal(h.sim.attack,null);assert.equal(h.sim.hunterAttackCooldown,0);assert.equal(a.sim.invincible,0);
  m.input('h',{dash:true});for(let i=0;i<10;i++)m.update(.05);assert.equal(a.sim.health,0);assert.equal(h.sim.attack.phase,'recovery');
});
test('miss recovery completes and another swing starts',()=>{
  const m=new SharedMatch([{id:'a',role:'survivor',character:'doctor'},{id:'h',role:'hunter',character:'ripper'}],false),h=m.actors[1];
  m.input('h',{dash:true});for(let i=0;i<10;i++)m.update(.05);m.input('h',{});for(let i=0;i<30;i++)m.update(.05);assert.equal(h.sim.attack,null);m.input('h',{dash:true});m.update(.05);assert.equal(h.sim.attack.phase,'windup');
});
test('AI mode fills four survivors and one hunter on either chosen side',()=>{for(const role of ['hunter','survivor']){const m=new SharedMatch([{id:'me',role,character:role==='hunter'?'ripper':'mercenary'}],true);assert.equal(m.actors.filter(a=>a.role==='hunter').length,1);assert.equal(m.actors.filter(a=>a.role==='survivor').length,4);}});
test('all humans and bots belong to one authoritative map',()=>{const m=new SharedMatch([{id:'a',nickname:'A',role:'survivor',character:'doctor'},{id:'b',nickname:'B',role:'survivor',character:'mercenary'}],true);assert.equal(m.actors.length,5);for(const a of m.actors){assert.equal(a.sim.generators,m.world.generators);assert.equal(a.sim.pallets,m.world.pallets);}const a=m.actors[0],b=m.actors[1];const x=a.sim.player.x;m.input('a',{x:1});m.update();assert.ok(a.sim.player.x>x);assert.equal(b.sim.player.x,44);assert.equal(m.snapshot().actors.length,5);});
test('human hunter hits real remote survivor in shared world',()=>{const m=new SharedMatch([{id:'a',nickname:'A',role:'survivor',character:'doctor'},{id:'h',nickname:'H',role:'hunter',character:'ripper'}],false),a=m.actors[0],h=m.actors[1];a.sim.player={x:50,y:52,z:0,health:2};h.sim.hunter={x:50,y:50,z:0,angle:0};m.input('h',{dash:true});for(let i=0;i<12;i++)m.update();assert.equal(a.sim.health,1);assert.equal(m.snapshot().actors[0].health,1);});
