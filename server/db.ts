import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data folder exists
const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'drone_trainer.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      callsign TEXT NOT NULL,
      rank TEXT DEFAULT 'Cadet Operator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      terrain TEXT NOT NULL,
      weather TEXT NOT NULL,
      time_of_day TEXT NOT NULL,
      drone_count INTEGER NOT NULL,
      threat_types TEXT NOT NULL,
      target_asset TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      duration_seconds REAL DEFAULT 0,
      score INTEGER DEFAULT 0,
      grade TEXT DEFAULT 'B',
      neutralized_count INTEGER DEFAULT 0,
      total_drones INTEGER DEFAULT 0,
      shots_fired INTEGER DEFAULT 0,
      shots_hit INTEGER DEFAULT 0,
      jamming_pulses INTEGER DEFAULT 0,
      asset_damage REAL DEFAULT 0,
      outcome TEXT DEFAULT 'IN_PROGRESS',
      replay_data TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      timestamp_ms INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      drone_id TEXT,
      drone_type TEXT,
      details TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);

  // Seed default operator user if not exists
  const defaultUser = db.prepare('SELECT id FROM users WHERE id = ?').get('cadet-01');
  if (!defaultUser) {
    db.prepare(`
      INSERT INTO users (id, callsign, rank)
      VALUES (?, ?, ?)
    `).run('cadet-01', 'Viper-Actual', 'Senior C-UAS Specialist');
  }

  // Seed 5 realistic training scenarios
  const scenarioStmt = db.prepare(`
    INSERT OR REPLACE INTO scenarios 
    (id, title, description, difficulty, terrain, weather, time_of_day, drone_count, threat_types, target_asset)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultScenarios = [
    {
      id: 'scen-1',
      title: 'Forward Outpost Recon Intrusion',
      description: 'Single commercial DJI quadcopter conducting low-altitude ISR surveillance over command perimeter.',
      difficulty: 'Beginner',
      terrain: 'rural',
      weather: 'clear',
      time_of_day: 'day',
      drone_count: 2,
      threat_types: JSON.stringify(['DJI Mavic Pro', 'DJI Phantom 4']),
      target_asset: 'Tactical Communications Mast'
    },
    {
      id: 'scen-2',
      title: 'High-Speed FPV Kamikaze Attack',
      description: 'Dual high-velocity FPV quadcopters equipped with shaped explosive payloads diving rapidly at erratic angles.',
      difficulty: 'Intermediate',
      terrain: 'urban',
      weather: 'clear',
      time_of_day: 'day',
      drone_count: 3,
      threat_types: JSON.stringify(['FPV Kamikaze Racer', 'FPV Heavy Lifter']),
      target_asset: 'Mobile Command Vehicle'
    },
    {
      id: 'scen-3',
      title: 'Night Refinery Stealth Infiltration',
      description: 'Long-range military fixed-wing reconnaissance drone flying low radar cross-section under cover of pitch darkness.',
      difficulty: 'Advanced',
      terrain: 'urban',
      weather: 'clear',
      time_of_day: 'night',
      drone_count: 3,
      threat_types: JSON.stringify(['Military Delta-Wing', 'Surveillance Micro-UAV']),
      target_asset: 'Strategic Fuel Storage Tanks'
    },
    {
      id: 'scen-4',
      title: 'Coordinated Autonomous Swarm Raid',
      description: 'Flock of 6 autonomous drones executing Boids cohesion and scatter tactics to overwhelm kinetic defenses.',
      difficulty: 'Expert',
      terrain: 'rural',
      weather: 'fog',
      time_of_day: 'day',
      drone_count: 6,
      threat_types: JSON.stringify(['Autonomous Swarm Unit', 'FPV Kamikaze Racer']),
      target_asset: 'Forward Air Defense Radar'
    },
    {
      id: 'scen-5',
      title: 'Bad Weather Border Incursion',
      description: 'Combined arms drone assault under heavy rain and reduced sensor visibility. Requires active thermal EO/IR & RF detection.',
      difficulty: 'Elite',
      terrain: 'urban',
      weather: 'rain',
      time_of_day: 'night',
      drone_count: 5,
      threat_types: JSON.stringify(['Military Delta-Wing', 'Autonomous Swarm Unit', 'FPV Kamikaze Racer']),
      target_asset: 'Perimeter Defense Generator'
    }
  ];

  for (const scen of defaultScenarios) {
    scenarioStmt.run(
      scen.id,
      scen.title,
      scen.description,
      scen.difficulty,
      scen.terrain,
      scen.weather,
      scen.time_of_day,
      scen.drone_count,
      scen.threat_types,
      scen.target_asset
    );
  }
}
