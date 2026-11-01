import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, CalendarClock, RefreshCw, Search, XCircle } from 'lucide-react';
import { Badge, Button, EmptyState, Modal, Pagination } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { reservationsApi } from '../../services/reservations';
import { formatDate, formatDateTime } from '../../utils/dates';
import '../admin/Admin.css';
import '../Circulation.css';

const STATUS_VARIANTS = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'maintenance',
  expired: 'info',
  fulfilled: 'info',
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'expired', label: 'Expired' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'fulfilled', label: 'Collected' },
];

const StudentReservations = () => {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    reservationsApi.my({ status: filter === 'all' ? undefined : filter, page, limit: 10 })
      .then((data) => {
        if (!mounted) return;
        setItems(data?.items || []);
        setCounts(data?.statusCounts || {});
        setPagination(data?.pagination || null);
      })
      .catch((err) => {
        if (mounted) showToast(err.message || 'Could not load reservations.', 'error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [filter, page, showToast]);

  const changeFilter = (key) => {
    setFilter(key);
    setPage(1);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await reservationsApi.cancel(cancelTarget.id, cancelReason);
      showToast('Reservation cancelled.', 'success');
      setCancelTarget(null);
      setCancelReason('');
      setPage(1);
      const data = await reservationsApi.my({ status: filter === 'all' ? undefined : filter, page: 1, limit: 10 });
      setItems(data?.items || []);
      setCounts(data?.statusCounts || {});
      setPagination(data?.pagination || null);
    } catch (err) {
      showToast(err.message || 'Could not cancel reservation.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>My Reservations</h1>
        <p>Track requests, approval status, and collection deadlines.</p>
      </div>

      <div className="circulation-summary">
        <div className="summary-tile">
          <span>Pending approval</span>
          <strong>{counts.pending || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Ready for collection</span>
          <strong>{counts.approved || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Collected</span>
          <strong>{counts.fulfilled || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Rejected</span>
          <strong>{counts.rejected || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Expired</span>
          <strong>{counts.expired || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Cancelled</span>
          <strong>{counts.cancelled || 0}</strong>
        </div>
      </div>

      <div className="page-tabs" role="tablist" aria-label="Reservation status filters">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`page-tab${filter === tab.key ? ' page-tab--active' : ''}`}
            onClick={() => changeFilter(tab.key)}
            role="tab"
            aria-selected={filter === tab.key}
          >
            {tab.label}
            {tab.key !== 'all' && counts[tab.key] ? (
              <span className="page-tab__count">{counts[tab.key]}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="content-card">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>Loading reservations...</p>
        ) : !items.length ? (
          <EmptyState
            icon={BookMarked}
            title="No reservations in this view"
            description="Find a book in the catalogue and submit a reservation request."
            action={
              <Link to="/search" className="btn btn--primary">
                <Search size={18} />
                Search catalogue
              </Link>
            }
          />
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Copy</th>
                    <th>Requested</th>
                    <th>Collect by</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        <Link to={`/books/${reservation.book}`} className="cell-title">
                          {reservation.bookTitle}
                        </Link>
                        <span className="cell-subtitle">{reservation.bookAuthor || 'Author not recorded'}</span>
                        {reservation.rejectionReason && (
                          <span className="cell-note">Reason: {reservation.rejectionReason}</span>
                        )}
                      </td>
                      <td>{reservation.copyCode || 'Assigned after approval'}</td>
                      <td>{formatDateTime(reservation.reservedAt)}</td>
                      <td>{reservation.expiresAt ? formatDate(reservation.expiresAt) : '-'}</td>
                      <td>
                        <Badge variant={STATUS_VARIANTS[reservation.status] || 'info'}>
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        {['pending', 'approved'].includes(reservation.status) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelTarget(reservation)}
                          >
                            <XCircle size={15} />
                            Cancel
                          </Button>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <div className="content-card">
        <h2>How reservations work</h2>
        <div className="inline-note">
          <CalendarClock size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
          A pending request does not reserve a copy yet. The library assigns a physical copy when
          the request is approved. Collect approved reservations before the deadline or the copy
          returns to the available pool.
        </div>
        <Link to="/student/borrowings" className="btn btn--secondary">
          <RefreshCw size={16} />
          View my loans
        </Link>
      </div>

      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => {
          setCancelTarget(null);
          setCancelReason('');
        }}
        title="Cancel reservation"
        size="sm"
      >
        <div className="form-stack">
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Cancel the reservation for <strong>{cancelTarget?.bookTitle}</strong>?
          </p>
          <div className="form-field">
            <label htmlFor="cancel-reason">Reason (optional)</label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Let the library know why you no longer need this book."
            />
          </div>
          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              onClick={() => {
                setCancelTarget(null);
                setCancelReason('');
              }}
            >
              Keep reservation
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelling}>
              Cancel reservation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentReservations;
