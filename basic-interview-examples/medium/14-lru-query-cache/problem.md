# 14 — LRU Query Cache

## Context (LeetCode #146)

Dashboard API caches expensive metric query results. When cache is full, evict the **least recently used** entry. Classic Meta design medium.

## Task

Implement `LRUQueryCache`:

```javascript
class LRUQueryCache {
  constructor(capacity) {}
  get(key) {}      // return value or -1 if missing
  put(key, value) {} // insert or update; evict LRU if over capacity
}
```

Both `get` and `put` count as **use** (mark key as recently used).

## Example

```javascript
const c = new LRUQueryCache(2);
c.put("q1", 100);
c.put("q2", 200);
c.get("q1");       // 100
c.put("q3", 300);  // evicts q2
c.get("q2");       // -1
c.get("q3");       // 300
```

## LeetCode

[146 — LRU Cache](https://leetcode.com/problems/lru-cache/) — **Medium**

## What they're testing

- `Map` insertion order in JS **or** doubly-linked list + hash map
- O(1) `get` and `put`

## Follow-ups

- TTL on entries?
- Distributed cache (verbal)?
