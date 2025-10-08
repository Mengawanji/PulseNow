import { query } from '../config/database.js';

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join session room (for participants)
    socket.on('join_session', async (data) => {
      const { sessionCode, participantId } = data;
      socket.join(`session_${sessionCode}`);
      socket.sessionCode = sessionCode;
      socket.participantId = participantId;
      
      console.log(`Participant ${participantId} joined session ${sessionCode}`);
    });

    // Host joins session management room
    socket.on('host_join_session', (data) => {
      const { sessionId } = data;
      socket.join(`host_session_${sessionId}`);
      socket.sessionId = sessionId;
      
      console.log(`Host joined session ${sessionId}`);
    });

    // Participant submits response
    socket.on('submit_response', async (data) => {
      try {
        const { pollId, answer, participantId } = data;
        
        // Save response to database
        const result = await query(
          `INSERT INTO responses (poll_id, participant_id, answer) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (poll_id, participant_id) 
           DO UPDATE SET answer = $3, submitted_at = NOW()
           RETURNING *`,
          [pollId, participantId, JSON.stringify(answer)]
        );

        // Get poll details to find session code
        const pollResult = await query(
          `SELECT p.*, s.code 
           FROM polls p 
           JOIN sessions s ON p.session_id = s.id 
           WHERE p.id = $1`,
          [pollId]
        );

        if (pollResult.rows.length > 0) {
          const poll = pollResult.rows[0];
          
          // Notify host about new response
          socket.to(`host_session_${poll.session_id}`).emit('new_response', {
            pollId,
            response: result.rows[0],
            participantId
          });

          // Update all participants with response count
          const responseCount = await query(
            'SELECT COUNT(*) FROM responses WHERE poll_id = $1',
            [pollId]
          );

          socket.to(`session_${poll.code}`).emit('response_count_updated', {
            pollId,
            count: parseInt(responseCount.rows[0].count)
          });
        }
      } catch (error) {
        console.error('Error submitting response:', error);
        socket.emit('error', { message: 'Failed to submit response' });
      }
    });

    // Host publishes/unpublishes poll
    socket.on('update_poll_status', async (data) => {
      try {
        const { pollId, status } = data;
        
        const result = await query(
          'UPDATE polls SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
          [status, pollId]
        );

        if (result.rows.length > 0) {
          const poll = result.rows[0];
          
          // Get session code
          const sessionResult = await query(
            'SELECT code FROM sessions WHERE id = $1',
            [poll.session_id]
          );

          if (sessionResult.rows.length > 0) {
            const sessionCode = sessionResult.rows[0].code;
            
            if (status === 'published') {
              // Notify participants about new poll
              socket.to(`session_${sessionCode}`).emit('poll_published', poll);
            } else if (status === 'closed') {
              // Notify participants that poll is closed
              socket.to(`session_${sessionCode}`).emit('poll_closed', { pollId });
            }
            
            // Notify host about status update
            socket.to(`host_session_${poll.session_id}`).emit('poll_status_updated', poll);
          }
        }
      } catch (error) {
        console.error('Error updating poll status:', error);
        socket.emit('error', { message: 'Failed to update poll status' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};