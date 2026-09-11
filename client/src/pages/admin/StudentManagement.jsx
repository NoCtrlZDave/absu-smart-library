import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  UserPlus,
  Info,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';
import { Button, Input, Select, Badge, Modal, EmptyState, useToast } from '../../components/common';
import StudentForm from '../../components/students/StudentForm';
import AcademicSectionSummary from '../../components/students/AcademicSectionSummary';
import StudentImportModal from '../../components/students/StudentImportModal';
import { FACULTIES } from '../../data/students';
import { deriveStudentEmail } from '../../utils/students';
import { useStudents } from '../../context/useStudent';
import { useAuth } from '../../context/useAuth';
import { useAudit } from '../../context/useAudit';
import './Admin.css';

const getInitials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const levelVariant = (level) => {
  if (level >= 500) return 'danger';
  if (level >= 400) return 'warning';
  if (level >= 300) return 'info';
  return 'success';
};

const StudentManagement = () => {
  const {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    isMatricTaken,
    getStudentLevel,
  } = useStudents();
  const { user, addUser } = useAuth();
  const { audit } = useAudit();
  const showToast = useToast();

  const [search, setSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const levelOptions = useMemo(() => {
    const levels = students.map((student) => getStudentLevel(student)).filter(Boolean);
    return Array.from(new Set(levels)).sort((a, b) => a - b).map(String);
  }, [students, getStudentLevel]);

  const filteredStudents = students.filter((student) => {
    const level = getStudentLevel(student);
    const matchesSearch =
      search === '' ||
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.matric.toLowerCase().includes(search.toLowerCase()) ||
      student.department.toLowerCase().includes(search.toLowerCase());
    const matchesFaculty = facultyFilter === 'All' || student.faculty === facultyFilter;
    const matchesLevel = levelFilter === 'All' || String(level) === levelFilter;
    return matchesSearch && matchesFaculty && matchesLevel;
  });

  if (user?.role !== 'admin') {
    return (
      <div className="admin-page">
        <div className="content-card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem', textAlign: 'center' }}>
            <ShieldAlert size={48} style={{ color: 'var(--danger)' }} />
            <h2 style={{ color: 'var(--text)' }}>Administrator Access Required</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Only administrators can add, edit, or remove students in the registry.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const openAddModal = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditing(student);
    setModalOpen(true);
  };

  const handleFormSubmit = async (form) => {
    if (editing) {
      if (isMatricTaken(form.matric, editing.id)) {
        showToast('A student with this matric number already exists.', 'error');
        return;
      }
      updateStudent(editing.id, form);
      audit('Edit', 'Student', `Updated ${form.name} (${form.matric})`);
      showToast('Student record updated successfully.');
      setModalOpen(false);
      return;
    }

    if (isMatricTaken(form.matric, null)) {
      showToast('A student with this matric number already exists.', 'error');
      return;
    }

    const added = addStudent(form);
    audit('Add', 'Student', `Registered ${added.name} (${added.matric})`);

    const email = deriveStudentEmail(form.matric);
    const [first, ...rest] = form.name.trim().split(/\s+/);
    const result = await addUser({
      email,
      password: 'student123',
      first_name: first || '',
      last_name: rest.join(' ') || '',
      role: 'student',
      matric: form.matric,
      department: form.department || '',
    });

    if (result.success) {
      showToast(`Student registered. Login account created (${email} / student123).`);
    } else {
      showToast('Student registered, but the login account was not created.', 'warning');
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    deleteStudent(deleteTarget.id);
    audit('Delete', 'Student', `Removed ${deleteTarget.name} (${deleteTarget.matric})`);
    showToast('Student removed from the registry.');
    setDeleteTarget(null);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Student Registry</h1>
        <p>
          Manually enrol students or import them from a spreadsheet. Level is
          auto-calculated from the admission year in the matric number (e.g.{' '}
          <code>2021</code> in <code>2021/131178/regular</code>) and the active
          academic section.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="Search by name, matric, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
          <Select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)}>
            <option value="All">All Faculties</option>
            {FACULTIES.map((faculty) => (
              <option key={faculty.name} value={faculty.name}>
                {faculty.name}
              </option>
            ))}
          </Select>
          <Select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="All">All Levels</option>
            {levelOptions.map((level) => (
              <option key={level} value={level}>
                {level} Level
              </option>
            ))}
          </Select>
        </div>
        <div className="toolbar-right">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet size={18} />
            Import Excel
          </Button>
          <Button onClick={openAddModal}>
            <UserPlus size={18} />
            Register Student
          </Button>
        </div>
      </div>

      <div className="content-grid student-registry-grid">
        <div className="content-card">
          <h2>
            Enrolled Students
            <Badge variant="info">{filteredStudents.length}</Badge>
          </h2>
          {filteredStudents.length === 0 ? (
            <EmptyState
              title="No students found"
              description="Register a student manually or import them from an Excel file."
              action={
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button variant="outline" onClick={() => setImportOpen(true)}>
                    <FileSpreadsheet size={16} /> Import Excel
                  </Button>
                  <Button onClick={openAddModal}>
                    <Plus size={16} /> Register Student
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Matric Number</th>
                    <th>Faculty</th>
                    <th>Department</th>
                    <th>Level</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const level = getStudentLevel(student);
                    return (
                      <tr key={student.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                background: 'var(--primary-light)',
                                color: 'var(--primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                              }}
                            >
                              {getInitials(student.name)}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text)' }}>{student.name}</strong>
                            </div>
                          </div>
                        </td>
                        <td><code style={{ color: 'var(--text)' }}>{student.matric}</code></td>
                        <td>{student.faculty}</td>
                        <td>{student.department || <span className="text-muted">-</span>}</td>
                        <td>
                          {level ? <Badge variant={levelVariant(level)}>{level} Level</Badge> : <Badge variant="warning">Unknown</Badge>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="action-btn" onClick={() => openEditModal(student)} title="Edit">
                              <Pencil size={16} />
                            </button>
                            <button className="action-btn danger" onClick={() => setDeleteTarget(student)} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="content-card">
          <h2>Academic Section</h2>
          <AcademicSectionSummary />
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Student Record' : 'Register Student'}
        size="lg"
      >
        {!editing && (
          <div className="account-note">
            <Info size={16} />
            This student will be added to the library registry and will receive a login
            account: their email is derived from the matric number and the default
            password is &apos;student123&apos; (they can change it after first login).
          </div>
        )}
        <StudentForm
          key={editing ? editing.id : 'new'}
          initialValues={editing || null}
          onSubmit={handleFormSubmit}
          submitLabel={editing ? 'Save Changes' : 'Register Student'}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete Student">
        <p>
          Remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.matric}) from the student
          registry? Their borrowing history will be preserved.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>
            <Trash2 size={18} />
            Delete Student
          </Button>
        </div>
      </Modal>

      <StudentImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
};

export default StudentManagement;