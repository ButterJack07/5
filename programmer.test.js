import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './game.js';
import {SharedMatch} from './match.js';

test('programmer skill 1: double speed toggle with 10s timer and no cooldown', () => {
  const g = new Game();
  g.start();
  g.characterId = 'programmer';

  assert.equal(g.progSpeed, false);
  // Initial normal step
  const startX = g.player.x;
  g.update(0.1, {x: 1, y: 0});
  const normalDelta = g.player.x - startX;

  // Toggle on
  assert.ok(g.triggerProgrammerSpeed());
  assert.equal(g.progSpeed, true);
  assert.equal(g.progSpeedTimer, 10);

  // Step with 2x speed
  const runX = g.player.x;
  g.update(0.1, {x: 1, y: 0});
  const fastDelta = g.player.x - runX;
  assert.ok(fastDelta >= normalDelta * 1.8, `Expected ~2x speed, got ${fastDelta} vs ${normalDelta}`);

  // Can toggle off anytime with no cooldown
  assert.ok(g.triggerProgrammerSpeed());
  assert.equal(g.progSpeed, false);
});

test('programmer skill 2: large radius stun on hunter with no cooldown', () => {
  const g = new Game();
  g.start();
  g.characterId = 'programmer';
  g.player = {x: 50, y: 50, z: 0};
  g.hunter = {x: 65, y: 50, z: 0}; // 15m away (within 30m)

  assert.equal(g.stun, 0);
  assert.ok(g.triggerProgrammerStun());
  assert.equal(g.stun, 4);

  // Can trigger repeatedly without cooldown
  g.stun = 0;
  assert.ok(g.triggerProgrammerStun());
  assert.equal(g.stun, 4);

  // Outside 30m range
  g.hunter = {x: 100, y: 50, z: 0}; // 50m away
  g.stun = 0;
  g.triggerProgrammerStun();
  assert.equal(g.stun, 0, 'should not stun when beyond 30m');
});

test('programmer skill 3: aim and teleport to teammate, unfinished cipher, or powered gate', () => {
  const g = new Game();
  g.start();
  g.characterId = 'programmer';
  g.player = {x: 20, y: 20, z: 0};

  // Add dummy active teammate
  g.survivors = [g.player, {x: 80, y: 80, z: 0, health: 2, nickname: '测试队友'}];
  const candidates = g.getTeleportCandidates();
  assert.ok(candidates.length >= 2, 'candidates should include teammate and ciphers');

  // Aim towards teammate angle
  const aimAngle = Math.atan2(80 - 20, 80 - 20);
  const target = g.updateProgrammerAim(aimAngle);
  assert.ok(target);

  // Trigger teleport
  assert.ok(g.triggerProgrammerTeleport(target));
  assert.ok(Math.hypot(g.player.x - target.x, g.player.y - target.y) < 1.0, 'player should teleport directly to destination');
});

test('shared multiplayer synchronizes programmer skills across network', () => {
  const match = new SharedMatch([
    {id: 'p1', role: 'survivor', character: 'programmer'},
    {id: 'h1', role: 'hunter', character: 'ripper'}
  ], false);

  const prog = match.actors[0], hunt = match.actors[1];
  prog.sim.player = {x: 50, y: 50, z: 0};
  hunt.sim.hunter = {x: 55, y: 50, z: 0}; // 5m away

  // Trigger stun via network input
  match.input('p1', {progStun: true});
  match.update(0.05);
  assert.ok(hunt.sim.stun >= 3.9, 'hunter should be stunned by programmer network input');
});
