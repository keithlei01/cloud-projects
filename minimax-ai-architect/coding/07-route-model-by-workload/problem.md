# 07 — Route Model by Workload

## Context

MiniMax stack on a support desk: **M3** for agents / long context / images; **M2.7-highspeed** when the SLA is tight; **M3 + thinking off** for FAQ (M2.x cannot disable thinking).

## Task

```javascript
function routeModel(workload) {
  // workload: {
  //   needsTools: boolean,
  //   hasImage: boolean,
  //   inputTokens: number,
  //   complexity: "faq" | "agent" | "long_doc",
  //   latencyMsSla: number | null
  // }
  // return { model: string, thinking: { type: "adaptive" | "disabled" } | null }
}
```

Apply **first matching** rule:

1. `needsTools` OR `hasImage` OR `complexity === "agent"` OR `inputTokens > 200_000`  
   → `{ model: "MiniMax-M3", thinking: { type: "adaptive" } }`
2. `complexity === "faq"`  
   → `{ model: "MiniMax-M3", thinking: { type: "disabled" } }`
3. `latencyMsSla !== null` AND `latencyMsSla < 1000`  
   → `{ model: "MiniMax-M2.7-highspeed", thinking: null }`  
   (`null` = don’t send a thinking knob; M2.x ignores disable anyway)
4. Else  
   → `{ model: "MiniMax-M2.7", thinking: null }`

## Example

```javascript
routeModel({ needsTools: true, hasImage: false, inputTokens: 800, complexity: "agent", latencyMsSla: 400 });
// { model: "MiniMax-M3", thinking: { type: "adaptive" } }  // rule 1 beats latency
```

## What they’re testing

- Ordered policy, not a pile of unrelated ifs
- Knowing thinking-off is an **M3** feature

## Constraints

- `inputTokens >= 0`
- `complexity` is one of the three strings above

## Follow-ups (verbal)

- `service_tier: "priority"` only for VIP / SLA-red on M3, not FAQ.
- Log `model` + `thinking` per ticket for the cost dashboard.
- If FAQ quality drops with thinking off, A/B on the gold set — don’t guess in the client meeting.
