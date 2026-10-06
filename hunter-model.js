// Detailed Hunter 3D Modeling Module for Fogbound
// Inspired by Identity V aesthetic: taller, imposing stature, distinct costumes and signature weapons.

export function createHunterMesh(T, initialId = 'ripper') {
  const group = new T.Group();
  group.name = 'hunterCharacter';
  let currentId = null;
  let wepPivot = null;
  let armR = null;
  let armL = null;
  let legs = [];

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

  function buildRipper(root) {
    // Slender, tall Victorian gentleman silhouette with iconic razor-claw blades
    const blackMat = new T.MeshStandardMaterial({ color: 0x1a2124, roughness: 0.85 });
    const whiteMat = new T.MeshStandardMaterial({ color: 0xe6e4db, roughness: 0.6 });
    const fleshMat = new T.MeshStandardMaterial({ color: 0xdfd4c5, roughness: 0.7 });
    const steelMat = new T.MeshStandardMaterial({ color: 0xc4cdd4, metalness: 0.85, roughness: 0.25 });
    const redMat = new T.MeshStandardMaterial({ color: 0x7a2228, roughness: 0.7 });
    const vestMat = new T.MeshStandardMaterial({ color: 0x333b3e, roughness: 0.8 });

    // Tall slender torso
    cube(1.15, 1.8, 0.75, blackMat, root, 0, 2.5, 0); // Tailcoat torso
    cube(0.7, 1.2, 0.76, vestMat, root, 0, 2.3, 0.05); // Vest
    cube(0.35, 0.45, 0.78, whiteMat, root, 0, 2.8, 0.06); // White collared shirt
    cube(0.3, 0.12, 0.82, redMat, root, 0, 2.9, 0.07); // Red bowtie

    // Long flaring tailcoat coattails (hanging down behind legs)
    const coatL = cube(0.5, 1.6, 0.1, blackMat, root, -0.3, 1.1, -0.36);
    coatL.rotation.x = -0.15;
    const coatR = cube(0.5, 1.6, 0.1, blackMat, root, 0.3, 1.1, -0.36);
    coatR.rotation.x = -0.15;

    // High pointed coat collar
    const collarL = cube(0.12, 0.55, 0.5, blackMat, root, -0.45, 3.5, 0.1);
    collarL.rotation.z = -0.25;
    const collarR = cube(0.12, 0.55, 0.5, blackMat, root, 0.45, 3.5, 0.1);
    collarR.rotation.z = 0.25;

    // Head with pale half-mask
    sphere(0.48, 12, fleshMat, root, 0, 3.75, 0);
    // Smooth white porcelain mask covering front of face
    const mask = cyl(0.46, 0.44, 0.55, 12, whiteMat, root, 0, 3.75, 0.12);
    mask.scale.set(0.9, 1, 0.7);

    // Gentleman's tall top hat
    const brim = cyl(0.85, 0.85, 0.08, 16, blackMat, root, 0, 4.15, 0);
    cyl(0.52, 0.58, 0.95, 16, blackMat, root, 0, 4.65, 0);
    cyl(0.53, 0.53, 0.15, 16, redMat, root, 0, 4.25, 0); // Crimson hat ribbon

    // Long slender legs
    const legL = cube(0.36, 1.7, 0.38, blackMat, root, -0.35, 0.85, 0);
    const legR = cube(0.36, 1.7, 0.38, blackMat, root, 0.35, 0.85, 0);
    // Shoes
    cube(0.38, 0.22, 0.55, blackMat, legL, 0, -0.85, 0.08);
    cube(0.38, 0.22, 0.55, blackMat, legR, 0, -0.85, 0.08);
    legs = [legL, legR];

    // Left arm: draped inside long sleeve
    armL = cube(0.35, 1.5, 0.35, blackMat, root, -0.85, 2.5, 0);
    armL.rotation.z = 0.12;
    cube(0.24, 0.4, 0.24, fleshMat, armL, 0, -0.85, 0);

    // Right arm & Signature Claw Blades (Weapon Hand)
    armR = cube(0.35, 1.4, 0.35, blackMat, root, 0.85, 2.5, 0);
    wepPivot = new T.Group();
    wepPivot.position.set(0, -0.75, 0);
    armR.add(wepPivot);

    // Gauntlet base
    cube(0.38, 0.55, 0.38, vestMat, wepPivot, 0, -0.15, 0);
    // 5 Curved long steel razor claw blades extending outwards like eagle talons
    for (let i = 0; i < 5; i++) {
      const angle = (i - 2) * 0.22;
      const bladeG = new T.Group();
      bladeG.position.set((i - 2) * 0.08, -0.4, 0.1);
      bladeG.rotation.z = angle * 0.8;
      bladeG.rotation.x = 0.3;
      wepPivot.add(bladeG);

      // Segmented curved blade
      const b1 = cube(0.06, 0.75, 0.12, steelMat, bladeG, 0, -0.35, 0);
      b1.rotation.x = -0.15;
      const b2 = cube(0.04, 0.75, 0.08, steelMat, bladeG, 0, -0.95, 0.15);
      b2.rotation.x = -0.35;
      // Sharp razor tip
      cone(0.06, 0.45, 6, steelMat, bladeG, 0, -1.45, 0.4);
    }
  }

  function buildSmiley(root) {
    // Burly, hunchbacked menacing circus clown with modified rocket thruster & mechanical peg leg
    const skinMat = new T.MeshStandardMaterial({ color: 0xdfbc9f, roughness: 0.75 });
    const clothMat = new T.MeshStandardMaterial({ color: 0x8a3028, roughness: 0.9 });
    const blueCloth = new T.MeshStandardMaterial({ color: 0x364860, roughness: 0.85 });
    const yellowCloth = new T.MeshStandardMaterial({ color: 0xba8a38, roughness: 0.85 });
    const metalMat = new T.MeshStandardMaterial({ color: 0x485255, metalness: 0.8, roughness: 0.35 });
    const redNoseMat = new T.MeshStandardMaterial({ color: 0xcc2218, roughness: 0.3 });
    const hairMat = new T.MeshStandardMaterial({ color: 0xb5351a, roughness: 0.95 });
    const leatherMat = new T.MeshStandardMaterial({ color: 0x442c1d, roughness: 0.8 });

    // Hunchbacked barrel torso
    const torso = cube(1.6, 1.9, 1.25, clothMat, root, 0, 2.3, -0.1);
    torso.rotation.x = 0.12; // Menacing forward hunch
    // Overalls straps & brass buckles
    cube(0.25, 1.95, 1.28, blueCloth, torso, -0.45, 0, 0);
    cube(0.25, 1.95, 1.28, blueCloth, torso, 0.45, 0, 0);
    cube(0.3, 0.2, 0.15, metalMat, torso, -0.45, 0.55, 0.65);
    cube(0.3, 0.2, 0.15, metalMat, torso, 0.45, 0.55, 0.65);
    // Ruffled clown collar
    torso.add(cyl(0.7, 0.9, 0.25, 12, yellowCloth, root, 0, 3.25, 0.08));

    // Head
    const head = sphere(0.56, 12, skinMat, root, 0, 3.65, 0.2);
    // Red spherical clown nose
    sphere(0.22, 10, redNoseMat, root, 0, 3.65, 0.72);
    // Chaotic curly red clown hair puffs
    sphere(0.42, 8, hairMat, root, -0.48, 3.85, 0.05);
    sphere(0.42, 8, hairMat, root, 0.48, 3.85, 0.05);
    sphere(0.38, 8, hairMat, root, 0, 4.05, -0.2);
    // Crooked mini bowler hat
    const hat = cyl(0.32, 0.38, 0.35, 10, blueCloth, root, 0.15, 4.25, 0.1);
    hat.rotation.z = -0.25;

    // Legs: Left normal boot leg, Right steampunk mechanical peg leg
    const legL = cube(0.52, 1.45, 0.55, blueCloth, root, -0.52, 0.75, 0);
    cube(0.55, 0.4, 0.8, leatherMat, legL, 0, -0.65, 0.15); // Heavy boot

    const legR = new T.Group();
    legR.position.set(0.52, 0.75, 0);
    root.add(legR);
    // Upper thigh socket
    cube(0.48, 0.65, 0.48, leatherMat, legR, 0, 0.35, 0);
    // Heavy metallic piston strut
    cyl(0.12, 0.12, 1.1, 10, metalMat, legR, 0, -0.2, 0);
    // Shock absorber spring coils
    for (let si = -0.3; si <= 0.2; si += 0.14) {
      const ring = cyl(0.22, 0.22, 0.06, 10, metalMat, legR, 0, si, 0);
    }
    // Heavy iron peg foot base
    cube(0.4, 0.18, 0.55, metalMat, legR, 0, -0.75, 0);
    legs = [legL, legR];

    // Left arm
    armL = cube(0.48, 1.4, 0.48, yellowCloth, root, -1.05, 2.3, 0);
    sphere(0.26, 8, leatherMat, armL, 0, -0.8, 0); // Glove

    // Right arm & Giant Modified Rocket Launcher (Weapon)
    armR = cube(0.5, 1.35, 0.5, yellowCloth, root, 1.05, 2.3, 0);
    wepPivot = new T.Group();
    wepPivot.position.set(0, -0.65, 0);
    armR.add(wepPivot);

    // Huge Rocket Launcher model
    const rocketG = new T.Group();
    rocketG.position.set(0.35, -0.1, 0.35);
    rocketG.rotation.x = Math.PI / 2; // Point forward
    wepPivot.add(rocketG);

    // Central heavy rocket barrel
    cyl(0.38, 0.42, 2.8, 12, metalMat, rocketG, 0, 0, 0);
    // Sharp armored ramming cone / drill spike on the front
    cone(0.45, 0.95, 8, metalMat, rocketG, 0, 1.75, 0);
    // Dual rear engine exhaust thrusters
    cyl(0.18, 0.25, 0.65, 10, metalMat, rocketG, -0.25, -1.55, 0);
    cyl(0.18, 0.25, 0.65, 10, metalMat, rocketG, 0.25, -1.55, 0);
    // Orange thruster glow interior
    sphere(0.12, 6, new T.MeshBasicMaterial({ color: 0xff6600 }), rocketG, -0.25, -1.75, 0);
    sphere(0.12, 6, new T.MeshBasicMaterial({ color: 0xff6600 }), rocketG, 0.25, -1.75, 0);
    // Heavy iron handles and grip brackets
    cube(0.15, 0.65, 0.15, leatherMat, rocketG, 0, 0, 0.45);
  }

  function buildNaiad(root) {
    // Ethereal deep-sea siren grace with long kelp hair, flowing tattered fins, and an ornate trident harpoon
    const paleMat = new T.MeshStandardMaterial({ color: 0xd6e5e3, roughness: 0.5, metalness: 0.1 });
    const tealMat = new T.MeshStandardMaterial({ color: 0x24555f, roughness: 0.65, transparent: true, opacity: 0.9 });
    const finMat = new T.MeshStandardMaterial({ color: 0x489aa8, transparent: true, opacity: 0.72, roughness: 0.4 });
    const hairMat = new T.MeshStandardMaterial({ color: 0x143438, roughness: 0.85 });
    const brassMat = new T.MeshStandardMaterial({ color: 0xb59550, metalness: 0.75, roughness: 0.3 });
    const waterGlow = new T.MeshBasicMaterial({ color: 0x6be0ef, transparent: true, opacity: 0.45 });

    // Elegant, tall floating silhouette
    const body = cube(0.95, 1.7, 0.65, tealMat, root, 0, 2.4, 0);
    // Flowing layered tattered sea-dress skirt
    const skirtUpper = cyl(0.5, 0.85, 1.4, 12, tealMat, root, 0, 1.35, 0);
    const skirtLower = cyl(0.85, 1.25, 1.3, 12, finMat, root, 0, 0.65, 0);
    skirtLower.scale.set(1.1, 1, 0.85);

    // Deep sea shawl drape over shoulders
    const shawl = cyl(0.65, 0.95, 0.55, 10, finMat, root, 0, 3.1, 0);
    shawl.scale.set(1.3, 1, 0.9);

    // Slender legs tucked inside floating gown
    const legL = cube(0.28, 1.4, 0.28, paleMat, root, -0.26, 0.8, 0);
    const legR = cube(0.28, 1.4, 0.28, paleMat, root, 0.26, 0.8, 0);
    legs = [legL, legR];

    // Delicate pale head
    sphere(0.44, 12, paleMat, root, 0, 3.7, 0.05);
    // Long kelp hair cascading down back and front
    const hairBack = cube(0.7, 2.2, 0.25, hairMat, root, 0, 2.9, -0.3);
    hairBack.rotation.x = -0.12;
    const hairL = cube(0.22, 1.8, 0.2, hairMat, root, -0.38, 2.9, 0.15);
    const hairR = cube(0.22, 1.8, 0.2, hairMat, root, 0.38, 2.9, 0.15);
    // Translucent fish-fin ear ornaments
    const earL = cone(0.28, 0.65, 5, finMat, root, -0.55, 3.8, 0);
    earL.rotation.z = -1.1;
    const earR = cone(0.28, 0.65, 5, finMat, root, 0.55, 3.8, 0);
    earR.rotation.z = 1.1;

    // Slender arms
    armL = cube(0.26, 1.5, 0.26, paleMat, root, -0.72, 2.45, 0);
    armL.rotation.z = 0.15;
    // Flowing translucent fin cuffs on forearms
    cube(0.08, 0.7, 0.45, finMat, armL, -0.15, -0.35, 0);

    // Right arm holding Great Harpoon Trident (Weapon)
    armR = cube(0.28, 1.4, 0.28, paleMat, root, 0.72, 2.45, 0);
    wepPivot = new T.Group();
    wepPivot.position.set(0, -0.65, 0);
    armR.add(wepPivot);

    // 3.4m Heavy Ancient Trident Harpoon
    const harpoonG = new T.Group();
    harpoonG.position.set(0.15, 0.4, 0.2);
    wepPivot.add(harpoonG);

    // Long antiqued brass shaft
    cyl(0.05, 0.06, 3.4, 8, brassMat, harpoonG, 0, 0, 0);
    // Central spear point
    cone(0.14, 0.95, 6, brassMat, harpoonG, 0, 2.1, 0);
    // Flanking curved barbed prongs
    const prongL = cyl(0.04, 0.05, 0.85, 6, brassMat, harpoonG, -0.32, 1.8, 0);
    prongL.rotation.z = -0.25;
    cone(0.1, 0.45, 5, brassMat, prongL, 0, 0.5, 0);

    const prongR = cyl(0.04, 0.05, 0.85, 6, brassMat, harpoonG, 0.32, 1.8, 0);
    prongR.rotation.z = 0.25;
    cone(0.1, 0.45, 5, brassMat, prongR, 0, 0.5, 0);

    // Cross-guard ornamental shell ring
    torus(0.22, 0.05, 5, 12, brassMat, harpoonG, 0, 1.4, 0);

    // Ethereal water mist aura ring around the weapon
    const aura = new T.Mesh(new T.TorusGeometry(0.35, 0.05, 6, 16), waterGlow);
    aura.position.set(0, 1.9, 0);
    aura.rotation.x = Math.PI / 2;
    harpoonG.add(aura);
  }

  function torus(r, t, radSeg, tubSeg, mat, parent, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(new T.TorusGeometry(r, t, radSeg, tubSeg), mat);
    m.position.set(x, y, z);
    m.rotation.x = Math.PI / 2;
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  function updateSkin(newId) {
    if (currentId === newId) return;
    currentId = newId;

    // Remove previous character children
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    }

    wepPivot = null;
    armR = null;
    armL = null;
    legs = [];

    if (newId === 'smiley') {
      buildSmiley(group);
    } else if (newId === 'naiad') {
      buildNaiad(group);
    } else {
      buildRipper(group);
    }

    // Attach controllers to user data for animation binding
    group.userData.wepPivot = wepPivot;
    group.userData.armR = armR;
    group.userData.armL = armL;
    group.userData.legs = legs;
    group.userData.skinId = newId;
  }

  updateSkin(initialId);

  return {
    group,
    get legs() { return group.userData.legs || legs; },
    get wepPivot() { return group.userData.wepPivot; },
    get armR() { return group.userData.armR; },
    updateSkin
  };
}
