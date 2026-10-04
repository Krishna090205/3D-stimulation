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
      title: 'Urban Day',
      description: 'Daylight commercial quadcopter intrusion over metropolitan skyscraper canyons. High visibility kinetic engagement.',
      difficulty: 'Beginner',
      terrain: 'urban',
      weather: 'clear',
      time_of_day: 'day',
      drone_count: 3,
      threat_types: JSON.stringify(['DJI Mavic Pro', 'Commercial Quadcopter']),
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
      threat_types: JSON.stringify(['Military Delta-Wing', 'FPV Kamikaze Racer']),
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
      threat_types: JSON.stringify(['Surveillance Micro-UAV', 'DJI Phantom 4']),
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
      threat_types: JSON.stringify(['Autonomous Swarm Unit', 'FPV Kamikaze Racer']),
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
      threat_types: JSON.stringify(['FPV Heavy Lifter', 'Military Delta-Wing']),
      target_asset: 'Executive Transport Helipad'
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
