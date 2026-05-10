require('dotenv').config();
require('../utils/validateEnv')();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const http = require('http');

const ConsistentHash = require('../hashing/consistentHash');
const CacheHealthMonitor = require('../utils/cacheHealthMonitor');
const logger = require('../utils/logger');
const { setupWebSocket } = require('../websocket/wsServer');

const app = express();
const server = http.createServer(app);
const PORT = process.env.GATEWAY_PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecom_distributed';

// ─── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use(limiter);

// ─── gRPC Cache Clients ────────────────────────────────────────────
const PROTO_PATH = path.join(__dirname, '../proto/cache.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const cacheProto = grpc.loadPackageDefinition(packageDef).cache;

const CACHE_NODES = (process.env.CACHE_NODES || 'localhost:50052,localhost:50053,localhost:50054').split(',');
const hashRing = new ConsistentHash({ replicas: 150 });
const grpcClients = {};

CACHE_NODES.forEach((addr) => {
  hashRing.addNode(addr);
  grpcClients[addr] = new cacheProto.CacheService(addr, grpc.credentials.createInsecure());
  console.log(`[Gateway] Connected to cache node: ${addr}`);
});

// ─── Cache Helpers ─────────────────────────────────────────────────
function getCacheClient(key) {
  const node = hashRing.getNode(key);
  return { client: grpcClients[node], node };
}

function cacheGet(key) {
  return new Promise((resolve) => {
    const { client } = getCacheClient(key);
    client.Get({ key }, (err, res) => {
      if (err || !res.found) resolve(null);
      else {
        try { resolve(JSON.parse(res.value)); }
        catch { resolve(res.value); }
      }
    });
  });
}

function cacheSet(key, value, ttl = 300) {
  return new Promise((resolve) => {
    const { client } = getCacheClient(key);
    client.Set({ key, value: JSON.stringify(value), ttl }, (err, res) => {
      resolve(!err && res.success);
    });
  });
}

function cacheDelete(key) {
  return new Promise((resolve) => {
    const { client } = getCacheClient(key);
    client.Delete({ key }, (err, res) => resolve(!err && res.success));
  });
}

// Expose cache helpers for routes
app.locals.cache = { get: cacheGet, set: cacheSet, delete: cacheDelete };

// ─── MongoDB Models ────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  googleId: String,
  avatar: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  images: [String],
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    image: String,
  }],
  shippingAddress: {
    fullName: String, address: String, city: String,
    state: String, pinCode: String, phone: String,
  },
  paymentMethod: { type: String, default: 'razorpay' },
  paymentResult: {
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
    status: String,
  },
  itemsPrice: Number,
  shippingPrice: Number,
  taxPrice: Number,
  totalPrice: Number,
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  isDelivered: { type: Boolean, default: false },
  deliveredAt: Date,
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

app.locals.models = { User, Product, Order };

// ─── Routes ────────────────────────────────────────────────────────
const authRoutes = require('../auth/authServer');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('../payment/payment');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Cache stats endpoint
app.get('/api/cache/stats', async (req, res) => {
  const stats = await Promise.all(
    CACHE_NODES.map((addr) =>
      new Promise((resolve) => {
        grpcClients[addr].GetStats({}, (err, s) => {
          resolve(err ? { node: addr, error: err.message } : { node: addr, ...s });
        });
      })
    )
  );
  res.json({ nodes: stats, distribution: hashRing.getDistribution() });
});

// Health check
app.get('/api/health', (req, res) => {
  const monitor = req.app.locals.cacheMonitor;
  res.json({
    status: 'ok',
    nodes: hashRing.getNodes(),
    cacheHealth: monitor ? monitor.getStatus() : null,
    timestamp: new Date(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Gateway Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ─── WebSocket ─────────────────────────────────────────────────────
const io = setupWebSocket(server);
app.locals.io = io;

// ─── Start ─────────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    logger.info('Gateway', 'MongoDB connected');
    server.listen(PORT, () => console.log(`[Gateway] Running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('Gateway', 'MongoDB connection failed', { error: err.message });
    process.exit(1);
  });

module.exports = { app, server, cacheGet, cacheSet, cacheDelete };
