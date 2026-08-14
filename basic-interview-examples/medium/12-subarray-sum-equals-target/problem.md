# 12 — Count Revenue Windows Summing to Target

## Context (LeetCode #560)

Finance asks: how many **contiguous day ranges** have total revenue exactly equal to a budget target? Common Meta medium — prefix sum + hash map.

## Task

Implement `countSubarraysSumToTarget(dailyRevenueCents, targetCents)`.

- `dailyRevenueCents`: integer array (positive, negative, or zero)
- Return **count** of contiguous subarrays whose sum equals `targetCents`

## Example

```javascript
countSubarraysSumToTarget([1, 2, 3, 4, 5], 9);
// 2  → [2,3,4] and [4,5] if we use 1-indexed... wait
// [1,2,3,4,5] target 9: [2,3,4]=9, [4,5]=9 → 2
// also [9] if present - example [1,1,1] target 2 → 2 subarrays [1,1] at start and end
```

```javascript
countSubarraysSumToTarget([1, 1, 1], 2); // 2
```

## What they're testing

```javascript
// prefix[j] - prefix[i] = target  →  count map of (prefix - target)
```

**O(n)** time — not O(n²) nested loops.

## LeetCode

[560 — Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) — **Medium**

## Follow-ups

- Longest subarray instead of count?
- Subarray sum divisible by k?
