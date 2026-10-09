import {test} from 'node:test';
import assert from 'node:assert/strict';
import {terrain,canWalkTerrain,moveOnTerrain,blinkDestination} from './park-terrain.js';

test('central river divides grassland and only three bridges allow entry',()=>{
  assert.equal(terrain.bridges.length,3);
  assert.ok(canWalkTerrain(40,80));assert.ok(canWalkTerrain(160,80));
  assert.equal(canWalkTerrain(100,70),false);
  for(const b of terrain.bridges){assert.ok(canWalkTerrain(100,b.y));assert.equal(canWalkTerrain(100,b.y+b.width/2),false);}
});
test('movement cannot tunnel into water but can cross every bridge',()=>{
  const p={x:85,y:70};moveOnTerrain(p,40,0);assert.ok(p.x<=89.2);
  for(const b of terrain.bridges){const a={x:85,y:b.y};moveOnTerrain(a,40,0);assert.ok(a.x>120);}
});
test('diagonal gates are centrally symmetric and map boundaries block walking',()=>{
  assert.equal(terrain.gates[0].x+terrain.gates[1].x,200);
  assert.equal(terrain.gates[0].y+terrain.gates[1].y,200);
  assert.equal(canWalkTerrain(-1,80),false);assert.equal(canWalkTerrain(201,80),false);
});
test('blink follows screen direction and obeys river and bounds',()=>{
  const d=blinkDestination({x:40,y:80},1,0);
  assert.ok(d.x>40&&d.y<80);assert.ok(Math.abs(Math.hypot(d.x-40,d.y-80)-16)<.01);
  const blocked=blinkDestination({x:85,y:70},.866,.5);
  assert.ok(blocked.x<=89.2);assert.ok(canWalkTerrain(blocked.x,blocked.y));
  const crossing=blinkDestination({x:85,y:100},.866,.5,40);
  assert.ok(crossing.x>120);assert.ok(canWalkTerrain(crossing.x,crossing.y));
  const edge=blinkDestination({x:195,y:170},.866,.5);
  assert.ok(edge.x<=198);assert.ok(canWalkTerrain(edge.x,edge.y));
});
