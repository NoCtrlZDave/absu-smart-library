import { useState, useEffect, useMemo } from 'react';
import { Search, Clock, User, FileText } from 'lucide-react';
import { Input, Select, Pagination, Badge } from '../../components/common';
import { adminApi } from '../../services/admin';
import './Admin.css';

const actionVariant = (action) => {
  if (action === 'Add' || action === 'CREATE' || action === 'USER_CREATED') return 'success';
  if (action === 'Delete' || action === 'DELETE' || action === 'Cancel' || action === 'Suspended') return 'danger';
  if (action === 'Return' || action === 'Resolve') return 'info';
  return 'warning';
};

const roleVariant = (role) => {
  if (role === 'admin') return 'danger';
  if (role === 'librarian') return 'warning';
  return 'info';
};

const describeDetails = (details) => {
  if (details === undefined || details === null || details === '') return '-';
  if (typeof details === 'string') return details;
  if (typeof details !== 'object') return String(details);

  const parts = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);

  return parts.length ? parts.join(', ') : '-';
};

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const logsPerPage = 8;

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);

      adminApi
        .logs({
          page: currentPage,
          limit: logsPerPage,
          search: search.trim() || undefined,
          action: actionFilter === 'All Actions' ? undefined : actionFilter,
        })
        .then((data) => {
          if (!mounted) return;
          setLogs(data.items || []);
          setActions(data.actions || []);
          setPagination(data.pagination || { page: currentPage, totalPages: 1, total: 0 });
        })
        .catch((err) => {
          if (mounted) setError(err.message || 'Failed to load system logs');
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [search, actionFilter, currentPage]);

  const actionOptions = useMemo(
    () => ['All Actions', ...actions.filter((action) => action !== 'All Actions')],
    [actions]
  );

  const formatTimestamp = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>System Logs</h1>
        <p>Audit trail of all administrator and librarian actions.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="Search by user, entity, or action..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            icon={Search}
          />
          <Select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {actionOptions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="content-card">
        {loading ? (
          <div className="activity-empty" style={{ padding: '3rem 1rem' }}>
            <Clock size={28} />
            <p>Loading system activity...</p>
          </div>
        ) : error ? (
          <div className="activity-empty" style={{ padding: '3rem 1rem', color: 'var(--danger)' }}>
            <FileText size={28} />
            <p>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="activity-empty" style={{ padding: '3rem 1rem' }}>
            <FileText size={28} />
            <p>No system activity recorded yet. Changes made by staff and administrators will show up here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                        {formatTimestamp(log.createdAt)}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} style={{ color: 'var(--text-secondary)' }} />
                        {log.actorName || 'System'}
                      </span>
                    </td>
                    <td>
                      {log.role ? (
                        <Badge variant={roleVariant(log.role)}>{log.role}</Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={14} style={{ color: 'var(--text-secondary)' }} />
                        {log.entity || '-'}
                      </span>
                    </td>
                    <td>{describeDetails(log.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <Pagination
            currentPage={pagination.page || currentPage}
            totalPages={pagination.totalPages || 1}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
