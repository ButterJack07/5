import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SharedMatch} from './match.js';
import {SurvivorBrain} from './survivor-ai.js';
const make=()=>new SharedMatch([{id:'h',role:'hunter',character:'ripper'}],true);
test('bots flee visible nearby hunter and interrupt decoding',()=>{const m=make(),a=m.actors[1],h=m.actors[0];a.sim.player={x:50,y:50,z:0};h.sim.hunter={x:50,y:45,z:0};a.sim.decoding=m.world.generators[0];const b=new SurvivorBrain(),input=b.update(m,a,.05);assert.equal(b.mode,'flee');assert.equal(a.sim.decoding,null);assert.ok(input.y>0);});
test('only designated nearest healthy bot plans rescue',()=>{const m=make(),[h,a,b,v]=m.actors,c=m.chairSystem.chairs[0];h.sim.hunter={x:180,y:180};m.chairSystem.hang(v,c);a.sim.player={x:c.x+5,y:c.y,z:0};b.sim.player={x:100,y:100,z:0};a.brain=new SurvivorBrain();b.brain=new SurvivorBrain();a.brain.update(m,a,.05);b.brain.update(m,b,.05);assert.equal(a.brain.mode,'rescue');assert.equal(b.brain.mode,'decode');});
test('powered bots choose exit not remaining ciphers',()=>{const m=make(),a=m.actors[1];m.actors[0].sim.hunter={x:190,y:190};m.rules.powered=true;const b=new SurvivorBrain();b.update(m,a,.05);assert.equal(b.mode,'gate');});
