import { Link } from 'react-router-dom';
import { BookOpen, AlertTriangle, Clock, History, Search, Bookmark, RotateCcw, User } from 'lucide-react';
import './Student.css';

const stats = [
  { title: 'Currently Borrowed', value: 3, icon: <BookOpen size={24} />, color: 'primary' },
  { title: 'Overdue Books', value: 1, icon: <AlertTriangle size={24} />, color: 'danger' },
  { title: 'Active Reservations', value: 2, icon: <Clock size={24} />, color: 'warning' },
  { title: 'Books Read', value: 24, icon: <History size={24} />, color: 'success' }
];

const recentActivity = [
  { id: 1, action: 'Borrowed', book: 'Introduction to Algorithms', date: '2026-08-28', status: 'active' },
  { id: 2, action: 'Returned', book: 'Database System Concepts', date: '2026-08-25', status: 'completed' },
  { id: 3, action: 'Reserved', book: 'Software Engineering', date: '2026-08-20', status: 'pending' },
  { id: 4, action: 'Borrowed', book: 'Engineering Mathematics', date: '2026-08-15', status: 'overdue' }
];

const StudentDashboard = () => {
  return (
    <div className="student-page">
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p>Welcome back, John Doe! Here's your library overview.</p>
      </div>

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

      <div className="content-grid">
        <div className="content-card">
          <h2>Recent Activity</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Book</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map(activity => (
                  <tr key={activity.id}>
                    <td>{activity.action}</td>
                    <td>{activity.book}</td>
                    <td>{activity.date}</td>
                    <td>
                      <span className={`badge badge-${activity.status === 'completed' ? 'success' : activity.status === 'overdue' ? 'danger' : activity.status === 'pending' ? 'warning' : 'info'}`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="content-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/search" className="quick-action">
              <div className="quick-action-icon">
                <Search size={24} />
              </div>
              <span>Search Books</span>
            </Link>
            <Link to="/student/reservations" className="quick-action">
              <div className="quick-action-icon">
                <Bookmark size={24} />
              </div>
              <span>Reservations</span>
            </Link>
            <Link to="/student/borrowed" className="quick-action">
              <div className="quick-action-icon">
                <RotateCcw size={24} />
              </div>
              <span>Returns</span>
            </Link>
            <Link to="/student/profile" className="quick-action">
              <div className="quick-action-icon">
                <User size={24} />
              </div>
              <span>My Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
