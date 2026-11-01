import { useState, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { AuditContext } from './AuditContext';

const MAX_ENTRIES = 300;

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

  const [activities, setActivities] = useState([]);

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