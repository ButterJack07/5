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

    // Realistic proportioned human head with defined chin and jawline
    const cranium = sphere(0.42, 16, skinMat, headG, 0, 0.05, -0.02);
    cranium.scale.set(0.95, 1.05, 1.02);
    // Sculpted jaw and chin taper
    const jaw = cone(0.32, 0.45, 12, skinMat, headG, 0, -0.22, 0.1);
    jaw.rotation.x = Math.PI;

    // Realistic expressive eyes: white sclera + colored iris + pupil + upper eyelid crease
    const scleraMat = new T.MeshStandardMaterial({ color: 0xf5f5f3, roughness: 0.3 });
    const irisMat = new T.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.2 });
    const pupilMat = new T.MeshBasicMaterial({ color: 0x050505 });
    const browMat = new T.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.9 });
    const lipMat = new T.MeshStandardMaterial({ color: 0xb57868, roughness: 0.5 });

    for (const side of [-1, 1]) {
      const eyeX = side * 0.18;
      const eyeY = 0.04;
      const eyeZ = 0.38;

      // Eyeball
      const eyeG = new T.Group();
      eyeG.position.set(eyeX, eyeY, eyeZ);
      headG.add(eyeG);

      sphere(0.09, 10, scleraMat, eyeG, 0, 0, 0);
      cyl(0.055, 0.055, 0.03, 10, irisMat, eyeG, 0, 0, 0.075).rotation.x = Math.PI / 2;
      cyl(0.026, 0.026, 0.04, 8, pupilMat, eyeG, 0, 0, 0.08).rotation.x = Math.PI / 2;

      // Realistic arched eyebrow
      const brow = cube(0.18, 0.035, 0.04, browMat, headG, eyeX, eyeY + 0.14, eyeZ + 0.03);
      brow.rotation.z = -side * 0.15;
    }

    // Realistic sculpted nose with bridge and nostrils
    const noseBridge = cube(0.06, 0.18, 0.1, skinMat, headG, 0, 0, 0.44);
    noseBridge.rotation.x = -0.2;
    sphere(0.05, 8, skinMat, headG, 0, -0.1, 0.46);

    // Natural shaped lips with philtrum
    cube(0.16, 0.035, 0.05, lipMat, headG, 0, -0.22, 0.41);
    cube(0.12, 0.03, 0.05, lipMat, headG, 0, -0.26, 0.4);

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
    const torso = cube(0.85, 1.15, 0.58, mainMat, group, 0, 1.45, 0);
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
    group.userData.legL = legL;
    group.userData.legR = legR;
    group.userData.armL = armL;
    group.userData.armR = armR;
    group.userData.torso = torso;
    group.userData.headG = headG;
    group.userData.charId = charId;
  }

  function animatePose({ health = 2, moving = false, time = 0, vault = null, sprint = false, seated = false, carried = false }) {
    const { torso, headG, armL, armR, legL, legR } = group.userData;
    if (!torso || !headG || !armL || !armR || !legL || !legR) return;

    if (carried) {
      // Carried on Balloons (牵气球状态 - 悬吊半空剧烈挣扎、悬空乱蹬、双臂抓挠求生)
      torso.position.set(0, 1.45, 0);
      torso.rotation.set(-0.35 + Math.sin(time * 6) * 0.12, 0, Math.cos(time * 6) * 0.15); // suspended tilt & wobble
      headG.position.set(0, 2.35, 0.12);
      headG.rotation.set(0.25 + Math.sin(time * 6) * 0.1, 0, Math.sin(time * 6) * 0.12);

      // Legs suspended in mid-air frantically thrashing & kicking to break free
      legL.position.set(-0.24, 0.48, 0);
      legR.position.set(0.24, 0.48, 0);
      legL.rotation.set(0.45 + Math.sin(time * 9) * 0.85, 0, -0.15);
      legR.rotation.set(0.45 - Math.sin(time * 9) * 0.85, 0, 0.15);

      // Arms reaching out frantically clawing and flailing in the air
      armL.position.set(-0.55, 1.45, 0.1);
      armR.position.set(0.55, 1.45, 0.1);
      armL.rotation.set(-1.1 + Math.sin(time * 7) * 0.4, 0.3, -0.4);
      armR.rotation.set(-1.1 - Math.cos(time * 7) * 0.4, -0.3, 0.4);
      return;
    }

    if (seated) {
      // Seated on Rocket Chair: bound with thick ropes, thighs flat on chair base, shins dangling down, hands bound behind chair back
      torso.position.set(0, 1.25, 0.05);
      torso.rotation.set(-0.12, 0, Math.sin(time * 3) * 0.03); // struggle wriggling
      headG.position.set(0, 2.15, 0.08);
      headG.rotation.set(0.15, 0, Math.sin(time * 3) * 0.05);

      // Thighs level with chair seat, shins dangling downward at 90 degrees
      legL.position.set(-0.24, 0.72, 0.35);
      legR.position.set(0.24, 0.72, 0.35);
      legL.rotation.set(-1.52, 0, -0.05 + Math.sin(time * 4) * 0.08); // kicking feet in struggle
      legR.rotation.set(-1.52, 0, 0.05 - Math.sin(time * 4) * 0.08);

      // Arms wrenched backwards and secured tight behind the chair backrest
      armL.position.set(-0.45, 1.22, -0.25);
      armR.position.set(0.45, 1.22, -0.25);
      armL.rotation.set(0.85, 0, 0.4);
      armR.rotation.set(0.85, 0, -0.4);
      return;
    }

    if (vault) {
      const t = vault.elapsed / vault.duration;
      torso.position.set(0, 1.45, 0);
      torso.rotation.set(-0.4, 0, 0);
      headG.position.set(0, 2.35, 0);
      headG.rotation.set(-0.2, 0, 0);
      armL.position.set(-0.55, 1.4, 0);
      armR.position.set(0.55, 1.4, 0);
      armL.rotation.set(-1.2, 0, -0.3);
      armR.rotation.set(-1.2, 0, 0.3);
      legL.rotation.set(-1.4 * Math.sin(t * Math.PI), 0, 0);
      legR.rotation.set(0.8 * Math.sin(t * Math.PI), 0, 0);
      return;
    }

    if (health <= 0) {
      // Downed: crouched on ground holding head with both arms (抱头蹲下与爬行)
      torso.position.set(0, 0.85 + (moving ? Math.sin(time * 5) * 0.04 : 0), 0);
      torso.rotation.set(0.65, 0, moving ? Math.sin(time * 5) * 0.12 : 0);
      headG.position.set(0, 1.35, 0.45);
      headG.rotation.set(0.55, 0, 0);

      // Crouched knees folded underneath on the ground
      legL.position.set(-0.24, 0.28, -0.15);
      legR.position.set(0.24, 0.28, -0.15);
      legL.rotation.set(-1.45 + (moving ? Math.sin(time * 5) * 0.25 : 0), 0, 0);
      legR.rotation.set(-1.45 - (moving ? Math.sin(time * 5) * 0.25 : 0), 0, 0);

      // Arms raised clinging to head protecting ears / skull
      armL.position.set(-0.32, 1.55, 0.35);
      armR.position.set(0.32, 1.55, 0.35);
      armL.rotation.set(-1.85, 0.45, 0.7 + (moving ? Math.sin(time * 5) * 0.08 : 0));
      armR.rotation.set(-1.85, -0.45, -0.7 - (moving ? Math.sin(time * 5) * 0.08 : 0));
      return;
    }

    if (health === 1) {
      // Injured: clutching wounded abdomen with limping/stumbling gait (捂肚踉跄)
      torso.position.set(0, 1.45, 0);
      torso.rotation.set(0.25, 0, moving ? Math.sin(time * 6.5) * 0.18 : 0.08); // hunch forward & wobble
      headG.position.set(0, 2.35, 0);
      headG.rotation.set(0.18, 0, moving ? Math.sin(time * 6.5) * 0.1 : 0);

      // Left hand firmly pressing against wounded stomach
      armL.position.set(-0.35, 1.32, 0.22);
      armL.rotation.set(-0.85, 0.4, 0.55);

      // Right arm dangling and unsteadily swaying to maintain balance
      armR.position.set(0.55, 1.4, 0);
      armR.rotation.set(moving ? Math.sin(time * 6.5) * 0.45 : 0.1, 0, 0.2);

      // Limping staggered walk
      legL.position.set(-0.24, 0.48, 0);
      legR.position.set(0.24, 0.48, 0);
      const limpPhase = time * 6.5;
      legL.rotation.set(moving ? Math.sin(limpPhase) * 0.65 : 0, 0, 0); // Good step
      legR.rotation.set(moving ? Math.sin(limpPhase + 0.6) * 0.35 : 0, 0, 0); // Dragged stumbling leg
      return;
    }

    // Healthy (health >= 2)
    torso.position.set(0, 1.45, 0);
    torso.rotation.set(0, 0, 0);
    headG.position.set(0, 2.35, 0);
    headG.rotation.set(0, 0, 0);

    armL.position.set(-0.55, 1.4, 0);
    armR.position.set(0.55, 1.4, 0);
    legL.position.set(-0.24, 0.48, 0);
    legR.position.set(0.24, 0.48, 0);

    const walkSpeed = sprint ? 20 : 10;
    const walkPhase = time * walkSpeed;
    legL.rotation.set(moving ? Math.sin(walkPhase) * 0.65 : 0, 0, 0);
    legR.rotation.set(moving ? -Math.sin(walkPhase) * 0.65 : 0, 0, 0);
    armL.rotation.set(moving ? -Math.sin(walkPhase) * 0.5 : 0, 0, 0);
    armR.rotation.set(moving ? Math.sin(walkPhase) * 0.5 : 0, 0, 0);
  }

  updateCharacter(initialId);

  return {
    group,
    get legs() { return group.userData.legs || legs; },
    get armL() { return group.userData.armL || armL; },
    get armR() { return group.userData.armR || armR; },
    animatePose,
    updateCharacter
  };
}
