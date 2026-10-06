import {test} from 'node:test';
import assert from 'node:assert/strict';

// Mock Three.js primitives for headless unit testing of the model generator
const MockThree = {
  Group: class {
    constructor() { this.children = []; this.position = { set: () => {} }; this.rotation = { set: () => {} }; this.userData = {}; }
    add(m) { this.children.push(m); }
    remove(m) { const i = this.children.indexOf(m); if (i >= 0) this.children.splice(i, 1); }
  },
  BoxGeometry: class {},
  CylinderGeometry: class {},
  SphereGeometry: class {},
  ConeGeometry: class {},
  TorusGeometry: class {},
  MeshStandardMaterial: class {},
  MeshBasicMaterial: class {},
  Mesh: class {
    constructor() {
      this.children = [];
      this.position = { set: () => {} };
      this.rotation = { set: () => {} };
      this.scale = { set: () => {} };
      this.castShadow = true;
      this.receiveShadow = true;
    }
    add(m) { this.children.push(m); }
    remove(m) { const i = this.children.indexOf(m); if (i >= 0) this.children.splice(i, 1); }
  }
};

test('creates and switches detailed 3D models for all three hunters', async () => {
  const {createHunterMesh} = await import('./hunter-model.js');
  const h = createHunterMesh(MockThree, 'ripper');
  assert.ok(h.group);
  assert.ok(h.legs.length === 2);
  assert.ok(h.group.children.length > 5);

  // Switch to Smiley Face
  h.updateSkin('smiley');
  assert.equal(h.group.userData.skinId, 'smiley');
  assert.ok(h.group.children.length > 5);

  // Switch to Naiad
  h.updateSkin('naiad');
  assert.equal(h.group.userData.skinId, 'naiad');
  assert.ok(h.group.children.length > 5);
});
