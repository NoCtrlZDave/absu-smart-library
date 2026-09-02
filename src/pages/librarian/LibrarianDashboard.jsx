import { BookOpen, CheckCircle, Copy, AlertTriangle, Clock, MapPin } from 'lucide-react';
import './Librarian.css';

const stats = [
  { title: 'Total Books', value: 1250, icon: <BookOpen size={24} />, color: 'primary' },
  { title: 'Available', value: 875, icon: <CheckCircle size={24} />, color: 'success' },
  { title: 'Currently Borrowed', value: 320, icon: <Copy size={24} />, color: 'info' },
  { title: 'Overdue', value: 45, icon: <AlertTriangle size={24} />, color: 'danger' },
  { title: 'Active Reservations', value: 67, icon: <Clock size={24} />, color: 'warning' },
  { title: 'Misplaced', value: 8, icon: <MapPin size={24} />, color: 'danger' }
];

const recentBorrowings = [
  { id: 1, book: 'Introduction to Algorithms', student: 'John Doe', date: '2026-09-01', status: 'active' },
  { id: 2, book: 'Database System Concepts', student: 'Sarah Johnson', date: '2026-08-30', status: 'active' },
  { id: 3, book: 'Engineering Mathematics', student: 'Michael Brown', date: '2026-08-28', status: 'overdue' },
  { id: 4, book: 'Organic Chemistry', student: 'Emily Davis', date: '2026-08-25', status: 'active' }
];

const shelfSummary = [
  { floor: 'Floor 1', capacity: 90 },
  { floor: 'Floor 2', capacity: 75 },
  { floor: 'Floor 3', capacity: 60 },
  { floor: 'Floor 4', capacity: 85 }
];

const LibrarianDashboard = () => {
  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Librarian Dashboard</h1>
        <p>Overview of library operations and resources.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-content">
              <h3>{stat.value.toLocaleString()}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div className="content-card">
          <h2>Recent Borrowing Activity</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Student</th>
                  <th>Borrow Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBorrowings.map(item => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.book}</strong>
                    </td>
                    <td>{item.student}</td>
                    <td>{item.date}</td>
                    <td>
                      <span className={`badge ${item.status === 'overdue' ? 'badge-danger' : 'badge-success'}`}>
                        {item.status === 'overdue' ? 'Overdue' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="content-card">
          <h2>Shelf Status</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {shelfSummary.map(floor => (
              <div key={floor.floor}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{floor.floor}</span>
                  <span className="capacity-label">{floor.capacity}% full</span>
                </div>
                <div className="capacity-bar">
                  <div
                    className={`capacity-fill ${floor.capacity >= 85 ? 'high' : floor.capacity >= 70 ? 'medium' : 'low'}`}
                    style={{ width: `${floor.capacity}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibrarianDashboard;
