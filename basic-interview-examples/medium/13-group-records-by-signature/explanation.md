# Explanation — Group Records by Signature

## Approach

1. `key = tag.split('').sort().join('')`
2. `Map<key, id[]>`
3. Sort ids in each group; sort groups by first id.

Same as LC 49 with objects instead of raw strings.

## Alternatives (verbal)

- Counting array for `a-z` only → O(n × k)
- Hash of 26 letter counts as key

## Complexity

O(n × k log k) for tag length k.
