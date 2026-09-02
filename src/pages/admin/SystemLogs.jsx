import { useState } from 'react';
import { Search, Clock, User, FileText } from 'lucide-react';
import { Input, Select, Pagination } from '../../components/common';
import './Admin.css';

const allLogs = [
  { id: 1, timestamp: '2026-09-02 14:32:05', user: 'john.doe@absu.edu.ng', action: 'Borrow', entity: 'Book Copy CS-003', description: 'Borrowed "Introduction to Algorithms"' },
  { id: 2, timestamp: '2026-09-02 14:28:11', user: 'admin@absu.edu.ng', action: 'Add', entity: 'Book', description: 'Added new book "Data Structures"' },
  { id: 3, timestamp: '2026-09-02 13:45:22', user: 'sarah.johnson@absu.edu.ng', action: 'Reserve', entity: 'Book', description: 'Reserved "Database System Concepts"' },
  { id: 4, timestamp: '2026-09-02 13:12:48', user: 'system', action: 'Update', entity: 'Shelf', description: 'Updated shelf capacity for Rack 2' },
  { id: 5, timestamp: '2026-09-02 12:50:03', user: 'michael.brown@absu.edu.ng', action: 'Return', entity: 'Book Copy EN-002', description: 'Returned "Engineering Mathematics"' },
  { id: 6, timestamp: '2026-09-02 12:15:37', user: 'library.admin', action: 'Login', entity: 'System', description: 'User logged in successfully' },
  { id: 7, timestamp: '2026-09-02 11:30:01', user: 'jane.okoro@absu.edu.ng', action: 'Report', entity: 'System', description: 'Generated borrowings report' },
  { id: 8, timestamp: '2026-09-02 10:45:19', user: 'system', action: 'Update', entity: 'Book', description: 'Updated book audit records' }
];

const actions = ['All Actions', 'Borrow', 'Return', 'Reserve', 'Add', 'Update', 'Login', 'Report'];

const SystemLogs = () => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;

  const filteredLogs = allLogs.filter(log => {
    const matchesSearch = search === '' ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'All Actions' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>System Logs</h1>
        <p>Audit trail of all system activities.</p>
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
            {actions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
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
                      {log.timestamp}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={14} style={{ color: 'var(--text-secondary)' }} />
                      {log.user}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      log.action === 'Login' || log.action === 'Add' ? 'badge-info' :
                      log.action === 'Borrow' || log.action === 'Return' ? 'badge-success' :
                      log.action === 'Reserve' ? 'badge-warning' : 'badge-primary'
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
