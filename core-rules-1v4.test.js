import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SharedMatch} from './match.js';
import {ChairSystem} from './chairs.js';

test('multiplayer decoding does not accelerate beyond 1.0x baseline rate', () => {
  const match = new SharedMatch([
    {id: 's1', role: 'survivor', character: 'mercenary'},
    {id: 's2', role: 'survivor', character: 'mercenary'},
    {id: 'h1', role: 'hunter', character: 'ripper'}
  ], false);

  const gen = match.world.generators[0];
  const s1 = match.actors[0], s2 = match.actors[1];
  s1.sim.player = {x: gen.x, y: gen.y, z: 0};
  s2.sim.player = {x: gen.x, y: gen.y, z: 0};
  s1.sim.startDecode(gen);
  s2.sim.startDecode(gen);

  for (let i = 0; i < 20; i++) {
    match.update(0.05);
  }

  // Baseline 1.0s of decode gives roughly 6.0% progress (1.0x rate), NOT 12.0%
  assert.ok(gen.p >= 5.5 && gen.p <= 7.0, `Progress was ${gen.p}, expected ~6.0% baseline with no stacked acceleration`);
});

test('mutual exclusion prevents multiple survivors from rescuing the same chair simultaneously', () => {
  const cs = new ChairSystem();
  const c = cs.chairs[0];
  const victim = {id: 'vic', role: 'survivor', sim: {health: 0, player: {x: c.x, y: c.y}}};
  const r1 = {id: 'r1', role: 'survivor', input: {interact: true}, sim: {health: 2, player: {x: c.x, y: c.y}}};
  const r2 = {id: 'r2', role: 'survivor', input: {interact: true}, sim: {health: 2, player: {x: c.x, y: c.y}}};
  const hunter = {role: 'hunter', input: {}, sim: {hunter: {x: 100, y: 100}}};
  cs.actors = [victim, r1, r2, hunter];
  cs.hang(victim, c);

  cs.update({actors: cs.actors}, 0.05);

  assert.equal(cs.rescues.size, 1, 'only one survivor should be granted active rescue lock');
});

test('prep phase grants 10s invincible status and disables attack', () => {
  const match = new SharedMatch([
    {id: 's1', role: 'survivor', character: 'mercenary'},
    {id: 'h1', role: 'hunter', character: 'ripper'}
  ], false, 10);

  const s = match.actors[0], h = match.actors[1];
  s.sim.player = {x: 50, y: 52, z: 0, health: 2};
  h.sim.hunter = {x: 50, y: 50, z: 0, angle: 0};

  match.input('h1', {dash: true});
  for (let i = 0; i < 10; i++) match.update(0.05);

  assert.equal(s.sim.health, 2, 'survivor should remain full health during prep phase');
  assert.ok(match.prepTime > 9, 'prep time should be actively ticking');
});

test('hunter can manually drop carried survivor back to the ground', () => {
  const cs = new ChairSystem();
  const victim = {id: 'vic', role: 'survivor', sim: {health: 0, player: {x: 50, y: 50}}};
  const hunter = {id: 'h', role: 'hunter', input: {interact: true}, sim: {hunter: {x: 50, y: 50}, updateFalls: () => {}}};
  cs.actors = [victim, hunter];
  cs.chairs.forEach(c => { c.x = 200; c.y = 200; }); // chairs are far away

  cs.update({actors: cs.actors}, 0.05);
  assert.equal(cs.carried, 'vic', 'hunter should pick up downed survivor');

  // Next interact away from chairs drops survivor
  hunter.input = {interact: true};
  cs.lastInteract = false;
  cs.update({actors: cs.actors}, 0.05);
  assert.equal(cs.carried, null, 'hunter should drop carried survivor back to ground');
});
