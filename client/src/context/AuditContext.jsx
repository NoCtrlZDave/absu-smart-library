import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { AuditContext } from './AuditContext';

const AUDIT_KEY = 'absu_audit_log';
const MAX_ENTRIES = 300;

const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const storageWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable — keep state in memory only.
  }
};

const getActorName = (user) => {
  if (!user) return 'System';
  return (
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.email ||
    'Unknown'
  );
};

export const AuditProvider = ({ children }) => {
  const { user } = useAuth();

  const [activities, setActivities] = useState(() => {
    const saved = loadJSON(AUDIT_KEY, null);
    return Array.isArray(saved) ? saved : [];
  });

  useEffect(() => {
    storageWrite(AUDIT_KEY, activities);
  }, [activities]);

  const audit = useCallback(
    (action, entity, description) => {
      const entry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        actorName: getActorName(user),
        actorEmail: user?.email || '',
        actorRole: user?.role || 'system',
        action,
        entity,
        description,
      };
      setActivities((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
      return entry;
    },
    [user]
  );

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  const value = useMemo(
    () => ({ activities, audit, clearActivities }),
    [activities, audit, clearActivities]
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
};