import { useEffect, useState } from 'react';
import { CheckCircle, RefreshCw, Search, XCircle } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Modal, Pagination } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { borrowingsApi } from '../../services/borrowings';
import { formatDate, formatDateTime } from '../../utils/dates';
import './Librarian.css';
import '../Circulation.css';

const TABS = ['all', 'pending', 'approved', 'rejected'];

const Renewals = () => {
  const showToast = useToast();
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    borrowingsApi.renewals({
      status: tab === 'all' ? undefined : tab,
      search: search || undefined,
      page,
      limit: 10,
    })
      .then((data) => {
        if (!mounted) return;
        setItems(data?.items || []);
        setPagination(data?.pagination || null);
      })
      .catch((err) => {
        if (mounted) showToast(err.message || 'Could not load renewal requests.', 'error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [tab, search, page, refreshKey, showToast]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const approve = async (id) => {
    setBusy(true);
    try {
      await borrowingsApi.approveRenewal(id);
      showToast('Renewal approved.', 'success');
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not approve renewal.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setBusy(true);
    try {
      await borrowingsApi.rejectRenewal(rejectTarget, reason);
      showToast('Renewal rejected.', 'success');
      setRejectTarget(null);
      setReason('');
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not reject renewal.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Renewals</h1>
        <p>Review student renewal requests. Eligibility is checked against configured renewal policy.</p>
      </div>

      <div className="page-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            className={`page-tab${tab === item ? ' page-tab--active' : ''}`}
            onClick={() => { setTab(item); setPage(1); }}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-left toolbar-search">
          <Input
            icon={Search}
            placeholder="Search student, identifier or book..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="content-card">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading requests...</p>
        ) : items.length ? (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Student</th><th>Book</th><th>Previous due</th><th>Requested</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="cell-title">{item.userName}</span>
                        <span className="cell-subtitle">{item.identifier}</span>
                      </td>
                      <td>
                        <span className="cell-title">{item.bookTitle}</span>
                        {item.reason && <span className="cell-subtitle">Reason: {item.reason}</span>}
                      </td>
                      <td>{formatDate(item.previousDueDate)}</td>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td><Badge variant={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'danger'}>{item.status}</Badge></td>
                      <td>
                        {item.status === 'pending' ? (
                          <div className="table-actions">
                            <Button size="sm" onClick={() => approve(item.id)} loading={busy}>
                              <CheckCircle size={15} /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setRejectTarget(item.id)}>
                              <XCircle size={15} /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>{item.processedAt ? formatDate(item.processedAt) : 'Closed'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={pagination?.page || 1} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState icon={RefreshCw} title="No renewal requests" description="Student renewal requests will appear here." />
        )}
      </div>

      <Modal isOpen={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} title="Reject renewal request" size="sm">
        <div className="form-stack">
          <Input label="Reason (optional)" value={reason} onChange={(event) => setReason(event.target.value)} />
          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button onClick={reject} loading={busy}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Renewals;
