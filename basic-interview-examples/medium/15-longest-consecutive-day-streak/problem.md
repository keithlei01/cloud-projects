# 15 — Longest Consecutive Active Day Streak

## Context (LeetCode #128)

Given **unsorted** day indices when a user was active, find the length of the longest **consecutive day** streak (e.g. days 5,6,7 → length 3).

No sorting allowed for O(n) follow-up — use a `Set`.

## Task

Implement `longestConsecutiveDayStreak(activeDays)`.

- `activeDays`: integer array (may contain duplicates)
- Return length of longest run of consecutive integers

## Example

```javascript
longestConsecutiveDayStreak([100, 4, 200, 1, 3, 2]);
// 4  → streak 1,2,3,4
```

## LeetCode

[128 — Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) — **Medium**

## Approach hint

Only start counting from `day` if `day - 1` is **not** in the set (streak start).

## Complexity target

O(n) time, O(n) space
