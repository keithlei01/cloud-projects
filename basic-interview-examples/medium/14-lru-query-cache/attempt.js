/**
 * Implement LRUQueryCache — LC #146 (see problem.md)
 * Run: node attempt.js
 */
class LRUQueryCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    // TODO
  }

  put(key, value) {
    // TODO
  }
}

const c = new LRUQueryCache(2);
c.put("q1", 100);
c.put("q2", 200);
console.log("get q1 =>", c.get("q1"));       // expected: 100
c.put("q3", 300);
console.log("get q2 =>", c.get("q2"));       // expected: -1
console.log("get q3 =>", c.get("q3"));       // expected: 300

c.put("q4", 400);
console.log("get q1 =>", c.get("q1"));       // expected: -1 (q3,q4 remain)

module.exports = { LRUQueryCache };
