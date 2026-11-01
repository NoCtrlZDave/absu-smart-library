import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Search } from 'lucide-react';
import { Badge, EmptyState, Pagination } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { borrowingsApi } from '../../services/borrowings';
import { formatDate } from '../../utils/dates';
import '../admin/Admin.css';
import '../Circulation.css';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'returned', label: 'Returned' },
  { key: 'lost', label: 'Lost' },
];

const StudentBorrowings = () => {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ active: 0, overdue: 0 });
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    borrowingsApi.my({ status: filter === 'all' ? undefined : filter, page, limit: 10 })
      .then((data) => {
        if (!mounted) return;
        setItems(data?.items || []);
        setStats(data?.stats || { active: 0, overdue: 0 });
        setPagination(data?.pagination || null);
      })
      .catch((err) => {
        if (mounted) showToast(err.message || 'Could not load loans.', 'error');
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

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>My Borrowed Books</h1>
        <p>View current loans, due dates, and your borrowing history.</p>
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
          <span>Total records</span>
          <strong>{pagination?.total ?? items.length}</strong>
        </div>
      </div>

      <div className="page-tabs" role="tablist" aria-label="Borrowing status filters">
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

      <div className="content-card">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>Loading loans...</p>
        ) : !items.length ? (
          <EmptyState
            icon={BookOpen}
            title="No loans in this view"
            description="Books issued to you will appear here with their due dates."
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
                    <th>Borrowed</th>
                    <th>Due date</th>
                    <th>Returned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((loan) => (
                    <tr key={loan.id}>
                      <td>
                        <Link to={`/books/${loan.book}`} className="cell-title">{loan.bookTitle}</Link>
                        <span className="cell-subtitle">Copy {loan.copyCode}</span>
                      </td>
                      <td>{loan.copyCode}</td>
                      <td>{formatDate(loan.borrowedAt)}</td>
                      <td>
                        {formatDate(loan.dueDate)}
                        {loan.isOverdue && (
                          <span className="cell-note">
                            <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                            Overdue
                          </span>
                        )}
                      </td>
                      <td>{loan.returnedAt ? formatDate(loan.returnedAt) : '-'}</td>
                      <td>
                        <Badge variant={loan.isOverdue ? 'danger' : loan.status === 'active' ? 'success' : loan.status === 'lost' ? 'danger' : 'info'}>
                          {loan.isOverdue ? 'Overdue' : loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </Badge>
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
    </div>
  );
};

export default StudentBorrowings;
