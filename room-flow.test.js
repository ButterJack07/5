import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resetPreparation,preparationRemaining,quickMessages} from './room-flow.js';
import {collectScores} from './scoring.js';
test('countdown rounds up and return clears readiness',()=>{assert.equal(preparationRemaining(1200,201),1);const r={players:new Set([{ready:true},{ready:true}]),phase:'characters',deadline:1200};resetPreparation(r);assert.equal(r.deadline,0);assert.ok([...r.players].every(p=>!p.ready));assert.equal(quickMessages.length,5);});
test('settlement scores decoding rescue escape and caps totals',()=>{const s=collectScores({actors:[{id:'a',role:'survivor',escaped:true,decodeContribution:100,rescueCount:1},{id:'h',role:'hunter'},{id:'b',role:'survivor',eliminated:true}]});assert.equal(s[0].score,3500);assert.equal(s[1].score,1000);});
