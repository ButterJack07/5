// Q-Version Ragdoll (Chibi Doll) Survivor 3D Modeling Module for Fogbound
// Inspired by Identity V's signature gothic ragdoll aesthetics:
// Round plush heads, iconic cross-stitched button eyes, cute proportions, and detailed character accessories.

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

  // Cute plush chibi ragdoll head with signature cross-stitched button eyes
  function buildChibiHead(root, skinMat, hairMat, charId) {
    const headG = new T.Group();
    headG.position.set(0, 1.95, 0);
    root.add(headG);

    // 1. Chubby plush doll cranium (big round head with baby-fat cheeks)
    const cranium = sphere(0.48, 16, skinMat, headG, 0, 0, 0);
    cranium.scale.set(1.08, 0.98, 1.02);

    // Cute chubby cheeks
    for (const side of [-1, 1]) {
      const cheek = sphere(0.18, 10, skinMat, headG, side * 0.32, -0.12, 0.22);
      cheek.scale.set(1.1, 0.9, 0.85);

      // Rosy blush on cheeks
      const blushMat = new T.MeshStandardMaterial({ color: 0xeb9194, roughness: 0.85 });
      const blush = cyl(0.09, 0.09, 0.02, 10, blushMat, headG, side * 0.32, -0.11, 0.37);
      blush.rotation.x = Math.PI / 2;
      blush.rotation.z = side * 0.15;
    }

    // 2. Iconic Identity V Ragdoll Button Eyes with Cross Stitches
    const buttonRimMat = new T.MeshStandardMaterial({ color: 0x18181a, roughness: 0.35, metalness: 0.1 });
    const buttonCoreMat = new T.MeshStandardMaterial({ color: 0x242428, roughness: 0.45 });
    const stitchMat = new T.MeshStandardMaterial({ color: 0xe6d4b8, roughness: 0.8 }); // warm cotton yarn thread

    for (const side of [-1, 1]) {
      const eyeX = side * 0.22;
      const eyeY = 0.02;
      const eyeZ = 0.44;

      const eyeG = new T.Group();
      eyeG.position.set(eyeX, eyeY, eyeZ);
      headG.add(eyeG);

      // Button outer rim and inner disk
      const rim = cyl(0.145, 0.145, 0.04, 16, buttonRimMat, eyeG, 0, 0, 0);
      rim.rotation.x = Math.PI / 2;
      const core = cyl(0.11, 0.11, 0.046, 14, buttonCoreMat, eyeG, 0, 0, 0.005);
      core.rotation.x = Math.PI / 2;

      // 4 small button holes
      const holeMat = new T.MeshBasicMaterial({ color: 0x0a0a0c });
      for (const hx of [-0.045, 0.045]) {
        for (const hy of [-0.045, 0.045]) {
          const hole = cyl(0.016, 0.016, 0.052, 8, holeMat, eyeG, hx, hy, 0.008);
          hole.rotation.x = Math.PI / 2;
        }
      }

      // Iconic Cross-Stitches (X thread) tying the button eye
      const st1 = cube(0.13, 0.025, 0.05, stitchMat, eyeG, 0, 0, 0.018);
      st1.rotation.z = Math.PI / 4;
      const st2 = cube(0.13, 0.025, 0.05, stitchMat, eyeG, 0, 0, 0.018);
      st2.rotation.z = -Math.PI / 4;

      // Cute doll eyebrows
      const browMat = new T.MeshStandardMaterial({ color: 0x3a291e, roughness: 0.9 });
      const brow = cube(0.13, 0.028, 0.035, browMat, headG, eyeX, eyeY + 0.19, eyeZ - 0.04);
      brow.rotation.z = -side * 0.15;
    }

    // Cute small doll nose (simple cloth button or subtle stitched seam)
    sphere(0.042, 8, skinMat, headG, 0, -0.07, 0.49);

    // Cute little doll mouth (subtle thread stitch)
    const mouthMat = new T.MeshStandardMaterial({ color: 0x54322d, roughness: 0.85 });
    cube(0.08, 0.018, 0.02, mouthMat, headG, 0, -0.19, 0.46);

    // Plush button ears
    for (const side of [-1, 1]) {
      const ear = cyl(0.1, 0.1, 0.04, 10, skinMat, headG, side * 0.52, -0.02, 0);
      ear.rotation.z = Math.PI / 2;
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

    // Materials - soft cotton, felt, doll fabrics
    const skinMat = new T.MeshStandardMaterial({ color: 0xf3dfcf, roughness: 0.78 }); // warm porcelain plush tone
    const leatherMat = new T.MeshStandardMaterial({ color: 0x4a2e1d, roughness: 0.75 });
    const darkShoeMat = new T.MeshStandardMaterial({ color: 0x222226, roughness: 0.65 });
    const whiteFabricMat = new T.MeshStandardMaterial({ color: 0xf5f6f8, roughness: 0.85 });
    const brassMat = new T.MeshStandardMaterial({ color: 0xd9b35b, metalness: 0.75, roughness: 0.35 });

    let mainColor = 0x4d6652;  // Mercenary trench green
    let accentColor = 0x2e4233;
    let hairColor = 0x38281d;

    if (charId === 'doctor') {
      mainColor = 0xf2f7f9;    // Pure nurse white
      accentColor = 0x2c5c78;  // Navy blue collar & trim
      hairColor = 0x4f3120;    // Warm chestnut brunette
    } else if (charId === 'seer') {
      mainColor = 0x283b4f;
      accentColor = 0x182433;
      hairColor = 0x1f1f22;
    } else if (charId === 'perfumer') {
      mainColor = 0x6e4a73;
      accentColor = 0x482d4d;
      hairColor = 0x2d1e2b;
    } else if (charId === 'prospector') {
      mainColor = 0x7a5233;
      accentColor = 0x453123;
      hairColor = 0x222222;
    } else if (charId === 'acrobat') {
      mainColor = 0xba851c;
      accentColor = 0x8a2d18;
      hairColor = 0xc46321;
    } else if (charId === 'forward') {
      mainColor = 0xa33224;
      accentColor = 0x242426;
      hairColor = 0x181818;
    } else if (charId === 'coordinator') {
      mainColor = 0x3e5269;
      accentColor = 0xc7a44f;
      hairColor = 0x4a3424;
    } else if (charId === 'priestess') {
      mainColor = 0x54376b;
      accentColor = 0x845ea1;
      hairColor = 0x2c1f33;
    }

    const mainMat = new T.MeshStandardMaterial({ color: mainColor, roughness: 0.8 });
    const accentMat = new T.MeshStandardMaterial({ color: accentColor, roughness: 0.8 });
    const hairMat = new T.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });

    // 1. Cute Chibi Torso (Short, slightly pear-shaped plush body)
    const torso = new T.Group();
    torso.position.set(0, 1.25, 0);
    group.add(torso);

    // Chubby torso body
    const bodyMesh = sphere(0.38, 14, mainMat, torso, 0, 0.05, 0);
    bodyMesh.scale.set(1.05, 1.15, 0.95);

    // Shirt collar / neck trim
    cube(0.26, 0.16, 0.32, (charId === 'doctor' ? accentMat : whiteFabricMat), torso, 0, 0.42, 0.02);

    // Cute buttons down front
    const buttonMat = new T.MeshStandardMaterial({ color: (charId === 'doctor' ? 0x2c5c78 : 0x252528), roughness: 0.5 });
    for (const by of [0.28, 0.12, -0.04]) {
      const b = cyl(0.035, 0.035, 0.02, 8, buttonMat, torso, 0, by, 0.38);
      b.rotation.x = Math.PI / 2;
    }

    // Leather belt with cute gold buckle
    cube(0.72, 0.09, 0.58, leatherMat, torso, 0, -0.22, 0);
    cube(0.12, 0.11, 0.6, brassMat, torso, 0, -0.22, 0);

    // Dress / Coat hem flared outwards (cute doll skirt silhouette)
    const skirtHem = cyl(0.36, 0.44, 0.32, 16, mainMat, torso, 0, -0.36, 0);
    skirtHem.scale.set(1.05, 1, 0.95);

    // 2. Cute Chibi Short Legs & Doll Shoes
    function buildChibiLeg(side) {
      const legRoot = new T.Group();
      legRoot.position.set(side * 0.18, 0.82, 0);
      group.add(legRoot);

      // Cute short chubby leg
      cyl(0.14, 0.12, 0.52, 10, accentMat, legRoot, 0, -0.24, 0);

      // Round little doll shoe with white socks rim
      cyl(0.13, 0.13, 0.08, 10, whiteFabricMat, legRoot, 0, -0.48, 0);
      const shoe = sphere(0.15, 10, darkShoeMat, legRoot, 0, -0.56, 0.05);
      shoe.scale.set(0.95, 0.8, 1.4); // cute rounded moccasin / mary jane doll shoe

      return legRoot;
    }

    const legL = buildChibiLeg(-1);
    const legR = buildChibiLeg(1);
    legs = [legL, legR];

    // 3. Cute Chibi Arms & Plush Mittens / Hands
    function buildChibiArm(side) {
      const armRoot = new T.Group();
      armRoot.position.set(side * 0.42, 1.48, 0);
      group.add(armRoot);

      // Round shoulder puff
      sphere(0.15, 10, mainMat, armRoot, 0, 0, 0);
      // Cute short arm
      cyl(0.11, 0.095, 0.48, 10, mainMat, armRoot, side * 0.02, -0.24, 0);
      // Sleeve cuff
      cube(0.2, 0.07, 0.2, (charId === 'doctor' ? accentMat : whiteFabricMat), armRoot, side * 0.02, -0.47, 0);

      // Round doll mitten / hand with cute stub thumb
      const hand = new T.Group();
      hand.position.set(side * 0.02, -0.58, 0);
      armRoot.add(hand);

      const palm = sphere(0.11, 10, skinMat, hand, 0, 0, 0);
      palm.scale.set(0.9, 1.1, 0.8);
      const thumb = sphere(0.055, 8, skinMat, hand, -side * 0.08, 0.02, 0.03);

      return armRoot;
    }

    armL = buildChibiArm(-1);
    armR = buildChibiArm(1);

    // 4. Head with signature features
    const headG = buildChibiHead(group, skinMat, hairMat, charId);

    // 5. High-Quality Character Specific Outfits & Signature Props
    if (charId === 'doctor') {
      // ===== 医生 (Emily Dyer) 特色设计 =====
      // (1) 经典优雅深棕色波浪卷发 + 甜美刘海 + 淑女发髻
      // 优雅刘海与后脑勺饱满发型
      const hairBase = sphere(0.51, 14, hairMat, headG, 0, 0.08, -0.06);
      hairBase.scale.set(1.08, 1, 1.05);

      // 两侧标志性的温柔内卷发束 (Curled side bangs)
      for (const side of [-1, 1]) {
        const sideCurl = cyl(0.08, 0.06, 0.36, 8, hairMat, headG, side * 0.45, -0.16, 0.18);
        sideCurl.rotation.z = -side * 0.25;
        sphere(0.07, 8, hairMat, headG, side * 0.49, -0.32, 0.18);
      }
      // 前额可爱分边刘海
      const frontBangs = cube(0.44, 0.14, 0.15, hairMat, headG, 0, 0.32, 0.42);
      frontBangs.rotation.x = -0.18;

      // 后脑优雅淑女发髻 (Chignon Bun)
      const bun = sphere(0.25, 12, hairMat, headG, 0, 0.06, -0.48);
      bun.scale.set(1.15, 1, 0.85);

      // (2) 标志性维多利亚式护士帽 (Nurse Cap)
      const capG = new T.Group();
      capG.position.set(0, 0.48, 0.04);
      headG.add(capG);

      const capMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
      const capBase = cyl(0.36, 0.42, 0.18, 14, capMat, capG, 0, 0, 0);
      capBase.scale.set(1.1, 1, 0.85);
      // 护士帽正面蓝色/青色十字徽章 (Medical Cross Emblem)
      const crossMat = new T.MeshStandardMaterial({ color: 0x22628b, roughness: 0.6 });
      cube(0.12, 0.045, 0.02, crossMat, capG, 0, 0.02, 0.36);
      cube(0.045, 0.12, 0.02, crossMat, capG, 0, 0.02, 0.36);

      // (3) 护士围裙与深蓝翻领缎带蝴蝶结 (Ribbon Bowtie)
      const bowMat = new T.MeshStandardMaterial({ color: 0x1f5478, roughness: 0.7 });
      const bowCenter = sphere(0.045, 8, bowMat, torso, 0, 0.36, 0.36);
      const bowL = cone(0.06, 0.11, 6, bowMat, torso, -0.07, 0.36, 0.35);
      bowL.rotation.z = Math.PI / 2;
      const bowR = cone(0.06, 0.11, 6, bowMat, torso, 0.07, 0.36, 0.35);
      bowR.rotation.z = -Math.PI / 2;

      // (4) 灵魂随身道具 1：复古古典大注射器 / 针筒 (Antique Syringe)
      // 医生最重要的治疗道具！背在身后或斜跨身侧
      const syringeG = new T.Group();
      syringeG.position.set(0.38, 0.08, -0.26);
      syringeG.rotation.set(-0.35, 0.2, 0.45);
      torso.add(syringeG);

      // 铜质推杆手柄 (Plunger)
      const needleMetal = new T.MeshStandardMaterial({ color: 0xc8b270, metalness: 0.8, roughness: 0.3 });
      torso.castShadow = true;
      cyl(0.07, 0.07, 0.03, 10, needleMetal, syringeG, 0, 0.35, 0); // thumb ring
      cyl(0.02, 0.02, 0.22, 8, needleMetal, syringeG, 0, 0.22, 0);  // rod
      // 玻璃药液管 (Glass Barrel with emerald healing medicine)
      const glassMat = new T.MeshStandardMaterial({ color: 0x82e2c8, transparent: true, opacity: 0.75, roughness: 0.15 });
      cyl(0.068, 0.068, 0.34, 12, glassMat, syringeG, 0, 0.02, 0);
      // 金属固定环与刻度箍
      cyl(0.074, 0.074, 0.04, 10, needleMetal, syringeG, 0, 0.18, 0);
      cyl(0.074, 0.074, 0.04, 10, needleMetal, syringeG, 0, -0.15, 0);
      // 金属针尖 (Needle Tip)
      cyl(0.012, 0.012, 0.22, 6, new T.MeshStandardMaterial({ color: 0xd6d9db, metalness: 0.9, roughness: 0.2 }), syringeG, 0, -0.27, 0);

      // (5) 随身道具 2：复古牛皮急救医药箱 (Vintage First-Aid Kit)
      // 佩戴在左侧腰间
      const medKitG = new T.Group();
      medKitG.position.set(-0.36, -0.24, 0.08);
      medKitG.rotation.y = 0.2;
      torso.add(medKitG);

      // 棕色皮革箱体
      const bagMat = new T.MeshStandardMaterial({ color: 0x5a3922, roughness: 0.75 });
      cube(0.24, 0.22, 0.14, bagMat, medKitG, 0, 0, 0);
      // 金属铜扣
      cube(0.06, 0.06, 0.15, brassMat, medKitG, 0, 0.04, 0);
      // 箱面经典红十字急救标志
      const redCrossMat = new T.MeshStandardMaterial({ color: 0xc42018, roughness: 0.7 });
      cube(0.11, 0.032, 0.01, redCrossMat, medKitG, 0, -0.01, 0.075);
      cube(0.032, 0.11, 0.01, redCrossMat, medKitG, 0, -0.01, 0.075);
      // 肩带/背带
      cube(0.04, 0.65, 0.02, leatherMat, torso, -0.15, 0.05, 0.28).rotation.z = -0.55;

    } else if (charId === 'mercenary') {
      // 佣兵特色：战术兜帽 + 额前发丝 + 护腕
      const hoodMat = new T.MeshStandardMaterial({ color: mainColor, roughness: 0.85 });
      const hood = sphere(0.55, 14, hoodMat, headG, 0, 0.08, -0.04);
      hood.scale.set(1.08, 1, 1.15);
      cube(0.38, 0.14, 0.15, hairMat, headG, 0, 0.25, 0.38);
      // 护腕
      cube(0.24, 0.22, 0.24, leatherMat, armL, -0.02, -0.32, 0);
      cube(0.24, 0.22, 0.24, leatherMat, armR, 0.02, -0.32, 0);

    } else if (charId === 'seer') {
      // 先知特色：神秘兜帽 + 复古皮眼罩 + 肩头站立的圆滚滚小猫头鹰
      const hood = sphere(0.55, 14, mainMat, headG, 0, 0.08, -0.04);
      hood.scale.set(1.08, 1, 1.15);
      // 皮质眼罩
      cube(0.85, 0.15, 0.65, leatherMat, headG, 0, 0.02, 0.15);
      // 圆滚滚的 Q 版小猫头鹰 (Chibi Owl)
      const owlG = new T.Group();
      owlG.position.set(-0.46, 0.44, 0);
      torso.add(owlG);
      sphere(0.14, 10, new T.MeshStandardMaterial({ color: 0x4a5d6e }), owlG, 0, 0, 0);
      cone(0.05, 0.1, 5, brassMat, owlG, 0, 0, 0.14).rotation.x = Math.PI / 2;
      // 猫头鹰纽扣眼
      for (const os of [-1, 1]) {
        sphere(0.038, 6, new T.MeshBasicMaterial({ color: 0x111111 }), owlG, os * 0.06, 0.04, 0.12);
      }

    } else if (charId === 'perfumer') {
      // 调香师特色：复古贵族发髻 + 宽檐淑女帽 + 复古香水喷雾瓶
      sphere(0.5, 12, hairMat, headG, 0, 0.12, -0.08);
      // 宽檐帽
      cyl(0.72, 0.72, 0.06, 18, accentMat, headG, 0, 0.36, 0);
      cyl(0.36, 0.42, 0.22, 14, mainMat, headG, 0, 0.48, 0);
      // 复古香水瓶
      const flaskMat = new T.MeshStandardMaterial({ color: 0xda92c6, transparent: true, opacity: 0.8 });
      const flask = cyl(0.08, 0.1, 0.24, 10, flaskMat, armR, 0.02, -0.72, 0.08);
      sphere(0.07, 8, new T.MeshStandardMaterial({ color: 0x5a1848 }), flask, 0, 0.16, 0);

    } else if (charId === 'forward') {
      // 前锋：复古皮质橄榄球头盔 + 抱在怀里的橄榄球
      const helmet = sphere(0.52, 12, accentMat, headG, 0, 0.08, 0);
      helmet.scale.set(1.06, 1, 1.08);
      const ball = sphere(0.18, 10, leatherMat, armL, -0.05, -0.32, 0);
      ball.scale.set(1.4, 0.9, 0.9);

    } else if (charId === 'coordinator') {
      // 空军：军制大檐帽
      sphere(0.48, 12, hairMat, headG, 0, 0.1, -0.06);
      const cap = cyl(0.46, 0.42, 0.18, 14, mainMat, headG, 0, 0.38, 0.04);
      cube(0.42, 0.04, 0.28, darkShoeMat, cap, 0, -0.06, 0.22);

    } else {
      // 通用可爱发型
      sphere(0.5, 12, hairMat, headG, 0, 0.14, -0.06);
      cube(0.32, 0.14, 0.15, hairMat, headG, -0.1, 0.28, 0.38);
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
      // Carried on Balloons (牵气球状态 - 悬吊半空挣扎乱蹬)
      torso.position.set(0, 1.25, 0);
      torso.rotation.set(-0.35 + Math.sin(time * 6) * 0.12, 0, Math.cos(time * 6) * 0.15);
      headG.position.set(0, 1.95, 0.1);
      headG.rotation.set(0.25 + Math.sin(time * 6) * 0.1, 0, Math.sin(time * 6) * 0.12);

      legL.position.set(-0.18, 0.82, 0);
      legR.position.set(0.18, 0.82, 0);
      legL.rotation.set(0.45 + Math.sin(time * 9) * 0.85, 0, -0.15);
      legR.rotation.set(0.45 - Math.sin(time * 9) * 0.85, 0, 0.15);

      armL.position.set(-0.42, 1.48, 0);
      armR.position.set(0.42, 1.48, 0);
      armL.rotation.set(-1.1 + Math.sin(time * 7) * 0.4, 0.3, -0.4);
      armR.rotation.set(-1.1 - Math.cos(time * 7) * 0.4, -0.3, 0.4);
      return;
    }

    if (seated) {
      // Seated on Rocket Chair (狂欢之椅上绑住 - 双腿平放、双手在后)
      torso.position.set(0, 1.08, 0.05);
      torso.rotation.set(-0.12, 0, Math.sin(time * 3) * 0.03);
      headG.position.set(0, 1.78, 0.08);
      headG.rotation.set(0.15, 0, Math.sin(time * 3) * 0.05);

      legL.position.set(-0.18, 0.7, 0.28);
      legR.position.set(0.18, 0.7, 0.28);
      legL.rotation.set(-1.52, 0, -0.05 + Math.sin(time * 4) * 0.08);
      legR.rotation.set(-1.52, 0, 0.05 - Math.sin(time * 4) * 0.08);

      armL.position.set(-0.38, 1.25, -0.2);
      armR.position.set(0.38, 1.25, -0.2);
      armL.rotation.set(0.85, 0, 0.4);
      armR.rotation.set(0.85, 0, -0.4);
      return;
    }

    if (vault) {
      const t = vault.elapsed / vault.duration;
      torso.position.set(0, 1.25, 0);
      torso.rotation.set(-0.4, 0, 0);
      headG.position.set(0, 1.95, 0);
      headG.rotation.set(-0.2, 0, 0);
      armL.position.set(-0.42, 1.48, 0);
      armR.position.set(0.42, 1.48, 0);
      armL.rotation.set(-1.2, 0, -0.3);
      armR.rotation.set(-1.2, 0, 0.3);
      legL.position.set(-0.18, 0.82, 0);
      legR.position.set(0.18, 0.82, 0);
      legL.rotation.set(-1.4 * Math.sin(t * Math.PI), 0, 0);
      legR.rotation.set(0.8 * Math.sin(t * Math.PI), 0, 0);
      return;
    }

    if (health <= 0) {
      // Downed: crouched on ground holding head (倒地抱头趴爬)
      torso.position.set(0, 0.72 + (moving ? Math.sin(time * 5) * 0.04 : 0), 0);
      torso.rotation.set(0.65, 0, moving ? Math.sin(time * 5) * 0.12 : 0);
      headG.position.set(0, 1.15, 0.38);
      headG.rotation.set(0.55, 0, 0);

      legL.position.set(-0.18, 0.3, -0.12);
      legR.position.set(0.18, 0.3, -0.12);
      legL.rotation.set(-1.45 + (moving ? Math.sin(time * 5) * 0.25 : 0), 0, 0);
      legR.rotation.set(-1.45 - (moving ? Math.sin(time * 5) * 0.25 : 0), 0, 0);

      armL.position.set(-0.28, 1.35, 0.28);
      armR.position.set(0.28, 1.35, 0.28);
      armL.rotation.set(-1.85, 0.45, 0.7 + (moving ? Math.sin(time * 5) * 0.08 : 0));
      armR.rotation.set(-1.85, -0.45, -0.7 - (moving ? Math.sin(time * 5) * 0.08 : 0));
      return;
    }

    if (health === 1) {
      // Injured: clutching wounded abdomen with limping/stumbling gait (受伤捂肚蹒跚)
      torso.position.set(0, 1.25, 0);
      torso.rotation.set(0.22, 0, moving ? Math.sin(time * 6.5) * 0.16 : 0.06);
      headG.position.set(0, 1.95, 0);
      headG.rotation.set(0.16, 0, moving ? Math.sin(time * 6.5) * 0.08 : 0);

      armL.position.set(-0.28, 1.22, 0.18);
      armL.rotation.set(-0.85, 0.4, 0.55);

      armR.position.set(0.42, 1.48, 0);
      armR.rotation.set(moving ? Math.sin(time * 6.5) * 0.45 : 0.1, 0, 0.2);

      legL.position.set(-0.18, 0.82, 0);
      legR.position.set(0.18, 0.82, 0);
      const limpPhase = time * 6.5;
      legL.rotation.set(moving ? Math.sin(limpPhase) * 0.65 : 0, 0, 0);
      legR.rotation.set(moving ? Math.sin(limpPhase + 0.6) * 0.35 : 0, 0, 0);
      return;
    }

    // Healthy (health >= 2) - Cute bobbing walk
    torso.position.set(0, 1.25 + (moving ? Math.abs(Math.sin(time * 12)) * 0.04 : 0), 0);
    torso.rotation.set(0, 0, moving ? Math.sin(time * 10) * 0.04 : 0);
    headG.position.set(0, 1.95, 0);
    headG.rotation.set(0, 0, moving ? Math.sin(time * 10) * 0.05 : 0);

    armL.position.set(-0.42, 1.48, 0);
    armR.position.set(0.42, 1.48, 0);
    legL.position.set(-0.18, 0.82, 0);
    legR.position.set(0.18, 0.82, 0);

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
