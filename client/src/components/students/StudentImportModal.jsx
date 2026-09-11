import { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Undo2,
} from 'lucide-react';
import { Modal, Button, Badge, useToast } from '../common';
import { FACULTIES } from '../../data/students';
import { isValidMatric, calculateLevel } from '../../utils/students';
import { useStudents } from '../../context/useStudent';
import { useAudit } from '../../context/useAudit';
import { adminApi } from '../../services/admin';
import * as XLSX from 'xlsx';
import '../../pages/admin/Admin.css';

const HEADER_ALIASES = {
  name: ['name', 'student name', 'full name', 'fullname', 'names'],
  matric: [
    'matric',
    'matric number',
    'matric no',
    'matric no.',
    'matriculation',
    'reg number',
    'reg no',
    'reg number',
    'registration number',
    'student id',
  ],
  faculty: ['faculty', 'college', 'faculty/college', 'college/faculty', 'faculty name', 'faculty level'],
  department: ['department', 'dept', 'department name'],
  level: ['level', 'class level', 'current level'],
};

const normalize = (value) => String(value ?? '').trim();

const toKey = (value) =>
  normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const resolveHeader = (raw) => {
  const key = toKey(raw);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => toKey(alias) === key)) return field;
  }
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => alias.length >= 6 && key.includes(alias))) return field;
  }
  return null;
};

const matchFaculty = (name) => {
  const key = toKey(name);
  if (!key) return { name: '', matched: false };
  const exact = FACULTIES.find((f) => toKey(f.name) === key);
  if (exact) return { name: exact.name, matched: true };
  const partial = FACULTIES.find((f) => key === toKey(f.name).slice(0, Math.max(4, key.length)));
  if (partial) return { name: partial.name, matched: true };
  const fuzzy = FACULTIES.find((f) => toKey(f.name).includes(key) || key.includes(toKey(f.name)));
  if (fuzzy) return { name: fuzzy.name, matched: true };
  return { name: name, matched: false };
};

const parseWorkbook = (data) => {
  try {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!json.length) return { rows: [], errors: ['The spreadsheet has no rows to import.'] };

    const cols = {};
    Object.keys(json[0]).forEach((header) => {
      const field = resolveHeader(header);
      if (field && !cols[field]) cols[field] = header;
    });

    const missing = ['name', 'matric'].filter((f) => !cols[f]);
    const rows = [];
    const seen = new Set();

    json.forEach((raw, index) => {
      const name = normalize(raw[cols.name]);
      const matric = normalize(raw[cols.matric]).toUpperCase().replace(/^ABSU\//, '');
      const facultyInput = normalize(raw[cols.faculty]);
      const department = normalize(raw[cols.department]);
      const levelInFile = normalize(raw[cols.level]);

      let ok = true;
      let reasons = [];

      if (!name) {
        ok = false;
        reasons.push('Missing name');
      } else if (!matric) {
        ok = false;
        reasons.push('Missing matric number');
      } else if (!isValidMatric(matric)) {
        ok = false;
        reasons.push('Invalid matric format (use e.g. 2021/131178/regular)');
      } else if (seen.has(matric)) {
        ok = false;
        reasons.push('Duplicate in file');
      } else {
        seen.add(matric);
      }

      const faculty = facultyInput ? matchFaculty(facultyInput) : { name: '', matched: false };
      if (!faculty.matched && faculty.name) {
        reasons.push('Faculty not in the known list');
      }

      rows.push({
        index: index + 2,
        name,
        matric,
        faculty: faculty.name,
        department,
        levelInFile,
        status: ok ? 'ok' : 'skipped',
        reasons,
      });
    });

    const missingText = [];
    if (missing.length) missingText.push(`${missing.join(' and ')} column(s) not found`);
    return { rows, errors: missingText };
  } catch {
    return { rows: [], errors: ['Could not read this file. Use a .xlsx or .csv export.'] };
  }
};

const downloadTemplate = () => {
  const rows = [
    ['Name', 'Matric Number', 'Faculty', 'Department', 'Level'].join(','),
    [
      'Adaeze Uche',
      '2021/131178/regular',
      'College of Physical Sciences',
      'Computer Science',
      '500',
    ].join(','),
  ];
  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'absu-student-import-template.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const StudentImportModal = ({ isOpen, onClose }) => {
  const { activeSession, addStudents, isMatricTaken } = useStudents();
  const { audit } = useAudit();
  const showToast = useToast();

  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState(null);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const result = parseWorkbook(data);
      setRows(result.rows);
      setErrors(result.errors);
      setFileName(file.name);
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const validRows = (rows || []).filter((r) => r.status === 'ok').map((row) => ({
    ...row,
    duplicate: isValidMatric(row.matric) && isMatricTaken(row.matric, null),
  }));
  const countOk = validRows.filter((r) => !r.duplicate).length;
  const countSkipped = (rows || []).length - countOk;

  const reset = () => {
    setRows(null);
    setErrors([]);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    const records = validRows
      .filter((r) => !r.duplicate)
      .map((row) => ({
        name: row.name,
        matric: row.matric,
        faculty: row.faculty,
        department: row.department,
      }));
    const added = addStudents(records);

    let accountsCreated = 0;
    if (records.length) {
      try {
        const result = await adminApi.bulkCreateStudents(records);
        accountsCreated = result?.created ?? 0;
      } catch (err) {
        showToast(`Login accounts not created: ${err.message || 'bulk import failed'}`, 'warning');
      }
    }

    audit(
      'Bulk import',
      'Students',
      `Imported ${added.length} student${added.length !== 1 ? 's' : ''} from "${fileName}" (${activeSession})${
        accountsCreated ? `; created ${accountsCreated} login account${accountsCreated !== 1 ? 's' : ''}` : ''
      }`
    );
    showToast(
      `Imported ${added.length} student${added.length !== 1 ? 's' : ''}${
        accountsCreated ? ` with ${accountsCreated} login account${accountsCreated !== 1 ? 's' : ''}` : ''
      }.`
    );
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      reset();
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Students from Spreadsheet" size="lg">
      {!rows ? (
        <div className="import-dropzone">
          <FileSpreadsheet size={48} className="import-dropzone__icon" />
          <h3>Upload an Excel or CSV file</h3>
          <p>
            Columns: <strong>Name</strong>, <strong>Matric Number</strong>,{' '}
            <strong>Faculty</strong>, <strong>Department</strong>, <strong>Level</strong>.{' '}
            {''}
            Matric format: <code>2021/131178/regular</code> &mdash; the first part is the
            admission year (used to calculate the level), the 6-digit number is the
            school-generated serial, and &lsquo;regular&rsquo; is the ending every matric
            number shares. Only Name, Matric Number and Faculty are required.
          </p>
          <div className="import-dropzone__actions">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download size={18} />
              Download Template
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              Choose File
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="import-preview">
          <div className="import-preview__summary">
            <Badge variant="success">
              <CheckCircle size={14} />
              {countOk} ready to import
            </Badge>
            <Badge variant="danger">
              <XCircle size={14} />
              {countSkipped} skipped
            </Badge>
            <span className="import-preview__file">{fileName}</span>
          </div>

          {errors.length > 0 && (
            <div className="import-errors">
              {errors.map((err) => (
                <div key={err} className="import-errors__item">
                  <AlertTriangle size={14} />
                  {err}
                </div>
              ))}
            </div>
          )}

          <div className="import-session-picker">
            <div className="import-session-picker__label">
              Levels are computed using the global Academic Section:{' '}
              <strong>{activeSession}</strong>
            </div>
          </div>

          <div className="import-table-wrap">
            <table className="data-table import-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Name</th>
                  <th>Matric Number</th>
                  <th>Faculty</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const level = isValidMatric(row.matric)
                    ? calculateLevel(row.matric, activeSession)
                    : null;
                  const duplicate = row.status === 'ok' && isMatricTaken(row.matric, null);
                  const levelMismatch =
                    row.levelInFile && level && String(row.levelInFile).replace(/[^0-9]/g, '') !== String(level);
                  const displayLevel = level || row.levelInFile || '-';
                  return (
                    <tr key={row.index}>
                      <td>{row.index}</td>
                      <td><strong>{row.name}</strong></td>
                      <td><code>{row.matric}</code></td>
                      <td>{row.faculty || <span className="text-muted">-</span>}</td>
                      <td>{row.department || <span className="text-muted">-</span>}</td>
                      <td>
                        {displayLevel}
                        {levelMismatch && (
                          <span className="import-level-mismatch">(file: {row.levelInFile})</span>
                        )}
                      </td>
                      <td>
                        {row.status === 'skipped' ? (
                          <Badge variant="danger">{row.reasons[0]}</Badge>
                        ) : duplicate ? (
                          <Badge variant="warning">Already exists</Badge>
                        ) : (
                          <Badge variant="success">Ready</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="import-actions">
            <Button variant="outline" onClick={reset}>
              <Undo2 size={18} />
              Reset
            </Button>
            <Button onClick={handleImport} disabled={countOk === 0 || importing}>
              <Upload size={18} />
              {importing ? 'Importing...' : `Import ${countOk} Student${countOk !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StudentImportModal;