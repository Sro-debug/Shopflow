import api from './api';
import config from '../config/config';

const orderService = {
  async createOrder(orderData) {
    const { data } = await api.post('/orders', orderData);
    return data;
  },

  async getMyOrders() {
    const { data } = await api.get('/orders/myorders');
    return data;
  },

  async getOrder(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },

  async getAllOrders() {
    const { data } = await api.get('/orders');
    return data;
  },

  async updateOrderStatus(id, status) {
    const { data } = await api.put(`/orders/${id}/status`, { status });
    return data;
  },

  // ─── Razorpay full flow ──────────────────────────────────────────
  async initiatePayment(order) {
    // 1. Create Razorpay order on backend
    const { data: razorpayOrder } = await api.post('/payment/create-order', {
      amount: order.totalPrice,
      currency: 'INR',
      receipt: `order_${order._id}`,
      notes: { orderId: order._id },
    });

    return new Promise((resolve, reject) => {
      const options = {
        key: config.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: config.APP_NAME,
        description: `Payment for Order #${order._id?.slice(-8).toUpperCase()}`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            // 2. Verify signature
            const { data: verified } = await api.post('/payment/verify', response);
            if (!verified.verified) throw new Error('Payment verification failed');

            // 3. Update order as paid
            const { data: paidOrder } = await api.put(`/orders/${order._id}/pay`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              status: 'captured',
            });

            resolve(paidOrder);
          } catch (err) {
            reject(err);
          }
        },
        prefill: {
          name: order.shippingAddress?.fullName || '',
          email: '',
          contact: order.shippingAddress?.phone || '',
        },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user')),
        },
      };

      // Load Razorpay checkout if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        script.onerror = () => reject(new Error('Failed to load Razorpay'));
        document.body.appendChild(script);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    });
  },
};

export default orderService;
