import * as THREE from 'three';
import { TerrainType } from '../types/simulation';

/**
 * Procedural Terrain & City Architecture for AeroShield C-UAS
 * Builds realistic urban rooftop outpost and surrounding city canyon blocks
 */

export function buildEnvironment(
  scene: THREE.Scene,
  terrain: TerrainType,
  targetAssetName: string
): { assetGroup: THREE.Group; assetPosition: THREE.Vector3 } {
  const envGroup = new THREE.Group();
  envGroup.name = 'environment_group';
  scene.add(envGroup);

  if (terrain === 'urban') {
    buildUrbanTerrain(envGroup);
  } else {
    buildRuralTerrain(envGroup);
  }

  // Build the critical defended asset on the rooftop / outpost
  const { assetGroup, assetPosition } = buildTargetAsset(targetAssetName, terrain);
  envGroup.add(assetGroup);

  return { assetGroup, assetPosition };
}

function buildUrbanTerrain(group: THREE.Group) {
  // 1. Asphalt Ground Plane with street grid
  const groundGeo = new THREE.PlaneGeometry(1600, 1600, 40, 40);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x070c14,
    roughness: 0.9,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Tactical road grid marking
  const roadMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.5 });
  for (let r = -400; r <= 400; r += 100) {
    const roadX = new THREE.Mesh(new THREE.PlaneGeometry(1600, 14), roadMat);
    roadX.rotation.x = -Math.PI / 2;
    roadX.position.set(0, 0.02, r);
    group.add(roadX);

    const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(14, 1600), roadMat);
    roadZ.rotation.x = -Math.PI / 2;
    roadZ.position.set(r, 0.02, 0);
    group.add(roadZ);
  }

  // 2. PLAYER'S ELEVATED ROOFTOP OUTPOST BUILDING (Center base at 0, 0, 0)
  const roofHeight = 14;
  const buildingWidth = 34;
  const buildingDepth = 34;

  const baseBldgMat = new THREE.MeshStandardMaterial({
    color: 0x172033,
    roughness: 0.8,
    metalness: 0.2
  });
  const playerBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(buildingWidth, roofHeight, buildingDepth),
    baseBldgMat
  );
  playerBuilding.position.set(0, roofHeight / 2, 0);
  playerBuilding.receiveShadow = true;
  group.add(playerBuilding);

  // Rooftop surface floor tiles
  const roofFloorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.1
  });
  const roofFloor = new THREE.Mesh(
    new THREE.BoxGeometry(buildingWidth - 0.5, 0.4, buildingDepth - 0.5),
    roofFloorMat
  );
  roofFloor.position.set(0, roofHeight + 0.2, 0);
  group.add(roofFloor);

  // Protective Concrete Parapet Ledge along all 4 edges (waist-height: 1.1m)
  const parapetMat = new THREE.MeshStandardMaterial({
    color: 0x24334a,
    roughness: 0.75,
    metalness: 0.15
  });
  const wallThick = 0.6;
  const wallH = 1.15;

  // Front Parapet (North, z = -buildingDepth/2)
  const frontWall = new THREE.Mesh(
    new THREE.BoxGeometry(buildingWidth, wallH, wallThick),
    parapetMat
  );
  frontWall.position.set(0, roofHeight + wallH / 2 + 0.2, -buildingDepth / 2 + wallThick / 2);
  group.add(frontWall);

  // Back Parapet (South, z = buildingDepth/2)
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(buildingWidth, wallH, wallThick),
    parapetMat
  );
  backWall.position.set(0, roofHeight + wallH / 2 + 0.2, buildingDepth / 2 - wallThick / 2);
  group.add(backWall);

  // Left Parapet (West, x = -buildingWidth/2)
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThick, wallH, buildingDepth),
    parapetMat
  );
  leftWall.position.set(-buildingWidth / 2 + wallThick / 2, roofHeight + wallH / 2 + 0.2, 0);
  group.add(leftWall);

  // Right Parapet (East, x = buildingWidth/2)
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThick, wallH, buildingDepth),
    parapetMat
  );
  rightWall.position.set(buildingWidth / 2 - wallThick / 2, roofHeight + wallH / 2 + 0.2, 0);
  group.add(rightWall);

  // Rooftop Industrial Details (HVAC Units, Water Tank, Staircase Bulkhead)
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
  const hvac = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 5), metalMat);
  hvac.position.set(-9, roofHeight + 1.3, -4);
  group.add(hvac);

  const hvac2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 3.5), metalMat);
  hvac2.position.set(9, roofHeight + 1.1, -5);
  group.add(hvac2);

  // Cylindrical Rooftop Water Tank on legs
  const waterTank = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 4.5, 16), metalMat);
  waterTank.position.set(-10, roofHeight + 3.8, 7);
  group.add(waterTank);

  // Staircase Access Bulkhead Housing
  const bulkhead = new THREE.Mesh(new THREE.BoxGeometry(5, 3.2, 6), parapetMat);
  bulkhead.position.set(8, roofHeight + 1.8, 8);
  group.add(bulkhead);

  // 3. IMMEDIATE & SURROUNDING CITY BLOCKS (at 25m, 45m, 65m, 90m, 130m, 200m)
  // Window Materials: warm amber glow for dark mode / reflective blue for day
  const litWindowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const darkWindowMat = new THREE.MeshBasicMaterial({ color: 0x0f2942 });
  const bldgMatA = new THREE.MeshStandardMaterial({ color: 0x131d2e, roughness: 0.7 });
  const bldgMatB = new THREE.MeshStandardMaterial({ color: 0x1a263c, roughness: 0.65 });
  const bldgMatC = new THREE.MeshStandardMaterial({ color: 0x0f1826, roughness: 0.8 });

  // Deterministic seed PRNG
  let seed = 777;
  const rand = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Immediate Adjacent City Blocks (360 degrees around the player's building)
  const urbanRings = [
    { count: 8, minDist: 34, maxDist: 52, minH: 14, maxH: 30 },
    { count: 14, minDist: 55, maxDist: 90, minH: 18, maxH: 48 },
    { count: 22, minDist: 95, maxDist: 160, minH: 22, maxH: 68 },
    { count: 32, minDist: 165, maxDist: 280, minH: 28, maxH: 95 },
    { count: 40, minDist: 285, maxDist: 480, minH: 35, maxH: 120 }
  ];

  urbanRings.forEach((ring) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + rand() * 0.3;
      const dist = ring.minDist + rand() * (ring.maxDist - ring.minDist);
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;

      const w = 16 + rand() * 20;
      const d = 16 + rand() * 20;
      const h = ring.minH + rand() * (ring.maxH - ring.minH);

      const matChoice = rand() > 0.6 ? bldgMatA : rand() > 0.3 ? bldgMatB : bldgMatC;
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matChoice);
      bldg.position.set(bx, h / 2, bz);
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      group.add(bldg);

      // Add architectural window rows for urban realism
      const stories = Math.floor(h / 3.5);
      const cols = Math.floor(Math.min(w, d) / 3.5);

      if (h > 15 && cols >= 2) {
        // Front-facing window facade plane
        const winGeo = new THREE.PlaneGeometry(cols * 2.2, stories * 2.0);
        const winMat = rand() > 0.35 ? litWindowMat : darkWindowMat;
        const facade = new THREE.Mesh(winGeo, winMat);

        // Position slightly outside the building wall facing player
        const toCenter = new THREE.Vector3(-bx, 0, -bz).normalize();
        facade.position.set(bx + toCenter.x * (w / 2 + 0.1), h / 2, bz + toCenter.z * (d / 2 + 0.1));
        facade.lookAt(bx + toCenter.x * 2, h / 2, bz + toCenter.z * 2);
        group.add(facade);
      }

      // Rooftop infrastructure: AC units, communication antenna, red warning beacon
      if (rand() > 0.4) {
        const roofHvac = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 3), metalMat);
        roofHvac.position.set(bx + (rand() - 0.5) * (w * 0.5), h + 0.9, bz + (rand() - 0.5) * (d * 0.5));
        group.add(roofHvac);
      }

      if (h > 40 && rand() > 0.5) {
        // Red flashing aviation warning light atop tall towers
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        beacon.position.set(bx, h + 1.2, bz);
        group.add(beacon);
      }
    }
  });

  // Streetlamps along inner roads
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const lx = Math.cos(angle) * 38;
    const lz = Math.sin(angle) * 38;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 6), lampMat);
    pole.position.set(lx, 4, lz);
    group.add(pole);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), bulbMat);
    bulb.position.set(lx, 8.2, lz);
    group.add(bulb);
  }
}

function buildRuralTerrain(group: THREE.Group) {
  // Undulated rolling mountain / valley terrain
  const groundGeo = new THREE.PlaneGeometry(1600, 1600, 60, 60);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    if (dist > 35) {
      const z = Math.sin(x * 0.015) * Math.cos(y * 0.015) * 22 + Math.sin(x * 0.035) * 8;
      posAttr.setZ(i, z);
    }
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x142016, // Deep tactical olive
    roughness: 0.95,
    metalness: 0.05
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Player's Elevated Hilltop Observation Post
  const postH = 8;
  const postBase = new THREE.Mesh(
    new THREE.CylinderGeometry(20, 24, postH, 16),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 })
  );
  postBase.position.set(0, postH / 2, 0);
  group.add(postBase);

  // Sandbag Revetment Wall perimeter
  const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2;
    const x = Math.cos(angle) * 18;
    const z = Math.sin(angle) * 18;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 1.8), sandbagMat);
    bag.position.set(x, postH + 0.6, z);
    bag.rotation.y = -angle;
    group.add(bag);
  }

  // Pine Forest clusters across valley
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0f });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.85 });

  let seed = 505;
  const rand = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 110; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 50 + rand() * 420;
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;

    const trunkH = 4 + rand() * 3;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, trunkH, 6), trunkMat);
    trunk.position.set(tx, trunkH / 2, tz);
    group.add(trunk);

    const foliageH = 9 + rand() * 6;
    const foliage = new THREE.Mesh(new THREE.ConeGeometry(3 + rand() * 1.5, foliageH, 7), foliageMat);
    foliage.position.set(tx, trunkH + foliageH / 2, tz);
    group.add(foliage);
  }
}

function buildTargetAsset(
  assetName: string,
  terrain: TerrainType
): { assetGroup: THREE.Group; assetPosition: THREE.Vector3 } {
  const assetGroup = new THREE.Group();
  assetGroup.name = 'target_asset';

  // Base platform height: on urban rooftop (y = 14) or rural post (y = 8)
  const baseY = terrain === 'urban' ? 14 : 8;
  const assetPosition = new THREE.Vector3(0, baseY, 8); // Mounted slightly behind the player at (0, baseY, 8)

  assetGroup.position.copy(assetPosition);

  // Tactical Foundation Pedestal
  const pedGeo = new THREE.CylinderGeometry(4, 4.5, 0.8, 16);
  const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const ped = new THREE.Mesh(pedGeo, pedMat);
  ped.position.y = 0.4;
  assetGroup.add(ped);

  // Circular emerald status ring
  const ringGeo = new THREE.RingGeometry(3.6, 4.2, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.82;
  assetGroup.add(ring);

  // Phased Array Tactical C-UAS Radar Dish
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.6, 6, 8),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
  );
  mast.position.y = 3.8;
  assetGroup.add(mast);

  const radarDish = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 2.6, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.6, roughness: 0.3 })
  );
  radarDish.position.set(0, 6.8, 0);
  radarDish.name = 'rotating_radar_plate';
  assetGroup.add(radarDish);

  // Aviation Warning Beacon
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  beacon.position.set(0, 8.4, 0);
  beacon.name = 'asset_beacon';
  assetGroup.add(beacon);

  return { assetGroup, assetPosition };
}
