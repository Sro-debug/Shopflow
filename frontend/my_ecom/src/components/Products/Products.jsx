import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories, setFilters, selectProducts, selectCategories, selectProductsLoading, selectProductsMeta } from '../../redux/productSlice';
import { addToCart } from '../../redux/cartSlice';
import { selectIsAuth } from '../../redux/userSlice';
import styles from './Products.module.css';

export default function Products() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);
  const loading = useSelector(selectProductsLoading);
  const { pages, page, total } = useSelector(selectProductsMeta);
  const isAuth = useSelector(selectIsAuth);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  useEffect(() => {
    const params = { page: currentPage, limit: 12 };
    if (search) params.search = search;
    if (category) params.category = category;
    if (sort) params.sort = sort;
    dispatch(fetchProducts(params));
  }, [dispatch, search, category, sort, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    dispatch(addToCart(product));
    setAddedIds((prev) => new Set([...prev, product._id]));
    setTimeout(() => setAddedIds((prev) => { const s = new Set(prev); s.delete(product._id); return s; }), 1500);
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Filters</h3>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Category</label>
          {['', ...categories].map((cat) => (
            <button
              key={cat || 'all'}
              className={`${styles.filterBtn} ${category === cat ? styles.active : ''}`}
              onClick={() => { setCategory(cat); setCurrentPage(1); }}
            >
              {cat || 'All'}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort By</label>
          {[
            ['', 'Newest'],
            ['price_asc', 'Price: Low to High'],
            ['price_desc', 'Price: High to Low'],
            ['rating', 'Top Rated'],
          ].map(([val, label]) => (
            <button
              key={val}
              className={`${styles.filterBtn} ${sort === val ? styles.active : ''}`}
              onClick={() => { setSort(val); setCurrentPage(1); }}
            >
              {label}
            </button>
          ))}
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.searchBar}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn}>Search</button>
          </form>
          <span className={styles.resultCount}>{total} products</span>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {Array(12).fill(0).map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔍</span>
            <p>No products found</p>
            <button className={styles.clearBtn} onClick={() => { setSearch(''); setCategory(''); setSort(''); }}>Clear filters</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => (
              <Link key={product._id} to={`/products/${product._id}`} className={styles.card}>
                <div className={styles.cardImg}>
                  {product.images?.[0]
                    ? <img src={product.images[0]} alt={product.name} />
                    : <span className={styles.placeholder}>📦</span>
                  }
                  {product.stock === 0 && <span className={styles.outBadge}>Out of Stock</span>}
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.cardCategory}>{product.category}</span>
                  <h3 className={styles.cardName}>{product.name}</h3>
                  <p className={styles.cardDesc}>{product.description}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardPrice}>₹{product.price.toLocaleString('en-IN')}</span>
                    {isAuth && (
                      <button
                        className={`${styles.addBtn} ${addedIds.has(product._id) ? styles.added : ''}`}
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={product.stock === 0}
                      >
                        {addedIds.has(product._id) ? '✓' : '+'}
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>← Prev</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`${styles.pageBtn} ${p === currentPage ? styles.pageActive : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button className={styles.pageBtn} onClick={() => setCurrentPage((p) => Math.min(pages, p + 1))} disabled={currentPage === pages}>Next →</button>
          </div>
        )}
      </main>
    </div>
  );
}
