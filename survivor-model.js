// Detailed Survivor 3D Modeling Module for Fogbound
// Inspired by Identity V aesthetic: ragdoll proportions, button eyes with cross stitches, distinct costumes and accessories.

export function createSurvivorMesh(T, initialId = 'mercenary') {
  const group = new T.Group();
  group.name = 'survivorCharacter';
  let currentId = null;
  let legs = [];
  let armL = null;
  let armR = null;

  function cube(w, h, d, mat, parent, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  function cyl(rT, rB, h, seg, mat, parent, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(new T.CylinderGeometry(rT, rB, h, seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  function sphere(r, seg, mat, parent, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(new T.SphereGeometry(r, seg, seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  function cone(r, h, seg, mat, parent, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(new T.ConeGeometry(r, h, seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  function buildHead(root, skinMat, hairMat, eyeMat, stitchMat) {
    const headG = new T.Group();
    headG.position.set(0, 2.35, 0);
    root.add(headG);

    // Ragdoll rounded head
    const face = sphere(0.46, 12, skinMat, headG, 0, 0, 0);
    face.scale.set(1.05, 0.95, 1);

    // Iconic ID5 Button Eyes with cross stitches
    for (const side of [-1, 1]) {
      const eyeX = side * 0.2;
      const eyeY = 0.05;
      const eyeZ = 0.42;

      // Dark button rim
      const btn = cyl(0.12, 0.12, 0.04, 12, eyeMat, headG, eyeX, eyeY, eyeZ);
      btn.rotation.x = Math.PI / 2;

      // Button stitch hole cross (+)
      cube(0.14, 0.02, 0.02, stitchMat, headG, eyeX, eyeY, eyeZ + 0.03);
      cube(0.02, 0.14, 0.02, stitchMat, headG, eyeX, eyeY, eyeZ + 0.03);
    }

    // Ragdoll stitched mouth
    cube(0.18, 0.02, 0.02, stitchMat, headG, 0, -0.22, 0.41);
    for (const sx of [-0.07, 0, 0.07]) {
      cube(0.02, 0.06, 0.02, stitchMat, headG, sx, -0.22, 0.42);
    }

    return headG;
  }

  function updateCharacter(charId) {
    if (currentId === charId) return;
    currentId = charId;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    }

    legs = [];
    armL = null;
    armR = null;

    // Materials
    const skinMat = new T.MeshStandardMaterial({ color: 0xeedbc5, roughness: 0.8 });
    const eyeMat = new T.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.4 });
    const stitchMat = new T.MeshStandardMaterial({ color: 0xc4b29f, roughness: 0.9 });
    const leatherMat = new T.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.75 });
    const darkBootMat = new T.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });

    let mainColor = 0x4f6d53;
    let accentColor = 0x36483b;

    if (charId === 'doctor') {
      mainColor = 0xe4ecf2; // Nurse white
      accentColor = 0x386580; // Blue trim
    } else if (charId === 'seer') {
      mainColor = 0x2c3e50; // Deep hooded blue
      accentColor = 0x1a252f;
    } else if (charId === 'perfumer') {
      mainColor = 0x6d4c6d; // Aristocrat purple
      accentColor = 0x3e293e;
    } else if (charId === 'prospector') {
      mainColor = 0x825a3c; // Mining brown
      accentColor = 0x3a332a;
    } else if (charId === 'acrobat') {
      mainColor = 0xb8860b; // Circus ochre
      accentColor = 0x8b2500;
    } else if (charId === 'forward') {
      mainColor = 0xb23b23; // Rugby red
      accentColor = 0x222222;
    } else if (charId === 'coordinator') {
      mainColor = 0x46576b; // Military navy
      accentColor = 0xc2a052;
    } else if (charId === 'priestess') {
      mainColor = 0x5a416b; // Mystic violet
      accentColor = 0x9370db;
    }

    const mainMat = new T.MeshStandardMaterial({ color: mainColor, roughness: 0.85 });
    const accentMat = new T.MeshStandardMaterial({ color: accentColor, roughness: 0.8 });

    // Torso (tailored buttoned cloth jacket)
    cube(0.85, 1.15, 0.58, mainMat, group, 0, 1.45, 0);
    // Button row down jacket front
    for (const by of [1.6, 1.4, 1.2]) {
      cube(0.06, 0.06, 0.04, accentMat, group, 0, by, 0.3);
    }
    // Leather belt with silver buckle
    cube(0.88, 0.15, 0.6, leatherMat, group, 0, 0.95, 0);
    cube(0.18, 0.18, 0.62, new T.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 }), group, 0, 0.95, 0);

    // Legs & Shoes (ragdoll proportioned)
    const legL = cube(0.32, 0.95, 0.34, accentMat, group, -0.24, 0.48, 0);
    const legR = cube(0.32, 0.95, 0.34, accentMat, group, 0.24, 0.48, 0);
    // Boots
    cube(0.34, 0.22, 0.46, darkBootMat, legL, 0, -0.42, 0.05);
    cube(0.34, 0.22, 0.46, darkBootMat, legR, 0, -0.42, 0.05);
    legs = [legL, legR];

    // Arms
    armL = cube(0.25, 0.95, 0.25, mainMat, group, -0.55, 1.4, 0);
    cube(0.2, 0.25, 0.2, skinMat, armL, 0, -0.45, 0); // Ragdoll mitten hand
    armR = cube(0.25, 0.95, 0.25, mainMat, group, 0.55, 1.4, 0);
    cube(0.2, 0.25, 0.2, skinMat, armR, 0, -0.45, 0);

    // Head
    const headG = buildHead(group, skinMat, accentMat, eyeMat, stitchMat);

    // Role-specific hats and accessories
    if (charId === 'mercenary') {
      // Hood pulled up around head
      const hood = cyl(0.52, 0.56, 0.65, 10, mainMat, headG, 0, 0.05, -0.05);
      hood.scale.set(1.05, 1, 1.15);
      // Wrist elbow pads
      cube(0.3, 0.25, 0.3, leatherMat, armL, 0, -0.1, 0);
      cube(0.3, 0.25, 0.3, leatherMat, armR, 0, -0.1, 0);
    } else if (charId === 'doctor') {
      // White nurse beret cap with blue cross
      const cap = cyl(0.38, 0.42, 0.18, 12, mainMat, headG, 0, 0.48, 0);
      cube(0.12, 0.04, 0.12, accentMat, cap, 0, 0.1, 0);
      // First-aid satchel on hip
      cube(0.35, 0.32, 0.22, mainMat, group, 0.45, 0.95, 0);
      cube(0.12, 0.12, 0.24, new T.MeshStandardMaterial({ color: 0xcc2218 }), group, 0.45, 0.95, 0);
    } else if (charId === 'seer') {
      // Mystic deep hood & leather blindfold covering eyes
      const hood = cyl(0.52, 0.55, 0.72, 10, mainMat, headG, 0, 0.08, -0.05);
      hood.scale.set(1.05, 1, 1.15);
      // Blindfold band across head
      cube(0.95, 0.18, 0.88, leatherMat, headG, 0, 0.05, 0.02);
      // Perched spirit owl model on shoulder
      const owlG = new T.Group();
      owlG.position.set(-0.52, 1.95, 0);
      group.add(owlG);
      sphere(0.14, 8, new T.MeshStandardMaterial({ color: 0x486972 }), owlG, 0, 0, 0);
      cone(0.06, 0.12, 5, new T.MeshStandardMaterial({ color: 0xccaa44 }), owlG, 0, 0, 0.15);
    } else if (charId === 'perfumer') {
      // Aristocratic wide-brim hat with delicate veil
      cyl(0.72, 0.72, 0.06, 16, accentMat, headG, 0, 0.42, 0);
      cyl(0.36, 0.42, 0.28, 14, mainMat, headG, 0, 0.56, 0);
      // Glass perfume spray bottle in hand
      const flask = cyl(0.08, 0.1, 0.24, 8, new T.MeshStandardMaterial({ color: 0xcc88bb, transparent: true, opacity: 0.75 }), armR, 0, -0.6, 0.1);
      sphere(0.08, 6, new T.MeshStandardMaterial({ color: 0x442244 }), flask, 0, 0.16, 0);
    } else if (charId === 'forward') {
      // Leather rugby helmet with ear guards
      const helmet = sphere(0.52, 10, accentMat, headG, 0, 0.05, 0);
      helmet.scale.set(1.02, 0.98, 1.05);
      // Rugby ball tucked in arm
      const ball = sphere(0.2, 8, leatherMat, armL, 0.1, -0.3, 0);
      ball.scale.set(1.6, 1, 1);
    } else if (charId === 'coordinator') {
      // Military peaked visor cap
      const cap = cyl(0.48, 0.44, 0.24, 12, mainMat, headG, 0, 0.45, 0);
      cube(0.45, 0.06, 0.35, darkBootMat, cap, 0, -0.06, 0.25); // Visor
      // Brass holster on hip
      cube(0.18, 0.32, 0.18, leatherMat, group, -0.45, 0.92, 0);
    } else {
      // Standard tousled hair
      sphere(0.48, 10, accentMat, headG, 0, 0.25, -0.05);
    }

    group.userData.legs = legs;
    group.userData.armL = armL;
    group.userData.armR = armR;
    group.userData.charId = charId;
  }

  updateCharacter(initialId);

  return {
    group,
    get legs() { return group.userData.legs || legs; },
    get armL() { return group.userData.armL || armL; },
    get armR() { return group.userData.armR || armR; },
    updateCharacter
  };
}
