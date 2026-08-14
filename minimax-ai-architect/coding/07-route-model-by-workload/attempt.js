/**
 * Implement routeModel — see problem.md
 * Run: node attempt.js
 */
function routeModel(workload) {
  // TODO
}

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(label + " =>", actual, ok ? "OK" : "expected " + JSON.stringify(expected));
}

check(
  "agent beats latency",
  routeModel({ needsTools: true, hasImage: false, inputTokens: 800, complexity: "agent", latencyMsSla: 400 }),
  { model: "MiniMax-M3", thinking: { type: "adaptive" } }
);

check(
  "faq thinking off",
  routeModel({ needsTools: false, hasImage: false, inputTokens: 1200, complexity: "faq", latencyMsSla: 400 }),
  { model: "MiniMax-M3", thinking: { type: "disabled" } }
);

check(
  "image",
  routeModel({ needsTools: false, hasImage: true, inputTokens: 2000, complexity: "faq", latencyMsSla: null }),
  { model: "MiniMax-M3", thinking: { type: "adaptive" } }
);

check(
  "long context",
  routeModel({ needsTools: false, hasImage: false, inputTokens: 250_000, complexity: "long_doc", latencyMsSla: null }),
  { model: "MiniMax-M3", thinking: { type: "adaptive" } }
);

check(
  "highspeed sla",
  routeModel({ needsTools: false, hasImage: false, inputTokens: 900, complexity: "long_doc", latencyMsSla: 800 }),
  { model: "MiniMax-M2.7-highspeed", thinking: null }
);

check(
  "default",
  routeModel({ needsTools: false, hasImage: false, inputTokens: 900, complexity: "long_doc", latencyMsSla: null }),
  { model: "MiniMax-M2.7", thinking: null }
);

module.exports = { routeModel };
