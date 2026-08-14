# Explanation — Estimate Token Cost

## Approach

Uncached tokens pay the input list price; cached tokens pay the cache-read price; output pays output.

```
usd = (uncached * in + cached * cache + output * out) / 1_000_000
```

Round to 6 decimals with `Math.round(usd * 1e6) / 1e6`. Monthly: `round(perTicket * ticketsPerDay * 30, 2)`.

## Numbers in the example

`1000*0.3 + 4000*0.06 + 400*1.2 = 300 + 240 + 480 = 1020` then `/ 1e6 = 0.00102`.

Same usage × 100 tickets × 30 days = 3.06.

## Edge cases

| Case | Result |
|------|--------|
| Zero tokens | 0 |
| Full cache vs no cache | 0.06 vs 0.30 per 1M input — **5×** on that meter |
| Don’t add cached on top of input | cached is **inside** inputTokens |

## Architect talking points

- Cache the **system prompt + policy prefix** so every FAQ turn is mostly cache-read.
- Compare to human: if model is $0.001 and human is $4, deflection is the whole story — unless you skip cache and leave thinking on.
- Quote **current** MiniMax paygo in the room; these numbers are a snapshot for the exercise.
