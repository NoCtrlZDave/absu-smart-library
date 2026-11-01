import { useState, useEffect } from 'react';
import { BookOpen, BookMarked, CheckCircle, AlertCircle, Clock, MapPin, ShieldAlert, Search, Download } from 'lucide-react';
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
  const [bookRows, setBookRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [statsRes, logsRes, booksRes] = await Promise.all([
          inventoryApi.stats(),
          inventoryApi.logs({ limit: 200 }),
          inventoryApi.books({ limit: 500 }),
        ]);
        if (!mounted) return;
        setStats(statsRes);
        setItems(toRows(logsRes?.items));
        setBookRows(booksRes?.items || []);
      } catch (err) {
        showToast(err.message || 'Failed to load inventory.', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [showToast]);

  const statCards = stats
    ? [
        { title: 'Total Books', value: format(stats.total_books), icon: <BookOpen size={24} />, color: 'primary' },
        { title: 'Verified', value: format(stats.verified), icon: <CheckCircle size={24} />, color: 'success' },
        { title: 'Reserved', value: format(stats.reserved), icon: <BookMarked size={24} />, color: 'info' },
        { title: 'On Loan', value: format(stats.borrowed), icon: <Clock size={24} />, color: 'warning' },
        { title: 'Pending Requests', value: format(stats.pending_reservations), icon: <BookMarked size={24} />, color: 'warning' },
        { title: 'Missing', value: format(stats.missing), icon: <AlertCircle size={24} />, color: 'danger' },
        { title: 'Misplaced', value: format(stats.misplaced), icon: <MapPin size={24} />, color: 'warning' },
        { title: 'Damaged', value: format(stats.damaged), icon: <ShieldAlert size={24} />, color: 'danger' },
      ]
    : [];

  const query = search.toLowerCase();
  const filteredItems = items.filter((item) => {
    if (!query) return true;
    return (
      item.book.toLowerCase().includes(query) ||
      item.copyId.toLowerCase().includes(query) ||
      (item.status || '').toLowerCase().includes(query)
    );
  });

  const filteredBooks = bookRows.filter((book) => {
    if (!query) return true;
    return [book.title, book.author, book.category, book.location]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const bookTotals = filteredBooks.reduce(
    (acc, book) => ({
      total: acc.total + book.totalCopies,
      available: acc.available + book.availableCopies,
      reserved: acc.reserved + book.reservedCopies,
      borrowed: acc.borrowed + book.borrowedCopies,
      pending: acc.pending + book.pendingReservations,
    }),
    { total: 0, available: 0, reserved: 0, borrowed: 0, pending: 0 }
  );

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
    if (ok) showToast('Inventory scans exported as XLSX.', 'success');
  };

  const handleExportStock = () => {
    if (!filteredBooks.length) {
      showToast('Nothing to export.', 'error');
      return;
    }
    const rows = filteredBooks.map((book) => ({
      'Book': book.title,
      'Author': book.author || '',
      'Category': book.category || '',
      'Total Copies': book.totalCopies,
      'Available': book.availableCopies,
      'Reserved': book.reservedCopies,
      'Borrowed': book.borrowedCopies,
      'Damaged': book.damagedCopies,
      'Missing': book.missingCopies,
      'Misplaced': book.misplacedCopies,
      'Pending Requests': book.pendingReservations,
      'Location': book.location || '',
    }));
    const ok = exportSheet(rows, `ABSU-Book-Inventory-${toFileSafe(new Date().toISOString().slice(0, 10))}.xlsx`);
    if (ok) showToast('Book inventory exported as XLSX.', 'success');
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
            placeholder="Search book stock or scan logs..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-right">
          <Button variant="outline" onClick={handleExportStock}>
            <Download size={18} />
            Export stock
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download size={18} />
            Export scans
          </Button>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>Book stock</h2>
            <p className="card-subtitle">
              Accurate availability per title. Reserved copies are held for approved students.
            </p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Total</th>
                <th>Available</th>
                <th>Reserved</th>
                <th>On loan</th>
                <th>Pending requests</th>
                <th>Unavailable</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading book stock...
                  </td>
                </tr>
              ) : !filteredBooks.length ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No books found.
                  </td>
                </tr>
              ) : filteredBooks.map((book) => (
                <tr key={book.id}>
                  <td>
                    <strong>{book.title}</strong>
                    <span className="cell-subtitle">
                      {[book.author, book.category, book.location].filter(Boolean).join(' • ') || 'No metadata'}
                    </span>
                  </td>
                  <td>{book.totalCopies}</td>
                  <td>
                    <span className={book.availableCopies > 0 ? 'badge badge-success' : 'badge badge-danger'}>
                      {book.availableCopies}
                    </span>
                  </td>
                  <td>{book.reservedCopies}</td>
                  <td>{book.borrowedCopies}</td>
                  <td>{book.pendingReservations}</td>
                  <td>
                    {book.unavailableCopies}
                    <span className="cell-subtitle">
                      {[
                        book.damagedCopies ? `${book.damagedCopies} damaged` : null,
                        book.missingCopies ? `${book.missingCopies} missing` : null,
                        book.misplacedCopies ? `${book.misplacedCopies} misplaced` : null,
                      ].filter(Boolean).join(', ') || 'None'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredBooks.length > 0 && (
              <tfoot>
                <tr>
                  <td><strong>{filteredBooks.length} titles</strong></td>
                  <td><strong>{bookTotals.total}</strong></td>
                  <td><strong>{bookTotals.available}</strong></td>
                  <td><strong>{bookTotals.reserved}</strong></td>
                  <td><strong>{bookTotals.borrowed}</strong></td>
                  <td><strong>{bookTotals.pending}</strong></td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>Recent inventory scans</h2>
            <p className="card-subtitle">Verification and misplaced-book activity from RFID scans.</p>
          </div>
        </div>
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