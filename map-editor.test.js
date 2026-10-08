import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  MAP_FORMAT, MAP_VERSION, createEmptyMap, normalizeMap, serializeMap, deserializeMap,
  validateMap, canPlace, placeTile, removeAt, cellTypeAt, GRID_PRESETS, mapToWorld
} from './map-editor.js';

test('empty map uses normalized format with size presets', () => {
  for (const key of ['small', 'medium', 'large']) {
    const map = createEmptyMap('测试', key);
    assert.equal(map.format, MAP_FORMAT);
    assert.equal(map.version, MAP_VERSION);
    assert.equal(map.size.key, key);
    assert.equal(map.size.cols, GRID_PRESETS[key].cols);
    assert.deepEqual(map.tiles, []);
    assert.deepEqual(map.structures, []);
  }
});

test('serialize then deserialize round-trips a map', () => {
  const map = createEmptyMap('回环测试', 'medium');
  placeTile(map, 'wall', 5, 5);
  placeTile(map, 'cipher', 6, 6);
  const text = serializeMap(map);
  const back = deserializeMap(text);
  assert.equal(back.name, '回环测试');
  assert.equal(cellTypeAt(back, 5, 5), 'wall');
  assert.equal(cellTypeAt(back, 6, 6), 'cipher');
});

test('exit can only be placed on manor outer wall', () => {
  const map = createEmptyMap('门', 'small');
  // No manor wall yet -> must fail
  assert.equal(canPlace(map, 'exit', 3, 3).ok, false);
  assert.equal(placeTile(map, 'exit', 3, 3).ok, false);
  // Add manor wall ring then place exit on it
  placeTile(map, 'manorWall', 3, 3);
  assert.equal(placeTile(map, 'exit', 3, 3).ok, true);
  assert.ok(validateMap(map).errors.length === 0 || !validateMap(map).errors.some(e => e.includes('逃生门')));
});

test('pallet requires rock or wall on both sides', () => {
  const map = createEmptyMap('板子', 'medium');
  // No anchors -> fail
  assert.equal(canPlace(map, 'pallet', 5, 5, 'h').ok, false);
  placeTile(map, 'wall', 4, 5);
  // Only one side -> still fail
  assert.equal(canPlace(map, 'pallet', 5, 5, 'h').ok, false);
  placeTile(map, 'rock', 6, 5);
  assert.equal(canPlace(map, 'pallet', 5, 5, 'h').ok, true);
  assert.equal(placeTile(map, 'pallet', 5, 5, 'h').ok, true);
});

test('window can only be placed on a wall or building wall', () => {
  const map = createEmptyMap('窗', 'medium');
  assert.equal(canPlace(map, 'window', 5, 5).ok, false);
  placeTile(map, 'wall', 5, 5);
  assert.equal(canPlace(map, 'window', 5, 5).ok, true);
  assert.equal(placeTile(map, 'window', 5, 5).ok, true);
  // Removing the wall removes the orphan window
  removeAt(map, 5, 5);
  assert.equal(map.tiles.some(t => t.type === 'window'), false);
});

test('two-floor house structure generates stairs upper floor and a drop hole', () => {
  const map = createEmptyMap('双层房', 'medium');
  assert.equal(placeTile(map, 'twoFloorHouse', 10, 10).ok, true);
  const world = mapToWorld(map);
  assert.ok(world.walls.length > 0, 'structure should emit walls');
  assert.ok(world.ramps.length >= 1, 'two-floor house must have stairs');
  assert.ok(world.upperFloors.length >= 4, 'second floor should be a ring around a hole');
  assert.ok(world.windows.length >= 1, 'house should have a window');
});

test('validation flags an exit not on manor wall', () => {
  const map = createEmptyMap('违规', 'medium');
  // Force an illegal exit directly into the data
  map.tiles.push({ type: 'exit', x: 5, y: 5 });
  const result = validateMap(map);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('逃生门')));
});

test('exit on manor wall and window on wall survive serialize round-trip', () => {
  const map = createEmptyMap('叠加', 'medium');
  placeTile(map, 'manorWall', 0, 5);
  placeTile(map, 'exit', 0, 5);
  placeTile(map, 'wall', 6, 6);
  placeTile(map, 'window', 6, 6);
  const back = deserializeMap(serializeMap(map));
  assert.ok(back.tiles.some(t => t.type === 'manorWall' && t.x === 0 && t.y === 5), 'manor wall kept');
  assert.ok(back.tiles.some(t => t.type === 'exit' && t.x === 0 && t.y === 5), 'exit kept on same cell');
  assert.ok(back.tiles.some(t => t.type === 'wall' && t.x === 6 && t.y === 6), 'wall kept');
  assert.ok(back.tiles.some(t => t.type === 'window' && t.x === 6 && t.y === 6), 'window kept on same cell');
  assert.equal(validateMap(back).errors.length, 0);
});

test('structural footprints block overlap', () => {
  const map = createEmptyMap('建筑', 'medium');
  assert.equal(placeTile(map, 'windowHouse', 4, 4).ok, true);
  // Second structure overlapping the first 3x3 must fail
  assert.equal(canPlace(map, 'twoFloorHouse', 5, 5).ok, false);
});
