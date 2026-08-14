/**
 * LeetCode #146 — JS Map preserves insertion order.
 * get/put: delete + re-insert to move to "most recent" end.
 */
class LRUQueryCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) 
      return -1;
    
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const lruKey = this.map.keys().next().value;
      this.map.delete(lruKey);
    }
    this.map.set(key, value);
  }
}

module.exports = { LRUQueryCache };
