import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, setUnauthorizedHandler } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

const clearStoredSession = () => {
  localStorage.removeItem('user_details');
  localStorage.removeItem('user_role');
  localStorage.removeItem('token');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user'); // 'user' | 'admin'
  const [loading, setLoading] = useState(true);
  const { showInfo } = useToast();

  // Role always comes from the backend's systemUser flag
  const applyUser = useCallback((userData) => {
    const userRole = userData.systemUser ? 'admin' : 'user';

    setUser(userData);
    setRole(userRole);

    localStorage.setItem('user_details', JSON.stringify(userData));
    localStorage.setItem('user_role', userRole);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setRole('user');
    clearStoredSession();
  }, []);

  // Several requests can fail with 401 at once; only the first one clears the session
  const expireSession = useCallback(() => {
    if (!localStorage.getItem('user_details')) return;

    clearSession();
    showInfo('Your session has expired. Please log in again.');
  }, [clearSession, showInfo]);

  useEffect(() => {
    setUnauthorizedHandler(expireSession);
    return () => setUnauthorizedHandler(null);
  }, [expireSession]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_details');

    if (!savedUser) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setRole(parsed.systemUser ? 'admin' : 'user');
    } catch (e) {
      clearStoredSession();
      setLoading(false);
      return;
    }

    setLoading(false);

    // Confirm the stored session is still valid on the server
    authService.me()
      .then(applyUser)
      .catch((err) => {
        if (err.status === 401) expireSession();
      });
  }, [applyUser, expireSession]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    applyUser(data.user);
    return data;
  };

  const demoLogin = async () => {
    const data = await authService.demoLogin();
    applyUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    applyUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, demoLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
