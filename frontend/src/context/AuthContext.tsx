import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'receptionist' | 'doctor' | 'lab' | 'pharmacist' | 'manager' | 'patient';
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: ProxyObject | User, token: string, expiresAt?: string) => void;
  logout: () => void;
}

// Add ProxyObject type for flexibility
type ProxyObject = any;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('mmh_user');
    const storedToken = localStorage.getItem('mmh_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('mmh_user');
        localStorage.removeItem('mmh_token');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, authToken: string, expiresAt?: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('mmh_user', JSON.stringify(userData));
    localStorage.setItem('mmh_token', authToken);
    if (expiresAt) {
      localStorage.setItem('mmh_expires', expiresAt);
    }
  };

  const logout = async () => {
    // ── Tell the backend to mark this session as inactive in the DB ──────────
    // This is CRITICAL: without this, the DB session stays isActive:true
    // and the next login from ANY device/browser sees a false conflict.
    try {
      await authAPI.logout();
    } catch {
      // Silently ignore — if the server is down or token already gone,
      // we still want to clear local state.
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem('mmh_user');
    localStorage.removeItem('mmh_token');
    localStorage.removeItem('mmh_expires');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
