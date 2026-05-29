import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    const demoUser = localStorage.getItem('demo_user');
    return storedUser ? JSON.parse(storedUser) : demoUser ? JSON.parse(demoUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem('demo_mode') === 'true');

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.removeItem('demo_user');
      localStorage.removeItem('demo_mode');
      setIsDemoMode(false);
      setUser(data.data.user);
    }
    
    return data;
  };

  const demoLogin = (demoUser) => {
    localStorage.setItem('demo_user', JSON.stringify(demoUser));
    localStorage.setItem('demo_mode', 'true');
    setIsDemoMode(true);
    setUser(demoUser);
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_mode');
    setIsDemoMode(false);
    setUser(null);
  };

  const resetDemo = () => {
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_mode');
    setIsDemoMode(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      demoLogin,
      register, 
      logout, 
      resetDemo,
      loading, 
      isDemoMode 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
