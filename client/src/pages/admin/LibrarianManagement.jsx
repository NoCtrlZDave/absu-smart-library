import { useState } from 'react';
import { Search, UserPlus, Pencil, Trash2, User, Mail, Shield, ShieldOff } from 'lucide-react';
import { Button, Input, Select, Modal, Badge } from '../../components/common';
import './Admin.css';

const initialLibrarians = [
  { id: 1, name: 'Library Admin', email: 'admin@absu.edu.ng', staffId: 'STAFF-001', department: 'Main Library', status: 'active' },
  { id: 2, name: 'Jane Okoro', email: 'jane.okoro@absu.edu.ng', staffId: 'STAFF-003', department: 'Engineering Library', status: 'active' },
  { id: 3, name: 'Peter Obi', email: 'peter.obi@absu.edu.ng', staffId: 'STAFF-004', department: 'Medical Library', status: 'inactive' },
  { id: 4, name: 'Mariam Ahmed', email: 'mariam@absu.edu.ng', staffId: 'STAFF-005', department: 'Law Library', status: 'active' }
];

const LibrarianManagement = () => {
  const [librarians, setLibrarians] = useState(initialLibrarians);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLibrarian, setSelectedLibrarian] = useState(null);
  const [newLibrarian, setNewLibrarian] = useState({ name: '', email: '', staffId: '', department: '' });

  const filteredLibrarians = librarians.filter(lib => {
    return search === '' ||
      lib.name.toLowerCase().includes(search.toLowerCase()) ||
      lib.email.toLowerCase().includes(search.toLowerCase()) ||
      lib.staffId.includes(search);
  });

  const toggleStatus = (id) => {
    setLibrarians(prev => prev.map(lib =>
      lib.id === id ? { ...lib, status: lib.status === 'active' ? 'inactive' : 'active' } : lib
    ));
  };

  const handleDelete = (librarian) => {
    setSelectedLibrarian(librarian);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setLibrarians(prev => prev.filter(lib => lib.id !== selectedLibrarian.id));
    setShowDeleteModal(false);
  };

  const handleAddLibrarian = (e) => {
    e.preventDefault();
    const newId = librarians.length + 1;
    setLibrarians(prev => [...prev, { id: newId, ...newLibrarian, status: 'active' }]);
    setShowAddModal(false);
    setNewLibrarian({ name: '', email: '', staffId: '', department: '' });
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Librarian Management</h1>
        <p>Manage librarian accounts and permissions.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="Search by name, email, or staff ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} />
          Add Librarian
        </Button>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Librarian</th>
                <th>Staff ID</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLibrarians.map(lib => (
                <tr key={lib.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 40, height: 40, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        {lib.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text)' }}>{lib.name}</strong>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {lib.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{lib.staffId}</td>
                  <td>{lib.department}</td>
                  <td>
                    <Badge variant={lib.status === 'active' ? 'success' : 'danger'}>
                      {lib.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="switch-btn" onClick={() => toggleStatus(lib.id)} title="Toggle Status">
                        {lib.status === 'active' ? <ShieldOff size={16} /> : <Shield size={16} />}
                      </button>
                      <button className="action-btn" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button className="action-btn danger" onClick={() => handleDelete(lib)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Librarian">
        <form onSubmit={handleAddLibrarian}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <Input
                value={newLibrarian.name}
                onChange={(e) => setNewLibrarian({ ...newLibrarian, name: e.target.value })}
                icon={User}
                placeholder="Enter librarian name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <Input
                type="email"
                value={newLibrarian.email}
                onChange={(e) => setNewLibrarian({ ...newLibrarian, email: e.target.value })}
                icon={Mail}
                placeholder="Enter email"
              />
            </div>
            <div className="form-group">
              <label>Staff ID</label>
              <Input
                value={newLibrarian.staffId}
                onChange={(e) => setNewLibrarian({ ...newLibrarian, staffId: e.target.value })}
                placeholder="Enter staff ID"
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <Select value={newLibrarian.department} onChange={(e) => setNewLibrarian({ ...newLibrarian, department: e.target.value })}>
                <option value="">Select department</option>
                <option>Main Library</option>
                <option>Engineering Library</option>
                <option>Medical Library</option>
                <option>Law Library</option>
              </Select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit">
              <UserPlus size={18} />
              Add Librarian
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Librarian">
        <p>Are you sure you want to delete {selectedLibrarian?.name}? This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>
            <Trash2 size={18} />
            Delete Librarian
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default LibrarianManagement;
