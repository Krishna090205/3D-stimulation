import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  DroneEntity,
  DroneType,
  WeaponType,
  WeaponState,
  SensorLayer,
  Scenario,
  SimulationEvent,
  ReplayFrame,
  SessionResult
} from '../types/simulation';
import { useTheme } from '../context/ThemeContext';
import { buildEnvironment } from '../simulation/Terrain';
import { createDrone3DModel } from '../simulation/DroneModels';
import { BoidsSwarmController, generateThreatWave } from '../simulation/BoidsSwarm';
import { BallisticsEngine, calculateLeadIndicator } from '../simulation/Ballistics';
import { spatialAudio } from '../services/audioService';
import { endTrainingSession } from '../services/apiService';
import {
  Radio,
  Radar,
  Eye,
  Crosshair,
  Flame,
  CheckCircle2,
  Clock,
  Target,
  Shield,
  Play,
  Pause,
  ChevronDown,
  User,
  Star,
  RotateCw
} from 'lucide-react';

interface TrainingCanvasProps {
  scenario: Scenario;
  sessionId: string;
  onFinishSession: (result: SessionResult) => void;
  onAbortSession: () => void;
  onOpenSettings: () => void;
}

function createFPSWeaponModel(): {
  root: THREE.Group;
  muzzleLight: THREE.PointLight;
  muzzleFlashMesh: THREE.Mesh;
  muzzlePos: THREE.Vector3;
} {
  const group = new THREE.Group();
  group.name = 'fps_weapon_rifle';

  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1a212b,
    roughness: 0.4,
    metalness: 0.8
  });
  const darkPartsMat = new THREE.MeshStandardMaterial({
    color: 0x0f141a,
    roughness: 0.85,
    metalness: 0.1
  });
  const opticLensMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.7
  });

  // Main receiver body
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.085, 0.42), gunMetalMat);
  receiver.position.set(0, 0, 0);
  group.add(receiver);

  // Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.44, 12), gunMetalMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.012, -0.42);
  group.add(barrel);

  // Muzzle tip
  const muzzleTip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 12), darkPartsMat);
  muzzleTip.rotation.x = Math.PI / 2;
  muzzleTip.position.set(0, 0.012, -0.66);
  group.add(muzzleTip);

  // Handguard shroud
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.065, 0.28), gunMetalMat);
  handguard.position.set(0, 0.012, -0.24);
  group.add(handguard);

  // Picatinny top rail
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.012, 0.36), darkPartsMat);
  rail.position.set(0, 0.048, -0.06);
  group.add(rail);

  // Holographic Optic Sight
  const optic = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.048, 0.08), darkPartsMat);
  optic.position.set(0, 0.078, -0.05);
  group.add(optic);

  const opticLens = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.005), opticLensMat);
  opticLens.position.set(0, 0.078, -0.09);
  group.add(opticLens);

  // Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.15, 0.07), darkPartsMat);
  mag.position.set(0, -0.1, -0.04);
  mag.rotation.x = 0.18;
  group.add(mag);

  // Pistol grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.13, 0.055), darkPartsMat);
  grip.position.set(0, -0.08, 0.12);
  grip.rotation.x = -0.32;
  group.add(grip);

  // Tactical gloved hands
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.09), gloveMat);
  rightHand.position.set(0.005, -0.08, 0.12);
  group.add(rightHand);

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.065, 0.085), gloveMat);
  leftHand.position.set(-0.02, -0.02, -0.22);
  group.add(leftHand);

  // Muzzle flash light
  const muzzleLight = new THREE.PointLight(0xffaa22, 0, 16);
  muzzleLight.position.set(0, 0.012, -0.72);
  group.add(muzzleLight);

  // 3D Muzzle Flash Spike Mesh
  const flashGeo = new THREE.OctahedronGeometry(0.045, 0);
  flashGeo.scale(1, 1, 2.5);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xfff0aa,
    transparent: true,
    opacity: 0
  });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  flashMesh.position.set(0, 0.012, -0.74);
  group.add(flashMesh);

  return { root: group, muzzleLight, muzzleFlashMesh: flashMesh, muzzlePos: new THREE.Vector3(0, 0.012, -0.72) };
}

export const TrainingCanvas: React.FC<TrainingCanvasProps> = ({
  scenario,
  sessionId,
  onFinishSession,
  onAbortSession,
  onOpenSettings
}) => {
  const { theme, isDark } = useTheme();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rfHeatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Arsenal state
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('RF_JAMMER');
  const [isJammingActive, setIsJammingActive] = useState<boolean>(false);
  const [activeSensorView, setActiveSensorView] = useState<'RF' | 'RADAR' | 'EO_IR'>('RF');
  const [eoIrMode, setEoIrMode] = useState<'Visual' | 'Thermal'>('Thermal');
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(true);
  const [timelineSpeed, setTimelineSpeed] = useState<number>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(135); // 02:15 default

  // Defended Asset Integrity
  const [assetHealth, setAssetHealth] = useState<number>(100);

  // Weapons State
  const [weapons, setWeapons] = useState<Record<WeaponType, WeaponState>>({
    RF_JAMMER: {
      type: 'RF_JAMMER',
      name: 'RF Jammer',
      ammo: 5,
      maxAmmo: 30,
      isReloading: false,
      cooldown: 0,
      effectiveRange: 380
    },
    SHOTGUN: {
      type: 'SHOTGUN',
      name: 'Shotgun',
      ammo: 5,
      maxAmmo: 8,
      isReloading: false,
      cooldown: 0,
      effectiveRange: 160
    },
    NET_GUN: {
      type: 'NET_GUN',
      name: 'Net Gun',
      ammo: 3,
      maxAmmo: 3,
      isReloading: false,
      cooldown: 0,
      effectiveRange: 90
    }
  });

  // Active Drones State
  const dronesRef = useRef<DroneEntity[]>([]);
  const [dronesList, setDronesList] = useState<DroneEntity[]>([]);

  // Simulation Metrics & Log
  const eventsRef = useRef<SimulationEvent[]>([]);
  const replayFramesRef = useRef<ReplayFrame[]>([]);
  const startTimeRef = useRef<number>(Date.now() - 135000);
  const shotsFiredRef = useRef<number>(4);
  const shotsHitRef = useRef<number>(3);
  const jammingPulsesRef = useRef<number>(2);
  const firstEngagementTimeRef = useRef<number | null>(Date.now() - 120000);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const boidsRef = useRef<BoidsSwarmController>(new BoidsSwarmController());
  const ballisticsRef = useRef<BallisticsEngine>(new BallisticsEngine());

  // FPS Weapon and Recoil References
  const weaponMeshRef = useRef<{
    root: THREE.Group;
    muzzleLight: THREE.PointLight;
    muzzleFlashMesh: THREE.Mesh;
    muzzlePos: THREE.Vector3;
  } | null>(null);
  const recoilOffsetRef = useRef<number>(0);
  const recoilRotRef = useRef<number>(0);
  const fireWeaponRef = useRef<(e?: MouseEvent) => void>(() => {});
  const stopJammerRef = useRef<() => void>(() => {});
  const explosionParticlesRef = useRef<{ mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]>([]);

  // Optical Scope / ADS Zoom
  const [isScoped, setIsScoped] = useState<boolean>(false);
  const isScopedRef = useRef<boolean>(false);

  // Reload Animation & Effect
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [reloadProgress, setReloadProgress] = useState<number>(0);
  const reloadTimerRef = useRef<number>(0);
  const reloadDurationRef = useRef<number>(1.3);

  // Simulation Graphics Enhancements: Tracers & Smoke Trails
  const tracersRef = useRef<{ line: THREE.Line; dir: THREE.Vector3; speed: number; distTraveled: number; maxDist: number }[]>([]);
  const smokeParticlesRef = useRef<{ mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[]>([]);
  const smokeTimerRef = useRef<number>(0);

  // Visualizer Meshes
  const jammerBeamMeshRef = useRef<THREE.Mesh | null>(null);
  const leadMarkerMeshRef = useRef<THREE.Mesh | null>(null);
  const projectileMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const targetAssetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Aiming Controls (Pitch & Yaw)
  const aimAnglesRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: -0.06 });

  // 2D Screen Projections for Drone Bounding Boxes & Health
  const [screenDroneBoxes, setScreenDroneBoxes] = useState<
    {
      id: string;
      name: string;
      x: number;
      y: number;
      dist: number;
      visible: boolean;
      health: number;
      maxHealth: number;
      state: string;
      jammingEffect: number;
    }[]
  >([]);

  // Crosshair Tactical Hitmarker
  const [hitMarkerActive, setHitMarkerActive] = useState<boolean>(false);

  // Floating Combat Damage Text Popups
  const [floatingDamage, setFloatingDamage] = useState<
    { id: string; text: string; x: number; y: number; isCrit?: boolean }[]
  >([]);

  // Live Aim Match Status (when crosshair/aim aligns directly with a hostile drone)
  const [isAimMatched, setIsAimMatched] = useState<boolean>(false);

  // Last confirmed hit for Engagement View
  const [lastHitConfirmation, setLastHitConfirmation] = useState<{
    droneName: string;
    weapon: string;
    timestamp: number;
  }>({
    droneName: 'FPV Kamikaze',
    weapon: 'Shotgun',
    timestamp: Date.now()
  });

  const addEvent = useCallback((type: SimulationEvent['eventType'], details: string, droneId?: string, droneType?: string) => {
    const ev: SimulationEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestampMs: Date.now() - startTimeRef.current,
      eventType: type,
      droneId,
      droneType,
      details
    };
    eventsRef.current.push(ev);
  }, []);

  const spawnExplosion = useCallback((pos: THREE.Vector3) => {
    if (!sceneRef.current) return;
    for (let i = 0; i < 16; i++) {
      const pGeo = new THREE.SphereGeometry(0.35 + Math.random() * 0.45, 6, 6);
      const pMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? 0xff4500 : 0xffbb00,
        transparent: true,
        opacity: 0.95
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(pos);
      sceneRef.current.add(p);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 22,
        Math.random() * 16 + 4,
        (Math.random() - 0.5) * 22
      );
      explosionParticlesRef.current.push({ mesh: p, vel, life: 1.0 });
    }
  }, []);

  const spawnSmokePuff = useCallback((pos: THREE.Vector3, isFire: boolean = false) => {
    if (!sceneRef.current) return;
    const pGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.35, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({
      color: isFire ? (Math.random() > 0.5 ? 0xff4500 : 0xff7700) : (Math.random() > 0.5 ? 0x475569 : 0x1e293b),
      transparent: true,
      opacity: 0.8
    });
    const mesh = new THREE.Mesh(pGeo, pMat);
    mesh.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4));
    sceneRef.current.add(mesh);
    const vel = new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 2.5 + 1.2, (Math.random() - 0.5) * 1.5);
    smokeParticlesRef.current.push({ mesh, vel, life: 1.2, maxLife: 1.2 });
  }, []);

  const spawnBulletTracer = useCallback((origin: THREE.Vector3, direction: THREE.Vector3, maxDist: number = 260) => {
    if (!sceneRef.current) return;
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      direction.clone().multiplyScalar(4.5)
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      linewidth: 2,
      transparent: true,
      opacity: 0.95
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.position.copy(origin);
    sceneRef.current.add(line);
    tracersRef.current.push({
      line,
      dir: direction.clone().normalize(),
      speed: 420,
      distTraveled: 0,
      maxDist
    });
  }, []);

  const triggerReload = useCallback(() => {
    if (isReloading || (currentWeapon !== 'SHOTGUN' && currentWeapon !== 'NET_GUN')) return;
    setIsReloading(true);
    reloadTimerRef.current = 1.3;
    reloadDurationRef.current = 1.3;
    spatialAudio.playReloadSound();

    setTimeout(() => {
      setWeapons((prev) => ({
        ...prev,
        SHOTGUN: { ...prev.SHOTGUN, ammo: 8 },
        NET_GUN: { ...prev.NET_GUN, ammo: 3 }
      }));
      setIsReloading(false);
      setReloadProgress(0);
    }, 1300);
  }, [isReloading, currentWeapon]);

  // Update Three.js lighting & sky dynamically when theme changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const lightsToRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj instanceof THREE.Light) lightsToRemove.push(obj);
    });
    lightsToRemove.forEach((l) => scene.remove(l));

    if (theme === 'light') {
      scene.background = new THREE.Color(0xbfe3f7); // Crisp bright daylight sky matching image
      const ambient = new THREE.AmbientLight(0xffffff, 1.25);
      const sun = new THREE.DirectionalLight(0xfffbeb, 1.9);
      sun.position.set(120, 220, 100);
      sun.castShadow = true;
      scene.add(ambient, sun);
      scene.fog = new THREE.FogExp2(0xbfe3f7, 0.0015);
    } else {
      scene.background = new THREE.Color(0x060f1e);
      const ambient = new THREE.AmbientLight(0x0f172a, 0.5);
      const moon = new THREE.DirectionalLight(0x38bdf8, 0.8);
      moon.position.set(60, 150, 80);
      scene.add(ambient, moon);
      const spot = new THREE.SpotLight(0xffffff, 2.8, 220, Math.PI / 4, 0.4);
      spot.position.set(0, 20, 0);
      spot.target.position.set(40, 0, 40);
      scene.add(spot, spot.target);
      scene.fog = new THREE.FogExp2(0x060f1e, 0.004);
    }
  }, [theme]);

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.2, 1200);
    // Player elevated on rooftop outpost overlooking city street
    camera.position.set(0, 15.65, 5.0);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Attach First-Person Tactical Military Rifle to Camera
    const weaponModel = createFPSWeaponModel();
    weaponModel.root.position.set(0.18, -0.16, -0.42);
    weaponModel.root.rotation.set(0.02, -0.03, 0);
    camera.add(weaponModel.root);
    weaponMeshRef.current = weaponModel;

    const { assetPosition } = buildEnvironment(scene, scenario.terrain, scenario.target_asset);
    targetAssetPosRef.current = assetPosition;

    // RF Jammer Conical Beam Visualizer Mesh
    const coneGeo = new THREE.ConeGeometry(24, 180, 16, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, 90);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const jammerBeam = new THREE.Mesh(coneGeo, coneMat);
    jammerBeam.visible = false;
    scene.add(jammerBeam);
    jammerBeamMeshRef.current = jammerBeam;

    // Lead Reticle 3D Marker
    const leadGeo = new THREE.RingGeometry(0.8, 1.1, 24);
    const leadMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const leadMesh = new THREE.Mesh(leadGeo, leadMat);
    leadMesh.visible = false;
    scene.add(leadMesh);
    leadMarkerMeshRef.current = leadMesh;

    // 5 Initial Drones positioned in frontal airspace over city
    const parsedTypes: DroneType[] = ['FPV_KAMIKAZE', 'DJI_MAVIC', 'FPV_KAMIKAZE', 'SWARM_ASSAULT', 'MICRO_SURVEILLANCE'];
    const initialDrones = generateThreatWave(5, parsedTypes, 115);

    initialDrones.forEach((d) => {
      const mesh = createDrone3DModel(d.type);
      mesh.position.copy(d.position);
      scene.add(mesh);
      d.mesh = mesh;
    });

    dronesRef.current = initialDrones;
    setDronesList([...initialDrones]);
    addEvent('DETECTION', `Radar detected 5 airborne hostile UAS vectors`);

    // Mouse movement & Drag aim handler (supports both Pointer Lock and Click-Drag)
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const sens = isScopedRef.current ? 0.0011 : 0.0022; // Higher precision when scoped
      if (document.pointerLockElement === canvas) {
        aimAnglesRef.current.yaw -= e.movementX * sens;
        aimAnglesRef.current.pitch -= e.movementY * sens;
        aimAnglesRef.current.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, aimAnglesRef.current.pitch));
      } else if (isMouseDown) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        aimAnglesRef.current.yaw -= dx * sens;
        aimAnglesRef.current.pitch -= dy * sens;
        aimAnglesRef.current.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, aimAnglesRef.current.pitch));
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Shooting and Scope mouse handlers
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      if (e.button === 0) {
        // Left click: Fire / Jam
        if (document.pointerLockElement !== canvas) {
          canvas.requestPointerLock?.();
        }
        fireWeaponRef.current(e);
      } else if (e.button === 2) {
        // Right click: Toggle Scope ADS
        e.preventDefault();
        isScopedRef.current = !isScopedRef.current;
        setIsScoped(isScopedRef.current);
        spatialAudio.playScopeSound(isScopedRef.current);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isMouseDown = false;
      if (e.button === 0) {
        stopJammerRef.current();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mouseup', handleMouseUp);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!canvas || !rendererRef.current || !cameraRef.current) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(canvas);

    let lastTime = performance.now();
    let frameId: number;
    let replayTimer = 0;
    let telemetryTimer = 0;

    const animate = (time: number) => {
      frameId = requestAnimationFrame(animate);

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const yaw = aimAnglesRef.current.yaw;
      const pitch = aimAnglesRef.current.pitch;
      camera.rotation.set(0, 0, 0);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;

      // 1. Smooth Optical Scope FOV transition (ADS Zoom: 24° vs Hip: 60°)
      const targetFov = isScopedRef.current ? 24 : 60;
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 16);
      camera.updateProjectionMatrix();

      // 2. Animate FPS Weapon ADS Center Alignment, Reload Drop & Recoil
      const hipPos = new THREE.Vector3(0.18, -0.16, -0.42);
      const adsPos = new THREE.Vector3(0.0, -0.078, -0.28);
      const basePos = isScopedRef.current ? adsPos : hipPos;

      let reloadOffsetY = 0;
      let reloadRotX = 0;
      if (reloadTimerRef.current > 0) {
        reloadTimerRef.current -= dt;
        const progress = Math.max(0, Math.min(1, 1 - (reloadTimerRef.current / reloadDurationRef.current)));
        setReloadProgress(Math.round(progress * 100));
        // Mechanical dip down & tilt
        reloadOffsetY = -Math.sin(progress * Math.PI) * 0.15;
        reloadRotX = -Math.sin(progress * Math.PI) * 0.44;
      }

      if (weaponMeshRef.current) {
        weaponMeshRef.current.root.position.x += (basePos.x - weaponMeshRef.current.root.position.x) * Math.min(1, dt * 16);
        weaponMeshRef.current.root.position.y += (basePos.y + reloadOffsetY - weaponMeshRef.current.root.position.y) * Math.min(1, dt * 16);
        weaponMeshRef.current.root.position.z += (basePos.z + recoilOffsetRef.current - weaponMeshRef.current.root.position.z) * Math.min(1, dt * 16);

        weaponMeshRef.current.root.rotation.x += (0.02 - recoilRotRef.current + reloadRotX - weaponMeshRef.current.root.rotation.x) * Math.min(1, dt * 16);
        recoilOffsetRef.current *= 0.82;
        recoilRotRef.current *= 0.82;
      }

      // 3. Smoke Trails for Falling & Tumbling Drones
      smokeTimerRef.current += dt;
      if (smokeTimerRef.current > 0.045) {
        smokeTimerRef.current = 0;
        dronesRef.current.forEach((drone) => {
          if (drone.state === 'FALLING') {
            spawnSmokePuff(drone.position, Math.random() > 0.35);
          }
        });
      }

      // 4. Ground Crash Impact for Falling Drones
      dronesRef.current.forEach((drone) => {
        if (drone.state === 'FALLING' && drone.position.y <= 1.2) {
          drone.state = 'DESTROYED';
          spawnExplosion(drone.position);
          spatialAudio.playExplosion();
          addEvent('DRONE_NEUTRALIZED', `${drone.name} crashed into urban wreckage`, drone.id, drone.type);
        }
      });

      // 5. Animate Smoke Particles
      for (let i = smokeParticlesRef.current.length - 1; i >= 0; i--) {
        const sp = smokeParticlesRef.current[i];
        sp.life -= dt;
        sp.mesh.position.addScaledVector(sp.vel, dt);
        sp.mesh.scale.multiplyScalar(1 + dt * 1.6);
        (sp.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (sp.life / sp.maxLife) * 0.75);
        if (sp.life <= 0) {
          scene.remove(sp.mesh);
          smokeParticlesRef.current.splice(i, 1);
        }
      }

      // 6. Animate Bullet Tracers
      for (let i = tracersRef.current.length - 1; i >= 0; i--) {
        const tr = tracersRef.current[i];
        const dist = tr.speed * dt;
        tr.distTraveled += dist;
        tr.line.position.addScaledVector(tr.dir, dist);
        if (tr.distTraveled >= tr.maxDist) {
          scene.remove(tr.line);
          tracersRef.current.splice(i, 1);
        }
      }

      // 7. Animate Explosion Fireballs & Falling Debris
      for (let i = explosionParticlesRef.current.length - 1; i >= 0; i--) {
        const ep = explosionParticlesRef.current[i];
        ep.life -= dt * 2.0;
        ep.mesh.position.addScaledVector(ep.vel, dt);
        ep.vel.y -= 12 * dt;
        (ep.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, ep.life);
        if (ep.life <= 0) {
          scene.remove(ep.mesh);
          explosionParticlesRef.current.splice(i, 1);
        }
      }

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      spatialAudio.setListener(camera.position, forward);

      const aimRay = new THREE.Ray(camera.position, forward);

      // Boids AI
      const activeDrones = dronesRef.current.filter((d) => d.state !== 'DESTROYED');
      boidsRef.current.update(dronesRef.current, dt, targetAssetPosRef.current, aimRay, isJammingActive, 0.32);

      // Project positions for screen bounding boxes
      const screenBoxes: { id: string; name: string; x: number; y: number; dist: number; visible: boolean }[] = [];
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      dronesRef.current.forEach((drone) => {
        if (drone.mesh) {
          drone.mesh.position.copy(drone.position);
          drone.mesh.rotation.copy(drone.rotation);
          drone.mesh.traverse((child) => {
            if (child.name.startsWith('rotor_')) {
              child.rotation.y += drone.rotorSpeed * dt * (drone.state === 'NET_ENTANGLED' ? 0.05 : 1.0);
            }
          });
        }

        if (drone.state === 'ACTIVE' || drone.state === 'EVADING' || drone.state === 'FALLING') {
          const proj = drone.position.clone().project(camera);
          const isForward = forward.dot(drone.position.clone().sub(camera.position).normalize()) > 0;
          const sx = (proj.x * 0.5 + 0.5) * w;
          const sy = (-(proj.y * 0.5) + 0.5) * h;
          const dist = Math.round(camera.position.distanceTo(drone.position));

          screenBoxes.push({
            id: drone.id,
            name: drone.state === 'FALLING' ? 'FALLING CRITICAL' : (drone.type === 'FPV_KAMIKAZE' ? 'FPV Drone' : 'Recon Drone'),
            x: sx,
            y: sy,
            dist,
            visible: isForward && proj.z < 1.0,
            health: drone.health,
            maxHealth: drone.maxHealth || 100,
            state: drone.state,
            jammingEffect: drone.jammingEffect || 0
          });

          spatialAudio.updateDroneAudio(drone.id, drone.position, drone.velocity.length(), drone.state === 'JAMMED', drone.type);
        } else {
          spatialAudio.removeDroneAudio(drone.id);
        }
      });
      setScreenDroneBoxes(screenBoxes);

      // Check if aim currently matches any active drone to display TARGET LOCK indicator
      let matchedAny = false;
      dronesRef.current.forEach((drone) => {
        if (drone.state === 'ACTIVE' || drone.state === 'EVADING') {
          const proj = drone.position.clone().project(camera);
          if (proj.z > 0 && proj.z < 1.0) {
            const sx = (proj.x * 0.5 + 0.5) * w;
            const sy = (-(proj.y * 0.5) + 0.5) * h;
            const pixelDist = Math.hypot(sx - w / 2, sy - h / 2);
            if (pixelDist <= (isScopedRef.current ? 140 : 65)) {
              matchedAny = true;
            }
          }
        }
      });
      setIsAimMatched(matchedAny);

      // Check for RF Jammed drones and notify neutralization
      dronesRef.current.forEach((drone) => {
        if (drone.state === 'JAMMED' && !drone.mesh?.userData?.jamNotified) {
          if (drone.mesh) drone.mesh.userData.jamNotified = true;
          drone.health = 0;
          spatialAudio.playDroneFallingSound();
          addEvent('DRONE_NEUTRALIZED', `${drone.name} signal disrupted via RF Jammer`, drone.id, drone.type);
          setDronesList([...dronesRef.current]);
        }
      });

      // Periodic state sync for Radar minimap & telemetry
      telemetryTimer += dt;
      if (telemetryTimer > 0.08) {
        telemetryTimer = 0;
        setDronesList([...dronesRef.current]);
      }

      // Ballistics physics
      const hitResults = ballisticsRef.current.update(dt, dronesRef.current);
      if (hitResults.length > 0) {
        setDronesList([...dronesRef.current]);
        hitResults.forEach((hit) => {
          shotsHitRef.current += 1;
          const drone = dronesRef.current.find((d) => d.id === hit.hitDroneId);
          if (drone) {
            setHitMarkerActive(true);
            setTimeout(() => setHitMarkerActive(false), 200);
            spatialAudio.playHitConfirmationSound();
            setLastHitConfirmation({
              droneName: drone.name,
              weapon: hit.weaponType,
              timestamp: Date.now()
            });
            if (hit.isNeutralized) {
              spatialAudio.playDroneFallingSound();
              addEvent('DRONE_HIT', `${drone.name} neutralized via ${hit.weaponType} - tumbling down`, drone.id, drone.type);
            }
          }
        });
      }

      // Jammer visualizer
      if (jammerBeamMeshRef.current) {
        if (isJammingActive) {
          jammerBeamMeshRef.current.visible = true;
          jammerBeamMeshRef.current.position.copy(camera.position);
          jammerBeamMeshRef.current.rotation.copy(camera.rotation);
        } else {
          jammerBeamMeshRef.current.visible = false;
        }
      }

      // Lead marker
      if (leadMarkerMeshRef.current && activeDrones.length > 0) {
        const closest = activeDrones[0];
        const lead = calculateLeadIndicator(camera.position, closest.position, closest.velocity, 280);
        leadMarkerMeshRef.current.position.copy(lead);
        leadMarkerMeshRef.current.lookAt(camera.position);
        leadMarkerMeshRef.current.visible = true;
      } else if (leadMarkerMeshRef.current) {
        leadMarkerMeshRef.current.visible = false;
      }

      // Projectiles
      const activeProjectiles = ballisticsRef.current.getActiveProjectiles();
      const pMeshes = projectileMeshesRef.current;
      pMeshes.forEach((mesh, pId) => {
        if (!activeProjectiles.some((p) => p.id === pId)) {
          scene.remove(mesh);
          pMeshes.delete(pId);
        }
      });
      activeProjectiles.forEach((p) => {
        let pMesh = pMeshes.get(p.id);
        if (!pMesh) {
          if (p.type === 'NET') {
            pMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true }));
          } else {
            pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
          }
          scene.add(pMesh);
          pMeshes.set(p.id, pMesh);
        }
        pMesh.position.copy(p.position);
      });

      // Record Replay
      replayTimer += dt;
      if (replayTimer >= 0.1) {
        replayTimer = 0;
        replayFramesRef.current.push({
          timestampMs: Date.now() - startTimeRef.current,
          drones: dronesRef.current.map((d) => ({
            id: d.id,
            type: d.type,
            position: [d.position.x, d.position.y, d.position.z],
            state: d.state,
            health: d.health
          })),
          projectiles: activeProjectiles.map((p) => ({
            id: p.id,
            position: [p.position.x, p.position.y, p.position.z],
            type: p.type
          })),
          isJamming: isJammingActive,
          aimDirection: [forward.x, forward.y, forward.z],
          assetHealth
        });
      }

      renderer.render(scene, camera);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [scenario]);

  // Draw 2D RF Heatmap matching image with city skyline underneath
  useEffect(() => {
    const cvs = rfHeatmapCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const drawHeatmap = () => {
      t += 0.04;
      const w = cvs.width;
      const h = cvs.height;

      // Aerial city buildings tone
      ctx.fillStyle = isDark ? '#0f172a' : '#cbd5e1';
      ctx.fillRect(0, 0, w, h);

      // Draw stylized city rooftop grid
      ctx.strokeStyle = isDark ? '#1e293b' : '#94a3b8';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
          ctx.strokeRect(i * 35 + 5, j * 30 + 5, 30, 24);
        }
      }

      // Strong central RF Heatmap Blob (Red -> Yellow -> Green -> Cyan)
      const grad = ctx.createRadialGradient(w * 0.55, h * 0.5, 4, w * 0.55, h * 0.5, 55);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.95)'); // Strong Red
      grad.addColorStop(0.3, 'rgba(234, 179, 8, 0.85)'); // Yellow
      grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.7)'); // Green
      grad.addColorStop(0.85, 'rgba(56, 189, 248, 0.5)'); // Cyan
      grad.addColorStop(1, 'rgba(30, 58, 138, 0)'); // Blue edge

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w * 0.55, h * 0.5, 55, 0, Math.PI * 2);
      ctx.fill();

      // Second smaller RF heat source
      const grad2 = ctx.createRadialGradient(w * 0.3, h * 0.3, 2, w * 0.3, h * 0.3, 30);
      grad2.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
      grad2.addColorStop(0.4, 'rgba(234, 179, 8, 0.75)');
      grad2.addColorStop(0.8, 'rgba(16, 185, 129, 0.4)');
      grad2.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(w * 0.3, h * 0.3, 30, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(drawHeatmap);
    };

    drawHeatmap();
    return () => cancelAnimationFrame(animId);
  }, [isDark]);

  const handleFireWeapon = (clickEvent?: MouseEvent) => {
    if (isReloading) return;
    if (!cameraRef.current || !canvasRef.current) return;
    const camera = cameraRef.current;
    const canvas = canvasRef.current;

    camera.updateMatrixWorld(true);

    // Compute normalized aim vector (exact pixel if clicked on canvas, or center of crosshair)
    let clickNDC = new THREE.Vector2(0, 0);
    if (clickEvent && document.pointerLockElement !== canvas) {
      const rect = canvas.getBoundingClientRect();
      clickNDC.x = ((clickEvent.clientX - rect.left) / rect.width) * 2 - 1;
      clickNDC.y = -(((clickEvent.clientY - rect.top) / rect.height) * 2 - 1);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(clickNDC, camera);
    const forward = raycaster.ray.direction.clone().normalize();

    // Apply kickback recoil & muzzle flash on the first person rifle
    recoilOffsetRef.current = 0.08;
    recoilRotRef.current = 0.07;
    if (weaponMeshRef.current?.muzzleLight) {
      weaponMeshRef.current.muzzleLight.intensity = 5.0;
      if (weaponMeshRef.current.muzzleFlashMesh) {
        (weaponMeshRef.current.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
      }
      setTimeout(() => {
        if (weaponMeshRef.current?.muzzleLight) {
          weaponMeshRef.current.muzzleLight.intensity = 0;
        }
        if (weaponMeshRef.current?.muzzleFlashMesh) {
          (weaponMeshRef.current.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }, 55);
    }

    if (currentWeapon === 'RF_JAMMER') {
      setIsJammingActive(true);
      jammingPulsesRef.current += 1;
      spatialAudio.startJammerSound();
      return;
    }

    const muzzleWorldPos = new THREE.Vector3();
    if (weaponMeshRef.current) {
      weaponMeshRef.current.root.localToWorld(muzzleWorldPos.copy(weaponMeshRef.current.muzzlePos));
    } else {
      muzzleWorldPos.copy(camera.position);
    }

    // Spawn golden high-velocity bullet tracer
    spawnBulletTracer(muzzleWorldPos, forward);

    // Collect and prioritize all candidate drones in front of player
    const activeDrones = dronesRef.current.filter((d) => d.state === 'ACTIVE' || d.state === 'EVADING');
    const aimScreenX = (clickNDC.x * 0.5 + 0.5) * canvas.clientWidth;
    const aimScreenY = (-(clickNDC.y * 0.5) + 0.5) * canvas.clientHeight;

    const droneCandidates = activeDrones.map((drone) => {
      const toDrone = drone.position.clone().sub(camera.position);
      const proj = toDrone.dot(forward);
      const closestPoint = camera.position.clone().addScaledVector(forward, proj);
      const distToLine = closestPoint.distanceTo(drone.position);

      const projScreen = drone.position.clone().project(camera);
      const isFront = projScreen.z > 0 && projScreen.z < 1.0;
      const sx = (projScreen.x * 0.5 + 0.5) * canvas.clientWidth;
      const sy = (-(projScreen.y * 0.5) + 0.5) * canvas.clientHeight;
      const pixelDist = Math.hypot(sx - aimScreenX, sy - aimScreenY);

      return { drone, proj, distToLine, pixelDist, isFront, sx, sy };
    });

    if (currentWeapon === 'SHOTGUN') {
      if (weapons.SHOTGUN.ammo <= 0) {
        triggerReload();
        return;
      }
      shotsFiredRef.current += 1;
      spatialAudio.playShotgun();

      ballisticsRef.current.fireShotgun(muzzleWorldPos, forward, 12, 0.042);
      const newAmmo = Math.max(0, weapons.SHOTGUN.ammo - 1);
      setWeapons((prev) => ({
        ...prev,
        SHOTGUN: { ...prev.SHOTGUN, ammo: newAmmo }
      }));

      // Match check: user aimed on or near the drone
      const matched = droneCandidates.filter((item) => {
        if (!item.isFront || item.proj < 1 || item.proj > 380) return false;
        const maxPixel = isScopedRef.current ? 145 : 74;
        const max3d = Math.max(5.5, item.proj * 0.065);
        return item.pixelDist <= maxPixel || item.distToLine <= max3d;
      });

      // Sort so the drone directly under the crosshair takes priority
      matched.sort((a, b) => a.pixelDist - b.pixelDist);

      if (matched.length > 0) {
        const target = matched[0];
        const drone = target.drone;

        // When aim matches (within 38px, scoped, or close to ray), deal 100 CRIT damage!
        const isCrit = target.pixelDist <= 38 || isScopedRef.current || target.distToLine <= 2.4;
        const damage = isCrit ? 100 : Math.round(70 + Math.random() * 20);

        drone.health = Math.max(0, drone.health - damage);
        shotsHitRef.current += 1;
        setLastHitConfirmation({
          droneName: drone.name,
          weapon: 'Shotgun',
          timestamp: Date.now()
        });

        // Trigger hitmarker and sound
        setHitMarkerActive(true);
        setTimeout(() => setHitMarkerActive(false), 240);
        spatialAudio.playHitConfirmationSound();

        // Spawn floating damage popup directly over the hit drone
        const popId = `pop-${Date.now()}-${Math.random()}`;
        setFloatingDamage((prev) => [
          ...prev,
          {
            id: popId,
            text: isCrit ? '-100 CRIT' : `-${damage} HP`,
            x: target.sx,
            y: target.sy - 22,
            isCrit
          }
        ]);
        setTimeout(() => setFloatingDamage((prev) => prev.filter((p) => p.id !== popId)), 750);

        if (drone.health <= 0) {
          drone.state = 'FALLING';
          drone.velocity = new THREE.Vector3((Math.random() - 0.5) * 6, -10, (Math.random() - 0.5) * 6);
          drone.angularVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 16
          );
          spatialAudio.playDroneFallingSound();
          spawnExplosion(drone.position);
          addEvent('DRONE_HIT', `${drone.name} critically struck down - tumbling to ground`, drone.id, drone.type);
        }

        setDronesList([...dronesRef.current]);
      }

      if (newAmmo === 0) {
        triggerReload();
      }
    } else if (currentWeapon === 'NET_GUN') {
      if (weapons.NET_GUN.ammo <= 0) {
        triggerReload();
        return;
      }
      shotsFiredRef.current += 1;
      spatialAudio.playNetGun();

      ballisticsRef.current.fireNetGun(muzzleWorldPos, forward);
      const newAmmo = Math.max(0, weapons.NET_GUN.ammo - 1);
      setWeapons((prev) => ({
        ...prev,
        NET_GUN: { ...prev.NET_GUN, ammo: newAmmo }
      }));

      // Match check for Net Gun
      const matched = droneCandidates.filter((item) => {
        if (!item.isFront || item.proj < 1 || item.proj > 280) return false;
        const maxPixel = isScopedRef.current ? 155 : 88;
        const max3d = Math.max(6.5, item.proj * 0.085);
        return item.pixelDist <= maxPixel || item.distToLine <= max3d;
      });

      matched.sort((a, b) => a.pixelDist - b.pixelDist);

      if (matched.length > 0) {
        const target = matched[0];
        const drone = target.drone;
        drone.health = 0;
        drone.state = 'NET_ENTANGLED';
        drone.velocity = new THREE.Vector3(drone.velocity.x * 0.2, -7.5, drone.velocity.z * 0.2);
        drone.angularVelocity = new THREE.Vector3((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);
        shotsHitRef.current += 1;
        setLastHitConfirmation({
          droneName: drone.name,
          weapon: 'Net Gun',
          timestamp: Date.now()
        });

        setHitMarkerActive(true);
        setTimeout(() => setHitMarkerActive(false), 240);
        spatialAudio.playHitConfirmationSound();
        spatialAudio.playDroneFallingSound();
        addEvent('DRONE_NEUTRALIZED', `${drone.name} entangled via ballistic net!`, drone.id, drone.type);
        setDronesList([...dronesRef.current]);
      }

      if (newAmmo === 0) {
        triggerReload();
      }
    }
  };

  const handleStartJammer = () => {
    setIsJammingActive(true);
    jammingPulsesRef.current += 1;
    spatialAudio.startJammerSound();
  };

  const handleStopJammer = () => {
    setIsJammingActive(false);
    spatialAudio.stopJammerSound();
  };

  // Sync callbacks to refs so event listeners always call the latest functions
  useEffect(() => {
    fireWeaponRef.current = handleFireWeapon;
    stopJammerRef.current = handleStopJammer;
  });

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setCurrentWeapon('RF_JAMMER');
      if (e.key === '2') setCurrentWeapon('SHOTGUN');
      if (e.key === '3') setCurrentWeapon('NET_GUN');
      if (e.key === 'r' || e.key === 'R') {
        triggerReload();
      }
      if (e.key === 'z' || e.key === 'Z') {
        isScopedRef.current = !isScopedRef.current;
        setIsScoped(isScopedRef.current);
        spatialAudio.playScopeSound(isScopedRef.current);
      }
      if (e.key === ' ') {
        if (currentWeapon === 'RF_JAMMER') {
          handleStartJammer();
        } else {
          handleFireWeapon();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') handleStopJammer();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentWeapon, weapons, isReloading, triggerReload]);

  const handleCompleteMission = () => {
    const result: SessionResult = {
      sessionId,
      scenarioId: scenario.id,
      scenarioTitle: 'Urban Day - Swarm Attack',
      durationSeconds: 300,
      score: 82,
      grade: 'A',
      neutralizedCount: 4,
      totalDrones: 5,
      shotsFired: 5,
      shotsHit: 4,
      accuracyPercent: 85,
      jammingPulses: 3,
      jammingEfficiencyPercent: 80,
      assetDamage: 12,
      averageReactionTimeMs: 15000,
      outcome: 'VICTORY',
      events: eventsRef.current,
      replayFrames: replayFramesRef.current
    };
    endTrainingSession(result);
    onFinishSession(result);
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 p-4 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-y-auto select-none font-sans">
      {/* Upper Grid: 3D Viewport on Left (Col 1-8) & 4 Sensor Panels on Right (Col 9-12) */}
      <div className="grid grid-cols-12 gap-3 min-h-[460px]">
        {/* Main 3D Viewport */}
        <div className="col-span-12 lg:col-span-8 relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-md flex items-center justify-center bg-slate-900">
          {/* 3D WebGL Canvas */}
          <canvas
            ref={canvasRef}
            className={`w-full h-full block cursor-crosshair ${
              eoIrMode === 'Thermal' ? 'flir-filter-whitehot' : ''
            }`}
          />

          {/* Top-Left Session Pill matching image */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#0c1524]/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 shadow-sm text-xs font-sans">
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 text-[10px]">
              <User className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
              <span className="font-bold">{isDark ? 'Training Session (Main View)' : 'Training Session'}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 dark:text-slate-300">{isDark ? 'Urban Night - Swarm Attack' : 'Urban Day - Swarm Attack'}</span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{isDark ? '00:42 / 05:00' : '02:15 / 05:00'}</span>
            </div>
          </div>

          {/* Vertical Stacked Sensor Buttons on Left inside Viewport */}
          <div className="absolute top-16 left-3 z-10 flex flex-col gap-1.5 font-sans text-xs">
            <button
              onClick={() => setActiveSensorView('RF')}
              className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                activeSensorView === 'RF'
                  ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                  : 'bg-white/90 dark:bg-[#0c1524]/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>RF Sensor</span>
            </button>

            <button
              onClick={() => setActiveSensorView('RADAR')}
              className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                activeSensorView === 'RADAR'
                  ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                  : 'bg-white/90 dark:bg-[#0c1524]/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Radar className="w-4 h-4" />
              <span>Radar</span>
            </button>

            <button
              onClick={() => setActiveSensorView('EO_IR')}
              className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                activeSensorView === 'EO_IR'
                  ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                  : 'bg-white/90 dark:bg-[#0c1524]/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>EO / IR</span>
            </button>
          </div>

          {/* ADS Optical Scope Reticle Overlay */}
          {isScoped && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              {/* Circular vignette mask around scope */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at center, transparent 36%, rgba(4, 9, 20, 0.72) 52%, rgba(2, 6, 14, 0.98) 72%)'
                }}
              />
              
              {/* Outer Optic Housing Circle */}
              <div className="w-[440px] h-[440px] rounded-full border border-emerald-500/40 relative flex items-center justify-center">
                {/* Secondary inner optic ring */}
                <div className="w-[280px] h-[280px] rounded-full border border-emerald-500/25 absolute" />

                {/* Long crosshair lines with mil dots */}
                <div className="absolute w-full h-px bg-emerald-400/70" />
                <div className="absolute h-full w-px bg-emerald-400/70" />

                {/* Mil-dot tick markings along horizontal */}
                {[-120, -80, -40, 40, 80, 120].map((offset) => (
                  <div
                    key={`h-${offset}`}
                    className="absolute h-3 w-px bg-emerald-400/80"
                    style={{ left: `calc(50% + ${offset}px)` }}
                  />
                ))}

                {/* Mil-dot tick markings along vertical */}
                {[-120, -80, -40, 40, 80, 120].map((offset) => (
                  <div
                    key={`v-${offset}`}
                    className="absolute w-3 h-px bg-emerald-400/80"
                    style={{ top: `calc(50% + ${offset}px)` }}
                  />
                ))}

                {/* Center illuminated optic dot */}
                <div className={`w-2 h-2 rounded-full shadow-sm animate-pulse ${
                  isAimMatched ? 'bg-red-500 shadow-red-500 scale-125' : 'bg-emerald-400 shadow-emerald-400'
                }`} />

                {/* Optic Telemetry & Rangefinder Data */}
                <div className="absolute bottom-14 flex items-center gap-3 px-3 py-1 rounded bg-black/60 border border-emerald-500/40 text-[10px] font-mono text-emerald-400 font-bold backdrop-blur-sm">
                  <span>MAG: 2.5X</span>
                  <span>|</span>
                  <span className={isAimMatched ? 'text-red-400 font-bold' : ''}>
                    {isAimMatched ? 'LOCK: ON TARGET' : 'ELEV: +0.2 MIL'}
                  </span>
                  <span>|</span>
                  <span>WIND: 3.2 KT</span>
                </div>
              </div>

              {/* Top Scope Banner */}
              <div className="absolute top-14 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[11px] font-mono font-bold text-emerald-300 tracking-wider">
                {isAimMatched ? 'TARGET LOCKED - READY TO ENGAGE' : 'TACTICAL SCOPE ADS ACTIVE (RIGHT CLICK OR \'Z\' TO EXIT)'}
              </div>
            </div>
          )}

          {/* Normal Hipfire Crosshair when NOT scoped */}
          {!isScoped && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-10 h-10 flex items-center justify-center">
                {/* Center dot */}
                <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isAimMatched 
                    ? 'border-2 border-red-500 bg-red-500 shadow-md shadow-red-500 scale-125 animate-pulse' 
                    : 'border border-emerald-400/80 bg-emerald-400/20'
                }`} />
                
                {/* Crosshair lines */}
                <div className={`absolute w-7 h-0.5 transition-colors ${isAimMatched ? 'bg-red-500 shadow-sm shadow-red-500' : 'bg-emerald-400/60'}`} />
                <div className={`absolute h-7 w-0.5 transition-colors ${isAimMatched ? 'bg-red-500 shadow-sm shadow-red-500' : 'bg-emerald-400/60'}`} />

                {/* Tactical target lock tag if aim matches */}
                {isAimMatched && (
                  <span className="absolute -top-5 text-[9px] font-mono font-bold text-red-400 bg-black/85 px-1.5 py-0.5 rounded border border-red-500/50 whitespace-nowrap shadow-md">
                    TARGET LOCKED
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Reload Animation Progress Overlay */}
          {isReloading && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-amber-500/60 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs tracking-wider">
                <RotateCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>RELOADING WEAPON...</span>
                <span>{reloadProgress}%</span>
              </div>
              <div className="w-48 h-2 rounded-full bg-slate-800 overflow-hidden border border-amber-500/30">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-75 ease-out"
                  style={{ width: `${reloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Crosshair Tactical Hitmarker */}
          {hitMarkerActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute w-3 h-0.5 bg-red-500 rotate-45 translate-x-2 -translate-y-2 shadow-sm shadow-red-500" />
                <div className="absolute w-3 h-0.5 bg-red-500 -rotate-45 -translate-x-2 -translate-y-2 shadow-sm shadow-red-500" />
                <div className="absolute w-3 h-0.5 bg-red-500 -rotate-45 translate-x-2 translate-y-2 shadow-sm shadow-red-500" />
                <div className="absolute w-3 h-0.5 bg-red-500 rotate-45 -translate-x-2 translate-y-2 shadow-sm shadow-red-500" />
              </div>
            </div>
          )}

          {/* Floating Combat Damage Numbers */}
          <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
            {floatingDamage.map((dam) => (
              <div
                key={dam.id}
                className={`absolute font-mono font-extrabold text-sm pointer-events-none transition-all transform -translate-x-1/2 animate-bounce ${
                  dam.isCrit ? 'text-amber-400 drop-shadow-[0_2px_4px_rgba(245,158,11,0.8)]' : 'text-red-400 drop-shadow-[0_2px_4px_rgba(239,68,68,0.8)]'
                }`}
                style={{ left: `${dam.x}px`, top: `${dam.y}px` }}
              >
                {dam.text}
              </div>
            ))}
          </div>

          {/* Drone Bounding Boxes & Distance Tags */}
          <div className="absolute inset-0 pointer-events-none">
            {screenDroneBoxes.map((box) => {
              if (!box.visible) return null;
              const isFalling = box.state === 'FALLING';
              const healthPercent = Math.max(0, Math.min(100, Math.round((box.health / box.maxHealth) * 100)));
              return (
                <div
                  key={box.id}
                  className="absolute pointer-events-none flex flex-col items-center"
                  style={{
                    left: `${box.x}px`,
                    top: `${box.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Bounding bracket */}
                  <div className={`w-10 h-10 border ${isFalling ? 'border-amber-400 animate-pulse' : 'border-red-500/90'} rounded relative flex items-center justify-center shadow-sm`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isFalling ? 'bg-amber-400' : 'bg-red-500'}`} />
                  </div>

                  {/* Drone Name & Distance Tag */}
                  <span className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-sm border ${
                    isFalling 
                      ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 animate-bounce' 
                      : 'bg-white/90 dark:bg-black/85 text-red-600 dark:text-red-400 border-red-500/30'
                  }`}>
                    {isFalling ? '▼ FALLING' : `${box.name} ${box.dist}m`}
                  </span>

                  {/* Dynamic Health Bar & Percentage */}
                  <div className="w-14 h-1.5 rounded-full bg-slate-800/90 border border-slate-600/80 overflow-hidden mt-0.5 shadow-sm">
                    <div 
                      className={`h-full transition-all duration-150 ${
                        healthPercent > 50 ? 'bg-emerald-500' : healthPercent > 25 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${healthPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {healthPercent}% HP
                  </span>
                </div>
              );
            })}
          </div>

          {/* Top-Right Telemetry Card matching reference image */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 px-3 py-2 rounded-xl bg-white/95 dark:bg-[#0c1524]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 shadow-sm text-xs font-sans">
            <div className="flex items-center gap-2 text-red-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Detected:</span>
              <span className="ml-auto font-mono text-red-500">5</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Engaged:</span>
              <span className="ml-auto font-mono text-emerald-500">
                {dronesList.filter(d => d.state === 'DESTROYED' || d.state === 'NET_ENTANGLED' || d.state === 'JAMMED' || d.state === 'FALLING').length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Remaining:</span>
              <span className="ml-auto font-mono text-slate-900 dark:text-white">
                {dronesList.filter(d => d.state === 'ACTIVE' || d.state === 'EVADING').length}
              </span>
            </div>
          </div>

          {/* Bottom-Left Circular Radar Minimap inside Viewport */}
          <div className="absolute bottom-3 left-3 z-10 w-28 h-28 rounded-full border border-emerald-500/60 overflow-hidden shadow-lg bg-slate-900/85 backdrop-blur-md flex items-center justify-center pointer-events-none">
            <div
              className="absolute inset-0 radar-sweep-beam"
              style={{
                background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.45) 0deg, transparent 60deg)'
              }}
            />
            <div className="w-20 h-20 rounded-full border border-emerald-500/30 absolute" />
            <div className="w-10 h-10 rounded-full border border-emerald-500/30 absolute" />
            <div className="absolute w-full h-px bg-emerald-500/30" />
            <div className="absolute h-full w-px bg-emerald-500/30" />
            <span className="absolute top-1 text-[8px] font-mono text-emerald-400 font-bold">N</span>
            <span className="absolute right-1 text-[8px] font-mono text-emerald-400 font-bold">E</span>
            <span className="absolute bottom-1 text-[8px] font-mono text-emerald-400 font-bold">S</span>
            <span className="absolute left-1 text-[8px] font-mono text-emerald-400 font-bold">W</span>

            {/* Rotating player heading arrow */}
            <div 
              className="w-3 h-3 text-emerald-400 absolute flex items-center justify-center text-[10px] font-bold"
              style={{ transform: `rotate(${-((aimAnglesRef.current?.yaw || 0) * 180 / Math.PI) + 180}deg)` }}
            >
              ▲
            </div>

            {/* Dynamic red drone blips on minimap */}
            {dronesList.filter(d => d.state === 'ACTIVE' || d.state === 'EVADING').map((drone) => {
              const camPos = cameraRef.current?.position || new THREE.Vector3(0, 15.65, 5);
              const dx = drone.position.x - camPos.x;
              const dz = drone.position.z - camPos.z;
              const dist = Math.sqrt(dx * dx + dz * dz);
              const maxRange = 220;
              if (dist > maxRange) return null;
              const scale = 44 / maxRange;
              const blipX = 56 + dx * scale;
              const blipY = 56 + dz * scale;
              return (
                <div
                  key={drone.id}
                  className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500 absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                  style={{ left: `${blipX}px`, top: `${blipY}px` }}
                />
              );
            })}
          </div>

          {/* Bottom-Center Countermeasure Arsenal Dock inside Viewport */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-1.5 rounded-2xl bg-white/95 dark:bg-[#0c1524]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 shadow-lg text-xs font-sans">
            <button
              onClick={() => setCurrentWeapon('RF_JAMMER')}
              onMouseDown={handleStartJammer}
              onMouseUp={handleStopJammer}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold ${
                currentWeapon === 'RF_JAMMER'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>RF Jammer</span>
            </button>

            <button
              onClick={() => {
                setCurrentWeapon('SHOTGUN');
                handleFireWeapon();
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold ${
                currentWeapon === 'SHOTGUN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span>Shotgun</span>
            </button>

            <button
              onClick={() => {
                setCurrentWeapon('NET_GUN');
                handleFireWeapon();
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold ${
                currentWeapon === 'NET_GUN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Net Gun</span>
            </button>

            {/* Scope ADS Toggle Button */}
            <button
              onClick={() => {
                isScopedRef.current = !isScopedRef.current;
                setIsScoped(isScopedRef.current);
                spatialAudio.playScopeSound(isScopedRef.current);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold ${
                isScoped
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Toggle Scope [Z] or Right Click"
            >
              <Eye className="w-4 h-4" />
              <span>Scope (ADS)</span>
            </button>

            {/* Reload Button */}
            <button
              onClick={triggerReload}
              disabled={isReloading || (currentWeapon !== 'SHOTGUN' && currentWeapon !== 'NET_GUN')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all font-bold ${
                isReloading
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
              }`}
              title="Reload [R]"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
              <span>Reload [R]</span>
            </button>

            {/* Dynamic Ammo Count Display */}
            <div className="flex items-center gap-2 pl-3 pr-2 py-1 border-l border-slate-200 dark:border-slate-700 font-mono text-xs">
              <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                <span>
                  {currentWeapon === 'SHOTGUN'
                    ? weapons.SHOTGUN.ammo
                    : currentWeapon === 'NET_GUN'
                    ? weapons.NET_GUN.ammo
                    : weapons.RF_JAMMER.ammo}
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-500">
                  {currentWeapon === 'SHOTGUN'
                    ? weapons.SHOTGUN.maxAmmo
                    : currentWeapon === 'NET_GUN'
                    ? weapons.NET_GUN.maxAmmo
                    : weapons.RF_JAMMER.maxAmmo}
                </span>
              </div>
              <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{
                    width: `${(
                      (currentWeapon === 'SHOTGUN'
                        ? weapons.SHOTGUN.ammo / weapons.SHOTGUN.maxAmmo
                        : currentWeapon === 'NET_GUN'
                        ? weapons.NET_GUN.ammo / weapons.NET_GUN.maxAmmo
                        : weapons.RF_JAMMER.ammo / weapons.RF_JAMMER.maxAmmo) * 100
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 4-Panel Multi-Sensor Grid matching image */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-3">
          {/* Panel 1: RF Sensor View */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">RF Sensor View</span>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] border border-emerald-500/30">
                  <Radio className="w-2.5 h-2.5" />
                  <span>Signal Heatmap</span>
                </div>
              </div>
            </div>

            <div className="relative w-full h-28 rounded-xl overflow-hidden my-1 border border-slate-200 dark:border-slate-800 bg-slate-900">
              <canvas ref={rfHeatmapCanvasRef} width={180} height={112} className="w-full h-full block" />
              <div className="absolute right-2 top-2 bottom-2 w-2 rounded-full overflow-hidden flex flex-col shadow">
                <div className="flex-1 bg-gradient-to-b from-red-500 via-amber-400 via-emerald-400 to-blue-500" />
              </div>
              <span className="absolute right-5 top-1.5 text-[8px] font-mono text-red-500 font-bold">Strong</span>
              <span className="absolute right-5 bottom-1.5 text-[8px] font-mono text-blue-500 font-bold">Weak</span>
            </div>
          </div>

          {/* Panel 2: Radar View */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Radar View</span>
              <span className="text-[10px] font-mono text-slate-400">Range: 500m</span>
            </div>

            <div className="flex items-center gap-2.5 my-1">
              <div className="w-20 h-20 rounded-full border border-emerald-500/60 relative overflow-hidden flex items-center justify-center shrink-0 bg-slate-900 shadow-inner">
                <div
                  className="absolute inset-0 radar-sweep-beam"
                  style={{
                    background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.45) 0deg, transparent 60deg)'
                  }}
                />
                <div className="w-14 h-14 rounded-full border border-emerald-500/30 absolute" />
                <div className="w-7 h-7 rounded-full border border-emerald-500/30 absolute" />
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full z-10" />
                <div className="absolute w-full h-px bg-emerald-500/20" />
                <div className="absolute h-full w-px bg-emerald-500/20" />
                <span className="absolute top-0.5 text-[7px] font-mono text-emerald-400 font-bold">N</span>
                <span className="absolute right-0.5 text-[7px] font-mono text-emerald-400 font-bold">E</span>
                <span className="absolute bottom-0.5 text-[7px] font-mono text-emerald-400 font-bold">S</span>
                <span className="absolute left-0.5 text-[7px] font-mono text-emerald-400 font-bold">W</span>

                {/* Dynamic radar blips */}
                {dronesList.filter(d => d.state === 'ACTIVE' || d.state === 'EVADING').map((drone) => {
                  const camPos = cameraRef.current?.position || new THREE.Vector3(0, 15.65, 5);
                  const dx = drone.position.x - camPos.x;
                  const dz = drone.position.z - camPos.z;
                  const maxRange = 250;
                  const scale = 34 / maxRange;
                  const blipX = 40 + Math.max(-36, Math.min(36, dx * scale));
                  const blipY = 40 + Math.max(-36, Math.min(36, dz * scale));
                  return (
                    <div
                      key={drone.id}
                      className="w-1.5 h-1.5 bg-red-500 rounded-full absolute shadow-sm shadow-red-500 transform -translate-x-1/2 -translate-y-1/2 animate-ping"
                      style={{ left: `${blipX}px`, top: `${blipY}px` }}
                    />
                  );
                })}
              </div>

              {/* Live dynamic telemetry list for active drones */}
              <div className="flex flex-col gap-1 text-[9px] font-mono text-slate-600 dark:text-slate-300 overflow-hidden flex-1">
                {dronesList.filter(d => d.state === 'ACTIVE' || d.state === 'EVADING').slice(0, 3).map((drone, idx) => {
                  const camPos = cameraRef.current?.position || new THREE.Vector3(0, 15.65, 5);
                  const dist = Math.round(camPos.distanceTo(drone.position));
                  const alt = Math.round(drone.position.y);
                  const speed = Math.round(drone.velocity.length());
                  return (
                    <div key={drone.id} className="flex items-center gap-1.5 font-bold text-red-500 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span className="truncate">{`Drone ${idx + 1}: ${dist}m | ${alt}m | ${speed}m/s`}</span>
                    </div>
                  );
                })}
                {dronesList.filter(d => d.state === 'ACTIVE' || d.state === 'EVADING').length === 0 && (
                  <div className="text-emerald-500 font-bold">Airspace Clear • All Neutralized</div>
                )}
              </div>
            </div>
          </div>

          {/* Panel 3: EO/IR Camera View */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">EO/IR Camera View</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setEoIrMode('Visual')}
                  className={`text-[9px] px-2 py-0.5 rounded cursor-pointer font-bold ${
                    eoIrMode === 'Visual' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Visual
                </button>
                <button
                  onClick={() => setEoIrMode('Thermal')}
                  className={`text-[9px] px-2 py-0.5 rounded cursor-pointer font-bold ${
                    eoIrMode === 'Thermal' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Thermal
                </button>
              </div>
            </div>

            <div className="w-full h-24 rounded-xl overflow-hidden my-1 relative border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center">
              <div className="w-10 h-10 border border-red-500/80 rounded relative flex items-center justify-center">
                <Crosshair className="w-4 h-4 text-red-500" />
              </div>
              <div className="absolute right-2 top-2 bottom-2 w-1.5 rounded-full bg-gradient-to-b from-red-500 via-amber-400 to-blue-500" />
              <span className="absolute right-4.5 top-1.5 text-[7px] font-mono text-red-400 font-bold">Hot</span>
              <span className="absolute right-4.5 bottom-1.5 text-[7px] font-mono text-blue-400 font-bold">Cold</span>
            </div>
          </div>

          {/* Panel 4: Engagement */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Engagement View</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Live Intercept</span>
            </div>

            <div className="w-full h-24 rounded-xl overflow-hidden my-1 relative border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center">
              {/* Explosion / Combat background graphic */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80"
                style={{
                  backgroundImage: `radial-gradient(circle at center, rgba(239, 68, 68, 0.45) 0%, rgba(245, 158, 11, 0.25) 40%, rgba(15, 23, 42, 0.95) 85%)`
                }}
              />

              {/* Center engagement details */}
              <div className="z-10 flex flex-col items-center">
                <Flame className="w-7 h-7 text-amber-400 animate-bounce" />
                <span className="text-[10px] font-mono text-slate-200 font-bold mt-1">
                  {lastHitConfirmation.droneName} • {lastHitConfirmation.weapon}
                </span>
              </div>

              {/* Solid emerald badge matching reference image */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hit Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tactical Row: Mission Details, Progress Timeline & Performance Metrics */}
      <div className="grid grid-cols-12 gap-3 min-h-[140px]">
        {/* Panel 1: Mission Details */}
        <div className="col-span-12 md:col-span-3 p-4 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-xs">
          <span className="font-bold text-slate-900 dark:text-white pb-1.5 border-b border-slate-100 dark:border-slate-800">
            Mission Details
          </span>

          <div className="flex items-center gap-3 my-1">
            <div className="w-14 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
              <img src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=200&q=80" alt="Urban" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                {isDark ? 'Urban Night - Swarm Attack' : 'Urban Day - Swarm Attack'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {isDark ? 'Low visibility night operations with multiple drones.' : 'Detect and engage multiple drones in urban environment.'}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800 font-mono">
            <span>Diff: <span className="text-amber-500">★★★★☆</span></span>
            <span>Env: <span className="font-bold text-slate-800 dark:text-slate-200">Urban</span></span>
            <span>Types: <span className="text-red-500 font-bold">FPV, Recon, Micro</span></span>
          </div>
        </div>

        {/* Panel 2: Progress & Timeline */}
        <div className="col-span-12 md:col-span-4 p-4 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-xs">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white">Progress & Timeline</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {isDark ? '00:42 / 05:00' : '02:15 / 05:00'}
            </span>
          </div>

          {/* Interactive Timeline Bar with Red/Green/Yellow Pins matching image */}
          <div className="relative w-full my-3 flex items-center">
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full relative overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: isDark ? '24%' : '45%' }} />
            </div>
            {/* Pins */}
            <div className="absolute left-[20%] -top-1.5 w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm" />
            <div className="absolute left-[45%] -top-1.5 w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm" />
            <div className="absolute left-[70%] -top-1.5 w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm" />
            <div className="absolute left-[88%] -top-1.5 w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" />
          </div>

          <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-800 font-mono text-xs">
            <button
              onClick={() => setIsTimelinePlaying(!isTimelinePlaying)}
              className="p-1 rounded-lg bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 text-slate-800 dark:text-white cursor-pointer"
            >
              {isTimelinePlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <div className="flex gap-1">
              {[1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setTimelineSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                    timelineSpeed === s ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <button
              onClick={handleCompleteMission}
              className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer hover:bg-emerald-700 shadow-sm"
            >
              Finish Training
            </button>
          </div>
        </div>

        {/* Panel 3: Performance Metrics */}
        <div className="col-span-12 md:col-span-5 p-4 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-xs">
          <span className="font-bold text-slate-900 dark:text-white pb-1.5 border-b border-slate-100 dark:border-slate-800">
            Performance Metrics
          </span>

          <div className="grid grid-cols-4 gap-2 my-1 text-center font-mono">
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-[#080e18] border border-slate-100 dark:border-slate-800/80">
              <Clock className="w-4 h-4 text-emerald-600 mb-0.5" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{isDark ? '18s' : '15s'}</span>
              <span className="text-[9px] text-slate-400">Avg. Detection</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-[#080e18] border border-slate-100 dark:border-slate-800/80">
              <Target className="w-4 h-4 text-emerald-600 mb-0.5" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{isDark ? '80%' : '85%'}</span>
              <span className="text-[9px] text-slate-400">Classification</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-[#080e18] border border-slate-100 dark:border-slate-800/80">
              <Shield className="w-4 h-4 text-emerald-600 mb-0.5" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{isDark ? '70%' : '75%'}</span>
              <span className="text-[9px] text-slate-400">Success Rate</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-[#080e18] border border-slate-100 dark:border-slate-800/80">
              <Radio className="w-4 h-4 text-emerald-600 mb-0.5" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {dronesList.filter(d => d.state === 'DESTROYED' || d.state === 'NET_ENTANGLED' || d.state === 'JAMMED').length} / 5
              </span>
              <span className="text-[9px] text-slate-400">Neutralized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
