import { useState, useCallback, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authApi } from '../services/auth';
import { setToken, clearToken, getToken } from '../services/api';

const USER_KEY = 'absu_user';

const readStoredUser = () => {
  try {
    const saved = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const storeUser = (user, remember = true) => {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    return;
  }

  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  target.setItem(USER_KEY, JSON.stringify(user));
  other.removeItem(USER_KEY);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [persistedToken, setPersistedToken] = useState(getToken());
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      if (!getToken()) {
        if (mounted) {
          setUser(null);
          storeUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const me = await authApi.me();
        if (!mounted) return;
        setUser(me);
        storeUser(me, !sessionStorage.getItem(USER_KEY));
      } catch {
        if (!mounted) return;
        clearToken();
        storeUser(null);
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

  const finishLogin = useCallback((data, remember = true) => {
    setToken(data.token, remember);
    setPersistedToken(data.token);
    setUser(data.user);
    storeUser(data.user, remember);
    return { success: true, user: data.user };
  }, []);

  const login = useCallback(
    async (identifier, password, remember = true) => {
      try {
        const data = await authApi.login({ identifier, password });
        return finishLogin(data, remember);
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [finishLogin]
  );

  const addUser = useCallback(async (userData) => {
    try {
      const { adminApi } = await import('../services/admin');
      const data = await adminApi.createUser(userData);
      return { success: true, user: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setPersistedToken(null);
    setUser(null);
    storeUser(null);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const updated = await authApi.changePassword({ currentPassword, newPassword });
      if (updated) {
        setUser(updated);
        storeUser(updated, !sessionStorage.getItem(USER_KEY));
      }
      return { success: true, user: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    try {
      const updated = await authApi.updateProfile(payload);
      setUser(updated);
      storeUser(updated, !sessionStorage.getItem(USER_KEY));
      return { success: true, user: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, addUser, logout, changePassword, updateProfile, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};