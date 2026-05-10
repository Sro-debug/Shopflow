const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

// ─── Create order ──────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { Order, Product } = req.app.locals.models;
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ error: 'No order items' });

    // Verify stock & calculate prices
    let itemsPrice = 0;
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) throw new Error(`Product not found: ${item.product}`);
        if (product.stock < item.quantity)
          throw new Error(`Insufficient stock for ${product.name}`);
        itemsPrice += product.price * item.quantity;
        return {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.images?.[0] || '',
        };
      })
    );

    const shippingPrice = itemsPrice >= 500 ? 0 : 49;
    const taxPrice = parseFloat((itemsPrice * 0.18).toFixed(2));
    const totalPrice = parseFloat((itemsPrice + shippingPrice + taxPrice).toFixed(2));

    const order = await Order.create({
      user: req.user.id,
      items: enrichedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'razorpay',
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    // Emit via WebSocket
    const io = req.app.locals.io;
    if (io) io.to(`user:${req.user.id}`).emit('order:created', order);

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Get my orders ─────────────────────────────────────────────────
router.get('/myorders', protect, async (req, res) => {
  try {
    const { Order } = req.app.locals.models;
    const cache = req.app.locals.cache;
    const cacheKey = `orders:user:${req.user.id}`;

    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    await cache.set(cacheKey, orders, 30);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get single order ──────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const { Order } = req.app.locals.models;
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Users can only see their own orders (admins can see all)
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update order to paid ──────────────────────────────────────────
router.put('/:id/pay', protect, async (req, res) => {
  try {
    const { Order, Product } = req.app.locals.models;
    const cache = req.app.locals.cache;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = 'confirmed';
    order.paymentResult = req.body;
    const updatedOrder = await order.save();

    // Decrement stock
    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      )
    );

    // Invalidate cache
    await cache.delete(`orders:user:${req.user.id}`);

    // Emit WS event
    const io = req.app.locals.io;
    if (io) io.to(`user:${req.user.id}`).emit('order:paid', updatedOrder);

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Get all orders ─────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { Order } = req.app.locals.models;
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Update order status ────────────────────────────────────
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { Order } = req.app.locals.models;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const io = req.app.locals.io;
    if (io) io.to(`user:${order.user}`).emit('order:statusUpdate', { orderId: order._id, status });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
