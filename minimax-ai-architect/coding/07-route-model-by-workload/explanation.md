# Explanation — Route Model by Workload

## Approach

One ordered policy. **Heavy** work (tools, image, agent, >200k tokens) always gets M3 + thinking. FAQ that is not heavy gets M3 with thinking **disabled** — cheaper/faster than M2, where thinking cannot be turned off. Remaining low-SLA traffic uses highspeed. Default M2.7.

Rule 1 includes `complexity === "agent"` so you don’t depend on `needsTools` being set correctly by the caller.

## Edge cases

| Case | Result |
|------|--------|
| FAQ + image | M3 adaptive (image is heavy) |
| FAQ + 400ms SLA | M3 thinking off (FAQ before latency rule) |
| `latencyMsSla === 1000` | not highspeed (`< 1000`) |
| `inputTokens === 200_000` | not heavy (`>` not `>=`) |

## Architect talking points

- This function is the **commercial** design: most tickets should never pay for thinking or tools.
- Wire it to logs: `% M3 adaptive` vs `% thinking off` vs `% highspeed` is the first cost dashboard.
- Confirm model ids and thinking behavior on [MiniMax OpenAI API](https://platform.minimax.io/docs/api-reference/text-openai-api) before the client demo — names move.
