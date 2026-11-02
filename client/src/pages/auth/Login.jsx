import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Hash, Lock, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { useAuth } from '../../context/useAuth';
import './Auth.css';

const ROLE_REDIRECT = {
  admin: '/admin/dashboard',
  librarian: '/librarian/dashboard',
  assistant_librarian: '/librarian/dashboard',
  circulation_staff: '/librarian/dashboard',
  it_librarian: '/librarian/dashboard',
  student: '/student/dashboard',
};

const SAFE_REDIRECT = ['/search', '/about', '/'];
const isSafeRedirect = (path) => {
  if (!path) return false;
  if (SAFE_REDIRECT.includes(path)) return true;
  return /^\/books\/[^/]+/.test(path);
};

const MATRIC_PATTERN = /^\d{4}\/\d{6}\/[A-Za-z]+$/;

const DEMO_ACCOUNTS = [
  { role: 'Admin', identifier: 'admin@absu.edu.ng', password: 'admin123', tone: 'admin' },
  { role: 'Librarian', identifier: 'librarian@absu.edu.ng', password: 'lib123', tone: 'librarian' },
  { role: 'Student', identifier: '2021/131178/REGULAR', password: 'student123', tone: 'student' },
];

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: true,
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
    const identifier = formData.identifier.trim();

    if (!identifier) {
      newErrors.identifier = 'Email or matric number is required';
    } else if (identifier.includes('@')) {
      if (!/\S+@\S+\.\S+/.test(identifier)) newErrors.identifier = 'Email is invalid';
    } else if (!MATRIC_PATTERN.test(identifier)) {
      newErrors.identifier = 'Enter a valid email or matric number, e.g. 2021/131178/REGULAR';
    }

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

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
      const result = await login(
        formData.identifier.trim(),
        formData.password,
        formData.rememberMe
      );

      if (!result.success) {
        setErrors({ general: result.error });
        return;
      }

      if (redirect && isSafeRedirect(redirect)) {
        navigate(redirect);
      } else {
        navigate(ROLE_REDIRECT[result.user.role] || '/');
      }
    } catch (err) {
      setErrors({ general: err.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setFormData((prev) => ({
      ...prev,
      identifier: account.identifier,
      password: account.password,
    }));
    setErrors({});
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>ABSU Digital Library</h1>
          <p>Sign in with your matriculation number or email.</p>
        </div>

        {errors.general && <div className="auth-error-banner">{errors.general}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="identifier">Email or Matric Number</label>
            <Input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="2021/131178/REGULAR or admin@absu.edu.ng"
              value={formData.identifier}
              onChange={handleChange}
              icon={Hash}
              error={errors.identifier}
              autoComplete="username"
              autoCapitalize="none"
            />
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
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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

          <Button type="submit" className="btn-primary" loading={loading} disabled={loading}>
            {loading ? 'Signing in...' : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </Button>

          <p className="auth-footer" style={{ marginTop: 0 }}>
            Student accounts are created by the library administrator.
            <br />
            <Link to="/activate" className="forgot-link">
              <ShieldCheck size={14} /> Have an activation link?
            </Link>
          </p>
        </form>

        <div className="demo-accounts">
          <p className="demo-title">Demo Accounts</p>
          <div className="demo-list">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.identifier}
                type="button"
                className="demo-btn"
                onClick={() => fillDemo(account)}
              >
                <span className={`demo-role ${account.tone}`}>{account.role}</span>
                {account.identifier}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
