import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './game.js';
import {HunterBrain,sightClear} from './hunter-ai.js';
test('hunter cannot detect through cottage wall and patrols instead',()=>{const g=new Game();g.start();g.hunter={x:12,y:75,z:0};const candidate={id:'a',sim:{player:{x:18,y:75,z:0},health:2,alert:0}};assert.equal(sightClear(g,g.hunter,candidate.sim.player),false);const brain=new HunterBrain();brain.update(g,[candidate],.05);assert.equal(brain.mode,'patrol');assert.equal(brain.targetId,null);});
test('hunter remembers last seen location instead of tracking through walls',()=>{const g=new Game();g.start();g.hunter={x:40,y:70,z:0};const c={id:'a',sim:{player:{x:43,y:70,z:0},health:2,alert:0}},brain=new HunterBrain();brain.update(g,[c],.05);assert.equal(brain.mode,'chase');const known={...brain.lastSeen};c.sim.player={x:18,y:75,z:0};brain.update(g,[c],.05);assert.equal(brain.mode,'search');assert.deepEqual(brain.lastSeen,known);});
test('nearby calibration noise allows investigation without global tracking',()=>{const g=new Game();g.start();g.hunter={x:12,y:75,z:0};const c={id:'a',sim:{player:{x:18,y:75,z:0},health:2,alert:2}},brain=new HunterBrain();brain.update(g,[c],.05);assert.equal(brain.mode,'investigate');assert.deepEqual(brain.lastSeen,c.sim.player);});
