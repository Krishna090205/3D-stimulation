/**
 * AeroShield 3D Spatial Audio Engine (Web Audio API with HRTF)
 * Provides realistic directional drone motor whines, Doppler shifts, weapon blasts, and tactical sound effects.
 */

class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private droneNodes: Map<
    string,
    {
      osc1: OscillatorNode;
      osc2: OscillatorNode;
      filter: BiquadFilterNode;
      panner: PannerNode;
      gain: GainNode;
    }
  > = new Map();
  private jammerOsc: OscillatorNode | null = null;
  private jammerGain: GainNode | null = null;
  private lastFootstepTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.init();
        ['click', 'keydown', 'mousedown', 'touchstart'].forEach((ev) => {
          window.removeEventListener(ev, unlockAudio);
        });
      };
      ['click', 'keydown', 'mousedown', 'touchstart'].forEach((ev) => {
        window.addEventListener(ev, unlockAudio, { passive: true });
      });
    }
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setListener(
    position: { x: number; y: number; z: number },
    forward: { x: number; y: number; z: number },
    up = { x: 0, y: 1, z: 0 }
  ) {
    this.init();
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    const t = this.ctx.currentTime;
    if (listener.positionX) {
      listener.positionX.setTargetAtTime(position.x, t, 0.05);
      listener.positionY.setTargetAtTime(position.y, t, 0.05);
      listener.positionZ.setTargetAtTime(position.z, t, 0.05);
      listener.forwardX.setTargetAtTime(forward.x, t, 0.05);
      listener.forwardY.setTargetAtTime(forward.y, t, 0.05);
      listener.forwardZ.setTargetAtTime(forward.z, t, 0.05);
      listener.upX.setTargetAtTime(up.x, t, 0.05);
      listener.upY.setTargetAtTime(up.y, t, 0.05);
      listener.upZ.setTargetAtTime(up.z, t, 0.05);
    } else {
      // Fallback for older Web Audio specifications
      listener.setPosition(position.x, position.y, position.z);
      listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  /**
   * Updates or creates a 3D HRTF spatial sound source for a specific drone so the player
   * can pinpoint the drone's position in 3D space by ear.
   */
  public updateDroneAudio(
    id: string,
    position: { x: number; y: number; z: number },
    velocityMagnitude: number,
    isJammed: boolean,
    droneType: string
  ) {
    this.init();
    if (!this.ctx || this.isMuted) return;

    let node = this.droneNodes.get(id);
    if (!node) {
      try {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const panner = this.ctx.createPanner();
        const gain = this.ctx.createGain();

        // Configure HRTF spatial panner for realistic 3D localization
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 12; // Sound starts decaying past 12m
        panner.maxDistance = 500; // Audible up to 500m
        panner.rolloffFactor = 1.35;
        panner.coneInnerAngle = 360;

        // Base frequency varies by drone engine profile
        let baseFreq = 540; // DJI Mavic quadcopter hum
        if (droneType === 'FPV_KAMIKAZE') baseFreq = 920; // High-rpm scream
        if (droneType === 'MILITARY_FIXED_WING') baseFreq = 310; // Low pusher-prop rumble
        if (droneType === 'SWARM_ASSAULT') baseFreq = 740;
        if (droneType === 'MICRO_SURVEILLANCE') baseFreq = 1050;

        osc1.type = droneType === 'MILITARY_FIXED_WING' ? 'sawtooth' : 'triangle';
        osc1.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

        // Second oscillator: blade passing frequency overtone
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(baseFreq * 2.05, this.ctx.currentTime);

        const osc2Gain = this.ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        osc2.connect(osc2Gain);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq * 1.6, this.ctx.currentTime);
        filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

        // Audible and clear baseline volume
        gain.gain.setValueAtTime(0.24, this.ctx.currentTime);

        osc1.connect(filter);
        osc2Gain.connect(filter);
        filter.connect(panner);
        panner.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();

        node = { osc1, osc2, filter, panner, gain };
        this.droneNodes.set(id, node);
      } catch {
        return;
      }
    }

    // Update 3D HRTF coordinates in real time
    const t = this.ctx.currentTime;
    if (node.panner.positionX) {
      node.panner.positionX.setTargetAtTime(position.x, t, 0.04);
      node.panner.positionY.setTargetAtTime(position.y, t, 0.04);
      node.panner.positionZ.setTargetAtTime(position.z, t, 0.04);
    } else {
      node.panner.setPosition(position.x, position.y, position.z);
    }

    // RPM pitch modulation & Doppler shift based on drone velocity
    let baseFreq = 540;
    if (droneType === 'FPV_KAMIKAZE') baseFreq = 920;
    if (droneType === 'MILITARY_FIXED_WING') baseFreq = 310;
    if (droneType === 'SWARM_ASSAULT') baseFreq = 740;
    if (droneType === 'MICRO_SURVEILLANCE') baseFreq = 1050;

    const speedPitch = isJammed ? 160 : baseFreq + velocityMagnitude * 5.5;
    node.osc1.frequency.setTargetAtTime(speedPitch, t, 0.08);
    node.osc2.frequency.setTargetAtTime(speedPitch * 2.05, t, 0.08);
    node.filter.frequency.setTargetAtTime(speedPitch * 1.5, t, 0.08);

    // Stutter and sputter sound if jammed
    if (isJammed) {
      node.gain.gain.setTargetAtTime(Math.random() > 0.4 ? 0.08 : 0.01, t, 0.04);
    } else {
      node.gain.gain.setTargetAtTime(0.24, t, 0.08);
    }
  }

  public removeDroneAudio(id: string) {
    const node = this.droneNodes.get(id);
    if (node) {
      try {
        node.gain.gain.setTargetAtTime(0, this.ctx?.currentTime || 0, 0.05);
        setTimeout(() => {
          try {
            node.osc1.stop();
            node.osc1.disconnect();
            node.osc2.stop();
            node.osc2.disconnect();
          } catch {}
        }, 100);
      } catch {}
      this.droneNodes.delete(id);
    }
  }


  public clearAllDrones() {
    this.droneNodes.forEach((_, id) => this.removeDroneAudio(id));
    this.droneNodes.clear();
  }

  /**
   * Sound effect: Heavy Tactical Shotgun blast
   */
  public playShotgun() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Noise blast for muzzle blast
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.06));
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    // Low sub thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.25);
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    whiteNoise.start(t);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  /**
   * Sound effect: High-Caliber Anti-Materiel C-UAS Sniper Rifle
   * Produces a sharp supersonic bullet snap, concussive bass blast, and reverberant roll.
   */
  public playSniper() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // 1. Supersonic crack / shockwave transient (sharp high band)
    const crackSize = Math.floor(this.ctx.sampleRate * 0.12);
    const crackBuffer = this.ctx.createBuffer(1, crackSize, this.ctx.sampleRate);
    const crackData = crackBuffer.getChannelData(0);
    for (let i = 0; i < crackSize; i++) {
      crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
    }
    const crackSource = this.ctx.createBufferSource();
    crackSource.buffer = crackBuffer;

    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.setValueAtTime(2400, t);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.75, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.ctx.destination);

    // 2. Concussive Sub-Bass Blast (50Hz - 25Hz punch)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, t);
    subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.45);
    subGain.gain.setValueAtTime(0.85, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);

    // 3. Reverberation echo across the open battlefield
    const reverbSize = Math.floor(this.ctx.sampleRate * 0.85);
    const reverbBuffer = this.ctx.createBuffer(1, reverbSize, this.ctx.sampleRate);
    const reverbData = reverbBuffer.getChannelData(0);
    for (let i = 0; i < reverbSize; i++) {
      reverbData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.22));
    }
    const reverbSource = this.ctx.createBufferSource();
    reverbSource.buffer = reverbBuffer;

    const reverbFilter = this.ctx.createBiquadFilter();
    reverbFilter.type = 'lowpass';
    reverbFilter.frequency.setValueAtTime(650, t);
    reverbFilter.frequency.exponentialRampToValueAtTime(90, t + 0.8);

    const reverbGain = this.ctx.createGain();
    reverbGain.gain.setValueAtTime(0.4, t);
    reverbGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    reverbSource.connect(reverbFilter);
    reverbFilter.connect(reverbGain);
    reverbGain.connect(this.ctx.destination);

    crackSource.start(t);
    subOsc.start(t);
    subOsc.stop(t + 0.52);
    reverbSource.start(t);
  }

  /**
   * Sound effect: Tactical combat boot footstep on concrete/gravel
   */
  public playFootstep(isSprinting: boolean = false) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = performance.now();
    const minInterval = isSprinting ? 280 : 420;
    if (now - this.lastFootstepTime < minInterval) return;
    this.lastFootstepTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isSprinting ? 140 : 110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);

    gain.gain.setValueAtTime(isSprinting ? 0.16 : 0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Sound effect: Pneumatic Net-Gun compressed gas discharge
   */

  public playNetGun() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Pneumatic gas whoosh
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(2500, t + 0.25);
    filter.Q.setValueAtTime(2.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  /**
   * Sound effect: Directed RF Jammer electromagnetic microwave pulse
   */
  public startJammerSound() {
    if (!this.ctx || this.isMuted || this.jammerOsc) return;
    const t = this.ctx.currentTime;

    this.jammerOsc = this.ctx.createOscillator();
    this.jammerGain = this.ctx.createGain();

    this.jammerOsc.type = 'sawtooth';
    this.jammerOsc.frequency.setValueAtTime(140, t);

    // Modulate frequency to create an aggressive electronic beam hum
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(12, t);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(45, t);
    lfo.connect(this.jammerOsc.frequency);
    lfo.start(t);

    this.jammerGain.gain.setValueAtTime(0.12, t);

    this.jammerOsc.connect(this.jammerGain);
    this.jammerGain.connect(this.ctx.destination);

    this.jammerOsc.start(t);
  }

  public stopJammerSound() {
    if (this.jammerOsc && this.jammerGain && this.ctx) {
      try {
        this.jammerGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        setTimeout(() => {
          this.jammerOsc?.stop();
          this.jammerOsc?.disconnect();
          this.jammerOsc = null;
          this.jammerGain = null;
        }, 80);
      } catch (e) {
        this.jammerOsc = null;
        this.jammerGain = null;
      }
    }
  }

  /**
   * Sound effect: Threat Neutralization / Drone Crash explosion
   */
  public playExplosion() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  /**
   * Sound effect: Radar sweep ping
   */
  public playRadarPing() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.12);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  /**
   * Sound effect: Tactical mechanical reload sequence (mag drop, mag in, bolt rack)
   */
  public playReloadSound() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // 1. Mag release click (t = 0)
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(420, t);
    osc1.frequency.exponentialRampToValueAtTime(160, t + 0.08);
    g1.gain.setValueAtTime(0.3, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1.connect(g1);
    g1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.09);

    // 2. Mag inserted snap (t + 0.45s)
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(550, t + 0.45);
    osc2.frequency.exponentialRampToValueAtTime(220, t + 0.55);
    g2.gain.setValueAtTime(0.35, t + 0.45);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc2.connect(g2);
    g2.connect(this.ctx.destination);
    osc2.start(t + 0.45);
    osc2.stop(t + 0.56);

    // 3. Bolt pull & slide release (t + 0.85s)
    const osc3 = this.ctx.createOscillator();
    const g3 = this.ctx.createGain();
    osc3.type = 'sawtooth';
    osc3.frequency.setValueAtTime(320, t + 0.85);
    osc3.frequency.exponentialRampToValueAtTime(780, t + 0.95);
    g3.gain.setValueAtTime(0.4, t + 0.85);
    g3.gain.exponentialRampToValueAtTime(0.001, t + 0.98);
    osc3.connect(g3);
    g3.connect(this.ctx.destination);
    osc3.start(t + 0.85);
    osc3.stop(t + 0.99);
  }

  /**
   * Sound effect: Tactical optical ADS zoom in / out
   */
  public playScopeSound(isZoomingIn: boolean) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    if (isZoomingIn) {
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(950, t + 0.08);
    } else {
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.08);
    }
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Sound effect: Sputtering damaged drone falling whine
   */
  public playDroneFallingSound() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(680, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 1.2);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 1.25);
  }

  /**
   * Sound effect: Crisp tactical hit confirmation click/tone
   */
  public playHitConfirmationSound() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1450, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.07);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Sound effect: Tactical lock alert
   */
  public playLockBeep() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.clearAllDrones();
      this.stopJammerSound();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const spatialAudio = new SpatialAudioEngine();
