import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuth, selectIsAdmin, selectUser, logout } from '../../redux/userSlice';
import { selectCartCount } from '../../redux/cartSlice';
import styles from './Navbar.module.css';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = useSelector(selectIsAuth);
  const isAdmin = useSelector(selectIsAdmin);
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          ShopFlow
        </Link>

        <div className={styles.links}>
          <Link to="/products" className={`${styles.link} ${isActive('/products') ? styles.active : ''}`}>
            Shop
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin" className={`${styles.link} ${isActive('/admin') ? styles.active : ''}`}>
                Dashboard
              </Link>
              <Link to="/admin/add-product" className={styles.link}>
                + Product
              </Link>
            </>
          )}
        </div>

        <div className={styles.actions}>
          {isAuth ? (
            <>
              <Link to="/orders" className={styles.iconBtn} title="My Orders">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
              </Link>
              <Link to="/cart" className={styles.cartBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
              </Link>
              <div className={styles.userMenu}>
                <button className={styles.avatar}>
                  {user?.avatar ? <img src={user.avatar} alt={user.name} /> : user?.name?.[0]?.toUpperCase()}
                </button>
                <div className={styles.dropdown}>
                  <div className={styles.dropdownUser}>{user?.name}</div>
                  <div className={styles.dropdownEmail}>{user?.email}</div>
                  <hr className={styles.dropdownDivider} />
                  <Link to="/orders" className={styles.dropdownItem}>My Orders</Link>
                  {isAdmin && (
                    <>
                      <Link to="/admin" className={styles.dropdownItem}>Admin Dashboard</Link>
                      <Link to="/admin/add-product" className={styles.dropdownItem}>Add Product</Link>
                    </>
                  )}
                  <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.logout}`}>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.btnGhost}>Sign In</Link>
              <Link to="/register" className={styles.btnPrimary}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
