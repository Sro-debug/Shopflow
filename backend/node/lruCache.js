/**
 * LRU Cache with TTL support
 * Doubly linked list + HashMap for O(1) get/set
 */
class LRUNode {
  constructor(key, value, ttl = 0) {
    this.key = key;
    this.value = value;
    this.ttl = ttl > 0 ? Date.now() + ttl * 1000 : 0;
    this.prev = null;
    this.next = null;
  }

  isExpired() {
    return this.ttl > 0 && Date.now() > this.ttl;
  }
}

class LRUCache {
  constructor(capacity = 1000) {
    this.capacity = capacity;
    this.map = new Map();
    this.hits = 0;
    this.misses = 0;

    // Sentinel nodes
    this.head = new LRUNode('HEAD', null);
    this.tail = new LRUNode('TAIL', null);
    this.head.next = this.tail;
    this.tail.prev = this.head;

    // Periodic cleanup of expired keys
    setInterval(() => this._cleanup(), 60000);
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _insertFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  get(key) {
    if (!this.map.has(key)) {
      this.misses++;
      return null;
    }

    const node = this.map.get(key);

    if (node.isExpired()) {
      this._remove(node);
      this.map.delete(key);
      this.misses++;
      return null;
    }

    // Move to front (most recently used)
    this._remove(node);
    this._insertFront(node);
    this.hits++;
    return node.value;
  }

  set(key, value, ttl = 0) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.value = value;
      node.ttl = ttl > 0 ? Date.now() + ttl * 1000 : 0;
      this._remove(node);
      this._insertFront(node);
      return true;
    }

    if (this.map.size >= this.capacity) {
      // Evict least recently used
      const lru = this.tail.prev;
      this._remove(lru);
      this.map.delete(lru.key);
    }

    const node = new LRUNode(key, value, ttl);
    this._insertFront(node);
    this.map.set(key, node);
    return true;
  }

  delete(key) {
    if (!this.map.has(key)) return false;
    const node = this.map.get(key);
    this._remove(node);
    this.map.delete(key);
    return true;
  }

  flush() {
    const count = this.map.size;
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    return count;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.map.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hit_rate: total > 0 ? parseFloat((this.hits / total).toFixed(4)) : 0,
    };
  }

  _cleanup() {
    const expired = [];
    for (const [key, node] of this.map) {
      if (node.isExpired()) expired.push(key);
    }
    for (const key of expired) this.delete(key);
    if (expired.length > 0)
      console.log(`[LRU] Cleaned up ${expired.length} expired keys`);
  }
}

module.exports = LRUCache;
