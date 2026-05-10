require('dotenv').config();
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const LRUCache = require('./lruCache');

const PROTO_PATH = path.join(__dirname, '../proto/cache.proto');
const PORT = process.env.CACHE_NODE_PORT || 50052;
const CAPACITY = parseInt(process.env.CACHE_CAPACITY || '1000');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const cacheProto = grpc.loadPackageDefinition(packageDef).cache;
const cache = new LRUCache(CAPACITY);

// gRPC handlers
const handlers = {
  Get(call, callback) {
    const { key } = call.request;
    const value = cache.get(key);
    if (value !== null) {
      callback(null, { found: true, value: String(value) });
    } else {
      callback(null, { found: false, value: '' });
    }
  },

  Set(call, callback) {
    const { key, value, ttl } = call.request;
    const success = cache.set(key, value, ttl || 0);
    callback(null, { success, message: success ? 'OK' : 'Failed' });
  },

  Delete(call, callback) {
    const { key } = call.request;
    const success = cache.delete(key);
    callback(null, { success });
  },

  GetStats(call, callback) {
    const stats = cache.getStats();
    callback(null, stats);
  },

  Flush(call, callback) {
    const cleared = cache.flush();
    callback(null, { success: true, cleared });
  },
};

function startServer() {
  const server = new grpc.Server();
  server.addService(cacheProto.CacheService.service, handlers);
  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error(`[CacheNode] Failed to bind: ${err.message}`);
        process.exit(1);
      }
      console.log(`[CacheNode] gRPC server running on port ${boundPort}`);
      console.log(`[CacheNode] LRU capacity: ${CAPACITY}`);
    }
  );

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.tryShutdown(() => {
      console.log('[CacheNode] Server shut down gracefully');
      process.exit(0);
    });
  });
}

startServer();
