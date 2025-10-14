import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import HostLogin from './pages/HostLogin.jsx';
import HostDashboard from './pages/HostDashboard.jsx';
import SessionManagement from './pages/SessionManagement.jsx';
import ParticipantJoin from './pages/ParticipantJoin.jsx';
import ParticipantView from './pages/ParticipantView.jsx';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<HostLogin />} />
            <Route path="/dashboard" element={<HostDashboard />} />
            <Route path="/session/:sessionId" element={<SessionManagement />} />
            <Route path="/join" element={<ParticipantJoin />} />
            <Route path="/participant/:sessionCode" element={<ParticipantView />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;