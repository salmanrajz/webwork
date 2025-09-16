import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, userApi } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('webwork_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await userApi.me();
        setUser(profile);
      } catch (error) {
        console.error('Failed to load session', error);
        setToken(null);
        localStorage.removeItem('webwork_token');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [token]);

  const login = async (credentials) => {
    setAuthError(null);
    try {
      const response = await authApi.login(credentials);
      setToken(response.token);
      localStorage.setItem('webwork_token', response.token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      setAuthError(error.response?.data?.message || 'Unable to login');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('webwork_token');
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authError,
      login,
      logout,
      setUser
    }),
    [user, token, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
