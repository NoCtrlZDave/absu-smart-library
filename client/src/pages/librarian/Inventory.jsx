import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, AlertCircle, MapPin, ShieldAlert, Search, Download } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { exportSheet, toFileSafe } from '../../utils/export';
import { inventoryApi } from '../../services/inventory';
import './Librarian.css';

const badgeFor = (status) => {
  const map = {
    verified: 'badge-success',
    found: 'badge-success',
    scan: 'badge-info',
    missing: 'badge-danger',
    misplaced: 'badge-warning',
    damaged: 'badge-warning',
  };
  return `badge ${map[status] || 'badge-info'}`;
};

const format = (n) => (n == null ? '0' : Number(n).toLocaleString());

const toRows = (logs) =>
  (logs || []).map((l) => ({
    id: l.id,
    book: l.bookTitle || 'Unknown book',
    copyId: l.copyCode || '-',
    status: l.type || l.status || 'scan',
    expected: l.expectedLocation || null,
    actual: l.detectedLocation || null,
  }));

const Inventory = () => {
  const showToast = useToast();
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          inventoryApi.stats(),
          inventoryApi.logs({ limit: 200 }),
        ]);
        if (!mounted) return;
        setStats(statsRes);
        setItems(toRows(logsRes?.items));
      } catch (err) {
        showToast(err.message || 'Failed to load inventory.', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const statCards = stats
    ? [
        { title: 'Total Books', value: format(stats.total_books), icon: <BookOpen size={24} />, color: 'primary' },
        { title: 'Verified', value: format(stats.verified), icon: <CheckCircle size={24} />, color: 'success' },
        { title: 'Missing', value: format(stats.missing), icon: <AlertCircle size={24} />, color: 'danger' },
        { title: 'Misplaced', value: format(stats.misplaced), icon: <MapPin size={24} />, color: 'warning' },
        { title: 'Damaged', value: format(stats.damaged), icon: <ShieldAlert size={24} />, color: 'danger' },
      ]
    : [];

  const filteredItems = items.filter((item) => {
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
      'Location': item.status === 'misplaced'
        ? `Expected: ${item.expected || 'Unknown'} / Detected: ${item.actual || 'Unknown'}`
        : (item.actual || item.expected || 'Unknown'),
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
        {statCards.map((stat, index) => (
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
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading inventory...
                  </td>
                </tr>
              ) : !filteredItems.length ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No inventory activity found.
                  </td>
                </tr>
              ) : filteredItems.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.book}</strong></td>
                  <td>{item.copyId}</td>
                  <td>
                    <span className={badgeFor(item.status)}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {item.status === 'misplaced' ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          Expected: {item.expected || 'Unknown'}
                        </div>
                        <div style={{ color: 'var(--warning)' }}>
                          Detected: {item.actual || 'Unknown'}
                        </div>
                      </div>
                    ) : item.actual || item.expected || <span style={{ color: 'var(--danger)' }}>Unknown</span>}
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