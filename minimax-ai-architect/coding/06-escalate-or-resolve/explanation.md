# Explanation — Escalate or Resolve

## Approach

Four independent `if`s in a fixed order. Collect reasons, then one `action`. `amountCents > max` is strict — equality auto-resolves (test: 5000 at cap).

Angry **without** VIP does not escalate on that rule alone (product choice: don’t dump every frustrated user; VIP is the commercial exception). Say that out loud so they know it’s a policy, not an accident.

## Edge cases

| Case | Result |
|------|--------|
| confidence exactly `minConfidence` | not `low_confidence` |
| refund amount equal to cap | resolve (if nothing else fires) |
| multiple rules | all reasons, still one escalate |

## Complexity

- **Time / space:** O(1)

## Architect talking points

- Handoff is **deterministic**. The model can *propose* `intent` / `confidence`; this function is the gate.
- False resolve (bot refunds wrongly) is more expensive than false escalate — start with conservative caps, loosen from the eval set.
- FDE wires `vip` and `slaMinutesLeft` from the client’s CRM; you don’t fake them in the demo.
