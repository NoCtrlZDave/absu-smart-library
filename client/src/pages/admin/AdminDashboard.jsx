import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Activity, CalendarDays, GraduationCap, Save } from 'lucide-react';
import ActivityFeed from '../../components/audit/ActivityFeed';
import { Button, Select } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { adminApi } from '../../services/admin';
import { dashboardApi } from '../../services/dashboard';
import {
  ACADEMIC_SESSION_KEY,
  buildAcademicSessionOptions,
  computeLevelFromMatric,
  getDefaultAcademicSession,
  normalizeAcademicSession,
} from '../../utils/academic';
import './Admin.css';

const AdminDashboard = () => {
  const showToast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(getDefaultAcademicSession);
  const [savingSession, setSavingSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    dashboardApi.admin()
      .then((data) => { if (mounted) setStats(data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    adminApi.settings()
      .then((data) => {
        if (!mounted) return;
        const stored = (data || []).find((item) => item.key === ACADEMIC_SESSION_KEY);
        setSession(normalizeAcademicSession(stored?.value) || getDefaultAcademicSession());
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const sessionOptions = useMemo(() => {
    const options = buildAcademicSessionOptions();
    if (session && !options.some((option) => option.value === session)) {
      return [...options, { value: session, label: session }].sort(
        (a, b) => Number(a.value.slice(0, 4)) - Number(b.value.slice(0, 4))
      );
    }
    return options;
  }, [session]);

  const levelPreview = computeLevelFromMatric('2021/131178/REGULAR', session);

  const saveSession = async () => {
    setSavingSession(true);
    try {
      await adminApi.saveSettings([
        {
          key: ACADEMIC_SESSION_KEY,
          value: session,
          label: 'Current session',
          category: 'academic',
        },
      ]);
      showToast(`Academic session set to ${session}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Could not save the academic session.', 'error');
    } finally {
      setSavingSession(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats?.total_users ?? '-', icon: <Users size={24} />, color: 'primary' },
    { title: 'Total Books', value: stats?.total_books ?? '-', icon: <BookOpen size={24} />, color: 'success' },
    { title: 'Total Copies', value: stats?.total_copies ?? '-', icon: <Activity size={24} />, color: 'info' },
    { title: 'Librarians', value: stats?.librarians ?? '-', icon: <Users size={24} />, color: 'success' },
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System-wide overview and management.</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-content">
              <h3>{loading ? '...' : stat.value.toLocaleString()}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className="stat-icon primary"><CalendarDays size={22} /></span>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <h2 style={{ marginBottom: '0.25rem' }}>Academic session</h2>
            <p className="card-subtitle" style={{ marginBottom: 0 }}>
              Choose the session the school is currently in. Student levels are calculated from the
              admission year in the matric number and this session.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
            gap: '1rem',
            alignItems: 'end',
            marginTop: '1.25rem',
          }}
        >
          <Select
            label="Current session"
            value={session}
            onChange={(event) => setSession(event.target.value)}
            options={sessionOptions}
          />
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={saveSession} loading={savingSession} disabled={!session}>
              <Save size={18} />
              Save session
            </Button>
            <Link to="/admin/students" className="btn btn--outline">
              <GraduationCap size={18} />
              View students
            </Link>
          </div>
        </div>

        <div className="level-preview">
          <div className="level-preview__icon"><GraduationCap size={22} /></div>
          <div>
            <div className="level-preview__label">Example calculation</div>
            <div className="level-preview__value">
              2021/131178/REGULAR <span>→</span>{' '}
              <strong>{levelPreview ? `${levelPreview} Level` : 'Not available'}</strong>
              <span className="level-preview__meta">in {session}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="content-card">
          <h2>Recent Activity</h2>
          <p className="text-muted" style={{ marginTop: '-0.5rem' }}>
            Changes by admins and librarians are tracked here.
          </p>
          <ActivityFeed limit={6} linkTo="/admin/logs" />
        </div>

        <div className="content-card">
          <h2>Quick Links</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/admin/books" className="quick-action">
              <span style={{ width: 40, height: 40, background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={18} /></span>
              <span>Manage Books</span>
            </Link>
            <Link to="/admin/users" className="quick-action">
              <span style={{ width: 40, height: 40, background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} /></span>
              <span>Manage Users</span>
            </Link>
            <Link to="/admin/students" className="quick-action">
              <span style={{ width: 40, height: 40, background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GraduationCap size={18} /></span>
              <span>Manage Students</span>
            </Link>
            <Link to="/admin/logs" className="quick-action">
              <span style={{ width: 40, height: 40, background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={18} /></span>
              <span>View Logs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;