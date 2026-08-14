# Explanation — Redact PII in Transcripts

## Approach

Four replacements **in order**. Email first so `@` addresses are not chewed by digit regexes. Card next (16 digits) before phone so a card is not half-eaten as a phone. CN 11-digit mobiles before 3-3-4 US numbers.

`ORD-1007` is letters + hyphen + short digits — none of the patterns match.

## Edge cases

| Case | Result |
|------|--------|
| Two emails | both `[EMAIL]` |
| Card with spaces or dashes | `[CARD]` |
| No PII | identity |

`\b` on the card pattern: `4111111111111111` is one word of digits. `ORD-1007` has a letter prefix so it does not match the 16-digit pattern.

## Complexity

- **Time / space:** O(n)

## Architect talking points

- This is a **gate** in front of MiniMax, not a model feature. Same gate for logs and eval dumps.
- Production: dedicated PII library + allow-list (order id, ticket id). Regex is the interview / POC version.
- MiniMax’s 1M context does not make PII safer — smaller prompts are easier to audit.
