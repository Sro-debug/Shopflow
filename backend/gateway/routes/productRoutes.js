const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

// ─── GET all products ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, sort } = req.query;
    const cache = req.app.locals.cache;
    const { Product } = req.app.locals.models;

    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const query = {};
    if (category) query.category = category;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const sortOption = sort === 'price_asc' ? { price: 1 }
      : sort === 'price_desc' ? { price: -1 }
      : sort === 'rating' ? { rating: -1 }
      : { createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)).lean(),
      Product.countDocuments(query),
    ]);

    const result = { products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) };
    await cache.set(cacheKey, result, 60);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single product ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const cache = req.app.locals.cache;
    const { Product } = req.app.locals.models;
    const cacheKey = `product:${req.params.id}`;

    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await cache.set(cacheKey, product, 120);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET categories ────────────────────────────────────────────────
router.get('/meta/categories', async (req, res) => {
  try {
    const cache = req.app.locals.cache;
    const { Product } = req.app.locals.models;
    const cacheKey = 'products:categories';

    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const categories = await Product.distinct('category');
    await cache.set(cacheKey, categories, 300);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE product (admin) ────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { Product } = req.app.locals.models;
    const cache = req.app.locals.cache;
    const product = await Product.create({ ...req.body, seller: req.user.id });
    // Invalidate list cache
    await cache.delete('products:categories');
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE product (admin) ────────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { Product } = req.app.locals.models;
    const cache = req.app.locals.cache;
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await cache.delete(`product:${req.params.id}`);
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE product (admin) ────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { Product } = req.app.locals.models;
    const cache = req.app.locals.cache;
    await Product.findByIdAndDelete(req.params.id);
    await cache.delete(`product:${req.params.id}`);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
