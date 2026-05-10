import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import styles from './Orders.module.css';

const STATUS_COLORS = {
  pending: '#f59e0b', confirmed: '#6366f1', processing: '#8b5cf6',
  shipped: '#0ea5e9', delivered: '#22c55e', cancelled: '#ef4444',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getMyOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletons}>
          {Array(3).fill(0).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <span>📦</span>
        <h2>No orders yet</h2>
        <Link to="/products" className={styles.shopLink}>Start Shopping →</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Orders</h1>
      <div className={styles.list}>
        {orders.map((order) => (
          <Link key={order._id} to={`/orders/${order._id}`} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</span>
                <span className={styles.date}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <span className={styles.status} style={{ color: STATUS_COLORS[order.status] || '#888', background: `${STATUS_COLORS[order.status]}18` }}>
                {order.status}
              </span>
            </div>

            <div className={styles.items}>
              {order.items.slice(0, 3).map((item) => (
                <div key={item._id} className={styles.itemThumb}>
                  {item.image
                    ? <img src={item.image} alt={item.name} />
                    : <span>📦</span>
                  }
                </div>
              ))}
              {order.items.length > 3 && <span className={styles.moreItems}>+{order.items.length - 3}</span>}
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.itemCount}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
              <span className={styles.total}>₹{order.totalPrice.toLocaleString('en-IN')}</span>
              <span className={`${styles.paid} ${order.isPaid ? styles.paidYes : styles.paidNo}`}>
                {order.isPaid ? '✓ Paid' : '✕ Unpaid'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
