/**
 * Implement runToolCallLoop — see problem.md
 * Run: node attempt.js
 */
function runToolCallLoop(assistantMessage, toolFns) {
  // TODO
}

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(label + " =>", ok ? "OK" : "FAIL");
  if (!ok) {
    console.log("  actual  ", JSON.stringify(actual));
    console.log("  expected", JSON.stringify(expected));
  }
}

check(
  "final answer",
  runToolCallLoop({ content: "Ships in 2 days." }, { lookup_order: () => ({}) }),
  { done: true, content: "Ships in 2 days.", messages: [] }
);

check(
  "one tool",
  runToolCallLoop(
    {
      content: null,
      tool_calls: [
        { id: "call_1", function: { name: "lookup_order", arguments: "{\"orderId\":\"ORD-9\"}" } },
      ],
    },
    { lookup_order: ({ orderId }) => ({ orderId, status: "shipped" }) }
  ),
  {
    done: false,
    content: null,
    messages: [
      { role: "tool", tool_call_id: "call_1", content: "{\"orderId\":\"ORD-9\",\"status\":\"shipped\"}" },
    ],
  }
);

check(
  "bad json + unknown",
  runToolCallLoop(
    {
      content: null,
      tool_calls: [
        { id: "a", function: { name: "lookup_order", arguments: "not-json" } },
        { id: "b", function: { name: "delete_all", arguments: "{}" } },
      ],
    },
    { lookup_order: () => ({ ok: true }) }
  ),
  {
    done: false,
    content: null,
    messages: [
      { role: "tool", tool_call_id: "a", content: "{\"error\":\"invalid_arguments\"}" },
      { role: "tool", tool_call_id: "b", content: "{\"error\":\"unknown_tool\"}" },
    ],
  }
);

module.exports = { runToolCallLoop };
