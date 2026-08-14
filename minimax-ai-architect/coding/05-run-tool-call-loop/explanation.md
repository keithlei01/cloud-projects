# Explanation — Run One Tool-Call Loop

## Approach

Empty `tool_calls` → conversation is done; return the assistant text. Otherwise parse each `arguments` string, dispatch, stringify the result as a `role: "tool"` message. Parse errors and unknown names become structured `{ error }` objects so the **model** can recover on the next turn — don’t throw.

JSON key order in `JSON.stringify` follows insertion order, so `{ orderId, status }` matches the test.

## Edge cases

| Case | Result |
|------|--------|
| `content` missing on final turn | `""` |
| Two calls | two tool messages, same order |
| Invalid JSON | do not call the tool |

## Complexity

- **Time:** O(calls) plus tool work
- **Space:** O(calls)

## Architect talking points

- This **is** the MiniMax agent POC. Frameworks wrap the same loop.
- Always append the original assistant message (including thinking / `tool_calls`) **before** these tool messages — MiniMax docs require the full chain.
- Cap hops. A refund tool needs an idempotency key. Log `name`, args, result for the eval set.
