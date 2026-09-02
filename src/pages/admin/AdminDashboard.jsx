import { Users, BookOpen, RefreshCw, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import './Admin.css';

const stats = [
  { title: 'Total Users', value: '8,543', icon: <Users size={24} />, color: 'primary' },
  { title: 'Total Books', value: '5,240', icon: <BookOpen size={24} />, color: 'success' },
  { title: 'Active Borrowings', value: '320', icon: <RefreshCw size={24} />, color: 'info' },
  { title: 'System Health', value: '98%', icon: <Activity size={24} />, color: 'primary' }
];

const recentActivity = [
  { id: 1, action: 'User Registration', user: 'New student registered', time: '2 hours ago' },
  { id: 2, action: 'Book Added', user: 'Introduction to Algorithms added', time: '5 hours ago' },
  { id: 3, action: 'Borrowing Processed', user: 'Book borrowed by John Doe', time: 'Yesterday' },
  { id: 4, action: 'System Update', user: 'Scheduled maintenance completed', time: '2 days ago' }
];

const systemHealth = [
  { service: 'Database', status: 'online', uptime: '99.9%' },
  { service: 'API Server', status: 'online', uptime: '99.8%' },
  { service: 'RFID Service', status: 'warning', uptime: '97.5%' },
  { service: 'Email Service', status: 'online', uptime: '99.9%' }
];

const AdminDashboard = () => {
  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System-wide overview and management.</p>
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
                  <th>Details</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.action}</strong></td>
                    <td>{item.user}</td>
                    <td>{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="content-card">
          <h2>System Health</h2>
          {systemHealth.map(service => (
            <div key={service.name} className="health-item">
              <div className="health-status">
                <span className={`health-dot ${service.status}`} />
                <strong style={{ color: 'var(--text)' }}>{service.name}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: service.status === 'warning' ? 'var(--warning)' : 'var(--success)' }}>
                  {service.status === 'online' ? 'Online' : 'Degraded'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Uptime: {service.uptime}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="content-grid">
        <div className="content-card">
          <h2>User Distribution</h2>
          <div style={{ padding: '1rem' }}>
            <div className="capacity-bar" style={{ height: '12px' }}>
              <div className="capacity-fill low" style={{ width: '70%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Students: 8,125 (95%)</span>
              <span style={{ color: 'var(--text-secondary)' }}>Librarians: 418 (5%)</span>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h2>Quick Stats</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                <span style={{ color: 'var(--text)' }}>Borrowings Today</span>
              </div>
              <strong style={{ color: 'var(--text)' }}>48</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                <span style={{ color: 'var(--text)' }}>Pending Returns</span>
              </div>
              <strong style={{ color: 'var(--text)' }}>12</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                <span style={{ color: 'var(--text)' }}>Overdue Books</span>
              </div>
              <strong style={{ color: 'var(--danger)' }}>17</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} style={{ color: 'var(--info)' }} />
                <span style={{ color: 'var(--text)' }}>Active Reservations</span>
              </div>
              <strong style={{ color: 'var(--text)' }}>67</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
