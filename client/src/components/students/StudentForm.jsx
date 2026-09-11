import { useState } from 'react';
import { GraduationCap, UserPlus } from 'lucide-react';
import { Input, Select, Button } from '../common';
import { FACULTIES, getDepartmentsForFaculty } from '../../data/students';
import { calculateLevel, parseMatricParts } from '../../utils/students';
import { useStudents } from '../../context/useStudent';
import '../../pages/admin/Admin.css';

const EMPTY_FORM = { name: '', matric: '', faculty: '', department: '' };

const StudentForm = ({
  onSubmit,
  submitLabel = 'Register Student',
  initialValues = null,
  onCancel = null,
}) => {
  const { activeSession } = useStudents();
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...(initialValues || {}) }));
  const [touched, setTouched] = useState({});

  const departments = getDepartmentsForFaculty(form.faculty);
  const matricParts = parseMatricParts(form.matric);
  const level = calculateLevel(form.matric, activeSession);

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'faculty') next.department = '';
      return next;
    });
  };

  const errors = {
    name: !form.name.trim() ? 'Student name is required' : '',
    matric: !form.matric.trim()
      ? 'Matric number is required'
      : !matricParts
        ? 'Use the format YEAR/123456/regular, e.g. 2021/131178/regular'
        : '',
    faculty: !form.faculty ? 'Select a faculty / college' : '',
    department: !form.department ? 'Select a department' : '',
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, matric: true, faculty: true, department: true });
    if (Object.values(errors).some(Boolean)) return;
    onSubmit({
      ...form,
      matric: form.matric.trim().toUpperCase(),
    });
    if (!initialValues) {
      setForm({ ...EMPTY_FORM });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="student-form-grid">
        <Input
          label="Full Name"
          placeholder="e.g. Adaeze Uche"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={touched.name ? errors.name : ''}
          required
        />

        <Input
          label="Matric Number"
          placeholder="e.g. 2021/131178/regular"
          value={form.matric}
          onChange={(e) => handleChange('matric', e.target.value)}
          helper="2021 = admission year (used for level) · 131178 = school-generated 6-digit number · last part is always 'regular'"
          error={touched.matric ? errors.matric : ''}
          required
        />

        <Select
          label="Faculty / College"
          value={form.faculty}
          onChange={(e) => handleChange('faculty', e.target.value)}
          placeholder="Select faculty / college"
          error={touched.faculty ? errors.faculty : ''}
        >
          <option value="" disabled>
            Select faculty / college
          </option>
          {FACULTIES.map((faculty) => (
            <option key={faculty.name} value={faculty.name}>
              {faculty.name}
            </option>
          ))}
        </Select>

        <Select
          label="Department"
          value={form.department}
          onChange={(e) => handleChange('department', e.target.value)}
          placeholder={form.faculty ? 'Select department' : 'Select faculty first'}
          disabled={!form.faculty}
          error={touched.department ? errors.department : ''}
        >
          {form.faculty && (
            <>
              <option value="" disabled>
                Select department
              </option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </>
          )}
        </Select>
      </div>

      <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
        The level is computed from the global <strong>Academic Section</strong> (Admin
        &rarr; Academic Section), not from this form. It uses the admission year in the
        matric number.
      </p>

      <div className="level-preview">
        <div className="level-preview__icon">
          <GraduationCap size={20} />
        </div>
        <div className="level-preview__info">
          <div className="level-preview__label">Calculated Level</div>
          <div className="level-preview__value">
            {matricParts ? (
              <>
                <strong>{level}</strong> Level
                <span className="level-preview__meta">
                  Admitted {matricParts.admissionYear} &middot; Serial {matricParts.serial}{' '}
                  &middot; {matricParts.programType} &middot; Section {activeSession}
                </span>
              </>
            ) : (
              <span className="level-preview__hint">
                Enter a valid matric number to auto-calculate the level.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="student-form-actions">
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">
          <UserPlus size={18} />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;