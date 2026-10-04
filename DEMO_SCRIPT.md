# AeroShield C-UAS | 2-Minute SIH Judging Demo Script

**Problem Statement 26247**: AI-Enabled Drone & Counter-Drone Threat Simulation Trainer  
**Target Duration**: 2 Minutes (120 Seconds)  
**Presenter Tone**: Confident, operational, defense-technology focused  

---

### [0:00 - 0:20] Hook & Problem Overview (20s)
> *"Respected judges, asymmetrical drone warfare has evolved. Today, hostile actors deploy low-cost commercial drones, high-speed FPV kamikazes, and autonomous swarms that overwhelm traditional air defenses.*  
> *To train defense personnel rapidly and cost-effectively without multimillion-dollar live-fire exercises, we built **AeroShield C-UAS** — a high-fidelity 3D simulation trainer built with React 18, Three.js, spatial audio, and an offline-first SQLite core.*  
> *Our core design principle: **The backend technology is advanced (AI Boids, RF simulation, ballistic physics, HRTF spatial audio), but the soldier experiences an instinctive, 6-step operational loop:**  
> **Choose mission ➔ Detect threat ➔ Identify threat ➔ Make decision ➔ Engage ➔ Review performance.**"*

**Action**: Show the **Operator Login** screen (`Callsign: Viper-Actual`) and click **"ACCESS C-UAS SIMULATOR"**.

---

### [0:20 - 0:40] Dashboard & Scenario Selection (20s)
> *"Operators are greeted by this tactical glassmorphic dashboard showcasing historical telemetry, qualification ranks, and career metrics synced directly to our local SQLite database. Notice our 5-minute quickstart guide — making the system so intuitive a cadet can master it in minutes.*  
> *Clicking **'START TRAINING'**, we see 5 realistic mission profiles: from commercial DJI reconnaissance to high-speed FPV kamikazes, night stealth infiltrations, and bad-weather raids. Let's launch **Mission 04: Coordinated Autonomous Swarm Raid**."*

**Action**: Click **"START TRAINING"**, briefly highlight the 5 scenario cards, then click **"LAUNCH SIMULATION"** on Mission 04.

---

### [0:40 - 1:10] 3D Simulation, Sensors & Swarm AI (30s)
> *"We are now in the 3D operator turret. Notice four critical innovations simultaneously in play:*  
> *1. **Top-Left**: Our 360-degree tactical radar with live sweep, range rings, and altitude readouts.*  
> *2. **Spatial Audio**: Listen to the 3D HRTF directional motor whines that shift dynamically based on drone angle and velocity.*  
> *3. **Sensors**: On the right, we toggle from Optical RGB to **FLIR Thermal White-Hot** and **RF Heatmap**, revealing the 915 MHz swarm mesh emission signatures.*  
> *4. **Swarm AI**: Notice the drones executing realistic 3D **Boids flocking** — separation, cohesion, and alignment — while actively performing evasive barrel rolls when my reticle locks onto them!"*

**Action**: 
- Rotate turret smoothly with mouse.
- Switch to **IR W-Hot** then **RF Heat**.
- Point at an incoming drone to demonstrate evasive jinking and lead indicator ring.

---

### [1:10 - 1:35] Counter-Drone Engagement & Live Instructor Control (25s)
> *"Now for the counter-measures: We deploy our **Directed RF Jammer** on 2.4/5.8 GHz. Pressing Space, you see the conical electromagnetic beam disrupt the drone's C2 link, forcing it into failsafe descent.*  
> *Next, we switch to our kinetic **Heavy Shotgun** and **Net-Gun Launcher** with simulated ballistic physics and lead-prediction indicators. A direct net hit entangles the rotors, plunging the threat to the ground!*  
> *Furthermore, instructors can press **[I]** mid-session to dynamically inject sudden rain, shift to night mode, or trigger a surprise swarm kamikaze dive!"*

**Action**:
- Hold **[Space]** to jam a drone (watch beam and drone descent).
- Press **[2]** for Shotgun and fire at a drone.
- Press **[I]** to open the **Instructor Panel**, click **"TRIGGER SWARM CONVERGE"**, and close the panel.

---

### [1:35 - 2:00] Actionable AAR (After Action Report) & Offline Replay (25s)
> *"Upon neutralizing all hostiles or defending the base asset, AeroShield automatically generates this comprehensive **After Action Report (AAR)**.*  
> *Unlike basic scorecards, we provide:*  
> *1. **3D Spatial Engagement Replay**: Operators can scrub through a full timeline of drone flight vectors, projectile arcs, and jamming cones.*  
> *2. **Actionable Metrics**: Kinetic accuracy %, EW jamming efficacy, target lock latency, and defended asset preservation.*  
> *3. **One-Click PDF Export**: For official debrief certificates, saved alongside all session logs in our local SQLite database.*  
> *AeroShield C-UAS is 100% offline-ready, browser-based, and ready for deployment across defense training establishments today. Thank you!"*

**Action**:
- Highlight the **Operator Tier Badge (S/A Grade)** and the 4 metric cards.
- Switch to the **"3D ENGAGEMENT REPLAY"** tab and drag the timeline scrubber.
- Click **"EXPORT PDF / PRINT"** to show the debrief certificate preview!
