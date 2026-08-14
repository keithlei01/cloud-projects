# 13 — Group Records by Signature

## Context (LeetCode #49)

Support tickets carry **category tags** as strings. Tags that are **anagrams** (same letters, different order) should group together for deduped reporting — e.g. `"pay"` and `"yap"`.

## Task

Implement `groupBySignature(records)`.

- `records`: `{ id: string, tag: string }[]`
- Signature = `tag` with letters sorted (e.g. `"eat"` → `"aet"`)
- Return `string[][]` — each inner array is **ids** in a group, sorted ascending
- Outer groups sorted by **first id** in each group (ascending)

## Example

```javascript
groupBySignature([
  { id: "t2", tag: "pay" },
  { id: "t1", tag: "yap" },
  { id: "t3", tag: "now" },
]);
// [["t1", "t2"], ["t3"]]
```

## LeetCode

[49 — Group Anagrams](https://leetcode.com/problems/group-anagrams/) — **Medium**

## What they're testing

- `Map` keyed by normalized signature
- O(n × k log k) for tag length k — fine for short tags
