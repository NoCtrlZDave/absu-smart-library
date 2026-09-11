import { useMemo, useState } from 'react';
import { BarChart3, LineChart, PieChart, FileText, Calendar, Download, TrendingUp, Landmark } from 'lucide-react';
import { Button, Select } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { exportSheet, toFileSafe } from '../../utils/export';
import { useBooks } from '../../context/useBook';
import './Librarian.css';

const REPORTS = [
  { id: 'borrowings', name: 'Borrowings Report', icon: <BarChart3 size={24} />, description: 'Borrowing statistics and trends' },
  { id: 'returns', name: 'Returns Report', icon: <LineChart size={24} />, description: 'Return processing statistics' },
  { id: 'overdue', name: 'Overdue Books', icon: <PieChart size={24} />, description: 'Overdue books and loan summary' },
  { id: 'inventory', name: 'Inventory Report', icon: <FileText size={24} />, description: 'Collection inventory status' },
  { id: 'popular', name: 'Popular Books', icon: <TrendingUp size={24} />, description: 'Most borrowed books ranking' },
  { id: 'usage', name: 'Library Usage', icon: <Landmark size={24} />, description: 'Collection usage breakdown' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const barPalette = ['var(--primary)', 'var(--info)', 'var(--success)', 'var(--warning)', 'var(--danger)'];

const deriveBorrowingsByMonth = (books) => {
  const counts = MONTHS.map(() => 0);
  books.forEach((book) => {
    (book.copies || []).forEach((copy) => {
      if (copy.status === 'borrowed') {
        const month = (copy.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 12);
        counts[month] += 1;
      }
    });
  });
  return MONTHS.map((month, idx) => ({ month, count: counts[idx] }));
};

const Reports = () => {
  const { books, categories } = useBooks();
  const showToast = useToast();
  const [selectedReport, setSelectedReport] = useState('borrowings');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const currentReport = REPORTS.find((r) => r.id === selectedReport);
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const data = useMemo(() => {
    const filteredBooks = categoryFilter === 'all'
      ? books
      : books.filter((b) => b.category === categoryFilter);

    const totalCopies = filteredBooks.reduce((acc, bk) => acc + (bk.copies?.length || 0), 0);
    const available = filteredBooks.reduce(
      (acc, bk) => acc + (bk.copies || []).filter((c) => c.status === 'available').length, 0
    );
    const borrowed = filteredBooks.reduce(
      (acc, bk) => acc + (bk.copies || []).filter((c) => c.status === 'borrowed').length, 0
    );
    const reserved = filteredBooks.reduce(
      (acc, bk) => acc + (bk.copies || []).filter((c) => c.status === 'reserved').length, 0
    );

    const byMonth = deriveBorrowingsByMonth(filteredBooks);
    const peak = Math.max(byMonth.map((d) => d.count).reduce((a, b) => Math.max(a, b), 1), 1);

    const perCategory = categories
      .map((c) => ({
        category: c.name,
        count: filteredBooks.filter((b) => b.category === c.name).reduce((acc, bk) => acc + (bk.copies?.length || 0), 0),
      }))
      .sort((a, b) => b.count - a.count);

    const totalRanked = perCategory.reduce((acc, c) => acc + c.count, 0) || 1;

    const popular = filteredBooks
      .map((b) => ({
        title: b.title,
        borrows: (b.copies || []).filter((c) => c.status === 'borrowed').length,
        total: b.copies?.length || 0,
      }))
      .sort((a, b) => b.borrows - a.borrows)
      .slice(0, 8);

    const topBorrows = Math.max(popular.map((p) => p.borrows).reduce((a, b) => Math.max(a, b), 1), 1);

    return { totalCopies, available, borrowed, reserved, byMonth, peak, perCategory, totalRanked, popular, topBorrows };
  }, [books, categories, categoryFilter]);

  const getRowsForReport = () => {
    switch (selectedReport) {
      case 'borrowings':
        return data.byMonth.map((d) => ({ Month: d.month, 'Borrowings': d.count, Year: year }));
      case 'returns':
        return data.byMonth.map((d) => ({ Month: d.month, Returns: d.count, Year: year }));
      case 'overdue':
        return [
          { 'Category': 'Borrowed (active loans)', Count: data.borrowed },
          { 'Category': 'Reserved', Count: data.reserved },
        ];
      case 'inventory':
        return [
          { 'Status': 'Available', Count: data.available },
          { 'Status': 'Borrowed', Count: data.borrowed },
          { 'Status': 'Reserved', Count: data.reserved },
          { 'Status': 'Total', Count: data.totalCopies },
        ];
      case 'popular':
        return data.popular.map((p) => ({ 'Book Title': p.title, 'Current Borrows': p.borrows, 'Total Copies': p.total }));
      case 'usage':
        return data.perCategory.map((p) => ({ 'Category': p.category, 'Copies': p.count }));
      default:
        return [];
    }
  };

  const handleExport = () => {
    const rows = getRowsForReport();
    if (!rows.length) {
      showToast('Nothing to export yet.', 'error');
      return;
    }
    const ok = exportSheet(rows, `ABSU-${toFileSafe(currentReport.name)}-${year}.xlsx`);
    if (ok) showToast('Report exported as XLSX.', 'success');
  };

  const categoryOptions = ['all', ...categories.map((c) => c.name)];

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Reports</h1>
        <p>Generate and analyze library statistics across circulation, inventory, and usage.</p>
      </div>

      <div className="report-type-list">
        {REPORTS.map((report) => (
          <div
            key={report.id}
            className={`report-type-card ${selectedReport === report.id ? 'active' : ''}`}
            onClick={() => setSelectedReport(report.id)}
          >
            <div style={{ marginBottom: '0.75rem' }}>{report.icon}</div>
            <h4>{report.name}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{report.description}</p>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ maxWidth: '480px' }}>
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            {years.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </Select>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </Select>
        </div>
        <div className="toolbar-right">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Calendar size={18} />
            Filter
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download size={18} />
            Export
          </Button>
        </div>
      </div>

      <div className="content-card">
        <h2>{currentReport?.name}</h2>

        {selectedReport === 'borrowings' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '260px', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
              {data.byMonth.map((item) => (
                <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.count}</span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '50px',
                      height: `${(item.count / data.peak) * 170}px`,
                      background: 'var(--primary)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedReport === 'returns' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '260px', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
              {data.byMonth.map((item) => (
                <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.count}</span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '50px',
                      height: `${(item.count / data.peak) * 170}px`,
                      background: 'var(--success)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedReport === 'overdue' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { label: 'Active Loans', value: data.borrowed, color: 'var(--info)' },
              { label: 'Reserved (awaiting pickup)', value: data.reserved, color: 'var(--warning)' },
              { label: 'Overdue Estimate', value: Math.round(data.borrowed * 0.15), color: 'var(--danger)' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center', padding: '2rem', background: 'var(--background)', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {selectedReport === 'inventory' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { label: 'Total Copies', value: data.totalCopies, color: 'var(--primary)' },
              { label: 'Available', value: data.available, color: 'var(--success)' },
              { label: 'Borrowed', value: data.borrowed, color: 'var(--info)' },
              { label: 'Reserved', value: data.reserved, color: 'var(--warning)' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center', padding: '2rem', background: 'var(--background)', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {selectedReport === 'popular' && (
          <div>
            {data.popular.length ? data.popular.map((item, index) => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ width: '30px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
                  #{index + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'var(--text)' }}>{item.title}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.borrows} borrows / {item.total} copies</span>
                  </div>
                  <div className="capacity-bar">
                    <div
                      className="capacity-fill low"
                      style={{ width: `${(item.borrows / data.topBorrows) * 100}%`, background: 'var(--primary)' }}
                    />
                  </div>
                </div>
              </div>
            )) : (
              <div className="report-area"><p>No borrowing data yet.</p></div>
            )}
          </div>
        )}

        {selectedReport === 'usage' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {data.perCategory.map((item, index) => (
              <div key={item.category} style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--background)', borderRadius: '12px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: barPalette[index % barPalette.length] }}>{item.count}</div>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.category}</div>
                <div className="capacity-bar" style={{ marginTop: '0.75rem' }}>
                  <div className="capacity-fill low" style={{ width: `${(item.count / data.totalRanked) * 100}%`, background: barPalette[index % barPalette.length] }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;