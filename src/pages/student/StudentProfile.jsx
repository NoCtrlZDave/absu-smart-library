import { useState } from 'react';
import { User, Mail, Hash, Building2, Calendar, Lock, Save } from 'lucide-react';
import { Button, Input } from '../../components/common';
import './Student.css';

const StudentProfile = () => {
  const [personalInfo, setPersonalInfo] = useState({
    fullName: 'John Doe',
    email: 'john.doe@absu.edu.ng',
    matricNumber: 'ABSU/2022/001',
    phone: '+234 801 234 5678',
    department: 'Computer Science',
    level: '300 Level'
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

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Profile updated successfully!');
    }, 1000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    }, 1000);
  };

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and account settings.</p>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {personalInfo.fullName.charAt(0)}
          </div>
          <div className="profile-info">
            <h2>{personalInfo.fullName}</h2>
            <p>{personalInfo.matricNumber} | {personalInfo.department}</p>
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
                name="matricNumber"
                value={personalInfo.matricNumber}
                onChange={handlePersonalInfoChange}
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
                icon={Hash}
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <Input
                name="department"
                value={personalInfo.department}
                onChange={handlePersonalInfoChange}
                icon={Building2}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Level</label>
              <Input
                name="level"
                value={personalInfo.level}
                onChange={handlePersonalInfoChange}
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
