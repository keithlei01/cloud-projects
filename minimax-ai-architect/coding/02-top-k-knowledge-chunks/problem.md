# 02 — Top-K Knowledge Chunks

## Context (LeetCode #347 family — RAG framing)

Customer-support RAG: given a query and FAQ chunks, return the **top k** chunks by **query-term overlap**. Enough for a live POC before a vector DB exists.

## Task

```javascript
function retrieveTopK(query, chunks, k) {
  // chunks: { id: string, title: string, text: string }[]
  // return { id, title, score }[]  length ≤ k
}
```

**Scoring:**

- Query tokens = `[a-z0-9]+`, lowercase, **drop tokens with length ≤ 2** (`a`, `to`, `is`, …).
- Unique query tokens (a `Set`).
- Chunk document = `title + " " + text`, lowercase.
- `score` = how many unique query tokens appear as a **substring** of the document (simple POC: `document.includes(token)`).
- Drop chunks with `score === 0`.
- Sort: `score` descending, then `id` ascending.
- Return at most `k` items.

## Example

```javascript
retrieveTopK("where is my order shipping", [
  { id: "s2", title: "Refunds", text: "Refunds take 5 days." },
  { id: "s1", title: "Shipping", text: "Track your order in the app." },
], 2);
// [
//   { id: "s1", title: "Shipping", score: 2 },  // order, shipping
//   { id: "s2", title: "Refunds", score: 0 }     // dropped
// ]
// → [{ id: "s1", title: "Shipping", score: 2 }]
```

## What they’re testing

- Token `Set`, score, `sort`, `slice(0, k)` — same muscle as top-k errors
- Not: embeddings, BM25 (verbal follow-up)

## Constraints

- `1 <= k <= chunks.length <= 10_000`
- Chunk text short enough for CoderPad (a few hundred chars)

## Follow-ups (verbal)

- Word-boundary match vs `includes` (false positive: `order` in `border`)?
- Vector search in production; this stays as a lexical hybrid / test fixture.
- Always pass **chunk ids** into the prompt and require citations.
