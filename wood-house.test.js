import {test} from 'node:test';
import assert from 'node:assert/strict';
import {woodHouse,woodBlocks,woodAction,moveBasement} from './wood-house.js';
test('wood house has clear side doors and a blocking window sill',()=>{
  woodHouse.palletDown=false;
  assert.equal(woodBlocks(149,64),false);assert.equal(woodBlocks(165,64),false);
  assert.equal(woodBlocks(157,56),true);assert.equal(woodBlocks(157,72),true);
});
test('left doorway pallet drops then vaults and lower window has safe landing',()=>{
  woodHouse.palletDown=false;
  assert.ok(woodAction({x:147,y:64}));assert.ok(woodHouse.palletDown);
  assert.equal(woodBlocks(149,64),true);
  assert.deepEqual(woodAction({x:147,y:64}).to,{x:151,y:64,z:0});
  assert.deepEqual(woodAction({x:157,y:74}).to,{x:157,y:70,z:0});
  woodHouse.palletDown=false;
});
test('basement stair descends continuously and returns upstairs',()=>{
  const p={x:150.5,y:59,z:0};
  for(let i=0;i<120;i++)moveBasement(p,.1,0);
  assert.equal(p.z,-5);assert.ok(p.x>162);
  for(let i=0;i<120;i++)moveBasement(p,-.1,0);
  assert.ok(Math.abs(p.z)<.1);
});
