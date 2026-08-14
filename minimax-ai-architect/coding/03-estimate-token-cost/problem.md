# 03 — Estimate Token Cost

## Context

Client asks: “What does this support bot cost vs a $4 human ticket?” You estimate **one MiniMax request** from usage + list prices. Use **integer math**, then convert to USD.

MiniMax-M3 standard (≤512k input, confirm live [paygo](https://platform.minimax.io/docs/guides/pricing-paygo) before a real quote):

| Meter | USD / 1M tokens |
|-------|-----------------|
| Input | 0.30 |
| Cache read | 0.06 |
| Output | 1.20 |

## Task

```javascript
function estimateRequestCostUsd(usage, pricing) {
  // usage: { inputTokens, cachedInputTokens, outputTokens }
  // pricing: { inputPerMillion, cacheReadPerMillion, outputPerMillion }
  // return number — USD rounded to 6 decimal places
}
```

**Rules:**

- Uncached input tokens = `inputTokens - cachedInputTokens` (cached is a **subset** of input).
- Cost = uncached × input price + cached × cache-read price + output × output price, each price being **per 1M tokens**.
- Assume `0 <= cachedInputTokens <= inputTokens`.
- Round **half up** to 6 decimal places: `Math.round(usd * 1e6) / 1e6`.

Also implement a monthly helper used in ROI talks:

```javascript
function estimateMonthlyUsd(ticketsPerDay, usage, pricing) {
  // 30 days; same usage every ticket
  // return USD rounded to 2 decimal places (cents)
}
```

## Example

```javascript
const m3 = { inputPerMillion: 0.3, cacheReadPerMillion: 0.06, outputPerMillion: 1.2 };

estimateRequestCostUsd(
  { inputTokens: 5000, cachedInputTokens: 4000, outputTokens: 400 },
  m3
);
// uncached = 1000
// (1000*0.3 + 4000*0.06 + 400*1.2) / 1e6 = 0.00102
```

## What they’re testing

- Don’t use floats as money in the loop — multiply tokens × price, divide by 1e6 once
- Cache is the ROI lever (here 4000 tokens at $0.06 not $0.30)

## Constraints

- Token counts fit in JS safe integers (`<= 1e12`)
- Prices are finite numbers ≥ 0

## Follow-ups (verbal)

- >512k input row is 2× on M3 — branch on `inputTokens`
- Priority tier = 1.5×
- Monthly save ≈ `tickets * deflectionRate * (humanUsd - modelUsd)`
