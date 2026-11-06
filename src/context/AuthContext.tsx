import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { api, getToken, setToken, clearToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  activeView: 'landing' | 'portal';
  setActiveView: (view: 'landing' | 'portal') => void;
  authModal: 'none' | 'login' | 'register_customer' | 'register_company' | 'setup_admin';
  setAuthModal: (modal: 'none' | 'login' | 'register_customer' | 'register_company' | 'setup_admin') => void;
  login: (email: string, pass: string) => Promise<void>;
  registerCustomer: (data: any) => Promise<void>;
  registerCompany: (data: any) => Promise<void>;
  registerStaff: (data: any) => Promise<void>;
  setupAdmin: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'landing' | 'portal'>('landing');
  const [authModal, setAuthModal] = useState<'none' | 'login' | 'register_customer' | 'register_company' | 'setup_admin'>('none');

  const refreshUser = async () => {
    const storedToken = getToken();
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser({ ...res.user, company: res.company });
    } catch (err) {
      console.error('Failed to restore session:', err);
      clearToken();
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setAuthModal('none');
    setActiveView('portal');
  };

  const registerCustomer = async (data: any) => {
    const res = await api.registerCustomer(data);
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setAuthModal('none');
    setActiveView('portal');
  };

  const registerCompany = async (data: any) => {
    const res = await api.registerCompany(data);
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setAuthModal('none');
    setActiveView('portal');
  };

  const registerStaff = async (data: any) => {
    const res = await api.registerStaff(data);
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setAuthModal('none');
    setActiveView('portal');
  };

  const setupAdmin = async (data: any) => {
    const res = await api.setupAdmin(data);
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setAuthModal('none');
    setActiveView('portal');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    clearToken();
    setTokenState(null);
    setUser(null);
    setActiveView('landing');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        activeView,
        setActiveView,
        authModal,
        setAuthModal,
        login,
        registerCustomer,
        registerCompany,
        registerStaff,
        setupAdmin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
