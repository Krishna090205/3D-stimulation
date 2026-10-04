# AeroShield C-UAS | AI-Enabled Drone & Counter-Drone Threat Simulation Trainer

**Smart India Hackathon (SIH) Problem 26247**  
An advanced, browser-based, offline-first 3D Counter-Unmanned Aerial Systems (C-UAS) training simulator designed to train operators in detecting, tracking, and neutralizing autonomous drone swarms and adversarial UAV threats.

---

## 🚀 Key Features

### 1. Unified Light ↔ Dark Theme System
A single, maintainable component architecture where toggling between **Light Mode** and **Dark Mode** dynamically adapts every screen:
- **Light Mode (Clean & Professional)**:
  - White / soft blue-gray background (`#f0f4f8`)
  - Dark navy typography (`#0f172a`)
  - Crisp emerald primary action buttons
  - Soft card shadows & clean border aesthetics
  - Bright, daytime 3D simulation skies (`#bfe3f7`) with sunlight and clear visibility
  - Ideal for classroom training, instructor evaluation, reporting, and AAR printouts
- **Dark Mode (Tactical & Immersive)**:
  - Deep navy / charcoal background (`#0a192f`)
  - High-contrast white and light-gray typography
  - Emerald tactical highlights and red/orange hostile threat indicators
  - Atmospheric night 3D simulation with perimeter defense spotlights and beacon lights
  - Prominent RF signal heatmaps and radar sweep glow
  - Ideal for immersive frontline tactical operator training
- **Instant Synchronization**:
  - `Login → Dashboard → Mission Selection → Training → Sensor Views → Engagement → Mission Complete → AAR → History → Performance → Settings`
  - All adapt automatically via the centralized `ThemeProvider` and Settings modal.

### 2. High-Fidelity 3D Simulation Environment (Three.js)
- **Terrains**: Procedural **Urban Sector** (high-rise complexes, perimeter sentry towers, asphalt grid, storage depots) and **Rural Outpost** (rolling hills, sandbag revetments, tactical mast, coniferous forests).
- **Atmospheric Conditions**: Day/Night cycles with tactical spotlighting, dynamic volumetric fog, and particle-based rain.
- **5 Realistic Threat UAV Models**:
  1. **DJI Phantom/Mavic Quadcopter**: Commercial ISR recon with 3-axis camera gimbal and status beacon.
  2. **FPV Kamikaze Racer**: High-speed carbon X-frame racing drone with shaped explosive warhead and high-G diving maneuvers.
  3. **Military Delta-Wing Recon UAV**: Low-RCS stealth fixed-wing platform with rear pusher prop.
  4. **Micro-UAV Surveillance**: Ultra-compact nano quad with whip antenna for silent hovering.
  5. **Autonomous Swarm Unit**: Flocking assault unit with synchronized mesh network LED beacon.

### 2. Multi-Layer Tactical Sensor Suite
- **EO (Electro-Optical) Color**: High-resolution optical camera with crosshair reticle, optical zoom (2X / 4X), and laser rangefinder telemetry.
- **FLIR Thermal Infrared**: Toggleable **White-Hot** and **Black-Hot** thermal shaders highlighting drone electric motors and LiPo battery heat signatures.
- **RF Spectrum Analyzer & Heatmap**: Live multi-band frequency monitor (2.4 GHz, 5.8 GHz, 915 MHz Swarm Mesh, 433 MHz Satcom) with signal strength dBm readouts and emission rings.
- **Tactical 360° Radar Scope**: Top-left circular radar with sweeping beam, range rings (75m, 150m, 225m, 300m), azimuth compass markings, and real-time altitude tags.

### 3. Spatial Audio (Web Audio API with HRTF)
- Real-time 3D directional motor whine with Doppler frequency modulation as high-speed FPV drones dive.
- Realistic weapon sound synthesis: Heavy 12-gauge shotgun blast, pneumatic net launcher whoosh, microwave RF jammer pulse, and crash explosions.

### 4. Counter-Drone Weapons & Ballistic Physics
- **Directed Energy RF Jammer**: Conical electromagnetic beam disrupting GPS navigation and C2 telemetry links, forcing drones into failsafe hover/auto-landing.
- **Heavy Tactical Shotgun**: 12-pellet tungsten buckshot cone with ballistic drop, lead indicator circle, and kinetic destruction.
- **Pneumatic Net Launcher**: Parabolic trajectory with expanding capture mesh that physically entangles rotors, causing immediate drone drop.

### 5. Autonomous Swarm AI & Evasive Tactics
- Full 3D **Boids Flocking Algorithm** (Separation, Cohesion, Alignment, Target Attraction).
- Evasive maneuvers: Drones trigger barrel rolls, lateral jinks, and altitude dives when targeted by player reticles.
- Procedural wave generation with randomized infiltration azimuths and formations.

### 6. Interactive After-Action Report (AAR) & 3D Replay
- **Interactive 3D Replay**: Timeline scrubber (0:00 to end) with Play, Pause, Rewind, and speed controls (0.5x, 1x, 2x).
- **Chronological Event Pins**: Timestamps for radar detections, weapon fires, hits, jams, and perimeter breaches.
- **Performance Metrics**: Kinetic Accuracy %, Reaction Time Latency, RF Jamming Efficacy %, and Asset Preservation %.
- **Operator Tier Grading**: S / A / B / C / D qualification badges.
- **Debrief Export**: One-click printable PDF debrief report.

### 7. Instructor Live Scenario Control Panel
- Accessible mid-session via hotkey `[I]` or top bar button.
- Dynamically alter weather (Clear, Fog, Rain) or day/night lighting.
- Spawn surprise drone waves (select drone type & quantity).
- Inject combat stress: Trigger immediate **Swarm Kamikaze Convergence** or **ECCM Frequency Hopping**.

### 8. Offline-First SQLite Architecture
- Local SQLite database (`data/drone_trainer.db`) storing:
  - `users`: Operator profiles and qualification ranks.
  - `scenarios`: 5 predefined tactical missions.
  - `sessions`: Session telemetry, scores, grades, and replay frames.
  - `events`: Timestamped chronological action logs.
- Automatic fallback to browser local storage if running in standalone mode.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Three.js, Tailwind CSS v4, Lucide Icons
- **Audio Engine**: Web Audio API with HRTF 3D Panning
- **Backend**: Node.js, Express, CORS
- **Database**: SQLite (`sql.js` WebAssembly engine with disk persistence to `data/drone_trainer.db`)
- **Build Tool**: Vite 6

---

## ⚡ Quick Start & Installation

### Prerequisites
- Node.js (v18+ or v20+ or v22+)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd Drone

# Install all dependencies
npm install

# Start both Express Backend and Vite Frontend concurrently
npm run dev
```

### Accessing the Simulator
- Open your browser at: **`http://localhost:5173`**
- The backend API runs on: **`http://localhost:3001`**

---

## 🎮 Operator Controls & Hotkeys

| Action | Control / Hotkey | Description |
| :--- | :--- | :--- |
| **Aim Reticle** | Mouse Movement | Rotates operator turret in 360° azimuth & elevation |
| **Select RF Jammer** | `[1]` | Switches to Directed Microwave DroneGun |
| **Select Shotgun** | `[2]` | Switches to Heavy 12-Gauge Tactical Shotgun |
| **Select Net-Gun** | `[3]` | Switches to Pneumatic Net Launcher |
| **Fire Kinetic Weapon** | Left Mouse Button (LMB) | Discharges shotgun pellets or deploying net |
| **Transmit Jamming Beam** | Hold `[Space]` / Hold Button | Transmits directional RF disruption cone |
| **Reload Ammo** | `[R]` | Reloads shotgun shells or net canisters |
| **Cycle Optical Zoom** | `Sensor Panel > Zoom` | Cycles 1X → 2X → 4X optical magnification |
| **Sensor Layers** | Click EO / IR / RF Tabs | Switches between RGB, FLIR Thermal, and RF Heatmap |
| **Instructor Panel** | `[I]` / Instructor Button | Opens live scenario modification drawer |
| **Toggle Spatial Audio** | Top Speaker Icon | Mutes / Unmutes 3D HRTF directional sounds |

---

## 📂 Project Directory Structure

```
Drone/
├── data/                         # Local SQLite database directory
│   └── drone_trainer.db          # SQLite persistent database file
├── server/                       # Node.js + Express backend
│   ├── db.js                     # SQLite schema, tables, and seed queries
│   └── index.js                  # API routes (sessions, history, scenarios, instructor)
├── src/                          # React + Three.js application
│   ├── components/               # Modular UI & Simulation components
│   │   ├── AfterActionReport.tsx # 3D Replay & Performance Scorecard
│   │   ├── Dashboard.tsx         # Commander dashboard & career stats
│   │   ├── InstructorPanel.tsx   # Live scenario control modal
│   │   ├── LoginModal.tsx        # Callsign & rank operator profile setup
│   │   ├── MissionSelect.tsx     # 5 Tactical scenario cards
│   │   ├── SensorsPanel.tsx      # EO, FLIR IR White/Black-Hot, RF Heatmap
│   │   ├── TacticalRadar.tsx     # 360-degree sweeping radar minimap
│   │   ├── TrainingCanvas.tsx    # Three.js 3D viewport & game loop
│   │   └── WeaponsPanel.tsx      # Counter-drone arsenal dock
│   ├── services/
│   │   ├── apiService.ts         # REST client with offline SQLite fallback
│   │   └── audioService.ts       # Web Audio API HRTF 3D spatial engine
│   ├── simulation/
│   │   ├── Ballistics.ts         # Kinetic physics, pellet spread, lead ring
│   │   ├── BoidsSwarm.ts         # 3D Boids algorithm & threat evasion AI
│   │   ├── DroneModels.ts        # Procedural 3D models for all 5 drone types
│   │   └── Terrain.ts            # Procedural Urban & Rural 3D terrain
│   ├── types/
│   │   └── simulation.ts         # TypeScript interfaces & domain types
│   ├── App.tsx                   # Main state machine & flow controller
│   ├── index.css                 # Glassmorphism tokens & HUD animations
│   └── main.tsx                  # Application bootstrap entry point
├── DEMO_SCRIPT.md                # 2-minute judged presentation script
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🏆 SIH Problem 26247 Compliance Checklist

- [x] **3D Training Environment**: Urban and rural terrains with dynamic weather (clear, fog, rain) and day/night cycle.
- [x] **5 Drone Models**: Commercial DJI quadcopters, High-speed FPV kamikaze racers, Military fixed-wing delta UAVs, Micro-surveillance drones, and Autonomous swarm assault units.
- [x] **Sensors**: RF spectrum heatmap, 360° radar sweep with blips, and toggleable EO/IR camera modes (FLIR White-Hot & Black-Hot).
- [x] **Spatial Audio**: Directional HRTF 3D drone motor whines, Doppler shifts, and synthesized firing sounds.
- [x] **Engagement**: Directed RF jamming with cone visualizer + shotgun tungsten buckshot and pneumatic net-gun with ballistic physics.
- [x] **AI Threats**: 3D Boids flocking algorithm, evasive dodging upon reticle lock-on, and procedural wave generation.
- [x] **Actionable AAR**: 3D spatial replay with timeline scrubber, chronological event markers, performance scorecard, and PDF export.
- [x] **Instructor Panel**: Mid-session control to inject weather changes, spawn surprise drone waves, and trigger swarm convergence.
- [x] **Offline-First SQLite**: Local SQLite storage for users, scenarios, sessions, and events tables with seamless standalone fallback.
