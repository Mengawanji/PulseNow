import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';

const ParticipantView = () => {
  const { sessionCode } = useParams();
  const [activePolls, setActivePolls] = useState([]);
  const [submittedResponses, setSubmittedResponses] = useState(new Set());
  const [participant, setParticipant] = useState(null);
  const [session, setSession] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    const storedParticipant = localStorage.getItem('participant');
    const storedSession = localStorage.getItem('session');

    if (storedParticipant && storedSession) {
      setParticipant(JSON.parse(storedParticipant));
      setSession(JSON.parse(storedSession));
    }

    setupSocketListeners();
  }, [sessionCode]);

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.emit('join_session', {
      sessionCode,
      participantId: participant?.id
    });

    socket.on('poll_published', (poll) => {
      setActivePolls(prev => {
        const existing = prev.find(p => p.id === poll.id);
        return existing ? prev : [...prev, poll];
      });
    });

    socket.on('poll_closed', (data) => {
      setActivePolls(prev => prev.filter(poll => poll.id !== data.pollId));
    });

    socket.on('response_count_updated', (data) => {
      // Could update UI with response counts if desired
      console.log('Response count updated:', data);
    });

    return () => {
      socket.off('poll_published');
      socket.off('poll_closed');
      socket.off('response_count_updated');
    };
  };

  const submitResponse = (pollId, answer) => {
    if (!socket || !participant) return;

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
    
    return (
      <div key={poll.id} className="poll-card">
        <h3>{poll.question}</h3>
        
        {hasSubmitted(poll.id) ? (
          <div className="poll-submitted">
            <p>✅ Your response has been submitted!</p>
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
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!participant || !session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="participant-view">
      <header className="participant-header">
        <h1>{session.title}</h1>
        <p>Welcome, {participant.name}!</p>
      </header>

      <div className="active-polls">
        <h2>Active Polls</h2>
        {activePolls.length === 0 ? (
          <p>No active polls at the moment. Wait for the host to publish polls.</p>
        ) : (
          activePolls.map(renderPoll)
        )}
      </div>
    </div>
  );
};

export default ParticipantView;