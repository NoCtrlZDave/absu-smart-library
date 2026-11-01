import { useEffect, useMemo, useState } from 'react';
import { Settings2, BookOpen, Bell, Save, RefreshCw, GraduationCap } from 'lucide-react';
import { Button, Input, Spinner } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { adminApi } from '../../services/admin';
import { ACADEMIC_SESSION_KEY, normalizeAcademicSession } from '../../utils/academic';
import './Admin.css';

const GROUP_LABELS = {
  reservation: 'Reservations',
  borrowing: 'Borrowing',
  renewal: 'Renewals',
  fines: 'Fines',
  notifications: 'Notifications',
  student: 'Student Accounts',
  academic: 'Academic Session',
};

const GROUP_ICONS = {
  reservation: BookOpen,
  borrowing: BookOpen,
  renewal: RefreshCw,
  fines: Settings2,
  notifications: Bell,
  student: Settings2,
  academic: GraduationCap,
};

const labelFor = (key) => {
  const name = key.split('.').slice(1).join(' ');
  const spaced = name
    .replace(/([A-Z])/g, ' $1')
    .replace(/\bper\b/gi, 'per')
    .replace(/\bDays\b/g, 'days')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const Settings = () => {
  const showToast = useToast();
  const [defaults, setDefaults] = useState({});
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [defaultData, stored] = await Promise.all([
        adminApi.settingsDefaults(),
        adminApi.settings(),
      ]);
      const base = defaultData?.defaults || {};
      const storedMap = {};
      (stored || []).forEach((item) => {
        storedMap[item.key] = item.value;
      });
      setDefaults(base);
      setSaved(storedMap);
      setValues({ ...base, ...storedMap });
    } catch (err) {
      showToast(err.message || 'Could not load settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const map = new Map();
    Object.keys(defaults).forEach((key) => {
      const group = key.split('.')[0];
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(key);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [defaults]);

  const setValue = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const sessionValue = values[ACADEMIC_SESSION_KEY];
      const normalizedSession = sessionValue ? normalizeAcademicSession(sessionValue) : null;
      if (sessionValue && !normalizedSession) {
        showToast('Enter a valid academic session in the format YYYY/YYYY, e.g. 2026/2027.', 'error');
        return;
      }
      if (normalizedSession) setValue(ACADEMIC_SESSION_KEY, normalizedSession);

      const changed = Object.keys(values)
        .filter((key) => JSON.stringify(values[key]) !== JSON.stringify(saved[key] ?? defaults[key]))
        .map((key) => ({
          key,
          value: key === ACADEMIC_SESSION_KEY ? normalizedSession ?? values[key] : values[key],
          label: labelFor(key),
          category: key.split('.')[0],
        }));

      if (!changed.length) {
        showToast('No changes to save.', 'info');
        return;
      }

      const result = await adminApi.saveSettings(changed);
      const storedMap = {};
      (result || []).forEach((item) => {
        storedMap[item.key] = item.value;
      });
      setSaved(storedMap);
      showToast('Settings saved.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>System Settings</h1>
        <p>Circulation, fine and notification policies are applied immediately after saving.</p>
      </div>

      {groups.map(([group, keys]) => {
        const Icon = GROUP_ICONS[group] || Settings2;
        return (
          <div className="content-card" key={group} style={{ marginBottom: '1.5rem' }}>
            <div className="settings-group">
              <h3>
                <Icon size={18} style={{ color: 'var(--primary)' }} />
                {GROUP_LABELS[group] || labelFor(`${group}.settings`)}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {keys.map((key) => {
                  const value = values[key];
                  const defaultIsBoolean = typeof defaults[key] === 'boolean';

                  return (
                    <div className="form-group" key={key}>
                      <label>{labelFor(key)}</label>
                      {defaultIsBoolean ? (
                        <button
                          type="button"
                          className={`toggle-switch ${value ? 'active' : ''}`}
                          aria-pressed={Boolean(value)}
                          onClick={() => setValue(key, !value)}
                        />
                      ) : typeof defaults[key] === 'number' ? (
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={value ?? ''}
                          onChange={(e) => setValue(key, e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      ) : key === ACADEMIC_SESSION_KEY ? (
                        <Input
                          value={value ?? ''}
                          placeholder="e.g. 2026/2027"
                          onChange={(e) => setValue(key, e.target.value)}
                          helper="Type the session manually, e.g. 2026/2027."
                          error={
                            value && !normalizeAcademicSession(value)
                              ? 'Use the format YYYY/YYYY, e.g. 2026/2027.'
                              : ''
                          }
                        />
                      ) : key.includes('template') ? (
                        <Input value={value ?? ''} onChange={(e) => setValue(key, e.target.value)} />
                      ) : (
                        <Input value={value ?? ''} onChange={(e) => setValue(key, e.target.value)} />
                      )}
                      <small style={{ color: 'var(--text-secondary)' }}>
                        Key: {key} · Default: {String(defaults[key])}
                      </small>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <div className="content-card">
        <div className="settings-group">
          <h3>
            <Bell size={18} style={{ color: 'var(--primary)' }} />
            Notification providers
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Email, SMS and WhatsApp delivery require provider credentials configured on the server
            (EMAIL_PROVIDER_URL, SMS_PROVIDER_URL, WHATSAPP_API_URL and their keys). In-app
            notifications always work. Use the notification test endpoint after configuring a provider.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
