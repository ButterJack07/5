import {test} from 'node:test';
import assert from 'node:assert/strict';
import {houseBlocks,houseContains,screamHouse,spiralSteps,houseFloorHeight} from './scream-house.js';
import {moveOnTerrain} from './park-terrain.js';

test('octagonal nested walls have top bottom doorways and a clear corridor',()=>{
  const {x,y}=screamHouse;
  assert.ok(houseContains(x,y));assert.equal(houseBlocks(x,y),false);
  assert.equal(houseBlocks(x+19,y),true);
  assert.equal(houseBlocks(x,y+19),false);assert.equal(houseBlocks(x,y-19),false);
  assert.equal(houseBlocks(x,y+12),false);assert.equal(houseBlocks(x+15,y),false);
  const p={x,y:y+24};moveOnTerrain(p,0,-24);assert.ok(Math.abs(p.y-y)<.01);
});
test('paired wall-following stairs ascend from sides to north ring',()=>{
  assert.equal(spiralSteps.length,74);
  for(const side of [0,1]){const s=spiralSteps.filter(v=>v.side===side);assert.equal(s[0].z,0);assert.equal(s.at(-1).z,5.4);assert.equal(s[0].y,screamHouse.y);assert.ok(s.at(-1).y<screamHouse.y);}
  assert.equal(houseFloorHeight(54,118.7,5.4),5.4);
  for(const step of spiralSteps)assert.ok(houseContains(step.x,step.y,11),'stairs stay inside the inner wall');
  assert.equal(houseFloorHeight(54,122,5.4),5.4,'upper landing crosses the inner doorway');
  assert.equal(houseFloorHeight(54,133,0),0);
});
test('both stairs can actually be walked up onto the upper corridor and back down',()=>{
  for(const side of [0,1]){
    const steps=spiralSteps.filter(v=>v.side===side),p={x:steps[0].x,y:steps[0].y,z:0};
    for(const step of steps.slice(1))moveOnTerrain(p,step.x-p.x,step.y-p.y);
    assert.ok(p.z>5.3,`flight ${side} did not reach second floor: ${p.z}`);
    moveOnTerrain(p,0,-5);
    assert.ok(p.y<screamHouse.y-14.5);assert.equal(p.z,5.4);
    moveOnTerrain(p,0,5);
    for(const step of [...steps].reverse())moveOnTerrain(p,step.x-p.x,step.y-p.y);
    assert.ok(p.z<.1);
  }
});
test('holding north on either flight does not stall at facet corners or jump at the top',()=>{
  for(const side of [0,1]){
    const entry=spiralSteps.find(v=>v.side===side),p={x:entry.x,y:entry.y,z:0};
    let previous={...p};
    for(let i=0;i<180&&p.z<5.4;i++){
      moveOnTerrain(p,0,-.16);
      assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<.25,'no landing teleport');
      assert.ok(p.z>=previous.z,'ascent should never reverse at a corner');
      assert.ok(p.z-previous.z<.2,'height should be continuous');
      previous={...p};
    }
    assert.equal(p.z,5.4);
  }
});
