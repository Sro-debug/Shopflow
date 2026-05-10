/**
 * Cache Health Monitor
 * Periodically pings all gRPC cache nodes and logs their status.
 * Emits 'degraded' / 'recovered' events via the passed Socket.IO instance.
 */
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('./logger');

const PROTO_PATH = path.join(__dirname, '../proto/cache.proto');
const POLL_INTERVAL_MS = 30_000;

class CacheHealthMonitor {
  constructor(cacheNodes, io = null) {
    this.nodes = cacheNodes; // ['host:port', ...]
    this.io = io;
    this.clients = {};
    this.status = {};
    this._timer = null;

    const packageDef = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
    });
    this.cacheProto = grpc.loadPackageDefinition(packageDef).cache;

    for (const addr of cacheNodes) {
      this.clients[addr] = new this.cacheProto.CacheService(
        addr, grpc.credentials.createInsecure()
      );
      this.status[addr] = { alive: true, latency: 0, lastChecked: null };
    }
  }

  async checkNode(addr) {
    return new Promise((resolve) => {
      const start = Date.now();
      this.clients[addr].GetStats({}, { deadline: Date.now() + 3000 }, (err, res) => {
        const latency = Date.now() - start;
        if (err) {
          resolve({ addr, alive: false, latency, error: err.message });
        } else {
          resolve({ addr, alive: true, latency, stats: res });
        }
      });
    });
  }

  async poll() {
    const results = await Promise.all(this.nodes.map((n) => this.checkNode(n)));

    for (const result of results) {
      const prev = this.status[result.addr];
      const wasAlive = prev.alive;

      this.status[result.addr] = {
        alive: result.alive,
        latency: result.latency,
        lastChecked: new Date(),
        stats: result.stats || null,
        error: result.error || null,
      };

      if (wasAlive && !result.alive) {
        logger.error('HealthMonitor', `Cache node DEGRADED: ${result.addr}`, { error: result.error });
        if (this.io) {
          this.io.to('admins').emit('cache:degraded', { node: result.addr, error: result.error });
        }
      } else if (!wasAlive && result.alive) {
        logger.info('HealthMonitor', `Cache node RECOVERED: ${result.addr}`, { latency: result.latency });
        if (this.io) {
          this.io.to('admins').emit('cache:recovered', { node: result.addr });
        }
      }
    }

    const alive = results.filter((r) => r.alive).length;
    const avg = results.reduce((s, r) => s + r.latency, 0) / results.length;
    logger.debug('HealthMonitor', `Poll complete: ${alive}/${results.length} nodes alive, avg latency ${avg.toFixed(0)}ms`);
  }

  start() {
    logger.info('HealthMonitor', `Starting — polling ${this.nodes.length} cache nodes every ${POLL_INTERVAL_MS / 1000}s`);
    this.poll(); // immediate first check
    this._timer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  getStatus() {
    return this.status;
  }

  isHealthy() {
    return Object.values(this.status).some((s) => s.alive);
  }
}

module.exports = CacheHealthMonitor;
