import * as THREE from 'three';
import { DroneEntity, DroneType } from '../types/simulation';

/**
 * 3D Boids Swarm Algorithm & Threat AI Engine with Evasive Tactics & Jamming Dynamics
 */

export interface BoidsParameters {
  separationDistance: number;
  neighborRadius: number;
  separationWeight: number;
  alignmentWeight: number;
  cohesionWeight: number;
  targetWeight: number;
  maxSpeed: number;
  maxForce: number;
}

export const DEFAULT_BOIDS_CONFIG: BoidsParameters = {
  separationDistance: 14,
  neighborRadius: 45,
  separationWeight: 1.8,
  alignmentWeight: 1.1,
  cohesionWeight: 1.0,
  targetWeight: 1.4,
  maxSpeed: 28,
  maxForce: 0.6
};

export class BoidsSwarmController {
  private config: BoidsParameters;

  constructor(config: Partial<BoidsParameters> = {}) {
    this.config = { ...DEFAULT_BOIDS_CONFIG, ...config };
  }

  /**
   * Main AI Update step for all active drones
   */
  public update(
    drones: DroneEntity[],
    deltaSeconds: number,
    targetAssetPos: THREE.Vector3,
    playerAimRay?: THREE.Ray,
    isJammingActive: boolean = false,
    jammerConeAngle: number = 0.35 // radians (~20 deg cone)
  ) {
    const activeDrones = drones.filter((d) => d.state === 'ACTIVE' || d.state === 'EVADING');

    for (let i = 0; i < drones.length; i++) {
      const drone = drones[i];

      // Handle FALLING, NET_ENTANGLED or DESTROYED drones
      if (drone.state === 'FALLING' || drone.state === 'NET_ENTANGLED' || drone.state === 'DESTROYED') {
        if (drone.state !== 'DESTROYED') {
          drone.velocity.y -= (drone.state === 'NET_ENTANGLED' ? 32 : 22) * deltaSeconds;
          drone.velocity.x *= 0.98;
          drone.velocity.z *= 0.98;
          drone.position.addScaledVector(drone.velocity, deltaSeconds);

          if (!drone.angularVelocity) {
            drone.angularVelocity = new THREE.Vector3(
              (Math.random() - 0.5) * 14,
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 14
            );
          }
          drone.rotation.x += drone.angularVelocity.x * deltaSeconds;
          drone.rotation.y += drone.angularVelocity.y * deltaSeconds;
          drone.rotation.z += drone.angularVelocity.z * deltaSeconds;

          if (drone.position.y <= 0.6) {
            drone.position.y = 0.6;
            drone.velocity.set(0, 0, 0);
            drone.state = 'DESTROYED';
          }
        }
        continue;
      }

      // Handle JAMMED state (GPS/C2 loss -> failsafe descent or erratic spiral)
      if (drone.state === 'JAMMED') {
        drone.velocity.x *= 0.94;
        drone.velocity.z *= 0.94;
        drone.velocity.y = -6; // Slow failsafe auto-landing descent
        drone.position.addScaledVector(drone.velocity, deltaSeconds);
        drone.rotation.y += 2.5 * deltaSeconds; // Spinning on axis

        if (drone.position.y <= 1.0) {
          drone.position.y = 1.0;
          drone.state = 'DESTROYED';
        }
        continue;
      }

      // 1. Check RF Jamming exposure
      if (isJammingActive && playerAimRay) {
        const toDrone = drone.position.clone().sub(playerAimRay.origin);
        const dist = toDrone.length();
        toDrone.normalize();

        const dot = playerAimRay.direction.dot(toDrone);
        const angle = Math.acos(Math.min(Math.max(dot, -1), 1));

        // Within conical beam (and within 380m effective range)
        if (angle < jammerConeAngle && dist < 380) {
          const intensity = (1 - angle / jammerConeAngle) * (1 - dist / 400);
          const effectiveRate = Math.max(0.2, 1.4 - drone.jammingResistance);
          drone.jammingEffect = Math.min(1.0, drone.jammingEffect + intensity * effectiveRate * deltaSeconds * 2.8);

          if (drone.jammingEffect >= 1.0) {
            drone.health = 0;
            drone.state = 'JAMMED';
            continue;
          }
        } else {
          // Slowly recover signal if out of beam
          drone.jammingEffect = Math.max(0, drone.jammingEffect - deltaSeconds * 0.4);
        }
      } else {
        drone.jammingEffect = Math.max(0, drone.jammingEffect - deltaSeconds * 0.4);
      }

      // 2. Check Threat Locking / Player Aim for Evasive Maneuvers
      if (playerAimRay && drone.evasionCooldown <= 0) {
        const toDrone = drone.position.clone().sub(playerAimRay.origin);
        const dist = toDrone.length();
        toDrone.normalize();

        const dot = playerAimRay.direction.dot(toDrone);
        // Player crosshair is directly on drone
        if (dot > 0.992 && dist < 300) {
          // Trigger high-G evasive maneuver
          drone.state = 'EVADING';
          drone.evasionCooldown = 3.5; // Cooldown before next roll

          // Random lateral jink force
          const lateralDir = new THREE.Vector3(
            (Math.random() - 0.5) * 45,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 45
          );
          drone.velocity.add(lateralDir);
        }
      } else if (drone.evasionCooldown > 0) {
        drone.evasionCooldown -= deltaSeconds;
        if (drone.evasionCooldown <= 2.2 && drone.state === 'EVADING') {
          drone.state = 'ACTIVE';
        }
      }

      // 3. Compute Boids Flocking Forces (Separation, Alignment, Cohesion)
      const separation = this.computeSeparation(drone, activeDrones);
      const alignment = this.computeAlignment(drone, activeDrones);
      const cohesion = this.computeCohesion(drone, activeDrones);

      // 4. Target Seeking Force (Base Asset at 0, 0, 0)
      const targetPos = targetAssetPos.clone().add(drone.targetOffset);
      const targetSteer = this.computeTargetSteer(drone, targetPos);

      // 5. Altitude & Terrain Avoidance Force
      const terrainAvoidance = new THREE.Vector3();
      const minAltitude = 8;
      const targetAltitude = drone.altitudeTarget || 22;
      if (drone.position.y < minAltitude) {
        terrainAvoidance.y = (minAltitude - drone.position.y) * 4;
      } else if (Math.abs(drone.position.y - targetAltitude) > 3) {
        terrainAvoidance.y = (targetAltitude - drone.position.y) * 0.8;
      }

      // Apply weights
      separation.multiplyScalar(this.config.separationWeight);
      alignment.multiplyScalar(this.config.alignmentWeight);
      cohesion.multiplyScalar(this.config.cohesionWeight);
      targetSteer.multiplyScalar(this.config.targetWeight);

      // Sum all acceleration forces
      const acceleration = new THREE.Vector3();
      acceleration.add(separation);
      acceleration.add(alignment);
      acceleration.add(cohesion);
      acceleration.add(targetSteer);
      acceleration.add(terrainAvoidance);

      // Specific behavioral modifiers by drone type
      if (drone.type === 'FPV_KAMIKAZE') {
        // High speed zig-zag erratic oscillation
        acceleration.x += Math.sin(Date.now() * 0.006 + i) * 12;
        acceleration.z += Math.cos(Date.now() * 0.007 + i) * 12;
        acceleration.clampLength(0, this.config.maxForce * 2.2);
      } else if (drone.type === 'MILITARY_FIXED_WING') {
        // Broad sweeping turns, maintain high horizontal speed
        acceleration.clampLength(0, this.config.maxForce * 0.8);
      } else {
        acceleration.clampLength(0, this.config.maxForce);
      }

      // Integrate velocity and position
      drone.velocity.addScaledVector(acceleration, deltaSeconds);
      const currentMaxSpeed = drone.speed || this.config.maxSpeed;
      drone.velocity.clampLength(4, currentMaxSpeed);

      drone.position.addScaledVector(drone.velocity, deltaSeconds);

      // Orient drone along flight path with banking roll
      if (drone.velocity.lengthSq() > 0.1) {
        const heading = Math.atan2(drone.velocity.x, drone.velocity.z);
        drone.rotation.y = heading;

        // Banking roll proportional to yaw turning rate
        const pitch = -Math.atan2(drone.velocity.y, Math.sqrt(drone.velocity.x * drone.velocity.x + drone.velocity.z * drone.velocity.z));
        drone.rotation.x = pitch;
        drone.rotation.z = THREE.MathUtils.clamp(-drone.velocity.x * 0.04, -0.6, 0.6);
      }

      // Check if drone reached the defended target asset
      const distToAsset = drone.position.distanceTo(targetAssetPos);
      if (distToAsset < 14) {
        drone.state = 'TARGET_REACHED';
      }
    }
  }

  private computeSeparation(drone: DroneEntity, neighbors: DroneEntity[]): THREE.Vector3 {
    const steer = new THREE.Vector3();
    let count = 0;

    for (const other of neighbors) {
      if (other.id === drone.id) continue;
      const d = drone.position.distanceTo(other.position);
      if (d > 0 && d < this.config.separationDistance) {
        const diff = drone.position.clone().sub(other.position);
        diff.normalize();
        diff.divideScalar(d); // Closer = stronger repulsion
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.divideScalar(count);
      steer.clampLength(0, this.config.maxForce);
    }
    return steer;
  }

  private computeAlignment(drone: DroneEntity, neighbors: DroneEntity[]): THREE.Vector3 {
    const avgVelocity = new THREE.Vector3();
    let count = 0;

    for (const other of neighbors) {
      if (other.id === drone.id) continue;
      const d = drone.position.distanceTo(other.position);
      if (d > 0 && d < this.config.neighborRadius) {
        avgVelocity.add(other.velocity);
        count++;
      }
    }

    if (count > 0) {
      avgVelocity.divideScalar(count);
      avgVelocity.normalize();
      avgVelocity.multiplyScalar(this.config.maxSpeed);
      const steer = avgVelocity.sub(drone.velocity);
      steer.clampLength(0, this.config.maxForce);
      return steer;
    }
    return new THREE.Vector3();
  }

  private computeCohesion(drone: DroneEntity, neighbors: DroneEntity[]): THREE.Vector3 {
    const centerOfMass = new THREE.Vector3();
    let count = 0;

    for (const other of neighbors) {
      if (other.id === drone.id) continue;
      const d = drone.position.distanceTo(other.position);
      if (d > 0 && d < this.config.neighborRadius) {
        centerOfMass.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      centerOfMass.divideScalar(count);
      return this.computeTargetSteer(drone, centerOfMass);
    }
    return new THREE.Vector3();
  }

  private computeTargetSteer(drone: DroneEntity, target: THREE.Vector3): THREE.Vector3 {
    const desired = target.clone().sub(drone.position);
    desired.normalize();
    desired.multiplyScalar(drone.speed || this.config.maxSpeed);
    const steer = desired.sub(drone.velocity);
    steer.clampLength(0, this.config.maxForce);
    return steer;
  }
}

/**
 * Procedural Wave Threat Generator
 */
export function generateThreatWave(
  count: number,
  allowedTypes: DroneType[],
  spawnDistance: number = 115
): DroneEntity[] {
  const drones: DroneEntity[] = [];
  // Center spawn cone directly in front of player outpost (-Z axis)
  const baseAngle = -Math.PI / 2;

  for (let i = 0; i < count; i++) {
    const type = allowedTypes[i % allowedTypes.length];
    // Spread evenly across field of view (-35 deg to +35 deg)
    const angleSpread = baseAngle + (i - (count - 1) / 2) * 0.28 + (Math.random() - 0.5) * 0.08;
    const distance = spawnDistance + (Math.random() - 0.5) * 35;

    const x = Math.cos(angleSpread) * distance;
    const z = Math.sin(angleSpread) * distance;
    // Altitude elevated above rooftop (14m) into open airspace (24m - 36m)
    const y = 24 + Math.random() * 12;

    let speed = 22;
    let maxHealth = 60;
    let rfFreq = '2.4 GHz';
    let jamResist = 0.25;

    if (type === 'FPV_KAMIKAZE') {
      speed = 36;
      maxHealth = 40;
      rfFreq = '5.8 GHz';
      jamResist = 0.15;
    } else if (type === 'MILITARY_FIXED_WING') {
      speed = 28;
      maxHealth = 130;
      rfFreq = '433 MHz / Satcom';
      jamResist = 0.65;
    } else if (type === 'SWARM_ASSAULT') {
      speed = 26;
      maxHealth = 50;
      rfFreq = '915 MHz Mesh';
      jamResist = 0.45;
    } else if (type === 'MICRO_SURVEILLANCE') {
      speed = 16;
      maxHealth = 30;
      rfFreq = '2.4 GHz';
      jamResist = 0.2;
    }

    const drone: DroneEntity = {
      id: `drone-${Date.now()}-${i}`,
      name: `${type.replace('_', ' ')} #${i + 1}`,
      type,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(-x, 0, -z).normalize().multiplyScalar(speed * 0.5),
      rotation: new THREE.Euler(0, 0, 0),
      health: maxHealth,
      maxHealth,
      speed,
      state: 'ACTIVE',
      jammingEffect: 0,
      jammingResistance: jamResist,
      evasionCooldown: 0,
      targetOffset: new THREE.Vector3((Math.random() - 0.5) * 15, Math.random() * 8, (Math.random() - 0.5) * 15),
      altitudeTarget: y,
      rotorSpeed: 25,
      signalStrength: -45 - Math.random() * 15,
      rfFrequency: rfFreq
    };

    drones.push(drone);
  }

  return drones;
}
