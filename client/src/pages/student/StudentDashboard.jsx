import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BookMarked,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  Hash,
  MapPin,
  Search,
  UserRound,
} from 'lucide-react';
import { Badge, Button, EmptyState } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { useAuth } from '../../context/useAuth';
import { reservationsApi } from '../../services/reservations';
import { borrowingsApi } from '../../services/borrowings';
import { notificationsApi } from '../../services/notifications';
import { formatDate, formatDateTime } from '../../utils/dates';
import '../admin/Admin.css';
import '../Circulation.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [reservationData, setReservationData] = useState({ items: [], statusCounts: {} });
  const [borrowingData, setBorrowingData] = useState({ items: [], stats: { active: 0, overdue: 0 } });
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fullName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    'Student';
  const firstName = fullName.split(' ')[0];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [reservations, borrowings, notificationData] = await Promise.all([
          reservationsApi.my({ limit: 5 }),
          borrowingsApi.my({ limit: 5 }),
          notificationsApi.my({ limit: 5 }),
        ]);
        if (!mounted) return;
        setReservationData({
          items: reservations?.items || [],
          statusCounts: reservations?.statusCounts || {},
        });
        setBorrowingData({
          items: borrowings?.items || [],
          stats: borrowings?.stats || { active: 0, overdue: 0 },
        });
        setNotifications(notificationData?.items || []);
        setUnread(notificationData?.unread || 0);
      } catch (err) {
        if (mounted) showToast(err.message || 'Could not load your library account.', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const level = user?.academicLevel || user?.level;

  const details = [
    { icon: Hash, label: 'Matric Number', value: user?.matricNumber || 'Not set' },
    {
      icon: GraduationCap,
      label: 'Level',
      value: level ? `${level} Level` : 'Not set',
    },
    { icon: BookOpen, label: 'Department', value: user?.department || 'Not set' },
    { icon: Building2, label: 'Faculty', value: user?.faculty || 'Not set' },
    { icon: UserRound, label: 'Programme', value: user?.programme || 'Not set' },
    {
      icon: CalendarDays,
      label: 'Academic Session',
      value: user?.academicSession || 'Not set',
    },
  ];

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setUnread(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      showToast('Notifications marked as read.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update notifications.', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Welcome, {firstName}</h1>
        <p>Your loans, reservations, and library alerts in one place.</p>
      </div>

      <div className="account-note" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Hash size={18} />
        <span>
          <strong>{user?.matricNumber || 'Matric number not set'}</strong>
          {' · '}
          <strong>{level ? `${level} Level` : 'Level not set'}</strong>
          {' · '}
          {user?.department || 'Department not set'}
          {' · '}
          {user?.faculty || 'Faculty not set'}
          {user?.academicSession ? ` · ${user.academicSession} session` : ''}
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon success"><BookOpen size={22} /></div>
          <div className="stat-content">
            <p>Active loans</p>
            <h3>{loading ? '...' : borrowingData.stats.active || 0}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><CalendarClock size={22} /></div>
          <div className="stat-content">
            <p>Overdue</p>
            <h3>{loading ? '...' : borrowingData.stats.overdue || 0}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><BookMarked size={22} /></div>
          <div className="stat-content">
            <p>Pending reservations</p>
            <h3>{loading ? '...' : reservationData.statusCounts.pending || 0}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info"><MapPin size={22} /></div>
          <div className="stat-content">
            <p>Ready for collection</p>
            <h3>{loading ? '...' : reservationData.statusCounts.approved || 0}</h3>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="content-card">
          <h2>Current loans</h2>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading loans...</p>
          ) : !borrowingData.items.length ? (
            <EmptyState
              icon={BookOpen}
              title="No loans yet"
              description="Reserve a book from the catalogue, then collect it after librarian approval."
              action={
                <Link to="/search" className="btn btn--primary">
                  <Search size={18} />
                  Find a book
                </Link>
              }
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Due date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowingData.items.map((loan) => (
                    <tr key={loan.id}>
                      <td>
                        <Link to={`/books/${loan.book}`} className="cell-title">{loan.bookTitle}</Link>
                        <span className="cell-subtitle">Copy {loan.copyCode}</span>
                      </td>
                      <td>{formatDate(loan.dueDate)}</td>
                      <td>
                        <Badge variant={loan.isOverdue ? 'danger' : loan.status === 'active' ? 'success' : 'info'}>
                          {loan.isOverdue ? 'Overdue' : loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: '1rem' }}>
            <Link to="/student/borrowings" className="btn btn--outline">View all loans</Link>
          </div>
        </div>

        <div className="content-card">
          <h2>Quick actions</h2>
          <div className="form-stack">
            <Link to="/search" className="btn btn--primary">
              <Search size={18} />
              Search the catalogue
            </Link>
            <Link to="/student/reservations" className="btn btn--secondary">
              <BookMarked size={18} />
              My reservations
            </Link>
            <Link to="/student/profile" className="btn btn--outline">
              <UserRound size={18} />
              View profile
            </Link>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="content-card">
          <h2>Reservation updates</h2>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading reservations...</p>
          ) : !reservationData.items.length ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              You have no reservations yet. Open a book record and choose <strong>Reserve this book</strong>.
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Requested</th>
                    <th>Collect by</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservationData.items.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        <Link to={`/books/${reservation.book}`} className="cell-title">{reservation.bookTitle}</Link>
                      </td>
                      <td>{formatDateTime(reservation.reservedAt)}</td>
                      <td>{reservation.expiresAt ? formatDate(reservation.expiresAt) : '-'}</td>
                      <td>
                        <Badge variant={reservation.status === 'approved' ? 'success' : reservation.status === 'rejected' ? 'danger' : 'warning'}>
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: '1rem' }}>
            <Link to="/student/reservations" className="btn btn--outline">View all reservations</Link>
          </div>
        </div>

        <div className="content-card">
          <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bell size={18} />
              Alerts
              {unread > 0 && <Badge variant="danger" size="sm">{unread}</Badge>}
            </span>
            {unread > 0 && (
              <Button size="sm" variant="ghost" onClick={markAllRead}>Mark all read</Button>
            )}
          </h2>
          {!notifications.length ? (
            <p style={{ color: 'var(--text-secondary)' }}>No notifications yet.</p>
          ) : (
            <div className="form-stack">
              {notifications.map((notification) => (
                <div key={notification.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{notification.title}</strong>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: '0.2rem 0' }}>
                    {notification.message}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {formatDateTime(notification.createdAt)}
                  </span>
                </div>
              ))}
              {unread > 0 && <p className="text-muted" style={{ fontSize: '0.78rem' }}>Unread alerts are marked in the count above.</p>}
            </div>
          )}
        </div>
      </div>

      <div className="content-card">
        <h2>Your student details</h2>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          {details.map(({ icon: Icon, label, value }) => (
            <div className="stat-card" key={label}>
              <div className="stat-icon primary"><Icon size={22} /></div>
              <div className="stat-content">
                <p>{label}</p>
                <h3>{value}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
