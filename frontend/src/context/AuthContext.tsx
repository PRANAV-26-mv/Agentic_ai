import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  role: 'ADMIN' | 'STUDENT' | null;
  token: string | null;
  loading: boolean;
  loginWithDevEmail: (email: string) => Promise<void>;
  loginWithGoogleToken: (credential: string) => Promise<void>;
  loginWithRegNumber: (login_id: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'ADMIN' | 'STUDENT' | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('portal_auth_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          setRole(res.data.role);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginWithDevEmail = async (email: string) => {
    const res = await api.post('/auth/google', { email });
    const { token: authToken, role: userRole, user: userData } = res.data;
    localStorage.setItem('portal_auth_token', authToken);
    localStorage.setItem('portal_auth_user', JSON.stringify(userData));
    setToken(authToken);
    setRole(userRole);
    setUser(userData);
  };

  const loginWithGoogleToken = async (credential: string) => {
    const res = await api.post('/auth/google', { credential });
    const { token: authToken, role: userRole, user: userData } = res.data;
    localStorage.setItem('portal_auth_token', authToken);
    localStorage.setItem('portal_auth_user', JSON.stringify(userData));
    setToken(authToken);
    setRole(userRole);
    setUser(userData);
  };

  const loginWithRegNumber = async (login_id: string, password?: string) => {
    const res = await api.post('/auth/login', { login_id, password });
    const { token: authToken, role: userRole, user: userData } = res.data;
    localStorage.setItem('portal_auth_token', authToken);
    localStorage.setItem('portal_auth_user', JSON.stringify(userData));
    setToken(authToken);
    setRole(userRole);
    setUser(userData);
  };

  const logout = () => {
    if (token) {
      api.post('/auth/logout').catch(() => {});
    }
    localStorage.removeItem('portal_auth_token');
    localStorage.removeItem('portal_auth_user');
    setToken(null);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, token, loading, loginWithDevEmail, loginWithGoogleToken, loginWithRegNumber, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      role: null,
      token: null,
      loading: false,
      loginWithDevEmail: async () => {},
      loginWithGoogleToken: async () => {},
      loginWithRegNumber: async () => {},
      logout: () => {}
    };
  }
  return context;
};
