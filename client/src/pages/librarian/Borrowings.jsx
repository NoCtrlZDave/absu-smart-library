import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Plus, RotateCcw, Search } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Modal, Pagination, Select } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { borrowingsApi } from '../../services/borrowings';
import { inventoryApi } from '../../services/inventory';
import { booksApi } from '../../services/books';
import { formatDate, formatDateTime, toDateInputValue } from '../../utils/dates';
import './Librarian.css';
import '../Circulation.css';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'returned', label: 'Returned' },
  { key: 'lost', label: 'Lost' },
];

const Borrowings = () => {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ active: 0, overdue: 0, returned: 0, lost: 0 });
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [issueOpen, setIssueOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [copies, setCopies] = useState([]);
  const [issueForm, setIssueForm] = useState({ matricNumber: '', bookId: '', copyId: '', dueDate: '' });
  const [issueBusy, setIssueBusy] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnForm, setReturnForm] = useState({ condition: 'good', notes: '' });
  const [returnBusy, setReturnBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      setLoading(true);
      const params = {
        search: search || undefined,
        page,
        limit: 10,
      };
      if (filter === 'overdue') params.overdue = true;
      else if (filter !== 'all') params.status = filter;

      Promise.all([borrowingsApi.list(params), borrowingsApi.stats()])
        .then(([data, statData]) => {
          if (!mounted) return;
          setItems(data?.items || []);
          setPagination(data?.pagination || null);
          setStats(statData || { active: 0, overdue: 0, returned: 0, lost: 0 });
        })
        .catch((err) => {
          if (mounted) showToast(err.message || 'Could not load loans.', 'error');
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

  const openIssue = async () => {
    setIssueOpen(true);
    setIssueForm({ matricNumber: '', bookId: '', copyId: '', dueDate: '' });
    setCopies([]);
    try {
      const data = await inventoryApi.books({ availability: 'available', limit: 500 });
      setBooks(data?.items || []);
    } catch (err) {
      showToast(err.message || 'Could not load available books.', 'error');
    }
  };

  const handleBookSelect = async (bookId) => {
    setIssueForm((prev) => ({ ...prev, bookId, copyId: '' }));
    if (!bookId) {
      setCopies([]);
      return;
    }
    try {
      const book = await booksApi.get(bookId);
      const available = (book.copies || []).filter((copy) => ['available', 'verified'].includes(copy.status));
      setCopies(available);
    } catch (err) {
      showToast(err.message || 'Could not load book copies.', 'error');
    }
  };

  const handleIssue = async () => {
    if (!issueForm.matricNumber.trim()) {
      showToast('Enter the student matriculation number.', 'error');
      return;
    }
    if (!issueForm.bookId || !issueForm.copyId) {
      showToast('Select a book and an available copy.', 'error');
      return;
    }

    setIssueBusy(true);
    try {
      const result = await borrowingsApi.issue({
        matricNumber: issueForm.matricNumber.trim(),
        bookId: issueForm.bookId,
        copyId: issueForm.copyId,
        dueDate: issueForm.dueDate || undefined,
      });
      showToast(
        result?.queued
          ? 'Offline: issue saved and will be synced when the connection returns.'
          : 'Book issued to student.',
        result?.queued ? 'warning' : 'success'
      );
      setIssueOpen(false);
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not issue book.', 'error');
    } finally {
      setIssueBusy(false);
    }
  };

  const openReturn = (loan) => {
    setReturnTarget(loan);
    setReturnForm({ condition: 'good', notes: '' });
  };

  const handleReturn = async () => {
    if (!returnTarget) return;
    setReturnBusy(true);
    try {
      const result = await borrowingsApi.returnBook(returnTarget.id, returnForm);
      showToast(
        result?.queued
          ? 'Offline: return saved and will be synced when the connection returns.'
          : 'Book return recorded.',
        result?.queued ? 'warning' : 'success'
      );
      setReturnTarget(null);
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not record return.', 'error');
    } finally {
      setReturnBusy(false);
    }
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Borrowings</h1>
        <p>Issue books, record returns, and monitor overdue loans.</p>
      </div>

      <div className="circulation-summary">
        <div className="summary-tile">
          <span>Active loans</span>
          <strong>{stats.active || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Overdue</span>
          <strong style={{ color: stats.overdue ? 'var(--danger)' : undefined }}>{stats.overdue || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Returned</span>
          <strong>{stats.returned || 0}</strong>
        </div>
      </div>

      <div className="page-tabs" role="tablist" aria-label="Borrowing filters">
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
        <div className="toolbar-right">
          <Button onClick={openIssue}>
            <Plus size={18} />
            Issue book
          </Button>
        </div>
      </div>

      <div className="content-card">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>Loading loans...</p>
        ) : !items.length ? (
          <EmptyState
            icon={BookOpen}
            title="No loans in this view"
            description="Issue a book directly or collect an approved student reservation."
            action={<Button onClick={openIssue}><Plus size={18} /> Issue book</Button>}
          />
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Book</th>
                    <th>Borrowed</th>
                    <th>Due date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((loan) => (
                    <tr key={loan.id}>
                      <td>
                        <span className="cell-title">{loan.studentName}</span>
                        <span className="cell-subtitle">{loan.matricNumber}</span>
                      </td>
                      <td>
                        <span className="cell-title">{loan.bookTitle}</span>
                        <span className="cell-subtitle">Copy {loan.copyCode}</span>
                      </td>
                      <td>{formatDate(loan.borrowedAt)}</td>
                      <td>
                        {formatDate(loan.dueDate)}
                        {loan.returnedAt && (
                          <span className="cell-subtitle">Returned {formatDateTime(loan.returnedAt)}</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={loan.isOverdue ? 'danger' : loan.status === 'active' ? 'success' : loan.status === 'lost' ? 'danger' : 'info'}>
                          {loan.isOverdue ? 'Overdue' : loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </Badge>
                        {loan.returnCondition && loan.status === 'returned' && (
                          <span className="cell-subtitle">Condition: {loan.returnCondition}</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {loan.status === 'active' ? (
                            <Button size="sm" variant="secondary" onClick={() => openReturn(loan)}>
                              <RotateCcw size={15} />
                              Return
                            </Button>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>Closed</span>
                          )}
                        </div>
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

      <Modal isOpen={issueOpen} onClose={() => setIssueOpen(false)} title="Issue a book">
        <div className="form-stack">
          <div className="inline-note">
            The student must already have an active account. Limits and duplicate-loan checks are
            applied before the copy is issued.
          </div>
          <Input
            label="Student matric number"
            placeholder="2021/131178/REGULAR"
            value={issueForm.matricNumber}
            onChange={(event) => setIssueForm((prev) => ({ ...prev, matricNumber: event.target.value }))}
            required
          />
          <Select
            label="Book"
            value={issueForm.bookId}
            onChange={(event) => handleBookSelect(event.target.value)}
          >
            <option value="">Select an available book</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} ({book.availableCopies} available)
              </option>
            ))}
          </Select>
          <Select
            label="Physical copy"
            value={issueForm.copyId}
            onChange={(event) => setIssueForm((prev) => ({ ...prev, copyId: event.target.value }))}
            disabled={!issueForm.bookId}
          >
            <option value="">Select a copy</option>
            {copies.map((copy) => (
              <option key={copy._id} value={copy._id}>
                {copy.code || copy._id} - {copy.callNumber || copy.locationString || 'No call number'}
              </option>
            ))}
          </Select>
          <Input
            label="Due date (optional)"
            type="date"
            min={toDateInputValue(new Date(new Date().setDate(new Date().getDate() + 1)))}
            value={issueForm.dueDate}
            onChange={(event) => setIssueForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            helper="Leave blank to use the configured loan period."
          />
          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>Cancel</Button>
            <Button onClick={handleIssue} loading={issueBusy}>
              <CheckCircle size={16} />
              Issue book
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(returnTarget)}
        onClose={() => setReturnTarget(null)}
        title="Record book return"
        size="sm"
      >
        <div className="form-stack">
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Return <strong>{returnTarget?.bookTitle}</strong> from{' '}
            <strong>{returnTarget?.studentName}</strong>.
          </p>
          <Select
            label="Return condition"
            value={returnForm.condition}
            onChange={(event) => setReturnForm((prev) => ({ ...prev, condition: event.target.value }))}
          >
            <option value="good">Good - return to shelf</option>
            <option value="fair">Fair - return to shelf</option>
            <option value="damaged">Damaged - mark unavailable</option>
          </Select>
          <div className="form-field">
            <label htmlFor="return-notes">Notes (optional)</label>
            <textarea
              id="return-notes"
              value={returnForm.notes}
              onChange={(event) => setReturnForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Record any damage or missing accessories."
            />
          </div>
          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setReturnTarget(null)}>Cancel</Button>
            <Button variant="success" onClick={handleReturn} loading={returnBusy}>
              <RotateCcw size={16} />
              Confirm return
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Borrowings;

