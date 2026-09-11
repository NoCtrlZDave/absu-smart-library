import { useState } from 'react';
import { User, Mail, Hash, Building2, Calendar, Lock, Save, Phone } from 'lucide-react';
import { Button, Input, useToast } from '../../components/common';
import { useAuth } from '../../context/useAuth';
import { authApi } from '../../services/auth';
import { adminApi } from '../../services/admin';
import './Student.css';

const StudentProfile = () => {
  const { user } = useAuth();
  const toast = useToast();

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
    : '';

  const [personalInfo, setPersonalInfo] = useState({
    fullName: displayName,
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const [first_name, ...rest] = personalInfo.fullName.trim().split(' ');
    const last_name = rest.join(' ');
    setLoading(true);
    try {
      await adminApi.updateUser(user.id, {
        first_name: first_name || '',
        last_name,
        email: personalInfo.email,
        phone: personalInfo.phone,
      });
      toast('Profile updated successfully', 'success');
    } catch (err) {
      toast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast('Passwords do not match!', 'error');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast('Password changed successfully', 'success');
    } catch (err) {
      toast(err.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fullName = personalInfo.fullName || displayName || '?';

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and account settings.</p>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {fullName.charAt(0)}
          </div>
          <div className="profile-info">
            <h2>{fullName}</h2>
            <p>{user?.matric_number ? `${user.matric_number} | ` : ''}{user?.department || ''}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <Input
                name="fullName"
                value={personalInfo.fullName}
                onChange={handlePersonalInfoChange}
                icon={User}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <Input
                name="email"
                type="email"
                value={personalInfo.email}
                onChange={handlePersonalInfoChange}
                icon={Mail}
              />
            </div>
            <div className="form-group">
              <label>Matric Number</label>
              <Input
                value={user?.matric_number || ''}
                icon={Hash}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <Input
                name="phone"
                value={personalInfo.phone}
                onChange={handlePersonalInfoChange}
                icon={Phone}
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <Input
                value={user?.department || ''}
                icon={Building2}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Level</label>
              <Input
                value={user?.level || ''}
                icon={Calendar}
                disabled
              />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <Button type="submit" disabled={loading}>
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      <div className="profile-card">
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>Change Password</h3>
        <form onSubmit={handleChangePassword}>
          <div className="form-grid">
            <div className="form-group">
              <label>Current Password</label>
              <Input
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                icon={Lock}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <Input
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                icon={Lock}
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <Input
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                icon={Lock}
              />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <Button type="submit" variant="outline" disabled={loading}>
              <Lock size={18} />
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;
