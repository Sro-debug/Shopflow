import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectIsAuth, selectUserLoading, selectUserError, clearError } from '../../redux/userSlice';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuth);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (isAuth) navigate('/'); }, [isAuth, navigate]);
  useEffect(() => () => dispatch(clearError()), [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.logo}>⬡</span>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.sub}>Sign in to your ShopFlow account</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.group}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Password</label>
            <div className={styles.passWrap}>
              <input
                type={showPass ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className={styles.eye} onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Sign In'}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/register" className={styles.link}>Create one →</Link>
        </p>
      </div>
    </div>
  );
}
