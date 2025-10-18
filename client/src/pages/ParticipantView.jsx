import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';
import axios from 'axios';

const ParticipantView = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const [activePolls, setActivePolls] = useState([]);
  const [submittedResponses, setSubmittedResponses] = useState(new Set());
  const [participant, setParticipant] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const socket = useSocket();

  useEffect(() => {
    console.log('ParticipantView mounted with sessionCode:', sessionCode);
    
    const storedParticipant = localStorage.getItem('participant');
    const storedSession = localStorage.getItem('session');

    console.log('Stored data:', { storedParticipant, storedSession });

    if (storedParticipant && storedSession) {
      const participantData = JSON.parse(storedParticipant);
      const sessionData = JSON.parse(storedSession);
      
      setParticipant(participantData);
      setSession(sessionData);
      
      console.log('Participant data:', participantData);
      console.log('Session data:', sessionData);
      
      // Load published polls when participant joins
      fetchPublishedPolls(sessionData.id, participantData.id);
    } else {
      console.error('No participant/session data in localStorage');
      setError('Session data missing. Please join again.');
      navigate(`/join?code=${sessionCode}`);
    }

    setupSocketListeners();
  }, [sessionCode, navigate]);

  // Fetch published polls for this session
  const fetchPublishedPolls = async (sessionId, participantId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 STEP 1: Fetching published polls for session:', sessionId);
      
      const response = await axios.get(
        `http://localhost:5000/api/sessions/${sessionId}/published-polls`
      );
      
      console.log('STEP 2: API Response received:', response.data);
      console.log(`Found ${response.data.length} published polls`);
      
      setActivePolls(response.data);
      
      // Check which polls the participant has already answered
      if (response.data.length > 0) {
        await checkAnsweredPolls(response.data, participantId);
      }
      
    } catch (error) {
      console.error('STEP 3: Error fetching polls:', error);
      console.error('Error details:', error.response?.data);
      setError(`Failed to load polls: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check which polls participant has already answered
  const checkAnsweredPolls = async (polls, participantId) => {
    console.log('Checking answered polls for participant:', participantId);
    
    const answeredPolls = new Set();
    
    for (const poll of polls) {
      try {
        console.log(`   Checking poll ${poll.id}...`);
        const response = await axios.get(
          `http://localhost:5000/api/polls/${poll.id}/response-check/${participantId}`
        );
        
        console.log(`   Poll ${poll.id} answered:`, response.data.hasAnswered);
        
        if (response.data.hasAnswered) {
          answeredPolls.add(poll.id);
        }
      } catch (error) {
        console.error(`   Error checking poll ${poll.id}:`, error);
      }
    }
    
    console.log('Answered polls:', Array.from(answeredPolls));
    setSubmittedResponses(answeredPolls);
  };

  const setupSocketListeners = () => {
    if (!socket) {
      console.log('Socket not available yet');
      return;
    }

    console.log('Setting up socket listeners...');
    
    // Join the session room
    if (participant && sessionCode) {
      console.log('Joining session via socket:', sessionCode);
      socket.emit('join_session', {
        sessionCode,
        participantId: participant.id
      });
    }

    // Listen for new polls published by host
    socket.on('poll_published', (poll) => {
      console.log('Socket: New poll published:', poll);
      setActivePolls(prev => {
        const exists = prev.find(p => p.id === poll.id);
        if (exists) {
          console.log('   Poll already exists in list');
          return prev;
        }
        console.log('   Adding new poll to list');
        return [...prev, poll];
      });
    });

    // Listen for polls being closed by host
    socket.on('poll_closed', (data) => {
      console.log('Socket: Poll closed:', data.pollId);
      setActivePolls(prev => {
        const newPolls = prev.filter(poll => poll.id !== data.pollId);
        console.log(`   Removed poll. Now ${newPolls.length} active polls`);
        return newPolls;
      });
    });

    // Clean up listeners
    return () => {
      socket.off('poll_published');
      socket.off('poll_closed');
    };
  };

  const submitResponse = (pollId, answer) => {
    if (!socket || !participant) {
      alert('Not connected. Please refresh the page.');
      return;
    }

    console.log('Submitting response:', { pollId, answer });
    
    socket.emit('submit_response', {
      pollId,
      answer,
      participantId: participant.id
    });

    setSubmittedResponses(prev => new Set([...prev, pollId]));
  };

  const hasSubmitted = (pollId) => {
    return submittedResponses.has(pollId);
  };

  const renderPoll = (poll) => {
    const options = Array.isArray(poll.options) ? poll.options : [];
    
    console.log('Rendering poll:', poll.id, 'with', options.length, 'options');
    
    return (
      <div key={poll.id} className="poll-card">
        <h3>{poll.question}</h3>
        <p className="poll-type">
          {poll.pollType === 'multiple_choice' ? 
            '(Multiple answers allowed)' : '(Select one answer)'}
        </p>
        
        {hasSubmitted(poll.id) ? (
          <div className="poll-submitted">
            <p>Your response has been submitted!</p>
          </div>
        ) : (
          <div className="poll-options">
            {poll.pollType === 'single_choice' ? (
              options.map((option, index) => (
                <button
                  key={index}
                  className="poll-option"
                  onClick={() => submitResponse(poll.id, option)}
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="multiple-choice">
                {options.map((option, index) => (
                  <label key={index} className="checkbox-option">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          submitResponse(poll.id, [option]);
                        }
                      }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Show loading state
  if (!participant || !session) {
    return (
      <div className="participant-view">
        <div className="loading">Loading session data...</div>
      </div>
    );
  }

  return (
    <div className="participant-view">
      <header className="participant-header">
        <h1>{session.title}</h1>
        <p>Welcome, <strong>{participant.name}</strong>!</p>
        <p className="session-code">Session Code: <strong>{sessionCode}</strong></p>
      </header>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={() => window.location.reload()} style={{marginLeft: '10px'}}>
            Retry
          </button>
        </div>
      )}

      <div className="active-polls">
        <h2>Active Polls</h2>
        
        {loading ? (
          <div className="loading-state">
            <p>Loading polls...</p>
          </div>
        ) : activePolls.length === 0 ? (
          <div className="no-polls">
            <p>No active polls at the moment.</p>
            <p>Wait for the host to publish some polls, or refresh the page.</p>
            <button onClick={() => fetchPublishedPolls(session.id, participant.id)}>
              Refresh Polls
            </button>
          </div>
        ) : (
          <div className="polls-list">
            <p>Found {activePolls.length} active poll(s):</p>
            {activePolls.map(renderPoll)}
          </div>
        )}
      </div>

      {/* Debug information */}
      <div className="debug-info" style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '5px', fontSize: '0.9rem' }}>
        <details>
          <summary>Debug Information (Click to expand)</summary>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Session:</strong> {session.title} (ID: {session.id})</p>
            <p><strong>Participant:</strong> {participant.name} (ID: {participant.id})</p>
            <p><strong>Active Polls:</strong> {activePolls.length}</p>
            <p><strong>Socket Connected:</strong> {socket ? 'Yes' : 'No'}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Submitted Polls:</strong> {submittedResponses.size}</p>
            <button onClick={() => fetchPublishedPolls(session.id, participant.id)}>
              Manually Refresh Polls
            </button>
            <button onClick={() => console.log('Active polls:', activePolls)} style={{marginLeft: '10px'}}>
              Log Polls to Console
            </button>
          </div>
        </details>
      </div>
    </div>
  );
};

export default ParticipantView;