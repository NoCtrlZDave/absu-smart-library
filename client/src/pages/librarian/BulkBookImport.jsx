import { useRef, useState } from 'react';
import { AlertTriangle, Download, FileSpreadsheet, RefreshCw, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Badge, Button, EmptyState } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { booksApi } from '../../services/books';
import api from '../../services/api';
import { exportSheet, toFileSafe } from '../../utils/export';
import './Librarian.css';
import '../Circulation.css';

const STATUS_VARIANTS = { ready: 'success', created: 'success', invalid: 'danger', duplicate: 'warning', failed: 'danger' };

const BulkBookImport = () => {
  const showToast = useToast();
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState([]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFileName('');
    setRawRows([]);
    setPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const downloadTemplate = async () => {
    try {
      await api.download('/books/import/template', 'absu-book-import-template.csv');
      showToast('Book import template downloaded.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not download template.', 'error');
    }
  };

  const parseFile = async (file) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      showToast('Upload an Excel workbook (.xlsx/.xls) or CSV file.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('The file is larger than 5 MB.', 'error');
      return;
    }

    setBusy(true);
    setResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!rows.length) {
        showToast('The spreadsheet has no data rows.', 'error');
        setPreview(null);
        return;
      }
      setFileName(file.name);
      setRawRows(rows);
      const data = await booksApi.previewImport(rows);
      setPreview(data);
      showToast(`${data.summary.total} rows checked. Review before importing.`, 'success');
    } catch (err) {
      showToast(err.message || 'Could not read or validate the file.', 'error');
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const handleFiles = (files) => {
    if (files?.[0]) parseFile(files[0]);
  };

  const handleImport = async () => {
    if (!rawRows.length) return;
    setBusy(true);
    try {
      const data = await booksApi.importBooks(rawRows);
      setResult(data);
      showToast(`${data.summary.created} book${data.summary.created === 1 ? '' : 's'} imported.`, 'success');
    } catch (err) {
      showToast(err.message || 'Book import failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const downloadResult = () => {
    if (!result?.rows?.length) return;
    const rows = result.rows.map((row) => ({
      Row: row.rowNumber,
      Title: row.title,
      Authors: (row.authors || []).join(', '),
      ISBN: row.isbn,
      Category: row.category,
      Department: row.department,
      Copies: row.copies,
      Shelf: row.shelfLocation,
      Status: row.status,
      Errors: (row.errors || []).join('; '),
    }));
    if (exportSheet(rows, `ABSU-Book-Import-Result-${toFileSafe(new Date().toISOString().slice(0, 10))}.xlsx`)) {
      showToast('Import result exported.', 'success');
    }
  };

  const displayRows = result?.rows || preview?.rows || [];
  const summary = result?.summary || preview?.summary;
  const readyCount = result ? 0 : preview?.summary?.ready || 0;

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Bulk Book Import</h1>
        <p>Import catalogue records from Excel or CSV with duplicate and ISBN validation.</p>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>1. Upload book list</h2>
            <p className="card-subtitle">
              Maximum 2,000 rows. Columns include Title, Authors, ISBN, Category, Department,
              Copies, Call Number and Shelf Location.
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download size={18} /> Download template
          </Button>
        </div>

        <div className="content-card__body" style={{ padding: '1.5rem' }}>
          <div
            className={`import-dropzone${dragActive ? ' import-dropzone--active' : ''}`}
            onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              handleFiles(event.dataTransfer.files);
            }}
          >
            <div className="import-dropzone__icon"><FileSpreadsheet size={30} /></div>
            <h3>{fileName || 'Drop your spreadsheet here'}</h3>
            <p>{fileName ? `${rawRows.length} data rows loaded` : 'Excel (.xlsx, .xls) or CSV, up to 5 MB'}</p>
            <div className="import-dropzone__actions">
              <Button onClick={() => inputRef.current?.click()} loading={busy} disabled={busy}>
                <Upload size={18} /> Choose file
              </Button>
              {(fileName || result) && (
                <Button variant="outline" onClick={reset} disabled={busy}>
                  <RefreshCw size={18} /> Start over
                </Button>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(event) => handleFiles(event.target.files)}
            />
          </div>
        </div>
      </div>

      {summary && (
        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>{result ? 'Import result' : '2. Review before importing'}</h2>
              <p className="card-subtitle">
                {result
                  ? 'Successfully created catalogue records are listed below.'
                  : 'Only ready rows are created. Invalid and duplicate rows are skipped.'}
              </p>
            </div>
            <div className="table-actions">
              {result && (
                <Button variant="outline" onClick={downloadResult}>
                  <Download size={18} /> Export result
                </Button>
              )}
              {!result && (
                <Button onClick={handleImport} loading={busy} disabled={!readyCount}>
                  <Upload size={18} /> Import {readyCount} ready book{readyCount === 1 ? '' : 's'}
                </Button>
              )}
            </div>
          </div>

          <div className="import-preview">
            <div className="import-preview__summary">
              <span>{summary.total} total</span>
              <span className="text-success">{result ? summary.created : summary.ready} {result ? 'created' : 'ready'}</span>
              <span className="text-warning">{summary.duplicate} duplicate</span>
              <span className="text-danger">{summary.invalid + (summary.failed || 0)} invalid/failed</span>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Row</th><th>Title</th><th>ISBN</th><th>Category</th><th>Copies</th><th>Status</th><th>Errors</th></tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>{row.rowNumber}</td>
                    <td>
                      <span className="cell-title">{row.title || '-'}</span>
                      <span className="cell-subtitle">{(row.authors || []).join(', ') || row.department || '-'}</span>
                    </td>
                    <td>{row.isbn || '-'}</td>
                    <td>{row.category || '-'}</td>
                    <td>{row.copies || '-'}</td>
                    <td><Badge variant={STATUS_VARIANTS[row.status] || 'info'}>{row.status}</Badge></td>
                    <td>{row.errors?.length ? <span className="cell-note">{row.errors.join('; ')}</span> : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!summary && !busy && (
        <EmptyState
          icon={FileSpreadsheet}
          title="No book list loaded"
          description="Download the template, fill in the required columns, then upload it here."
        />
      )}

      {preview && (
        <div className="inline-note">
          <AlertTriangle size={16} /> Review duplicate and invalid rows before importing.
        </div>
      )}
    </div>
  );
};

export default BulkBookImport;
