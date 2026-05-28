import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { authApi } from '../api/index.js';
import { tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Восстанавливаем сессию при загрузке
  useEffect(() => {
    const init = async () => {
      if (!tokenStore.getAccess()) { setLoading(false); return; }
      try {
        const res = await authApi.me();
        if (res?.success) setUser(res.data);
      } catch (_) {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Слушаем "разлогиниться" из axios interceptor
  useEffect(() => {
    const handler = () => { setUser(null); };
    window.addEventListener('volt:logout', handler);
    return () => window.removeEventListener('volt:logout', handler);
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    if (!res.success) throw new Error(res.error || 'Login failed');
    tokenStore.set(res.data.access_token, res.data.refresh_token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (body) => {
    const res = await authApi.register(body);
    if (!res.success) throw new Error(res.error || 'Register failed');
    tokenStore.set(res.data.access_token, res.data.refresh_token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (_) { /* нестрашно */ }
    tokenStore.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isEmployee: user?.type === 'employee',
    isClient: user?.type === 'client',
    role: user?.role,
    login, register, logout, updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
