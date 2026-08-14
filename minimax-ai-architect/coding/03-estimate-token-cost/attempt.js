/**
 * Implement estimateRequestCostUsd + estimateMonthlyUsd — see problem.md
 * Run: node attempt.js
 */
function estimateRequestCostUsd(usage, pricing) {
  // TODO
}

function estimateMonthlyUsd(ticketsPerDay, usage, pricing) {
  // TODO
}

function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(label + " =>", actual, ok ? "OK" : "expected " + expected);
}

const m3 = { inputPerMillion: 0.3, cacheReadPerMillion: 0.06, outputPerMillion: 1.2 };

check(
  "example",
  estimateRequestCostUsd({ inputTokens: 5000, cachedInputTokens: 4000, outputTokens: 400 }, m3),
  0.00102
);

check(
  "no cache",
  estimateRequestCostUsd({ inputTokens: 1_000_000, cachedInputTokens: 0, outputTokens: 0 }, m3),
  0.3
);

check(
  "all cached input",
  estimateRequestCostUsd({ inputTokens: 1_000_000, cachedInputTokens: 1_000_000, outputTokens: 0 }, m3),
  0.06
);

check(
  "monthly 100 tickets/day",
  estimateMonthlyUsd(100, { inputTokens: 5000, cachedInputTokens: 4000, outputTokens: 400 }, m3),
  3.06
);

module.exports = { estimateRequestCostUsd, estimateMonthlyUsd };
