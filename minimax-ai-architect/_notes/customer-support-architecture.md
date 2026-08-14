# Customer support on MiniMax — solution you can draw on a whiteboard

This is the default enterprise demo for the architect role. Memorize the boxes, the handoff rules, and the ROI napkin math.

## Target outcome

Deflect repetitive tickets (tracking, policy, simple refund eligibility) with grounded answers, keep humans on exceptions, stay inside latency and cost SLAs.

## Architecture

```
Channel (chat / email / voice)
        │
        ▼
  PII redact ──────────────────────────  never send cards/phones raw
        │
        ▼
  Intent + complexity (cheap hop)
        │
        ├─ FAQ / policy ──► retrieve top-k ──► M3 thinking OFF + cached system+KB
        │                                              │
        ├─ Order / account ──► M3 tools (lookup_order, refund_policy)
        │                                              │
        └─ Abuse / legal / VIP-angry / SLA red ──► human queue (no model)
                                                       │
                                                       ▼
                                              grounded reply + citations
                                                       │
                                              optional speech-2.8-turbo
```

Production add-ons the FDE wires after the POC:

- Prompt cache on the static system + policy prefix
- Idempotency key per `ticketId` so retries don’t double-refund
- Per-tenant rate limit
- Eval set (50 gold tickets) before go-live
- Audit log: prompt, retrieved chunk ids, tool args/results, final text, model, tokens

## POC scope (1–2 weeks, you + FDE)

**In**

- 1 channel (web chat)
- 3 intents: `track_order`, `refund_policy`, `unknown`
- 1 mock `lookup_order` tool + 10 FAQ chunks
- Handoff rules (confidence, VIP+angry, refund over cap)
- Cost dashboard: tokens, cache hit, deflection

**Out** (call these explicitly so the client doesn’t explode scope)

- Full CRM write-back
- Voice IVR
- Fine-tuning
- 20 tools / 12 languages on day one

## ROI napkin (say this out loud)

Assume 5,000 tickets/month, $4 human handle cost, 40% deflection, $0.004 model cost per deflected ticket (FAQ, cache on, thinking off).

```
monthly_save ≈ 5000 * 0.40 * (4 - 0.004)  ≈ $7,992
```

If deflection is only 15% and you put **every** ticket through M3 + thinking + no cache, the model bill can erase the save. That is why **03** and **07** exist.

Levers, in order:

1. Route FAQ off thinking / onto highspeed
2. Prompt-cache the system + KB prefix (~80% off cached input on M3)
3. Retrieve top-k instead of stuffing the whole handbook
4. Cap tool hops (e.g. 4) and escalate
5. Priority tier only for VIP / SLA-red, not for FAQ

## Bottlenecks you will be asked to “resolve”

| Symptom | Likely cause | Move |
|---------|--------------|------|
| Slow FAQ | M2 thinking always on, or M3 adaptive on trivia | M3 + `thinking.disabled` |
| Expensive | Full history + full KB every turn | cache prefix + trim window + top-k |
| Hallucinated policy | No retrieval / no “answer only from sources” | force citations, refuse if score 0 |
| Double refund | Retry without idempotency | key = `ticketId+action` |
| Angry VIP still in bot | No handoff policy | coding **06** |
| Tool loop never ends | No hop cap / tool error not fed back | max hops + `unknown_tool` result |

## Feedback loop (JD: product roadmap)

Bring back to MiniMax product, not just the client:

- Need server-side RAG? Say so.
- Need guaranteed thinking-off on a cheaper small model? Say so.
- Clone quality on IVR? Speech team.
- 1M context is unused if the client’s legal team forbids sending PII — that’s a product + compliance story.

## Competitive line (keep it factual)

- **Price/speed** on agentic M3 vs typical US frontier APIs — confirm current [paygo](https://platform.minimax.io/docs/guides/pricing-paygo) in the room.
- **Drop-in** OpenAI/Anthropic APIs so the POC is days, not a platform rewrite.
- **Voice + video in the same vendor** if the client wants IVR or training clips later.
- Honesty: you still bring **their** vector DB, CRM, and auth. MiniMax is the model + speech + agent brain, not the whole contact-center suite.
