import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inputKey,isGameKey} from './input.js';
import {Game} from './game.js';

test('physical WASD works with IME Process or non-Latin key values',()=>{
  for(const code of ['KeyW','KeyA','KeyS','KeyD']){
    assert.equal(inputKey({code,key:'Process'}),code.slice(-1).toLowerCase());
    assert.equal(inputKey({code,key:'Unidentified'}),code.slice(-1).toLowerCase());
  }
});
test('physical interaction, shift and arrows map correctly',()=>{
  assert.equal(inputKey({code:'KeyE',key:'Process'}),'e');
  assert.equal(inputKey({code:'ShiftRight',key:'Shift'}),'shift');
  assert.equal(inputKey({code:'ArrowUp',key:'ArrowUp'}),'arrowup');
  assert.equal(isGameKey('escape'),false);
});
test('all WASD directions move the player after start',()=>{
  for(const [code,x,y] of [['KeyW',0,-1],['KeyA',-1,0],['KeyS',0,1],['KeyD',1,0]]){
    const game=new Game();game.start();const before={...game.player};
    assert.ok(isGameKey(inputKey({code,key:'Process'})));
    game.update(.1,{x,y,interact:false,sprint:false});
    assert.equal(Math.sign(game.player.x-before.x),x);
    assert.equal(Math.sign(game.player.y-before.y),y);
  }
});
