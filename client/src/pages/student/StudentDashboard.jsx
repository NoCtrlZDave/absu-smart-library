import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, AlertTriangle, Clock, History, Search, Bookmark, RotateCcw, User } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { dashboardApi } from '../../services/dashboard';
import { Spinner } from '../../components/common';
import './Student.css';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

const statusBadge = (s) => {
  const map = {
    active: 'info', returned: 'success', completed: 'success',
    overdue: 'danger', pending: 'warning', reserved: 'warning',
  };
  const label = { active: 'Active', returned: 'Returned', completed: 'Completed', overdue: 'Overdue', pending: 'Pending', reserved: 'Reserved' };
  return <span className={`badge badge-${map[s] || 'info'}`}>{label[s] || s}</span>;
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await dashboardApi.student();
        if (!mounted) return;
        setStats([
          { title: 'Currently Borrowed', value: data.currently_borrowed ?? 0, icon: <BookOpen size={24} />, color: 'primary' },
          { title: 'Overdue Books', value: data.overdue ?? 0, icon: <AlertTriangle size={24} />, color: 'danger' },
          { title: 'Active Reservations', value: data.reservations ?? 0, icon: <Clock size={24} />, color: 'warning' },
          { title: 'Books Read', value: data.books_read ?? 0, icon: <History size={24} />, color: 'success' },
        ]);
        setRecentActivity(data.recentBorrowings ?? []);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const displayName = user ? `${user.first_name} ${user.last_name}` : 'Student';

  if (loading) return <Spinner />;
  if (error) return <div className="student-page" style={{ color: 'var(--danger)', textAlign: 'center', padding: '3rem' }}>{error}</div>;

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p>
        Welcome back, {displayName}
        {user?.matric_number && (
          <>
            {' '}
            (<code>{user.matric_number}</code>)
          </>
        )}
        ! Here&apos;s your library overview.
      </p>
      </div>

      {stats && (
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="content-grid">
        <div className="content-card">
          <h2>Recent Activity</h2>
          <div className="table-container">
            {recentActivity.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No recent activity.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrowed</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.book_title || row.title || '-'}</strong></td>
                      <td>{formatDate(row.borrow_date || row.borrowed_at)}</td>
                      <td>{formatDate(row.due_date)}</td>
                      <td>{statusBadge(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="content-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/search" className="quick-action">
              <div className="quick-action-icon"><Search size={24} /></div>
              <span>Search Books</span>
            </Link>
            <Link to="/student/reservations" className="quick-action">
              <div className="quick-action-icon"><Bookmark size={24} /></div>
              <span>Reservations</span>
            </Link>
            <Link to="/student/borrowed" className="quick-action">
              <div className="quick-action-icon"><RotateCcw size={24} /></div>
              <span>Returns</span>
            </Link>
            <Link to="/student/profile" className="quick-action">
              <div className="quick-action-icon"><User size={24} /></div>
              <span>My Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
