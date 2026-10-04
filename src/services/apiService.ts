import { Scenario, SessionResult, SimulationEvent } from '../types/simulation';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE = rawBaseUrl ? `${(rawBaseUrl as string).replace(/\/$/, '')}/api` : '/api';

// Fallback scenarios if server is unreachable
export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'scen-1',
    title: 'Forward Outpost Recon Intrusion',
    description: 'Commercial DJI quadcopters conducting low-altitude ISR surveillance over tactical communications mast.',
    difficulty: 'Beginner',
    terrain: 'rural',
    weather: 'clear',
    time_of_day: 'day',
    drone_count: 2,
    threat_types: ['DJI Mavic Pro', 'DJI Phantom 4'],
    target_asset: 'Tactical Communications Mast'
  },
  {
    id: 'scen-2',
    title: 'High-Speed FPV Kamikaze Attack',
    description: 'Dual high-velocity FPV quadcopters diving aggressively toward mobile command vehicle at erratic trajectories.',
    difficulty: 'Intermediate',
    terrain: 'urban',
    weather: 'clear',
    time_of_day: 'day',
    drone_count: 3,
    threat_types: ['FPV Kamikaze Racer', 'FPV Heavy Lifter'],
    target_asset: 'Mobile Command Vehicle'
  },
  {
    id: 'scen-3',
    title: 'Night Refinery Stealth Infiltration',
    description: 'Long-range military fixed-wing stealth UAV cruising in low radar cross-section under dark skies.',
    difficulty: 'Advanced',
    terrain: 'urban',
    weather: 'clear',
    time_of_day: 'night',
    drone_count: 3,
    threat_types: ['Military Delta-Wing', 'Surveillance Micro-UAV'],
    target_asset: 'Strategic Fuel Storage Tanks'
  },
  {
    id: 'scen-4',
    title: 'Coordinated Autonomous Swarm Raid',
    description: 'Flock of 6 autonomous drones executing 3D Boids cohesion and evasive dispersion to saturate kinetic defenses.',
    difficulty: 'Expert',
    terrain: 'rural',
    weather: 'fog',
    time_of_day: 'day',
    drone_count: 6,
    threat_types: ['Autonomous Swarm Unit', 'FPV Kamikaze Racer'],
    target_asset: 'Forward Air Defense Radar'
  },
  {
    id: 'scen-5',
    title: 'Bad Weather Border Incursion',
    description: 'Combined multi-vector assault under heavy rain and reduced sensor visibility. Requires thermal EO/IR and RF heatmap triangulation.',
    difficulty: 'Elite',
    terrain: 'urban',
    weather: 'rain',
    time_of_day: 'night',
    drone_count: 5,
    threat_types: ['Military Delta-Wing', 'Autonomous Swarm Unit', 'FPV Kamikaze Racer'],
    target_asset: 'Perimeter Defense Generator'
  }
];

export async function fetchScenarios(): Promise<Scenario[]> {
  try {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[Offline Mode] Using local scenario definitions');
    return DEFAULT_SCENARIOS;
  }
}

export async function fetchUserHistory(userId: string = 'cadet-01') {
  try {
    const res = await fetch(`${API_BASE}/user/${userId}/history`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Offline Mode] Using local user history storage');
    const local = localStorage.getItem(`aeroshield_history_${userId}`);
    if (local) {
      return JSON.parse(local);
    }
    return {
      user: { id: userId, callsign: 'Viper-Actual', rank: 'Senior C-UAS Specialist' },
      stats: {
        total_missions: 0,
        victories: 0,
        total_neutralized: 0,
        accuracy_percent: 0,
        avg_score: 0
      },
      sessions: []
    };
  }
}

export async function startTrainingSession(scenarioId: string, userId: string = 'cadet-01'): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, userId })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.sessionId;
  } catch (err) {
    const offlineId = 'offline-' + Date.now();
    return offlineId;
  }
}

export async function endTrainingSession(result: SessionResult, userId: string = 'cadet-01') {
  try {
    const res = await fetch(`${API_BASE}/session/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: result.sessionId,
        durationSeconds: result.durationSeconds,
        score: result.score,
        grade: result.grade,
        neutralizedCount: result.neutralizedCount,
        totalDrones: result.totalDrones,
        shotsFired: result.shotsFired,
        shotsHit: result.shotsHit,
        jammingPulses: result.jammingPulses,
        assetDamage: result.assetDamage,
        outcome: result.outcome,
        events: result.events,
        replayData: {
          scenarioId: result.scenarioId,
          replayFrames: result.replayFrames
        }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Offline Mode] Persisting session result to localStorage');
    // Save to local storage for offline AAR view
    const key = `aeroshield_history_${userId}`;
    const existing = localStorage.getItem(key);
    let parsed = existing ? JSON.parse(existing) : {
      user: { id: userId, callsign: 'Viper-Actual', rank: 'Senior C-UAS Specialist' },
      stats: { total_missions: 0, victories: 0, total_neutralized: 0, accuracy_percent: 0, avg_score: 0 },
      sessions: []
    };

    parsed.sessions.unshift({
      id: result.sessionId,
      user_id: userId,
      scenario_id: result.scenarioId,
      scenario_title: result.scenarioTitle,
      start_time: new Date().toISOString(),
      duration_seconds: result.durationSeconds,
      score: result.score,
      grade: result.grade,
      neutralized_count: result.neutralizedCount,
      total_drones: result.totalDrones,
      shots_fired: result.shotsFired,
      shots_hit: result.shotsHit,
      jamming_pulses: result.jammingPulses,
      asset_damage: result.assetDamage,
      outcome: result.outcome,
      replay_data: JSON.stringify({ scenarioId: result.scenarioId, replayFrames: result.replayFrames })
    });

    parsed.stats.total_missions += 1;
    if (result.outcome === 'VICTORY') parsed.stats.victories += 1;
    parsed.stats.total_neutralized += result.neutralizedCount;
    parsed.stats.accuracy_percent = result.accuracyPercent;
    parsed.stats.avg_score = Math.round(
      (parsed.stats.avg_score * (parsed.stats.total_missions - 1) + result.score) / parsed.stats.total_missions
    );

    localStorage.setItem(key, JSON.stringify(parsed));
    return { success: true, offline: true };
  }
}

export async function sendInstructorCommand(sessionId: string, command: string, payload: any) {
  try {
    const res = await fetch(`${API_BASE}/instructor/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, command, payload })
    });
    return await res.json();
  } catch (e) {
    console.warn('Instructor update offline');
    return { success: true };
  }
}

export async function checkInstructorCommands(sessionId: string) {
  try {
    const res = await fetch(`${API_BASE}/instructor/pending/${sessionId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return { commands: [] };
}
