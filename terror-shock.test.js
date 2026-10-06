import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SharedMatch} from './match.js';
import {interruptInteraction} from './terror-shock.js';
test('vault hit cancels and downs beside starting side',()=>{const m=new SharedMatch([{id:'s',role:'survivor',character:'doctor'}],true),a=m.actors[0],w=a.sim.windows[0];a.sim.vault={from:{x:w.x,y:w.y-1.8,z:0},to:{x:w.x,y:w.y+1.8},elapsed:.2,duration:1};assert.ok(interruptInteraction(m,a));assert.equal(a.sim.vault,null);assert.equal(a.sim.health,0);assert.equal(a.sim.player.y,w.y-1.8);});
test('rescue shock removes action and directly downs',()=>{const m=new SharedMatch([{id:'s',role:'survivor',character:'doctor'}],true),a=m.actors[0];m.chairSystem.rescues.set(a.id,{chair:0,time:.3});assert.ok(interruptInteraction(m,a));assert.equal(a.sim.health,0);assert.equal(m.chairSystem.rescues.has(a.id),false);});
