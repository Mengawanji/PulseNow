import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const HostDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSession, setNewSession] = useState({ title: '', description: '' });
  const { host, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const createSession = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:5000/api/sessions',
        newSession,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions([response.data, ...sessions]);
      setNewSession({ title: '', description: '' });
      setShowCreateForm(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create session');
    }
  };

  const copyJoinLink = (code) => {
    const joinLink = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(joinLink);
    alert('Join link copied to clipboard!');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {host?.name}</h1>
        <button onClick={() => setShowCreateForm(true)}>Create New Session</button>
      </header>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New Session</h2>
            <form onSubmit={createSession}>
              <input
                type="text"
                placeholder="Session Title"
                value={newSession.title}
                onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                required
              />
              <textarea
                placeholder="Session Description"
                value={newSession.description}
                onChange={(e) => setNewSession({...newSession, description: e.target.value})}
              />
              <div className="modal-actions">
                <button type="submit">Create Session</button>
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sessions-grid">
        {sessions.map(session => (
          <div key={session.id} className="session-card">
            <h3>{session.title}</h3>
            <p>{session.description}</p>
            <div className="session-code">
              Code: <strong>{session.code}</strong>
            </div>
            <div className="session-actions">
              <button onClick={() => navigate(`/session/${session.id}`)}>
                Manage Polls
              </button>
              <button onClick={() => copyJoinLink(session.code)}>
                Copy Join Link
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HostDashboard;