import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 'calc(100vh - 64px)',
      gap: 16, padding: 24, textAlign: 'center',
    }}>
      <span style={{ fontSize: '5rem', lineHeight: 1 }}>404</span>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800,
        letterSpacing: '-0.02em',
      }}>
        Page not found
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 360 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        style={{
          marginTop: 8, padding: '12px 28px', background: 'var(--accent)', color: 'white',
          borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'inline-block',
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
