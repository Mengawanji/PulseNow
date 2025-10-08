import { query } from '../config/database.js';

export async function createPoll(req, res) {
    try {
    const { sessionId, question, pollType, options } = req.body;
    const hostId = req.hostId;
    
    // Verify session belongs to host
    const sessionCheck = await query(
        'SELECT id FROM sessions WHERE id = $1 AND host_id = $2',
        [sessionId, hostId]
    );
    
    if (sessionCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const result = await query(
        `INSERT INTO polls (session_id, question, poll_type, options) 
        VALUES ($1, $2, $3, $4) RETURNING *`,
        [sessionId, question, pollType, JSON.stringify(options || [])]
    );
    
    res.status(201).json(result.rows[0]);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
} 

// Get polls for session
export async function pollSession(req, res) {
    try {
    const { sessionId } = req.params;
    const hostId = req.hostId;
    
    // Verify session belongs to host
    const sessionCheck = await query(
        'SELECT id FROM sessions WHERE id = $1 AND host_id = $2',
        [sessionId, hostId]
    );
    
    if (sessionCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const result = await query(
        'SELECT * FROM polls WHERE session_id = $1 ORDER BY created_at',
        [sessionId]
    );
    
    res.json(result.rows);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
}

// Update poll status
export async function updatePoll(req, res) {
    try {
    const { pollId } = req.params;
    const { status } = req.body;
    const hostId = req.hostId;
    
    const result = await query(
        `UPDATE polls SET status = $1, updated_at = NOW() 
        WHERE id = $2 AND session_id IN (
            SELECT id FROM sessions WHERE host_id = $3
        ) RETURNING *`,
        [status, pollId, hostId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.json(result.rows[0]);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
}

// Get poll results
export async function pollResult(req, res) {
    try {
    const { pollId } = req.params;
    const hostId = req.hostId;

    const result = await query(
        `SELECT r.*, p.name as participant_name 
        FROM responses r 
        JOIN participants p ON r.participant_id = p.id 
        WHERE r.poll_id = $1 AND r.poll_id IN (
            SELECT id FROM polls WHERE session_id IN (
            SELECT id FROM sessions WHERE host_id = $2
            )
        )`,
        [pollId, hostId]
    );

    res.json(result.rows);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
}