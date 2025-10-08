import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ParticipantJoin = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setSessionCode(code);
    }
  }, [searchParams]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/sessions/${sessionCode}/join`,
        formData
      );

      const { participant, session } = response.data;
      
      // Store participant info in localStorage
      localStorage.setItem('participant', JSON.stringify(participant));
      localStorage.setItem('session', JSON.stringify(session));
      
      navigate(`/participant/${sessionCode}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-container">
      <div className="join-form">
        <h1>Join Polling Session</h1>
        
        <form onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Session Code"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            required
          />
          <input
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ParticipantJoin;