// Chibi Nendoroid (Japanese Clay Figurine) Survivor 3D Modeling Module for Fogbound
// Scheme A: 2.2-head-tall chubby doll proportions, watery anime highlight eyes, rosy blush,
// soft bob/curled hair, and signature cute character outfits and accessories.

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

  // Cute Nendoroid Head: 2.2 head-ratio round head, chubby cheeks, watery anime highlight eyes, blush & smile
  function buildNendoroidHead(root, skinMat, hairMat, charId) {
    const headG = new T.Group();
    headG.position.set(0, 1.55, 0);
    root.add(headG);

    // 1. Chubby Cranium & Round Cheeks
    const cranium = sphere(0.46, 16, skinMat, headG, 0, 0, 0);
    cranium.scale.set(1.08, 0.96, 1.04);

    // Cute baby-fat cheeks
    for (const side of [-1, 1]) {
      const cheek = sphere(0.18, 12, skinMat, headG, side * 0.31, -0.11, 0.18);
      cheek.scale.set(1.1, 0.9, 0.85);

      // Sweet Rosy Peach Blush (水蜜桃粉嫩腮红)
      const blushMat = new T.MeshStandardMaterial({ color: 0xff99aa, roughness: 0.85 });
      const blush = cyl(0.095, 0.095, 0.02, 10, blushMat, headG, side * 0.28, -0.11, 0.38);
      blush.rotation.x = Math.PI / 2;
      blush.rotation.z = side * 0.18;
    }

    // 2. Watery Anime Highlight Eyes (水灵动漫大眼与星芒高光)
    let irisColor = 0x224a73; // Doctor deep navy-blue
    if (charId === 'mercenary') irisColor = 0x28593a; // Forest emerald green
    else if (charId === 'seer') irisColor = 0x1f3c63;     // Celestial midnight blue
    else if (charId === 'perfumer') irisColor = 0x613670; // Amethyst violet
    else if (charId === 'prospector') irisColor = 0x6e4526;// Amber brown

    const scleraMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const irisMat = new T.MeshStandardMaterial({ color: irisColor, roughness: 0.2 });
    const pupilMat = new T.MeshBasicMaterial({ color: 0x080c12 });
    const sparkMat = new T.MeshBasicMaterial({ color: 0xffffff });
    const lashMat = new T.MeshStandardMaterial({ color: 0x221815, roughness: 0.8 });

    for (const side of [-1, 1]) {
      // Seer wears eye patch over his eyes, so skip left/right eye geometry if desired, but we keep stylized look
      if (charId === 'seer' && side === -1) continue; // Eye patch covers one side

      const eyeG = new T.Group();
      eyeG.position.set(side * 0.19, 0.02, 0.44);
      headG.add(eyeG);

      // White Sclera Disc
      const sclera = cyl(0.12, 0.12, 0.02, 14, scleraMat, eyeG, 0, 0, 0);
      sclera.rotation.x = Math.PI / 2;

      // Large anime iris oval
      const iris = cyl(0.095, 0.095, 0.025, 12, irisMat, eyeG, 0, -0.01, 0.005);
      iris.rotation.x = Math.PI / 2;
      iris.scale.set(0.9, 1.15, 1);

      // Deep dark pupil
      const pupil = cyl(0.045, 0.045, 0.03, 10, pupilMat, eyeG, 0, 0, 0.008);
      pupil.rotation.x = Math.PI / 2;

      // Big Bright Star Sparkle Highlight (圆润大高光)
      const sparkle1 = sphere(0.034, 8, sparkMat, eyeG, -0.03, 0.035, 0.018);
      sparkle1.scale.set(1.1, 1.3, 0.5);

      // Small secondary twinkle (第二灵动小高光)
      const sparkle2 = sphere(0.018, 6, sparkMat, eyeG, 0.035, -0.035, 0.018);
      sparkle2.scale.set(1, 1, 0.5);

      // Upper soft anime curved eyelash lid (柔和双眼皮微翘眼睫线)
      const lash = cube(0.19, 0.032, 0.03, lashMat, eyeG, 0, 0.1, 0.015);
      lash.rotation.z = -side * 0.12;

      // Cute tiny anime eyebrow
      const brow = cube(0.12, 0.024, 0.025, lashMat, headG, side * 0.19, 0.19, 0.4);
      brow.rotation.z = -side * 0.14;
    }

    // Tiny cute nose button
    sphere(0.032, 8, skinMat, headG, 0, -0.08, 0.48);

    // Cute smiling chibi mouth (微笑萌唇)
    const mouthMat = new T.MeshStandardMaterial({ color: 0x8a3845, roughness: 0.6 });
    const mouth = sphere(0.042, 8, mouthMat, headG, 0, -0.18, 0.45);
    mouth.scale.set(1.1, 0.45, 0.4);

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

    // Palette & High quality smooth Nendoroid materials
    const skinMat = new T.MeshStandardMaterial({ color: 0xffefe4, roughness: 0.62 });
    const whiteMat = new T.MeshStandardMaterial({ color: 0xfbfdff, roughness: 0.55 });
    const darkShoeMat = new T.MeshStandardMaterial({ color: 0x2b1e1e, roughness: 0.4 });
    const goldMat = new T.MeshStandardMaterial({ color: 0xebb34b, metalness: 0.75, roughness: 0.3 });
    const leatherMat = new T.MeshStandardMaterial({ color: 0x4a2e1d, roughness: 0.7 });

    let dressColor = 0xf8fbff;
    let accentColor = 0x244b6e;
    let hairColor = 0x42281a;

    if (charId === 'doctor') {
      dressColor = 0xf8fbff;  // 纯白护士裙
      accentColor = 0x22496a; // 海军蓝领结与包边
      hairColor = 0x462b1b;   // 焦糖栗棕色
    } else if (charId === 'mercenary') {
      dressColor = 0x3d5c43;  // 墨绿色战术小风衣
      accentColor = 0x233827; // 深橄榄绿
      hairColor = 0x2c221c;   // 帅气深褐发
    } else if (charId === 'seer') {
      dressColor = 0x263d59;  // 深海星空蓝法袍
      accentColor = 0x162538;
      hairColor = 0x1a1a20;   // 乌黑发
    } else if (charId === 'perfumer') {
      dressColor = 0x6c4973;  // 优雅紫罗兰礼裙
      accentColor = 0x44274c;
      hairColor = 0x2d1a2b;   // 暗紫黑长发
    } else if (charId === 'prospector') {
      dressColor = 0x7a5233;  // 暖棕工装连体背带裤
      accentColor = 0xf5b03b; // 亮黄T恤与安全帽
      hairColor = 0x262322;   // 黑色微卷发
    } else if (charId === 'acrobat') {
      dressColor = 0xb88223;
      accentColor = 0x8a2d18;
      hairColor = 0xc46321;
    } else if (charId === 'forward') {
      dressColor = 0xa33224;
      accentColor = 0x242426;
      hairColor = 0x181818;
    } else if (charId === 'coordinator') {
      dressColor = 0x3e5269;
      accentColor = 0xc7a44f;
      hairColor = 0x4a3424;
    }

    const mainDressMat = new T.MeshStandardMaterial({ color: dressColor, roughness: 0.6 });
    const accentMat = new T.MeshStandardMaterial({ color: accentColor, roughness: 0.6 });
    const hairMat = new T.MeshStandardMaterial({ color: hairColor, roughness: 0.82 });

    // 1. Chibi Nendoroid Torso (短小微胖圆润小身段)
    const torso = new T.Group();
    torso.position.set(0, 0.98, 0);
    group.add(torso);

    // Chubby torso body
    const bodyMesh = sphere(0.28, 14, mainDressMat, torso, 0, 0.12, 0);
    bodyMesh.scale.set(1.05, 1.15, 0.95);

    // Little cute collar & neckline
    cyl(0.22, 0.3, 0.1, 14, accentMat, torso, 0, 0.34, 0);

    // Flared Cute Skirt / Coat Hem (圆润蓬蓬裙摆 / 下摆)
    const skirtHem = cyl(0.26, 0.42, 0.32, 16, mainDressMat, torso, 0, -0.22, 0);
    skirtHem.scale.set(1.05, 1, 0.95);

    // 2. Chibi Short Legs & Cute Rounded Shoes (软萌小短腿与圆头鞋)
    function buildChibiLeg(side) {
      const legRoot = new T.Group();
      legRoot.position.set(side * 0.16, 0.64, 0);
      group.add(legRoot);

      // Short chubby legs (white stockings/socks)
      const sockMat = (charId === 'mercenary' || charId === 'prospector') ? accentMat : whiteMat;
      cyl(0.095, 0.09, 0.36, 12, sockMat, legRoot, 0, -0.16, 0);

      // Cute Rounded Moccasin / Mary-Jane Shoe (圆头小皮鞋)
      const shoeColor = (charId === 'mercenary' || charId === 'prospector') ? 0x3d281a : 0x2b1e1e;
      const shoe = sphere(0.11, 10, new T.MeshStandardMaterial({ color: shoeColor, roughness: 0.45 }), legRoot, 0, -0.38, 0.04);
      shoe.scale.set(1, 0.85, 1.35);

      return legRoot;
    }
    const legL = buildChibiLeg(-1);
    const legR = buildChibiLeg(1);
    legs = [legL, legR];

    // 3. Cute Chubby Arms & Mitten Hands (圆滚滚小手)
    function buildChibiArm(side) {
      const armRoot = new T.Group();
      armRoot.position.set(side * 0.32, 1.15, 0);
      group.add(armRoot);

      // Cute puff shoulder (泡泡袖)
      sphere(0.12, 10, mainDressMat, armRoot, 0, 0, 0);
      // Arm sleeve
      cyl(0.08, 0.07, 0.34, 10, mainDressMat, armRoot, side * 0.02, -0.18, 0);

      // Round Chubby Mitten Hand (圆润小拳头手)
      const hand = new T.Group();
      hand.position.set(side * 0.02, -0.4, 0);
      armRoot.add(hand);

      const handMat = (charId === 'mercenary') ? leatherMat : skinMat;
      const palm = sphere(0.08, 10, handMat, hand, 0, 0, 0);
      palm.scale.set(1, 1.1, 0.9);

      // Cute stub thumb
      sphere(0.04, 8, handMat, hand, -side * 0.06, 0.02, 0.03);

      return armRoot;
    }
    armL = buildChibiArm(-1);
    armR = buildChibiArm(1);

    // 4. Head with Nendoroid Features
    const headG = buildNendoroidHead(group, skinMat, hairMat, charId);

    // 5. Special Styling & Accessories for 5 Core Characters (5 个特色角色的专属手办细节)
    if (charId === 'doctor') {
      // ===== 1. 医生 (Emily) =====
      // 焦糖深棕蓬松波波短发 + 柔顺内扣两鬓
      const hairBase = sphere(0.49, 14, hairMat, headG, 0, 0.08, -0.05);
      hairBase.scale.set(1.1, 1.05, 1.06);

      // 内扣小发束
      for (const side of [-1, 1]) {
        const curl = sphere(0.14, 10, hairMat, headG, side * 0.42, -0.14, 0.18);
        curl.scale.set(0.8, 2.2, 0.8);
        curl.rotation.z = side * 0.18;
      }
      // 前额柔和刘海
      sphere(0.18, 10, hairMat, headG, -0.18, 0.32, 0.38).rotation.z = -0.25;
      sphere(0.18, 10, hairMat, headG, 0.18, 0.32, 0.38).rotation.z = 0.25;
      sphere(0.14, 8, hairMat, headG, 0, 0.35, 0.42);
      // 脑后淑女小发髻
      sphere(0.22, 12, hairMat, headG, 0, 0.04, -0.46).scale.set(1.1, 1.0, 0.8);

      // 倾斜软萌护士帽
      const capG = new T.Group();
      capG.position.set(0, 0.48, 0.05);
      capG.rotation.set(-0.15, 0, 0.08);
      headG.add(capG);
      const capBase = cyl(0.32, 0.38, 0.16, 14, whiteMat, capG);
      capBase.scale.set(1.15, 1, 0.85);
      // 蓝色十字小徽章
      const crossG = new T.Group();
      crossG.position.set(0, 0.02, 0.33);
      capG.add(crossG);
      cyl(0.04, 0.04, 0.13, 8, accentMat, crossG);
      const crossH = cyl(0.04, 0.04, 0.13, 8, accentMat, crossG);
      crossH.rotation.z = Math.PI / 2;

      // 领口深蓝缎带蝴蝶结
      const bow = sphere(0.065, 8, accentMat, torso, 0, 0.28, 0.26);
      bow.scale.set(0.9, 0.8, 0.6);
      sphere(0.05, 8, accentMat, torso, -0.09, 0.28, 0.24).rotation.z = 0.4;
      sphere(0.05, 8, accentMat, torso, 0.09, 0.28, 0.24).rotation.z = -0.4;

      // 随身配件：粉白爱心手提急救小箱 (Mini Heart First-Aid Bag)
      const bagG = new T.Group();
      bagG.position.set(-0.35, -0.15, 0.12);
      torso.add(bagG);
      const bagMesh = cube(0.22, 0.18, 0.12, whiteMat, bagG);
      // 粉红爱心 / 红十字标
      const pinkHeart = sphere(0.045, 8, new T.MeshStandardMaterial({ color: 0xff6b8b }), bagG, 0, 0, 0.065);
      pinkHeart.scale.set(1, 1, 0.4);

    } else if (charId === 'mercenary') {
      // ===== 2. 佣兵 (Naib) =====
      // 帅气深褐碎发 + 战术兜帽披肩
      const hairBase = sphere(0.48, 14, hairMat, headG, 0, 0.08, -0.04);
      hairBase.scale.set(1.08, 1, 1.05);
      // 额前微翘帅气碎刘海
      sphere(0.18, 8, hairMat, headG, -0.15, 0.32, 0.38).rotation.z = -0.3;
      sphere(0.18, 8, hairMat, headG, 0.15, 0.32, 0.38).rotation.z = 0.2;
      sphere(0.14, 8, hairMat, headG, 0, 0.36, 0.42);

      // 连帽披肩小斗篷 (Chibi Tactical Hood Cape)
      const hoodG = new T.Group();
      hoodG.position.set(0, 0.32, -0.1);
      headG.add(hoodG);
      const hood = sphere(0.52, 14, accentMat, hoodG, 0, 0, 0);
      hood.scale.set(1.12, 1.05, 1.15);
      // 兜帽后垂挂的小毛球/披肩扣
      sphere(0.07, 8, goldMat, torso, 0, 0.32, 0.26);

      // 护腕与腰带
      cube(0.18, 0.12, 0.18, leatherMat, armL, -0.02, -0.28, 0);
      cube(0.18, 0.12, 0.18, leatherMat, armR, 0.02, -0.28, 0);
      cube(0.62, 0.08, 0.52, leatherMat, torso, 0, -0.08, 0);

    } else if (charId === 'seer') {
      // ===== 3. 先知 (Eli) =====
      // 深海蓝连帽长袍
      const hood = sphere(0.53, 14, mainDressMat, headG, 0, 0.06, -0.02);
      hood.scale.set(1.12, 1.08, 1.15);
      // 额前几缕柔和黑发
      sphere(0.16, 8, hairMat, headG, 0.14, 0.3, 0.4).rotation.z = 0.25;

      // 神秘皮质小眼罩 (Chibi Leather Blindfold with golden eye runes)
      const blindfold = cube(0.72, 0.16, 0.58, leatherMat, headG, 0, 0.02, 0.2);
      blindfold.rotation.y = 0.05;
      // 金色眼罩神纹
      cube(0.12, 0.05, 0.02, goldMat, headG, -0.19, 0.02, 0.48);

      // 随身萌宠：圆滚滚信使小猫头鹰 (Chibi Round Owl sitting on shoulder)
      const owlG = new T.Group();
      owlG.position.set(-0.38, 0.42, 0);
      owlG.rotation.y = 0.2;
      torso.add(owlG);
      // 胖乎乎小身体
      const owlBody = sphere(0.13, 10, new T.MeshStandardMaterial({ color: 0x4f6479, roughness: 0.7 }), owlG, 0, 0, 0);
      owlBody.scale.set(1, 1.1, 0.95);
      // 猫头鹰大圆眼
      for (const os of [-1, 1]) {
        sphere(0.042, 8, whiteMat, owlG, os * 0.06, 0.04, 0.1);
        sphere(0.024, 6, new T.MeshBasicMaterial({ color: 0x111111 }), owlG, os * 0.06, 0.04, 0.13);
      }
      // 小黄嘴
      const owlBeak = cyl(0.02, 0.005, 0.06, 6, goldMat, owlG, 0, 0, 0.14);
      owlBeak.rotation.x = Math.PI / 2;

    } else if (charId === 'perfumer') {
      // ===== 4. 调香师 (Vera) =====
      // 紫罗兰优雅微卷发与双侧发包
      sphere(0.48, 14, hairMat, headG, 0, 0.1, -0.06);
      sphere(0.16, 10, hairMat, headG, -0.42, 0.05, 0.05);
      sphere(0.16, 10, hairMat, headG, 0.42, 0.05, 0.05);
      sphere(0.16, 8, hairMat, headG, 0, 0.34, 0.4);

      // 宽檐蕾丝淑女小礼帽 (Chibi Lady Sunhat)
      const hatG = new T.Group();
      hatG.position.set(0, 0.44, 0.05);
      hatG.rotation.set(-0.18, 0, -0.1);
      headG.add(hatG);
      cyl(0.55, 0.55, 0.04, 18, accentMat, hatG);
      cyl(0.28, 0.32, 0.18, 14, mainDressMat, hatG, 0, 0.08, 0);
      // 帽子上的紫罗兰小花
      sphere(0.06, 8, new T.MeshStandardMaterial({ color: 0xd6a4e8 }), hatG, 0.22, 0.06, 0.2);

      // 随身配件：水晶香水喷雾小瓶 (Crystal Perfume Spray Flask)
      const flaskG = new T.Group();
      flaskG.position.set(0.32, -0.22, 0.12);
      torso.add(flaskG);
      // 水晶瓶身
      const flaskMat = new T.MeshStandardMaterial({ color: 0xe8b8f5, transparent: true, opacity: 0.85, roughness: 0.15 });
      const flaskBody = cyl(0.07, 0.09, 0.18, 10, flaskMat, flaskG);
      // 金色喷管与粉紫小喷气球
      cyl(0.025, 0.025, 0.08, 8, goldMat, flaskG, 0, 0.12, 0);
      sphere(0.05, 8, new T.MeshStandardMaterial({ color: 0x8a2f7c }), flaskG, 0.06, 0.14, 0);

    } else if (charId === 'prospector') {
      // ===== 5. 勘探员 (Norton) =====
      // 黑色蓬松小碎发 + 脸蛋小创可贴
      sphere(0.48, 14, hairMat, headG, 0, 0.08, -0.05);
      sphere(0.18, 8, hairMat, headG, -0.16, 0.32, 0.38).rotation.z = -0.25;
      sphere(0.18, 8, hairMat, headG, 0.16, 0.32, 0.38).rotation.z = 0.25;

      // 脸颊可爱十字小创可贴 (Cute Bandaid on cheek)
      const bandaidMat = new T.MeshStandardMaterial({ color: 0xffd2a6, roughness: 0.7 });
      const bandaid = cube(0.11, 0.04, 0.02, bandaidMat, headG, 0.28, -0.06, 0.42);
      bandaid.rotation.set(0.1, 0.25, 0.3);

      // 亮黄小安全矿工帽 (Cute Miner Hardhat)
      const helmetG = new T.Group();
      helmetG.position.set(0, 0.42, 0.02);
      helmetG.rotation.x = -0.1;
      headG.add(helmetG);
      const helmet = sphere(0.44, 14, accentMat, helmetG, 0, 0, 0);
      helmet.scale.set(1.15, 0.9, 1.15);
      // 帽檐
      cyl(0.56, 0.56, 0.03, 16, accentMat, helmetG, 0, -0.08, 0.06);
      // 额前黄铜矿工小头灯 (Brass Headlamp with warm glowing bulb)
      const lampCase = cyl(0.06, 0.06, 0.08, 10, goldMat, helmetG, 0, 0.02, 0.46);
      lampCase.rotation.x = Math.PI / 2;
      sphere(0.045, 8, new T.MeshStandardMaterial({ color: 0xfff0aa, emissive: 0xffea88, emissiveIntensity: 0.8 }), helmetG, 0, 0.02, 0.5);

      // 随身配件：红蓝两极小磁铁 (Red/Blue Horseshoe Magnet)
      const magG = new T.Group();
      magG.position.set(-0.32, -0.18, 0.1);
      torso.add(magG);
      cube(0.06, 0.12, 0.05, new T.MeshStandardMaterial({ color: 0xd93838 }), magG, -0.04, 0, 0); // Red North
      cube(0.06, 0.12, 0.05, new T.MeshStandardMaterial({ color: 0x386cd9 }), magG, 0.04, 0, 0);  // Blue South
      cube(0.14, 0.05, 0.05, new T.MeshStandardMaterial({ color: 0x8a9299 }), magG, 0, 0.07, 0);  // Silver Bridge

    } else {
      // 通用可爱发型
      sphere(0.48, 12, hairMat, headG, 0, 0.1, -0.05);
      sphere(0.16, 8, hairMat, headG, -0.14, 0.3, 0.38).rotation.z = -0.2;
      sphere(0.16, 8, hairMat, headG, 0.14, 0.3, 0.38).rotation.z = 0.2;
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
      // Carried on Balloons (牵气球状态 - 悬吊空中手脚挣扎晃动)
      torso.position.set(0, 0.98, 0);
      torso.rotation.set(-0.35 + Math.sin(time * 6) * 0.12, 0, Math.cos(time * 6) * 0.15);
      headG.position.set(0, 1.55, 0.08);
      headG.rotation.set(0.25 + Math.sin(time * 6) * 0.1, 0, Math.sin(time * 6) * 0.12);

      legL.position.set(-0.16, 0.64, 0);
      legR.position.set(0.16, 0.64, 0);
      legL.rotation.set(0.45 + Math.sin(time * 9) * 0.85, 0, -0.15);
      legR.rotation.set(0.45 - Math.sin(time * 9) * 0.85, 0, 0.15);

      armL.position.set(-0.32, 1.15, 0);
      armR.position.set(0.32, 1.15, 0);
      armL.rotation.set(-1.1 + Math.sin(time * 7) * 0.4, 0.3, -0.4);
      armR.rotation.set(-1.1 - Math.cos(time * 7) * 0.4, -0.3, 0.4);
      return;
    }

    if (seated) {
      // Seated on Rocket Chair (绑椅状态 - 乖乖坐好、双手背在身后)
      torso.position.set(0, 0.82, 0.04);
      torso.rotation.set(-0.12, 0, Math.sin(time * 3) * 0.03);
      headG.position.set(0, 1.38, 0.06);
      headG.rotation.set(0.15, 0, Math.sin(time * 3) * 0.05);

      legL.position.set(-0.16, 0.52, 0.22);
      legR.position.set(0.16, 0.52, 0.22);
      legL.rotation.set(-1.52, 0, -0.05 + Math.sin(time * 4) * 0.08);
      legR.rotation.set(-1.52, 0, 0.05 - Math.sin(time * 4) * 0.08);

      armL.position.set(-0.28, 0.95, -0.16);
      armR.position.set(0.28, 0.95, -0.16);
      armL.rotation.set(0.85, 0, 0.4);
      armR.rotation.set(0.85, 0, -0.4);
      return;
    }

    if (vault) {
      const t = vault.elapsed / vault.duration;
      torso.position.set(0, 0.98, 0);
      torso.rotation.set(-0.4, 0, 0);
      headG.position.set(0, 1.55, 0);
      headG.rotation.set(-0.2, 0, 0);
      armL.position.set(-0.32, 1.15, 0);
      armR.position.set(0.32, 1.15, 0);
      armL.rotation.set(-1.2, 0, -0.3);
      armR.rotation.set(-1.2, 0, 0.3);
      legL.position.set(-0.16, 0.64, 0);
      legR.position.set(0.16, 0.64, 0);
      legL.rotation.set(-1.4 * Math.sin(t * Math.PI), 0, 0);
      legR.rotation.set(0.8 * Math.sin(t * Math.PI), 0, 0);
      return;
    }

    if (health <= 0) {
      // Downed (倒地状态 - 蜷成可爱小团子趴地爬行)
      torso.position.set(0, 0.45 + (moving ? Math.sin(time * 5) * 0.03 : 0), 0);
      torso.rotation.set(0.65, 0, moving ? Math.sin(time * 5) * 0.12 : 0);
      headG.position.set(0, 0.85, 0.32);
      headG.rotation.set(0.55, 0, 0);

      legL.position.set(-0.16, 0.22, -0.12);
      legR.position.set(0.16, 0.22, -0.12);
      legL.rotation.set(-1.45 + (moving ? Math.sin(time * 5) * 0.25 : 0), 0, 0);
      legR.rotation.set(-1.45 - (moving ? Math.sin(time * 5) * 0.25 : 0), 0, 0);

      armL.position.set(-0.24, 0.95, 0.25);
      armR.position.set(0.24, 0.95, 0.25);
      armL.rotation.set(-1.85, 0.45, 0.7 + (moving ? Math.sin(time * 5) * 0.08 : 0));
      armR.rotation.set(-1.85, -0.45, -0.7 - (moving ? Math.sin(time * 5) * 0.08 : 0));
      return;
    }

    if (health === 1) {
      // Injured (受伤踉跄 - 左手捂肚子、身子微偏摇晃)
      torso.position.set(0, 0.98, 0);
      torso.rotation.set(0.2, 0, moving ? Math.sin(time * 6.5) * 0.16 : 0.06);
      headG.position.set(0, 1.55, 0);
      headG.rotation.set(0.15, 0, moving ? Math.sin(time * 6.5) * 0.08 : 0);

      armL.position.set(-0.24, 0.96, 0.14);
      armL.rotation.set(-0.85, 0.4, 0.55);

      armR.position.set(0.32, 1.15, 0);
      armR.rotation.set(moving ? Math.sin(time * 6.5) * 0.45 : 0.1, 0, 0.2);

      legL.position.set(-0.16, 0.64, 0);
      legR.position.set(0.16, 0.64, 0);
      const limpPhase = time * 6.5;
      legL.rotation.set(moving ? Math.sin(limpPhase) * 0.65 : 0, 0, 0);
      legR.rotation.set(moving ? Math.sin(limpPhase + 0.6) * 0.35 : 0, 0, 0);
      return;
    }

    // Healthy (health >= 2) - Cute Bouncy Nendoroid Walking / Sprinting (欢快 Q 弹软萌步态)
    const bounce = moving ? Math.abs(Math.sin(time * (sprint ? 18 : 10))) * 0.04 : 0;
    const sway = moving ? Math.sin(time * (sprint ? 9 : 5)) * 0.05 : 0;

    torso.position.set(0, 0.98 + bounce, 0);
    torso.rotation.set(moving ? 0.12 : 0, 0, sway);

    headG.position.set(0, 1.55 + bounce, 0);
    headG.rotation.set(moving ? 0.08 : 0, 0, -sway * 0.8);

    armL.position.set(-0.32, 1.15, 0);
    armR.position.set(0.32, 1.15, 0);
    legL.position.set(-0.16, 0.64, 0);
    legR.position.set(0.16, 0.64, 0);

    const walkSpeed = sprint ? 18 : 10;
    const walkPhase = time * walkSpeed;
    legL.rotation.set(moving ? Math.sin(walkPhase) * 0.65 : 0, 0, 0);
    legR.rotation.set(moving ? -Math.sin(walkPhase) * 0.65 : 0, 0, 0);
    armL.rotation.set(moving ? -Math.sin(walkPhase) * 0.6 : 0, 0, -0.15);
    armR.rotation.set(moving ? Math.sin(walkPhase) * 0.6 : 0, 0, 0.15);
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
