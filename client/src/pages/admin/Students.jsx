import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  GraduationCap,
  KeyRound,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { Badge, Button, Input, Select } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { adminApi } from '../../services/admin';
import {
  computeLevelFromMatric,
  formatLevel,
  getDefaultAcademicSession,
} from '../../utils/academic';
import { StudentBulkImport } from './BulkStudentImport';
import './Admin.css';
import '../Circulation.css';

const FALLBACK_LEVELS = ['100', '200', '300', '400', '500', '600'];

const FALLBACK_DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Medicine',
  'Law',
  'Business',
  'Education',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Social Sciences',
  'Arts & Humanities',
  'Agriculture',
];

const EMPTY_FORM = {
  fullName: '',
  email: '',
  matricNumber: '',
  department: '',
  faculty: '',
};

const MATRIC_PATTERN = /^\d{4}\/\d{6}\/[A-Za-z]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Students = () => {
  const showToast = useToast();
  const [options, setOptions] = useState({
    levels: FALLBACK_LEVELS,
    departments: FALLBACK_DEPARTMENTS,
    academicSession: getDefaultAcademicSession(),
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [students, setStudents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    adminApi
      .studentOptions()
      .then((data) => {
        if (!mounted || !data) return;
        setOptions({
          levels: data.levels?.length ? data.levels : FALLBACK_LEVELS,
          departments: data.departments?.length ? data.departments : FALLBACK_DEPARTMENTS,
          academicSession: data.academicSession || getDefaultAcademicSession(),
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const loadStudents = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await adminApi.students({ limit: 50, search: search.trim() || undefined });
      setStudents(data?.items || []);
    } catch (err) {
      showToast(err.message || 'Could not load students.', 'error');
    } finally {
      setListLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    const timer = setTimeout(loadStudents, 250);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    const name = form.fullName.trim();

    if (!name) next.fullName = 'Full name is required';
    else if (!/\s/.test(name)) next.fullName = 'Enter both first and last name';

    if (!form.email.trim()) next.email = 'Email is required';
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address';

    if (!form.matricNumber.trim()) next.matricNumber = 'Matriculation number is required';
    else if (!MATRIC_PATTERN.test(form.matricNumber.trim())) {
      next.matricNumber = 'Use the format 2021/131178/REGULAR';
    }

    if (!form.department) next.department = 'Department is required';

    return next;
  };

  const previewLevel = computeLevelFromMatric(form.matricNumber, options.academicSession);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setCreating(true);
    try {
      const result = await adminApi.createStudent({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        matricNumber: form.matricNumber.trim(),
        department: form.department,
        faculty: form.faculty.trim(),
      });
      setCreated(result);
      setForm(EMPTY_FORM);
      setErrors({});
      showToast('Student account created.', 'success');
      loadStudents();
    } catch (err) {
      setErrors({ general: err.message || 'Could not create student.' });
    } finally {
      setCreating(false);
    }
  };

  const copyCredentials = async () => {
    if (!created) return;
    const text = `Matriculation Number: ${created.user.matricNumber}\nTemporary Password: ${created.temporaryPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Login details copied.', 'success');
    } catch {
      showToast('Could not copy automatically. Select and copy the details manually.', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Students</h1>
        <p>Create student accounts individually or import them in bulk from a CSV or Excel file.</p>
      </div>

      {created && (
        <div className="content-card" style={{ borderColor: 'var(--success)' }}>
          <div className="account-note" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} />
            <div>
              <strong>{created.user.first_name} {created.user.last_name}</strong>
              <div>{created.user.matricNumber} · {created.user.email}</div>
              <div>
                <KeyRound size={13} /> Temporary password: <strong>{created.temporaryPassword}</strong>
              </div>
            </div>
          </div>
          <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
            The student can now sign in at the login page using their matriculation number and this
            temporary password.
          </p>
          <div className="table-actions">
            <Button variant="outline" onClick={copyCredentials}>
              <Copy size={16} />
              Copy login details
            </Button>
            <Button variant="ghost" onClick={() => setCreated(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>Create a student account</h2>
            <p className="card-subtitle">
              Each account is created active and can sign in with the matriculation number and a
              temporary password.
            </p>
          </div>
        </div>

        {errors.general && <div className="inline-note">{errors.general}</div>}

        <form onSubmit={handleSubmit}>
          <div className="student-form-grid">
            <Input
              label="Full name"
              name="fullName"
              placeholder="e.g. Ada Okafor"
              value={form.fullName}
              onChange={handleChange}
              error={errors.fullName}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="ada.okafor@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <Input
              label="Matriculation number"
              name="matricNumber"
              placeholder="2021/131178/REGULAR"
              value={form.matricNumber}
              onChange={handleChange}
              error={errors.matricNumber}
              helper="Format: year/programme code/study type"
              required
            />
            <Select
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              error={errors.department}
              required
            >
              <option value="">Select department</option>
              {options.departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </Select>
            <Input
              label="Faculty"
              name="faculty"
              placeholder="e.g. Faculty of Physical Sciences"
              value={form.faculty}
              onChange={handleChange}
            />
          </div>

          <div className="level-preview">
            <div className="level-preview__icon"><GraduationCap size={22} /></div>
            <div>
              <div className="level-preview__label">Calculated level</div>
              <div className="level-preview__value">
                <strong>{previewLevel ? formatLevel(previewLevel) : 'Enter a matric number'}</strong>
                <span className="level-preview__meta">
                  {options.academicSession ? `for ${options.academicSession}` : ''}
                </span>
              </div>
              <div className="level-preview__hint">
                The level is derived from the admission year in the matric number and the current
                academic session set on the admin dashboard.
              </div>
            </div>
          </div>

          <div className="account-note" style={{ marginTop: '1.25rem' }}>
            <KeyRound size={16} />
            Students sign in with their matriculation number and the temporary password shown after
            the account is created.
          </div>

          <div className="student-form-actions">
            <Button type="submit" loading={creating} disabled={creating}>
              <UserPlus size={18} />
              Create student
            </Button>
          </div>
        </form>
      </div>

      <StudentBulkImport embedded />

      <div className="content-card">
        <div
          className="card-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
        >
          <div>
            <h2 style={{ margin: 0 }}>All students</h2>
            <p className="card-subtitle">Most recently created student accounts.</p>
          </div>
          <div style={{ minWidth: 'min(260px, 100%)', flex: '0 1 320px' }}>
            <Input
              placeholder="Search name, matric or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              icon={Search}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Matric number</th>
                <th>Department</th>
                <th>Faculty</th>
                <th>Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Loading...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <Users size={20} /> No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                          {(student.first_name || '?').charAt(0)}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text)' }}>
                            {student.first_name} {student.last_name}
                          </strong>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{student.matricNumber || '-'}</td>
                    <td>{student.department || '-'}</td>
                    <td>{student.faculty || '-'}</td>
                    <td>
                      {student.academicLevel || student.level ? (
                        <span>
                          {formatLevel(student.academicLevel || student.level)}
                          {student.academicSession && (
                            <span className="cell-subtitle"> ({student.academicSession})</span>
                          )}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <Badge variant={student.isActive !== false ? 'success' : 'danger'}>
                        {student.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Students;
