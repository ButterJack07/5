// Natural Human Survivor 3D Modeling Module for Fogbound
// Natural human proportions, normal facial features (human eyes, nose, lips),
// elegant outfits, articulated limbs, and professional accessories.

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

  // Realistic human head: natural cranial vault, refined jaw, realistic human eyes (sclera + iris + pupil), nose, lips, ears
  function buildHumanHead(root, skinMat, hairMat, charId) {
    const headG = new T.Group();
    headG.position.set(0, 2.36, 0);
    root.add(headG);

    // 1. Natural neck
    cyl(0.12, 0.14, 0.3, 12, skinMat, headG, 0, -0.24, 0.02);

    // 2. Cranium & jaw (slender, natural oval face)
    const cranium = sphere(0.33, 16, skinMat, headG, 0, 0.08, -0.01);
    cranium.scale.set(0.94, 1.05, 1.0);

    // Chin / jaw taper
    const jaw = cyl(0.24, 0.16, 0.32, 12, skinMat, headG, 0, -0.12, 0.06);
    jaw.scale.set(0.92, 1, 0.88);

    // 3. Natural Human Eyes (sclera + iris + pupil + eyelids + natural eyelashes)
    const scleraMat = new T.MeshStandardMaterial({ color: 0xfafaf8, roughness: 0.25 });
    const irisMat = new T.MeshStandardMaterial({ color: 0x3d2b20, roughness: 0.2 }); // warm deep brown iris
    const pupilMat = new T.MeshBasicMaterial({ color: 0x050505 });
    const lidMat = skinMat;
    const browMat = new T.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.9 });
    const lipMat = new T.MeshStandardMaterial({ color: 0xc47466, roughness: 0.5 }); // natural soft rose lip

    for (const side of [-1, 1]) {
      const eyeX = side * 0.13;
      const eyeY = 0.05;
      const eyeZ = 0.29;

      const eyeG = new T.Group();
      eyeG.position.set(eyeX, eyeY, eyeZ);
      headG.add(eyeG);

      // Eyeball
      sphere(0.062, 10, scleraMat, eyeG, 0, 0, 0);
      // Iris
      const iris = cyl(0.038, 0.038, 0.02, 10, irisMat, eyeG, 0, 0, 0.052);
      iris.rotation.x = Math.PI / 2;
      // Pupil
      const pupil = cyl(0.018, 0.018, 0.024, 8, pupilMat, eyeG, 0, 0, 0.056);
      pupil.rotation.x = Math.PI / 2;

      // Natural upper eyelid fold
      const upperLid = cube(0.12, 0.022, 0.04, lidMat, headG, eyeX, eyeY + 0.058, eyeZ + 0.015);
      upperLid.rotation.z = -side * 0.08;

      // Natural eyebrow
      const brow = cube(0.13, 0.026, 0.035, browMat, headG, eyeX, eyeY + 0.11, eyeZ + 0.02);
      brow.rotation.z = -side * 0.16;

      // Realistic ears
      const ear = cube(0.045, 0.14, 0.09, skinMat, headG, side * 0.32, 0.04, -0.04);
      ear.rotation.y = side * 0.15;
    }

    // 4. Slender refined human nose
    const nose = cube(0.045, 0.15, 0.08, skinMat, headG, 0, 0.01, 0.33);
    nose.rotation.x = -0.2;
    sphere(0.038, 8, skinMat, headG, 0, -0.07, 0.34);

    // 5. Defined human lips
    cube(0.11, 0.024, 0.035, lipMat, headG, 0, -0.15, 0.31); // upper lip
    cube(0.09, 0.022, 0.035, lipMat, headG, 0, -0.185, 0.30); // lower lip

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

    // Normal skin & natural human clothing materials
    const skinMat = new T.MeshStandardMaterial({ color: 0xefd8c5, roughness: 0.68, metalness: 0.02 });
    const hairMat = new T.MeshStandardMaterial({ color: 0x322319, roughness: 0.88 });
    const leatherMat = new T.MeshStandardMaterial({ color: 0x3d291c, roughness: 0.7 });
    const darkShoeMat = new T.MeshStandardMaterial({ color: 0x1e1e20, roughness: 0.75 });
    const whiteClothMat = new T.MeshStandardMaterial({ color: 0xf5f6f8, roughness: 0.75 });
    const metalMat = new T.MeshStandardMaterial({ color: 0xadb5bd, metalness: 0.85, roughness: 0.25 });

    let mainColor = 0x465f4c;   // Mercenary olive
    let accentColor = 0x2a3d30;
    let hairColor = 0x322319;

    if (charId === 'doctor') {
      mainColor = 0xf5f8fa;     // Clean medical white
      accentColor = 0x24567a;   // Navy hospital blue
      hairColor = 0x3c2619;     // Natural dark chestnut brown
    } else if (charId === 'seer') {
      mainColor = 0x243547;
      accentColor = 0x162230;
      hairColor = 0x1c1c1f;
    } else if (charId === 'perfumer') {
      mainColor = 0x5e4363;
      accentColor = 0x3d2742;
      hairColor = 0x281926;
    } else if (charId === 'prospector') {
      mainColor = 0x734d2f;
      accentColor = 0x3e2c1e;
      hairColor = 0x222222;
    } else if (charId === 'acrobat') {
      mainColor = 0xb5821c;
      accentColor = 0x8a2914;
      hairColor = 0xba5a1c;
    } else if (charId === 'forward') {
      mainColor = 0xa13022;
      accentColor = 0x222224;
      hairColor = 0x181818;
    } else if (charId === 'coordinator') {
      mainColor = 0x384a5e;
      accentColor = 0xba984c;
      hairColor = 0x422f20;
    } else if (charId === 'priestess') {
      mainColor = 0x503566;
      accentColor = 0x7e5899;
      hairColor = 0x261b2e;
    }

    const mainMat = new T.MeshStandardMaterial({ color: mainColor, roughness: 0.75 });
    const accentMat = new T.MeshStandardMaterial({ color: accentColor, roughness: 0.75 });
    const customHairMat = new T.MeshStandardMaterial({ color: hairColor, roughness: 0.88 });

    // 1. Natural Torso (chest, waist, hips with realistic clothing drape)
    const torso = new T.Group();
    torso.position.set(0, 1.48, 0);
    group.add(torso);

    // Natural upper chest & shoulders
    cube(0.66, 0.62, 0.38, mainMat, torso, 0, 0.32, 0);
    // Shirt collar insert
    cube(0.24, 0.18, 0.4, (charId === 'doctor' ? whiteClothMat : accentMat), torso, 0, 0.58, 0.02);

    // Slender waist & midriff
    cube(0.58, 0.52, 0.34, mainMat, torso, 0, -0.16, 0);

    // Front buttons / zipper
    for (const by of [0.42, 0.26, 0.1, -0.06]) {
      cube(0.038, 0.038, 0.02, accentMat, torso, 0, by, 0.2);
    }

    // Leather belt with buckle
    cube(0.62, 0.1, 0.37, leatherMat, torso, 0, -0.4, 0);
    cube(0.12, 0.12, 0.39, metalMat, torso, 0, -0.4, 0);

    // Uniform / jacket hem
    cube(0.64, 0.32, 0.38, mainMat, torso, 0, -0.58, 0);

    // 2. Natural Legs & Boots
    function buildLeg(side) {
      const legRoot = new T.Group();
      legRoot.position.set(side * 0.19, 0.88, 0);
      group.add(legRoot);

      // Thigh
      cyl(0.15, 0.13, 0.64, 12, accentMat, legRoot, 0, -0.32, 0);
      // Knee
      sphere(0.12, 8, accentMat, legRoot, 0, -0.64, 0.02);
      // Calf
      cyl(0.125, 0.11, 0.58, 12, accentMat, legRoot, 0, -0.92, 0);

      // Leather walking shoe / low-heel boot
      cyl(0.13, 0.12, 0.32, 12, darkShoeMat, legRoot, 0, -1.16, 0);
      const shoe = cube(0.22, 0.15, 0.38, darkShoeMat, legRoot, 0, -1.33, 0.06);
      cube(0.22, 0.07, 0.14, darkShoeMat, legRoot, 0, -1.38, -0.06); // heel

      return legRoot;
    }

    const legL = buildLeg(-1);
    const legR = buildLeg(1);
    legs = [legL, legR];

    // 3. Natural Arms & Hands
    function buildArm(side) {
      const armRoot = new T.Group();
      armRoot.position.set(side * 0.42, 1.74, 0);
      group.add(armRoot);

      // Shoulder
      sphere(0.15, 10, mainMat, armRoot, 0, 0, 0);
      // Upper arm
      cyl(0.12, 0.105, 0.54, 10, mainMat, armRoot, side * 0.02, -0.28, 0);
      // Elbow
      sphere(0.1, 8, mainMat, armRoot, side * 0.02, -0.56, 0);
      // Forearm with cuff
      cyl(0.1, 0.09, 0.48, 10, mainMat, armRoot, side * 0.02, -0.8, 0);
      cube(0.2, 0.07, 0.2, accentMat, armRoot, side * 0.02, -1.02, 0);

      // Natural Human Hand
      const hand = new T.Group();
      hand.position.set(side * 0.02, -1.16, 0);
      armRoot.add(hand);

      // Palm
      const palmMat = (charId === 'doctor' ? new T.MeshStandardMaterial({ color: 0xb5d6e6, roughness: 0.35 }) : skinMat);
      cube(0.13, 0.16, 0.07, palmMat, hand, 0, 0, 0);
      // Natural fingers
      for (let fi = -1; fi <= 1; fi++) {
        cube(0.036, 0.11, 0.06, palmMat, hand, fi * 0.04, -0.12, 0.01);
      }
      // Thumb
      const thumb = cube(0.04, 0.09, 0.05, palmMat, hand, -side * 0.07, -0.04, 0.02);
      thumb.rotation.z = side * 0.35;

      return armRoot;
    }

    armL = buildArm(-1);
    armR = buildArm(1);

    // 4. Head with Natural Human Features
    const headG = buildHumanHead(group, skinMat, customHairMat, charId);

    // 5. Professional Outfits & Character Styling
    if (charId === 'doctor') {
      // ===== 医生 (Emily - 正常优雅干练医生形象) =====
      // (1) 优雅波浪长发与职业盘发
      const hairBase = sphere(0.37, 14, customHairMat, headG, 0, 0.12, -0.06);
      hairBase.scale.set(1.02, 1, 1.05);

      // 自然垂于双肩的温柔发丝
      for (const side of [-1, 1]) {
        const strand = cyl(0.05, 0.035, 0.42, 8, customHairMat, headG, side * 0.28, -0.16, 0.14);
        strand.rotation.z = -side * 0.15;
      }
      // 优雅职业盘发髻
      const chignon = sphere(0.18, 10, customHairMat, headG, 0, 0.06, -0.38);
      chignon.scale.set(1.1, 1, 0.85);

      // (2) 真实质感的专业医用听诊器 (Realistic Medical Stethoscope)
      const stethMat = new T.MeshStandardMaterial({ color: 0x1f2933, roughness: 0.5 });
      const chromeMat = new T.MeshStandardMaterial({ color: 0xe5e7eb, metalness: 0.95, roughness: 0.15 });

      // 挂在脖颈上的 U 型听诊管
      for (const side of [-1, 1]) {
        const earTube = cyl(0.018, 0.018, 0.32, 8, stethMat, torso, side * 0.16, 0.46, 0.12);
        earTube.rotation.z = side * 0.4;
      }
      // 垂在胸前的黑色导音管与金属听头 (Chest Piece)
      const stethHose = cyl(0.018, 0.018, 0.45, 8, stethMat, torso, 0, 0.28, 0.21);
      const chestPiece = cyl(0.06, 0.06, 0.03, 12, chromeMat, torso, 0, 0.06, 0.22);
      chestPiece.rotation.x = Math.PI / 2;

      // (3) 护士帽 / 医用制服标志
      const capMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
      const nurseCap = cyl(0.24, 0.28, 0.12, 12, capMat, headG, 0, 0.42, 0.02);
      // 蓝色十字标志
      const crossMat = new T.MeshStandardMaterial({ color: 0x1a5276, roughness: 0.5 });
      cube(0.08, 0.03, 0.015, crossMat, nurseCap, 0, 0.02, 0.24);
      cube(0.03, 0.08, 0.015, crossMat, nurseCap, 0, 0.02, 0.24);

      // (4) 左侧腰间悬挂的专业牛皮急救巡诊箱
      const bagMat = new T.MeshStandardMaterial({ color: 0x4a2e1d, roughness: 0.7 });
      const medBag = cube(0.26, 0.22, 0.14, bagMat, torso, -0.36, -0.28, 0.08);
      cube(0.06, 0.05, 0.15, metalMat, medBag, 0, 0.04, 0); // 金属搭扣
      // 箱身医疗红十字
      const redMat = new T.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6 });
      cube(0.1, 0.03, 0.01, redMat, medBag, 0, -0.02, 0.075);
      cube(0.03, 0.1, 0.01, redMat, medBag, 0, -0.02, 0.075);

    } else if (charId === 'mercenary') {
      // 佣兵：帅气战术连帽风衣，露出正常轮廓分明的人类青年五官
      const hoodMat = new T.MeshStandardMaterial({ color: mainColor, roughness: 0.8 });
      const hood = cyl(0.42, 0.46, 0.58, 12, hoodMat, headG, 0, 0.1, -0.04);
      hood.scale.set(1.02, 1, 1.12);
      cube(0.3, 0.1, 0.14, customHairMat, headG, 0, 0.24, 0.3);
      // 军用战术护腕
      cube(0.24, 0.26, 0.24, leatherMat, armL, -0.02, -0.82, 0);
      cube(0.24, 0.26, 0.24, leatherMat, armR, 0.02, -0.82, 0);

    } else if (charId === 'seer') {
      // 先知：优雅长袍兜帽 + 神秘皮质眼罩，肩头站立猫头鹰
      const hood = cyl(0.42, 0.45, 0.64, 12, mainMat, headG, 0, 0.12, -0.04);
      hood.scale.set(1.02, 1, 1.12);
      cube(0.7, 0.12, 0.62, leatherMat, headG, 0, 0.05, 0.04);
      // 写实信使猫头鹰
      const owlG = new T.Group();
      owlG.position.set(-0.44, 0.48, 0);
      torso.add(owlG);
      sphere(0.12, 8, new T.MeshStandardMaterial({ color: 0x4a5d6e }), owlG, 0, 0, 0);
      cyl(0.04, 0.01, 0.1, 6, new T.MeshStandardMaterial({ color: 0xc49b39 }), owlG, 0, 0, 0.12).rotation.x = Math.PI / 2;

    } else if (charId === 'perfumer') {
      // 调香师：贵族淑女礼帽 + 水晶香水喷雾瓶
      sphere(0.38, 12, customHairMat, headG, 0, 0.18, -0.06);
      cyl(0.62, 0.62, 0.04, 18, accentMat, headG, 0, 0.34, 0);
      cyl(0.3, 0.36, 0.2, 14, mainMat, headG, 0, 0.44, 0);
      // 复古水晶喷雾瓶
      const flaskMat = new T.MeshStandardMaterial({ color: 0xd98bc2, transparent: true, opacity: 0.8, roughness: 0.1 });
      const flask = cyl(0.06, 0.08, 0.2, 10, flaskMat, armR, 0.02, -1.3, 0.08);
      sphere(0.06, 8, new T.MeshStandardMaterial({ color: 0x401633 }), flask, 0, 0.12, 0);

    } else if (charId === 'forward') {
      // 前锋：复古皮质运动头盔 + 橄榄球
      const helmet = sphere(0.4, 12, accentMat, headG, 0, 0.08, 0);
      helmet.scale.set(1.02, 0.98, 1.04);
      const ball = sphere(0.16, 10, leatherMat, armL, -0.04, -0.42, 0);
      ball.scale.set(1.5, 0.95, 0.95);

    } else if (charId === 'coordinator') {
      // 空军：军制大檐帽 + 枪套
      sphere(0.37, 12, customHairMat, headG, 0, 0.14, -0.05);
      const cap = cyl(0.4, 0.36, 0.18, 14, mainMat, headG, 0, 0.36, 0.04);
      cube(0.36, 0.04, 0.26, darkShoeMat, cap, 0, -0.05, 0.18);
      cube(0.12, 0.26, 0.14, leatherMat, torso, -0.36, -0.34, 0);

    } else {
      // 现代/自然层次感发型
      sphere(0.38, 12, customHairMat, headG, 0, 0.18, -0.05);
      cube(0.24, 0.14, 0.16, customHairMat, headG, -0.12, 0.22, 0.24);
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
      headG.position.set(0, 2.36, 0.12);
      headG.rotation.set(0.25 + Math.sin(time * 6) * 0.1, 0, Math.sin(time * 6) * 0.12);

      legL.position.set(-0.19, 0.88, 0);
      legR.position.set(0.19, 0.88, 0);
      legL.rotation.set(0.45 + Math.sin(time * 9) * 0.85, 0, -0.15);
      legR.rotation.set(0.45 - Math.sin(time * 9) * 0.85, 0, 0.15);

      armL.position.set(-0.42, 1.74, 0);
      armR.position.set(0.42, 1.74, 0);
      armL.rotation.set(-1.1 + Math.sin(time * 7) * 0.4, 0.3, -0.4);
      armR.rotation.set(-1.1 - Math.cos(time * 7) * 0.4, -0.3, 0.4);
      return;
    }

    if (seated) {
      // Seated on Rocket Chair (绑椅状态 - 身体受缚微动、双手反剪身后、双腿垂放)
      torso.position.set(0, 1.25, 0.05);
      torso.rotation.set(-0.12, 0, Math.sin(time * 3) * 0.03);
      headG.position.set(0, 2.15, 0.08);
      headG.rotation.set(0.15, 0, Math.sin(time * 3) * 0.05);

      legL.position.set(-0.19, 0.72, 0.35);
      legR.position.set(0.19, 0.72, 0.35);
      legL.rotation.set(-1.52, 0, -0.05 + Math.sin(time * 4) * 0.08);
      legR.rotation.set(-1.52, 0, 0.05 - Math.sin(time * 4) * 0.08);

      armL.position.set(-0.38, 1.35, -0.22);
      armR.position.set(0.38, 1.35, -0.22);
      armL.rotation.set(0.85, 0, 0.4);
      armR.rotation.set(0.85, 0, -0.4);
      return;
    }

    if (vault) {
      const t = vault.elapsed / vault.duration;
      torso.position.set(0, 1.48, 0);
      torso.rotation.set(-0.4, 0, 0);
      headG.position.set(0, 2.36, 0);
      headG.rotation.set(-0.2, 0, 0);
      armL.position.set(-0.42, 1.74, 0);
      armR.position.set(0.42, 1.74, 0);
      armL.rotation.set(-1.2, 0, -0.3);
      armR.rotation.set(-1.2, 0, 0.3);
      legL.position.set(-0.19, 0.88, 0);
      legR.position.set(0.19, 0.88, 0);
      legL.rotation.set(-1.4 * Math.sin(t * Math.PI), 0, 0);
      legR.rotation.set(0.8 * Math.sin(t * Math.PI), 0, 0);
      return;
    }

    if (health <= 0) {
      // Downed (倒地爬行 - 趴伏地面、双手护头、屈膝爬行)
      torso.position.set(0, 0.85 + (moving ? Math.sin(time * 5) * 0.04 : 0), 0);
      torso.rotation.set(0.65, 0, moving ? Math.sin(time * 5) * 0.12 : 0);
      headG.position.set(0, 1.35, 0.45);
      headG.rotation.set(0.55, 0, 0);

      legL.position.set(-0.19, 0.32, -0.15);
      legR.position.set(0.19, 0.32, -0.15);
      legL.rotation.set(-1.45 + (moving ? Math.sin(time * 5) * 0.25 : 0), 0, 0);
      legR.rotation.set(-1.45 - (moving ? Math.sin(time * 5) * 0.25 : 0), 0, 0);

      armL.position.set(-0.28, 1.55, 0.35);
      armR.position.set(0.28, 1.55, 0.35);
      armL.rotation.set(-1.85, 0.45, 0.7 + (moving ? Math.sin(time * 5) * 0.08 : 0));
      armR.rotation.set(-1.85, -0.45, -0.7 - (moving ? Math.sin(time * 5) * 0.08 : 0));
      return;
    }

    if (health === 1) {
      // Injured (受伤踉跄 - 左手捂腹、身躯前倾蹒跚)
      torso.position.set(0, 1.48, 0);
      torso.rotation.set(0.25, 0, moving ? Math.sin(time * 6.5) * 0.18 : 0.08);
      headG.position.set(0, 2.36, 0);
      headG.rotation.set(0.18, 0, moving ? Math.sin(time * 6.5) * 0.1 : 0);

      armL.position.set(-0.28, 1.42, 0.2);
      armL.rotation.set(-0.85, 0.4, 0.55);

      armR.position.set(0.42, 1.74, 0);
      armR.rotation.set(moving ? Math.sin(time * 6.5) * 0.45 : 0.1, 0, 0.2);

      legL.position.set(-0.19, 0.88, 0);
      legR.position.set(0.19, 0.88, 0);
      const limpPhase = time * 6.5;
      legL.rotation.set(moving ? Math.sin(limpPhase) * 0.65 : 0, 0, 0);
      legR.rotation.set(moving ? Math.sin(limpPhase + 0.6) * 0.35 : 0, 0, 0);
      return;
    }

    // Healthy (health >= 2) - Natural graceful bipedal walking & running gait
    torso.position.set(0, 1.48, 0);
    torso.rotation.set(0, 0, 0);
    headG.position.set(0, 2.36, 0);
    headG.rotation.set(0, 0, 0);

    armL.position.set(-0.42, 1.74, 0);
    armR.position.set(0.42, 1.74, 0);
    legL.position.set(-0.19, 0.88, 0);
    legR.position.set(0.19, 0.88, 0);

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
