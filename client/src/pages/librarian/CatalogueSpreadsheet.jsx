import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  SortAsc,
  SortDesc,
  Printer,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button, Select, Spinner } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { inventoryApi } from '../../services/inventory';
import './Librarian.css';

const CATALOGUE_HEADERS = [
  { key: 'sn', label: 'S/N', width: 60 },
  { key: 'author', label: 'Author', width: 200 },
  { key: 'title', label: 'Title', width: 250 },
  { key: 'subject', label: 'Subject', width: 150 },
  { key: 'isbn', label: 'ISBN', width: 130 },
  { key: 'remarks', label: 'Remarks', width: 300 },
];

const CatalogueSpreadsheet = () => {
  const showToast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [sortKey, setSortKey] = useState('sn');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        category: departmentFilter !== 'all' ? departmentFilter : undefined,
        page,
        limit: pageSize,
      };
      const result = await inventoryApi.books(params);
      setData(result);

      const depts = new Set();
      if (result.items) {
        result.items.forEach((item) => {
          if (item.category) depts.add(item.category);
        });
      }
      setDepartments([...depts].sort());
    } catch (err) {
      showToast(err.message || 'Could not load catalogue data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter, page, pageSize, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortData = (items) => {
    return [...items].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const sortedItems = data ? sortData(data.items || []) : [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);
  const paginatedItems = sortedItems.slice((page - 1) * pageSize, page * pageSize);

  const handleExportExcel = () => {
    if (!data?.items) return;
    const wsData = [CATALOGUE_HEADERS.map((h) => h.label)];
    paginatedItems.forEach((item, index) => {
      wsData.push([
        (page - 1) * pageSize + index + 1,
        item.author || '-',
        item.title || '-',
        item.subject || '-',
        item.isbn || '-',
        item.remarks || item.unavailableCopies > 0 ? `${item.unavailableCopies} unavailable` : 'Available',
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Catalogue');
    XLSX.writeFile(wb, 'absu-catalogue-spreadsheet.xlsx');
    showToast('Catalogue exported to Excel.', 'success');
  };

  const handleExportCSV = () => {
    if (!data?.items) return;
    const lines = [CATALOGUE_HEADERS.map((h) => `"${h.label}"`).join(',')];
    paginatedItems.forEach((item, index) => {
      const row = [
        (page - 1) * pageSize + index + 1,
        `"${(item.author || '-').replace(/"/g, '""')}"`,
        `"${(item.title || '-').replace(/"/g, '""')}"`,
        `"${(item.subject || '-').replace(/"/g, '""')}"`,
        `"${item.isbn || '-'.replace(/"/g, '""')}"`,
        `"${(item.remarks || '').replace(/"/g, '""')}"`,
      ];
      lines.push(row.join(','));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'absu-catalogue-spreadsheet.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Catalogue exported to CSV.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Catalogue Spreadsheet</h1>
          <p>Full institutional library catalogue in spreadsheet format.</p>
        </div>
        <div className="header-actions">
          <Button onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <FileText size={16} /> Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer size={16} /> Print
          </Button>
        </div>
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div className="search-filter">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by title, author, ISBN, subject..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div className="sort-controls">
            <Button
              variant="outline"
              size="small"
              onClick={() => setSortDirection('asc')}
              active={sortDirection === 'asc'}
            >
              <SortAsc size={16} /> A-Z
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => setSortDirection('desc')}
              active={sortDirection === 'desc'}
            >
              <SortDesc size={16} /> Z-A
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner />
          </div>
        ) : data && data.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <FileSpreadsheet size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No catalogue records found.</p>
          </div>
        ) : (
          <div className="spreadsheet-container">
            <table className="spreadsheet-table">
              <thead>
                <tr>
                  {CATALOGUE_HEADERS.map((h) => (
                    <th
                      key={h.key}
                      style={{ width: h.width }}
                      onClick={() => {
                        if (sortKey === h.key) {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortKey(h.key);
                          setSortDirection('asc');
                        }
                      }}
                      className={`sortable ${sortKey === h.key ? `sorted-${sortDirection}` : ''}`}
                    >
                      {h.label}
                      {sortKey === h.key && (
                        sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>{item.author || '-'}</td>
                    <td>{item.title || '-'}</td>
                    <td>{item.subject || '-'}</td>
                    <td>{item.isbn || '-'}</td>
                    <td>
                      {item.remarks ||
                        (item.unavailableCopies > 0
                          ? `${item.unavailableCopies} unavailable`
                          : 'Available')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <span>
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, data.total)} of {data.total} records
              </span>
              <div className="pagination-controls">
                <Button
                  variant="outline"
                  size="small"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} /> Prev
                </Button>
                <span>Page {page} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="small"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogueSpreadsheet;
