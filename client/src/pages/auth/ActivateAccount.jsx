import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { authApi } from '../../services/auth';
import { formatDateTime } from '../../utils/dates';
import './Auth.css';

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [student, setStudent] = useState(null);
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState('');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!token) {
      setChecking(false);
      setCheckError('The activation link is missing its token. Ask the library administrator for a new link.');
      return () => { mounted = false; };
    }

    authApi.validateActivation(token)
      .then((data) => {
        if (mounted) setStudent(data);
      })
      .catch((err) => {
        if (mounted) setCheckError(err.message || 'This activation link is invalid or has expired.');
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });

    return () => { mounted = false; };
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await authApi.activate(token, form.password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not activate this account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>ABSU Smart Library</h1>
          <p>Activate your student account.</p>
        </div>

        {checking && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Checking your activation link...
          </p>
        )}

        {!checking && checkError && (
          <>
            <div className="auth-error-banner">{checkError}</div>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              You may need to request a new activation link from the library administrator.
            </p>
            <Link to="/login">
              <Button variant="outline" style={{ width: '100%' }}>Back to sign in</Button>
            </Link>
          </>
        )}

        {!checking && student && !done && (
          <>
            <div className="activation-student">
              <ShieldCheck size={22} />
              <div>
                <strong>{student.first_name} {student.last_name}</strong>
                <span>{student.matricNumber} • {student.email}</span>
                {student.expiresAt && (
                  <span>This link expires {formatDateTime(student.expiresAt)}.</span>
                )}
              </div>
            </div>

            {error && <div className="auth-error-banner">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="password">Create a password</label>
                <div style={{ position: 'relative' }}>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    icon={Lock}
                    autoComplete="new-password"
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

              <div className="form-row">
                <label htmlFor="confirmPassword">Confirm password</label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter the same password again"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  icon={Lock}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" disabled={busy}>
                {busy ? 'Activating...' : 'Activate account'}
              </Button>
            </form>
          </>
        )}

        {done && (
          <div className="activation-success">
            <CheckCircle size={36} />
            <h2>Account activated</h2>
            <p>Your account is ready. Sign in with your matric number or email and the password you just created.</p>
            <Link to="/login">
              <Button style={{ width: '100%' }}>Go to sign in</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivateAccount;
