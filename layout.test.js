import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampPosition} from './layout.js';
test('custom controls remain within viewport bounds',()=>{assert.deepEqual(clampPosition(-100,2000,64,64,800,400),{x:8,y:328});});
