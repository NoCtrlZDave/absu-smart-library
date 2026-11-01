import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { authApi } from '../../services/auth';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = email.trim();

    if (!value) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(value)) {
      setError('Enter a valid email address');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await authApi.forgotPassword(value);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send the reset request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Reset your password</h1>
          <p>Enter the email address linked to your library account.</p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        {sent ? (
          <div className="activation-success">
            <CheckCircle2 size={36} />
            <h2>Request received</h2>
            <p>
              If that email is registered, password reset instructions will be sent to it. Contact
              the library administrator if you do not receive them.
            </p>
            <Link to="/login" style={{ width: '100%' }}>
              <Button style={{ width: '100%' }}>
                <ArrowLeft size={18} /> Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="email">Email address</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError('');
                }}
                icon={Mail}
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="btn-primary" loading={busy} disabled={busy}>
              {busy ? 'Sending...' : 'Send reset instructions'}
            </Button>

            <Link to="/login" className="forgot-link" style={{ textAlign: 'center' }}>
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
