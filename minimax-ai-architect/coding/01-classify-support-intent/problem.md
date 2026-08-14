# 01 — Classify Support Intent

## Context

A retailer POC: before calling MiniMax-M3, run a **cheap keyword classifier** on the ticket so FAQ can skip tools and thinking.

You’re on CoderPad. No ML library.

## Task

```javascript
function classifySupportIntent(message, intents) {
  // message: string
  // intents: { name: string, keywords: string[] }[]
  // return { intent: string, score: number }
}
```

**Rules:**

- Lowercase. Tokens = `[a-z0-9]+` runs in the message (`match`).
- A keyword scores **+1** if **every** token in that keyword appears in the message token set. `"track order"` needs both `track` and `order`.
- `score` = number of matching keywords for that intent.
- Pick the intent with the **highest score**.
- Tie (same positive score): **lexicographically smallest** `name`.
- If every intent scores 0 → `{ intent: "unknown", score: 0 }`.

## Example

```javascript
const intents = [
  { name: "track_order", keywords: ["track", "where is", "shipping"] },
  { name: "refund", keywords: ["refund", "money back"] },
];

classifySupportIntent("Where is my shipping?", intents);
// { intent: "track_order", score: 2 }  — "where is" + "shipping"
```

## What they’re testing

- `Set` of tokens, nested loops, tie-break
- Not: embeddings, LLM classify (verbal: that’s the production upgrade)

## Constraints

- `1 <= intents.length <= 50`
- Message up to 2_000 chars
- Keyword phrases: 1–4 tokens

## Follow-ups (verbal)

- Why not send every ticket to M3? Cost + latency on the 80% FAQ path.
- Production: replace this with M2.7-highspeed classify, keep rules as a fallback.
- Multi-label? Return all intents with score ≥ 1.
