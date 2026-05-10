import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, selectIsAuth, selectUserLoading, selectUserError, clearError } from '../../redux/userSlice';
import styles from './CreateAccount.module.css';

export default function CreateAccount() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuth);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [validationError, setValidationError] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (isAuth) navigate('/'); }, [isAuth, navigate]);
  useEffect(() => () => dispatch(clearError()), [dispatch]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setValidationError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    setValidationError('');
    dispatch(registerUser({ name: form.name, email: form.email, password: form.password }));
  };

  const displayError = validationError || error;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.logo}>⬡</span>
          <h1 className={styles.title}>Create account</h1>
          <p className={styles.sub}>Join ShopFlow — it's free</p>
        </div>

        {displayError && <div className={styles.errorBox}>{displayError}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.group}>
            <label className={styles.label}>Full Name</label>
            <input
              name="name"
              type="text"
              className={styles.input}
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Password</label>
            <div className={styles.passWrap}>
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                className={styles.input}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" className={styles.eye} onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Confirm Password</label>
            <input
              name="confirm"
              type="password"
              className={styles.input}
              placeholder="Repeat password"
              value={form.confirm}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Create Account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login" className={styles.link}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
