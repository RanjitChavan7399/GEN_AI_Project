import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('prepnexus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [tokens, setTokens] = useState(() => {
    const access = localStorage.getItem('prepnexus_access_token');
    const refresh = localStorage.getItem('prepnexus_refresh_token');
    return access ? { access, refresh } : null;
  });
  const [loading, setLoading] = useState(true);
  const [backendHealth, setBackendHealth] = useState(null);

  useEffect(() => {
    // Check backend health on mount
    authAPI.checkHealth()
      .then(data => setBackendHealth(data))
      .catch(err => setBackendHealth({ status: 'offline', error: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await authAPI.login(credentials);
    const { tokens, user } = data;
    localStorage.setItem('prepnexus_access_token', tokens.access);
    localStorage.setItem('prepnexus_refresh_token', tokens.refresh);
    localStorage.setItem('prepnexus_user', JSON.stringify(user));
    setTokens(tokens);
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    const { tokens, user } = data;
    localStorage.setItem('prepnexus_access_token', tokens.access);
    localStorage.setItem('prepnexus_refresh_token', tokens.refresh);
    localStorage.setItem('prepnexus_user', JSON.stringify(user));
    setTokens(tokens);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('prepnexus_access_token');
    localStorage.removeItem('prepnexus_refresh_token');
    localStorage.removeItem('prepnexus_user');
    setTokens(null);
    setUser(null);
  };

  const updateUserProfile = (newProfile) => {
    setUser(prev => {
      const updated = { ...prev, ...newProfile };
      localStorage.setItem('prepnexus_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      tokens,
      loading,
      backendHealth,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
