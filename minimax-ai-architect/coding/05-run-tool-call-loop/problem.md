# 05 — Run One Tool-Call Loop

## Context

MiniMax-M3 agent turn (OpenAI-compatible `tool_calls`). The model returned either a final answer or one or more function calls. You execute tools and build the **next** `messages` to send back. This is Mini-Agent’s Action → Feedback step, without an HTTP client.

## Task

```javascript
function runToolCallLoop(assistantMessage, toolFns) {
  // assistantMessage: { content, tool_calls? }
  // tool_calls?: { id, function: { name, arguments } }[]
  // toolFns: { [name]: (argsObject) => any }
}
```

**If `tool_calls` is missing or empty:**

```javascript
{ done: true, content: assistantMessage.content || "", messages: [] }
```

**Else** for each call in order:

- `JSON.parse(arguments)` (arguments is a **string**).
- If parse fails → result `{ error: "invalid_arguments" }`.
- Else if `toolFns[name]` is missing → `{ error: "unknown_tool" }`.
- Else `result = toolFns[name](args)` (assume it does not throw).
- Push:

```javascript
{ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) }
```

Return `{ done: false, content: null, messages }`.

Do **not** call the model again — one hop only.

## Example

```javascript
runToolCallLoop(
  {
    content: null,
    tool_calls: [
      { id: "call_1", function: { name: "lookup_order", arguments: "{\"orderId\":\"ORD-9\"}" } },
    ],
  },
  { lookup_order: ({ orderId }) => ({ orderId, status: "shipped" }) }
);
// {
//   done: false,
//   content: null,
//   messages: [{ role: "tool", tool_call_id: "call_1", content: "{\"orderId\":\"ORD-9\",\"status\":\"shipped\"}" }],
// }
```

## What they’re testing

- Guard on empty `tool_calls`
- `JSON.parse` + dispatch map
- Stable tool-result shape the next MiniMax call expects

## Constraints

- ≤ 8 tool calls per turn
- `arguments` is always a string (maybe invalid JSON)

## Follow-ups (verbal)

- Production loop: append **full** assistant message (thinking + tool_calls) then these tool messages; cap hops at 4; escalate on repeated `unknown_tool`.
- M3: pass thinking blocks through or you break interleaved thinking.
- Idempotency on tools that write (refund).
