# Explanation — Classify Support Intent

## Approach

1. Tokenize the message once into a `Set` (`/[a-z0-9]+/g`).
2. For each intent, count keywords whose **all** parts sit in that set.
3. Keep the max score; on a tie pick the smaller `name`. Stay on `unknown` if max is 0.

Phrase keywords (`"where is"`) are just multiple tokens that must **all** hit — no substring search on the raw string (avoids `"refund"` matching `"unrefundable"` if you tokenize properly; `"unrefundable"` is one token and will **not** match `refund`).

## Edge cases

| Case | Result |
|------|--------|
| Empty message | `unknown` |
| Keyword with extra words not in message | no point |
| Two intents score 1 | smaller name |
| `"Where is"` vs tokens `where`, `is` | matches |

## Complexity

- **Time:** O(message + intents × keywords × parts) — tiny in a POC
- **Space:** O(tokens)

## Architect talking points

- This is the **router**, not the brain. Production: MiniMax-M2.7-highspeed or M3 with `thinking.disabled` for classify; keep keywords as a cold-start / offline fallback.
- Never block a ticket here — `unknown` still goes to retrieval or a human rule, not a silent drop.
