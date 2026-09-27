import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, MapPin, AlertTriangle, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import ActivityFeed from '../../components/audit/ActivityFeed';
import { dashboardApi } from '../../services/dashboard';
import './Librarian.css';

const LibrarianDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    dashboardApi.librarian()
      .then((result) => { if (mounted) setData(result); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const stats = [
    { title: 'Total Books', value: data?.total_books ?? 0, icon: <BookOpen size={24} />, color: 'primary' },
    { title: 'Total Copies', value: data?.total_copies ?? 0, icon: <ClipboardList size={24} />, color: 'info' },
    { title: 'Available', value: data?.available ?? 0, icon: <CheckCircle size={24} />, color: 'success' },
    { title: 'Misplaced', value: data?.misplaced ?? 0, icon: <MapPin size={24} />, color: 'warning' },
    { title: 'Missing', value: data?.missing ?? 0, icon: <AlertTriangle size={24} />, color: 'danger' },
    { title: 'Damaged', value: data?.damaged ?? 0, icon: <AlertTriangle size={24} />, color: 'danger' },
  ];

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Librarian Dashboard</h1>
        <p>Overview of library inventory and resources.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
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
          <h2>Latest Books Added</h2>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>Loading...</p>
          ) : (data?.latestBooks || []).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>No books added yet.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Category</th>
                    <th>Copies</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.latestBooks || []).map(book => (
                    <tr key={book.id}>
                      <td><strong>{book.title}</strong></td>
                      <td>{book.category || '-'}</td>
                      <td>{book.total_copies}</td>
                      <td>{book.location || 'Location not set'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="content-card">
          <h2>Recent Activity</h2>
          <p className="text-muted" style={{ marginTop: '-0.5rem' }}>
            Track who changed what across the library.
          </p>
          <ActivityFeed limit={5} linkTo="/admin/logs" />
        </div>
      </div>
    </div>
  );
};

export default LibrarianDashboard;