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

  // Test downed pose (crouched holding head)
  let legRotationSet = false, armRotationSet = false;
  s.legs[0].rotation = { set: (x, y, z) => { if (x < -1.2) legRotationSet = true; } };
  s.armL.rotation = { set: (x, y, z) => { if (x < -1.5) armRotationSet = true; } };
  s.animatePose({ health: 0, moving: true, time: 1 });
  assert.equal(legRotationSet, true);
  assert.equal(armRotationSet, true);

  // Test injured pose (clutching abdomen with limp)
  let injuredArmSet = false;
  s.armL.rotation = { set: (x, y, z) => { if (x < -0.5 && x > -1.0) injuredArmSet = true; } };
  s.animatePose({ health: 1, moving: true, time: 1 });
  assert.equal(injuredArmSet, true);

  // Test seated pose on rocket chair
  let seatedArmBehind = false, seatedLegBent = false;
  s.armL.rotation = { set: (x, y, z) => { if (x > 0.5) seatedArmBehind = true; } };
  s.legs[0].rotation = { set: (x, y, z) => { if (x < -1.4) seatedLegBent = true; } };
  s.animatePose({ health: 1, moving: false, time: 1, seated: true });
  assert.equal(seatedArmBehind, true);
  assert.equal(seatedLegBent, true);
});
