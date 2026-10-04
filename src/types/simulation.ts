import * as THREE from 'three';

export type DroneType = 'DJI_MAVIC' | 'FPV_KAMIKAZE' | 'MILITARY_FIXED_WING' | 'MICRO_SURVEILLANCE' | 'SWARM_ASSAULT';

export type DroneState = 'ACTIVE' | 'EVADING' | 'JAMMED' | 'NET_ENTANGLED' | 'FALLING' | 'DESTROYED' | 'TARGET_REACHED';

export interface DroneEntity {
  id: string;
  name: string;
  type: DroneType;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  angularVelocity?: THREE.Vector3;
  health: number; // 0 - 100
  maxHealth: number;
  speed: number;
  state: DroneState;
  jammingEffect: number; // 0 (none) to 1 (full link loss)
  jammingResistance: number; // 0.1 - 0.8
  evasionCooldown: number;
  targetOffset: THREE.Vector3;
  altitudeTarget: number;
  mesh?: THREE.Group;
  rotorSpeed: number;
  signalStrength: number; // RF emission dBm
  rfFrequency: string; // e.g. "2.4 GHz", "5.8 GHz", "433 MHz"
}

export type WeaponType = 'RF_JAMMER' | 'SHOTGUN' | 'NET_GUN';

export interface WeaponState {
  type: WeaponType;
  name: string;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  cooldown: number;
  effectiveRange: number; // in meters
}

export type SensorLayer = 'EO' | 'IR_WHITE_HOT' | 'IR_BLACK_HOT' | 'RF_HEATMAP';

export type WeatherType = 'clear' | 'fog' | 'rain';
export type TimeOfDay = 'day' | 'night';
export type TerrainType = 'urban' | 'rural';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Elite';
  terrain: TerrainType;
  weather: WeatherType;
  time_of_day: TimeOfDay;
  drone_count: number;
  threat_types: string[];
  target_asset: string;
}

export interface SimulationEvent {
  id: string;
  timestampMs: number;
  eventType: 'DETECTION' | 'SHOT_FIRED' | 'SHOT_HIT' | 'JAMMING_START' | 'JAMMING_EFFECTIVE' | 'DRONE_NEUTRALIZED' | 'ASSET_DAMAGED' | 'INSTRUCTOR_INJECTION';
  droneId?: string;
  droneType?: string;
  details: string;
}

export interface ReplayFrame {
  timestampMs: number;
  drones: {
    id: string;
    type: DroneType;
    position: [number, number, number];
    state: DroneState;
    health: number;
  }[];
  projectiles: {
    id: string;
    position: [number, number, number];
    type: 'PELLET' | 'NET';
  }[];
  isJamming: boolean;
  aimDirection: [number, number, number];
  assetHealth: number;
}

export interface SessionResult {
  sessionId: string;
  scenarioId: string;
  scenarioTitle: string;
  durationSeconds: number;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  neutralizedCount: number;
  totalDrones: number;
  shotsFired: number;
  shotsHit: number;
  accuracyPercent: number;
  jammingPulses: number;
  jammingEfficiencyPercent: number;
  assetDamage: number;
  averageReactionTimeMs: number;
  outcome: 'VICTORY' | 'DEFEAT' | 'MISSION_ABORT';
  events: SimulationEvent[];
  replayFrames: ReplayFrame[];
}

export interface Projectile {
  id: string;
  type: 'PELLET' | 'NET';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number; // in seconds
  spreadFactor?: number;
  mesh?: THREE.Object3D;
  netScale?: number;
}
