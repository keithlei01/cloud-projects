# Customer-support POC (composed)

Runnable story for a client workshop or an interview whiteboard. **No API key** — MiniMax calls are mocked, but request bodies match the OpenAI-compatible + T2A shapes.

```bash
node demos/customer-support-poc/run.js
```

Pipeline (same functions as `coding/`):

1. `redactPii`
2. `classifySupportIntent`
3. `routeModel`
4. FAQ → `retrieveTopK` + M3 thinking off
5. Order → mock M3 `tool_calls` → `runToolCallLoop`
6. `decideHandoff`
7. `estimateRequestCostUsd`
8. Print a `speech-2.8-turbo` T2A body for the voice channel

Swap the mock `minimaxChat` for a real `OpenAI` client (`baseURL: "https://api.minimax.io/v1"`) when you have a key. Keep the rest.
