import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', gap: 16, padding: 24,
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            style={{
              padding: '10px 24px', background: 'var(--accent)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer',
            }}
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
