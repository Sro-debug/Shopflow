import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories, selectProducts, selectCategories, selectProductsLoading } from '../../redux/productSlice';
import styles from './HomePage.module.css';

export default function HomePage() {
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);
  const loading = useSelector(selectProductsLoading);

  useEffect(() => {
    dispatch(fetchProducts({ limit: 8, sort: 'createdAt' }));
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>⬡ Distributed Commerce</span>
          <h1 className={styles.heroTitle}>
            Shop the Future,<br />
            <span className={styles.heroAccent}>Delivered Today</span>
          </h1>
          <p className={styles.heroSub}>
            Powered by a distributed cache architecture with real-time updates.
            Lightning-fast. Always available.
          </p>
          <div className={styles.heroActions}>
            <Link to="/products" className={styles.btnPrimary}>Explore Shop</Link>
            <Link to="/register" className={styles.btnGhost}>Create Account</Link>
          </div>
        </div>
        <div className={styles.heroStats}>
          {[['10ms', 'Cache Latency'], ['99.9%', 'Uptime'], ['3x', 'Cache Nodes'], ['∞', 'Scalable']].map(([val, label]) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statVal}>{val}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Browse Categories</h2>
            <div className={styles.categories}>
              {categories.map((cat) => (
                <Link key={cat} to={`/products?category=${cat}`} className={styles.categoryCard}>
                  <span className={styles.categoryName}>{cat}</span>
                  <span className={styles.categoryArrow}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Products</h2>
            <Link to="/products" className={styles.viewAll}>View all →</Link>
          </div>
          {loading ? (
            <div className={styles.skeletonGrid}>
              {Array(8).fill(0).map((_, i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {products.map((product) => (
                <Link key={product._id} to={`/products/${product._id}`} className={styles.productCard}>
                  <div className={styles.productImg}>
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name} />
                      : <span className={styles.productImgPlaceholder}>📦</span>
                    }
                  </div>
                  <div className={styles.productInfo}>
                    <p className={styles.productCategory}>{product.category}</p>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <div className={styles.productFooter}>
                      <span className={styles.productPrice}>₹{product.price.toLocaleString('en-IN')}</span>
                      {product.stock === 0 && <span className={styles.outOfStock}>Out of stock</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Architecture Banner */}
      <section className={styles.archBanner}>
        <div className="container">
          <h2 className={styles.archTitle}>Built on Distributed Architecture</h2>
          <div className={styles.archFlow}>
            {['React + Redux', '→', 'API Gateway', '→', 'Consistent Hash Ring', '→', 'LRU Cache Nodes (gRPC)', '→', 'MongoDB'].map((item, i) => (
              <span key={i} className={item === '→' ? styles.archArrow : styles.archNode}>{item}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
