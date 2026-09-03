import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user'); // 'user' | 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_details');
    
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setRole(parsed.systemUser ? 'admin' : 'user');
      } catch (e) {
        localStorage.removeItem('user_details');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, forcedRole = 'user') => {
    try {
      const data = await authService.login(email, password);
      const userData = data.user;
      
      const userRole = userData.systemUser ? 'admin' : 'user';

      if (forcedRole === 'admin' && !userData.systemUser) {
        throw { message: 'Access denied: This account is not an administrator.' };
      }

      setUser(userData);
      setRole(userRole);
      
      localStorage.setItem('user_details', JSON.stringify(userData));
      localStorage.setItem('user_role', userRole);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authService.register(name, email, password);
      const userData = data.user;
      
      const userRole = userData.systemUser ? 'admin' : 'user';

      setUser(userData);
      setRole(userRole);
      
      localStorage.setItem('user_details', JSON.stringify(userData));
      localStorage.setItem('user_role', userRole);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setRole('user');
    localStorage.removeItem('user_details');
    localStorage.removeItem('user_role');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout }}>
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
