const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key';

function setupWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth middleware ─────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection handler ──────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`[WS] User connected: ${userId} (${socket.id})`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Admins join admin room
    if (socket.user.role === 'admin') {
      socket.join('admins');
      console.log(`[WS] Admin joined admin room: ${userId}`);
    }

    // ─── Client events ─────────────────────────────────────────────
    socket.on('cart:update', (data) => {
      socket.emit('cart:synced', data);
    });

    socket.on('order:track', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('order:untrack', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    // Admin broadcasts
    socket.on('admin:broadcast', (data) => {
      if (socket.user.role !== 'admin') return;
      io.emit('notification', data);
    });

    socket.on('disconnect', () => {
      console.log(`[WS] User disconnected: ${userId}`);
    });

    socket.on('error', (err) => {
      console.error(`[WS] Socket error for ${userId}:`, err.message);
    });
  });

  // Make io available globally

  console.log('[WS] Socket.IO server initialized');
  return io;
}

module.exports = { setupWebSocket };
