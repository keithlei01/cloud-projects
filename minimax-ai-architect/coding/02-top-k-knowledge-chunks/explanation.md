# Explanation — Top-K Knowledge Chunks

## Approach

Build a `Set` of query tokens longer than 2 characters. Score each chunk by how many of those tokens `includes` in `title + text`. Drop zeros, sort score desc / id asc, `slice(0, k)`.

`includes` is the POC lie: it is O(tokens × text) and can match inside longer words. Interviewers want the **shape** (score → sort → top k), not BM25.

## Edge cases

| Case | Result |
|------|--------|
| All stopwords (`"is it"`) | empty query set → all scores 0 → `[]` |
| Tie score | smaller `id` first |
| `k` larger than hits | return however many scored > 0 |

For `"order"` against s1 (`order`) and s3 (`order`): both score 1, **s1** wins on id.

## Complexity

- **Time:** O(chunks × queryTokens × avgDocLen) — fine for 10k short FAQs
- **Space:** O(k + chunks) for the scored array (you can keep a heap in the follow-up)

## Architect talking points

- POC: this function. Production: embeddings + lexical hybrid, still return `{ id, score }` for eval.
- Prompt: list chunks as `[S1] ...` and “If no chunk supports the answer, say you don’t know.”
- Don’t dump the handbook into M3’s 1M window on every turn — retrieve, then **prompt-cache** the static policy prefix.
