import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SharedMatch} from './match.js';
const match=id=>new SharedMatch([{id:'s',role:'survivor',character:'doctor'},{id:'h',role:'hunter',character:id}],false);
test('fog blade travels over time and damages once',()=>{const m=match('ripper'),s=m.actors[0],h=m.actors[1];h.sim.hunter={x:50,y:50,z:0,angle:0};s.sim.player={x:50,y:60,z:0};m.hunterSkills.update(m,h,{skill:true},.05);assert.equal(s.sim.health,2);for(let i=0;i<8;i++)m.hunterSkills.update(m,h,{skill:false},.05);assert.equal(s.sim.health,1);assert.equal(m.hunterSkills.projectiles.length,0);});
test('rocket requires holding and stops when released',()=>{const m=match('smiley'),h=m.actors[1];h.sim.hunter={x:50,y:50,z:0,angle:0};m.hunterSkills.update(m,h,{skill:true},.05);assert.ok(m.hunterSkills.rocket>9);m.hunterSkills.update(m,h,{skill:false},.05);assert.equal(m.hunterSkills.rocket,0);assert.equal(m.hunterSkills.cooldown,5);});
