import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  BookMarked,
  CheckCircle,
  Clock,
  AlertTriangle,
  ClipboardList,
  RotateCcw,
  ShieldCheck,
  BarChart3,
  Activity,
  Users,
  FileText,
  RefreshCw,
} from 'lucide-react';
import ActivityFeed from '../../components/audit/ActivityFeed';
import { dashboardApi } from '../../services/dashboard';
import { reservationsApi } from '../../services/reservations';
import { inventoryApi } from '../../services/inventory';
import '../librarian/Librarian.css';

const ITLibrarianDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, inv] = await Promise.all([
        dashboardApi.librarian().catch(() => null),
        inventoryApi.stats().catch(() => null),
      ]);
      if (dash) setData(dash);
      if (inv) setInventory(inv);

      const pending = await reservationsApi.list({ status: 'pending', limit: 10 });
      setReservations(pending.items || []);
    } catch (err) {
      console.error('IT Librarian dashboard load failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const stats = [
    {
      title: 'Total Titles',
      value: data?.total_books ?? 0,
      icon: <BookOpen size={24} />,
      color: 'primary',
      to: '/librarian/books',
    },
    {
      title: 'Total Copies',
      value: data?.total_copies ?? 0,
      icon: <ClipboardList size={24} />,
      color: 'info',
      to: '/librarian/book-copies',
    },
    {
      title: 'Available Copies',
      value: data?.available ?? 0,
      icon: <CheckCircle size={24} />,
      color: 'success',
      to: '/librarian/books?availability=available',
    },
    {
      title: 'On Loan',
      value: data?.borrowed ?? 0,
      icon: <RotateCcw size={24} />,
      color: 'warning',
      to: '/librarian/borrowings',
    },
    {
      title: 'Pending Reservations',
      value: data?.pending_reservations ?? 0,
      icon: <BookMarked size={24} />,
      color: 'warning',
      to: '/librarian/reservations?status=pending',
    },
    {
      title: 'Overdue Loans',
      value: data?.overdue_loans ?? 0,
      icon: <Clock size={24} />,
      color: 'danger',
      to: '/librarian/borrowings?status=overdue',
    },
    {
      title: 'Missing',
      value: data?.missing ?? 0,
      icon: <AlertTriangle size={24} />,
      color: 'danger',
      to: '/librarian/inventory?status=missing',
    },
    {
      title: 'Damaged',
      value: data?.damaged ?? 0,
      icon: <AlertTriangle size={24} />,
      color: 'danger',
      to: '/librarian/inventory?status=damaged',
    },
  ];

  return (
    <div className="librarian-page">
      <div className="page-header">
        <div className="header-content">
          <div className="role-badge">
            <ShieldCheck size={20} />
            <span>IT Librarian</span>
          </div>
          <h1>IT Librarian Dashboard</h1>
          <p>
            Monitor reservations, approve or reject requests, and oversee library system operations.
          </p>
        </div>
        <div className="header-actions">
          <ButtonRefresh onClick={handleRefresh} loading={refreshing} />
          <Link to="/librarian/reservations" className="btn btn--primary">
            <BookMarked size={16} />
            Manage Reservations
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" onClick={() => stat.to && navigate(stat.to)} style={{ cursor: 'pointer' }}>
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-content">
              <h3>{loading ? '...' : stat.value.toLocaleString()}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        {/* Pending Reservations Review Queue */}
        <div className="content-card">
          <div className="card-header">
            <h2>Reservation Review Queue</h2>
            <p>Pending reservations awaiting IT Librarian approval or rejection.</p>
            <Link to="/librarian/reservations?status=pending" className="btn btn--outline btn--small">
              View All
            </Link>
          </div>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>Loading...</p>
          ) : reservations.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>
              No pending reservations. All requests are up to date.
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Matric No.</th>
                    <th>Book Title</th>
                    <th>Department</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id || r._id}>
                      <td>{r.studentName || 'Student'}</td>
                      <td>{r.matricNumber || '-'}</td>
                      <td>{r.bookTitle || '-'}</td>
                      <td>{r.department || '-'}</td>
                      <td>{r.reservedAt ? new Date(r.reservedAt).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="actions-cell">
                          <Link
                            to={`/librarian/reservations/${r.id || r._id}/approve`}
                            className="btn btn--success btn--small"
                          >
                            Approve
                          </Link>
                          <Link
                            to={`/librarian/reservations/${r.id || r._id}/reject`}
                            className="btn btn--danger btn--small"
                          >
                            Reject
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inventory & Circulation Overview */}
        <div className="content-card">
          <div className="card-header">
            <h2>Inventory & Circulation</h2>
            <p>Current stock status across the library collection.</p>
          </div>
          {loading || !inventory ? (
            <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>Loading...</p>
          ) : (
            <div className="inventory-grid">
              <div className="inv-tile">
                <div className="inv-label">Total Books</div>
                <div className="inv-value">{inventory.total_books ?? 0}</div>
              </div>
              <div className="inv-tile">
                <div className="inv-label">Total Copies</div>
                <div className="inv-value">{inventory.total_copies ?? 0}</div>
              </div>
              <div className="inv-tile">
                <div className="inv-label">Available</div>
                <div className="inv-value inv-available">{inventory.available ?? 0}</div>
              </div>
              <div className="inv-tile">
                <div className="inv-label">Reserved</div>
                <div className="inv-value inv-reserved">{inventory.reserved ?? 0}</div>
              </div>
              <div className="inv-tile">
                <div className="inv-label">Borrowed</div>
                <div className="inv-value inv-borrowed">{inventory.borrowed ?? 0}</div>
              </div>
              <div className="inv-tile">
                <div className="inv-label">Missing</div>
                <div className="inv-value inv-danger">{inventory.missing ?? 0}</div>
              </div>
              <div className="inv-tile">
                <div className="inv-label">Damaged</div>
                <div className="inv-value inv-danger">{inventory.damaged ?? 0}</div>
              </div>
              <div className="inv-tile">
                <div className="inv-label">Misplaced</div>
                <div className="inv-value inv-warning">{inventory.misplaced ?? 0}</div>
              </div>
            </div>
          )}
        </div>

        {/* System Operations */}
        <div className="content-card">
          <div className="card-header">
            <h2>System Operations</h2>
            <p>Monitor library system health and recent administrative actions.</p>
          </div>
          <div className="ops-grid">
            <div className="ops-tile">
              <Activity size={24} />
              <div>
                <div className="ops-label">Audit Trail</div>
                <div className="ops-desc">View who created, edited, or deleted records.</div>
              </div>
              <Link to="/admin/logs" className="btn btn--outline btn--small">
                View Logs
              </Link>
            </div>
            <div className="ops-tile">
              <Users size={24} />
              <div>
                <div className="ops-label">User Management</div>
                <div className="ops-desc">Monitor student and staff accounts.</div>
              </div>
              <Link to="/admin/users" className="btn btn--outline btn--small">
                View Users
              </Link>
            </div>
            <div className="ops-tile">
              <FileText size={24} />
              <div>
                <div className="ops-label">Settings</div>
                <div className="ops-desc">Review circulation and fine policies.</div>
              </div>
              <Link to="/admin/settings" className="btn btn--outline btn--small">
                View Settings
              </Link>
            </div>
            <div className="ops-tile">
              <BarChart3 size={24} />
              <div>
                <div className="ops-label">Reports</div>
                <div className="ops-desc">Generate departmental and inventory reports.</div>
              </div>
              <Link to="/librarian/reports" className="btn btn--outline btn--small">
                View Reports
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="content-card">
          <h2>Recent Activity</h2>
          <p className="text-muted" style={{ marginTop: '-0.5rem' }}>
            Track who changed what across the library system.
          </p>
          <ActivityFeed limit={5} />
        </div>
      </div>
    </div>
  );
};

const ButtonRefresh = ({ onClick, loading }) => (
  <button
    className="btn btn--outline btn--small"
    onClick={onClick}
    disabled={loading}
    aria-label="Refresh dashboard"
  >
    <RefreshCw size={16} className={loading ? 'spin' : ''} />
    {loading ? 'Refreshing...' : 'Refresh'}
  </button>
);

export default ITLibrarianDashboard;
