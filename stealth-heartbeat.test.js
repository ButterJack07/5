import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './game.js';
import {SharedMatch} from './match.js';

test('running leaves footprints while sneaking moves slower and leaves none', () => {
  const g = new Game();
  g.start();
  assert.equal(g.footprints.length, 0);

  // Normal running (x: 1, y: 0)
  for (let i = 0; i < 20; i++) {
    g.update(0.1, {x: 1, y: 0, sneak: false});
  }
  assert.ok(g.footprints.length > 0, 'running should generate footprints');

  const runningFootprints = g.footprints.length;

  // Sneaking (sneak: true)
  const sneakStartPos = {...g.player};
  for (let i = 0; i < 20; i++) {
    g.update(0.1, {x: 0, y: 1, sneak: true});
  }
  assert.equal(g.footprints.length, runningFootprints, 'sneaking should not add any new footprints');
  const sneakDistance = Math.hypot(g.player.x - sneakStartPos.x, g.player.y - sneakStartPos.y);
  assert.ok(sneakDistance > 0.5, 'sneaking player should move forward');
});

test('footprints decay and fade over time', () => {
  const g = new Game();
  g.start();
  for (let i = 0; i < 20; i++) {
    g.update(0.1, {x: 1, y: 0, sneak: false});
  }
  const initialCount = g.footprints.length;
  assert.ok(initialCount > 0);

  // Advance time beyond footprint lifespan (4.5s)
  for (let i = 0; i < 50; i++) {
    g.update(0.1, {x: 0, y: 0});
  }
  assert.equal(g.footprints.length, 0, 'all footprints should decay and clear after 4.5 seconds');
});

test('heartbeat terror radius triggers within 32m and scales up as hunter gets closer', () => {
  const g = new Game();
  g.start();
  g.player = {x: 50, y: 50};
  g.hunter = {x: 50, y: 90}; // 40m away

  assert.equal(g.heartbeat, 0, 'heartbeat should be 0 beyond 32 meters');

  g.hunter = {x: 50, y: 70}; // 20m away (within 32m)
  const heart20m = g.heartbeat;
  assert.ok(heart20m > 0 && heart20m < 1);

  g.hunter = {x: 50, y: 58}; // 8m away (close pursuit)
  const heart8m = g.heartbeat;
  assert.ok(heart8m > heart20m, 'heartbeat intensity should increase as distance closes');
});

test('shared match tracks footprints in network snapshot for hunter tracking', () => {
  const match = new SharedMatch([{id: 'surv1', role: 'survivor', character: 'mercenary'}, {id: 'hunt1', role: 'hunter', character: 'ripper'}], false);
  const surv = match.actors[0];
  surv.input = {x: 1, y: 0, sneak: false};
  for (let i = 0; i < 30; i++) {
    match.update(0.05);
  }
  assert.ok(match.footprints.length > 0, 'shared match should record footprints');
  const snap = match.snapshot();
  assert.ok(Array.isArray(snap.footprints));
  assert.equal(snap.footprints.length, match.footprints.length);
});
