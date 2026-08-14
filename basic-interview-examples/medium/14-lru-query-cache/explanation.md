# Explanation — LRU Query Cache

## JS Map trick (interview-friendly)

ES2015+ `Map` iterates in insertion order.

- **Most recent** = last in map
- **LRU** = first key from `map.keys().next().value`
- On `get`: delete + set to bump to end

## Complexity

O(1) average per op (Map hash).

## Verbal follow-up

Production: doubly-linked list + hash map in languages without ordered map.

## Meta frequency

LRU is a staple design round + occasional coding screen variant.
