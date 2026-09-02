import { useState } from 'react';
import {
  User,
  Mail,
  Hash,
  Phone,
  Lock,
  Save,
  Shield,
} from 'lucide-react';
import { Button, Input } from '../components/common';
import { useAuth } from '../context/useAuth';
import { useToast } from '../components/common/useToast';
import '../pages/student/Student.css';

const ProfilePage = () => {
  const { user, changePassword } = useAuth();
  const toast = useToast();

  const fullName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ');

  const [personalInfo, setPersonalInfo] = useState({
    fullName,
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({ ...prev, [name]: value }));
    setProfileErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    setGeneralError('');
  };

  const validateProfile = () => {
    const errors = {};
    if (!personalInfo.fullName.trim()) errors.fullName = 'Full name is required';
    if (!personalInfo.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(personalInfo.email))
      errors.email = 'Email is invalid';
    return errors;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword)
      errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 6)
      errors.newPassword = 'Password must be at least 6 characters';
    if (!passwordData.confirmPassword)
      errors.confirmPassword = 'Please confirm your new password';
    else if (passwordData.newPassword !== passwordData.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      toast('Profile updated successfully', 'success');
    }, 800);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      const result = changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setSavingPassword(false);
      if (result.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        toast('Password changed successfully', 'success');
      } else {
        setGeneralError(result.error);
      }
    }, 800);
  };

  const displayRole =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'librarian'
      ? 'Librarian'
      : 'Student';

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and manage your account information and security.</p>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {fullName ? fullName.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="profile-info">
            <h2>{fullName}</h2>
            <p>{user?.email}</p>
            <span
              className="badge"
              style={{
                background: 'rgba(26, 86, 50, 0.1)',
                color: 'var(--primary)',
                padding: '2px 10px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                textTransform: 'capitalize',
              }}
            >
              {displayRole}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>
            Personal Information
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <Input
                name="fullName"
                value={personalInfo.fullName}
                onChange={handlePersonalInfoChange}
                icon={User}
                error={profileErrors.fullName}
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
                error={profileErrors.email}
              />
            </div>
            {user?.matric_number && (
              <div className="form-group">
                <label>Matric Number</label>
                <Input
                  value={user.matric_number}
                  icon={Hash}
                  disabled
                />
              </div>
            )}
            <div className="form-group">
              <label>Phone Number</label>
              <Input
                name="phone"
                value={personalInfo.phone}
                onChange={handlePersonalInfoChange}
                icon={Phone}
              />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <Button type="submit" disabled={savingProfile}>
              <Save size={18} />
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      <div className="profile-card">
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>
          <Shield size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Change Password
        </h3>
        {generalError && (
          <div
            style={{
              background: 'rgba(211,47,47,0.08)',
              border: '1px solid rgba(211,47,47,0.3)',
              color: 'var(--danger)',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
            {generalError}
          </div>
        )}
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
                error={passwordErrors.currentPassword}
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
                error={passwordErrors.newPassword}
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
                error={passwordErrors.confirmPassword}
              />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <Button type="submit" variant="outline" disabled={savingPassword}>
              <Lock size={18} />
              {savingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
