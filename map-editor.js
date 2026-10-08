// Fogbound Custom Map Editor — normalized format, validation, storage and grid logic.
// Pure module: browser-only helpers are guarded so it can also be imported in Node tests.
//
// ============================================================================
// MAP SAVE FORMAT (规范化的地图保存格式)  format: "fogbound-map", version: 1
// ----------------------------------------------------------------------------
// {
//   "format": "fogbound-map",
//   "version": 1,
//   "id": "map_xxx",
//   "name": "我的地图",
//   "author": "玩家昵称",
//   "size": { "key": "medium", "cols": 35, "rows": 35 },
//   "cellWorld": 4,                        // 每个格子对应的世界单位
//   "createdAt": "2026-10-08T00:00:00.000Z",
//   "updatedAt": "2026-10-08T00:00:00.000Z",
//   "tiles": [ { "type": "cipher", "x": 3, "y": 5 },               // 1x1 组件
//              { "type": "pallet", "x": 4, "y": 5, "orient": "h" },
//              { "type": "window", "x": 6, "y": 5, "orient": "h" } ],
//   "structures": [ { "type": "twoFloorHouse", "x": 10, "y": 10 } ] // 3x3 建筑
// }
// ============================================================================

export const MAP_FORMAT = 'fogbound-map';
export const MAP_VERSION = 1;
export const CELL_WORLD = 4;
export const MAP_STORAGE_KEY = 'fogbound-maps-v1';

export const GRID_PRESETS = {
  small: { key: 'small', cols: 15, rows: 15, label: '小 15 × 15' },
  medium: { key: 'medium', cols: 35, rows: 35, label: '中 35 × 35' },
  large: { key: 'large', cols: 50, rows: 50, label: '大 50 × 50' }
};

// Cell types that count as a "wall-like" neighbor for pallet placement.
export const WALL_LIKE = new Set(['wall', 'manorWall', 'windowHouse', 'twoFloorHouse']);
// Cell types that count as a solid neighbor (wall or rock) for pallet placement.
export const PALLET_ANCHORS = new Set(['wall', 'manorWall', 'rock', 'windowHouse', 'twoFloorHouse', 'obstacle']);

export const TILES = {
  exit:         { label: '逃生门',     color: '#48c96e', icon: '門', solo: true,  hint: '只能放在庄园外墙轮廓上' },
  wall:         { label: '墙',         color: '#8a8d7a', icon: '▉' },
  manorWall:    { label: '庄园外墙',   color: '#6b4a2f', icon: '▊', hint: '地图外围轮廓，逃生门只能放在它上面' },
  hatch:        { label: '地窖刷新点', color: '#4fd6c9', icon: '◇', solo: true },
  cipher:       { label: '密码机',     color: '#e6c34a', icon: '▣', solo: true },
  chair:        { label: '狂欢之椅',   color: '#d1563f', icon: '♜', solo: true },
  rock:         { label: '石头',       color: '#9aa0a6', icon: '●' },
  tree:         { label: '树',         color: '#4f8f4a', icon: '♣' },
  pallet:       { label: '板子',       color: '#c98a3a', icon: '▬', orient: true, hint: '板子两端必须连接石头或墙' },
  window:       { label: '窗',         color: '#5aa9e6', icon: '▤', orient: true, hint: '选择一段墙/建筑墙放置' },
  obstacle:     { label: '其他障碍',   color: '#8e6bc9', icon: '✕' },
  windowHouse:  { label: '带窗房',     color: '#b5893f', icon: '⌂', footprint: [3, 3] },
  twoFloorHouse:{ label: '双层带梯房', color: '#a0642f', icon: '⌗', footprint: [3, 3], hint: '带窗、楼梯通往二层，二层有洞可跳下' }
};

export const STRUCTURE_TYPES = ['windowHouse', 'twoFloorHouse'];
export const MULTI_CELL_TYPES = new Set(STRUCTURE_TYPES);

function mkId(prefix = 'map') {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function createEmptyMap(name = '未命名地图', sizeKey = 'medium', author = '') {
  const preset = GRID_PRESETS[sizeKey] || GRID_PRESETS.medium;
  const now = new Date().toISOString();
  return {
    format: MAP_FORMAT,
    version: MAP_VERSION,
    id: mkId(),
    name: String(name || '未命名地图'),
    author: String(author || ''),
    size: { key: preset.key, cols: preset.cols, rows: preset.rows },
    cellWorld: CELL_WORLD,
    createdAt: now,
    updatedAt: now,
    tiles: [],
    structures: []
  };
}

export function normalizeMap(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('地图数据无效');
  const preset = GRID_PRESETS[raw.size?.key] || GRID_PRESETS.medium;
  const out = {
    format: MAP_FORMAT,
    version: MAP_VERSION,
    id: raw.id || mkId(),
    name: String(raw.name || '未命名地图'),
    author: String(raw.author || ''),
    size: { key: preset.key, cols: Number(raw.size?.cols) || preset.cols, rows: Number(raw.size?.rows) || preset.rows },
    cellWorld: Number(raw.cellWorld) || CELL_WORLD,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    tiles: [],
    structures: []
  };
  const cols = out.size.cols, rows = out.size.rows;
  const seen = new Set();
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows;
  for (const t of Array.isArray(raw.tiles) ? raw.tiles : []) {
    if (!t || !TILES[t.type] || MULTI_CELL_TYPES.has(t.type)) continue;
    const x = Math.trunc(t.x), y = Math.trunc(t.y);
    if (!inBounds(x, y)) continue;
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const tile = { type: t.type, x, y };
    if (TILES[t.type].orient) tile.orient = t.orient === 'v' ? 'v' : 'h';
    out.tiles.push(tile);
  }
  for (const s of Array.isArray(raw.structures) ? raw.structures : []) {
    if (!s || !TILES[s.type] || !MULTI_CELL_TYPES.has(s.type)) continue;
    const x = Math.trunc(s.x), y = Math.trunc(s.y);
    if (!inBounds(x, y)) continue;
    out.structures.push({ type: s.type, x, y });
  }
  out.tiles = out.tiles.filter(t => !structureOverlaps(out, t.x, t.y));
  out.structures = out.structures.filter(s => !structureOverlapSelf(out, s));
  return out;
}

function structureFootprint(s) {
  const [w, h] = TILES[s.type]?.footprint || [1, 1];
  return { x: s.x, y: s.y, w, h };
}

function insideFootprint(x, y, fp) {
  return x >= fp.x && y >= fp.y && x < fp.x + fp.w && y < fp.y + fp.h;
}

function structureOverlaps(map, x, y) {
  return map.structures.some(s => insideFootprint(x, y, structureFootprint(s)));
}

function structureOverlapSelf(map, s) {
  const fp = structureFootprint(s);
  return map.structures.some(o => o !== s && !(fp.x + fp.w <= o.x || o.x + (TILES[o.type].footprint?.[0] || 1) <= fp.x ||
    fp.y + fp.h <= o.y || o.y + (TILES[o.type].footprint?.[1] || 1) <= fp.y));
}

export function tileAt(map, x, y) {
  return map.tiles.find(t => t.x === x && t.y === y) || null;
}

export function structureAt(map, x, y) {
  return map.structures.find(s => insideFootprint(x, y, structureFootprint(s))) || null;
}

export function cellTypeAt(map, x, y) {
  const st = structureAt(map, x, y);
  if (st) return st.type;
  const t = tileAt(map, x, y);
  return t ? t.type : null;
}

export function inBounds(map, x, y) {
  return x >= 0 && y >= 0 && x < map.size.cols && y < map.size.rows;
}

// ---------------------------------------------------------------------------
// Placement rules
// ---------------------------------------------------------------------------
export function canPlace(map, type, x, y, orient = 'h') {
  const def = TILES[type];
  if (!def) return { ok: false, reason: '未知组件' };
  if (!inBounds(map, x, y)) return { ok: false, reason: '超出地图范围' };

  if (MULTI_CELL_TYPES.has(type)) {
    const [w, h] = def.footprint;
    if (x + w > map.size.cols || y + h > map.size.rows) return { ok: false, reason: '建筑超出地图边界' };
    for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) {
      if (tileAt(map, x + dx, y + dy) || structureAt(map, x + dx, y + dy)) return { ok: false, reason: '该区域已被占用' };
    }
    return { ok: true };
  }

  const existing = cellTypeAt(map, x, y);
  const hasTile = (tt) => map.tiles.some(t => t.type === tt && t.x === x && t.y === y);

  if (type === 'exit') {
    // 逃生门只能放在庄园外墙轮廓上
    if (existing !== 'manorWall') return { ok: false, reason: '逃生门只能放在庄园外墙轮廓上' };
    if (hasTile('exit')) return { ok: false, reason: '此处已有逃生门' };
    return { ok: true };
  }

  if (type === 'window') {
    // 窗的放置方法是选择一段墙或建筑中的一个墙放上去
    if (hasTile('window')) return { ok: false, reason: '此处已有窗' };
    if (!WALL_LIKE.has(existing)) return { ok: false, reason: '窗只能放在墙或建筑墙上' };
    return { ok: true };
  }

  if (existing) return { ok: false, reason: '该格子已被占用' };

  if (type === 'pallet') {
    // 板子的两边要是石头或者墙
    const horizontal = orient === 'h';
    const left = horizontal ? [x - 1, y] : [x, y - 1];
    const right = horizontal ? [x + 1, y] : [x, y + 1];
    const l = cellTypeAt(map, left[0], left[1]);
    const r = cellTypeAt(map, right[0], right[1]);
    const okL = l && PALLET_ANCHORS.has(l) && l !== 'pallet';
    const okR = r && PALLET_ANCHORS.has(r) && r !== 'pallet';
    if (!okL || !okR) return { ok: false, reason: '板子两边必须连接石头或墙' };
    return { ok: true };
  }

  return { ok: true };
}

export function placeTile(map, type, x, y, orient = 'h') {
  const check = canPlace(map, type, x, y, orient);
  if (!check.ok) return check;
  if (MULTI_CELL_TYPES.has(type)) {
    map.structures.push({ type, x, y });
  } else if ((type === 'window' || type === 'exit') && tileAt(map, x, y)) {
    // Keep the underlying wall/manor wall, add the window/exit marker.
    map.tiles.push({ type, x, y, ...(TILES[type].orient ? { orient: orient === 'v' ? 'v' : 'h' } : {}) });
  } else {
    const tile = { type, x, y };
    if (TILES[type].orient) tile.orient = orient === 'v' ? 'v' : 'h';
    map.tiles.push(tile);
  }
  map.updatedAt = new Date().toISOString();
  return { ok: true };
}

export function removeAt(map, x, y) {
  const before = map.tiles.length + map.structures.length;
  map.tiles = map.tiles.filter(t => !(t.x === x && t.y === y));
  map.structures = map.structures.filter(s => !insideFootprint(x, y, structureFootprint(s)));
  let removed = before !== map.tiles.length + map.structures.length;
  // Drop orphan windows whose supporting wall/structure was removed.
  const orphans = map.tiles.filter(t => t.type === 'window' && !WALL_LIKE.has(structureAt(map, t.x, t.y)?.type) && !map.tiles.some(o => o !== t && o.x === t.x && o.y === t.y && WALL_LIKE.has(o.type)));
  if (orphans.length) {
    map.tiles = map.tiles.filter(t => !orphans.includes(t));
    removed = true;
  }
  if (removed) map.updatedAt = new Date().toISOString();
  return removed;
}

// ---------------------------------------------------------------------------
// Validation (规范化校验)
// ---------------------------------------------------------------------------
export function validateMap(map) {
  const errors = [];
  const warnings = [];
  const cols = map.size.cols, rows = map.size.rows;

  const exits = map.tiles.filter(t => t.type === 'exit');
  const ciphers = map.tiles.filter(t => t.type === 'cipher');
  const chairs = map.tiles.filter(t => t.type === 'chair');
  const hatches = map.tiles.filter(t => t.type === 'hatch');

  for (const e of exits) {
    const base = map.tiles.filter(t => t.x === e.x && t.y === e.y && t.type !== 'exit');
    const isManor = base.some(t => t.type === 'manorWall');
    const onEdge = e.x === 0 || e.y === 0 || e.x === cols - 1 || e.y === rows - 1;
    // 逃生门只能放在庄园外墙轮廓上
    if (!isManor) errors.push(`逃生门 (${e.x},${e.y}) 必须放在庄园外墙轮廓上`);
    else if (!onEdge) warnings.push(`逃生门 (${e.x},${e.y}) 位于庄园外墙但不在最外围轮廓，建议贴合地图边缘`);
  }

  for (const t of map.tiles) {
    if (t.type === 'window') {
      const base = map.tiles.filter(o => o.x === t.x && o.y === t.y && o.type !== 'window');
      const st = structureAt(map, t.x, t.y);
      const wallLike = st ? WALL_LIKE.has(st.type) : base.some(o => WALL_LIKE.has(o.type));
      if (!wallLike) errors.push(`窗 (${t.x},${t.y}) 必须放在墙或建筑墙上`);
    }
    if (t.type === 'pallet') {
      const horizontal = t.orient !== 'v';
      const l = cellTypeAt(map, horizontal ? t.x - 1 : t.x, horizontal ? t.y : t.y - 1);
      const r = cellTypeAt(map, horizontal ? t.x + 1 : t.x, horizontal ? t.y : t.y + 1);
      const okL = l && PALLET_ANCHORS.has(l) && l !== 'pallet';
      const okR = r && PALLET_ANCHORS.has(r) && r !== 'pallet';
      if (!okL || !okR) errors.push(`板子 (${t.x},${t.y}) 两边必须连接石头或墙`);
    }
  }

  if (ciphers.length < 5) warnings.push(`密码机数量为 ${ciphers.length} 台，对局通常需要至少 5 台（推荐 7 台）`);
  if (chairs.length < 3) warnings.push(`狂欢之椅数量为 ${chairs.length} 把，推荐至少 3 把`);
  if (hatches.length < 1) warnings.push('未放置地窖刷新点，建议至少放置 1 个');
  if (exits.length < 1) warnings.push('未放置逃生门');

  return { valid: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------
export function serializeMap(map, pretty = true) {
  const clean = normalizeMap(map);
  return JSON.stringify(clean, null, pretty ? 2 : 0);
}

export function deserializeMap(text) {
  let raw;
  try {
    raw = typeof text === 'string' ? JSON.parse(text) : text;
  } catch {
    throw new Error('地图文件不是合法的 JSON');
  }
  if (raw && raw.format && raw.format !== MAP_FORMAT) throw new Error('不是 Fogbound 地图文件');
  return normalizeMap(raw);
}

// ---------------------------------------------------------------------------
// Local storage library (browser)
// ---------------------------------------------------------------------------
function storage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function listMapsLocal() {
  const ls = storage();
  if (!ls) return [];
  try {
    const arr = JSON.parse(ls.getItem(MAP_STORAGE_KEY) || '[]');
    return Array.isArray(arr) ? arr.map(m => ({ id: m.id, name: m.name, size: m.size, updatedAt: m.updatedAt, tiles: m.tiles?.length || 0, structures: m.structures?.length || 0 })) : [];
  } catch {
    return [];
  }
}

function readAllLocal() {
  const ls = storage();
  if (!ls) return [];
  try {
    const arr = JSON.parse(ls.getItem(MAP_STORAGE_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAllLocal(arr) {
  const ls = storage();
  if (!ls) return false;
  ls.setItem(MAP_STORAGE_KEY, JSON.stringify(arr));
  return true;
}

export function saveMapLocal(map) {
  const clean = normalizeMap(map);
  clean.updatedAt = new Date().toISOString();
  const arr = readAllLocal();
  const idx = arr.findIndex(m => m.id === clean.id);
  if (idx >= 0) arr[idx] = clean; else arr.push(clean);
  writeAllLocal(arr);
  return clean;
}

export function loadMapLocal(id) {
  const found = readAllLocal().find(m => m.id === id);
  return found ? normalizeMap(found) : null;
}

export function deleteMapLocal(id) {
  const arr = readAllLocal().filter(m => m.id !== id);
  writeAllLocal(arr);
}

// ---------------------------------------------------------------------------
// World conversion (grid -> game entity shapes)
// ---------------------------------------------------------------------------
export function mapToWorld(map, cell = null) {
  const c = cell || map.cellWorld || CELL_WORLD;
  const cx = (col) => col * c + c / 2;
  const cy = (row) => row * c + c / 2;
  const world = {
    cell: c,
    size: { w: map.size.cols * c, h: map.size.rows * c },
    walls: [], obstacles: [], generators: [], pallets: [], windows: [], exits: [], chairs: [],
    hatchLocations: [], roofs: [], ramps: [], upperFloors: [], railings: []
  };

  for (const t of map.tiles) {
    const x = cx(t.x), y = cy(t.y);
    switch (t.type) {
      case 'wall': world.walls.push({ x, y, w: c, d: c, h: 4 }); break;
      case 'manorWall': world.walls.push({ x, y, w: c, d: c, h: 6, manor: true }); break;
      case 'rock': world.obstacles.push({ x, y, r: c * 0.42, type: 'rock', h: c * 0.5 }); break;
      case 'tree': world.obstacles.push({ x, y, r: c * 0.34, type: 'tree', h: c * 2 }); break;
      case 'obstacle': world.obstacles.push({ x, y, w: c * 0.8, d: c * 0.8, type: 'rock', h: c * 0.5 }); break;
      case 'cipher': world.generators.push({ x, y, p: 0 }); break;
      case 'chair': world.chairs.push({ x, y }); break;
      case 'hatch': world.hatchLocations.push({ x, y }); break;
      case 'pallet': {
        const horiz = t.orient !== 'v';
        world.pallets.push({ x, y, down: false, drop: 0, broken: false, orient: t.orient || 'h' });
        break;
      }
      case 'window': world.windows.push({ x, y, orient: t.orient || 'h' }); break;
      case 'exit': {
        const side = t.x <= 0 ? -1 : t.x >= map.size.cols - 1 ? 1 : (t.y <= 0 ? -1 : 1);
        world.exits.push({ x, y, side, p: 0 });
        break;
      }
    }
  }

  for (const s of map.structures) {
    const parts = buildStructure(map, s, c);
    world.walls.push(...parts.walls);
    world.windows.push(...parts.windows);
    world.ramps.push(...parts.ramps);
    world.upperFloors.push(...parts.upperFloors);
    world.railings.push(...parts.railings);
    world.roofs.push(...parts.roofs);
  }

  // Rocks need the game's rectangular post-processed shape.
  world.obstacles = world.obstacles.map(o => o.type === 'rock'
    ? { ...o, w: (o.r || o.w / 1.5) * 1.5, d: (o.r || o.w / 1.5) * 1, radius: o.r, r: 0 }
    : o);

  return world;
}

function buildStructure(map, s, c) {
  const [gw, gh] = TILES[s.type].footprint;
  const x0 = s.x * c, y0 = s.y * c;
  const W = gw * c, H = gh * c;
  const walls = [], windows = [], ramps = [], upperFloors = [], railings = [], roofs = [];
  const t = c * 0.4;

  const addWall = (rx, ry, rw, rd, h = 4) => walls.push({ x: x0 + rx, y: y0 + ry, w: rw, d: rd, h });

  if (s.type === 'windowHouse') {
    // 3x3 building: perimeter walls with a front door gap and one window
    addWall(W / 2, t / 2, W, t);
    addWall(W / 2, H - t / 2, W * 0.35, t);                 // south left
    addWall(W * 0.825, H - t / 2, W * 0.35, t);             // south right (door gap in middle)
    addWall(t / 2, H / 2, t, H);
    addWall(t / 2, H * 0.28, t, H * 0.4);
    addWall(t / 2, H * 0.8, t, H * 0.4);
    windows.push({ x: x0 + t / 2, y: y0 + H / 2, orient: 'v' });
    roofs.push({ x: x0 + W / 2, y: y0 + H / 2, w: W, d: H, z: 4, building: 'windowHouse' });
  } else if (s.type === 'twoFloorHouse') {
    // 双层带窗带楼梯通往二层然后二层空洞（可跳下来）
    addWall(W / 2, t / 2, W, t);
    addWall(W / 2, H - t / 2, W * 0.35, t);
    addWall(W * 0.825, H - t / 2, W * 0.35, t);
    // west wall with a window opening, east wall solid
    addWall(t / 2, H * 0.22, t, H * 0.34);
    addWall(t / 2, H * 0.74, t, H * 0.34);
    addWall(W - t / 2, H / 2, t, H);
    windows.push({ x: x0 + t / 2, y: y0 + H / 2, orient: 'v' });
    // stairs inside leading to the upper floor
    ramps.push({ x: x0 + W * 0.32, y: y0 + H / 2, w: c * 0.9, d: H * 0.8, top: y0 + H * 0.1, bottom: y0 + H * 0.9, kind: 'stairs' });
    // upper floor ring with a central drop-through hole
    const holeW = c, holeD = c;
    const hx = x0 + W / 2 - holeW / 2, hy = y0 + H / 2 - holeD / 2;
    upperFloors.push({ x: x0 + W / 2, y: y0 + H * 0.2, w: W, d: H * 0.4 });
    upperFloors.push({ x: x0 + W / 2, y: y0 + H * 0.8, w: W, d: H * 0.4 });
    upperFloors.push({ x: x0 + W * 0.2, y: y0 + H / 2, w: W * 0.4, d: H * 0.2 });
    upperFloors.push({ x: x0 + W * 0.8, y: y0 + H / 2, w: W * 0.4, d: H * 0.2 });
    // rails around the hole so you choose to drop
    railings.push({ x: hx + holeW / 2, y: hy - 0.2, w: holeW, d: 0.4 });
    railings.push({ x: hx + holeW / 2, y: hy + holeD + 0.2, w: holeW, d: 0.4 });
    roofs.push({ x: x0 + W / 2, y: y0 + H / 2, w: W, d: H, z: 8, building: 'twoFloorHouse' });
  }
  return { walls, windows, ramps, upperFloors, railings, roofs };
}

// ---------------------------------------------------------------------------
// Browser file helpers
// ---------------------------------------------------------------------------
export function downloadMap(map, filename = null) {
  if (typeof document === 'undefined') return;
  const text = serializeMap(map, true);
  const name = filename || `${(map.name || 'fogbound-map').replace(/[^\w\u4e00-\u9fa5-]+/g, '_')}.fogmap.json`;
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function readMapFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { try { resolve(deserializeMap(String(reader.result))); } catch (e) { reject(e); } };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}

export const MAP_EDITOR_VERSION = '1.0.0';
