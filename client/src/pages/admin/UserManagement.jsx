import { useState, useEffect } from 'react';
import { Search, Shield, ShieldOff } from 'lucide-react';
import { Input, Select, Badge } from '../../components/common';
import { useAudit } from '../../context/useAudit';
import { adminApi } from '../../services/admin';
import './Admin.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { audit } = useAudit();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    let mounted = true;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = { limit: 100 };
        if (search) params.search = search;
        if (roleFilter !== 'All') params.role = roleFilter.toLowerCase();
        if (statusFilter !== 'All') params.status = statusFilter.toLowerCase();
        const data = await adminApi.users(params);
        if (mounted) setUsers(data.items || []);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUsers();
    return () => { mounted = false; };
  }, [search, roleFilter, statusFilter]);

  const toggleUserStatus = async (user) => {
    try {
      const nextStatus = user.isActive === false ? true : false;
      await adminApi.updateUser(user.id, { isActive: nextStatus });
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, isActive: nextStatus } : u
      ));
      audit('Update', 'User', `${nextStatus ? 'Activated' : 'Deactivated'} ${user.first_name} ${user.last_name}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage students, librarians, and administrators.</p>
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
            <option value="admin">Admin</option>
            <option value="librarian">Librarian</option>
            <option value="student">Student</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No users found.</td></tr>
              ) : users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 40, height: 40, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        {(user.first_name || '?').charAt(0)}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text)' }}>{user.first_name} {user.last_name}</strong>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {user.matricNumber || user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge
                      variant={
                        user.role === 'admin'
                          ? 'danger'
                          : user.role === 'student'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {user.role === 'admin'
                        ? 'Administrator'
                        : user.role === 'student'
                        ? 'Student'
                        : 'Librarian'}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={user.isActive !== false ? 'success' : 'danger'}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="switch-btn" onClick={() => toggleUserStatus(user)} title={user.isActive !== false ? 'Deactivate' : 'Activate'}>
                        {user.isActive !== false ? <ShieldOff size={16} /> : <Shield size={16} />}
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