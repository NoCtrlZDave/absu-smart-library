import { useEffect, useState } from 'react';
import { CheckCircle, Eye, Search, XCircle } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Modal, Pagination } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { reservationsApi } from '../../services/reservations';
import { formatDate, formatDateTime, toDateInputValue } from '../../utils/dates';
import './Librarian.css';
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

const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const Reservations = () => {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [reason, setReason] = useState('');
  const [collectTarget, setCollectTarget] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [modalBusy, setModalBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      setLoading(true);
      reservationsApi.list({
        status: filter === 'all' ? undefined : filter,
        search: search || undefined,
        page,
        limit: 10,
      })
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
    }, search ? 300 : 0);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [filter, search, page, refreshKey, showToast]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const changeFilter = (key) => {
    setFilter(key);
    setPage(1);
  };

  const handleApprove = async (reservation) => {
    setActionId(reservation.id);
    try {
      await reservationsApi.approve(reservation.id);
      showToast(`Reservation approved for ${reservation.studentName}.`, 'success');
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not approve reservation.', 'error');
    } finally {
      setActionId(null);
    }
  };

  const openReasonModal = (type, reservation) => {
    setActionModal({ type, reservation });
    setReason('');
  };

  const submitReasonAction = async () => {
    if (!actionModal) return;
    setModalBusy(true);
    try {
      if (actionModal.type === 'reject') {
        await reservationsApi.reject(actionModal.reservation.id, reason);
        showToast('Reservation rejected.', 'success');
      } else {
        await reservationsApi.cancel(actionModal.reservation.id, reason);
        showToast('Reservation cancelled and copy released.', 'success');
      }
      setActionModal(null);
      setReason('');
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not update reservation.', 'error');
    } finally {
      setModalBusy(false);
    }
  };

  const openCollect = (reservation) => {
    setCollectTarget(reservation);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);
    setDueDate(toDateInputValue(deadline));
  };

  const handleCollect = async () => {
    if (!collectTarget) return;
    setModalBusy(true);
    try {
      const result = await reservationsApi.collect(collectTarget.id, dueDate || undefined);
      showToast(
        result?.queued
          ? 'Offline: collection saved and will be synced when the connection returns.'
          : 'Book issued to student and reservation marked collected.',
        result?.queued ? 'warning' : 'success'
      );
      setCollectTarget(null);
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not issue this reservation.', 'error');
    } finally {
      setModalBusy(false);
    }
  };

  const actionsFor = (reservation) => {
    if (reservation.status === 'pending') {
      return (
        <>
          <Button
            size="sm"
            variant="success"
            onClick={() => handleApprove(reservation)}
            loading={actionId === reservation.id}
          >
            <CheckCircle size={15} />
            Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => openReasonModal('reject', reservation)}>
            <XCircle size={15} />
            Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(reservation)}>
            <Eye size={15} />
            Details
          </Button>
        </>
      );
    }

    if (reservation.status === 'approved') {
      return (
        <>
          <Button size="sm" variant="primary" onClick={() => openCollect(reservation)}>
            <CheckCircle size={15} />
            Collect
          </Button>
          <Button size="sm" variant="danger" onClick={() => openReasonModal('cancel', reservation)}>
            <XCircle size={15} />
            Cancel
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(reservation)}>
            <Eye size={15} />
            Details
          </Button>
        </>
      );
    }

    if (reservation.status === 'rejected') {
      return (
        <Button size="sm" variant="ghost" onClick={() => setSelected(reservation)}>
          <Eye size={15} />
          Details
        </Button>
      );
    }

    if (reservation.status === 'expired') {
      return (
        <Button size="sm" variant="ghost" onClick={() => setSelected(reservation)}>
          <Eye size={15} />
          Details
        </Button>
      );
    }

    if (reservation.status === 'cancelled') {
      return (
        <Button size="sm" variant="ghost" onClick={() => setSelected(reservation)}>
          <Eye size={15} />
          Details
        </Button>
      );
    }

    if (reservation.status === 'fulfilled') {
      return (
        <Button size="sm" variant="ghost" onClick={() => setSelected(reservation)}>
          <Eye size={15} />
          Details
        </Button>
      );
    }

    return (
      <Button size="sm" variant="ghost" onClick={() => setSelected(reservation)}>
        <Eye size={15} />
        Details
      </Button>
    );
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Reservations</h1>
        <p>Review requests, assign copies, and track collection deadlines.</p>
      </div>

      <div className="circulation-summary">
        <div className="summary-tile">
          <span>Pending review</span>
          <strong>{counts.pending || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Awaiting collection</span>
          <strong>{counts.approved || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Collected today</span>
          <strong>{items.filter((item) => item.status === 'fulfilled').length}</strong>
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

      <div className="page-tabs" role="tablist" aria-label="Reservation filters">
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

      <div className="toolbar">
        <div className="toolbar-left toolbar-search">
          <Input
            placeholder="Search by student, matric number, book, or copy code..."
            icon={Search}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="content-card">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>Loading reservations...</p>
        ) : !items.length ? (
          <EmptyState
            icon={Search}
            title="No reservations in this view"
            description="Student reservation requests will appear here for approval."
          />
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Matric</th>
                    <th>Book</th>
                    <th>Copy / deadline</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        <span className="cell-title">{reservation.studentName}</span>
                        <span className="cell-subtitle">{reservation.matricNumber}</span>
                      </td>
                      <td>
                        <span className="cell-title">{reservation.bookTitle}</span>
                        <span className="cell-subtitle">{reservation.bookAuthor || 'Author not recorded'}</span>
                      </td>
                      <td>
                        <span className="cell-title">{reservation.copyCode || 'Not assigned'}</span>
                        <span className="cell-subtitle">
                          {reservation.expiresAt ? `Collect by ${formatDate(reservation.expiresAt)}` : 'No deadline set'}
                        </span>
                      </td>
                      <td>{formatDateTime(reservation.reservedAt)}</td>
                      <td>
                        <Badge variant={STATUS_VARIANTS[reservation.status] || 'info'}>
                          {reservation.isExpired ? 'Expired' : titleCase(reservation.status)}
                        </Badge>
                        {reservation.rejectionReason && (
                          <span className="cell-note">{reservation.rejectionReason}</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">{actionsFor(reservation)}</div>
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

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Reservation details">
        {selected && (
          <dl className="detail-list">
            <div><dt>Student</dt><dd>{selected.studentName}</dd></div>
            <div><dt>Matric number</dt><dd>{selected.matricNumber}</dd></div>
            <div><dt>Department</dt><dd>{selected.department || '-'}</dd></div>
            <div><dt>Book</dt><dd>{selected.bookTitle}</dd></div>
            <div><dt>Author</dt><dd>{selected.bookAuthor || '-'}</dd></div>
            <div><dt>Status</dt><dd>{titleCase(selected.status)}</dd></div>
            <div><dt>Copy</dt><dd>{selected.copyCode || 'Not assigned'}</dd></div>
            <div><dt>Requested</dt><dd>{formatDateTime(selected.reservedAt)}</dd></div>
            <div><dt>Collection deadline</dt><dd>{selected.expiresAt ? formatDateTime(selected.expiresAt) : '-'}</dd></div>
            <div><dt>Processed</dt><dd>{selected.processedAt ? formatDateTime(selected.processedAt) : '-'}</dd></div>
            <div><dt>Rejection reason</dt><dd>{selected.rejectionReason || '-'}</dd></div>
            <div><dt>Cancellation reason</dt><dd>{selected.cancelReason || '-'}</dd></div>
            <div><dt>Notes</dt><dd>{selected.notes || '-'}</dd></div>
          </dl>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        title={actionModal?.type === 'reject' ? 'Reject reservation' : 'Cancel approved reservation'}
        size="sm"
      >
        <div className="form-stack">
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {actionModal?.type === 'reject'
              ? `Reject the request from ${actionModal?.reservation?.studentName} for "${actionModal?.reservation?.bookTitle}"?`
              : `Cancel the approved reservation for "${actionModal?.reservation?.bookTitle}" and release its copy?`}
          </p>
          <div className="form-field">
            <label htmlFor="reservation-reason">Reason (optional)</label>
            <textarea
              id="reservation-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="This reason is shown to the student."
            />
          </div>
          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setActionModal(null)}>Back</Button>
            <Button variant="danger" onClick={submitReasonAction} loading={modalBusy}>
              {actionModal?.type === 'reject' ? 'Reject reservation' : 'Cancel reservation'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(collectTarget)}
        onClose={() => setCollectTarget(null)}
        title="Collect reservation"
        size="sm"
      >
        <div className="form-stack">
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Issue <strong>{collectTarget?.bookTitle}</strong> ({collectTarget?.copyCode}) to{' '}
            <strong>{collectTarget?.studentName}</strong>.
          </p>
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            helper="Leave a date or use the configured loan period."
          />
          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setCollectTarget(null)}>Cancel</Button>
            <Button variant="success" onClick={handleCollect} loading={modalBusy}>
              <CheckCircle size={16} />
              Issue book
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reservations;