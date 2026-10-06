import {test} from 'node:test';
import assert from 'node:assert/strict';

const MockThree = {
  Group: class {
    constructor() { this.children = []; this.position = { set: () => {} }; this.rotation = { set: () => {} }; this.scale = { set: () => {} }; this.userData = {}; }
    add(m) { this.children.push(m); }
    remove(m) { const i = this.children.indexOf(m); if (i >= 0) this.children.splice(i, 1); }
  },
  BoxGeometry: class {},
  CylinderGeometry: class {},
  SphereGeometry: class {},
  ConeGeometry: class {},
  MeshStandardMaterial: class {},
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

test('creates and switches detailed ID5 style ragdoll models for survivors', async () => {
  const {createSurvivorMesh} = await import('./survivor-model.js');
  const s = createSurvivorMesh(MockThree, 'mercenary');
  assert.ok(s.group);
  assert.equal(s.legs.length, 2);
  assert.ok(s.group.children.length > 3);

  // Switch to Doctor
  s.updateCharacter('doctor');
  assert.equal(s.group.userData.charId, 'doctor');

  // Switch to Seer
  s.updateCharacter('seer');
  assert.equal(s.group.userData.charId, 'seer');

  // Switch to Perfumer
  s.updateCharacter('perfumer');
  assert.equal(s.group.userData.charId, 'perfumer');
});
