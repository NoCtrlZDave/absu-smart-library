import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { useAuth } from '../../context/useAuth';
import './Auth.css';

const ROLE_REDIRECT = {
  student: '/student/dashboard',
  staff: '/staff/dashboard',
};

const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, changePassword, logout } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!formData.newPassword) newErrors.newPassword = 'New password is required';
    else if (formData.newPassword.length < 6)
      newErrors.newPassword = 'Password must be at least 6 characters';
    if (formData.confirmPassword !== formData.newPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    try {
      const result = await changePassword(formData.currentPassword, formData.newPassword);
      if (result.success) {
        setFlash('Password updated successfully. Redirecting...');
        const destination = ROLE_REDIRECT[result.user?.role] || ROLE_REDIRECT.student;
        setTimeout(() => {
          const from = location.state?.from;
          navigate(from && !from.startsWith('/force-password-change') ? from : destination);
        }, 1200);
      } else {
        setErrors({ general: result.error });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh' }}>
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Set a Personal Password</h1>
          <p>
            Hello {user?.first_name || 'there'}. Your account is protected by the general
            password <strong>student123</strong>. Enter that general password below, then
            choose a personal password of your own before continuing.
          </p>
        </div>

        {flash && (
          <div className="auth-success-banner">
            <CheckCircle size={16} /> {flash}
          </div>
        )}

        {errors.general && <div className="auth-error-banner">{errors.general}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="Current (general) password"
            name="currentPassword"
            type={showCurrent ? 'text' : 'password'}
            placeholder="e.g. student123"
            value={formData.currentPassword}
            onChange={handleChange}
            icon={KeyRound}
            error={errors.currentPassword}
          />

          <Input
            label="New password"
            name="newPassword"
            type={showNew ? 'text' : 'password'}
            placeholder="Enter a new password"
            value={formData.newPassword}
            onChange={handleChange}
            icon={Lock}
            error={errors.newPassword}
          />

          <Input
            label="Confirm new password"
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat the new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            icon={Lock}
            error={errors.confirmPassword}
          />

          <div className="password-toggle-row">
            <button type="button" className="text-toggle" onClick={() => setShowCurrent(!showCurrent)}>
              <Eye size={14} /> {showCurrent ? 'Hide' : 'Show'} current
            </button>
            <button type="button" className="text-toggle" onClick={() => setShowNew(!showNew)}>
              <EyeOff size={14} /> {showNew ? 'Hide' : 'Show'} new
            </button>
            <button type="button" className="text-toggle" onClick={() => setShowConfirm(!showConfirm)}>
              <Eye size={14} /> {showConfirm ? 'Hide' : 'Show'} confirm
            </button>
          </div>

          <Button type="submit" className="btn-primary" disabled={loading || Boolean(flash)}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

        <div className="auth-footer">
          <Link to="/login" onClick={logout}>
            Not you? Sign out and re-login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;