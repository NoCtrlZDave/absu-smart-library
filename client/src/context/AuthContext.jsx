import { useState, useCallback, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authApi } from '../services/auth';
import { setToken, clearToken, getToken } from '../services/api';

const USER_KEY = 'absu_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [persistedToken, setPersistedToken] = useState(getToken());
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!mounted) return;
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      } catch {
        if (!mounted) return;
        clearToken();
        localStorage.removeItem(USER_KEY);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    bootstrap();
    return () => {
      mounted = false;
    };
  }, [persistedToken]);

  const finishLogin = useCallback((data) => {
    setToken(data.token);
    setPersistedToken(data.token);
    setUser(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  }, []);

  const login = useCallback(
    async (identifier, password) => {
      try {
        const data = await authApi.login({ identifier, password });
        return finishLogin(data);
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [finishLogin]
  );

  const addUser = useCallback(async (userData) => {
    try {
      const { createUser } = await import('../services/admin');
      const data = await createUser(userData);
      return { success: true, user: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setPersistedToken(null);
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const updated = await authApi.changePassword({ currentPassword, newPassword });
      if (updated) {
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
      return { success: true, user: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, addUser, logout, changePassword, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};