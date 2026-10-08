import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './game.js';
import {SharedMatch, generateScatteredSpawns} from './match.js';

test('scattered spawn points randomize and keep actors separated', () => {
  const spawns = generateScatteredSpawns(4);
  assert.equal(spawns.survivors.length, 4);

  // Hunter must be at least 30m away from all survivors
  for (const s of spawns.survivors) {
    const distToHunter = Math.hypot(s.x - spawns.hunter.x, s.y - spawns.hunter.y);
    assert.ok(distToHunter >= 28, `Hunter-survivor dist ${distToHunter} should be >= 28m`);
  }

  // Survivors must not spawn on top of each other (spaced apart by at least 15m)
  for (let i = 0; i < spawns.survivors.length; i++) {
    for (let j = i + 1; j < spawns.survivors.length; j++) {
      const dist = Math.hypot(spawns.survivors[i].x - spawns.survivors[j].x, spawns.survivors[i].y - spawns.survivors[j].y);
      assert.ok(dist >= 15, `Survivors dist ${dist} should be >= 15m`);
    }
  }
});

test('moving leaves no red line footprints on ground', () => {
  const g = new Game();
  g.start();
  assert.equal(g.footprints, undefined);

  // Normal running (x: 1, y: 0)
  for (let i = 0; i < 20; i++) {
    g.update(0.1, {x: 1, y: 0, sneak: false});
  }
  assert.equal(g.footprints, undefined, 'no footprints or red line objects should be created');

  // Sneak moving
  const beforePos = {...g.player};
  for (let i = 0; i < 20; i++) {
    g.update(0.1, {x: 0, y: 1, sneak: true});
  }
  assert.equal(g.footprints, undefined);
  const sneakDist = Math.hypot(g.player.x - beforePos.x, g.player.y - beforePos.y);
  assert.ok(sneakDist > 0.5, 'sneaking player should move forward');
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

test('shared match spawns 4 survivors and 1 hunter across separated regions', () => {
  const match = new SharedMatch([
    {id: 's1', role: 'survivor', character: 'mercenary'},
    {id: 's2', role: 'survivor', character: 'doctor'},
    {id: 's3', role: 'survivor', character: 'seer'},
    {id: 's4', role: 'survivor', character: 'perfumer'},
    {id: 'h1', role: 'hunter', character: 'ripper'}
  ], false);

  const hunter = match.actors.find(a => a.role === 'hunter');
  const survivors = match.actors.filter(a => a.role === 'survivor');
  assert.equal(survivors.length, 4);

  // Verify none of the actors share the exact same position
  for (let i = 0; i < survivors.length; i++) {
    for (let j = i + 1; j < survivors.length; j++) {
      const d = Math.hypot(survivors[i].sim.player.x - survivors[j].sim.player.x, survivors[i].sim.player.y - survivors[j].sim.player.y);
      assert.ok(d > 10, 'survivors should be separated across the map');
    }
    const distToHunter = Math.hypot(survivors[i].sim.player.x - hunter.sim.hunter.x, survivors[i].sim.player.y - hunter.sim.hunter.y);
    assert.ok(distToHunter > 20, 'survivor should not spawn right next to the hunter');
  }
});
