import { useState, useMemo } from 'react';
import { Search, Clock, User, FileText, ShieldAlert } from 'lucide-react';
import { Input, Select, Pagination, Badge, Button } from '../../components/common';
import { useAudit } from '../../context/useAudit';
import './Admin.css';

const SystemLogs = () => {
  const { activities, clearActivities } = useAudit();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 8;

  const actionOptions = useMemo(() => {
    const set = new Set(activities.map(a => a.action).filter(Boolean));
    return ['All Actions', ...Array.from(set).sort()];
  }, [activities]);

  const filteredLogs = activities.filter(log => {
    const actor = log.actorName || 'System';
    const matchesSearch = search === '' ||
      actor.toLowerCase().includes(search.toLowerCase()) ||
      (log.actorEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'All Actions' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const formatTimestamp = (iso) =>
    new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
  const startIndex = (currentPage - 1) * logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>System Logs</h1>
        <p>Audit trail of all administrator and librarian actions.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="Search by user, entity, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
          <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            {actionOptions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </Select>
        </div>
        {activities.length > 0 && (
          <div className="toolbar-right">
            <Button variant="outline" onClick={() => {
              clearActivities();
              setCurrentPage(1);
            }}>
              <ShieldAlert size={16} />
              Clear Logs
            </Button>
          </div>
        )}
      </div>

      <div className="content-card">
        {currentLogs.length === 0 ? (
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
                {currentLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} style={{ color: 'var(--text-secondary)' }} />
                        {log.actorName || 'System'}
                      </span>
                    </td>
                    <td>
                      {log.actorRole ? (
                        <Badge variant={log.actorRole === 'admin' ? 'danger' : 'info'}>{log.actorRole}</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        log.action === 'Add' ? 'badge-success' :
                        log.action === 'Delete' || log.action === 'Cancel' || log.action === 'Suspended' ? 'badge-danger' :
                        log.action === 'Return' || log.action === 'Resolve' ? 'badge-info' :
                        'badge-warning'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={14} style={{ color: 'var(--text-secondary)' }} />
                        {log.entity}
                      </span>
                    </td>
                    <td>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default SystemLogs;