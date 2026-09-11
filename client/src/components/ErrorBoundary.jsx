import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const message = this.state.error && (this.state.error.message || String(this.state.error));
      return (
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>Something went wrong</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              The page ran into an unexpected error. Reload to continue, or go back to the dashboard.
            </p>
            {message && (
              <pre
                style={{
                  textAlign: 'left',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '0.8rem',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '1.25rem',
                  color: 'var(--text)',
                }}
              >
                {message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '0.7rem 1.5rem',
                background: 'var(--primary, #1a56db)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;