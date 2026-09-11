import { useState } from 'react';
import { BookOpen, CheckCircle, AlertCircle, MapPin, ShieldAlert, Search, Download } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { exportSheet, toFileSafe } from '../../utils/export';
import './Librarian.css';

const stats = [
  { title: 'Total Books', value: '5,240', icon: <BookOpen size={24} />, color: 'primary' },
  { title: 'Verified', value: '5,185', icon: <CheckCircle size={24} />, color: 'success' },
  { title: 'Missing', value: '12', icon: <AlertCircle size={24} />, color: 'danger' },
  { title: 'Misplaced', value: '8', icon: <MapPin size={24} />, color: 'warning' },
  { title: 'Damaged', value: '35', icon: <ShieldAlert size={24} />, color: 'danger' }
];

const inventoryItems = [
  { id: 1, book: 'Introduction to Algorithms', copyId: 'CS-001', status: 'verified', location: 'Floor 3, Rack 2' },
  { id: 2, book: 'Engineering Mathematics', copyId: 'EN-003', status: 'verified', location: 'Floor 2, Rack 1' },
  { id: 3, book: 'Principles of Anatomy', copyId: 'ME-002', status: 'misplaced', expected: 'Floor 1, Section C', actual: 'Floor 3, Section A' },
  { id: 4, book: 'Constitutional Law', copyId: 'LW-001', status: 'missing' },
  { id: 5, book: 'Organic Chemistry', copyId: 'CH-001', status: 'damaged', location: 'Floor 2, Rack 3' },
  { id: 6, book: 'Database System Concepts', copyId: 'DB-001', status: 'verified', location: 'Floor 3, Section B' },
  { id: 7, book: 'Software Engineering', copyId: 'CS-010', status: 'missing' },
  { id: 8, book: 'Business Ethics', copyId: 'BS-004', status: 'verified', location: 'Floor 4, Rack 1' }
];

const Inventory = () => {
  const showToast = useToast();
  const [search, setSearch] = useState('');

  const filteredItems = inventoryItems.filter((item) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      item.book.toLowerCase().includes(q) ||
      item.copyId.toLowerCase().includes(q) ||
      (item.status || '').toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    if (!filteredItems.length) {
      showToast('Nothing to export.', 'error');
      return;
    }
    const rows = filteredItems.map((item) => ({
      'Book': item.book,
      'Copy ID': item.copyId,
      'Status': item.status.charAt(0).toUpperCase() + item.status.slice(1),
      'Location': item.location || (item.status === 'misplaced' ? `Expected: ${item.expected} / Detected: ${item.actual}` : 'Unknown'),
    }));
    const ok = exportSheet(rows, `ABSU-Inventory-${toFileSafe(new Date().toISOString().slice(0, 10))}.xlsx`);
    if (ok) showToast('Inventory exported as XLSX.', 'success');
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Inventory</h1>
        <p>Track and verify the library's book inventory.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="Search inventory by book or copy ID..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-right">
          <Button variant="outline" onClick={handleExport}>
            <Download size={18} />
            Export
          </Button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Copy ID</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.book}</strong></td>
                  <td>{item.copyId}</td>
                  <td>
                    <span className={`badge ${
                      item.status === 'verified' ? 'badge-success' :
                      item.status === 'missing' ? 'badge-danger' :
                      item.status === 'damaged' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {item.status === 'misplaced' ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          Expected: {item.expected}
                        </div>
                        <div style={{ color: 'var(--warning)' }}>
                          Detected: {item.actual}
                        </div>
                      </div>
                    ) : item.location || <span style={{ color: 'var(--danger)' }}>Unknown</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
