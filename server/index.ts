import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './db.js';
import crypto from 'crypto';

// Load environment variables if .env exists
try {
  if ((process as any).loadEnvFile) {
    (process as any).loadEnvFile();
  }
} catch {
  // .env file is optional in containerized/production environments where env vars are injected directly
}

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map(s => s.trim())
}));
app.use(express.json({ limit: '20mb' }));

// Initialize DB schema & seed data
initDatabase();

// In-memory active instructor modifications for live sessions
const activeInstructorOverrides: Record<string, any> = {};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AeroShield C-UAS Backend', timestamp: new Date().toISOString() });
});

// GET /api/scenarios
app.get('/api/scenarios', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM scenarios').all();
    const scenarios = rows.map((s: any) => ({
      ...s,
      threat_types: JSON.parse(s.threat_types || '[]')
    }));
    res.json(scenarios);
  } catch (error: any) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/:id/history
app.get('/api/user/:id/history', (req, res) => {
  try {
    const userId = req.params.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    const sessions = db.prepare(`
      SELECT s.*, sc.title as scenario_title, sc.difficulty, sc.terrain
      FROM sessions s
      LEFT JOIN scenarios sc ON s.scenario_id = sc.id
      WHERE s.user_id = ?
      ORDER BY s.start_time DESC
      LIMIT 25
    `).all(userId);

    // Compute aggregated career stats
    const statsStmt = db.prepare(`
      SELECT 
        COUNT(*) as total_missions,
        SUM(CASE WHEN outcome = 'VICTORY' THEN 1 ELSE 0 END) as victories,
        SUM(neutralized_count) as total_neutralized,
        SUM(shots_fired) as total_shots,
        SUM(shots_hit) as total_hits,
        AVG(score) as avg_score
      FROM sessions
      WHERE user_id = ? AND outcome != 'IN_PROGRESS'
    `).get(userId) as any;

    res.json({
      user: user || { id: userId, callsign: 'Cadet Operator', rank: 'Cadet' },
      stats: {
        total_missions: statsStmt?.total_missions || 0,
        victories: statsStmt?.victories || 0,
        total_neutralized: statsStmt?.total_neutralized || 0,
        accuracy_percent: statsStmt?.total_shots > 0 
          ? Math.round((statsStmt.total_hits / statsStmt.total_shots) * 100) 
          : 0,
        avg_score: Math.round(statsStmt?.avg_score || 0)
      },
      sessions
    });
  } catch (error: any) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/session/start
app.post('/api/session/start', (req, res) => {
  try {
    const { userId = 'cadet-01', scenarioId } = req.body;
    const sessionId = 'ses-' + crypto.randomBytes(6).toString('hex');

    db.prepare(`
      INSERT INTO sessions (id, user_id, scenario_id, start_time, outcome)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'IN_PROGRESS')
    `).run(sessionId, userId, scenarioId);

    res.json({
      sessionId,
      message: 'Training session initiated',
      startedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/session/end
app.post('/api/session/end', (req, res) => {
  try {
    const {
      sessionId,
      durationSeconds = 0,
      score = 0,
      grade = 'B',
      neutralizedCount = 0,
      totalDrones = 0,
      shotsFired = 0,
      shotsHit = 0,
      jammingPulses = 0,
      assetDamage = 0,
      outcome = 'VICTORY',
      events = [],
      replayData = null
    } = req.body;

    // Update session record
    db.prepare(`
      UPDATE sessions
      SET 
        end_time = CURRENT_TIMESTAMP,
        duration_seconds = ?,
        score = ?,
        grade = ?,
        neutralized_count = ?,
        total_drones = ?,
        shots_fired = ?,
        shots_hit = ?,
        jamming_pulses = ?,
        asset_damage = ?,
        outcome = ?,
        replay_data = ?
      WHERE id = ?
    `).run(
      durationSeconds,
      score,
      grade,
      neutralizedCount,
      totalDrones,
      shotsFired,
      shotsHit,
      jammingPulses,
      assetDamage,
      outcome,
      replayData ? JSON.stringify(replayData) : null,
      sessionId
    );

    // Save events
    if (Array.isArray(events) && events.length > 0) {
      const insertEvent = db.prepare(`
        INSERT INTO events (id, session_id, timestamp_ms, event_type, drone_id, drone_type, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const tx = db.transaction((evList) => {
        for (const ev of evList) {
          const evId = 'ev-' + crypto.randomBytes(6).toString('hex');
          insertEvent.run(
            evId,
            sessionId,
            ev.timestampMs || 0,
            ev.eventType || 'UNKNOWN',
            ev.droneId || null,
            ev.droneType || null,
            typeof ev.details === 'object' ? JSON.stringify(ev.details) : String(ev.details || '')
          );
        }
      });
      tx(events);
    }

    res.json({
      success: true,
      sessionId,
      message: 'Session completed and logged to SQLite',
      score,
      grade
    });
  } catch (error: any) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/instructor/update
// Live control to inject weather, spawn drone waves, or tamper with EW jamming resistance mid-session
app.post('/api/instructor/update', (req, res) => {
  try {
    const { sessionId, command, payload } = req.body;
    
    if (!activeInstructorOverrides[sessionId]) {
      activeInstructorOverrides[sessionId] = [];
    }
    
    const event = {
      id: 'cmd-' + Date.now(),
      command, // e.g., 'SPAWN_DRONE', 'CHANGE_WEATHER', 'SPOOF_GPS', 'TRIGGER_SWARM_RUSH'
      payload,
      timestamp: Date.now()
    };
    
    activeInstructorOverrides[sessionId].push(event);

    res.json({
      success: true,
      message: `Instructor command '${command}' broadcasted to session ${sessionId}`,
      commandId: event.id
    });
  } catch (error: any) {
    console.error('Error in instructor update:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/instructor/pending/:sessionId
app.get('/api/instructor/pending/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const list = activeInstructorOverrides[sessionId] || [];
  activeInstructorOverrides[sessionId] = []; // drain queue
  res.json({ commands: list });
});

app.listen(PORT, () => {
  console.log(`[AeroShield C-UAS Server] Backend running at http://localhost:${PORT}`);
});
