import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'drone_trainer.db');

let sqlDb = null;

export async function getDb() {
  if (sqlDb) return sqlDb;

  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }
  return sqlDb;
}

export function saveDb() {
  if (!sqlDb) return;
  const data = sqlDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Helper to run query returning array of objects
export async function query(sql, params = []) {
  const db = await getDb();
  const stmt = db.prepare(sql);
  if (params && params.length) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper to run single row query
export async function queryOne(sql, params = []) {
  const res = await query(sql, params);
  return res.length > 0 ? res[0] : null;
}

// Helper to run mutation and auto-save
export async function run(sql, params = []) {
  const db = await getDb();
  db.run(sql, params);
  saveDb();
}

export async function initDatabase() {
  const db = await getDb();

  db.run(`
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

  // Ensure default user exists
  const user = await queryOne('SELECT id FROM users WHERE id = ?', ['cadet-01']);
  if (!user) {
    db.run(
      'INSERT INTO users (id, callsign, rank) VALUES (?, ?, ?)',
      ['cadet-01', 'Viper-Actual', 'Senior C-UAS Specialist']
    );
  }

  // Ensure default scenarios exist
  const existingScenarios = await query('SELECT count(*) as cnt FROM scenarios');
  if (!existingScenarios[0] || existingScenarios[0].cnt === 0) {
    const defaultScenarios = [
      {
        id: 'scen-1',
        title: 'Forward Outpost Recon Intrusion',
        description: 'Commercial DJI quadcopters conducting low-altitude ISR surveillance over tactical communications mast.',
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
        description: 'Dual high-velocity FPV quadcopters diving aggressively toward mobile command vehicle at erratic trajectories.',
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
        description: 'Long-range military fixed-wing stealth UAV cruising in low radar cross-section under dark skies.',
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
        description: 'Flock of 6 autonomous drones executing 3D Boids cohesion and evasive dispersion to saturate kinetic defenses.',
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
        description: 'Combined multi-vector assault under heavy rain and reduced sensor visibility. Requires thermal EO/IR and RF heatmap triangulation.',
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
      db.run(
        `INSERT INTO scenarios 
        (id, title, description, difficulty, terrain, weather, time_of_day, drone_count, threat_types, target_asset)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );
    }
  }

  saveDb();
  console.log('[SQLite DB] Initialized and synced to data/drone_trainer.db');
}
