import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './game.js';
import {findRoute,walkSegment} from './pathfinding.js';
import {ramps} from './map.js';
test('route goes around wall and all retained segments clear full actor footprint',()=>{const g=new Game();g.start();const start={x:68,y:57,z:0},goal={x:63,y:63,z:0};assert.equal(walkSegment(g,start,goal),false);const path=findRoute(g,start,goal,1500);assert.ok(path.length);let last=start;for(const p of path){assert.ok(walkSegment(g,last,p));last=p;}assert.ok(Math.hypot(last.x-goal.x,last.y-goal.y)<3);});
test('stairs can be traversed but floor edges are not walking shortcuts',()=>{const g=new Game();g.start();const r=ramps[0],low={x:r.x,y:r.bottom,z:0},high={x:r.x,y:r.top,z:4};assert.ok(walkSegment(g,low,high));assert.equal(walkSegment(g,high,{x:r.x+12,y:r.top,z:0}),false);});
