# Explanation — Longest Consecutive Day Streak

## O(n) Set approach

```javascript
if (set.has(day - 1)) continue; // only start from streak head
let len = 1;
while (set.has(day + len)) len++;
```

Each element visited at most twice → O(n).

## vs sorting

Sort + scan is O(n log n) — acceptable but mention Set trick.

## Business framing

“Longest login streak” / consecutive engagement days for growth metrics.

## Pitfall

Duplicates: use `Set` to dedupe first.
