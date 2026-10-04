import * as THREE from 'three';
import { DroneType } from '../types/simulation';

/**
 * Procedural 3D Drone Model Generators using Three.js Geometry & Materials
 */

export function createDrone3DModel(type: DroneType): THREE.Group {
  const group = new THREE.Group();

  switch (type) {
    case 'DJI_MAVIC':
      createDJIQuadcopter(group);
      break;
    case 'FPV_KAMIKAZE':
      createFPVKamikazeDrone(group);
      break;
    case 'MILITARY_FIXED_WING':
      createMilitaryDeltaWing(group);
      break;
    case 'MICRO_SURVEILLANCE':
      createMicroSurveillanceDrone(group);
      break;
    case 'SWARM_ASSAULT':
    default:
      createSwarmTacticalDrone(group);
      break;
  }

  return group;
}

/**
 * Model 1: Commercial DJI Quadcopter (White aerodynamic body, 4 arms, camera gimbal)
 */
function createDJIQuadcopter(group: THREE.Group) {
  // Main chassis
  const bodyGeo = new THREE.BoxGeometry(0.9, 0.28, 1.4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xefefef,
    roughness: 0.35,
    metalness: 0.2
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  // Top canopy bump
  const canopyGeo = new THREE.CylinderGeometry(0.3, 0.45, 0.2, 12);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, roughness: 0.4 });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.y = 0.2;
  group.add(canopy);

  // 4 Carbon-composite arms
  const armMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6, metalness: 0.5 });
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true, opacity: 0.85 });

  const armOffsets = [
    { x: 1.1, z: 1.0, angle: Math.PI / 4 },
    { x: -1.1, z: 1.0, angle: -Math.PI / 4 },
    { x: 1.1, z: -1.0, angle: -Math.PI / 4 },
    { x: -1.1, z: -1.0, angle: Math.PI / 4 }
  ];

  armOffsets.forEach((pos, idx) => {
    // Diagonal arm
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 8);
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(pos.x * 0.5, 0.02, pos.z * 0.5);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = pos.angle;
    group.add(arm);

    // Motor bell housing
    const motorGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.18, 12);
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.set(pos.x, 0.1, pos.z);
    group.add(motor);

    // Spinning rotor prop group
    const rotorGroup = new THREE.Group();
    rotorGroup.name = `rotor_${idx}`;
    rotorGroup.position.set(pos.x, 0.22, pos.z);

    const propGeo = new THREE.BoxGeometry(1.2, 0.02, 0.12);
    const prop = new THREE.Mesh(propGeo, rotorMat);
    rotorGroup.add(prop);

    group.add(rotorGroup);
  });

  // Gimbal and camera lens on underside
  const gimbalArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.2, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  );
  gimbalArm.position.set(0, -0.2, 0.45);
  group.add(gimbalArm);

  const cameraSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9 })
  );
  cameraSphere.position.set(0, -0.32, 0.5);
  group.add(cameraSphere);

  // Status LED (Green rear, Red front)
  const frontLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0044 })
  );
  frontLed.position.set(0, 0.05, 0.72);
  group.add(frontLed);
}

/**
 * Model 2: High-Speed FPV Kamikaze Drone (Carbon X-frame, battery, forward cam, warhead)
 */
function createFPVKamikazeDrone(group: THREE.Group) {
  // Carbon plate frame (X-Shape)
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x1f1f23, roughness: 0.5, metalness: 0.6 });
  const frameGeo = new THREE.BoxGeometry(0.35, 0.08, 0.7);
  const frame = new THREE.Mesh(frameGeo, plateMat);
  group.add(frame);

  // Exposed LiPo battery strapped on top
  const lipoGeo = new THREE.BoxGeometry(0.28, 0.22, 0.5);
  const lipoMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }); // Yellow/orange shrinkwrap
  const lipo = new THREE.Mesh(lipoGeo, lipoMat);
  lipo.position.set(0, 0.14, -0.05);
  group.add(lipo);

  // 4 Rigid Carbon Motor Arms
  const armMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
  const propMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 }); // Bright blue props

  const positions = [
    { x: 0.75, z: 0.65 },
    { x: -0.75, z: 0.65 },
    { x: 0.75, z: -0.65 },
    { x: -0.75, z: -0.65 }
  ];

  positions.forEach((pos, idx) => {
    const armGeo = new THREE.BoxGeometry(0.1, 0.04, 0.9);
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(pos.x * 0.5, 0, pos.z * 0.5);
    arm.rotation.y = (pos.x * pos.z > 0) ? Math.PI / 4 : -Math.PI / 4;
    group.add(arm);

    // Motor
    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.14, 10),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    motor.position.set(pos.x, 0.08, pos.z);
    group.add(motor);

    // Triblade prop group
    const rotorGroup = new THREE.Group();
    rotorGroup.name = `rotor_${idx}`;
    rotorGroup.position.set(pos.x, 0.17, pos.z);

    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.08), propMat);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.08), propMat);
    b2.rotation.y = Math.PI / 3;
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.08), propMat);
    b3.rotation.y = (2 * Math.PI) / 3;
    rotorGroup.add(b1, b2, b3);

    group.add(rotorGroup);
  });

  // Tilted FPV Micro-Camera at 45 degree angle
  const camGeo = new THREE.BoxGeometry(0.12, 0.12, 0.15);
  const camMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
  const cam = new THREE.Mesh(camGeo, camMat);
  cam.position.set(0, 0.08, 0.38);
  cam.rotation.x = -Math.PI / 5;
  group.add(cam);

  // Kamikaze Explosive Warhead (Cylindrical shaped charge underneath)
  const warheadGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.6, 12);
  const warheadMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.4 }); // Dark red/maroon
  const warhead = new THREE.Mesh(warheadGeo, warheadMat);
  warhead.rotation.x = Math.PI / 2;
  warhead.position.set(0, -0.15, 0.05);
  group.add(warhead);

  // Rear LED strip for racing/FPV orientation
  const ledStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.04, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee })
  );
  ledStrip.position.set(0, 0.04, -0.36);
  group.add(ledStrip);
}

/**
 * Model 3: Military Recon Fixed-Wing Delta UAV (Wide stealth wings, pusher prop)
 */
function createMilitaryDeltaWing(group: THREE.Group) {
  const stealthMat = new THREE.MeshStandardMaterial({
    color: 0x26292e,
    roughness: 0.45,
    metalness: 0.4
  });

  // Delta Wing Fuselage
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 1.8); // Nose
  wingShape.lineTo(2.4, -0.9); // Right wingtip
  wingShape.lineTo(1.8, -1.1);
  wingShape.lineTo(0.5, -1.0); // Center rear
  wingShape.lineTo(-0.5, -1.0);
  wingShape.lineTo(-1.8, -1.1);
  wingShape.lineTo(-2.4, -0.9); // Left wingtip
  wingShape.closePath();

  const extrudeSettings = { depth: 0.22, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.06, bevelThickness: 0.06 };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  const wing = new THREE.Mesh(wingGeo, stealthMat);
  wing.rotation.x = Math.PI / 2;
  wing.position.y = 0.05;
  group.add(wing);

  // Twin Vertical Winglets
  const wingletGeo = new THREE.BoxGeometry(0.04, 0.55, 0.45);
  const leftWinglet = new THREE.Mesh(wingletGeo, stealthMat);
  leftWinglet.position.set(-2.2, 0.28, -0.85);
  const rightWinglet = new THREE.Mesh(wingletGeo, stealthMat);
  rightWinglet.position.set(2.2, 0.28, -0.85);
  group.add(leftWinglet, rightWinglet);

  // Nose EO/IR Optronic Turret Dome
  const domeGeo = new THREE.SphereGeometry(0.24, 12, 12);
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x090a0f, roughness: 0.1, metalness: 0.95 });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.set(0, -0.1, 1.4);
  group.add(dome);

  // Rear Pusher Propeller
  const propMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const pusherRotor = new THREE.Group();
  pusherRotor.name = 'rotor_0';
  pusherRotor.position.set(0, 0, -1.15);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.08), propMat);
  blade.rotation.x = Math.PI / 2;
  pusherRotor.add(blade);
  group.add(pusherRotor);
}

/**
 * Model 4: Micro Surveillance Drone (Nano stealth quad)
 */
function createMicroSurveillanceDrone(group: THREE.Group) {
  const nanoMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
  
  // Sleek pod
  const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.4, 8, 12), nanoMat);
  pod.rotation.x = Math.PI / 2;
  group.add(pod);

  // 4 Micro Arms
  const armCoords = [
    { x: 0.45, z: 0.4 },
    { x: -0.45, z: 0.4 },
    { x: 0.45, z: -0.4 },
    { x: -0.45, z: -0.4 }
  ];

  armCoords.forEach((c, idx) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), nanoMat);
    arm.position.set(c.x * 0.5, 0, c.z * 0.5);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = (c.x * c.z > 0) ? Math.PI / 4 : -Math.PI / 4;
    group.add(arm);

    const microRotor = new THREE.Group();
    microRotor.name = `rotor_${idx}`;
    microRotor.position.set(c.x, 0.08, c.z);

    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.015, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x52525b, transparent: true, opacity: 0.8 })
    );
    microRotor.add(blade);
    group.add(microRotor);
  });

  // Whip Antenna
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.4, 4),
    new THREE.MeshBasicMaterial({ color: 0xa1a1aa })
  );
  antenna.position.set(0, 0.22, -0.2);
  antenna.rotation.x = -Math.PI / 6;
  group.add(antenna);
}

/**
 * Model 5: Swarm Assault Tactical Drone (Aggressive frame with pulsating formation beacon)
 */
function createSwarmTacticalDrone(group: THREE.Group) {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
  
  // Central hexagonal core
  const coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.22, 6);
  const core = new THREE.Mesh(coreGeo, frameMat);
  group.add(core);

  // Pulsating Boids Swarm Network Beacon
  const beaconGeo = new THREE.SphereGeometry(0.16, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 }); // Purple swarm sync light
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 0.2;
  beacon.name = 'swarm_beacon';
  group.add(beacon);

  // 4 Heavy duty arms
  const armOffsets = [
    { x: 0.9, z: 0.8 },
    { x: -0.9, z: 0.8 },
    { x: 0.9, z: -0.8 },
    { x: -0.9, z: -0.8 }
  ];

  armOffsets.forEach((pos, idx) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 1.2), frameMat);
    arm.position.set(pos.x * 0.5, 0, pos.z * 0.5);
    arm.rotation.y = (pos.x * pos.z > 0) ? Math.PI / 4 : -Math.PI / 4;
    group.add(arm);

    // Motor
    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.16, 10),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    motor.position.set(pos.x, 0.08, pos.z);
    group.add(motor);

    // Swarm Rotor
    const rotor = new THREE.Group();
    rotor.name = `rotor_${idx}`;
    rotor.position.set(pos.x, 0.18, pos.z);

    const b = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.02, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xc084fc, transparent: true, opacity: 0.85 })
    );
    rotor.add(b);
    group.add(rotor);
  });
}
