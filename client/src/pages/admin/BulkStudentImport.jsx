import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  KeyRound,
  RefreshCw,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Badge, Button, EmptyState } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { adminApi } from '../../services/admin';
import { exportSheet, toFileSafe } from '../../utils/export';
import './Admin.css';
import '../Circulation.css';

const TEMPLATE_ROW = {
  'Matriculation Number': '2021/131178/REGULAR',
  'First Name': 'Ada',
  'Last Name': 'Okafor',
  'Email': 'ada.okafor@example.com',
  'Department': 'Computer Science',
  'Faculty': 'Physical Sciences',
  'Programme': 'B.Sc. Computer Science',
  'Level': '400',
  'Phone': '08030000000',
};

const STATUS_VARIANTS = {
  ready: 'success',
  created: 'success',
  invalid: 'danger',
  duplicate: 'warning',
  failed: 'danger',
};

const BulkStudentImport = ({ embedded = false }) => {
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

  const downloadTemplate = () => {
    const rows = [TEMPLATE_ROW, { ...TEMPLATE_ROW, 'Matriculation Number': '', 'Email': '' }];
    const ok = exportSheet(rows, 'ABSU-Student-Import-Template.xlsx', 'Students');
    if (ok) showToast('Student import template downloaded.', 'success');
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
      const data = await adminApi.previewStudentImport(rows);
      setPreview(data);
      showToast(`${data.summary.total} rows checked. Review the preview before importing.`, 'success');
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

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleImport = async () => {
    if (!rawRows.length) return;
    setBusy(true);
    try {
      const data = await adminApi.importStudents(rawRows);
      setResult(data);
      showToast(
        `${data.summary.created} student${data.summary.created === 1 ? '' : 's'} created. Download activation links to distribute them.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Student import failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const createdRows = result?.rows?.filter((row) => row.status === 'created') || [];
  const defaultPassword = result?.temporaryPassword || 'student123';

  const downloadCredentials = () => {
    if (!createdRows.length) return;
    const rows = createdRows.map((row) => ({
      'Name': `${row.first_name} ${row.last_name}`.trim(),
      'Matriculation Number': row.matricNumber,
      'Email': row.email,
      'Department': row.department,
      'Level': row.level,
      'Temporary Password': row.temporaryPassword || defaultPassword,
    }));
    const ok = exportSheet(rows, `ABSU-Student-Credentials-${toFileSafe(new Date().toISOString().slice(0, 10))}.xlsx`);
    if (ok) showToast('Student credentials exported.', 'success');
  };

  const downloadResult = () => {
    if (!result?.rows?.length) return;
    const rows = result.rows.map((row) => ({
      'Row': row.rowNumber,
      'First Name': row.first_name,
      'Last Name': row.last_name,
      'Matriculation Number': row.matricNumber,
      'Email': row.email,
      'Department': row.department,
      'Faculty': row.faculty,
      'Programme': row.programme,
      'Level': row.level,
      'Phone': row.phone,
      'Status': row.status,
      'Errors': (row.errors || []).join('; '),
    }));
    const ok = exportSheet(rows, `ABSU-Student-Import-Result-${toFileSafe(new Date().toISOString().slice(0, 10))}.xlsx`);
    if (ok) showToast('Import result exported.', 'success');
  };

  const copyCredentials = async (row) => {
    const text = `Matriculation Number: ${row.matricNumber}\nTemporary Password: ${row.temporaryPassword || defaultPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Login details copied.', 'success');
    } catch {
      showToast('Could not copy automatically. Select and copy the details manually.', 'error');
    }
  };

  const displayRows = result?.rows || preview?.rows || [];
  const summary = result?.summary || preview?.summary;
  const readyCount = result ? 0 : preview?.summary?.ready || 0;

  const body = (
    <>
      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>1. Upload student list</h2>
            <p className="card-subtitle">
              Maximum 1,000 rows. Required columns: matriculation number, first name, last name,
              and email. Levels are calculated automatically from each matric number and the
              current academic session. New students can sign in with their matric number and the
              temporary password shown after import.
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download size={18} />
            Download template
          </Button>
        </div>

        <div className="content-card__body" style={{ padding: '1.5rem' }}>
          <div
            className={`import-dropzone${dragActive ? ' import-dropzone--active' : ''}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="import-dropzone__icon">
              <FileSpreadsheet size={30} />
            </div>
            <h3>{fileName || 'Drop your spreadsheet here'}</h3>
            <p>
              {fileName
                ? `${rawRows.length} data row${rawRows.length === 1 ? '' : 's'} loaded`
                : 'Excel (.xlsx, .xls) or CSV, up to 5 MB'}
            </p>
            <div className="import-dropzone__actions">
              <Button onClick={() => inputRef.current?.click()} loading={busy} disabled={busy}>
                <Upload size={18} />
                Choose file
              </Button>
              {(fileName || result) && (
                <Button variant="outline" onClick={reset} disabled={busy}>
                  <RefreshCw size={18} />
                  Start over
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
                  ? 'Accounts were created successfully. Share each student\'s matric number and temporary password.'
                  : 'Only rows marked ready will be created. Invalid and duplicate rows are skipped.'}
              </p>
            </div>
            <div className="table-actions">
              {result && (
                <Button variant="outline" onClick={downloadResult}>
                  <Download size={18} />
                  Export result
                </Button>
              )}
              {createdRows.length > 0 && (
                <Button variant="success" onClick={downloadCredentials}>
                  <Download size={18} />
                  Download credentials ({createdRows.length})
                </Button>
              )}
              {!result && (
                <Button onClick={handleImport} loading={busy} disabled={!readyCount}>
                  <Upload size={18} />
                  Import {readyCount} ready student{readyCount === 1 ? '' : 's'}
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
                <tr>
                  <th>Row</th>
                  <th>Student</th>
                  <th>Matric number</th>
                  <th>Email</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Errors / credentials</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.matricNumber}`}>
                    <td>{row.rowNumber}</td>
                    <td>
                      <span className="cell-title">{`${row.first_name || ''} ${row.last_name || ''}`.trim() || '-'}</span>
                      <span className="cell-subtitle">{row.department || row.faculty || 'No department'}</span>
                    </td>
                    <td>{row.matricNumber || '-'}</td>
                    <td>{row.email || '-'}</td>
                    <td>{row.level || '-'}</td>
                    <td>
                      <Badge variant={STATUS_VARIANTS[row.status] || 'info'}>
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      {row.errors?.length ? (
                        <span className="cell-note">{row.errors.join('; ')}</span>
                      ) : row.status === 'created' ? (
                        <div className="table-actions">
                          <span className="cell-note">
                            <KeyRound size={14} /> {row.temporaryPassword || defaultPassword}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => copyCredentials(row)}>
                            <Copy size={14} />
                            Copy
                          </Button>
                        </div>
                      ) : (
                        <span className="cell-note">Ready to import</span>
                      )}
                    </td>
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
          title="No student list loaded"
          description="Download the template, fill in the required columns, then upload it here."
        />
      )}

      {preview && (
        <div className="inline-note">
          <AlertTriangle size={16} /> Review duplicate and invalid rows before importing. Existing
          accounts and duplicate rows in the file are not created.
        </div>
      )}

      {result && createdRows.length === 0 && (
        <div className="inline-note">
          <CheckCircle2 size={16} /> No new accounts were created. Check the result table for
          validation or duplicate errors.
        </div>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Bulk Student Import</h1>
        <p>Create student accounts from an Excel or CSV file and download their login details.</p>
      </div>
      {body}
    </div>
  );
};

export { BulkStudentImport as StudentBulkImport };
export default BulkStudentImport;
