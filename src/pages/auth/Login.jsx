import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { useAuth } from '../../context/useAuth';
import './Auth.css';

const ROLE_REDIRECT = {
  admin: '/admin/dashboard',
  librarian: '/librarian/dashboard',
  student: '/student/dashboard',
};

const SAFE_REDIRECT = ['/search', '/about', '/'];
const isSafeRedirect = (path) => {
  if (!path) return false;
  if (SAFE_REDIRECT.includes(path)) return true;
  return /^\/books\/\d+/.test(path);
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
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
    setTimeout(() => {
      const result = login(formData.email, formData.password);
      setLoading(false);
      if (result.success) {
        if (redirect && isSafeRedirect(redirect)) {
          navigate(redirect);
        } else {
          navigate(ROLE_REDIRECT[result.user.role]);
        }
      } else {
        setErrors({ general: result.error });
      }
    }, 800);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>ABSU Smart Library</h1>
          <p>Welcome back! Please sign in to your account.</p>
        </div>

        {errors.general && (
          <div className="auth-error-banner">{errors.general}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                error={errors.email}
              />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                icon={Lock}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              'Signing in...'
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create Account</Link>
        </div>

        <div className="demo-accounts">
          <p className="demo-title">Demo Accounts</p>
          <div className="demo-list">
            <button
              type="button"
              className="demo-btn"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  email: 'admin@absu.edu.ng',
                  password: 'admin123',
                }))
              }
            >
              <span className="demo-role admin">Admin</span>
              admin@absu.edu.ng
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  email: 'librarian@absu.edu.ng',
                  password: 'lib123',
                }))
              }
            >
              <span className="demo-role librarian">Librarian</span>
              librarian@absu.edu.ng
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  email: 'student@absu.edu.ng',
                  password: 'stud123',
                }))
              }
            >
              <span className="demo-role student">Student</span>
              student@absu.edu.ng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
