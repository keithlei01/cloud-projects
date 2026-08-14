# 06 — Escalate or Resolve

## Context

The bot has an intent, a confidence, and ticket metadata. Decide **resolve** vs **escalate to human**. This is the policy layer MiniMax should not improvise.

## Task

```javascript
function decideHandoff(ticket, policy) {
  // ticket: { intent, confidence, sentiment, vip, slaMinutesLeft, amountCents }
  // policy: { minConfidence, minSlaMinutes, maxAutoRefundCents }
  // return { action: "resolve" | "escalate", reasons: string[] }
}
```

Collect **all** matching reasons (do not stop at the first), in this order:

1. `confidence < minConfidence` → `"low_confidence"`
2. `sentiment === "angry"` **and** `vip === true` → `"angry_vip"`
3. `slaMinutesLeft < minSlaMinutes` → `"sla_risk"`
4. `intent === "refund"` **and** `amountCents > maxAutoRefundCents` → `"refund_over_limit"`

If `reasons.length > 0` → `{ action: "escalate", reasons }`, else `{ action: "resolve", reasons: [] }`.

## Example

```javascript
decideHandoff(
  { intent: "refund", confidence: 0.91, sentiment: "angry", vip: true, slaMinutesLeft: 40, amountCents: 8000 },
  { minConfidence: 0.6, minSlaMinutes: 15, maxAutoRefundCents: 5000 }
);
// { action: "escalate", reasons: ["angry_vip", "refund_over_limit"] }
```

## What they’re testing

- Ordered rule table, accumulate reasons (ops wants **why**)
- `amountCents` integers — no floats for money

## Constraints

- `0 <= confidence <= 1`
- `amountCents >= 0`

## Follow-ups (verbal)

- Show the reasons to the human agent as a whisper.
- Don’t let the LLM override this function.
- Tune thresholds from the eval set (false escalate vs false resolve).
