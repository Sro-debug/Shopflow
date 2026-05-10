import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginWithGoogle } from '../../redux/userSlice';

export default function LoginOAuth() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle Google OAuth callback
    const code = searchParams.get('code');
    const googleId = searchParams.get('googleId');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const avatar = searchParams.get('avatar');

    if (googleId && email) {
      dispatch(loginWithGoogle({ googleId, email, name, avatar }))
        .unwrap()
        .then(() => navigate('/'))
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, [dispatch, navigate, searchParams]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-muted)' }}>Completing sign in...</p>
    </div>
  );
}
