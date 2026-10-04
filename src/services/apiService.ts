import { Scenario, SessionResult, SimulationEvent } from '../types/simulation';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE = rawBaseUrl ? `${(rawBaseUrl as string).replace(/\/$/, '')}/api` : '/api';

// Fallback scenarios matching the 5 distinct mission maps
export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'scen-1',
    title: 'Urban Day',
    description: 'Daylight commercial quadcopter intrusion over metropolitan skyscraper canyons. High visibility kinetic engagement.',
    difficulty: 'Beginner',
    terrain: 'urban',
    weather: 'clear',
    time_of_day: 'day',
    drone_count: 3,
    threat_types: ['DJI Mavic Pro', 'Commercial Quadcopter'],
    target_asset: 'Tactical Communications Mast'
  },
  {
    id: 'scen-2',
    title: 'Urban Night',
    description: 'Nocturnal metropolis infiltration under illuminated skyscraper skyline and flashing beacons. Low ambient light conditions.',
    difficulty: 'Intermediate',
    terrain: 'urban_night',
    weather: 'clear',
    time_of_day: 'night',
    drone_count: 4,
    threat_types: ['Military Delta-Wing', 'FPV Kamikaze Racer'],
    target_asset: 'Strategic Fuel Storage Tanks'
  },
  {
    id: 'scen-3',
    title: 'Rural Area',
    description: 'Open mountain pine valley and tactical outpost revetment. Wide detection azimuth requiring long-range kinetic sniper fire.',
    difficulty: 'Advanced',
    terrain: 'rural',
    weather: 'clear',
    time_of_day: 'day',
    drone_count: 3,
    threat_types: ['Surveillance Micro-UAV', 'DJI Phantom 4'],
    target_asset: 'Forward Outpost Radar Station'
  },
  {
    id: 'scen-4',
    title: 'Swarm Attack',
    description: 'High-density autonomous swarm assault over an arid desert forward operating base with fortified HESCO barriers.',
    difficulty: 'Expert',
    terrain: 'desert',
    weather: 'fog',
    time_of_day: 'day',
    drone_count: 6,
    threat_types: ['Autonomous Swarm Unit', 'FPV Kamikaze Racer'],
    target_asset: 'Forward Air Defense Radar'
  },
  {
    id: 'scen-5',
    title: 'VIP Protection',
    description: 'Defend high-security executive government compound, transport motorcade, and airfield helipad from coordinated strikes.',
    difficulty: 'Elite',
    terrain: 'compound',
    weather: 'clear',
    time_of_day: 'night',
    drone_count: 5,
    threat_types: ['FPV Heavy Lifter', 'Military Delta-Wing'],
    target_asset: 'Executive Transport Helipad'
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
