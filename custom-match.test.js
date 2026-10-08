import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyMap, placeTile, GRID_PRESETS} from './map-editor.js';
import {SharedMatch} from './match.js';
import {Game, walls, obstacles, clearCustomMap, getActiveCustomWorld} from './game.js';

function buildPlayableMap() {
  const map = createEmptyMap('测试对局地图', 'medium');
  const { cols, rows } = map.size;
  // Manor outer wall ring
  for (let x = 0; x < cols; x++) { placeTile(map, 'manorWall', x, 0); placeTile(map, 'manorWall', x, rows - 1); }
  for (let y = 0; y < rows; y++) { placeTile(map, 'manorWall', 0, y); placeTile(map, 'manorWall', cols - 1, y); }
  // Two exits on the manor wall
  placeTile(map, 'exit', 0, 3);
  placeTile(map, 'exit', cols - 1, rows - 4);
  // Ciphers, chairs, hatch
  [[5, 5], [10, 10], [18, 6], [25, 20], [12, 28], [28, 30], [6, 22]].forEach(([x, y]) => placeTile(map, 'cipher', x, y));
  [[8, 20], [20, 15], [15, 3]].forEach(([x, y]) => placeTile(map, 'chair', x, y));
  placeTile(map, 'hatch', 16, 16);
  // A wall with a window, and a pallet framed by walls
  placeTile(map, 'wall', 12, 12);
  placeTile(map, 'window', 12, 12);
  placeTile(map, 'wall', 20, 20); placeTile(map, 'wall', 22, 20);
  placeTile(map, 'pallet', 21, 20, 'h');
  return map;
}

test('custom map drives a real shared match with custom entities', () => {
  const map = buildPlayableMap();
  const m = new SharedMatch([
    { id: 'a', role: 'survivor', character: 'mercenary' },
    { id: 'h', role: 'hunter', character: 'ripper' }
  ], true, 0, map);

  assert.ok(m.customMap, 'match should remember the custom map');
  assert.equal(m.world.generators.length, 7, 'ciphers should come from the custom map');
  assert.equal(m.chairSystem.chairs.length, 3, 'chairs should come from the custom map');
  assert.ok(getActiveCustomWorld()?.openCells.length > 0);

  // Run several ticks to make sure the simulation is stable.
  for (let i = 0; i < 40; i++) m.update(0.05);
  for (const a of m.actors) {
    assert.ok(Number.isFinite(a.sim.player.x) && Number.isFinite(a.sim.hunter.x), 'positions finite');
  }
});

test('walls from a custom map block movement inside the world', () => {
  const map = buildPlayableMap();
  const m = new SharedMatch([{ id: 'a', role: 'survivor', character: 'mercenary' }, { id: 'h', role: 'hunter', character: 'ripper' }], false, 0, map);
  const g = m.actors[0].sim;
  // manor wall at column 0 (world x in [0,4]) must block a westward move
  const cell = 4;
  g.player.x = cell * 1.5; g.player.y = cell * 3;
  const before = g.player.x;
  for (let i = 0; i < 30; i++) g.move(g.player, -0.4, 0);
  assert.ok(g.player.x >= cell - 0.5, `survivor must not pass the manor wall (x=${g.player.x})`);
  assert.ok(g.player.x < before, 'survivor still moved west until blocked');
});

test('clearing the custom map restores the default world', () => {
  const map = buildPlayableMap();
  new SharedMatch([{ id: 'a', role: 'survivor', character: 'mercenary' }, { id: 'h', role: 'hunter', character: 'ripper' }], false, 0, map);
  assert.ok(getActiveCustomWorld());
  clearCustomMap();
  assert.equal(getActiveCustomWorld(), null);
  const g = new Game();
  g.start();
  assert.ok(!g.customMap, 'default game should not be flagged custom');
  assert.ok(g.generators.length > 0);
  assert.ok(walls.length > 0 && obstacles.length > 0);
});
