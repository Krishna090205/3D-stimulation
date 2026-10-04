import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { query, queryOne, run, initDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Active instructor overrides queue by sessionId
const activeInstructorOverrides = {};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AeroShield C-UAS Backend', timestamp: new Date().toISOString() });
});

// GET /api/scenarios
app.get('/api/scenarios', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM scenarios');
    const scenarios = rows.map((s) => ({
      ...s,
      threat_types: JSON.parse(s.threat_types || '[]')
    }));
    res.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/:id/history
app.get('/api/user/:id/history', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    
    const sessions = await query(`
      SELECT s.*, sc.title as scenario_title, sc.difficulty, sc.terrain
      FROM sessions s
      LEFT JOIN scenarios sc ON s.scenario_id = sc.id
      WHERE s.user_id = ?
      ORDER BY s.start_time DESC
      LIMIT 25
    `, [userId]);

    // Compute aggregated career stats
    const statsStmt = await queryOne(`
      SELECT 
        COUNT(*) as total_missions,
        SUM(CASE WHEN outcome = 'VICTORY' THEN 1 ELSE 0 END) as victories,
        SUM(neutralized_count) as total_neutralized,
        SUM(shots_fired) as total_shots,
        SUM(shots_hit) as total_hits,
        AVG(score) as avg_score
      FROM sessions
      WHERE user_id = ? AND outcome != 'IN_PROGRESS'
    `, [userId]);

    res.json({
      user: user || { id: userId, callsign: 'Cadet Operator', rank: 'Cadet' },
      stats: {
        total_missions: statsStmt?.total_missions || 0,
        victories: statsStmt?.victories || 0,
        total_neutralized: statsStmt?.total_neutralized || 0,
        accuracy_percent: (statsStmt?.total_shots > 0)
          ? Math.round((statsStmt.total_hits / statsStmt.total_shots) * 100) 
          : 0,
        avg_score: Math.round(statsStmt?.avg_score || 0)
      },
      sessions
    });
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/session/start
app.post('/api/session/start', async (req, res) => {
  try {
    const { userId = 'cadet-01', scenarioId } = req.body;
    const sessionId = 'ses-' + crypto.randomBytes(6).toString('hex');

    await run(`
      INSERT INTO sessions (id, user_id, scenario_id, start_time, outcome)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'IN_PROGRESS')
    `, [sessionId, userId, scenarioId]);

    res.json({
      sessionId,
      message: 'Training session initiated',
      startedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/session/end
app.post('/api/session/end', async (req, res) => {
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
    await run(`
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
    `, [
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
    ]);

    // Save events
    if (Array.isArray(events) && events.length > 0) {
      for (const ev of events) {
        const evId = 'ev-' + crypto.randomBytes(6).toString('hex');
        await run(`
          INSERT INTO events (id, session_id, timestamp_ms, event_type, drone_id, drone_type, details)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          evId,
          sessionId,
          ev.timestampMs || 0,
          ev.eventType || 'UNKNOWN',
          ev.droneId || null,
          ev.droneType || null,
          typeof ev.details === 'object' ? JSON.stringify(ev.details) : String(ev.details || '')
        ]);
      }
    }

    res.json({
      success: true,
      sessionId,
      message: 'Session completed and logged to SQLite',
      score,
      grade
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/instructor/update
app.post('/api/instructor/update', (req, res) => {
  try {
    const { sessionId, command, payload } = req.body;
    
    if (!activeInstructorOverrides[sessionId]) {
      activeInstructorOverrides[sessionId] = [];
    }
    
    const event = {
      id: 'cmd-' + Date.now(),
      command,
      payload,
      timestamp: Date.now()
    };
    
    activeInstructorOverrides[sessionId].push(event);

    res.json({
      success: true,
      message: `Instructor command '${command}' broadcasted to session ${sessionId}`,
      commandId: event.id
    });
  } catch (error) {
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

// Startup
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`[AeroShield C-UAS Server] Backend running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
