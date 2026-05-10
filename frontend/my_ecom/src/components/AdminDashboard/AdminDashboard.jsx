import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './AdminDashboard.module.css';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: '#f59e0b', confirmed: '#6366f1', processing: '#8b5cf6',
  shipped: '#0ea5e9', delivered: '#22c55e', cancelled: '#ef4444',
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [cacheStats, setCacheStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    const { data } = await api.get('/orders');
    setOrders(data);
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data } = await api.get('/products?limit=100');
    setProducts(data.products || []);
  }, []);

  const fetchCacheStats = useCallback(async () => {
    const { data } = await api.get('/cache/stats');
    setCacheStats(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOrders(), fetchProducts(), fetchCacheStats()])
      .finally(() => setLoading(false));
  }, [fetchOrders, fetchProducts, fetchCacheStats]);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingOrder(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      console.error('Status update failed', err);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // ── Derived stats ────────────────────────────────────────────────
  const totalRevenue = orders
    .filter((o) => o.isPaid)
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const ordersByStatus = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  const totalCacheHits = cacheStats?.nodes?.reduce((s, n) => s + (n.hits || 0), 0) || 0;
  const totalCacheMisses = cacheStats?.nodes?.reduce((s, n) => s + (n.misses || 0), 0) || 0;
  const overallHitRate = totalCacheHits + totalCacheMisses > 0
    ? ((totalCacheHits / (totalCacheHits + totalCacheMisses)) * 100).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingGrid}>
          {Array(4).fill(0).map((_, i) => <div key={i} className={styles.skeletonCard} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Manage orders, products, and system health</p>
        </div>
        <Link to="/admin/add-product" className={styles.addBtn}>+ Add Product</Link>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiIcon}>💰</span>
          <div>
            <p className={styles.kpiLabel}>Total Revenue</p>
            <p className={styles.kpiValue}>₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiIcon}>📦</span>
          <div>
            <p className={styles.kpiLabel}>Total Orders</p>
            <p className={styles.kpiValue}>{orders.length}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiIcon}>🛍️</span>
          <div>
            <p className={styles.kpiLabel}>Products</p>
            <p className={styles.kpiValue}>{products.length}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiIcon}>⚡</span>
          <div>
            <p className={styles.kpiLabel}>Cache Hit Rate</p>
            <p className={styles.kpiValue}>{overallHitRate}%</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        {['orders', 'products', 'cache'].map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'orders' ? `Orders (${orders.length})`
              : t === 'products' ? `Products (${products.length})`
              : 'Cache Health'}
          </button>
        ))}
      </div>

      {/* ── Orders Tab ────────────────────────────────────────── */}
      {tab === 'orders' && (
        <div className={styles.section}>
          {/* Status summary bar */}
          <div className={styles.statusBar}>
            {STATUS_OPTIONS.map((s) => (
              <div key={s} className={styles.statusChip}
                style={{ borderColor: `${STATUS_COLORS[s]}44`, background: `${STATUS_COLORS[s]}12` }}>
                <span style={{ color: STATUS_COLORS[s], fontWeight: 700 }}>{ordersByStatus[s]}</span>
                <span className={styles.statusChipLabel}>{s}</span>
              </div>
            ))}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <Link to={`/orders/${order._id}`} className={styles.orderLink}>
                        #{order._id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td>
                      <div className={styles.customerCell}>
                        <span>{order.user?.name || '—'}</span>
                        <span className={styles.customerEmail}>{order.user?.email || ''}</span>
                      </div>
                    </td>
                    <td>{order.items?.length || 0}</td>
                    <td className={styles.priceCell}>₹{order.totalPrice?.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={order.isPaid ? styles.paidBadge : styles.unpaidBadge}>
                        {order.isPaid ? '✓ Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      <select
                        className={styles.statusSelect}
                        value={order.status}
                        disabled={updatingOrder === order._id}
                        style={{ color: STATUS_COLORS[order.status] }}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short',
                      })}
                    </td>
                    <td>
                      <Link to={`/orders/${order._id}`} className={styles.viewBtn}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Products Tab ──────────────────────────────────────── */}
      {tab === 'products' && (
        <div className={styles.section}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className={styles.productThumb}>
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} />
                          : <span>📦</span>}
                      </div>
                    </td>
                    <td>
                      <Link to={`/products/${p._id}`} className={styles.orderLink}>{p.name}</Link>
                    </td>
                    <td><span className={styles.categoryTag}>{p.category}</span></td>
                    <td className={styles.priceCell}>₹{p.price?.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={p.stock === 0 ? styles.outStock : styles.inStock}>
                        {p.stock === 0 ? 'Out of stock' : p.stock}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionRow}>
                        <Link to={`/products/${p._id}`} className={styles.viewBtn}>View</Link>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteProduct(p._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Cache Health Tab ───────────────────────────────────── */}
      {tab === 'cache' && cacheStats && (
        <div className={styles.section}>
          <div className={styles.cacheGrid}>
            {cacheStats.nodes?.map((node) => (
              <div key={node.node} className={styles.cacheCard}>
                <div className={styles.cacheNodeHeader}>
                  <span className={`${styles.cacheNodeDot} ${node.error ? styles.nodeDead : styles.nodeAlive}`} />
                  <span className={styles.cacheNodeAddr}>{node.node}</span>
                  {node.error && <span className={styles.nodeError}>Offline</span>}
                </div>

                {!node.error && (
                  <>
                    <div className={styles.cacheStats}>
                      <div className={styles.cacheStat}>
                        <span className={styles.cacheStatLabel}>Size / Capacity</span>
                        <span className={styles.cacheStatVal}>{node.size} / {node.capacity}</span>
                      </div>
                      <div className={styles.cacheStat}>
                        <span className={styles.cacheStatLabel}>Hit Rate</span>
                        <span className={styles.cacheStatVal} style={{ color: 'var(--success)' }}>
                          {((node.hit_rate || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className={styles.cacheStat}>
                        <span className={styles.cacheStatLabel}>Hits</span>
                        <span className={styles.cacheStatVal}>{node.hits?.toLocaleString()}</span>
                      </div>
                      <div className={styles.cacheStat}>
                        <span className={styles.cacheStatLabel}>Misses</span>
                        <span className={styles.cacheStatVal}>{node.misses?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Fill bar */}
                    <div className={styles.fillBarWrap}>
                      <div
                        className={styles.fillBar}
                        style={{ width: `${Math.round((node.size / node.capacity) * 100)}%` }}
                      />
                    </div>
                    <p className={styles.fillLabel}>
                      {Math.round((node.size / node.capacity) * 100)}% full
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Hash ring distribution */}
          {cacheStats.distribution && (
            <div className={styles.distCard}>
              <h3 className={styles.distTitle}>Consistent Hash Ring — Virtual Node Distribution</h3>
              <div className={styles.distRows}>
                {Object.entries(cacheStats.distribution).map(([node, count]) => (
                  <div key={node} className={styles.distRow}>
                    <span className={styles.distNode}>{node}</span>
                    <div className={styles.distBarWrap}>
                      <div
                        className={styles.distBar}
                        style={{ width: `${Math.round((count / 450) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.distCount}>{count} vnodes</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className={styles.refreshBtn} onClick={fetchCacheStats}>↻ Refresh Stats</button>
        </div>
      )}
    </div>
  );
}
