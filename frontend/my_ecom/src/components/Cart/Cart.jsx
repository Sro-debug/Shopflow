import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectCartItems, selectCartTotal, selectCartCount,
  selectShippingAddress, updateQuantity, removeFromCart,
  clearCart, saveShippingAddress
} from '../../redux/cartSlice';
import { selectUser } from '../../redux/userSlice';
import { addNotification } from '../../redux/userSlice';
import orderService from '../../services/orderService';
import config from '../../config/config';
import styles from './Cart.module.css';

const STEPS = ['Cart', 'Shipping', 'Payment'];

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const count = useSelector(selectCartCount);
  const user = useSelector(selectUser);
  const savedAddress = useSelector(selectShippingAddress);

  const [step, setStep] = useState(0);
  const [paying, setPaying] = useState(false);
  const [address, setAddress] = useState(savedAddress || {
    fullName: user?.name || '',
    address: '', city: '', state: '', pinCode: '', phone: '',
  });

  const shipping = total >= config.FREE_SHIPPING_THRESHOLD ? 0 : 49;
  const tax = parseFloat((total * config.TAX_RATE).toFixed(2));
  const grandTotal = parseFloat((total + shipping + tax).toFixed(2));

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const required = ['fullName', 'address', 'city', 'state', 'pinCode', 'phone'];
    for (const field of required) {
      if (!address[field]?.trim()) {
        dispatch(addNotification({ type: 'error', message: `Please fill in ${field}` }));
        return;
      }
    }
    dispatch(saveShippingAddress(address));
    setStep(2);
  };

  const handlePayment = async () => {
    if (paying) return;
    setPaying(true);
    try {
      // 1. Create order in DB
      const order = await orderService.createOrder({
        items: items.map((i) => ({ product: i._id, quantity: i.quantity })),
        shippingAddress: address,
        paymentMethod: 'razorpay',
      });

      // 2. Open Razorpay checkout & verify
      const paidOrder = await orderService.initiatePayment(order);

      // 3. Clear cart & navigate
      dispatch(clearCart());
      dispatch(addNotification({ type: 'success', message: 'Payment successful! 🎉' }));
      navigate(`/orders/${paidOrder._id}`);
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: err.message || 'Payment failed' }));
    } finally {
      setPaying(false);
    }
  };

  if (items.length === 0 && step === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🛒</span>
        <h2>Your cart is empty</h2>
        <p>Add some products to get started</p>
        <button className={styles.shopBtn} onClick={() => navigate('/products')}>Shop Now</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Stepper */}
      <div className={styles.stepper}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`${styles.step} ${i <= step ? styles.stepActive : ''}`}>
              <span className={styles.stepNum}>{i < step ? '✓' : i + 1}</span>
              <span className={styles.stepLabel}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineActive : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className={styles.inner}>
        {/* Step 0: Cart Items */}
        {step === 0 && (
          <div className={styles.cartSection}>
            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={item._id} className={styles.item}>
                  <div className={styles.itemImg}>
                    {item.images?.[0] ? <img src={item.images[0]} alt={item.name} /> : <span>📦</span>}
                  </div>
                  <div className={styles.itemInfo}>
                    <h4 className={styles.itemName}>{item.name}</h4>
                    <span className={styles.itemPrice}>₹{item.price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.itemQty}>
                    <button onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}>+</button>
                  </div>
                  <div className={styles.itemTotal}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                  <button className={styles.removeBtn} onClick={() => dispatch(removeFromCart(item._id))}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Shipping */}
        {step === 1 && (
          <form className={styles.shippingForm} onSubmit={handleAddressSubmit}>
            <h2 className={styles.formTitle}>Shipping Address</h2>
            <div className={styles.formGrid}>
              {[
                ['fullName', 'Full Name', 'text'],
                ['phone', 'Phone Number', 'tel'],
                ['address', 'Street Address', 'text'],
                ['city', 'City', 'text'],
                ['state', 'State', 'text'],
                ['pinCode', 'PIN Code', 'text'],
              ].map(([field, label, type]) => (
                <div key={field} className={styles.formGroup}>
                  <label className={styles.formLabel}>{label}</label>
                  <input
                    type={type}
                    className={styles.formInput}
                    value={address[field] || ''}
                    onChange={(e) => setAddress((a) => ({ ...a, [field]: e.target.value }))}
                    required
                  />
                </div>
              ))}
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.btnBack} onClick={() => setStep(0)}>← Back</button>
              <button type="submit" className={styles.btnNext}>Continue to Payment →</button>
            </div>
          </form>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className={styles.paymentSection}>
            <h2 className={styles.formTitle}>Review & Pay</h2>

            <div className={styles.addressReview}>
              <h4>Delivering to:</h4>
              <p>{address.fullName}</p>
              <p>{address.address}, {address.city}, {address.state} - {address.pinCode}</p>
              <p>📞 {address.phone}</p>
            </div>

            <div className={styles.orderItems}>
              {items.map((item) => (
                <div key={item._id} className={styles.reviewItem}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className={styles.razorpayBadge}>
              <img src="https://razorpay.com/favicon.ico" alt="" width="16" height="16" />
              Secured by Razorpay
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.btnBack} onClick={() => setStep(1)}>← Back</button>
              <button
                className={styles.btnPay}
                onClick={handlePayment}
                disabled={paying}
              >
                {paying ? 'Processing...' : `Pay ₹${grandTotal.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        )}

        {/* Order Summary (always visible) */}
        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>
          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span>Subtotal ({count} items)</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>{shipping === 0 ? <span style={{ color: 'var(--success)' }}>Free</span> : `₹${shipping}`}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>GST (18%)</span>
              <span>₹{tax.toLocaleString('en-IN')}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {step === 0 && (
            <button className={styles.btnCheckout} onClick={() => setStep(1)}>
              Proceed to Checkout →
            </button>
          )}

          {shipping > 0 && (
            <p className={styles.shippingNote}>
              Add ₹{(config.FREE_SHIPPING_THRESHOLD - total).toFixed(0)} more for free shipping
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
