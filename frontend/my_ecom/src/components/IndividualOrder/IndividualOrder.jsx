import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import { useOrderTracking } from '../../socket/useOrderTracking';
import styles from './IndividualOrder.module.css';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS = {
  pending: '#f59e0b', confirmed: '#6366f1', processing: '#8b5cf6',
  shipped: '#0ea5e9', delivered: '#22c55e', cancelled: '#ef4444',
};

export default function IndividualOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live order tracking via WebSocket
  useOrderTracking(id, (newStatus) => {
    setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
  });

  useEffect(() => {
    orderService.getOrder(id)
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className={styles.loading}><div className={styles.spinner} /></div>;
  }

  if (!order) {
    return <div className={styles.error}><p>Order not found.</p><Link to="/orders">← Back to Orders</Link></div>;
  }

  const currentStep = order.status === 'cancelled' ? -1 : STATUS_STEPS.indexOf(order.status);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link to="/orders" className={styles.back}>← My Orders</Link>
          <h1 className={styles.title}>Order #{order._id.slice(-8).toUpperCase()}</h1>
          <span className={styles.date}>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
        </div>
        <span className={styles.status} style={{ color: STATUS_COLORS[order.status], background: `${STATUS_COLORS[order.status]}18` }}>
          {order.status}
        </span>
      </div>

      {/* Progress Tracker */}
      {order.status !== 'cancelled' && (
        <div className={styles.tracker}>
          {STATUS_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className={`${styles.trackStep} ${i <= currentStep ? styles.trackDone : ''}`}>
                <div className={styles.trackDot}>{i < currentStep ? '✓' : i + 1}</div>
                <span className={styles.trackLabel}>{step}</span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`${styles.trackLine} ${i < currentStep ? styles.trackLineDone : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className={styles.body}>
        {/* Items */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Items Ordered</h3>
          {order.items.map((item) => (
            <div key={item._id} className={styles.item}>
              <div className={styles.itemImg}>
                {item.image ? <img src={item.image} alt={item.name} /> : <span>📦</span>}
              </div>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemQty}>Qty: {item.quantity}</span>
              </div>
              <span className={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>

        <div className={styles.aside}>
          {/* Shipping */}
          <div className={styles.card}>
            <h4 className={styles.cardTitle}>📍 Shipping Address</h4>
            <p>{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}</p>
            <p>📞 {order.shippingAddress.phone}</p>
          </div>

          {/* Payment */}
          <div className={styles.card}>
            <h4 className={styles.cardTitle}>💳 Payment</h4>
            <div className={styles.payRow}>
              <span>Method</span>
              <span style={{ textTransform: 'capitalize' }}>{order.paymentMethod}</span>
            </div>
            <div className={styles.payRow}>
              <span>Status</span>
              <span style={{ color: order.isPaid ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                {order.isPaid ? '✓ Paid' : 'Pending'}
              </span>
            </div>
            {order.paymentResult?.razorpay_payment_id && (
              <div className={styles.payRow}>
                <span>Payment ID</span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {order.paymentResult.razorpay_payment_id}
                </span>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className={styles.card}>
            <h4 className={styles.cardTitle}>🧾 Price Details</h4>
            <div className={styles.payRow}><span>Subtotal</span><span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span></div>
            <div className={styles.payRow}><span>Shipping</span><span>{order.shippingPrice === 0 ? 'Free' : `₹${order.shippingPrice}`}</span></div>
            <div className={styles.payRow}><span>GST (18%)</span><span>₹{order.taxPrice?.toLocaleString('en-IN')}</span></div>
            <div className={`${styles.payRow} ${styles.payTotal}`}>
              <span>Total</span>
              <span>₹{order.totalPrice?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
