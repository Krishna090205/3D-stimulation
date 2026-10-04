import * as THREE from 'three';
import { DroneEntity, Projectile } from '../types/simulation';

/**
 * Ballistics & Kinetic Interception Physics Engine
 */

export interface BallisticHitResult {
  hitDroneId: string;
  damage: number;
  isNeutralized: boolean;
  hitPosition: THREE.Vector3;
  weaponType: 'SHOTGUN' | 'NET_GUN' | 'SNIPER';
}


export class BallisticsEngine {
  private projectiles: Projectile[] = [];

  /**
   * Fires a Shotgun blast: Spawns 12 high-velocity buckshot pellets with radial dispersion
   */
  public fireShotgun(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    pelletCount: number = 12,
    spreadRadius: number = 0.045 // angular spread radians
  ): Projectile[] {
    const spawned: Projectile[] = [];
    const speed = 280; // m/s muzzle velocity

    for (let i = 0; i < pelletCount; i++) {
      // Calculate randomized spread vector
      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * spreadRadius * 2,
        (Math.random() - 0.5) * spreadRadius * 2,
        (Math.random() - 0.5) * spreadRadius * 2
      );
      const vel = direction.clone().add(spread).normalize().multiplyScalar(speed);

      const proj: Projectile = {
        id: `pellet-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'PELLET',
        position: origin.clone(),
        velocity: vel,
        lifetime: 1.2, // ~330m range before despawn
        spreadFactor: 0.15
      };

      this.projectiles.push(proj);
      spawned.push(proj);
    }

    return spawned;
  }

  /**
   * Fires a Pneumatic Net-Gun: Parabolic arc with expanding capture net
   */
  public fireNetGun(origin: THREE.Vector3, direction: THREE.Vector3): Projectile {
    const speed = 95; // m/s launch velocity
    const vel = direction.clone().multiplyScalar(speed);
    // Slight upward compensation for heavy net projectile
    vel.y += 3.5;

    const proj: Projectile = {
      id: `net-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'NET',
      position: origin.clone(),
      velocity: vel,
      lifetime: 3.5,
      netScale: 0.4
    };

    this.projectiles.push(proj);
    return proj;
  }

  /**
   * Fires a High-Caliber Anti-Materiel Sniper round: Supersonic, near-flat trajectory, devastating impact
   */
  public fireSniper(origin: THREE.Vector3, direction: THREE.Vector3): Projectile {
    const speed = 850; // m/s supersonic muzzle velocity
    const vel = direction.clone().normalize().multiplyScalar(speed);

    const proj: Projectile = {
      id: `sniper-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'SNIPER_BULLET',
      position: origin.clone(),
      velocity: vel,
      lifetime: 2.2, // ~1800m extreme range
      spreadFactor: 0.001
    };

    this.projectiles.push(proj);
    return proj;
  }

  /**
   * Physics Integration & Hit-Scan Collision Detection against 3D Drones
   */
  public update(deltaSeconds: number, drones: DroneEntity[]): BallisticHitResult[] {
    const hits: BallisticHitResult[] = [];
    const gravity = new THREE.Vector3(0, -9.81, 0);

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      p.lifetime -= deltaSeconds;
      if (p.lifetime <= 0 || p.position.y <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Apply gravity drop & aerodynamic drag
      if (p.type === 'NET') {
        p.velocity.addScaledVector(gravity, deltaSeconds * 1.8);
        p.velocity.multiplyScalar(Math.pow(0.96, deltaSeconds * 60)); // Air resistance
        p.netScale = Math.min(4.8, (p.netScale || 0.4) + deltaSeconds * 3.5); // Expanding net diameter
      } else if (p.type === 'SNIPER_BULLET') {
        p.velocity.addScaledVector(gravity, deltaSeconds * 0.12); // Extremely flat supersonic flight
      } else {
        p.velocity.addScaledVector(gravity, deltaSeconds * 0.4); // Pellets drop slightly
      }

      const prevPos = p.position.clone();
      p.position.addScaledVector(p.velocity, deltaSeconds);
      const nextPos = p.position;

      // Segment raycast for bullet tunnel prevention
      const rayDir = nextPos.clone().sub(prevPos);
      const segLength = rayDir.length();
      rayDir.normalize();

      // Check collision against each active drone
      let projectileConsumed = false;

      for (const drone of drones) {
        if (drone.state !== 'ACTIVE' && drone.state !== 'EVADING') continue;

        // Collision radius depends on drone type & weapon
        let hitRadius = 1.8;
        if (drone.type === 'MILITARY_FIXED_WING') hitRadius = 3.2;
        if (drone.type === 'MICRO_SURVEILLANCE') hitRadius = 1.0;

        if (p.type === 'NET') {
          hitRadius += (p.netScale || 1.0) * 0.7; // Large net hit box
        }

        // Distance from drone center to line segment [prevPos -> nextPos]
        const toDrone = drone.position.clone().sub(prevPos);
        const projection = toDrone.dot(rayDir);

        if (projection >= 0 && projection <= segLength) {
          const closestPoint = prevPos.clone().addScaledVector(rayDir, projection);
          const distToPath = closestPoint.distanceTo(drone.position);

          if (distToPath <= hitRadius) {
            // Impact registered!
            projectileConsumed = true;

            let damage = 0;
            let neutralized = false;

            if (p.type === 'NET') {
              // Net immediately entangles drone rotors
              damage = drone.health;
              drone.health = 0;
              drone.state = 'NET_ENTANGLED';
              neutralized = true;

              hits.push({
                hitDroneId: drone.id,
                damage,
                isNeutralized: neutralized,
                hitPosition: closestPoint,
                weaponType: 'NET_GUN'
              });
            } else if (p.type === 'SNIPER_BULLET') {
              // High-velocity armor piercing sniper impact: Devastating direct kinetic damage
              damage = 100;
              drone.health = 0;
              drone.state = 'FALLING';
              drone.velocity.y = -14;
              drone.velocity.x += (Math.random() - 0.5) * 8;
              drone.velocity.z += (Math.random() - 0.5) * 8;
              drone.angularVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 22,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 22
              );
              neutralized = true;

              hits.push({
                hitDroneId: drone.id,
                damage,
                isNeutralized: neutralized,
                hitPosition: closestPoint,
                weaponType: 'SNIPER'
              });
            } else {
              // Shotgun pellet impact
              damage = 28 + Math.random() * 12;
              drone.health = Math.max(0, drone.health - damage);

              if (drone.health <= 0) {
                drone.state = 'FALLING';
                drone.velocity.y = -8;
                drone.velocity.x += (Math.random() - 0.5) * 10;
                drone.velocity.z += (Math.random() - 0.5) * 10;
                drone.angularVelocity = new THREE.Vector3(
                  (Math.random() - 0.5) * 16,
                  (Math.random() - 0.5) * 8,
                  (Math.random() - 0.5) * 16
                );
                neutralized = true;
              }

              hits.push({
                hitDroneId: drone.id,
                damage,
                isNeutralized: neutralized,
                hitPosition: closestPoint,
                weaponType: 'SHOTGUN'
              });
            }

            break; // Stop checking other drones for this projectile

          }
        }
      }

      if (projectileConsumed) {
        this.projectiles.splice(i, 1);
      }
    }

    return hits;
  }

  public getActiveProjectiles(): Projectile[] {
    return this.projectiles;
  }

  public clear() {
    this.projectiles = [];
  }
}

/**
 * Calculates Lead Interception Aim Marker for moving drone target
 */
export function calculateLeadIndicator(
  gunPos: THREE.Vector3,
  dronePos: THREE.Vector3,
  droneVelocity: THREE.Vector3,
  bulletSpeed: number = 280
): THREE.Vector3 {
  const dist = gunPos.distanceTo(dronePos);
  const timeToImpact = dist / bulletSpeed;
  // Lead point = current position + velocity * timeToImpact
  const leadPoint = dronePos.clone().addScaledVector(droneVelocity, timeToImpact);
  // Gravity drop compensation
  leadPoint.y += 0.5 * 9.81 * (timeToImpact * timeToImpact) * 0.4;
  return leadPoint;
}
