import { query } from '../config/database.js';

export const createSession = async (req, res) => {
    try {
    const { title, description } = req.body;
    const hostId = req.hostId;
    
    // Generate unique 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const result = await query(
        `INSERT INTO sessions (host_id, code, title, description) 
        VALUES ($1, $2, $3, $4) RETURNING *`,
        [hostId, code, title, description]
    );
    
    res.status(201).json(result.rows[0]);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
}


// Get host's sessions
export const getSession = async (req, res) => {
    try {
    const hostId = req.hostId;
    
    const result = await query(
        `SELECT * FROM sessions WHERE host_id = $1 ORDER BY created_at DESC`,
        [hostId]
    );
    
    res.json(result.rows);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
}

// Get session details
export const sessionDetails = async (req, res) => {
    try {
    const { sessionId } = req.params;
    const hostId = req.hostId;
    
    const result = await query(
        `SELECT * FROM sessions WHERE id = $1 AND host_id = $2`,
        [sessionId, hostId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(result.rows[0]);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
}

// Join session as participant

export const sessionParticipant = async (req, res) => {
      try {
    const { code } = req.params;
    const { name, email, phone } = req.body;
    
    // Find session by code
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE code = $1 AND is_active = true',
      [code]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = sessionResult.rows[0];
    
    // Create participant
    const participantResult = await query(
      `INSERT INTO participants (session_id, name, email, phone) 
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone`,
      [session.id, name, email, phone]
    );
    
    res.json({
      participant: participantResult.rows[0],
      session: {
        id: session.id,
        title: session.title,
        code: session.code
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
    