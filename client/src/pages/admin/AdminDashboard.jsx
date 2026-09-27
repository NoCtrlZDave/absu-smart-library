import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Activity, ArrowRight } from 'lucide-react';
import ActivityFeed from '../../components/audit/ActivityFeed';
import { useAuth } from '../../context/useAuth';
import { useAudit } from '../../context/useAudit';
import { dashboardApi } from '../../services/dashboard';
import './Admin.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { audit } = useAudit();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    dashboardApi.admin()
      .then((data) => { if (mounted) setStats(data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

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