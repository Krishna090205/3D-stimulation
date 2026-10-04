/**
 * AeroShield 3D Spatial Audio Engine (Web Audio API with HRTF)
 * Provides realistic directional drone motor whines, Doppler shifts, weapon blasts, and tactical sound effects.
 */

class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private droneNodes: Map<string, { osc: OscillatorNode; filter: BiquadFilterNode; panner: PannerNode; gain: GainNode }> = new Map();
  private jammerOsc: OscillatorNode | null = null;
  private jammerGain: GainNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setListener(position: { x: number; y: number; z: number }, forward: { x: number; y: number; z: number }, up = { x: 0, y: 1, z: 0 }) {
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.value = position.x;
      listener.positionY.value = position.y;
      listener.positionZ.value = position.z;
      listener.forwardX.value = forward.x;
      listener.forwardY.value = forward.y;
      listener.forwardZ.value = forward.z;
      listener.upX.value = up.x;
      listener.upY.value = up.y;
      listener.upZ.value = up.z;
    } else {
      // Fallback for older browsers
      listener.setPosition(position.x, position.y, position.z);
      listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  /**
   * Updates or creates a 3D HRTF spatial sound source for a specific drone
   */
  public updateDroneAudio(id: string, position: { x: number; y: number; z: number }, velocityMagnitude: number, isJammed: boolean, droneType: string) {
    if (!this.ctx || this.isMuted) return;

    let node = this.droneNodes.get(id);
    if (!node) {
      try {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const panner = this.ctx.createPanner();
        const gain = this.ctx.createGain();

        // Configure HRTF spatial panner
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 15;
        panner.maxDistance = 600;
        panner.rolloffFactor = 1.2;
        panner.coneInnerAngle = 360;

        // Base frequency varies by drone type
        let baseFreq = 580; // Standard commercial DJI quad
        if (droneType === 'FPV_KAMIKAZE') baseFreq = 880; // High screaming pitch
        if (droneType === 'MILITARY_FIXED_WING') baseFreq = 340; // Low jet/pusher prop hum
        if (droneType === 'SWARM_ASSAULT') baseFreq = 720;
        if (droneType === 'MICRO_SURVEILLANCE') baseFreq = 950;

        osc.type = droneType === 'MILITARY_FIXED_WING' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq * 1.5, this.ctx.currentTime);
        filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        osc.connect(filter);
        filter.connect(panner);
        panner.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();

        node = { osc, filter, panner, gain };
        this.droneNodes.set(id, node);
      } catch (e) {
        return;
      }
    }

    // Update 3D HRTF position
    const t = this.ctx.currentTime;
    if (node.panner.positionX) {
      node.panner.positionX.setTargetAtTime(position.x, t, 0.05);
      node.panner.positionY.setTargetAtTime(position.y, t, 0.05);
      node.panner.positionZ.setTargetAtTime(position.z, t, 0.05);
    } else {
      node.panner.setPosition(position.x, position.y, position.z);
    }

    // RPM pitch modulation & Doppler based on speed
    const baseFreq = droneType === 'FPV_KAMIKAZE' ? 880 : 580;
    const speedPitch = isJammed ? 200 : baseFreq + velocityMagnitude * 6;
    node.osc.frequency.setTargetAtTime(speedPitch, t, 0.1);

    // Stutter sound if jammed
    if (isJammed) {
      node.gain.gain.setTargetAtTime(Math.random() > 0.4 ? 0.03 : 0.005, t, 0.05);
    } else {
      node.gain.gain.setTargetAtTime(0.08, t, 0.1);
    }
  }

  public removeDroneAudio(id: string) {
    const node = this.droneNodes.get(id);
    if (node) {
      try {
        node.gain.gain.setTargetAtTime(0, this.ctx?.currentTime || 0, 0.05);
        setTimeout(() => {
          try {
            node.osc.stop();
            node.osc.disconnect();
          } catch (e) {}
        }, 100);
      } catch (e) {}
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
