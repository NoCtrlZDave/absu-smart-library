import { useState, useEffect } from 'react';
import { BarChart3, MapPin, AlertCircle, FileText, Download, Building2 } from 'lucide-react';
import { Button, Select } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { exportSheet, toFileSafe } from '../../utils/export';
import { useBooks } from '../../context/useBook';
import { reportsApi } from '../../services/reports';
import api from '../../services/api';
import './Librarian.css';

const REPORTS = [
  { id: 'inventory', name: 'Inventory Summary', icon: <FileText size={24} />, description: 'Collection inventory status overview' },
  { id: 'category', name: 'Books by Category', icon: <BarChart3 size={24} />, description: 'Distribution of books across categories' },
  { id: 'location', name: 'By Location', icon: <MapPin size={24} />, description: 'Copies count across library locations' },
  { id: 'missing', name: 'Missing Books', icon: <AlertCircle size={24} />, description: 'Copies reported missing from the library' },
  { id: 'departmental', name: 'Departmental / NUC', icon: <Building2 size={24} />, description: 'NUC-style departmental holdings and consolidated report' },
];

const Reports = () => {
  const showToast = useToast();
  const { categories } = useBooks();
  const [selectedReport, setSelectedReport] = useState('inventory');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [byLocation, setByLocation] = useState([]);
  const [missing, setMissing] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('all');
  const [departmental, setDepartmental] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentReport = REPORTS.find((r) => r.id === selectedReport);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [sum, cat, loc, mis, depts] = await Promise.all([
          reportsApi.summary(),
          reportsApi.byCategory(),
          reportsApi.byLocation(),
          reportsApi.missing(),
          reportsApi.departments().catch(() => []),
        ]);
        if (mounted) {
          setSummary(sum);
          setByCategory(cat || []);
          setByLocation(loc || []);
          setMissing(mis || []);
          setDepartments(depts || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (selectedReport !== 'departmental') return;
    let mounted = true;
    setLoading(true);
    const request = department === 'all'
      ? reportsApi.departmentalConsolidated()
      : reportsApi.departmental({ department }).then((report) => ({ departments: [report] }));

    request
      .then((data) => { if (mounted) setDepartmental(data); })
      .catch((err) => showToast(err.message || 'Could not load departmental report.', 'error'))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [selectedReport, department, showToast]);

  const categoryOptions = ['all', ...categories.map((c) => c.name)];

  const filteredByCategory = categoryFilter === 'all'
    ? byCategory
    : byCategory.filter((c) => c.category === categoryFilter);

  const getExportRows = () => {
    switch (selectedReport) {
      case 'inventory':
        return summary ? [
          { 'Status': 'Total Books', Count: summary.total_books },
          { 'Status': 'Total Copies', Count: summary.total_copies },
          { 'Status': 'Available', Count: summary.available },
          { 'Status': 'Missing', Count: summary.missing },
          { 'Status': 'Misplaced', Count: summary.misplaced },
          { 'Status': 'Damaged', Count: summary.damaged },
        ] : [];
      case 'category':
        return filteredByCategory.map((c) => ({ Category: c.category, Books: c.books }));
      case 'location':
        return byLocation.map((l) => ({ Location: l.location, Copies: l.count }));
      case 'missing':
        return missing.map((m) => ({ Book: m.book, 'Copy Code': m.copy, Location: m.location || 'Unknown' }));
      case 'departmental':
        return (departmental?.departments || []).flatMap((entry) =>
          (entry.rows || []).map((row) => ({
            Department: entry.department,
            Author: row.author,
            Title: row.title,
            Subject: row.subject,
            ISBN: row.isbn,
            Publisher: row.publisher,
            Year: row.publicationYear,
            Copies: row.numberOfCopies,
            Available: row.availableCopies,
            'Call Number': row.classificationNumber,
            'Accession Numbers': row.accessionNumbers,
            Remarks: row.remarks,
          }))
        );
      default:
        return [];
    }
  };

  const handleExport = async () => {
    if (selectedReport === 'departmental') {
      if (department === 'all') {
        const rows = getExportRows();
        if (!rows.length) return showToast('Nothing to export.', 'error');
        const ok = exportSheet(rows, `ABSU-Consolidated-Departmental-Report-${toFileSafe(new Date().toISOString().slice(0, 10))}.xlsx`);
        if (ok) showToast('Consolidated report exported as XLSX.', 'success');
        return;
      }
      try {
        await api.download(
          reportsApi.departmentalExportUrl({ department }),
          `ABSU-Departmental-Report-${toFileSafe(department)}.csv`
        );
        showToast('Departmental report exported as CSV.', 'success');
      } catch (err) {
        showToast(err.message || 'Export failed.', 'error');
      }
      return;
    }

    const rows = getExportRows();
    if (!rows.length) return showToast('Nothing to export.', 'error');
    const ok = exportSheet(rows, `ABSU-${toFileSafe(currentReport.name)}.xlsx`);
    if (ok) showToast('Report exported as XLSX.', 'success');
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Reports</h1>
        <p>Inventory statistics and collection overview.</p>
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
          {selectedReport === 'category' && (
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
              ))}
            </Select>
          )}
          {selectedReport === 'departmental' && (
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="all">All Departments (consolidated)</option>
              {departments.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          )}
        </div>
        <div className="toolbar-right">
          <Button variant="outline" onClick={handleExport}>
            <Download size={18} />
            Export
          </Button>
        </div>
      </div>

      <div className="content-card">
        <h2>{currentReport?.name}</h2>
        {loading ? (
          <p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</p>
        ) : selectedReport === 'inventory' && summary ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { label: 'Total Books', value: summary.total_books, color: 'var(--primary)' },
              { label: 'Total Copies', value: summary.total_copies, color: 'var(--info)' },
              { label: 'Available', value: summary.available, color: 'var(--success)' },
              { label: 'Missing', value: summary.missing, color: 'var(--danger)' },
              { label: 'Misplaced', value: summary.misplaced, color: 'var(--warning)' },
              { label: 'Damaged', value: summary.damaged, color: 'var(--danger)' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center', padding: '2rem', background: 'var(--background)', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.label}</div>
              </div>
            ))}
          </div>
        ) : selectedReport === 'category' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {filteredByCategory.map((item) => (
              <div key={item.category} style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--background)', borderRadius: '12px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>{item.books}</div>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.category}</div>
              </div>
            ))}
          </div>
        ) : selectedReport === 'location' ? (
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Location</th><th>Copies</th></tr></thead>
              <tbody>
                {byLocation.map((l) => (
                  <tr key={l.location}><td>{l.location}</td><td>{l.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedReport === 'missing' ? (
          <div className="table-container">
            {missing.length === 0 ? (
              <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No missing books reported.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Book</th><th>Copy Code</th><th>Location</th></tr></thead>
                <tbody>
                  {missing.map((m, i) => (
                    <tr key={i}><td>{m.book}</td><td>{m.copy}</td><td>{m.location || 'Unknown'}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : selectedReport === 'departmental' ? (
          <div>
            {departmental?.totals && (
              <div className="circulation-summary" style={{ marginBottom: '1.5rem' }}>
                <div className="summary-tile"><span>Titles</span><strong>{departmental.totals.titles}</strong></div>
                <div className="summary-tile"><span>Copies</span><strong>{departmental.totals.copies}</strong></div>
                <div className="summary-tile"><span>Available</span><strong>{departmental.totals.availableCopies}</strong></div>
              </div>
            )}
            {(departmental?.departments || []).map((entry) => (
              <div key={entry.department} style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{entry.department}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 0 }}>
                  {entry.totals?.titles || 0} titles · {entry.totals?.copies || 0} copies · {entry.totals?.availableCopies || 0} available
                </p>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr><th>S/N</th><th>Author</th><th>Title</th><th>ISBN</th><th>Copies</th><th>Available</th><th>Call No.</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {(entry.rows || []).map((row) => (
                        <tr key={`${entry.department}-${row.sn}`}>
                          <td>{row.sn}</td>
                          <td>{row.author}</td>
                          <td>{row.title}</td>
                          <td>{row.isbn || '-'}</td>
                          <td>{row.numberOfCopies}</td>
                          <td>{row.availableCopies}</td>
                          <td>{row.classificationNumber || '-'}</td>
                          <td><span className="cell-note">{row.remarks}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Reports;