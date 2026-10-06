import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './game.js';
test('single player hit updates canonical health and reaches downed state',()=>{const g=new Game();g.start();g.hunter={x:50,y:50,z:0,angle:0};g.player={x:50,y:52,z:0};g.survivors=[g.player];g.beginAttack();g.updateAttack(.5);assert.equal(g.health,1);g.attack=null;g.hunterAttackCooldown=0;g.invincible=0;g.player.invincible=0;g.beginAttack();g.updateAttack(.5);assert.equal(g.health,0);assert.equal(g.status,'lost');});

test('hunter slash covers front 180 degrees with a longer central 90 degrees',()=>{
  const g=new Game();g.hunterId='geisha';g.hunter={x:50,y:50,z:0,angle:0};g.attack={angle:0,charged:false};
  const target=(degrees,r,z=0)=>({x:50+Math.sin(degrees*Math.PI/180)*r,y:50+Math.cos(degrees*Math.PI/180)*r,z});
  assert.equal(g.inAttackCone(target(90,4.7)),true);
  assert.equal(g.inAttackCone(target(-90,4.7)),true);
  assert.equal(g.inAttackCone(target(91,1)),false);
  assert.equal(g.inAttackCone(target(180,.5)),false);
  assert.equal(g.inAttackCone(target(0,5.5)),true);
  assert.equal(g.inAttackCone(target(45,5.5)),true);
  assert.equal(g.inAttackCone(target(46,5.5)),false);
  assert.equal(g.inAttackCone(target(0,5.7)),false);
  assert.equal(g.inAttackCone(target(0,2,4)),false);
  g.attack.charged=true;
  assert.equal(g.inAttackCone(target(90,6.1)),true);
  assert.equal(g.inAttackCone(target(0,6.9)),true);
  assert.equal(g.inAttackCone(target(0,7.1)),false);
});
