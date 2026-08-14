# 04 — Redact PII in Transcripts

## Context

Support tickets go to MiniMax. Cards, emails, and phones must not. Redact **before** the API call. CoderPad: regex + replace order.

## Task

```javascript
function redactPii(text) {
  // return string with placeholders
}
```

Replace, in this **order**:

1. Email → `[EMAIL]`  
   Pattern: `local@domain` where local is `[A-Za-z0-9._%+-]+`, domain is `[A-Za-z0-9.-]+\.[A-Za-z]{2,}`
2. 16-digit card with optional ` ` or `-` every 4 digits → `[CARD]`  
   Example: `4111-1111-1111-1111`, `4111111111111111`
3. CN mobile: `1` then `3-9` then 9 more digits → `[PHONE]`
4. US-style: `AAA-BBB-CCCC` or `AAA BBB CCCC` or `AAA.BBB.CCCC` (3-3-4 digits) → `[PHONE]`

Do **not** redact order ids like `ORD-1007`.

## Example

```javascript
redactPii("Email me at a.b@shop.com card 4111-1111-1111-1111 phone 13812345678 or 555-010-9999 ORD-1007");
// "Email me at [EMAIL] card [CARD] phone [PHONE] or [PHONE] ORD-1007"
```

## What they’re testing

- Replace order (email before numbers so you don’t mangle addresses)
- Word-ish boundaries so `ORD-1007` survives
- Not: full PCI / named-entity models (verbal: production uses a dedicated PII service)

## Constraints

- Text up to 20_000 chars
- Multiple matches; replace all

## Follow-ups (verbal)

- Keep last-4 of the card for the agent tool `lookup_order`?
- Voice: redact **after** STT, before LLM; don’t log raw audio transcripts.
- China + US phone in one POC — clients will have more formats; keep the function data-driven.
