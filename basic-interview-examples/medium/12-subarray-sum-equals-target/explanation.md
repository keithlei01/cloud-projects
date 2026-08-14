# Explanation — Subarray Sum Equals Target

## Key idea

If prefix sum at `j` minus prefix at `i` equals `target`, subarray `(i, j]` sums to target.

Count how many earlier prefixes equal `currentPrefix - target`.

```javascript
freq.set(0, 1); // empty prefix
prefix += x;
count += freq.get(prefix - target) || 0;
freq.set(prefix, (freq.get(prefix) || 0) + 1);
```

## Complexity

- **Time:** O(n)
- **Space:** O(n)

## Meta frequency

Top-tier medium for Business Eng — “how many windows hit exactly $X?”

## Pitfall

Initialize `{0: 1}` or you miss subarrays starting at index 0.
