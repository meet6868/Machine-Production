import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { getToken, setToken, removeToken, isAuthenticated } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check if token exists and is valid
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getProfile();
      setUser(response.data.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const refreshUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    refreshUserProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
