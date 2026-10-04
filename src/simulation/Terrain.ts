import * as THREE from 'three';
import { TerrainType, Scenario } from '../types/simulation';

/**
 * Procedural Realistic 3D Environments for AeroShield C-UAS
 * 5 Unique, Highly-Detailed Thematic Maps:
 * 1. Urban Day: High-rise metropolis skyscraper canyon under clear midday sun
 * 2. Urban Night: Midnight metropolis with glowing amber/cyan office windows & red aviation beacons
 * 3. Rural Area: Mountain valley with rolling terrain, conifer pine forest & sandbag fort
 * 4. Desert Swarm: Arid FOB outpost, sand dunes, tan HESCO bastions, blast walls & fuel tanks
 * 5. VIP Compound: Executive government plaza, presidential helipad, motorcade & stadium floodlights
 */

export interface EnvironmentBuildResult {
  assetGroup: THREE.Group;
  assetPosition: THREE.Vector3;
  playerBaseHeight: number;
  playerEyeHeight: number;
  boundaryRadiusX: number;
  boundaryRadiusZ: number;
}

export function buildEnvironment(
  scene: THREE.Scene,
  terrain: TerrainType,
  targetAssetName: string,
  scenario?: Scenario
): EnvironmentBuildResult {
  const envGroup = new THREE.Group();
  envGroup.name = 'environment_group';
  scene.add(envGroup);

  let playerBaseHeight = 14;
  let boundaryRadiusX = 45;
  let boundaryRadiusZ = 45;

  switch (terrain) {
    case 'urban':
      buildUrbanDayTerrain(envGroup);
      playerBaseHeight = 14;
      boundaryRadiusX = 22;
      boundaryRadiusZ = 22;
      break;

    case 'urban_night':
      buildUrbanNightTerrain(envGroup);
      playerBaseHeight = 14;
      boundaryRadiusX = 22;
      boundaryRadiusZ = 22;
      break;

    case 'rural':
      buildRuralTerrain(envGroup);
      playerBaseHeight = 8;
      boundaryRadiusX = 24;
      boundaryRadiusZ = 24;
      break;

    case 'desert':
      buildDesertSwarmTerrain(envGroup);
      playerBaseHeight = 8;
      boundaryRadiusX = 26;
      boundaryRadiusZ = 26;
      break;

    case 'compound':
      buildVIPCompoundTerrain(envGroup);
      playerBaseHeight = 6;
      boundaryRadiusX = 30;
      boundaryRadiusZ = 30;
      break;

    default:
      buildUrbanDayTerrain(envGroup);
      playerBaseHeight = 14;
      boundaryRadiusX = 22;
      boundaryRadiusZ = 22;
      break;
  }

  // Build the specific critical defended asset tailored to the scenario
  const { assetGroup, assetPosition } = buildTargetAsset(targetAssetName, terrain, playerBaseHeight);
  envGroup.add(assetGroup);

  return {
    assetGroup,
    assetPosition,
    playerBaseHeight,
    playerEyeHeight: playerBaseHeight + 1.65,
    boundaryRadiusX,
    boundaryRadiusZ
  };
}

/* =========================================================================
   MAP 1: URBAN DAY (Metropolitan Skyscraper Canyon under Daylight Sun)
   ========================================================================= */
function buildUrbanDayTerrain(group: THREE.Group) {
  // 1. Asphalt Ground Plane with marked city grid
  const groundGeo = new THREE.PlaneGeometry(1600, 1600, 30, 30);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.15
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Marked Avenue & Cross-streets
  const roadMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Yellow road dividers
  for (let r = -400; r <= 400; r += 90) {
    const roadX = new THREE.Mesh(new THREE.PlaneGeometry(1600, 16), roadMat);
    roadX.rotation.x = -Math.PI / 2;
    roadX.position.set(0, 0.02, r);
    group.add(roadX);

    const laneX = new THREE.Mesh(new THREE.PlaneGeometry(1600, 0.4), laneMat);
    laneX.rotation.x = -Math.PI / 2;
    laneX.position.set(0, 0.03, r);
    group.add(laneX);

    const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(16, 1600), roadMat);
    roadZ.rotation.x = -Math.PI / 2;
    roadZ.position.set(r, 0.02, 0);
    group.add(roadZ);
  }

  // 2. PLAYER'S ELEVATED METROPOLITAN ROOFTOP (Center Base: 32m x 32m at y=14)
  const roofHeight = 14;
  const buildingWidth = 32;
  const buildingDepth = 32;

  const baseBldgMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.3
  });
  const playerBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(buildingWidth, roofHeight, buildingDepth),
    baseBldgMat
  );
  playerBuilding.position.set(0, roofHeight / 2, 0);
  playerBuilding.receiveShadow = true;
  group.add(playerBuilding);

  // Rooftop concrete floor
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(buildingWidth - 0.4, 0.3, buildingDepth - 0.4), floorMat);
  floor.position.set(0, roofHeight + 0.15, 0);
  group.add(floor);

  // Concrete safety parapet with metal handrail
  buildParapetWalls(group, buildingWidth, buildingDepth, roofHeight, 0x1e293b, 0x0284c7);

  // Rooftop Industrial Utilities (HVAC, Skylights, Elevator Bulkhead)
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
  const hvac1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 5.5), metalMat);
  hvac1.position.set(-8, roofHeight + 1.25, -6);
  group.add(hvac1);

  const hvac2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 4), metalMat);
  hvac2.position.set(8, roofHeight + 1.05, -7);
  group.add(hvac2);

  const bulkhead = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.2, 6.5), baseBldgMat);
  bulkhead.position.set(8, roofHeight + 1.8, 8);
  group.add(bulkhead);

  // 3. Dense Daytime City Canyon Skyscrapers
  let seed = 101;
  const rand = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const bldgColors = [0x1e293b, 0x334155, 0x0f172a, 0x2563eb, 0x0284c7];
  const windowDayMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.9,
    roughness: 0.1
  });

  const cityRings = [
    { count: 8, minDist: 36, maxDist: 58, minH: 18, maxH: 38 },
    { count: 14, minDist: 62, maxDist: 105, minH: 24, maxH: 58 },
    { count: 20, minDist: 110, maxDist: 190, minH: 30, maxH: 85 },
    { count: 28, minDist: 200, maxDist: 340, minH: 35, maxH: 115 }
  ];

  cityRings.forEach((ring) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + rand() * 0.25;
      const dist = ring.minDist + rand() * (ring.maxDist - ring.minDist);
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;

      const w = 18 + rand() * 18;
      const d = 18 + rand() * 18;
      const h = ring.minH + rand() * (ring.maxH - ring.minH);

      const color = bldgColors[Math.floor(rand() * bldgColors.length)];
      const bldgMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.4 });
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bldgMat);
      bldg.position.set(bx, h / 2, bz);
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      group.add(bldg);

      // Glass ribbon window facades
      if (h > 20) {
        const stories = Math.floor(h / 4);
        const glassFacade = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.85, stories * 2.2), windowDayMat);
        const toCenter = new THREE.Vector3(-bx, 0, -bz).normalize();
        glassFacade.position.set(bx + toCenter.x * (w / 2 + 0.1), h / 2, bz + toCenter.z * (d / 2 + 0.1));
        glassFacade.lookAt(bx + toCenter.x * 2, h / 2, bz + toCenter.z * 2);
        group.add(glassFacade);
      }

      // Rooftop telecomm antenna
      if (rand() > 0.6) {
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 8 + rand() * 6, 6), metalMat);
        ant.position.set(bx, h + 4, bz);
        group.add(ant);
      }
    }
  });
}

/* =========================================================================
   MAP 2: URBAN NIGHT (Midnight Metropolis with Illuminated Office Windows)
   ========================================================================= */
function buildUrbanNightTerrain(group: THREE.Group) {
  // 1. Dark wet asphalt road ground plane
  const groundGeo = new THREE.PlaneGeometry(1600, 1600, 30, 30);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x050811,
    roughness: 0.4,
    metalness: 0.6
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // 2. PLAYER'S ELEVATED TACTICAL OUTPOST (Center Base: 32m x 32m at y=14)
  const roofHeight = 14;
  const buildingWidth = 32;
  const buildingDepth = 32;

  const baseBldgMat = new THREE.MeshStandardMaterial({
    color: 0x0d1527,
    roughness: 0.7,
    metalness: 0.3
  });
  const playerBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(buildingWidth, roofHeight, buildingDepth),
    baseBldgMat
  );
  playerBuilding.position.set(0, roofHeight / 2, 0);
  group.add(playerBuilding);

  // Dark rooftop surface with tactical glowing perimeter guide lines
  const roofFloor = new THREE.Mesh(
    new THREE.BoxGeometry(buildingWidth - 0.4, 0.3, buildingDepth - 0.4),
    new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: 0.8 })
  );
  roofFloor.position.set(0, roofHeight + 0.15, 0);
  group.add(roofFloor);

  // Parapet walls with red low-light tactical trim
  buildParapetWalls(group, buildingWidth, buildingDepth, roofHeight, 0x111c33, 0xef4444);

  // Tactical Rooftop Server Pod & Satellite Uplink
  const podMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
  const serverPod = new THREE.Mesh(new THREE.BoxGeometry(5, 2.8, 6), podMat);
  serverPod.position.set(-8, roofHeight + 1.55, -6);
  group.add(serverPod);

  // Uplink dish
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7 })
  );
  dish.rotation.x = -Math.PI / 3;
  dish.position.set(-8, roofHeight + 3.8, -6);
  group.add(dish);

  // 3. Dense Midnight Metropolis with Glowing Office Windows
  let seed = 303;
  const rand = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const darkBldgMat = new THREE.MeshStandardMaterial({ color: 0x080e1a, roughness: 0.8 });
  const litWindowAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const litWindowCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const litWindowSoft = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const unlitWindowMat = new THREE.MeshBasicMaterial({ color: 0x030712 });

  const cityRings = [
    { count: 8, minDist: 36, maxDist: 58, minH: 18, maxH: 38 },
    { count: 14, minDist: 62, maxDist: 105, minH: 25, maxH: 58 },
    { count: 22, minDist: 110, maxDist: 190, minH: 32, maxH: 88 },
    { count: 30, minDist: 200, maxDist: 350, minH: 38, maxH: 125 }
  ];

  cityRings.forEach((ring) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + rand() * 0.25;
      const dist = ring.minDist + rand() * (ring.maxDist - ring.minDist);
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;

      const w = 18 + rand() * 18;
      const d = 18 + rand() * 18;
      const h = ring.minH + rand() * (ring.maxH - ring.minH);

      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), darkBldgMat);
      bldg.position.set(bx, h / 2, bz);
      group.add(bldg);

      // Lit Windows Facades
      if (h > 18) {
        const stories = Math.floor(h / 3.8);
        const winGeo = new THREE.PlaneGeometry(w * 0.8, stories * 2.2);
        const winChoice = rand() > 0.5 ? litWindowAmber : rand() > 0.5 ? litWindowCyan : litWindowSoft;
        const facade = new THREE.Mesh(winGeo, winChoice);

        const toCenter = new THREE.Vector3(-bx, 0, -bz).normalize();
        facade.position.set(bx + toCenter.x * (w / 2 + 0.12), h / 2, bz + toCenter.z * (d / 2 + 0.12));
        facade.lookAt(bx + toCenter.x * 2, h / 2, bz + toCenter.z * 2);
        group.add(facade);
      }

      // Red flashing aviation warning beacon on high towers
      if (h > 35) {
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.9, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        beacon.position.set(bx, h + 1.2, bz);
        group.add(beacon);
      }
    }
  });

  // Streetlamps along urban corridors
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const lx = Math.cos(angle) * 36;
    const lz = Math.sin(angle) * 36;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7.5, 6), lampMat);
    pole.position.set(lx, 3.75, lz);
    group.add(pole);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), bulbMat);
    bulb.position.set(lx, 7.7, lz);
    group.add(bulb);
  }
}

/* =========================================================================
   MAP 3: RURAL AREA (Mountain Valley with Pine Forest & Fortified Hilltop)
   ========================================================================= */
function buildRuralTerrain(group: THREE.Group) {
  // 1. Undulating Mountain & Valley Terrain with Natural Elevation
  const groundGeo = new THREE.PlaneGeometry(1600, 1600, 64, 64);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    if (dist > 30) {
      // Natural rolling ridges and hills
      const z =
        Math.sin(x * 0.012) * Math.cos(y * 0.012) * 26 +
        Math.sin(x * 0.03 + y * 0.02) * 8 +
        Math.cos(x * 0.005) * 14;
      posAttr.setZ(i, z);
    }
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x16301d, // Lush tactical mountain pine green
    roughness: 0.95,
    metalness: 0.05
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // 2. PLAYER'S ELEVATED HILLTOP OBSERVATION REDOUBT (Center Base: y=8)
  const postH = 8;
  const postBase = new THREE.Mesh(
    new THREE.CylinderGeometry(18, 23, postH, 24),
    new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.95 }) // Weathered granite outcrop
  );
  postBase.position.set(0, postH / 2, 0);
  group.add(postBase);

  // Wooden military observation deck platform
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.8 });
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(17.8, 17.8, 0.4, 24), deckMat);
  deck.position.set(0, postH + 0.2, 0);
  group.add(deck);

  // Heavy Sandbag Revetment Perimeter (waist-height: 1.2m)
  const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2;
    const x = Math.cos(angle) * 17.2;
    const z = Math.sin(angle) * 17.2;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.25, 1.6), sandbagMat);
    bag.position.set(x, postH + 0.65, z);
    bag.rotation.y = -angle;
    group.add(bag);
  }

  // Tactical Field Camouflage Netting Frame & Supply Crates
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.6 });
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.7 });

  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.6), crateMat);
  crate1.position.set(-6, postH + 0.9, -6);
  group.add(crate1);

  const crate2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 2.0), crateMat);
  crate2.position.set(-6, postH + 2.2, -5.8);
  group.add(crate2);

  // Camouflage roof canopy
  const camoCanopy = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.9 })
  );
  camoCanopy.position.set(-6, postH + 3.4, -6);
  group.add(camoCanopy);

  // 3. Dense Conifer Pine Forest (140+ individual trees with multi-tier foliage)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x271911, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.85 });
  const foliageLighterMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.85 });

  let seed = 505;
  const rand = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 150; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 42 + rand() * 480;
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;

    // Approximate hill elevation at (tx, tz)
    const hillZ =
      dist > 30
        ? Math.sin(tx * 0.012) * Math.cos(tz * 0.012) * 26 +
          Math.sin(tx * 0.03 + tz * 0.02) * 8 +
          Math.cos(tx * 0.005) * 14
        : 0;

    const trunkH = 4.5 + rand() * 4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, trunkH, 6), trunkMat);
    trunk.position.set(tx, hillZ + trunkH / 2, tz);
    group.add(trunk);

    // Multi-tier realistic conifer foliage cones
    const treeScale = 0.8 + rand() * 0.6;
    for (let tier = 0; tier < 3; tier++) {
      const coneR = (4.2 - tier * 0.9) * treeScale;
      const coneH = (6.0 - tier * 0.8) * treeScale;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(coneR, coneH, 7),
        tier === 1 ? foliageLighterMat : foliageMat
      );
      cone.position.set(tx, hillZ + trunkH + tier * 2.8 * treeScale, tz);
      group.add(cone);
    }
  }

  // Scattered granite boulders
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
  for (let i = 0; i < 35; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 32 + rand() * 320;
    const rx = Math.cos(angle) * dist;
    const rz = Math.sin(angle) * dist;
    const rSize = 1.5 + rand() * 3.5;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rSize, 1), rockMat);
    rock.position.set(rx, rSize * 0.7, rz);
    rock.rotation.set(rand() * 2, rand() * 2, rand() * 2);
    group.add(rock);
  }
}

/* =========================================================================
   MAP 4: SWARM ATTACK (Arid Desert Forward Operating Base with HESCO Bastions)
   ========================================================================= */
function buildDesertSwarmTerrain(group: THREE.Group) {
  // 1. Rippling Golden Desert Sand Dunes
  const groundGeo = new THREE.PlaneGeometry(1600, 1600, 50, 50);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    if (dist > 35) {
      // Windblown desert dune wave ridge ripples
      const z = Math.sin(x * 0.01 + y * 0.006) * 16 + Math.cos(y * 0.02) * 5;
      posAttr.setZ(i, z);
    }
  }
  groundGeo.computeVertexNormals();

  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Rich golden amber desert sand
    roughness: 0.9,
    metalness: 0.05
  });
  const ground = new THREE.Mesh(groundGeo, sandMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // 2. FORWARD OPERATING BASE (FOB) RAISED DEFENSIVE COMMAND BERM (y=8)
  const bermH = 8;
  const bermMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.95 });
  const berm = new THREE.Mesh(new THREE.CylinderGeometry(20, 26, bermH, 24), bermMat);
  berm.position.set(0, bermH / 2, 0);
  group.add(berm);

  // Fortified FOB deck surface
  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(19.8, 19.8, 0.4, 24),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
  );
  deck.position.set(0, bermH + 0.2, 0);
  group.add(deck);

  // Tan HESCO Sand Bastions (cubic military barrier cages filled with earth)
  const hescoMat = new THREE.MeshStandardMaterial({
    color: 0xc2a677, // Military khaki earth
    roughness: 0.9,
    metalness: 0.1
  });
  const wireMeshMat = new THREE.MeshBasicMaterial({ color: 0x71717a, wireframe: true });

  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const x = Math.cos(angle) * 18.5;
    const z = Math.sin(angle) * 18.5;

    const block = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.0, 2.2), hescoMat);
    block.position.set(x, bermH + 1.0, z);
    block.rotation.y = -angle;
    group.add(block);

    // Wire outer cage overlay
    const cage = new THREE.Mesh(new THREE.BoxGeometry(4.65, 2.05, 2.25), wireMeshMat);
    cage.position.set(x, bermH + 1.0, z);
    cage.rotation.y = -angle;
    group.add(cage);
  }

  // Tactical Desert FOB Canopy & Field Equipment
  const canvasMat = new THREE.MeshStandardMaterial({ color: 0xa87944, roughness: 0.9 });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(10, 0.25, 9), canvasMat);
  canopy.position.set(-6, bermH + 3.8, -6);
  group.add(canopy);

  // 3. Surrounding Military Outpost: Shipping Containers, Watchtowers, Fuel Pipes
  const containerTan = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });
  const containerOlive = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.6 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });

  // Shipping containers arranged in defensive blast perimeter at 45m - 90m
  const containerPositions = [
    { x: 38, z: 25, rot: 0.3, mat: containerTan },
    { x: 42, z: 27, rot: 0.3, mat: containerOlive },
    { x: -44, z: 28, rot: -0.4, mat: containerOlive },
    { x: -40, z: -35, rot: 1.1, mat: containerTan },
    { x: 35, z: -40, rot: -0.8, mat: containerTan },
    { x: 50, z: -15, rot: 0.0, mat: containerOlive }
  ];

  containerPositions.forEach((cp) => {
    const cont = new THREE.Mesh(new THREE.BoxGeometry(12, 3.2, 4.5), cp.mat);
    cont.position.set(cp.x, 1.6, cp.z);
    cont.rotation.y = cp.rot;
    group.add(cont);
  });

  // Concrete Jersey & T-Wall blast barriers in outer desert
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const bx = Math.cos(angle) * 75;
    const bz = Math.sin(angle) * 75;
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(6, 3.5, 0.8), concreteMat);
    barrier.position.set(bx, 1.75, bz);
    barrier.rotation.y = -angle;
    group.add(barrier);
  }

  // Steel Watchtowers at the corners
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
  const cornerTowers = [
    { x: 80, z: 80 },
    { x: -80, z: 80 },
    { x: 80, z: -80 },
    { x: -80, z: -80 }
  ];

  cornerTowers.forEach((t) => {
    // 4 legs
    const towerH = 18;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 5), containerOlive);
    cabin.position.set(t.x, towerH + 1.75, t.z);
    group.add(cabin);

    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, towerH, 6), towerMat);
    leg1.position.set(t.x - 2, towerH / 2, t.z - 2);
    group.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, towerH, 6), towerMat);
    leg2.position.set(t.x + 2, towerH / 2, t.z - 2);
    group.add(leg2);

    const leg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, towerH, 6), towerMat);
    leg3.position.set(t.x - 2, towerH / 2, t.z + 2);
    group.add(leg3);

    const leg4 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, towerH, 6), towerMat);
    leg4.position.set(t.x + 2, towerH / 2, t.z + 2);
    group.add(leg4);

    // Searchlight atop tower
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    beacon.position.set(t.x, towerH + 4, t.z);
    group.add(beacon);
  });
}

/* =========================================================================
   MAP 5: VIP PROTECTION (Executive Government Compound & Presidential Helipad)
   ========================================================================= */
function buildVIPCompoundTerrain(group: THREE.Group) {
  // 1. Manicured Stone Plaza & Interlocking Pavements
  const groundGeo = new THREE.PlaneGeometry(1600, 1600, 20, 20);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Clean architectural granite paver
    roughness: 0.65,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Manicured VIP Lawns flanking plaza
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 });
  const lawnLeft = new THREE.Mesh(new THREE.PlaneGeometry(120, 280), lawnMat);
  lawnLeft.rotation.x = -Math.PI / 2;
  lawnLeft.position.set(-110, 0.02, 0);
  group.add(lawnLeft);

  const lawnRight = new THREE.Mesh(new THREE.PlaneGeometry(120, 280), lawnMat);
  lawnRight.rotation.x = -Math.PI / 2;
  lawnRight.position.set(110, 0.02, 0);
  group.add(lawnRight);

  // 2. PLAYER'S EXECUTIVE COMMAND PAVILION TERRACE (y=6, overlooking Helipad)
  const pavilionH = 6;
  const pavilionWidth = 28;
  const pavilionDepth = 24;

  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Sleek midnight executive marble
    roughness: 0.3,
    metalness: 0.5
  });
  const pavilion = new THREE.Mesh(
    new THREE.BoxGeometry(pavilionWidth, pavilionH, pavilionDepth),
    marbleMat
  );
  pavilion.position.set(0, pavilionH / 2, 0);
  group.add(pavilion);

  // Executive floor with glass perimeter balustrade
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(pavilionWidth - 0.4, 0.25, pavilionDepth - 0.4),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
  );
  deck.position.set(0, pavilionH + 0.12, 0);
  group.add(deck);

  // High-security ballistic tinted glass railing (height 1.15m)
  const glassRailMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.9
  });
  const railH = 1.15;

  // Front Railing facing Helipad
  const frontRail = new THREE.Mesh(new THREE.BoxGeometry(pavilionWidth, railH, 0.2), glassRailMat);
  frontRail.position.set(0, pavilionH + railH / 2 + 0.15, -pavilionDepth / 2 + 0.1);
  group.add(frontRail);

  // Back Railing
  const backRail = new THREE.Mesh(new THREE.BoxGeometry(pavilionWidth, railH, 0.2), glassRailMat);
  backRail.position.set(0, pavilionH + railH / 2 + 0.15, pavilionDepth / 2 - 0.1);
  group.add(backRail);

  // Side Railings
  const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.2, railH, pavilionDepth), glassRailMat);
  leftRail.position.set(-pavilionWidth / 2 + 0.1, pavilionH + railH / 2 + 0.15, 0);
  group.add(leftRail);

  const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.2, railH, pavilionDepth), glassRailMat);
  rightRail.position.set(pavilionWidth / 2 - 0.1, pavilionH + railH / 2 + 0.15, 0);
  group.add(rightRail);

  // Sleek Tactical Command Canopy Awning
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 10), canopyMat);
  awning.position.set(0, pavilionH + 3.8, 4);
  group.add(awning);

  // 3. EXECUTIVE HELIPAD WITH TACTICAL LANDING MARKINGS (in front at z = -45)
  const helipadCenter = new THREE.Vector3(0, 0.05, -45);

  // Concrete Helipad Pad
  const padMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 0.2, 32), padMat);
  pad.position.copy(helipadCenter);
  group.add(pad);

  // Outer Yellow Circle
  const circleMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
  const yellowRing = new THREE.Mesh(new THREE.RingGeometry(18, 19.2, 40), circleMat);
  yellowRing.rotation.x = -Math.PI / 2;
  yellowRing.position.set(helipadCenter.x, 0.18, helipadCenter.z);
  group.add(yellowRing);

  // White "H" Helipad Marking in center
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const hLeft = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 9), whiteMat);
  hLeft.rotation.x = -Math.PI / 2;
  hLeft.position.set(helipadCenter.x - 3.2, 0.2, helipadCenter.z);
  group.add(hLeft);

  const hRight = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 9), whiteMat);
  hRight.rotation.x = -Math.PI / 2;
  hRight.position.set(helipadCenter.x + 3.2, 0.2, helipadCenter.z);
  group.add(hRight);

  const hMid = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.6), whiteMat);
  hMid.rotation.x = -Math.PI / 2;
  hMid.position.set(helipadCenter.x, 0.2, helipadCenter.z);
  group.add(hMid);

  // Illuminated Perimeter Green Touchdown Lights around Helipad
  const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const lx = helipadCenter.x + Math.cos(angle) * 20.5;
    const lz = helipadCenter.z + Math.sin(angle) * 20.5;

    const fixture = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    fixture.position.set(lx, 0.15, lz);
    group.add(fixture);

    const lightBulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), greenLightMat);
    lightBulb.position.set(lx, 0.35, lz);
    group.add(lightBulb);
  }

  // 4. Armored Black Executive Motorcade (SUVs parked adjacent to helipad)
  const suvMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.2, metalness: 0.9 });
  const suvGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.95 });

  const motorcadePositions = [
    { x: -30, z: -38, rot: 0.2 },
    { x: -34, z: -48, rot: 0.2 },
    { x: 30, z: -38, rot: -0.2 }
  ];

  motorcadePositions.forEach((pos) => {
    const carGroup = new THREE.Group();
    // Chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 6.8), suvMat);
    body.position.y = 1.0;
    carGroup.add(body);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 4.0), suvGlassMat);
    cabin.position.set(0, 2.0, -0.2);
    carGroup.add(cabin);

    // Flashing red & blue VIP emergency dash lights
    const blueStrobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
    );
    blueStrobe.position.set(-0.8, 2.65, 0);
    carGroup.add(blueStrobe);

    const redStrobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    redStrobe.position.set(0.8, 2.65, 0);
    carGroup.add(redStrobe);

    carGroup.position.set(pos.x, 0, pos.z);
    carGroup.rotation.y = pos.rot;
    group.add(carGroup);
  });

  // 5. High-mast Stadium Floodlight Towers illuminating compound
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
  const floodlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const floodPositions = [
    { x: -65, z: -75 },
    { x: 65, z: -75 },
    { x: -65, z: 25 },
    { x: 65, z: 25 }
  ];

  floodPositions.forEach((fp) => {
    const poleH = 22;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, poleH, 8), poleMat);
    mast.position.set(fp.x, poleH / 2, fp.z);
    group.add(mast);

    const head = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 1.5), poleMat);
    head.position.set(fp.x, poleH + 0.9, fp.z);
    head.lookAt(0, 0, -45);
    group.add(head);

    const bank = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 0.2), floodlightMat);
    bank.position.set(fp.x, poleH + 0.9, fp.z + 0.8);
    bank.lookAt(0, 0, -45);
    group.add(bank);
  });
}

/* =========================================================================
   HELPER: Rooftop Parapet Walls
   ========================================================================= */
function buildParapetWalls(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  wallColor: number,
  handrailColor: number
) {
  const parapetMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 });
  const railMat = new THREE.MeshBasicMaterial({ color: handrailColor });
  const wallThick = 0.55;
  const wallH = 1.15;

  // North (Front)
  const front = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, wallThick), parapetMat);
  front.position.set(0, h + wallH / 2 + 0.15, -d / 2 + wallThick / 2);
  group.add(front);

  const frontRail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, w, 8), railMat);
  frontRail.rotation.z = Math.PI / 2;
  frontRail.position.set(0, h + wallH + 0.2, -d / 2 + wallThick / 2);
  group.add(frontRail);

  // South (Back)
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, wallThick), parapetMat);
  back.position.set(0, h + wallH / 2 + 0.15, d / 2 - wallThick / 2);
  group.add(back);

  // West (Left)
  const left = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, d), parapetMat);
  left.position.set(-w / 2 + wallThick / 2, h + wallH / 2 + 0.15, 0);
  group.add(left);

  // East (Right)
  const right = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, d), parapetMat);
  right.position.set(w / 2 - wallThick / 2, h + wallH / 2 + 0.15, 0);
  group.add(right);
}

/* =========================================================================
   TARGET ASSET BUILDER (Tailored to each scenario and terrain)
   ========================================================================= */
function buildTargetAsset(
  assetName: string,
  terrain: TerrainType,
  baseY: number
): { assetGroup: THREE.Group; assetPosition: THREE.Vector3 } {
  const assetGroup = new THREE.Group();
  assetGroup.name = 'target_asset';

  // Position: either mounted on outpost behind player or designated ground point
  let assetPosition = new THREE.Vector3(0, baseY, 8);

  // Specialized Asset Architecture based on Map Type
  if (terrain === 'compound' || assetName.toLowerCase().includes('helipad')) {
    // Executive VIP Rotorcraft on the Helipad
    assetPosition = new THREE.Vector3(0, 0.2, -45);
    assetGroup.position.copy(assetPosition);

    // Presidential Helicopter Model
    const heliMat = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.9, roughness: 0.2 });
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });

    // Fuselage
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.8, 12), heliMat);
    body.position.y = 2.4;
    assetGroup.add(body);

    // Tail boom
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 9), heliMat);
    tail.position.set(0, 3.0, 9.5);
    assetGroup.add(tail);

    // Main Rotor Blades
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.1, 0.8), rotorMat);
    rotor.position.set(0, 4.2, 0);
    rotor.name = 'rotating_radar_plate'; // Animate rotor spin
    assetGroup.add(rotor);

    // Green VIP Status Light
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    beacon.position.set(0, 4.6, 0);
    beacon.name = 'asset_beacon';
    assetGroup.add(beacon);

    return { assetGroup, assetPosition };
  }

  if (terrain === 'desert' || assetName.toLowerCase().includes('fuel')) {
    // Strategic Fuel Storage Tanks & Ammo Depots
    assetPosition = new THREE.Vector3(0, baseY, 7);
    assetGroup.position.copy(assetPosition);

    const tankMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6, roughness: 0.4 });
    const tank1 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 4.5, 18), tankMat);
    tank1.position.set(-3.2, 2.4, 0);
    assetGroup.add(tank1);

    const tank2 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 4.5, 18), tankMat);
    tank2.position.set(3.2, 2.4, 0);
    assetGroup.add(tank2);

    // Fuel pipes
    const pipe = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 0.4, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 })
    );
    pipe.position.set(0, 3.5, 0);
    assetGroup.add(pipe);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    beacon.position.set(0, 5.2, 0);
    beacon.name = 'asset_beacon';
    assetGroup.add(beacon);

    return { assetGroup, assetPosition };
  }

  if (terrain === 'rural' || assetName.toLowerCase().includes('communication')) {
    // Strategic Early-Warning Communications Mast & Generator
    assetPosition = new THREE.Vector3(0, baseY, 7);
    assetGroup.position.copy(assetPosition);

    // Lattice Transmission Mast
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 11, 8), mastMat);
    mast.position.y = 5.5;
    assetGroup.add(mast);

    // Microwave Dish
    const dish = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 1.6, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 })
    );
    dish.rotation.x = Math.PI / 2;
    dish.position.set(0, 8.5, 0);
    dish.name = 'rotating_radar_plate';
    assetGroup.add(dish);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    beacon.position.set(0, 11.2, 0);
    beacon.name = 'asset_beacon';
    assetGroup.add(beacon);

    return { assetGroup, assetPosition };
  }

  // Default: Metropolitan Phased-Array C-UAS Radar Array
  assetPosition = new THREE.Vector3(0, baseY, 8);
  assetGroup.position.copy(assetPosition);

  // Pedestal
  const pedGeo = new THREE.CylinderGeometry(3.6, 4.2, 0.8, 16);
  const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const ped = new THREE.Mesh(pedGeo, pedMat);
  ped.position.y = 0.4;
  assetGroup.add(ped);

  // Status Ring
  const ringGeo = new THREE.RingGeometry(3.2, 3.8, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.82;
  assetGroup.add(ring);

  // Rotating Radar Array Plate
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 5.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
  );
  mast.position.y = 3.5;
  assetGroup.add(mast);

  const radarDish = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 2.5, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.6, roughness: 0.3 })
  );
  radarDish.position.set(0, 6.4, 0);
  radarDish.name = 'rotating_radar_plate';
  assetGroup.add(radarDish);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  beacon.position.set(0, 7.9, 0);
  beacon.name = 'asset_beacon';
  assetGroup.add(beacon);

  return { assetGroup, assetPosition };
}
