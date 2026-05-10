const crypto = require('crypto');

/**
 * Consistent Hash Ring
 * Uses virtual nodes to ensure even distribution
 */
class ConsistentHash {
  constructor(options = {}) {
    this.replicas = options.replicas || 150; // virtual nodes per server
    this.ring = new Map(); // hash → node
    this.sortedKeys = [];  // sorted hash values
    this.nodes = new Set();
  }

  _hash(key) {
    return parseInt(
      crypto.createHash('md5').update(String(key)).digest('hex').slice(0, 8),
      16
    );
  }

  addNode(node) {
    if (this.nodes.has(node)) return;
    this.nodes.add(node);

    for (let i = 0; i < this.replicas; i++) {
      const virtualKey = `${node}#${i}`;
      const hash = this._hash(virtualKey);
      this.ring.set(hash, node);
      this.sortedKeys.push(hash);
    }

    this.sortedKeys.sort((a, b) => a - b);
    console.log(`[ConsistentHash] Added node: ${node} (${this.replicas} virtual nodes)`);
  }

  removeNode(node) {
    if (!this.nodes.has(node)) return;
    this.nodes.delete(node);

    for (let i = 0; i < this.replicas; i++) {
      const virtualKey = `${node}#${i}`;
      const hash = this._hash(virtualKey);
      this.ring.delete(hash);
    }

    this.sortedKeys = this.sortedKeys.filter((k) => this.ring.has(k));
    console.log(`[ConsistentHash] Removed node: ${node}`);
  }

  getNode(key) {
    if (this.ring.size === 0) return null;

    const hash = this._hash(key);

    // Binary search for the first node with hash >= key hash
    let lo = 0,
      hi = this.sortedKeys.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sortedKeys[mid] < hash) lo = mid + 1;
      else hi = mid;
    }

    // Wrap around
    const idx = lo % this.sortedKeys.length;
    return this.ring.get(this.sortedKeys[idx]);
  }

  getNodes() {
    return Array.from(this.nodes);
  }

  getDistribution() {
    const dist = {};
    for (const node of this.nodes) dist[node] = 0;
    for (const node of this.ring.values()) dist[node]++;
    return dist;
  }
}

module.exports = ConsistentHash;
