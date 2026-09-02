import { useState } from 'react';
import { Search, User, Shield, ShieldOff } from 'lucide-react';
import { Input, Select, Badge } from '../../components/common';
import './Admin.css';

const initialUsers = [
  { id: 1, name: 'John Doe', email: 'john.doe@absu.edu.ng', matric: 'ABSU/2022/001', role: 'student', status: 'active' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@absu.edu.ng', matric: 'ABSU/2022/014', role: 'student', status: 'active' },
  { id: 3, name: 'Library Admin', email: 'admin@absu.edu.ng', matric: 'STAFF-001', role: 'librarian', status: 'active' },
  { id: 4, name: 'Michael Brown', email: 'michael.brown@absu.edu.ng', matric: 'ABSU/2021/078', role: 'student', status: 'suspended' },
  { id: 5, name: 'Grace Manager', email: 'grace@absu.edu.ng', matric: 'STAFF-002', role: 'admin', status: 'active' }
];

const UserManagement = () => {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredUsers = users.filter(user => {
    const matchesSearch = search === '' ||
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.matric.includes(search);
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleUserStatus = (id) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, status: user.status === 'active' ? 'suspended' : 'active' } : user
    ));
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage all system users.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="Search by name, email, or matric number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="All">All Roles</option>
            <option value="student">Student</option>
            <option value="librarian">Librarian</option>
            <option value="admin">Admin</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Matric / Staff ID</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 40, height: 40, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text)' }}>{user.name}</strong>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{user.matric}</td>
                  <td>
                    <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'librarian' ? 'warning' : 'info'}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="switch-btn" onClick={() => toggleUserStatus(user.id)} title={user.status === 'active' ? 'Suspend User' : 'Activate User'}>
                        {user.status === 'active' ? <ShieldOff size={16} /> : <Shield size={16} />}
                      </button>
                      <button className="action-btn" title="View">
                        <User size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
