// Detailed Realistic-Proportioned Human Survivor 3D Modeling Module for Fogbound
// European gothic realistic human anatomy: natural shoulders, articulated limbs, detailed hands, sculpted face and character outfits.

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

  function buildRealisticHead(root, skinMat, hairMat) {
    const headG = new T.Group();
    headG.position.set(0, 2.38, 0);
    root.add(headG);

    // Anatomical neck
    cyl(0.13, 0.16, 0.35, 12, skinMat, headG, 0, -0.28, 0.02);

    // Cranium with natural curvature (tapered towards chin)
    const cranium = sphere(0.36, 16, skinMat, headG, 0, 0.08, -0.02);
    cranium.scale.set(0.92, 1.05, 1.02);

    // Sculpted jawbone & chin
    const jaw = cone(0.26, 0.42, 14, skinMat, headG, 0, -0.16, 0.08);
    jaw.rotation.x = Math.PI;

    // Realistic human eyes: sclera + iris + pupil + eyelids
    const scleraMat = new T.MeshStandardMaterial({ color: 0xf5f5f3, roughness: 0.3 });
    const irisMat = new T.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.25 });
    const pupilMat = new T.MeshBasicMaterial({ color: 0x050505 });
    const browMat = new T.MeshStandardMaterial({ color: 0x241810, roughness: 0.9 });
    const lipMat = new T.MeshStandardMaterial({ color: 0xb57262, roughness: 0.55 });

    for (const side of [-1, 1]) {
      const eyeX = side * 0.14;
      const eyeY = 0.06;
      const eyeZ = 0.32;

      // Eyeball
      const eyeG = new T.Group();
      eyeG.position.set(eyeX, eyeY, eyeZ);
      headG.add(eyeG);

      sphere(0.068, 10, scleraMat, eyeG, 0, 0, 0);
      cyl(0.042, 0.042, 0.025, 10, irisMat, eyeG, 0, 0, 0.06).rotation.x = Math.PI / 2;
      cyl(0.02, 0.02, 0.03, 8, pupilMat, eyeG, 0, 0, 0.065).rotation.x = Math.PI / 2;

      // Realistic upper eyelid fold
      cube(0.14, 0.025, 0.05, skinMat, headG, eyeX, eyeY + 0.07, eyeZ + 0.02);
      // Realistic natural eyebrow
      const brow = cube(0.15, 0.03, 0.04, browMat, headG, eyeX, eyeY + 0.12, eyeZ + 0.03);
      brow.rotation.z = -side * 0.14;

      // Ear on side of head
      const ear = cube(0.05, 0.16, 0.1, skinMat, headG, side * 0.34, 0.04, -0.04);
      ear.rotation.y = side * 0.2;
    }

    // Sculpted human nose (bridge, nasal bone, tip)
    const noseBridge = cube(0.055, 0.17, 0.09, skinMat, headG, 0, 0.02, 0.37);
    noseBridge.rotation.x = -0.22;
    sphere(0.045, 8, skinMat, headG, 0, -0.07, 0.39);

    // Natural philtrum & defined lips
    cube(0.13, 0.028, 0.04, lipMat, headG, 0, -0.17, 0.34); // upper lip
    cube(0.11, 0.025, 0.04, lipMat, headG, 0, -0.21, 0.33); // lower lip

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

    // Materials - natural textiles, leather, human skin
    const skinMat = new T.MeshStandardMaterial({ color: 0xead3be, roughness: 0.72, metalness: 0.02 });
    const hairMat = new T.MeshStandardMaterial({ color: 0x221812, roughness: 0.9 });
    const leatherMat = new T.MeshStandardMaterial({ color: 0x3d271a, roughness: 0.75 });
    const darkBootMat = new T.MeshStandardMaterial({ color: 0x1f1f21, roughness: 0.8 });
    const shirtWhiteMat = new T.MeshStandardMaterial({ color: 0xf0efe8, roughness: 0.85 });

    let mainColor = 0x475f4d;  // Mercenary trench olive
    let accentColor = 0x2a3d30;
    let hairColor = 0x2c221a;

    if (charId === 'doctor') {
      mainColor = 0xebf2f5;   // Nurse apron white
      accentColor = 0x2a5975; // Navy collar & cuffs
      hairColor = 0x4a2e1d;
    } else if (charId === 'seer') {
      mainColor = 0x243345;   // Mystic deep midnight blue
      accentColor = 0x15202d;
      hairColor = 0x1a1a1a;
    } else if (charId === 'perfumer') {
      mainColor = 0x614466;   // Victorian aristocrat violet
      accentColor = 0x3c2740;
      hairColor = 0x22171f;
    } else if (charId === 'prospector') {
      mainColor = 0x6e492e;   // Worker leather brown
      accentColor = 0x3a2e24;
      hairColor = 0x1d1d1d;
    } else if (charId === 'acrobat') {
      mainColor = 0xad7b16;   // Circus golden ochre
      accentColor = 0x822510;
      hairColor = 0xb55a1e;
    } else if (charId === 'forward') {
      mainColor = 0x9e2e21;   // Athletic crimson
      accentColor = 0x1f1f21;
      hairColor = 0x151515;
    } else if (charId === 'coordinator') {
      mainColor = 0x3d4e61;   // Service navy
      accentColor = 0xb5954a; // Gold braiding
      hairColor = 0x4a3424;
    } else if (charId === 'priestess') {
      mainColor = 0x4d3361;   // Ceremonial plum
      accentColor = 0x7b5894;
      hairColor = 0x251c2b;
    }

    const mainMat = new T.MeshStandardMaterial({ color: mainColor, roughness: 0.82 });
    const accentMat = new T.MeshStandardMaterial({ color: accentColor, roughness: 0.82 });
    const customHairMat = new T.MeshStandardMaterial({ color: hairColor, roughness: 0.92 });

    // 1. Realistic Torso Structure (natural chest, waist, and hips)
    const torso = new T.Group();
    torso.position.set(0, 1.48, 0);
    group.add(torso);

    // Upper chest & shoulders (trapezoid broad chest)
    cube(0.72, 0.65, 0.44, mainMat, torso, 0, 0.32, 0);
    // Shirt collar insert at throat
    cube(0.24, 0.22, 0.46, shirtWhiteMat, torso, 0, 0.6, 0.02);

    // Lower midriff & waist (slight taper inwards)
    cube(0.64, 0.55, 0.4, mainMat, torso, 0, -0.18, 0);

    // Tailored buttons down center
    for (const by of [0.45, 0.28, 0.1, -0.08]) {
      cube(0.045, 0.045, 0.03, accentMat, torso, 0, by, 0.23);
    }

    // Leather belt with metal buckle
    cube(0.68, 0.12, 0.43, leatherMat, torso, 0, -0.42, 0);
    cube(0.14, 0.15, 0.45, new T.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 }), torso, 0, -0.42, 0);

    // Coat tails / jacket lower hem
    const coatHem = cube(0.7, 0.35, 0.44, mainMat, torso, 0, -0.62, 0);

    // 2. Realistic Legs with Knees and Leather Boots
    function buildLeg(side) {
      const legRoot = new T.Group();
      legRoot.position.set(side * 0.2, 0.88, 0);
      group.add(legRoot);

      // Thigh
      const thigh = cyl(0.16, 0.13, 0.68, 12, accentMat, legRoot, 0, -0.34, 0);
      // Knee cap contour
      sphere(0.13, 8, accentMat, legRoot, 0, -0.68, 0.04);
      // Calf / Shin
      const shin = cyl(0.13, 0.12, 0.62, 12, accentMat, legRoot, 0, -0.99, 0);

      // Detailed riding / walking boot
      const boot = cyl(0.14, 0.125, 0.45, 12, darkBootMat, legRoot, 0, -1.15, 0);
      // Foot shoe with heel and toe cap
      const foot = cube(0.24, 0.16, 0.42, darkBootMat, legRoot, 0, -1.35, 0.07);
      // Small heel
      cube(0.24, 0.08, 0.14, darkBootMat, legRoot, 0, -1.41, -0.06);

      return legRoot;
    }

    const legL = buildLeg(-1);
    const legR = buildLeg(1);
    legs = [legL, legR];

    // 3. Realistic Arms with Shoulders, Elbows and Articulated Hands
    function buildArm(side) {
      const armRoot = new T.Group();
      armRoot.position.set(side * 0.45, 1.76, 0);
      group.add(armRoot);

      // Shoulder pad
      sphere(0.16, 10, mainMat, armRoot, 0, 0, 0);
      // Upper arm
      const upper = cyl(0.13, 0.11, 0.58, 10, mainMat, armRoot, side * 0.02, -0.3, 0);
      // Elbow contour
      sphere(0.11, 8, mainMat, armRoot, side * 0.02, -0.59, 0);
      // Forearm with cuff
      const forearm = cyl(0.11, 0.095, 0.52, 10, mainMat, armRoot, side * 0.02, -0.85, 0);
      cube(0.22, 0.08, 0.22, accentMat, armRoot, side * 0.02, -1.08, 0);

      // Realistic Human Hand with Fingers & Thumb
      const hand = new T.Group();
      hand.position.set(side * 0.02, -1.22, 0);
      armRoot.add(hand);

      // Palm
      cube(0.14, 0.18, 0.08, skinMat, hand, 0, 0, 0);
      // Fingers curled naturally
      for (let fi = -1; fi <= 1; fi++) {
        cube(0.04, 0.12, 0.07, skinMat, hand, fi * 0.045, -0.14, 0.01);
      }
      // Thumb
      const thumb = cube(0.045, 0.1, 0.06, skinMat, hand, -side * 0.08, -0.04, 0.03);
      thumb.rotation.z = side * 0.4;

      return armRoot;
    }

    armL = buildArm(-1);
    armR = buildArm(1);

    // 4. Realistic Head & Facial Features
    const headG = buildRealisticHead(group, skinMat, customHairMat);

    // 5. Authentic European Gothic Hairstyle & Detailed Accessories
    if (charId === 'mercenary') {
      // Tactical hood pulled up + bangs visible
      const hood = cyl(0.44, 0.48, 0.62, 12, mainMat, headG, 0, 0.1, -0.06);
      hood.scale.set(1.02, 1, 1.14);
      // Front hair bangs peeking out
      cube(0.32, 0.12, 0.14, customHairMat, headG, 0, 0.26, 0.32);
      // Reinforced leather forearm guard with metal rivets
      cube(0.24, 0.32, 0.24, leatherMat, armL, -0.02, -0.85, 0);
      cube(0.24, 0.32, 0.24, leatherMat, armR, 0.02, -0.85, 0);
    } else if (charId === 'doctor') {
      // Elegant parted brunette hair with bun
      sphere(0.4, 12, customHairMat, headG, 0, 0.18, -0.08);
      sphere(0.22, 10, customHairMat, headG, 0, 0.12, -0.38); // Chignon hair bun
      // Nurse cap with medical emblem
      const cap = cyl(0.32, 0.36, 0.16, 12, mainMat, headG, 0, 0.44, 0.02);
      cube(0.1, 0.04, 0.1, accentMat, cap, 0, 0.09, 0);
      // Cross-body medicine leather bag
      cube(0.32, 0.28, 0.18, mainMat, torso, 0.36, -0.38, 0.06);
      cube(0.1, 0.1, 0.2, new T.MeshStandardMaterial({ color: 0xb52218 }), torso, 0.36, -0.38, 0.06);
    } else if (charId === 'seer') {
      // Deep medieval cloaked hood + leather blindfold
      const hood = cyl(0.44, 0.47, 0.68, 12, mainMat, headG, 0, 0.12, -0.06);
      hood.scale.set(1.02, 1, 1.15);
      // Antiqued leather blindfold across eyes with subtle runes
      cube(0.74, 0.14, 0.68, leatherMat, headG, 0, 0.05, 0.04);
      // Realistic feathered messenger owl perched on left shoulder
      const owlG = new T.Group();
      owlG.position.set(-0.44, 0.48, 0);
      torso.add(owlG);
      sphere(0.11, 8, new T.MeshStandardMaterial({ color: 0x455663 }), owlG, 0, 0, 0);
      cone(0.045, 0.1, 5, new T.MeshStandardMaterial({ color: 0xc49b39 }), owlG, 0, 0, 0.12);
      // Wing fold
      cube(0.06, 0.14, 0.16, new T.MeshStandardMaterial({ color: 0x2a3842 }), owlG, -0.08, -0.02, 0);
    } else if (charId === 'perfumer') {
      // Coiffed Victorian updo with floral ornament
      sphere(0.4, 12, customHairMat, headG, 0, 0.2, -0.08);
      // Wide aristocratic sunhat with black lace ribbon
      cyl(0.65, 0.65, 0.05, 18, accentMat, headG, 0, 0.38, 0);
      cyl(0.32, 0.38, 0.22, 14, mainMat, headG, 0, 0.5, 0);
      // Glass vintage atomizer perfume spray bottle in right hand
      const flask = cyl(0.07, 0.09, 0.22, 10, new T.MeshStandardMaterial({ color: 0xd98bc2, transparent: true, opacity: 0.75, roughness: 0.1 }), armR, 0.02, -1.35, 0.08);
      sphere(0.065, 8, new T.MeshStandardMaterial({ color: 0x401633 }), flask, 0, 0.14, 0);
    } else if (charId === 'forward') {
      // Molded leather retro rugby headgear
      const helmet = sphere(0.42, 12, accentMat, headG, 0, 0.08, 0);
      helmet.scale.set(1.02, 0.98, 1.04);
      // Padded shoulder pads
      sphere(0.2, 8, mainMat, torso, -0.42, 0.36, 0);
      sphere(0.2, 8, mainMat, torso, 0.42, 0.36, 0);
      // Leather rugby ball held under left arm
      const ball = sphere(0.16, 10, leatherMat, armL, -0.04, -0.42, 0);
      ball.scale.set(1.5, 0.95, 0.95);
    } else if (charId === 'coordinator') {
      // Neatly styled hair + service peaked visor cap
      sphere(0.38, 12, customHairMat, headG, 0, 0.15, -0.06);
      const cap = cyl(0.42, 0.38, 0.2, 14, mainMat, headG, 0, 0.38, 0.04);
      cube(0.38, 0.05, 0.28, darkBootMat, cap, 0, -0.06, 0.2); // shiny visor
      // Side holster at waist
      cube(0.14, 0.28, 0.15, leatherMat, torso, -0.38, -0.35, 0);
    } else {
      // Natural textured wavy hair with layered side-part
      sphere(0.41, 12, customHairMat, headG, 0, 0.2, -0.06);
      cube(0.26, 0.18, 0.18, customHairMat, headG, -0.15, 0.24, 0.25);
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
      torso.position.set(0, 1.48, 0);
      torso.rotation.set(-0.35 + Math.sin(time * 6) * 0.12, 0, Math.cos(time * 6) * 0.15);
      headG.position.set(0, 2.38, 0.12);
      headG.rotation.set(0.25 + Math.sin(time * 6) * 0.1, 0, Math.sin(time * 6) * 0.12);

      legL.position.set(-0.2, 0.88, 0);
      legR.position.set(0.2, 0.88, 0);
      legL.rotation.set(0.45 + Math.sin(time * 9) * 0.85, 0, -0.15);
      legR.rotation.set(0.45 - Math.sin(time * 9) * 0.85, 0, 0.15);

      armL.position.set(-0.45, 1.76, 0);
      armR.position.set(0.45, 1.76, 0);
      armL.rotation.set(-1.1 + Math.sin(time * 7) * 0.4, 0.3, -0.4);
      armR.rotation.set(-1.1 - Math.cos(time * 7) * 0.4, -0.3, 0.4);
      return;
    }

    if (seated) {
      // Seated on Rocket Chair: bound with thick ropes, thighs flat on chair base, shins dangling down, hands bound behind chair back
      torso.position.set(0, 1.25, 0.05);
      torso.rotation.set(-0.12, 0, Math.sin(time * 3) * 0.03);
      headG.position.set(0, 2.15, 0.08);
      headG.rotation.set(0.15, 0, Math.sin(time * 3) * 0.05);

      legL.position.set(-0.2, 0.72, 0.35);
      legR.position.set(0.2, 0.72, 0.35);
      legL.rotation.set(-1.52, 0, -0.05 + Math.sin(time * 4) * 0.08);
      legR.rotation.set(-1.52, 0, 0.05 - Math.sin(time * 4) * 0.08);

      armL.position.set(-0.4, 1.35, -0.25);
      armR.position.set(0.4, 1.35, -0.25);
      armL.rotation.set(0.85, 0, 0.4);
      armR.rotation.set(0.85, 0, -0.4);
      return;
    }

    if (vault) {
      const t = vault.elapsed / vault.duration;
      torso.position.set(0, 1.48, 0);
      torso.rotation.set(-0.4, 0, 0);
      headG.position.set(0, 2.38, 0);
      headG.rotation.set(-0.2, 0, 0);
      armL.position.set(-0.45, 1.76, 0);
      armR.position.set(0.45, 1.76, 0);
      armL.rotation.set(-1.2, 0, -0.3);
      armR.rotation.set(-1.2, 0, 0.3);
      legL.position.set(-0.2, 0.88, 0);
      legR.position.set(0.2, 0.88, 0);
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

      legL.position.set(-0.2, 0.32, -0.15);
      legR.position.set(0.2, 0.32, -0.15);
      legL.rotation.set(-1.45 + (moving ? Math.sin(time * 5) * 0.25 : 0), 0, 0);
      legR.rotation.set(-1.45 - (moving ? Math.sin(time * 5) * 0.25 : 0), 0, 0);

      armL.position.set(-0.3, 1.55, 0.35);
      armR.position.set(0.3, 1.55, 0.35);
      armL.rotation.set(-1.85, 0.45, 0.7 + (moving ? Math.sin(time * 5) * 0.08 : 0));
      armR.rotation.set(-1.85, -0.45, -0.7 - (moving ? Math.sin(time * 5) * 0.08 : 0));
      return;
    }

    if (health === 1) {
      // Injured: clutching wounded abdomen with limping/stumbling gait (捂肚踉跄)
      torso.position.set(0, 1.48, 0);
      torso.rotation.set(0.25, 0, moving ? Math.sin(time * 6.5) * 0.18 : 0.08);
      headG.position.set(0, 2.38, 0);
      headG.rotation.set(0.18, 0, moving ? Math.sin(time * 6.5) * 0.1 : 0);

      armL.position.set(-0.3, 1.42, 0.2);
      armL.rotation.set(-0.85, 0.4, 0.55);

      armR.position.set(0.45, 1.76, 0);
      armR.rotation.set(moving ? Math.sin(time * 6.5) * 0.45 : 0.1, 0, 0.2);

      legL.position.set(-0.2, 0.88, 0);
      legR.position.set(0.2, 0.88, 0);
      const limpPhase = time * 6.5;
      legL.rotation.set(moving ? Math.sin(limpPhase) * 0.65 : 0, 0, 0);
      legR.rotation.set(moving ? Math.sin(limpPhase + 0.6) * 0.35 : 0, 0, 0);
      return;
    }

    // Healthy (health >= 2)
    torso.position.set(0, 1.48, 0);
    torso.rotation.set(0, 0, 0);
    headG.position.set(0, 2.38, 0);
    headG.rotation.set(0, 0, 0);

    armL.position.set(-0.45, 1.76, 0);
    armR.position.set(0.45, 1.76, 0);
    legL.position.set(-0.2, 0.88, 0);
    legR.position.set(0.2, 0.88, 0);

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
