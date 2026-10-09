import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ParkTrain,stations,trackPose,track,sleepers} from './park-train.js';

test('three stations have required track directions and a river crossing',()=>{
  assert.equal(stations.length,3);
  for(const st of stations){const v=trackPose(st.s);assert.ok(Math.abs(v.angle-st.angle)<.1);}
  assert.ok(track.some(v=>v.x>90&&v.x<110));
});
test('rail crosses on the central bridge without artificial vertical jumps',()=>{
  const crossing=track.filter(v=>v.x>=90&&v.x<=110);
  assert.ok(crossing.length>0);
  for(const v of crossing){assert.ok(Math.abs(v.y-100)<.01);assert.equal(trackPose(v.s).z,0);}
  for(const v of track)assert.equal(trackPose(v.s).z,0);
});
test('three seats driver departure one stop and ten second cooldown',()=>{
  const t=new ParkTrain();
  for(let i=0;i<3;i++)assert.ok(t.board('p'+i,t.carPose(i)));
  assert.equal(t.board('extra',t.carPose(0)),false);
  assert.equal(t.depart('p1'),false);assert.ok(t.depart('p0'));
  assert.equal(t.disembark('p1'),null);
  for(let i=0;i<1000&&t.moving;i++)t.update(.05);
  assert.equal(t.station,1);assert.equal(t.cooldown,10);
  assert.equal(t.depart('p0'),false);t.update(10);assert.ok(t.depart('p0'));
});
test('completed cipher permits skipping middle station near arrival only',()=>{
  const t=new ParkTrain();t.board('driver',t.carPose(0));t.depart('driver');
  assert.equal(t.chooseStop('driver',false),false);t.cipher=100;
  while(!t.approachingMiddle)t.update(.05);
  assert.ok(t.chooseStop('driver',false));
  for(let i=0;i<1000&&t.moving;i++)t.update(.05);
  assert.equal(t.station,2);
});
test('train accelerates toward faster cruise and brakes before arrival',()=>{
  const t=new ParkTrain();t.board('driver',t.carPose(0));t.depart('driver');
  t.update(.1);assert.ok(t.speed>0&&t.speed<1);
  let peak=0,beforeStop=Infinity;
  for(let i=0;i<2000&&t.moving;i++){
    beforeStop=t.speed;t.update(.02);peak=Math.max(peak,t.speed);
  }
  assert.ok(peak>15);assert.ok(beforeStop<1,'arrival velocity should be low');
  assert.equal(t.speed,0);assert.equal(t.station,1);
});
test('sleepers use sparse distance spacing independent of curve sample density',()=>{
  assert.ok(sleepers.length<track.length/2);
  for(let i=1;i<sleepers.length;i++)assert.ok(Math.hypot(sleepers[i].x-sleepers[i-1].x,sleepers[i].y-sleepers[i-1].y)>1.65);
});
