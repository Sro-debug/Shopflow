require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Lazily initialize Razorpay to avoid crash if keys aren't set yet
let razorpay;
function getRazorpay() {
  if (!razorpay) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

// ─── Create Razorpay Order ─────────────────────────────────────────
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ error: 'Invalid amount' });

    const options = {
      amount: Math.round(amount * 100), // Razorpay takes paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes,
    };

    const order = await getRazorpay().orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[Payment] Create order error:', err);
    res.status(500).json({ error: err.message || 'Payment order creation failed' });
  }
});

// ─── Verify Payment Signature ──────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ error: 'Missing payment verification data' });

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ error: 'Payment verification failed - signature mismatch' });

    res.json({
      verified: true,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
  } catch (err) {
    console.error('[Payment] Verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Refund ────────────────────────────────────────────────────────
router.post('/refund', async (req, res) => {
  try {
    const { payment_id, amount, notes = {} } = req.body;
    if (!payment_id) return res.status(400).json({ error: 'Payment ID required' });

    const refundOptions = { notes };
    if (amount) refundOptions.amount = Math.round(amount * 100);

    const refund = await getRazorpay().payments.refund(payment_id, refundOptions);
    res.json({ refund_id: refund.id, status: refund.status, amount: refund.amount / 100 });
  } catch (err) {
    console.error('[Payment] Refund error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get payment details ───────────────────────────────────────────
router.get('/details/:paymentId', async (req, res) => {
  try {
    const payment = await getRazorpay().payments.fetch(req.params.paymentId);
    res.json({
      id: payment.id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      created_at: payment.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Webhook handler ───────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');
      if (signature !== expectedSig)
        return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body);
    console.log('[Payment] Webhook event:', event.event);

    // Handle events
    switch (event.event) {
      case 'payment.captured':
        console.log('[Payment] Payment captured:', event.payload.payment.entity.id);
        break;
      case 'payment.failed':
        console.log('[Payment] Payment failed:', event.payload.payment.entity.id);
        break;
      case 'refund.created':
        console.log('[Payment] Refund created:', event.payload.refund.entity.id);
        break;
      default:
        console.log('[Payment] Unhandled webhook event:', event.event);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Payment] Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
