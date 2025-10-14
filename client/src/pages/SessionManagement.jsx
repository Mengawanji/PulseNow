import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import axios from 'axios';

const SessionManagement = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [polls, setPolls] = useState([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    pollType: 'single_choice',
    options: ['']
  });
  const [responses, setResponses] = useState({});
  const { token } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    fetchSession();
    fetchPolls();
    setupSocketListeners();
  }, [sessionId]);

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.emit('host_join_session', { sessionId });

    socket.on('new_response', (data) => {
      fetchPollResults(data.pollId);
    });

    return () => {
      socket.off('new_response');
    };
  };

  const fetchSession = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSession(response.data);
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchPolls = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/polls/session/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPolls(response.data);
      
      // Fetch results for each poll
      response.data.forEach(poll => {
        if (poll.status === 'published' || poll.status === 'closed') {
          fetchPollResults(poll.id);
        }
      });
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  };

  const fetchPollResults = async (pollId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/polls/${pollId}/results`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponses(prev => ({
        ...prev,
        [pollId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching poll results:', error);
    }
  };

  const createPoll = async (e) => {
    e.preventDefault();
    try {
      const pollData = {
        sessionId,
        question: newPoll.question,
        pollType: newPoll.pollType,
        options: newPoll.options.filter(opt => opt.trim() !== '')
      };

      await axios.post(
        'http://localhost:5000/api/polls',
        pollData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewPoll({ question: '', pollType: 'single_choice', options: [''] });
      setShowPollForm(false);
      fetchPolls();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create poll');
    }
  };

  const updatePollStatus = async (pollId, status) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/polls/${pollId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket) {
        socket.emit('update_poll_status', { pollId, status });
      }

      fetchPolls();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update poll status');
    }
  };

  const addOption = () => {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, '']
    });
  };

  const updateOption = (index, value) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({ ...newPoll, options: newOptions });
  };

  const getResponseSummary = (pollId) => {
    const pollResponses = responses[pollId] || [];
    const summary = {};
    
    pollResponses.forEach(response => {
      const answer = response.answer;
      if (Array.isArray(answer)) {
        answer.forEach(opt => {
          summary[opt] = (summary[opt] || 0) + 1;
        });
      } else {
        summary[answer] = (summary[answer] || 0) + 1;
      }
    });
    
    return summary;
  };

  return (
    <div className="session-management">
      <header>
        <h1>Managing: {session?.title}</h1>
        <p>Session Code: <strong>{session?.code}</strong></p>
        <button onClick={() => setShowPollForm(true)}>Create New Poll</button>
      </header>

      {showPollForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New Poll</h2>
            <form onSubmit={createPoll}>
              <select
                value={newPoll.pollType}
                onChange={(e) => setNewPoll({...newPoll, pollType: e.target.value})}
              >
                <option value="single_choice">Single Choice</option>
                <option value="multiple_choice">Multiple Choice</option>
              </select>
              
              <input
                type="text"
                placeholder="Poll Question"
                value={newPoll.question}
                onChange={(e) => setNewPoll({...newPoll, question: e.target.value})}
                required
              />
              
              <div className="poll-options">
                <label>Options:</label>
                {newPoll.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    required
                  />
                ))}
                <button type="button" onClick={addOption}>Add Option</button>
              </div>
              
              <div className="modal-actions">
                <button type="submit">Create Poll</button>
                <button type="button" onClick={() => setShowPollForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="polls-list">
        {polls.map(poll => (
          <div key={poll.id} className={`poll-card ${poll.status}`}>
            <h3>{poll.question}</h3>
            <p>Type: {poll.pollType} | Status: {poll.status}</p>
            
            <div className="poll-actions">
              {poll.status === 'draft' && (
                <button onClick={() => updatePollStatus(poll.id, 'published')}>
                  Publish
                </button>
              )}
              {poll.status === 'published' && (
                <>
                  <button onClick={() => updatePollStatus(poll.id, 'closed')}>
                    Close Poll
                  </button>
                  <button onClick={() => updatePollStatus(poll.id, 'draft')}>
                    Hide
                  </button>
                </>
              )}
              {poll.status === 'closed' && (
                <button onClick={() => updatePollStatus(poll.id, 'published')}>
                  Reopen
                </button>
              )}
            </div>

            {(poll.status === 'published' || poll.status === 'closed') && (
              <div className="poll-results">
                <h4>Results ({responses[poll.id]?.length || 0} responses)</h4>
                <div className="results-summary">
                  {Object.entries(getResponseSummary(poll.id)).map(([option, count]) => (
                    <div key={option} className="result-item">
                      <span>{option}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionManagement;