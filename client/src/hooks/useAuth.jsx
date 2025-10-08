import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [host, setHost] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('hostToken');
    const storedHost = localStorage.getItem('host');

    if (storedToken && storedHost) {
      setToken(storedToken);
      setHost(JSON.parse(storedHost));
    }
    setLoading(false);
  }, []);

  const login = (newToken, hostData) => {
    setToken(newToken);
    setHost(hostData);
    localStorage.setItem('hostToken', newToken);
    localStorage.setItem('host', JSON.stringify(hostData));
  };

  const logout = () => {
    setToken(null);
    setHost(null);
    localStorage.removeItem('hostToken');
    localStorage.removeItem('host');
  };

  return (
    <AuthContext.Provider value={{ host, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};